import bcrypt from 'bcryptjs';

/**
 * Hashes a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Verifies a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns true if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

/**
 * Generates a secure password verification token
 * Used to prove a password was recently verified without re-sending credentials
 */
export function generatePasswordToken(): string {
    // Create a time-limited token: slug + timestamp + random bytes
    const { randomBytes } = require('crypto');
    const timestamp = Date.now().toString(36);
    const random = randomBytes(16).toString('hex');
    return `${timestamp}.${random}`;
}

/**
 * Validates that a password token is not expired (1 hour window)
 */
export function isPasswordTokenValid(token: string): boolean {
    try {
        const parts = token.split('.');
        if (parts.length !== 2) return false;
        const timestamp = parseInt(parts[0], 36);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        return (now - timestamp) < oneHour;
    } catch {
        return false;
    }
}
