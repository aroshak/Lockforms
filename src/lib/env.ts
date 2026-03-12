import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
    NEXTAUTH_URL: z.string().optional(),
});

const processEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
};

const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
    console.error(
        '❌ Invalid environment variables:',
        parsed.error.flatten().fieldErrors,
    );
    throw new Error('Invalid environment variables');
}

export const env = parsed.data;
