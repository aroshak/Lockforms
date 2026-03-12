import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from '@/lib/db';
import { SharingSettings } from '@/types/form';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // --- NextAuth API routes: never block ---
    if (path.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // --- Protect Admin Routes ---
    if (path.startsWith('/admin')) {
        // Skip the login page itself
        if (path === '/admin/login') {
            const token = await getToken({
                req: request,
                secret: process.env.NEXTAUTH_SECRET,
            });
            if (token) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            return NextResponse.next();
        }

        // Check auth via NextAuth JWT for all other admin routes
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token) {
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('callbackUrl', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    // --- Form Embedding Security ---
    if (path.startsWith('/f/')) {
        const isEmbedRequest = request.nextUrl.searchParams.get('embed') === 'true';

        if (isEmbedRequest) {
            const slug = path.split('/f/')[1];

            if (slug) {
                try {
                    const form = await prisma.form.findUnique({
                        where: { slug },
                        select: { settings: true }
                    });

                    const sharingSettings = (form?.settings as Record<string, unknown>)?.sharing as SharingSettings | undefined;
                    const response = NextResponse.next();

                    if (sharingSettings?.allowEmbedding) {
                        response.headers.delete('X-Frame-Options');

                        const allowedDomains = sharingSettings.embedSettings?.allowedDomains || [];
                        const frameAncestors = allowedDomains.length > 0
                            ? allowedDomains.map(d => `https://${d} http://${d}`).join(' ')
                            : '*';

                        response.headers.set(
                            'Content-Security-Policy',
                            `frame-ancestors ${frameAncestors};`
                        );

                        response.headers.set('Access-Control-Allow-Origin', '*');
                        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
                    } else {
                        response.headers.set('X-Frame-Options', 'DENY');
                    }

                    return response;
                } catch (error) {
                    console.error('Middleware error:', error);
                    const response = NextResponse.next();
                    response.headers.set('X-Frame-Options', 'DENY');
                    return response;
                }
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/f/:path*', '/api/auth/:path*'],
};
