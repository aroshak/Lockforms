import prisma from '@/lib/db';
import Link from 'next/link';
import { DeleteFormButton } from './DeleteFormButton';
import { CopyFormButton } from './CopyFormButton';

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getForms() {
    try {
        return await prisma.form.findMany({
            orderBy: { updatedAt: 'desc' },
            include: { _count: { select: { submissions: true } } }
        });
    } catch {
        return [];
    }
}

function formatTimeAgo(date: Date): string {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60)    return 'Just now';
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    const d = Math.floor(s / 86400);
    return d === 1 ? '1 day ago' : d < 30 ? `${d} days ago` : `${Math.floor(d / 30)}mo ago`;
}

function getQuestionCount(schema: unknown): number {
    if (Array.isArray(schema)) return schema.length;
    if (schema && typeof schema === 'object' && 'questions' in schema) {
        const q = (schema as { questions: unknown }).questions;
        if (Array.isArray(q)) return q.length;
    }
    return 0;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
    const forms = await getForms();

    const totalResponses  = forms.reduce((sum, f) => sum + f._count.submissions, 0);
    const publishedCount  = forms.filter(f => f.isPublished).length;
    const draftCount      = forms.filter(f => !f.isPublished).length;

    return (
        <>
            {/* ── Sticky Page Header ── */}
            <header className="h-20 flex items-center justify-between px-8 border-b border-slate-800 sticky top-0 bg-[#0B0E14]/80 backdrop-blur-md z-10">
                <div>
                    <h2 className="text-xl font-bold text-white">Your Forms</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Manage and monitor your secure forms.</p>
                </div>
                <Link href="/admin/builder">
                    <button className="flex items-center gap-2 bg-primary hover:brightness-110 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Create Form
                    </button>
                </Link>
            </header>

            {/* ── Content ── */}
            <div className="p-8 space-y-8">

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    <StatCard
                        label="Total Forms"
                        value={forms.length}
                        accentColor="bg-primary"
                        progress={Math.min(100, forms.length * 10)}
                    />
                    <StatCard
                        label="Published"
                        value={publishedCount}
                        valueColor="text-emerald-400"
                        accentColor="bg-emerald-500"
                        progress={forms.length ? Math.round((publishedCount / forms.length) * 100) : 0}
                        trend={publishedCount > 0 ? { dir: 'up', label: 'Live' } : undefined}
                    />
                    <StatCard
                        label="Drafts"
                        value={draftCount}
                        valueColor="text-amber-400"
                        accentColor="bg-amber-500"
                        progress={forms.length ? Math.round((draftCount / forms.length) * 100) : 0}
                    />
                    <StatCard
                        label="Total Responses"
                        value={totalResponses}
                        accentColor="bg-primary"
                        progress={Math.min(100, totalResponses * 5)}
                        trend={totalResponses > 0 ? { dir: 'up', label: '+new' } : undefined}
                    />

                </div>

                {/* ── Forms Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                    {/* Create New */}
                    <Link href="/admin/builder" className="group">
                        <div className="h-full min-h-[220px] border-2 border-dashed border-slate-800 rounded-lg bg-transparent hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-slate-800/60 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all duration-300">
                                <span className="material-symbols-outlined text-[28px] text-slate-500 group-hover:text-primary transition-colors">add_circle</span>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-400 group-hover:text-primary transition-colors">Create New Form</p>
                                <p className="text-xs text-slate-600 mt-0.5">Start from scratch</p>
                            </div>
                        </div>
                    </Link>

                    {/* Form Cards */}
                    {forms.map((form) => {
                        const questionCount = getQuestionCount(form.schema);
                        return (
                            <FormCard
                                key={form.id}
                                id={form.id}
                                title={form.title}
                                isPublished={form.isPublished}
                                updatedAt={form.updatedAt}
                                questionCount={questionCount}
                                submissionCount={form._count.submissions}
                            />
                        );
                    })}
                </div>

                {/* Empty State */}
                {forms.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-[32px] text-slate-600">description</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No forms yet</h3>
                        <p className="text-sm text-slate-500 mb-6">Create your first form to get started.</p>
                        <Link href="/admin/builder">
                            <button className="flex items-center gap-2 bg-primary hover:brightness-110 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary/20 mx-auto">
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Create Your First Form
                            </button>
                        </Link>
                    </div>
                )}

            </div>
        </>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
    label, value, accentColor, progress, valueColor, trend
}: {
    label:        string;
    value:        number;
    accentColor:  string;
    progress:     number;
    valueColor?:  string;
    trend?:       { dir: 'up' | 'down'; label: string };
}) {
    return (
        <div className="glass-card p-6 rounded-lg relative overflow-hidden">
            {/* Left accent bar */}
            <div className={`absolute top-0 left-0 w-1 h-full ${accentColor}`} />

            <p className="text-sm font-medium text-slate-400 mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
                <h3 className={`text-3xl font-bold ${valueColor ?? 'text-white'}`}>{value}</h3>
                {trend && (
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${trend.dir === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            {trend.dir === 'up' ? 'trending_up' : 'trending_down'}
                        </span>
                        {trend.label}
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <div className="mt-4 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${accentColor}`}
                    style={{ width: `${Math.max(2, progress)}%` }}
                />
            </div>
        </div>
    );
}

// ─── Form Card ────────────────────────────────────────────────────────────────

function FormCard({
    id, title, isPublished, updatedAt, questionCount, submissionCount
}: {
    id:              string;
    title:           string;
    isPublished:     boolean;
    updatedAt:       Date;
    questionCount:   number;
    submissionCount: number;
}) {
    return (
        <div className="glass-card rounded-lg overflow-hidden flex flex-col group hover:border-primary/30 transition-all duration-300">

            {/* Top accent strip */}
            <div className={`h-1 w-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />

            {/* Card body */}
            <div className="p-5 flex-1 flex flex-col gap-4">

                {/* Title + badge */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
                        {title}
                    </h3>
                    {isPublished ? (
                        <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                        </span>
                    ) : (
                        <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Draft
                        </span>
                    )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                        {formatTimeAgo(updatedAt)}
                    </span>
                    {questionCount > 0 && (
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>tag</span>
                            {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                        </span>
                    )}
                </div>

                {/* Stats mini grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center">
                        <p className="text-xl font-bold text-white">{submissionCount}</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">Responses</p>
                    </div>
                    <Link
                        href={`/admin/submissions/${id}`}
                        className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center flex flex-col items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all group/analytics"
                    >
                        <span className="material-symbols-outlined text-slate-500 group-hover/analytics:text-primary transition-colors" style={{ fontSize: '20px' }}>bar_chart</span>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 group-hover/analytics:text-primary mt-0.5 transition-colors">Analytics</p>
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-800 flex items-center gap-2">
                <Link href={`/admin/builder?id=${id}`} className="flex-1">
                    <button className="w-full h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors">
                        Edit
                    </button>
                </Link>
                <CopyFormButton id={id} title={title} />
                <Link href={`/admin/submissions/${id}`}>
                    <button className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-primary transition-colors flex items-center justify-center" title="View submissions">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bar_chart</span>
                    </button>
                </Link>
                <DeleteFormButton id={id} title={title} />
            </div>
        </div>
    );
}
