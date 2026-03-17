'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ── Types ────────────────────────────────────────────────────────────────

export interface SecurityPolicyValues {
    password_policy: {
        minLength: number;
        requireComplexity: boolean;
        history: number;
        maxAge: number | null;
    };
    session_timeout: {
        idleTimeout: number;
        absoluteTimeout: number;
    };
    account_lockout: {
        maxAttempts: number;
        windowMinutes: number;
        lockoutDuration: number;
    };
}

export interface LdapConfig {
    enabled: boolean;
    serverUrl: string;
    port: number;
    baseDN: string;
    bindDN: string;
    bindPassword: string;
    searchFilter: string;
    tlsRequired: boolean;
    groupRoleMapping: { adGroup: string; lockformsRole: string }[];
    defaultRole: string;
    jitProvisioning: boolean;
}

export interface SamlConfig {
    enabled: boolean;
    idpName: string;
    metadataUrl: string;
    entityId: string;
    attributeMapping: {
        email: string;
        name: string;
        groups: string;
    };
}

export interface AiConfig {
    sidecarEnabled: boolean;
    sidecarUrl: string;
    defaultModel: string;
    sentimentEnabled: boolean;
    redactionEnabled: boolean;
    summarizationEnabled: boolean;
}

export interface LicenseData {
    licensee?: string;
    email?: string;
    plan?: string;
    seats?: number;
    features?: string[];
    hardwareId?: string;
    issuedAt?: string;
    expiresAt?: string;
}

export interface LicenseStatus {
    valid: boolean;
    reason?: string;
    data?: LicenseData;
    lastCheckedAt?: string;
}

export interface GeneralSettings {
    instanceName: string;
    deploymentMode: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

async function getConfig(key: string): Promise<unknown> {
    const record = await prisma.systemConfig.findUnique({ where: { key } });
    if (!record) return null;
    try {
        return JSON.parse(record.value);
    } catch {
        return record.value;
    }
}

async function setConfig(key: string, value: unknown): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await prisma.systemConfig.upsert({
        where: { key },
        update: { value: serialized },
        create: { key, value: serialized },
    });
}

// ── General Settings ─────────────────────────────────────────────────────

export async function getGeneralSettings(): Promise<GeneralSettings> {
    const name = await getConfig('instance_name') as string | null;
    const mode = await getConfig('deployment_mode') as string | null;
    return {
        instanceName: name ?? 'LockForms',
        deploymentMode: mode ?? 'appliance',
    };
}

export async function saveGeneralSettings(
    data: GeneralSettings
): Promise<{ success: boolean; error?: string }> {
    try {
        await setConfig('instance_name', data.instanceName);
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to save settings.' };
    }
}

// ── Security Policies ────────────────────────────────────────────────────

export async function getSecurityPolicies(): Promise<SecurityPolicyValues> {
    const [pwRaw, sessRaw, lockRaw] = await Promise.all([
        prisma.securityPolicy.findUnique({ where: { key: 'password_policy' } }),
        prisma.securityPolicy.findUnique({ where: { key: 'session_timeout' } }),
        prisma.securityPolicy.findUnique({ where: { key: 'account_lockout' } }),
    ]);

    const pw = pwRaw?.value as Record<string, unknown> | null;
    const sess = sessRaw?.value as Record<string, unknown> | null;
    const lock = lockRaw?.value as Record<string, unknown> | null;

    return {
        password_policy: {
            minLength: (pw?.minLength as number) ?? 8,
            requireComplexity: (pw?.requireComplexity as boolean) ?? false,
            history: (pw?.history as number) ?? 5,
            maxAge: (pw?.maxAge as number | null) ?? null,
        },
        session_timeout: {
            idleTimeout: (sess?.idleTimeout as number) ?? 1800,
            absoluteTimeout: (sess?.absoluteTimeout as number) ?? 86400,
        },
        account_lockout: {
            maxAttempts: (lock?.maxAttempts as number) ?? 5,
            windowMinutes: (lock?.windowMinutes as number) ?? 15,
            lockoutDuration: (lock?.lockoutDuration as number) ?? 1800,
        },
    };
}

export async function saveSecurityPolicies(
    data: SecurityPolicyValues
): Promise<{ success: boolean; error?: string }> {
    try {
        await Promise.all([
            prisma.securityPolicy.upsert({
                where: { key: 'password_policy' },
                update: { value: data.password_policy },
                create: { key: 'password_policy', value: data.password_policy },
            }),
            prisma.securityPolicy.upsert({
                where: { key: 'session_timeout' },
                update: { value: data.session_timeout },
                create: { key: 'session_timeout', value: data.session_timeout },
            }),
            prisma.securityPolicy.upsert({
                where: { key: 'account_lockout' },
                update: { value: data.account_lockout },
                create: { key: 'account_lockout', value: data.account_lockout },
            }),
        ]);
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to save security policies.' };
    }
}

