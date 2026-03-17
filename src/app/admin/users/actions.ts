'use server';

import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// ── Types ────────────────────────────────────────────────────────────────

interface CreateUserInput {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    roleId?: string;
}

interface UpdateUserInput {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
}

// ── Queries ──────────────────────────────────────────────────────────────

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                roles: { include: { role: true } },
                organization: true,
            },
        });
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

export async function getRoles() {
    try {
        return await prisma.role.findMany({
            orderBy: { name: 'asc' },
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
}

// ── Mutations ────────────────────────────────────────────────────────────

// ── Return type for createUser (full user record for optimistic UI updates) ──
export interface CreatedUserRecord {
    id: string;
    email: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    isSSOUser: boolean;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    organization: { name: string } | null;
    roles: Array<{
        id: string;
        roleId: string;
        role: { id: string; name: string; description: string | null };
    }>;
}

export async function createUser(
    input: CreateUserInput
): Promise<{ success: boolean; error?: string; user?: CreatedUserRecord }> {
    try {
        // Check for existing user
        const existing = await prisma.user.findUnique({
            where: { email: input.email.toLowerCase().trim() },
        });
        if (existing) {
            return { success: false, error: 'A user with this email already exists.' };
        }

        // Hash password (bcrypt cost 12)
        const passwordHash = await bcrypt.hash(input.password, 12);

        const created = await prisma.user.create({
            data: {
                email: input.email.toLowerCase().trim(),
                firstName: input.firstName.trim(),
                lastName: input.lastName.trim(),
                name: `${input.firstName.trim()} ${input.lastName.trim()}`,
                passwordHash,
                isActive: true,
            },
        });

        // Assign role if provided
        if (input.roleId) {
            await prisma.userRole.create({
                data: {
                    userId: created.id,
                    roleId: input.roleId,
                    assignedBy: 'admin:ui',
                },
            });
        }

        // Fetch full user record with roles for optimistic update on client
        const user = await prisma.user.findUnique({
            where: { id: created.id },
            include: {
                roles: { include: { role: true } },
                organization: true,
            },
        });

        // Revalidate only the server-side cache (does not trigger RSC chunk reload)
        revalidatePath('/admin/users');
        return { success: true, user: user ?? undefined };
    } catch (error) {
        console.error('Error creating user:', error);
        return { success: false, error: 'Failed to create user.' };
    }
}

export async function updateUser(input: UpdateUserInput): Promise<{ success: boolean; error?: string }> {
    try {
        // If email changed, check it's not taken
        if (input.email) {
            const existing = await prisma.user.findFirst({
                where: {
                    email: input.email.toLowerCase().trim(),
                    NOT: { id: input.id },
                },
            });
            if (existing) {
                return { success: false, error: 'A user with this email already exists.' };
            }
        }

        await prisma.user.update({
            where: { id: input.id },
            data: {
                ...(input.email && { email: input.email.toLowerCase().trim() }),
                ...(input.firstName && { firstName: input.firstName.trim() }),
                ...(input.lastName && { lastName: input.lastName.trim() }),
                ...(input.firstName && input.lastName && {
                    name: `${input.firstName.trim()} ${input.lastName.trim()}`,
                }),
            },
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Error updating user:', error);
        return { success: false, error: 'Failed to update user.' };
    }
}

export async function toggleUserActive(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { success: false, error: 'User not found.' };

        await prisma.user.update({
            where: { id: userId },
            data: { isActive: !user.isActive },
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Error toggling user:', error);
        return { success: false, error: 'Failed to update user status.' };
    }
}

export async function unlockAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastFailedLoginAt: null,
            },
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Error unlocking account:', error);
        return { success: false, error: 'Failed to unlock account.' };
    }
}

export async function resetPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (newPassword.length < 8) {
            return { success: false, error: 'Password must be at least 8 characters.' };
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastFailedLoginAt: null,
            },
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Error resetting password:', error);
        return { success: false, error: 'Failed to reset password.' };
    }
}

export async function assignRole(userId: string, roleId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if already assigned
        const existing = await prisma.userRole.findUnique({
            where: { userId_roleId: { userId, roleId } },
        });
        if (existing) {
            return { success: false, error: 'Role already assigned.' };
        }

        await prisma.userRole.create({
            data: {
                userId,
                roleId,
                assignedBy: 'admin:ui',
            },
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Error assigning role:', error);
        return { success: false, error: 'Failed to assign role.' };
    }
}

export async function removeRole(userId: string, roleId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.userRole.delete({
            where: { userId_roleId: { userId, roleId } },
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Error removing role:', error);
        return { success: false, error: 'Failed to remove role.' };
    }
}
