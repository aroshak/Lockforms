import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges tailwind classes intelligently
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Generates a random crypto-safe string
 */
export function generateId(length = 8) {
    if (typeof window === 'undefined') {
        // Server-side
        const { randomBytes } = require('crypto');
        return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
    } else {
        // Client-side
        const array = new Uint8Array(Math.ceil(length / 2));
        window.crypto.getRandomValues(array);
        return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
    }
}

/**
 * Generates a secure share token (32 characters)
 * Used for link-only access control
 */
export function generateShareToken(): string {
    return generateId(32);
}

/**
 * Validates domain format
 * @param domain - Domain to validate (e.g., "example.com")
 * @returns true if domain format is valid
 */
export function isValidDomain(domain: string): boolean {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
}

