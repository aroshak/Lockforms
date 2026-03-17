'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { activateLicense } from '@/app/admin/settings/actions';
import {
    ShieldAlert, Key, CheckCircle2, AlertCircle,
    ArrowRight, Mail, ExternalLink, Upload,
} from 'lucide-react';

export default function LicenseExpiredPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [licenseJson, setLicenseJson] = useState('');
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    function handleActivate() {
        if (!licenseJson.trim()) return;
        startTransition(async () => {
            const res = await activateLicense(licenseJson);
            if (res.success) {
                setResult({ success: true, message: 'License activated successfully. Redirecting...' });
                setTimeout(() => router.push('/admin'), 1800);
            } else {
                setResult({ success: false, message: res.error ?? 'Activation failed.' });
            }
        });
    }

    function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setLicenseJson(ev.target?.result as string ?? '');
        reader.readAsText(file);
    }

    return (
        <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center px-4 py-16">

            {/* Background radial */}
            <div className="fixed inset-0 pointer-events-none" aria-hidden>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(130,87,229,0.12)_0%,transparent_60%)]" />
            </div>

            <div className="relative w-full max-w-xl">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5">
                        <ShieldAlert className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">License Required</h1>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Your LockForms license is missing or has expired.<br />
                        Activate a valid license to continue.
                    </p>
                </div>

                {/* Activation card */}
                <div className="glass-card rounded-2xl p-6 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Key className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-semibold text-white">Activate License</h2>
                    </div>

                    {/* Drop zone / textarea */}
                    <div
                        className="relative border-2 border-dashed border-primary/20 rounded-xl p-1 mb-4 transition-colors hover:border-primary/40"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                    >
                        <div className="flex items-center gap-2 px-3 pt-2 pb-1 text-[11px] text-slate-500">
                            <Upload className="w-3 h-3" />
                            <span>Paste license JSON or drag &amp; drop a .json file</span>
                        </div>
                        <textarea
                            className="w-full h-40 bg-transparent text-xs text-slate-300 font-mono p-3 resize-none focus:outline-none placeholder:text-slate-600"
                            placeholder={'{\n  "data": {\n    "licensee": "Your Company",\n    ...\n  },\n  "signature": "..."\n}'}
                            value={licenseJson}
                            onChange={(e) => { setLicenseJson(e.target.value); setResult(null); }}
                            spellCheck={false}
                        />
                    </div>

                    {/* Feedback */}
                    {result && (
                        <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 mb-4 ${
                            result.success
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                            {result.success
                                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                : <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            }
                            {result.message}
                        </div>
                    )}

                    <button
                        onClick={handleActivate}
                        disabled={isPending || !licenseJson.trim() || result?.success === true}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Activating...
                            </>
                        ) : (
                            <>
                                <Key className="w-4 h-4" />
                                Activate License
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>

                {/* Help links */}
                <div className="glass-card rounded-xl px-5 py-4 text-sm text-slate-400 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span>Need a license?</span>
                        <a
                            href="mailto:support@lockforms.io"
                            className="text-primary hover:text-primary/80 transition-colors"
                        >
                            support@lockforms.io
                        </a>
                    </div>
                    <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-slate-500" />
                        <span>Documentation:</span>
                        <a
                            href="https://docs.lockforms.io/licensing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors"
                        >
                            docs.lockforms.io/licensing
                        </a>
                    </div>
                </div>

                {/* Back to login */}
                <div className="text-center mt-6">
                    <Link
                        href="/admin/login"
                        className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                    >
                        ← Back to login
                    </Link>
                </div>

            </div>
        </div>
    );
}
