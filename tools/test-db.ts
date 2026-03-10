import prisma from '../src/lib/db';

async function main() {
    console.log('🔍 Testing database connection...');
    try {
        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log('✅ Connection successful!', result);
    } catch (error) {
        console.error('❌ Connection failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
