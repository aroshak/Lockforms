import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    ADMIN_PASSWORD_HASH: z.string().min(1, "ADMIN_PASSWORD_HASH is required"),
});

const processEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
};

// Validate environment variables - will throw if invalid
const parsed = envSchema.required().safeParse(processEnv);

if (!parsed.success) {
    console.error(
        '❌ Invalid environment variables:',
        parsed.error.flatten().fieldErrors,
    );
    throw new Error('Invalid environment variables');
}

export const env = parsed.data;
