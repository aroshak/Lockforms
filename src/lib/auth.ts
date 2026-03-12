import { AuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

/**
 * NextAuth configuration — Native Auth with Prisma.
 *
 * Replaces the old Zitadel OIDC provider with a local
 * CredentialsProvider backed by bcrypt password hashes
 * stored in PostgreSQL. Air-gap safe: zero external calls.
 */
export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Email & Password',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email.toLowerCase().trim() },
                    include: {
                        roles: { include: { role: true } },
                        organization: true,
                    },
                });

                if (!user || !user.isActive) {
                    return null;
                }

                // Check account lockout
                if (user.lockedUntil && user.lockedUntil > new Date()) {
                    throw new Error('Account is temporarily locked. Try again later.');
                }

                // SSO-only users cannot log in with password
                if (user.isSSOUser || !user.passwordHash) {
                    return null;
                }

                const isValidPassword = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                );

                if (!isValidPassword) {
                    // Increment failed attempts
                    const failedAttempts = user.failedLoginAttempts + 1;
                    const lockout = failedAttempts >= 5
                        ? new Date(Date.now() + 30 * 60 * 1000) // 30 min lockout
                        : null;

                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedLoginAttempts: failedAttempts,
                            lastFailedLoginAt: new Date(),
                            lockedUntil: lockout,
                        },
                    });

                    if (lockout) {
                        throw new Error('Too many failed attempts. Account locked for 30 minutes.');
                    }

                    return null;
                }

                // Successful login — reset failed attempts, update last login
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        failedLoginAttempts: 0,
                        lastFailedLoginAt: null,
                        lockedUntil: null,
                        lastLoginAt: new Date(),
                    },
                });

                // Return user object for JWT (matches extended User type in next-auth.d.ts)
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
                    image: user.image ?? null,
                    organizationId: user.organizationId ?? '',
                    organizationName: user.organization?.name ?? '',
                    roles: user.roles.map(ur => ur.role.name),
                };
            },
        }),
        // Future: BoxyHQ SAML provider goes here
        // Future: LDAP provider goes here
    ],
    session: {
        // Must use JWT for CredentialsProvider (DB sessions not supported)
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
        async jwt({ token, user }) {
            // On initial sign-in, persist custom fields into the JWT
            if (user) {
                token.id = user.id;
                token.organizationId = user.organizationId;
                token.organizationName = user.organizationName;
                token.roles = user.roles;
            }
            return token;
        },
        async session({ session, token }) {
            // Pass custom JWT fields to the client-side session
            session.user.id = token.id ?? token.sub ?? '';
            session.user.organizationId = token.organizationId ?? '';
            session.user.organizationName = token.organizationName ?? '';
            session.user.roles = token.roles ?? [];
            return session;
        },
    },
    pages: {
        signIn: '/admin/login',
        error: '/admin/login',
    },
    debug: process.env.NODE_ENV === 'development',
};

/**
 * Helper to get the current server-side session.
 * Use in Server Components and API routes.
 */
export async function getSession() {
    return await getServerSession(authOptions);
}

/**
 * Helper to get the organizationId from the current session.
 * Returns null if not authenticated.
 */
export async function getOrganizationId(): Promise<string | null> {
    const session = await getSession();
    return session?.user?.organizationId ?? null;
}
