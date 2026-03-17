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
    const adminEmail = 'aroshak@gmail.com';
    const adminPassword = 'Admin123'; // Development default — change in production!
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

    // ── Built-in Sample Forms ────────────────────────────────────────────
    console.log('');
    console.log('Seeding sample forms...');

    const sampleForms = [
        {
            slug: 'food-experience-survey-sample',
            title: 'Food Experience Survey',
            description: 'A comprehensive food preferences and dining experience survey — built-in sample form.',
            isPublished: true,
            schema: [
                {
                    id: 'q1-welcome',
                    type: 'statement',
                    title: 'Welcome to our Food Experience Survey!',
                    description: 'Help us understand your dining preferences. This takes about 3 minutes.',
                    required: false,
                },
                {
                    id: 'q2-name',
                    type: 'text',
                    title: 'What is your name?',
                    placeholder: 'Enter your full name',
                    required: true,
                },
                {
                    id: 'q3-email',
                    type: 'email',
                    title: 'Your email address',
                    placeholder: 'you@example.com',
                    required: true,
                },
                {
                    id: 'q4-fav-cuisine',
                    type: 'picture-choice',
                    title: 'Which cuisine do you enjoy the most?',
                    required: true,
                    options: [
                        { id: 'pc1', label: 'Italian', value: 'italian', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
                        { id: 'pc2', label: 'Japanese', value: 'japanese', imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop' },
                        { id: 'pc3', label: 'Mexican', value: 'mexican', imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop' },
                        { id: 'pc4', label: 'Indian', value: 'indian', imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop' },
                    ],
                },
                {
                    id: 'q5-dining-freq',
                    type: 'dropdown',
                    title: 'How often do you eat out per week?',
                    required: true,
                    options: [
                        { id: 'df1', label: 'Rarely (less than once)', value: 'rarely' },
                        { id: 'df2', label: '1-2 times', value: '1-2' },
                        { id: 'df3', label: '3-4 times', value: '3-4' },
                        { id: 'df4', label: '5+ times', value: '5+' },
                    ],
                },
                {
                    id: 'q6-diet',
                    type: 'checkbox',
                    title: 'Do you follow any dietary restrictions?',
                    required: false,
                    options: [
                        { id: 'dt1', label: 'Vegetarian', value: 'vegetarian' },
                        { id: 'dt2', label: 'Vegan', value: 'vegan' },
                        { id: 'dt3', label: 'Gluten-Free', value: 'gluten-free' },
                        { id: 'dt4', label: 'Dairy-Free', value: 'dairy-free' },
                        { id: 'dt5', label: 'Halal', value: 'halal' },
                        { id: 'dt6', label: 'None', value: 'none' },
                    ],
                },
                {
                    id: 'q7-fav-meal',
                    type: 'radio',
                    title: 'Which meal is your favourite?',
                    required: true,
                    options: [
                        { id: 'fm1', label: 'Breakfast', value: 'breakfast' },
                        { id: 'fm2', label: 'Lunch', value: 'lunch' },
                        { id: 'fm3', label: 'Dinner', value: 'dinner' },
                        { id: 'fm4', label: 'Late-night snack', value: 'snack' },
                    ],
                },
                {
                    id: 'q8-spice',
                    type: 'scale',
                    title: 'How spicy do you like your food?',
                    description: '1 = Mild, 10 = Extreme heat',
                    required: true,
                    min: 1,
                    max: 10,
                },
                {
                    id: 'q9-rating',
                    type: 'rating',
                    title: 'Rate your last restaurant experience',
                    required: true,
                },
                {
                    id: 'q10-fav-drink',
                    type: 'picture-choice',
                    title: 'Pick your go-to beverage with a meal',
                    required: false,
                    options: [
                        { id: 'bv1', label: 'Coffee', value: 'coffee', imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop' },
                        { id: 'bv2', label: 'Fresh Juice', value: 'juice', imageUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=300&fit=crop' },
                        { id: 'bv3', label: 'Water', value: 'water', imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop' },
                        { id: 'bv4', label: 'Soft Drink', value: 'soda', imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop' },
                    ],
                },
                {
                    id: 'q11-budget',
                    type: 'dropdown',
                    title: 'What is your typical budget for a meal out?',
                    required: true,
                    options: [
                        { id: 'bg1', label: 'Under $10', value: 'under-10' },
                        { id: 'bg2', label: '$10 – $25', value: '10-25' },
                        { id: 'bg3', label: '$25 – $50', value: '25-50' },
                        { id: 'bg4', label: '$50+', value: '50+' },
                    ],
                },
                {
                    id: 'q12-feedback',
                    type: 'paragraph',
                    title: 'Any additional comments about your food preferences?',
                    placeholder: 'Tell us what you love about food…',
                    required: false,
                },
            ],
            settings: {
                theme: 'midnight',
                transition: 'slide',
                showProgressBar: true,
                welcomeScreen: {
                    enabled: true,
                    title: 'Food Experience Survey',
                    description: 'Share your dining preferences and help us improve our menu offerings.',
                    buttonText: 'Start Survey',
                },
                endScreen: {
                    enabled: true,
                    title: 'Thank you!',
                    description: 'Your feedback helps us create better dining experiences.',
                    buttonText: 'Submit Another Response',
                },
            },
        },
        {
            slug: 'customer-satisfaction-sample',
            title: 'Customer Satisfaction Survey',
            description: 'Measure customer satisfaction with your product or service — built-in sample form.',
            isPublished: true,
            schema: [
                {
                    id: 'cs1-name',
                    type: 'text',
                    title: 'Your name',
                    placeholder: 'Full name',
                    required: true,
                },
                {
                    id: 'cs2-email',
                    type: 'email',
                    title: 'Email address',
                    placeholder: 'you@company.com',
                    required: true,
                },
                {
                    id: 'cs3-product',
                    type: 'dropdown',
                    title: 'Which product or service are you rating?',
                    required: true,
                    options: [
                        { id: 'sp1', label: 'Web Platform', value: 'web' },
                        { id: 'sp2', label: 'Mobile App', value: 'mobile' },
                        { id: 'sp3', label: 'Customer Support', value: 'support' },
                        { id: 'sp4', label: 'Billing & Payments', value: 'billing' },
                    ],
                },
                {
                    id: 'cs4-overall',
                    type: 'rating',
                    title: 'How would you rate your overall experience?',
                    required: true,
                },
                {
                    id: 'cs5-nps',
                    type: 'scale',
                    title: 'How likely are you to recommend us to a friend or colleague?',
                    description: '0 = Not at all likely, 10 = Extremely likely',
                    min: 0,
                    max: 10,
                    required: true,
                },
                {
                    id: 'cs6-aspects',
                    type: 'checkbox',
                    title: 'Which aspects exceeded your expectations?',
                    required: false,
                    options: [
                        { id: 'ax1', label: 'Ease of use', value: 'ease' },
                        { id: 'ax2', label: 'Speed & performance', value: 'speed' },
                        { id: 'ax3', label: 'Design & aesthetics', value: 'design' },
                        { id: 'ax4', label: 'Customer support', value: 'support' },
                        { id: 'ax5', label: 'Value for money', value: 'value' },
                    ],
                },
                {
                    id: 'cs7-improve',
                    type: 'paragraph',
                    title: 'What could we improve?',
                    placeholder: 'Your suggestions help us get better…',
                    required: false,
                },
                {
                    id: 'cs8-contact',
                    type: 'radio',
                    title: 'May we follow up with you about your feedback?',
                    required: true,
                    options: [
                        { id: 'ct1', label: 'Yes, feel free to reach out', value: 'yes' },
                        { id: 'ct2', label: 'No, thanks', value: 'no' },
                    ],
                },
            ],
            settings: {
                theme: 'midnight',
                transition: 'fade',
                showProgressBar: true,
                welcomeScreen: {
                    enabled: true,
                    title: 'Customer Satisfaction Survey',
                    description: 'Your feedback is valuable. This survey takes about 2 minutes.',
                    buttonText: 'Begin',
                },
                endScreen: {
                    enabled: true,
                    title: 'Thanks for your feedback!',
                    description: 'We appreciate you taking the time to help us improve.',
                },
            },
        },
        {
            slug: 'employee-onboarding-sample',
            title: 'Employee Onboarding Checklist',
            description: 'New hire onboarding form for HR departments — built-in sample form.',
            isPublished: false,
            schema: [
                {
                    id: 'eo1-statement',
                    type: 'statement',
                    title: 'Welcome to the team!',
                    description: 'Please complete this onboarding form within your first week. All fields marked as required must be filled in.',
                    required: false,
                },
                {
                    id: 'eo2-name',
                    type: 'text',
                    title: 'Full legal name',
                    required: true,
                },
                {
                    id: 'eo3-email',
                    type: 'email',
                    title: 'Personal email address',
                    required: true,
                },
                {
                    id: 'eo4-start',
                    type: 'date',
                    title: 'Start date',
                    required: true,
                },
                {
                    id: 'eo5-department',
                    type: 'dropdown',
                    title: 'Department',
                    required: true,
                    options: [
                        { id: 'dp1', label: 'Engineering', value: 'engineering' },
                        { id: 'dp2', label: 'Design', value: 'design' },
                        { id: 'dp3', label: 'Marketing', value: 'marketing' },
                        { id: 'dp4', label: 'Sales', value: 'sales' },
                        { id: 'dp5', label: 'HR & Operations', value: 'hr' },
                    ],
                },
                {
                    id: 'eo6-equipment',
                    type: 'checkbox',
                    title: 'Equipment received',
                    required: true,
                    options: [
                        { id: 'eq1', label: 'Laptop', value: 'laptop' },
                        { id: 'eq2', label: 'Monitor', value: 'monitor' },
                        { id: 'eq3', label: 'Keyboard & Mouse', value: 'peripherals' },
                        { id: 'eq4', label: 'ID Badge', value: 'badge' },
                        { id: 'eq5', label: 'Phone', value: 'phone' },
                    ],
                },
                {
                    id: 'eo7-signature',
                    type: 'signature',
                    title: 'Digital signature confirming receipt of equipment',
                    required: true,
                },
                {
                    id: 'eo8-notes',
                    type: 'paragraph',
                    title: 'Any questions or concerns for your manager?',
                    placeholder: 'Let us know how we can help…',
                    required: false,
                },
            ],
            settings: {
                theme: 'midnight',
                transition: 'slide',
                showProgressBar: true,
                welcomeScreen: {
                    enabled: true,
                    title: 'Employee Onboarding',
                    description: 'Complete your new hire paperwork digitally.',
                    buttonText: 'Get Started',
                },
                endScreen: {
                    enabled: true,
                    title: 'Onboarding Complete',
                    description: 'HR will review your submission. Welcome aboard!',
                },
            },
        },
    ];

    for (const form of sampleForms) {
        await prisma.form.upsert({
            where: { slug: form.slug },
            update: {
                title: form.title,
                description: form.description,
                schema: form.schema,
                settings: form.settings,
                isPublished: form.isPublished,
            },
            create: {
                slug: form.slug,
                title: form.title,
                description: form.description,
                schema: form.schema,
                settings: form.settings,
                isPublished: form.isPublished,
            },
        });
        console.log(`  Sample form: ${form.title} (${form.slug})`);
    }

    // ── Development License ────────────────────────────────────────────
    // Pre-activates a valid development license so the admin area is
    // accessible out-of-the-box without needing to paste a license key.
    // This license is signed with the dev RSA key in src/lib/license/validator.ts.
    // Expires: 2030-01-01 — replace with a real license for production.
    const devLicenseData = {
        licensee: 'LockForms Development License',
        email: 'aroshak@gmail.com',
        plan: 'enterprise',
        seats: 999,
        features: ['ai', 'saml', 'ldap', 'api', 'whitelabel', 'unlimited_forms', 'export', 'audit_log'],
        hardwareId: null,
        issuedAt: '2026-03-17T00:00:00.000Z',
        expiresAt: '2030-01-01T00:00:00.000Z',
    };
    const devLicenseStatus = {
        valid: true,
        data: devLicenseData,
        lastCheckedAt: new Date().toISOString(),
    };
    await prisma.systemConfig.upsert({
        where: { key: 'license_status' },
        update: { value: JSON.stringify(devLicenseStatus) },
        create: { key: 'license_status', value: JSON.stringify(devLicenseStatus) },
    });
    // Also store the signed license key (for re-validation)
    const devLicenseKey = {
        data: devLicenseData,
        signature: 'clraGuxSAmQKpWPCMrssBDh7Oli5lTckeRsfV3WAXfycFp9/UpBjiWg8RN49XBXKOsG+laSz+qqFsNCzosITw551WIMmSbJFs4/OICNkdR0Gl2SmR4g/We6rvsxLJQuAfJ8MlqczFeo9Mq1aLIClj3ZSPoqBI/FeABVH/qNr4pYnlm59AnzSl743G3LyJbubHwycemfl9RR41cPT55FqFvRq6xltwwbACoxqnyk567hy5ED76ZkMz6tBc2R3Y4nft1KFkvUbM2TZcnRC7eatr8DtIoTJZJby6E6HUj1/ocdFfo8wFxyU20YdEpTgnrfn0Zi84tytzc71qwi3HFGCDw==',
    };
    await prisma.systemConfig.upsert({
        where: { key: 'license_key' },
        update: { value: JSON.stringify(devLicenseKey) },
        create: { key: 'license_key', value: JSON.stringify(devLicenseKey) },
    });
    console.log('  Development license: activated (expires 2030-01-01)');

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
