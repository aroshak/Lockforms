'use client';

import { useState, useTransition } from 'react';
import {
    Settings, Shield, Zap, Key, Cpu,
    Save, AlertCircle, CheckCircle2, ChevronDown,
    Plus, Trash2, TestTube2, ToggleLeft, ToggleRight,
    Upload, RefreshCw, Lock, Globe, Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    saveGeneralSettings, saveSecurityPolicies,
    saveLdapConfig, saveSamlConfig, saveAiConfig,
    activateLicense, testLdapConnection, checkAiSidecarStatus,
} from './actions';
import type {
    GeneralSettings, SecurityPolicyValues,
    LdapConfig, SamlConfig, AiConfig, LicenseStatus,
} from './actions';

// ── Types ────────────────────────────────────────────────────────────────

type Tab = 'general' | 'auth' | 'api' | 'ai' | 'license';

interface Props {
    general: GeneralSettings;
    policies: SecurityPolicyValues;
    ldap: LdapConfig;
    saml: SamlConfig;
    ai: AiConfig;
    license: LicenseStatus;
}

// ── Toggle Switch ─────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                value ? 'bg-primary' : 'bg-slate-700'
            }`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
            }`} />
        </button>
    );
}

// ── Feedback Toast ────────────────────────────────────────────────────────

function Toast({ type, message, onClose }: { type: 'success' | 'error'; message: string; onClose: () => void }) {
    return (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-medium shadow-2xl border animate-in fade-in slide-in-from-top-2 ${
            type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
            {type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {message}
            <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
    );
}

// ── Section Card ──────────────────────────────────────────────────────────

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/[0.06]">
                <h3 className="font-semibold text-white text-base">{title}</h3>
                {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
            </div>
            <div className="p-6 space-y-5">{children}</div>
        </div>
    );
}

// ── Field ─────────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
            {children}
            {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────

export function SettingsClient({ general, policies, ldap, saml, ai, license }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
        { id: 'auth', label: 'External Auth', icon: <Shield className="w-4 h-4" /> },
        { id: 'api', label: 'API & Webhooks', icon: <Zap className="w-4 h-4" /> },
        { id: 'ai', label: 'AI Plugins', icon: <Cpu className="w-4 h-4" /> },
        { id: 'license', label: 'License', icon: <Key className="w-4 h-4" /> },
    ];

    return (
        <div className="flex min-h-full">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* Left tab nav */}
            <div className="w-56 border-r border-white/[0.06] flex-shrink-0 p-4 space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-2 pt-2">Settings</p>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                            activeTab === tab.id
                                ? 'bg-primary/10 text-primary border-r-2 border-primary'
                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-8 space-y-6 overflow-y-auto max-w-3xl">
                {activeTab === 'general' && (
                    <GeneralTab
                        general={general}
                        policies={policies}
                        onSuccess={(m) => showToast('success', m)}
                        onError={(m) => showToast('error', m)}
                    />
                )}
                {activeTab === 'auth' && (
                    <AuthTab
                        ldap={ldap}
                        saml={saml}
                        onSuccess={(m) => showToast('success', m)}
                        onError={(m) => showToast('error', m)}
                    />
                )}
                {activeTab === 'api' && <ApiTab />}
                {activeTab === 'ai' && (
                    <AiTab
                        ai={ai}
                        onSuccess={(m) => showToast('success', m)}
                        onError={(m) => showToast('error', m)}
                    />
                )}
                {activeTab === 'license' && (
                    <LicenseTab
                        license={license}
                        onSuccess={(m) => showToast('success', m)}
                        onError={(m) => showToast('error', m)}
                    />
                )}
            </div>
        </div>
    );
}

// ── General Tab ───────────────────────────────────────────────────────────

