'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { verifyLicenseString } from '@/lib/license/validator';
import { getHardwareFingerprint, getHardwareSummary } from '@/lib/license/hardware';
import { createHash, randomBytes } from 'crypto';

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
        const hardwareId = getHardwareFingerprint();
        const result = verifyLicenseString(licenseJson, hardwareId);

        if (!result.valid) {
            return { success: false, error: result.reason ?? 'License validation failed.' };
        }

        // Store the raw license key
        await setConfig('license_key', licenseJson);

        // Store validated status
        const status: LicenseStatus = {
            valid: true,
            data: result.data,
            reason: result.reason, // may contain "expires in X days" warning
            lastCheckedAt: new Date().toISOString(),
        };
        await setConfig('license_status', status);

        revalidatePath('/admin/settings');
        revalidatePath('/admin');
        return { success: true };
    } catch {
        return { success: false, error: 'Invalid license JSON. Please check the format.' };
    }
}

// ── Hardware Info ─────────────────────────────────────────────────────────

export async function getHardwareInfo(): Promise<{ fingerprint: string; summary: string }> {
    return {
        fingerprint: getHardwareFingerprint(),
        summary: getHardwareSummary(),
    };
}

// ── Re-validate stored license (called on startup / 24h timer) ────────────

export async function revalidateLicense(): Promise<LicenseStatus> {
    const stored = await getConfig('license_key') as string | null;
    if (!stored) {
        const status: LicenseStatus = { valid: false, reason: 'No license installed.' };
        await setConfig('license_status', status);
        return status;
    }

    const hardwareId = getHardwareFingerprint();
    const result = verifyLicenseString(typeof stored === 'string' ? stored : JSON.stringify(stored), hardwareId);

    const status: LicenseStatus = {
        valid: result.valid,
        reason: result.reason,
        data: result.data,
        lastCheckedAt: new Date().toISOString(),
    };
    await setConfig('license_status', status);
    revalidatePath('/admin');
    return status;
}

// ── API Keys ──────────────────────────────────────────────────────────────

export interface ApiKeyRecord {
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    isActive: boolean;
    lastUsedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
}

export async function getApiKeys(): Promise<ApiKeyRecord[]> {
    const keys = await prisma.apiKey.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return keys.map(k => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        scopes: k.scopes,
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        expiresAt: k.expiresAt?.toISOString() ?? null,
        createdAt: k.createdAt.toISOString(),
    }));
}

export async function createApiKey(
    name: string,
    scopes: string[],
    expiresAt?: string,
): Promise<{ success: boolean; key?: string; record?: ApiKeyRecord; error?: string }> {
    try {
        // Generate: lf_live_ + 32 random hex bytes
        const rawRandom = randomBytes(24).toString('hex');
        const rawKey = `lf_live_${rawRandom}`;
        const keyHash = createHash('sha256').update(rawKey).digest('hex');
        const prefix = rawKey.substring(0, 16); // "lf_live_xxxxxxxx"

        const record = await prisma.apiKey.create({
            data: {
                name,
                keyHash,
                prefix,
                scopes,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
        });

        revalidatePath('/admin/settings');
        return {
            success: true,
            key: rawKey, // shown ONCE — not stored
            record: {
                id: record.id,
                name: record.name,
                prefix: record.prefix,
                scopes: record.scopes,
                isActive: record.isActive,
                lastUsedAt: null,
                expiresAt: record.expiresAt?.toISOString() ?? null,
                createdAt: record.createdAt.toISOString(),
            },
        };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to create API key.' };
    }
}

export async function revokeApiKey(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.apiKey.update({
            where: { id },
            data: { isActive: false },
        });
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to revoke API key.' };
    }
}

export async function deleteApiKey(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.apiKey.delete({ where: { id } });
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to delete API key.' };
    }
}

// ── Webhooks ──────────────────────────────────────────────────────────────

export interface WebhookRecord {
    id: string;
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
    failureCount: number;
    lastDeliveredAt: string | null;
    createdAt: string;
}

export async function getWebhooks(): Promise<WebhookRecord[]> {
    const hooks = await prisma.webhook.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return hooks.map(h => ({
        id: h.id,
        name: h.name,
        url: h.url,
        events: h.events,
        isActive: h.isActive,
        failureCount: h.failureCount,
        lastDeliveredAt: h.lastDeliveredAt?.toISOString() ?? null,
        createdAt: h.createdAt.toISOString(),
    }));
}

export async function createWebhook(
    name: string,
    url: string,
    events: string[],
): Promise<{ success: boolean; secret?: string; record?: WebhookRecord; error?: string }> {
    try {
        const secret = `whsec_${randomBytes(32).toString('hex')}`;

        const hook = await prisma.webhook.create({
            data: { name, url, events, secret },
        });

        revalidatePath('/admin/settings');
        return {
            success: true,
            secret, // shown ONCE
            record: {
                id: hook.id,
                name: hook.name,
                url: hook.url,
                events: hook.events,
                isActive: hook.isActive,
                failureCount: 0,
                lastDeliveredAt: null,
                createdAt: hook.createdAt.toISOString(),
            },
        };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to create webhook.' };
    }
}

export async function toggleWebhook(
    id: string,
    isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.webhook.update({ where: { id }, data: { isActive } });
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to update webhook.' };
    }
}

export async function deleteWebhook(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.webhook.delete({ where: { id } });
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to delete webhook.' };
    }
}
