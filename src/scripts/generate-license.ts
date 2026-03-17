/**
 * LockForms License Generator
 * ───────────────────────────
 * Generates a signed license JSON for a customer.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json src/scripts/generate-license.ts \
 *     --licensee "Acme Corp" \
 *     --email "admin@acme.com" \
 *     --plan enterprise \
 *     --seats 50 \
 *     --expiry 2027-03-17 \
 *     --features ai,saml,ldap,api,audit_log
 *
 * Requirements:
 *   - LOCKFORMS_PRIVATE_KEY env var must point to your private key file path, OR
 *   - Place private key at keys/private.pem (never commit this file)
 *
 * The output JSON is pasted into Settings → License tab in the LockForms admin UI.
 */

import { createSign } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Parse CLI args ────────────────────────────────────────────────────────

function getArg(name: string, required = true): string {
    const idx = process.argv.indexOf(`--${name}`);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
    if (required) {
        console.error(`Error: --${name} is required`);
        process.exit(1);
    }
    return '';
}

const licensee = getArg('licensee');
const email = getArg('email');
const plan = getArg('plan');
const seats = parseInt(getArg('seats'), 10);
const expiry = getArg('expiry');
const featuresRaw = getArg('features', false);
const hardwareId = getArg('hardware-id', false) || null;

const features = featuresRaw
    ? featuresRaw.split(',').map(f => f.trim())
    : ['unlimited_forms', 'export', 'audit_log'];

// ── Load private key ──────────────────────────────────────────────────────

let privateKey: string;

try {
    const keyPath = process.env.LOCKFORMS_PRIVATE_KEY
        ? resolve(process.env.LOCKFORMS_PRIVATE_KEY)
        : resolve(__dirname, '../../keys/private.pem');

    privateKey = readFileSync(keyPath, 'utf-8');
} catch {
    console.error('Could not load private key.');
    console.error('Set LOCKFORMS_PRIVATE_KEY env var or place key at keys/private.pem');
    process.exit(1);
}

// ── Build license data ────────────────────────────────────────────────────

const data = {
    licensee,
    email,
    plan,
    seats,
    features,
    hardwareId,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(expiry + 'T23:59:59.000Z').toISOString(),
};

// ── Sign ──────────────────────────────────────────────────────────────────

const canonical = JSON.stringify(data);
const signer = createSign('RSA-SHA256');
signer.update(canonical);
const signature = signer.sign(privateKey, 'base64');

const license = { data, signature };

// ── Output ────────────────────────────────────────────────────────────────

console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║             LockForms License Generated                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');
console.log(`  Licensee : ${data.licensee}`);
console.log(`  Email    : ${data.email}`);
console.log(`  Plan     : ${data.plan}`);
console.log(`  Seats    : ${data.seats}`);
console.log(`  Expires  : ${data.expiresAt}`);
console.log(`  Features : ${data.features.join(', ')}`);
if (data.hardwareId) console.log(`  Hardware : ${data.hardwareId}`);
console.log('');
console.log('── License JSON (paste into Settings → License tab) ──────────');
console.log('');
console.log(JSON.stringify(license, null, 2));
console.log('');
