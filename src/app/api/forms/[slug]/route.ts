import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SharingSettings } from '@/types/form';
import { isPasswordTokenValid } from '@/lib/server-utils';

export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const isEmbedRequest = searchParams.get('embed') === 'true';
        const token = searchParams.get('token');

        // Read password verification token from header (not query param to prevent bypass)
        const passwordToken = request.headers.get('X-Password-Token');

        const form = await prisma.form.findUnique({
            where: { slug: params.slug },
            select: {
                id: true,
                title: true,
                description: true,
                schema: true,
                settings: true,
            }
        });

        if (!form) {
            return NextResponse.json(
                { error: 'Form not found' },
                { status: 404 }
            );
        }

        // Get sharing settings
        const sharingSettings = (form.settings as any)?.sharing as SharingSettings | undefined;
        const accessLevel = sharingSettings?.accessLevel || 'public';

        // Access Control Logic

        // 1. Check if form is private
        if (accessLevel === 'private') {
            return NextResponse.json(
                { error: 'This form is private and cannot be accessed' },
                { status: 403 }
            );
        }

        // 2. Check link-only access (requires valid token)
        if (accessLevel === 'link-only') {
            if (!token || token !== sharingSettings?.shareToken) {
                return NextResponse.json(
                    { error: 'Invalid or missing access token' },
                    { status: 403 }
                );
            }
        }

        // 3. Check password-protected access via server-side token validation
        if (accessLevel === 'password-protected') {
            if (!passwordToken || !isPasswordTokenValid(passwordToken)) {
                return NextResponse.json(
                    {
                        error: 'Password required',
                        requiresPassword: true,
                    },
                    { status: 403 }
                );
            }
        }

        // Embedding-specific checks
        if (isEmbedRequest) {
            // Check if embedding is allowed
            if (!sharingSettings?.allowEmbedding) {
                return NextResponse.json(
                    { error: 'Embedding is disabled for this form' },
                    { status: 403 }
                );
            }

            // Check domain whitelist
            const allowedDomains = sharingSettings?.embedSettings?.allowedDomains || [];
            if (allowedDomains.length > 0) {
                const referer = request.headers.get('referer');

                if (referer) {
                    const refererDomain = new URL(referer).hostname;
                    const isAllowed = allowedDomains.some(domain =>
                        refererDomain === domain || refererDomain.endsWith(`.${domain}`)
                    );

                    if (!isAllowed) {
                        return NextResponse.json(
                            { error: 'Embedding from this domain is not allowed' },
                            { status: 403 }
                        );
                    }
                }
            }
        }

        // Transform to FormSchema format expected by FormRenderer
        const formSchema = {
            id: form.id,
            title: form.title,
            questions: form.schema as any[], // Prisma returns Json type
            settings: form.settings as any,
        };

        const response = NextResponse.json(formSchema);

        // Add CORS headers for embed requests
        if (isEmbedRequest && sharingSettings?.allowEmbedding) {
            response.headers.set('Access-Control-Allow-Origin', '*'); // Or specific domain from allowedDomains
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        }

        return response;
    } catch (error) {
        console.error('Error fetching form:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