function GeneralTab({ general, policies, onSuccess, onError }: {
    general: GeneralSettings;
    policies: SecurityPolicyValues;
    onSuccess: (m: string) => void;
    onError: (m: string) => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [instanceName, setInstanceName] = useState(general.instanceName);
    const [pw, setPw] = useState(policies.password_policy);
    const [sess, setSess] = useState(policies.session_timeout);
    const [lock, setLock] = useState(policies.account_lockout);

    const handleSaveGeneral = () => {
        startTransition(async () => {
            const r = await saveGeneralSettings({ instanceName, deploymentMode: general.deploymentMode });
            r.success ? onSuccess('General settings saved.') : onError(r.error ?? 'Failed.');
        });
    };

    const handleSavePolicies = () => {
        startTransition(async () => {
            const r = await saveSecurityPolicies({
                password_policy: pw,
                session_timeout: sess,
                account_lockout: lock,
            });
            r.success ? onSuccess('Security policies saved.') : onError(r.error ?? 'Failed.');
        });
    };

    return (
        <>
            <div>
                <h2 className="text-2xl font-bold text-white">General Settings</h2>
                <p className="text-sm text-slate-400 mt-1">Instance configuration and security policies.</p>
            </div>

            {/* Instance */}
            <SectionCard title="Instance" description="Basic configuration for this LockForms instance.">
                <Field label="Instance Name" hint="Displayed in the admin console header.">
                    <Input
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        className="bg-slate-900/50 border-primary/10 focus:border-primary max-w-sm"
                        placeholder="LockForms"
                    />
                </Field>
                <Field label="Deployment Mode">
                    <div className="flex items-center gap-3 max-w-sm">
                        <div className="flex-1 px-3 py-2 rounded-lg bg-slate-900/50 border border-primary/10 text-sm text-slate-300 capitalize">
                            {general.deploymentMode}
                        </div>
                        <span className="text-xs text-slate-500">Set via DEPLOYMENT_MODE env var</span>
                    </div>
                </Field>
                <Button onClick={handleSaveGeneral} disabled={isPending} className="shadow-primary/20 shadow-lg">
                    <Save className="w-4 h-4 mr-2" />
                    {isPending ? 'Saving...' : 'Save Instance Settings'}
                </Button>
            </SectionCard>

            {/* Password Policy */}
            <SectionCard title="Password Policy" description="Rules for user passwords. NIST SP 800-63B compliant defaults.">
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Minimum Length">
                        <Input
                            type="number" min={6} max={128}
                            value={pw.minLength}
                            onChange={(e) => setPw(p => ({ ...p, minLength: +e.target.value }))}
                            className="bg-slate-900/50 border-primary/10 focus:border-primary"
                        />
                    </Field>
                    <Field label="Password History">
                        <Input
                            type="number" min={0} max={24}
                            value={pw.history}
                            onChange={(e) => setPw(p => ({ ...p, history: +e.target.value }))}
                            className="bg-slate-900/50 border-primary/10 focus:border-primary"
                        />
                    </Field>
                </div>
                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="text-sm font-medium text-white">Require Complexity</p>
                        <p className="text-xs text-slate-500">Uppercase, lowercase, number, and symbol required.</p>
                    </div>
                    <Toggle value={pw.requireComplexity} onChange={(v) => setPw(p => ({ ...p, requireComplexity: v }))} />
                </div>
                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="text-sm font-medium text-white">Force Password Expiry</p>
                        <p className="text-xs text-slate-500">NIST recommends against forced rotation. Disabled by default.</p>
                    </div>
                    <Toggle value={pw.maxAge !== null} onChange={(v) => setPw(p => ({ ...p, maxAge: v ? 90 : null }))} />
                </div>
                {pw.maxAge !== null && (
                    <Field label="Max Age (days)">
                        <Input
                            type="number" min={30} max={365}
                            value={pw.maxAge ?? 90}
                            onChange={(e) => setPw(p => ({ ...p, maxAge: +e.target.value }))}
                            className="bg-slate-900/50 border-primary/10 focus:border-primary max-w-[140px]"
                        />
                    </Field>
                )}
            </SectionCard>

            {/* Session */}
            <SectionCard title="Session Timeout" description="How long user sessions remain active.">
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Idle Timeout (seconds)" hint="Session expires after this period of inactivity.">
                        <Input
                            type="number" min={300}
                            value={sess.idleTimeout}
                            onChange={(e) => setSess(s => ({ ...s, idleTimeout: +e.target.value }))}
                            className="bg-slate-900/50 border-primary/10 focus:border-primary"
                        />
                    </Field>
                    <Field label="Absolute Timeout (seconds)" hint="Maximum session length regardless of activity.">
                        <Input
                            type="number" min={3600}
                            value={sess.absoluteTimeout}
                            onChange={(e) => setSess(s => ({ ...s, absoluteTimeout: +e.target.value }))}
                            className="bg-slate-900/50 border-primary/10 focus:border-primary"
                        />
                    </Field>
                </div>
            </SectionCard>

            {/* Account Lockout */}
            <SectionCard title="Account Lockout" description="Brute-force protection for login attempts.">
                <div className="grid grid-cols-3 gap-4">
                    <Field label="Max Attempts" hint="Failed logins before lockout.">
                        <Input
                            type="number" min={3} max={20}
                            value={lock.maxAttempts}
                            onChange={(e) => setLock(l => ({ ...l, maxAttempts: +e.target.value }))}
                            className="bg-slate-900/50 border-primary/10 focus:border-primary"
                        />
                    </Field>
                    <Field label="Window (minutes)" hint="Time window for attempt counting.">
                        <Input
                            type="number" min={5}
                            value={lock.windowMinutes}
                            onChange={(e) => setLock(l => ({ ...l, windowMinutes: +e.target.value }))}
                            className="bg-slate-900/50 border-primary/10 focus:border-primary"
                        />
                    </Field>
                    <Field label="Lockout Duration (sec)" hint="How long account stays locked.">
                        <Input
                            type="number" min={300}
                            value={lock.lockoutDuration}
                            onChange={(e) => setLock(l => ({ ...l, lockoutDuration: +e.target.value }))}
                            className="bg-slate-900/50 border-primary/10 focus:border-primary"
                        />
                    </Field>
                </div>
                <Button onClick={handleSavePolicies} disabled={isPending} className="shadow-primary/20 shadow-lg">
                    <Save className="w-4 h-4 mr-2" />
                    {isPending ? 'Saving...' : 'Save Security Policies'}
                </Button>
            </SectionCard>
        </>
    );
}

// ── Auth Tab ──────────────────────────────────────────────────────────────

function AuthTab({ ldap, saml, onSuccess, onError }: {
    ldap: LdapConfig;
    saml: SamlConfig;
    onSuccess: (m: string) => void;
    onError: (m: string) => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [ldapForm, setLdapForm] = useState(ldap);
    const [samlForm, setSamlForm] = useState(saml);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSaveLdap = () => {
        startTransition(async () => {
            const r = await saveLdapConfig(ldapForm);
            r.success ? onSuccess('LDAP configuration saved.') : onError(r.error ?? 'Failed.');
        });
    };

    const handleSaveSaml = () => {
        startTransition(async () => {
            const r = await saveSamlConfig(samlForm);
            r.success ? onSuccess('SAML configuration saved.') : onError(r.error ?? 'Failed.');
        });
    };

    const handleTestLdap = () => {
        startTransition(async () => {
            const r = await testLdapConnection(ldapForm);
            setTestResult(r);
            setTimeout(() => setTestResult(null), 6000);
        });
    };

    const addGroupMapping = () => {
        setLdapForm(f => ({
            ...f,
            groupRoleMapping: [...f.groupRoleMapping, { adGroup: '', lockformsRole: 'Viewer' }],
        }));
    };

    const removeGroupMapping = (i: number) => {
        setLdapForm(f => ({
            ...f,
            groupRoleMapping: f.groupRoleMapping.filter((_, idx) => idx !== i),
        }));
    };

    const roles = ['Super Admin', 'Admin', 'Form Builder', 'Reviewer', 'Viewer'];

    return (
        <>
            <div>
                <h2 className="text-2xl font-bold text-white">External Authentication</h2>
                <p className="text-sm text-slate-400 mt-1">Connect to enterprise identity providers for single sign-on.</p>
            </div>

            {/* Native Auth — always on */}
            <SectionCard title="Native Authentication" description="Email and password stored in local database.">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">Always Active</p>
                        <p className="text-xs text-slate-500">Default provider — cannot be disabled. Fallback for all external providers.</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>
                </div>
            </SectionCard>

            {/* LDAP / Active Directory */}
            <SectionCard title="LDAP / Active Directory" description="Connect to Microsoft Active Directory or OpenLDAP via LDAP(S) protocol.">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-white">Enable LDAP Authentication</p>
                        <p className="text-xs text-slate-500">Users can sign in with their AD/LDAP credentials.</p>
                    </div>
                    <Toggle value={ldapForm.enabled} onChange={(v) => setLdapForm(f => ({ ...f, enabled: v }))} />
                </div>

                {ldapForm.enabled && (
                    <div className="space-y-4 pt-2 border-t border-white/[0.06]">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <Field label="Server URL">
                                    <Input
                                        value={ldapForm.serverUrl}
                                        onChange={(e) => setLdapForm(f => ({ ...f, serverUrl: e.target.value }))}
                                        className="bg-slate-900/50 border-primary/10 focus:border-primary"
                                        placeholder="ldaps://ad.company.com"
                                    />
                                </Field>
                            </div>
                            <Field label="Port">
                                <Input
                                    type="number"
                                    value={ldapForm.port}
                                    onChange={(e) => setLdapForm(f => ({ ...f, port: +e.target.value }))}
                                    className="bg-slate-900/50 border-primary/10 focus:border-primary"
                                />
                            </Field>
                        </div>

                        <Field label="Base DN" hint="Root of the directory tree to search in.">
                            <Input
                                value={ldapForm.baseDN}
                                onChange={(e) => setLdapForm(f => ({ ...f, baseDN: e.target.value }))}
                                className="bg-slate-900/50 border-primary/10 focus:border-primary"
                                placeholder="dc=company,dc=com"
                            />
                        </Field>

                        <Field label="Bind DN" hint="Service account DN used to connect to the directory.">
                            <Input
                                value={ldapForm.bindDN}
                                onChange={(e) => setLdapForm(f => ({ ...f, bindDN: e.target.value }))}
                                className="bg-slate-900/50 border-primary/10 focus:border-primary"
                                placeholder="cn=svc-lockforms,ou=ServiceAccounts,dc=company,dc=com"
                            />
                        </Field>

                        <Field label="Bind Password">
                            <Input
                                type="password"
                                value={ldapForm.bindPassword}
                                onChange={(e) => setLdapForm(f => ({ ...f, bindPassword: e.target.value }))}
                                className="bg-slate-900/50 border-primary/10 focus:border-primary"
                                placeholder="Service account password"
                            />
                        </Field>

                        <Field label="Search Filter" hint="{{username}} is replaced with the login email.">
                            <Input
                                value={ldapForm.searchFilter}
                                onChange={(e) => setLdapForm(f => ({ ...f, searchFilter: e.target.value }))}
                                className="bg-slate-900/50 border-primary/10 focus:border-primary font-mono text-xs"
                                placeholder="(sAMAccountName={{username}})"
                            />
                        </Field>

                        <div className="flex items-center justify-between py-1">
                            <div>
                                <p className="text-sm font-medium text-white">Require TLS / SSL</p>
                                <p className="text-xs text-slate-500">Use LDAPS or STARTTLS. Strongly recommended.</p>
                            </div>
                            <Toggle value={ldapForm.tlsRequired} onChange={(v) => setLdapForm(f => ({ ...f, tlsRequired: v }))} />
                        </div>

                        <div className="flex items-center justify-between py-1">
                            <div>
                                <p className="text-sm font-medium text-white">JIT Provisioning</p>
                                <p className="text-xs text-slate-500">Auto-create LockForms account on first LDAP login.</p>
                            </div>
                            <Toggle value={ldapForm.jitProvisioning} onChange={(v) => setLdapForm(f => ({ ...f, jitProvisioning: v }))} />
                        </div>

                        {/* Group → Role Mapping */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Group → Role Mapping</label>
                                <button
                                    type="button"
                                    onClick={addGroupMapping}
                                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Add Mapping
                                </button>
                            </div>
                            {ldapForm.groupRoleMapping.length === 0 && (
                                <p className="text-xs text-slate-500 italic">No group mappings. Users will receive the default role.</p>
                            )}
                            {ldapForm.groupRoleMapping.map((mapping, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input
                                        value={mapping.adGroup}
                                        onChange={(e) => {
                                            const next = [...ldapForm.groupRoleMapping];
                                            next[i] = { ...next[i], adGroup: e.target.value };
                                            setLdapForm(f => ({ ...f, groupRoleMapping: next }));
                                        }}
                                        className="bg-slate-900/50 border-primary/10 focus:border-primary text-xs"
                                        placeholder="AD Group name"
                                    />
                                    <span className="text-slate-500 text-xs flex-shrink-0">→</span>
                                    <div className="relative flex-1">
                                        <select
                                            value={mapping.lockformsRole}
                                            onChange={(e) => {
                                                const next = [...ldapForm.groupRoleMapping];
                                                next[i] = { ...next[i], lockformsRole: e.target.value };
                                                setLdapForm(f => ({ ...f, groupRoleMapping: next }));
                                            }}
                                            className="w-full appearance-none rounded-lg bg-slate-900/50 border border-primary/10 px-3 py-2 text-xs text-white focus:border-primary outline-none"
                                        >
                                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeGroupMapping(i)}
                                        className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Test result */}
                        {testResult && (
                            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${
                                testResult.success
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                                {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {testResult.message}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-white/10 hover:bg-white/5"
                                onClick={handleTestLdap}
                                disabled={isPending}
                            >
                                <TestTube2 className="w-4 h-4 mr-2" />
                                Test Connection
                            </Button>
                            <Button onClick={handleSaveLdap} disabled={isPending} className="shadow-primary/20 shadow-lg">
                                <Save className="w-4 h-4 mr-2" />
                                {isPending ? 'Saving...' : 'Save LDAP Config'}
                            </Button>
                        </div>
                    </div>
                )}

                {!ldapForm.enabled && (
                    <div className="pt-2 border-t border-white/[0.06]">
                        <Button onClick={handleSaveLdap} disabled={isPending} variant="outline" className="border-white/10 hover:bg-white/5">
                            <Save className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                    </div>
                )}
            </SectionCard>

            {/* SAML 2.0 */}
            <SectionCard title="SAML 2.0 / SSO" description="Enterprise Single Sign-On via Okta, Azure AD, OneLogin, or any SAML 2.0 IdP.">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-white">Enable SAML Authentication</p>
                        <p className="text-xs text-slate-500">Shows &quot;Sign in with SSO&quot; button on the login page.</p>
                    </div>
                    <Toggle value={samlForm.enabled} onChange={(v) => setSamlForm(f => ({ ...f, enabled: v }))} />
                </div>

                {samlForm.enabled && (
                    <div className="space-y-4 pt-2 border-t border-white/[0.06]">
                        <Field label="Identity Provider Name" hint="Displayed on the login button.">
                            <Input
                                value={samlForm.idpName}
                                onChange={(e) => setSamlForm(f => ({ ...f, idpName: e.target.value }))}
                                className="bg-slate-900/50 border-primary/10 focus:border-primary max-w-sm"
                                placeholder="Okta, Azure AD, OneLogin…"
                            />
                        </Field>

                        <Field label="IdP Metadata URL" hint="Auto-fetches IdP configuration. Or upload metadata XML below.">
                            <Input
                                value={samlForm.metadataUrl}
                                onChange={(e) => setSamlForm(f => ({ ...f, metadataUrl: e.target.value }))}
                                className="bg-slate-900/50 border-primary/10 focus:border-primary"
                                placeholder="https://your-idp.com/app/metadata"
                            />
                        </Field>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/30 border border-white/[0.04]">
                            <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-300">Service Provider Entity ID</p>
                                <p className="text-xs text-slate-500 font-mono truncate">{samlForm.entityId}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <Field label="Email Attribute">
                                <Input
                                    value={samlForm.attributeMapping.email}
                                    onChange={(e) => setSamlForm(f => ({ ...f, attributeMapping: { ...f.attributeMapping, email: e.target.value } }))}
                                    className="bg-slate-900/50 border-primary/10 focus:border-primary font-mono text-xs"
                                />
                            </Field>
                            <Field label="Name Attribute">
                                <Input
                                    value={samlForm.attributeMapping.name}
                                    onChange={(e) => setSamlForm(f => ({ ...f, attributeMapping: { ...f.attributeMapping, name: e.target.value } }))}
                                    className="bg-slate-900/50 border-primary/10 focus:border-primary font-mono text-xs"
                                />
                            </Field>
                            <Field label="Groups Attribute">
                                <Input
                                    value={samlForm.attributeMapping.groups}
                                    onChange={(e) => setSamlForm(f => ({ ...f, attributeMapping: { ...f.attributeMapping, groups: e.target.value } }))}
                                    className="bg-slate-900/50 border-primary/10 focus:border-primary font-mono text-xs"
                                />
                            </Field>
                        </div>

                        <Button onClick={handleSaveSaml} disabled={isPending} className="shadow-primary/20 shadow-lg">
                            <Save className="w-4 h-4 mr-2" />
                            {isPending ? 'Saving...' : 'Save SAML Config'}
                        </Button>
                    </div>
                )}

                {!samlForm.enabled && (
                    <div className="pt-2 border-t border-white/[0.06]">
                        <Button onClick={handleSaveSaml} disabled={isPending} variant="outline" className="border-white/10 hover:bg-white/5">
                            <Save className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                    </div>
                )}
            </SectionCard>
        </>
    );
}

// ── API Tab ───────────────────────────────────────────────────────────────

function ApiTab() {
    return (
        <>
            <div>
                <h2 className="text-2xl font-bold text-white">API & Webhooks</h2>
                <p className="text-sm text-slate-400 mt-1">Programmatic access and event notifications.</p>
            </div>

            <SectionCard title="REST API" description="Access LockForms data programmatically using API keys.">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-white">API Integration — Coming Soon</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            REST API v1 with scoped API keys, rate limiting, and full form & submission management.
                            Planned for the next release.
                        </p>
                    </div>
                </div>
                <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Planned Endpoints</p>
                    {[
                        ['GET /api/v1/forms', 'List and manage forms'],
                        ['GET /api/v1/forms/:id/submissions', 'Retrieve form submissions'],
                        ['POST /api/v1/forms/:slug/submit', 'Submit form answers externally'],
                        ['GET /api/v1/users', 'User management'],
                    ].map(([endpoint, desc]) => (
                        <div key={endpoint} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/30 border border-white/[0.04]">
                            <code className="text-xs text-primary font-mono">{endpoint}</code>
                            <span className="text-xs text-slate-500">— {desc}</span>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Webhooks" description="Receive real-time notifications when events occur in LockForms.">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <Server className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-white">Webhooks — Coming Soon</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Push events to your CRM, Slack, or any HTTP endpoint. HMAC-SHA256 signed payloads
                            with retry logic and delivery history.
                        </p>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Planned Events</p>
                    <div className="grid grid-cols-2 gap-2">
                        {['submission.created', 'submission.sentiment', 'form.published', 'form.updated', 'user.created', 'user.login'].map(event => (
                            <div key={event} className="px-3 py-2 rounded-lg bg-slate-900/30 border border-white/[0.04] text-xs font-mono text-slate-400">
                                {event}
                            </div>
                        ))}
                    </div>
                </div>
            </SectionCard>
        </>
    );
}

// ── AI Tab ────────────────────────────────────────────────────────────────

function AiTab({ ai, onSuccess, onError }: {
    ai: AiConfig;
    onSuccess: (m: string) => void;
    onError: (m: string) => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState(ai);
    const [sidecarStatus, setSidecarStatus] = useState<{
        online: boolean; models: string[]; error?: string;
    } | null>(null);
    const [checking, setChecking] = useState(false);

    const handleSave = () => {
        startTransition(async () => {
            const r = await saveAiConfig(form);
            r.success ? onSuccess('AI settings saved.') : onError(r.error ?? 'Failed.');
        });
    };

    const handleCheckStatus = async () => {
        setChecking(true);
        const status = await checkAiSidecarStatus();
        setSidecarStatus(status);
        setChecking(false);
    };

    return (
        <>
            <div>
                <h2 className="text-2xl font-bold text-white">AI Plugins</h2>
                <p className="text-sm text-slate-400 mt-1">Local AI sidecar control — privacy-first, no data leaves your network.</p>
            </div>

            {/* Sidecar Status */}
            <SectionCard title="AI Sidecar (Ollama)" description="Local Ollama container for offline AI processing.">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-white">Enable AI Sidecar</p>
                        <p className="text-xs text-slate-500">Adds a 3rd Docker container (lockforms-ai) running Ollama.</p>
                    </div>
                    <Toggle value={form.sidecarEnabled} onChange={(v) => setForm(f => ({ ...f, sidecarEnabled: v }))} />
                </div>

                <Field label="Sidecar URL" hint="Internal Docker network URL. Default: http://lockforms-ai:11434">
                    <Input
                        value={form.sidecarUrl}
                        onChange={(e) => setForm(f => ({ ...f, sidecarUrl: e.target.value }))}
                        className="bg-slate-900/50 border-primary/10 focus:border-primary font-mono text-xs"
                        placeholder="http://lockforms-ai:11434"
                    />
                </Field>

                <Field label="Default Model">
                    <div className="relative max-w-xs">
                        <select
                            value={form.defaultModel}
                            onChange={(e) => setForm(f => ({ ...f, defaultModel: e.target.value }))}
                            className="w-full appearance-none rounded-lg bg-slate-900/50 border border-primary/10 px-3 py-2 text-sm text-white focus:border-primary outline-none"
                        >
                            <option value="phi3">phi3 (3.8B — fastest, 2.3 GB)</option>
                            <option value="llama3">llama3 (8B — balanced, 4.7 GB)</option>
                            <option value="mistral">mistral (7B — quality, 4.1 GB)</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </Field>

                {/* Status check */}
                {sidecarStatus && (
                    <div className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                        sidecarStatus.online
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                        {sidecarStatus.online ? (
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                            <p className="font-medium">{sidecarStatus.online ? 'Sidecar Online' : 'Sidecar Offline'}</p>
                            {sidecarStatus.online && sidecarStatus.models.length > 0 && (
                                <p className="text-xs mt-1 opacity-80">
                                    Loaded models: {sidecarStatus.models.join(', ')}
                                </p>
                            )}
                            {sidecarStatus.error && (
                                <p className="text-xs mt-1 opacity-80">{sidecarStatus.error}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="border-white/10 hover:bg-white/5"
                        onClick={handleCheckStatus}
                        disabled={checking}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                        {checking ? 'Checking...' : 'Check Status'}
                    </Button>
                    <Button onClick={handleSave} disabled={isPending} className="shadow-primary/20 shadow-lg">
                        <Save className="w-4 h-4 mr-2" />
                        {isPending ? 'Saving...' : 'Save AI Settings'}
                    </Button>
                </div>
            </SectionCard>

            {/* Feature Toggles */}
            <SectionCard title="AI Features" description="Enable specific AI capabilities. Requires sidecar to be online.">
                {[
                    {
                        key: 'sentimentEnabled' as const,
                        label: 'Sentiment Analysis',
                        desc: 'Auto-tag submissions as Positive, Neutral, or Negative.',
                        model: 'phi3',
                    },
                    {
                        key: 'redactionEnabled' as const,
                        label: 'PII Redaction',
                        desc: 'Scan text fields for personal information before saving.',
                        model: 'phi3 / mistral',
                    },
                    {
                        key: 'summarizationEnabled' as const,
                        label: 'Response Summarization',
                        desc: 'Generate AI summaries of form responses on demand.',
                        model: 'llama3 (recommended)',
                    },
                ].map(feature => (
                    <div key={feature.key} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                        <div className="flex-1 pr-4">
                            <p className="text-sm font-medium text-white">{feature.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{feature.desc}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5 font-mono">Model: {feature.model}</p>
                        </div>
                        <Toggle
                            value={form[feature.key]}
                            onChange={(v) => setForm(f => ({ ...f, [feature.key]: v }))}
                        />
                    </div>
                ))}
            </SectionCard>

            {/* Air-gap note */}
            <div className="flex gap-3 p-4 rounded-xl bg-slate-900/30 border border-white/[0.06]">
                <Lock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400">
                    <p className="font-medium text-slate-300 mb-1">Air-Gap Deployment</p>
                    <p>For environments without internet access, pre-bake Ollama models into the Docker image or provide them via volume mount.
                    All AI processing stays on-premise — zero external API calls.</p>
                </div>
            </div>
        </>
    );
}

// ── License Tab ───────────────────────────────────────────────────────────

function LicenseTab({ license, onSuccess, onError }: {
    license: LicenseStatus;
    onSuccess: (m: string) => void;
    onError: (m: string) => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [licenseJson, setLicenseJson] = useState('');
    const [error, setError] = useState('');

    const handleActivate = () => {
        setError('');
        if (!licenseJson.trim()) {
            setError('Please paste your license key.');
            return;
        }
        startTransition(async () => {
            const r = await activateLicense(licenseJson.trim());
            if (r.success) {
                onSuccess('License activated successfully.');
                setLicenseJson('');
            } else {
                setError(r.error ?? 'Failed to activate license.');
                onError(r.error ?? 'Failed.');
            }
        });
    };

    const features = license.data?.features ?? [];
    const allFeatures = [
        { key: 'ai', label: 'AI Analytics' },
        { key: 'saml', label: 'SAML / SSO' },
        { key: 'ldap', label: 'LDAP / AD' },
        { key: 'api', label: 'REST API' },
        { key: 'whitelabel', label: 'White Label' },
        { key: 'unlimited_forms', label: 'Unlimited Forms' },
        { key: 'export', label: 'Export' },
        { key: 'audit_log', label: 'Audit Log' },
    ];

    const expiresAt = license.data?.expiresAt ? new Date(license.data.expiresAt) : null;
    const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null;

    return (
        <>
            <div>
                <h2 className="text-2xl font-bold text-white">License Management</h2>
                <p className="text-sm text-slate-400 mt-1">RSA-2048 signed license keys for appliance deployments.</p>
            </div>

            {/* Current Status */}
            <SectionCard title="License Status">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        license.valid ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                        {license.valid
                            ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            : <AlertCircle className="w-6 h-6 text-red-400" />
                        }
                    </div>
                    <div>
                        <p className={`text-lg font-bold ${license.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                            {license.valid ? 'License Active' : 'No Valid License'}
                        </p>
                        <p className="text-sm text-slate-400">
                            {license.valid
                                ? `${license.data?.licensee ?? 'Unknown'} — ${license.data?.plan ?? ''} plan`
                                : (license.reason ?? 'No license file installed.')}
                        </p>
                    </div>
                </div>

                {license.valid && license.data && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {license.data.seats && (
                            <div className="p-3 rounded-lg bg-slate-900/30 border border-white/[0.04]">
                                <p className="text-xs text-slate-500">Seats</p>
                                <p className="text-sm font-semibold text-white mt-0.5">{license.data.seats} licensed</p>
                            </div>
                        )}
                        {expiresAt && (
                            <div className="p-3 rounded-lg bg-slate-900/30 border border-white/[0.04]">
                                <p className="text-xs text-slate-500">Expires</p>
                                <p className="text-sm font-semibold text-white mt-0.5">
                                    {expiresAt.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {daysLeft !== null && (
                                        <span className={`ml-2 text-xs font-normal ${daysLeft < 30 ? 'text-amber-400' : 'text-slate-400'}`}>
                                            ({daysLeft}d left)
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {license.valid && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Licensed Features</p>
                        <div className="grid grid-cols-4 gap-2">
                            {allFeatures.map(f => (
                                <div key={f.key} className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
                                    features.includes(f.key)
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : 'bg-slate-900/30 border-white/[0.04] text-slate-600'
                                }`}>
                                    {features.includes(f.key) ? '✓' : '✕'} {f.label}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* Activate License */}
            <SectionCard
                title={license.valid ? 'Update License' : 'Activate License'}
                description="Paste your license key JSON below. Contact sales@lockforms.io for licensing."
            >
                <div className="p-4 rounded-lg border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
                    <div className="flex flex-col items-center gap-2 mb-3">
                        <Upload className="w-6 h-6 text-slate-500" />
                        <p className="text-xs text-slate-500">Paste license key JSON</p>
                    </div>
                    <textarea
                        value={licenseJson}
                        onChange={(e) => setLicenseJson(e.target.value)}
                        rows={6}
                        className="w-full rounded-lg bg-slate-900/50 border border-primary/10 px-3 py-2 text-xs font-mono text-white focus:border-primary outline-none transition-all resize-none"
                        placeholder={'{\n  "data": { ... },\n  "signature": "..."\n}'}
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <Button
                    onClick={handleActivate}
                    disabled={isPending || !licenseJson.trim()}
                    className="shadow-primary/20 shadow-lg"
                >
                    <Key className="w-4 h-4 mr-2" />
                    {isPending ? 'Activating...' : 'Activate License'}
                </Button>
            </SectionCard>

            {/* Hardware ID */}
            <SectionCard title="Hardware Fingerprint" description="Required for appliance-mode license binding.">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/30 border border-white/[0.04]">
                    <Server className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                        <p className="text-xs text-slate-500">Hardware ID</p>
                        <p className="text-sm font-mono text-white mt-0.5">
                            {license.data?.hardwareId ?? 'Not verified — hardware fingerprinting not yet enabled'}
                        </p>
                    </div>
                </div>
                <p className="text-xs text-slate-500">
                    The hardware ID is bound to this server when a license is issued.
                    Provide this ID to sales@lockforms.io when purchasing a license.
                </p>
            </SectionCard>
        </>
    );
}
