/** @type {import('next').NextConfig} */
const nextConfig = {
    // Security: Disable x-powered-by header
    poweredByHeader: false,

    // Security: Strict CSP and other headers
    async headers() {
        return [
            {
                // Admin routes: Most restrictive - deny all framing
                source: '/admin/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'off'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    }
                ]
            },
            {
                // Form routes: Dynamic headers (managed by middleware for embedding)
                source: '/f/:slug*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'off'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    }
                    // Note: X-Frame-Options handled dynamically in middleware
                ]
            },
            {
                // All other routes: Same origin framing only
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'off'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    }
                ]
            }
        ];
    },

    // Ensure no external resources
    images: {
        remotePatterns: [], // No external images allowed
    },

    // Strict mode for React
    reactStrictMode: true,

    // Output standalone for Docker
    output: 'standalone',
};

module.exports = nextConfig;
