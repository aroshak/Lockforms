import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, generatePasswordToken } from '@/lib/server-utils';
import { SharingSettings } from '@/types/form';

/**
 * POST /api/forms/[slug]/verify-password
 * Verify password for password-protected forms
 * Returns a time-limited token on success
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const body = await request.json();
        const { password } = body;

        if (!password) {
            return NextResponse.json(
                { success: false, error: 'Password is required' },
                { status: 400 }
            );
        }

        // Find form and get sharing settings
        const form = await prisma.form.findUnique({
            where: { slug: params.slug },
            select: { settings: true }
        });

        if (!form) {
            return NextResponse.json(
                { success: false, error: 'Form not found' },
                { status: 404 }
            );
        }

        const sharingSettings = (form.settings as any)?.sharing as SharingSettings | undefined;

        // Check if form is password-protected
        if (sharingSettings?.accessLevel !== 'password-protected') {
            return NextResponse.json(
                { success: false, error: 'This form is not password-protected' },
                { status: 400 }
            );
        }

        // Verify password
        const storedHash = sharingSettings.password;
        if (!storedHash) {
            return NextResponse.json(
                { success: false, error: 'No password set for this form' },
                { status: 500 }
            );
        }

        const isValid = await verifyPassword(password, storedHash);

        if (!isValid) {
            return NextResponse.json(
                { success: false, error: 'Incorrect password' },
                { status: 401 }
            );
        }

        // Password is correct — generate a time-limited verification token
        const verificationToken = generatePasswordToken();

        return NextResponse.json({
            success: true,
            message: 'Password verified successfully',
            token: verificationToken
        });
    } catch (error) {
        console.error('Error verifying password:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

