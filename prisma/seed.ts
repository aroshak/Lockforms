import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // ── Default Roles ──────────────────────────────────────────────────
    const roles = [
        {
            name: 'Super Admin',
            description: 'Full system access',
            isSystem: true,
            permissions: [{ resource: '*', action: '*', scope: 'all' }],
        },
        {
            name: 'Admin',
            description: 'User management and form access',
            isSystem: true,
            permissions: [
                { resource: 'users', action: '*', scope: 'all' },
                { resource: 'forms', action: '*', scope: 'all' },
                { resource: 'submissions', action: '*', scope: 'all' },
                { resource: 'audit', action: 'read', scope: 'all' },
            ],
        },
        {
            name: 'Form Builder',
            description: 'Create and manage own forms',
            isSystem: true,
            permissions: [
                { resource: 'forms', action: '*', scope: 'own' },
                { resource: 'submissions', action: 'read', scope: 'own' },
                { resource: 'submissions', action: 'export', scope: 'own' },
            ],
        },
        {
            name: 'Reviewer',
            description: 'Read-only access to all forms and submissions',
            isSystem: true,
            permissions: [
                { resource: 'forms', action: 'read', scope: 'all' },
                { resource: 'submissions', action: 'read', scope: 'all' },
                { resource: 'submissions', action: 'export', scope: 'all' },
            ],
        },
        {
            name: 'Viewer',
            description: 'View assigned forms only',
            isSystem: true,
            permissions: [
                { resource: 'forms', action: 'read', scope: 'assigned' },
                { resource: 'submissions', action: 'read', scope: 'assigned' },
            ],
        },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: { permissions: role.permissions, description: role.description },
            create: role,
        });
        console.log(`  Role: ${role.name}`);
    }

    // ── Default Security Policies ──────────────────────────────────────
    const policies = [
        {
            key: 'password_policy',
            value: {
                minLength: 12,
                maxAge: null, // NIST: no forced expiration
                history: 5,
                requireComplexity: false,
            },
        },
        {
            key: 'session_timeout',
            value: {
                idleTimeout: 1800, // 30 minutes
                absoluteTimeout: 86400, // 24 hours
            },
        },
        {
            key: 'account_lockout',
            value: {
                maxAttempts: 5,
                windowMinutes: 15,
                lockoutDuration: 1800, // 30 minutes
            },
        },
    ];

    for (const policy of policies) {
        await prisma.securityPolicy.upsert({
            where: { key: policy.key },
            update: { value: policy.value },
            create: policy,
        });
        console.log(`  Policy: ${policy.key}`);
    }

    // ── Default Admin User ─────────────────────────────────────────────
    const adminEmail = 'admin@lockforms.local';
    const adminPassword = 'admin123'; // Development default — change in production!
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const superAdminRole = await prisma.role.findUnique({
        where: { name: 'Super Admin' },
    });

    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { passwordHash, name: 'System Admin' },
        create: {
            email: adminEmail,
            passwordHash,
            name: 'System Admin',
            firstName: 'System',
            lastName: 'Admin',
            isActive: true,
        },
    });

    if (superAdminRole) {
        await prisma.userRole.upsert({
            where: {
                userId_roleId: {
                    userId: adminUser.id,
                    roleId: superAdminRole.id,
                },
            },
            update: {},
            create: {
                userId: adminUser.id,
                roleId: superAdminRole.id,
                assignedBy: 'system:seed',
            },
        });
    }

    console.log(`  Admin user: ${adminEmail} / ${adminPassword}`);
    console.log('');
    console.log('Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