// ── Auth / LDAP / SAML ───────────────────────────────────────────────────

export async function getLdapConfig(): Promise<LdapConfig> {
    const cfg = await getConfig('ldap_config') as Partial<LdapConfig> | null;
    return {
        enabled: cfg?.enabled ?? false,
        serverUrl: cfg?.serverUrl ?? 'ldaps://',
        port: cfg?.port ?? 636,
        baseDN: cfg?.baseDN ?? '',
        bindDN: cfg?.bindDN ?? '',
        bindPassword: cfg?.bindPassword ?? '',
        searchFilter: cfg?.searchFilter ?? '(sAMAccountName={{username}})',
        tlsRequired: cfg?.tlsRequired ?? true,
        groupRoleMapping: cfg?.groupRoleMapping ?? [],
        defaultRole: cfg?.defaultRole ?? 'Viewer',
        jitProvisioning: cfg?.jitProvisioning ?? true,
    };
}

export async function saveLdapConfig(
    data: LdapConfig
): Promise<{ success: boolean; error?: string }> {
    try {
        await setConfig('ldap_config', data);
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to save LDAP configuration.' };
    }
}

export async function getSamlConfig(): Promise<SamlConfig> {
    const cfg = await getConfig('saml_config') as Partial<SamlConfig> | null;
    return {
        enabled: cfg?.enabled ?? false,
        idpName: cfg?.idpName ?? '',
        metadataUrl: cfg?.metadataUrl ?? '',
        entityId: cfg?.entityId ?? 'lockforms-sp',
        attributeMapping: cfg?.attributeMapping ?? {
            email: 'email',
            name: 'displayName',
            groups: 'memberOf',
        },
    };
}

export async function saveSamlConfig(
    data: SamlConfig
): Promise<{ success: boolean; error?: string }> {
    try {
        await setConfig('saml_config', data);
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to save SAML configuration.' };
    }
}

export async function testLdapConnection(
    config: LdapConfig
): Promise<{ success: boolean; message: string }> {
    // Placeholder — actual ldapjs connection test would go here
    // when ldapjs is installed
    if (!config.serverUrl || !config.baseDN) {
        return { success: false, message: 'Server URL and Base DN are required.' };
    }
    // Simulate a test (replace with real ldapjs bind when package added)
    return { success: false, message: 'LDAP package not yet installed. Add ldapjs to package.json to enable live testing.' };
}

// ── AI Config ────────────────────────────────────────────────────────────

export async function getAiConfig(): Promise<AiConfig> {
    const cfg = await getConfig('ai_config') as Partial<AiConfig> | null;
    return {
        sidecarEnabled: cfg?.sidecarEnabled ?? false,
        sidecarUrl: cfg?.sidecarUrl ?? 'http://lockforms-ai:11434',
        defaultModel: cfg?.defaultModel ?? 'phi3',
        sentimentEnabled: cfg?.sentimentEnabled ?? false,
        redactionEnabled: cfg?.redactionEnabled ?? false,
        summarizationEnabled: cfg?.summarizationEnabled ?? false,
    };
}

export async function saveAiConfig(
    data: AiConfig
): Promise<{ success: boolean; error?: string }> {
    try {
        await setConfig('ai_config', data);
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to save AI configuration.' };
    }
}

export async function checkAiSidecarStatus(): Promise<{
    online: boolean;
    models: string[];
    error?: string;
}> {
    const cfg = await getAiConfig();
    try {
        const res = await fetch(`${cfg.sidecarUrl}/api/tags`, {
            signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return { online: false, models: [], error: `HTTP ${res.status}` };
        const data = await res.json() as { models?: { name: string }[] };
        const models = (data.models ?? []).map((m: { name: string }) => m.name);
        return { online: true, models };
    } catch (e) {
        return { online: false, models: [], error: e instanceof Error ? e.message : 'Connection failed' };
    }
}

// ── License ──────────────────────────────────────────────────────────────

export async function getLicenseStatus(): Promise<LicenseStatus> {
    const stored = await getConfig('license_status') as LicenseStatus | null;
    return stored ?? { valid: false, reason: 'No license installed' };
}

export async function activateLicense(
    licenseJson: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const parsed = JSON.parse(licenseJson) as { data?: LicenseData; signature?: string };
        if (!parsed.data || !parsed.signature) {
            return { success: false, error: 'Invalid license format. Expected { data, signature }.' };
        }

        // Store the raw license key for future validation
        await setConfig('license_key', licenseJson);

        // Store status (real RSA verification goes in src/lib/license/validator.ts)
        const status: LicenseStatus = {
            valid: true,
            data: parsed.data,
            lastCheckedAt: new Date().toISOString(),
        };
        await setConfig('license_status', status);

        revalidatePath('/admin/settings');
        return { success: true };
    } catch {
        return { success: false, error: 'Invalid license JSON. Please check the format.' };
    }
}
