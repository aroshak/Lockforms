import { createVerify } from 'crypto';

// This acts as the embedded public key. 
// In a real build, this would be injected at build time or read from a secure file.
// For MVP, we will paste the generated public key here after running the tool.
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`; // Placeholder

export interface LicensePayload {
    data: {
        customer: string;
        maxForms: number;
        expiration: string;
        features: string[];
    };
    signature: string;
}

export function verifyLicense(licenseBase64: string, publicKeyPem: string = PUBLIC_KEY): boolean {
    try {
        const jsonStr = Buffer.from(licenseBase64, 'base64').toString('utf-8');
        const license: LicensePayload = JSON.parse(jsonStr);

        const verifier = createVerify('SHA256');
        verifier.update(JSON.stringify(license.data));
        verifier.end();

        const isValidSignature = verifier.verify(publicKeyPem, license.signature, 'base64');
        if (!isValidSignature) return false;

        // Check Expiration
        const expiration = new Date(license.data.expiration);
        if (expiration < new Date()) {
            console.warn('License expired');
            return false;
        }

        return true;
    } catch (e) {
        console.error('License validation failed:', e);
        return false;
    }
}
