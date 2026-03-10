import fs from 'fs';
import path from 'path';

// Manually load .env variables if not present (because we are running detached from Next.js)
if (!process.env.ADMIN_PASSWORD_HASH) {
    try {
        // Resolve path relative to this script (tools/test-auth.ts -> root/.env)
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            const envFile = fs.readFileSync(envPath, 'utf8');
            envFile.split('\n').forEach(line => {
                // Simple parser: KEY=VALUE or KEY="VALUE"
                // Ignore comments
                if (line.trim().startsWith('#') || !line.includes('=')) return;

                const [key, ...values] = line.split('=');
                let value = values.join('=');
                value = value.trim().replace(/^["']|["']$/g, ''); // Remove quotes

                if (key && !process.env[key.trim()]) {
                    process.env[key.trim()] = value;
                }
            });
            console.log('✅ Loaded .env file manually');
        }
    } catch (e) {
        console.warn('⚠️ Could not load .env file manually:', e);
    }
}



async function main() {
    const { encrypt, decrypt } = await import('../src/lib/auth');
    console.log('🔐 Testing Authentication Logic...');

    const payload = { user: 'admin', role: 'superuser' };
    console.log('📦 Original Payload:', payload);

    // Encrypt
    const token = await encrypt(payload);
    console.log('🎟️  Generated Token (first 20 chars):', token.substring(0, 20) + '...');

    // Decrypt
    const decrypted = await decrypt(token);
    console.log('🔓 Decrypted Payload:', decrypted);

    if (decrypted && decrypted.user === 'admin') {
        console.log('✅ Verification SUCCESS');
    } else {
        console.error('❌ Verification FAILED');
        process.exit(1);
    }

    // Tamper Test
    const tamperedToken = token.substring(0, token.length - 5) + 'xxxxx';
    const tamperedResult = await decrypt(tamperedToken);

    if (tamperedResult === null) {
        console.log('✅ Tamper check SUCCESS (Invalid signature rejected)');
    } else {
        console.error('❌ Tamper check FAILED (Invalid signature accepted)');
        process.exit(1);
    }
}

main();
