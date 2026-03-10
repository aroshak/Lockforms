import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateShareToken } from '@/lib/utils';
import { hashPassword } from '@/lib/server-utils';
import { SharingSettings, AccessLevel, EmbedSettings } from '@/types/form';

/**
 * POST /api/forms/[slug]/share
 * Generate or update sharing settings for a form
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        // TODO: Add authentication check (admin only)
        // const session = await verifyAdminSession(request);
        // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const {
            accessLevel,
            allowEmbedding,
            password,
            embedSettings
        }: {
            accessLevel: AccessLevel;
            allowEmbedding: boolean;
            password?: string;
            embedSettings?: EmbedSettings;
        } = body;

        // Validate required fields
        if (!accessLevel) {
            return NextResponse.json(
                { success: false, error: 'Access level is required' },
                { status: 400 }
            );
        }

        // Find form
        const form = await prisma.form.findUnique({
            where: { slug: params.slug },
            select: { id: true, settings: true }
        });

        if (!form) {
            return NextResponse.json(
                { success: false, error: 'Form not found' },
                { status: 404 }
            );
        }

        // Generate share token for link-only access
        const shareToken = accessLevel === 'link-only' ? generateShareToken() : undefined;

        // Hash password if provided for password-protected access
        const hashedPassword = password && accessLevel === 'password-protected'
            ? await hashPassword(password)
            : undefined;

        // Build sharing settings
        const sharingSettings: SharingSettings = {
            accessLevel,
            allowEmbedding,
            shareToken,
            password: hashedPassword,
            embedSettings: embedSettings || {
                customHeight: 500,
                customWidth: 600,
                showBranding: true,
                transparentBackground: false,
                allowedDomains: []
            },
            generatedAt: new Date().toISOString(),
        };

        // Update form settings
        const currentSettings = (form.settings as any) || {};
        const updatedSettings = {
            ...currentSettings,
            sharing: sharingSettings,
        };

        await prisma.form.update({
            where: { id: form.id },
            data: { settings: updatedSettings }
        });

        // Construct URLs
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
        const shareUrl = `${baseUrl}/f/${params.slug}${shareToken ? `?token=${shareToken}` : ''}`;
        const embedUrl = allowEmbedding
            ? `${baseUrl}/f/${params.slug}?embed=true${shareToken ? `&token=${shareToken}` : ''}`
            : undefined;

        return NextResponse.json({
            success: true,
            shareUrl,
            embedUrl,
            accessLevel,
            allowEmbedding,
        });
    } catch (error) {
        console.error('Error generating share link:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/forms/[slug]/share
 * Retrieve current sharing settings for a form
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
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

        // Construct URLs
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
        const shareUrl = `${baseUrl}/f/${params.slug}${sharingSettings?.shareToken ? `?token=${sharingSettings.shareToken}` : ''}`;
        const embedUrl = sharingSettings?.allowEmbedding
            ? `${baseUrl}/f/${params.slug}?embed=true${sharingSettings?.shareToken ? `&token=${sharingSettings.shareToken}` : ''}`
            : undefined;

        return NextResponse.json({
            success: true,
            sharingSettings: sharingSettings || null,
            shareUrl,
            embedUrl,
        });
    } catch (error) {
        console.error('Error fetching share info:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
