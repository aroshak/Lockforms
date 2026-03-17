/**
 * LockForms Key Pair Generator
 * ─────────────────────────────
 * Generates a fresh RSA-2048 key pair for license signing.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json src/scripts/generate-keypair.ts
 *
 * Output:
 *   keys/private.pem  — Keep this SECRET. Never commit. Use only for generate-license.ts
 *   keys/public.pem   — Embed the contents of this into src/lib/license/validator.ts
 *
 * Run this once when setting up a new LockForms deployment key.
 * If you rotate keys, all existing customer licenses will need to be re-issued.
 */

import { generateKeyPairSync } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const keysDir = resolve(__dirname, '../../keys');

if (!existsSync(keysDir)) {
    mkdirSync(keysDir, { recursive: true });
}

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const privatePath = resolve(keysDir, 'private.pem');
const publicPath = resolve(keysDir, 'public.pem');

writeFileSync(privatePath, privateKey, { mode: 0o600 });
writeFileSync(publicPath, publicKey);

console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║           LockForms RSA-2048 Key Pair Generated             ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');
console.log(`  Private key: ${privatePath}`);
console.log(`  Public key:  ${publicPath}`);
console.log('');
console.log('⚠  IMPORTANT: keys/ is git-ignored. Keep private.pem secure.');
console.log('');
console.log('── Next step: embed public key in src/lib/license/validator.ts ──');
console.log('');
console.log('Replace the PUBLIC_KEY constant with the contents of keys/public.pem:');
console.log('');
console.log(publicKey);
