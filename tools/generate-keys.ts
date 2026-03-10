import { generateKeyPairSync, writeFileSync } from 'crypto';
import { join } from 'path';

// Generate RSA-2048 Key Pair
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

const outDir = join(__dirname, 'output');
// Ensure output dir exists
const fs = require('fs');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

writeFileSync(join(outDir, 'private.pem'), privateKey);
writeFileSync(join(outDir, 'public.pem'), publicKey);

console.log('✅ Keys generated in tools/output/');
console.log('IMPORTANT: Keep private.pem SAFE. Embed public.pem in the application.');
