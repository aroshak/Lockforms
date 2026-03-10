import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';
import prisma from '@/lib/db';
import { SharingSettings } from '@/types/form';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Protect Admin Routes
    if (path.startsWith('/admin')) {
        // Get the session cookie
        const cookie = request.cookies.get('admin_session')?.value;
        const session = cookie ? await decrypt(cookie) : null;

        // Skip login page itself
        if (path === '/admin/login') {
            // If already logged in (valid session), redirect to dashboard
            if (session) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            return NextResponse.next();
        }

        // Check auth for all other admin routes
        if (!session) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // Form Embedding Security
    if (path.startsWith('/f/')) {
        const isEmbedRequest = request.nextUrl.searchParams.get('embed') === 'true';

        if (isEmbedRequest) {
            // Extract slug from path (e.g., /f/my-form -> my-form)
            const slug = path.split('/f/')[1];

            if (slug) {
                try {
                    // Fetch form sharing settings
                    // TODO: Consider caching this to avoid DB calls on every request
                    const form = await prisma.form.findUnique({
                        where: { slug },
                        select: { settings: true }
                    });

                    const sharingSettings = (form?.settings as any)?.sharing as SharingSettings | undefined;

                    // Create response
                    const response = NextResponse.next();

                    if (sharingSettings?.allowEmbedding) {
                        // Allow embedding - remove X-Frame-Options or set to allow
                        response.headers.delete('X-Frame-Options');

                        // Set CSP for embedding
                        const allowedDomains = sharingSettings.embedSettings?.allowedDomains || [];
                        const frameAncestors = allowedDomains.length > 0
                            ? allowedDomains.map(d => `https://${d} http://${d}`).join(' ')
                            : '*';

                        response.headers.set(
                            'Content-Security-Policy',
                            `frame-ancestors ${frameAncestors};`
                        );

                        // CORS headers for embed requests
                        response.headers.set('Access-Control-Allow-Origin', '*');
                        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
                    } else {
                        // Embedding disabled - block iframe embedding
                        response.headers.set('X-Frame-Options', 'DENY');
                    }

                    return response;
                } catch (error) {
                    console.error('Middleware error:', error);
                    // On error, default to denying embedding for security
                    const response = NextResponse.next();
                    response.headers.set('X-Frame-Options', 'DENY');
                    return response;
                }
            }
        }
    }

    // License Check (Placeholder for now - strictly air-gapped)
    // In real implementation we would check the license status here
    // const licenseValid = checkLicense();
    // if (!licenseValid && !path.startsWith('/license-expired')) {
    //   return NextResponse.redirect(new URL('/license-expired', request.url));
    // }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/f/:path*'],
};
