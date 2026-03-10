import { createSign } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const PRIVATE_KEY_PATH = join(__dirname, 'output', 'private.pem');

interface LicenseData {
    customer: string;
    maxForms: number;
    expiration: string; // ISO Date
    hardwareId?: string;
    features: string[];
}

const data: LicenseData = {
    customer: "Acme Corp",
    maxForms: 100,
    expiration: "2025-12-31T23:59:59Z",
    features: ["white_label", "export_csv"]
};

try {
    const privateKey = readFileSync(PRIVATE_KEY_PATH, 'utf8');

    // Sign the data
    const signer = createSign('SHA256');
    signer.update(JSON.stringify(data));
    signer.end();

    const signature = signer.sign(privateKey, 'base64');

    // Create the final license object
    const license = {
        data,
        signature
    };

    // Encode as Base64 for easy transport (env var or file)
    const licenseString = Buffer.from(JSON.stringify(license)).toString('base64');

    writeFileSync(join(__dirname, 'output', 'license.key'), licenseString);
    console.log('✅ License generated at tools/output/license.key');
    console.log('Content (for .env):');
    console.log(licenseString);

} catch (e) {
    console.error('Error signing license. Did you run generate-keys.ts first?');
    console.error(e);
}
