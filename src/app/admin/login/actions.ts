'use server';

import { cookies } from 'next/headers';

// In a real app we would use robust auth (NextAuth / Lucia)
// For this air-gapped MVP we use a secured JWT cookie
export async function login(password: string) {
    const crypto = require('crypto');
    const { encrypt } = await import('@/lib/auth');

    // Calculate hash of provided password
    const hash = crypto.createHash('sha256').update(password).digest('hex');

    // Ideally this is stored in DB or secure env. 
    // For the MVP we use the .env check
    const VALID_HASH = process.env.ADMIN_PASSWORD_HASH;

    // Development fallback "admin123" if not set (for safety in demo)
    // 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
    const DEV_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

    const targetHash = VALID_HASH || DEV_HASH;

    if (hash === targetHash) {
        // Create JWT Session
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
        const session = await encrypt({ user: 'admin', expires });

        // Set secure cookie
        cookies().set('admin_session', session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires,
            path: '/',
            sameSite: 'lax',
        });

        return { success: true };
    }

    return { success: false, message: 'Invalid password' };
}
