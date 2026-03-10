import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

import { env } from './env';

// Use the admin password hash as a secret key component
// In a real app, you'd want a separate JWT_SECRET
const secretKey = env.ADMIN_PASSWORD_HASH;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // Session lasts 1 day
        .sign(encodedKey);
}

export async function decrypt(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, encodedKey, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const session = cookies().get('admin_session')?.value;
    if (!session) return null;
    return await decrypt(session);
}
