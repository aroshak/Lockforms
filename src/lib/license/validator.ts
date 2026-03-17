import { createVerify } from 'crypto';
import type { LicenseData } from '@/app/admin/settings/actions';

// ── Embedded RSA-2048 Public Key ──────────────────────────────────────────
// Generated 2026-03-17. Replace this with a new key for production by running:
//   npx ts-node --project tsconfig.scripts.json src/scripts/generate-keypair.ts
//
// IMPORTANT: The corresponding private key is used only by the license generator
// (src/scripts/generate-license.ts). Never embed the private key in the application.

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApDwf7BO8q1jOO1BBY4W7
YS3nRSJ8H91dRJJTi5kPHhXKAGdqZdTbxbzCxopsG0OIxikItVsy74qMaHnWwi9f
rkVepHkUJib7z/7i2dvo5J9WoioYY26430WQ0qvu7jM0FkDACPZUe6VZEYjSi6L6
z0yvwBef7knaYE19nAEEcx41qg4l97H607r6lUpOG8sJzeDnlPCyUs3nmNgt0nVj
BzQ2nU3nzDZ6z8p6hg0KLkJCoMnTCq3jg5x/84mptG9HU1EQvf+ZXq4rXkTHDxwD
+A/GVMtfktYtvSmTO2BpnYQKcQr73L1vvIAxohzBM5EeS+pk8O3gaVPcv/cRBWFk
swIDAQAB
-----END PUBLIC KEY-----`;

// ── Types ─────────────────────────────────────────────────────────────────

export interface LicenseJson {
    data: LicenseData;
    signature: string;
}

export interface LicenseVerifyResult {
    valid: boolean;
    reason?: string;
    data?: LicenseData;
    daysRemaining?: number;
}

// ── Core Validator ────────────────────────────────────────────────────────

/**
 * Verifies a parsed license object using the embedded RSA-2048 public key.
 *
 * Signature algorithm: RSA-SHA256 over JSON.stringify(data)
 * (canonical: no extra whitespace, keys in insertion order)
 *
 * @param licenseJson  - Parsed { data, signature } license object
 * @param hardwareId   - Optional fingerprint to match against license.data.hardwareId
 */
export function verifyLicense(
    licenseJson: LicenseJson,
    hardwareId?: string,
): LicenseVerifyResult {
    try {
        const { data, signature } = licenseJson;

        if (!data || !signature) {
            return { valid: false, reason: 'Invalid license format: missing data or signature.' };
        }

        // ── RSA-SHA256 signature check ────────────────────────────────────
        const canonical = JSON.stringify(data);
        const verifier = createVerify('RSA-SHA256');
        verifier.update(canonical);

        let isValidSig: boolean;
        try {
            isValidSig = verifier.verify(PUBLIC_KEY, signature, 'base64');
        } catch {
            return { valid: false, reason: 'Signature verification error. License may be malformed.' };
        }

        if (!isValidSig) {
            return { valid: false, reason: 'License signature is invalid. This license may have been tampered with.' };
        }

        // ── Expiry check ──────────────────────────────────────────────────
        if (data.expiresAt) {
            const expiry = new Date(data.expiresAt);
            if (isNaN(expiry.getTime())) {
                return { valid: false, reason: 'License contains an invalid expiry date.', data };
            }
            const now = Date.now();
            if (expiry.getTime() < now) {
                const daysAgo = Math.floor((now - expiry.getTime()) / 86_400_000);
                return {
                    valid: false,
                    reason: `License expired ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago (${expiry.toLocaleDateString()}).`,
                    data,
                    daysRemaining: -daysAgo,
                };
            }
            const daysRemaining = Math.ceil((expiry.getTime() - now) / 86_400_000);
            // Warn if expiring soon (within 30 days) — still valid
            if (daysRemaining <= 30) {
                return { valid: true, data, daysRemaining, reason: `License expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.` };
            }
            return { valid: true, data, daysRemaining };
        }

        // ── Hardware ID check (optional) ──────────────────────────────────
        if (data.hardwareId && hardwareId && data.hardwareId !== hardwareId) {
            return {
                valid: false,
                reason: 'This license is locked to a different machine (hardware ID mismatch).',
                data,
            };
        }

        return { valid: true, data };
    } catch (e) {
        console.error('[LicenseValidator] Unexpected error:', e);
        return { valid: false, reason: 'Internal error during license validation.' };
    }
}

/**
 * Parse a license JSON string and verify it in one step.
 */
export function verifyLicenseString(
    licenseJsonString: string,
    hardwareId?: string,
): LicenseVerifyResult {
    try {
        const parsed = JSON.parse(licenseJsonString) as LicenseJson;
        return verifyLicense(parsed, hardwareId);
    } catch {
        return { valid: false, reason: 'Cannot parse license: invalid JSON.' };
    }
}
