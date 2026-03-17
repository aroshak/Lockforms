import prisma from '@/lib/db';
import Link from 'next/link';
import { DeleteFormButton } from './DeleteFormButton';
import { CopyFormButton } from './CopyFormButton';

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getDashboardData() {
    const now = new Date();
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const [forms, recentSubs, chartSubs] = await Promise.all([
        prisma.form.findMany({
            orderBy: { updatedAt: 'desc' },
            include: { _count: { select: { submissions: true } } },
        }),
        prisma.submission.findMany({
            orderBy: { submittedAt: 'desc' },
            take: 5,
            include: { form: { select: { id: true, title: true } } },
        }),
        prisma.submission.findMany({
            where: { submittedAt: { gte: fourteenDaysAgo } },
            select: { submittedAt: true },
        }),
    ]);

    // Build 14-day chart data
    const dayMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const sub of chartSubs) {
        const key = sub.submittedAt.toISOString().slice(0, 10);
        if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }
    const chartData = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));

    return { forms, recentSubs, chartData };
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

function formatSubmitTime(date: Date): string {
    return date.toLocaleDateString('en-AU', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
    const { forms, recentSubs, chartData } = await getDashboardData();

    const totalResponses  = forms.reduce((sum, f) => sum + f._count.submissions, 0);
    const publishedCount  = forms.filter(f => f.isPublished).length;
    const draftCount      = forms.filter(f => !f.isPublished).length;
    const publishedPct    = forms.length ? Math.round((publishedCount / forms.length) * 100) : 0;
    const responsePct     = Math.min(100, forms.length ? Math.round((totalResponses / (forms.length * 10)) * 100) : 0);

    return (
        <>
            {/* ── Header ── */}
            <header className="h-20 flex items-center justify-between px-8 border-b border-slate-800 sticky top-0 bg-[#0B0E14]/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">Analytics Dashboard</h2>
                    </div>
                    <div className="h-8 w-px bg-slate-800" />
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select className="appearance-none bg-slate-800 border-none rounded-lg py-2 pl-4 pr-10 text-sm font-medium text-white focus:ring-2 focus:ring-primary cursor-pointer min-w-[180px]">
                                <option>All Forms</option>
                                {forms.map(f => (
                                    <option key={f.id}>{f.title}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
                        </div>
                    </div>
                </div>
                <Link href="/admin/builder">
                    <button className="flex items-center gap-2 bg-primary hover:brightness-110 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Create Form
                    </button>
                </Link>
            </header>

            <div className="p-8 space-y-8">

                {/* ── 3 Stat Cards — exact Stitch design ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <div className="glass-card p-6 rounded-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <p className="text-sm font-medium text-slate-400 mb-1">Total Forms</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-white">{forms.length}</h3>
                            {publishedCount > 0 && (
                                <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
                                    {publishedCount} live
                                </span>
                            )}
                        </div>
                        <div className="mt-4 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, forms.length * 10))}%` }} />
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />
                        <p className="text-sm font-medium text-slate-400 mb-1">Published Rate</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-white">{publishedPct}%</h3>
                            <span className={`text-xs font-bold flex items-center gap-0.5 ${publishedPct >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{publishedPct >= 50 ? 'trending_up' : 'trending_down'}</span>
                                {publishedCount} of {forms.length}
                            </span>
                        </div>
                        <div className="mt-4 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-primary/50 h-full rounded-full" style={{ width: `${Math.max(4, publishedPct)}%` }} />
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                        <p className="text-sm font-medium text-slate-400 mb-1">Total Responses</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-white">{totalResponses}</h3>
                            {totalResponses > 0 && (
                                <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
                                    +new
                                </span>
                            )}
                        </div>
                        <div className="mt-4 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.max(4, responsePct)}%` }} />
                        </div>
                    </div>

                </div>

                {/* ── Charts Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Line Chart */}
                    <div className="lg:col-span-2 glass-card p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold text-white">Submissions Over Time</h4>
                            <div className="flex gap-2">
                                <button className="text-xs px-2 py-1 rounded bg-slate-800 text-white">Days</button>
                                <button className="text-xs px-2 py-1 rounded text-slate-400 hover:bg-slate-800 transition-colors">Weeks</button>
                            </div>
                        </div>
                        <LineChart data={chartData} />
                    </div>

                    {/* Donut Chart — exact Stitch design */}
                    <div className="glass-card p-6 rounded-lg flex flex-col items-center justify-between">
                        <h4 className="font-bold w-full text-left mb-6 text-white">Form Status</h4>
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="stroke-slate-800"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" strokeWidth="4"
                                />
                                <path
                                    stroke="#8257e5"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    strokeDasharray={`${publishedPct}, 100`}
                                    strokeLinecap="round"
                                    strokeWidth="4"
                                />
                            </svg>
                            <div className="absolute text-center">
                                <p className="text-3xl font-bold text-white">{publishedPct}%</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Published</p>
                            </div>
                        </div>
                        <div className="w-full space-y-2 mt-6">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                    <span className="text-slate-400">Published</span>
                                </div>
                                <span className="font-bold text-white">{publishedCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                                    <span className="text-slate-400">Draft</span>
                                </div>
                                <span className="font-bold text-white">{draftCount}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Recent Responses Table — exact Stitch design ── */}
                {recentSubs.length > 0 && (
                    <div className="glass-card rounded-lg overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h4 className="font-bold text-white">Recent Responses</h4>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input
                                        className="bg-slate-800 border-none rounded-lg py-1.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-primary w-56 outline-none"
                                        placeholder="Search responses..."
                                        type="text"
                                        readOnly
                                    />
                                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '18px' }}>search</span>
                                </div>
                                <button className="p-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_list</span>
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-xs text-slate-400 border-b border-slate-800 bg-slate-800/20">
                                        <th className="px-6 py-4 font-semibold">Form</th>
                                        <th className="px-6 py-4 font-semibold">Submitted</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-800">
                                    {recentSubs.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{sub.form.title}</td>
                                            <td className="px-6 py-4 text-slate-400">{formatSubmitTime(sub.submittedAt)}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    Completed
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/admin/submissions/${sub.form.id}`}>
                                                    <button className="text-primary hover:underline text-xs font-bold">View</button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                            <p className="text-xs text-slate-500">Showing {recentSubs.length} of {totalResponses} entries</p>
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 rounded bg-slate-800 text-slate-500 cursor-not-allowed">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                                </button>
                                <button className="w-8 h-8 rounded bg-primary text-white text-xs font-bold">1</button>
                                <button className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── All Forms Grid ── */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-white">All Forms</h4>
                        <span className="text-xs text-slate-500">{forms.length} forms</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

                        {/* Create New */}
                        <Link href="/admin/builder" className="group">
                            <div className="h-full min-h-[180px] border border-dashed border-slate-800 rounded-lg bg-transparent hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                    <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors" style={{ fontSize: '24px' }}>add_circle</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-slate-400 group-hover:text-primary transition-colors">Create New Form</p>
                                    <p className="text-xs text-slate-600 mt-0.5">Start from scratch</p>
                                </div>
                            </div>
                        </Link>

                        {forms.map((form) => (
                            <FormCard
                                key={form.id}
                                id={form.id}
                                title={form.title}
                                isPublished={form.isPublished}
                                updatedAt={form.updatedAt}
                                questionCount={getQuestionCount(form.schema)}
                                submissionCount={form._count.submissions}
                            />
                        ))}
                    </div>

                    {forms.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-slate-600" style={{ fontSize: '32px' }}>description</span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No forms yet</h3>
                            <p className="text-sm text-slate-500 mb-6">Create your first form to get started.</p>
                            <Link href="/admin/builder">
                                <button className="inline-flex items-center gap-2 bg-primary hover:brightness-110 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary/20">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                                    Create Your First Form
                                </button>
                            </Link>
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}

// ─── Line Chart (pure SVG — matches Stitch style) ─────────────────────────────

function LineChart({ data }: { data: { date: string; count: number }[] }) {
    const maxCount = Math.max(...data.map(d => d.count), 1);

    // Normalise to 0-100 coordinate space matching the Stitch SVG viewBox
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (d.count / maxCount) * 90; // leave 10% top padding
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    // Clip path for area fill (same technique as Stitch code.html)
    const clipPath = [
        '0,100',
        ...data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - (d.count / maxCount) * 90;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }),
        '100,100',
    ].join(' ');

    const formatDay = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="h-[300px] w-full relative">
            {/* Y-axis labels */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 text-[10px] text-slate-500 pointer-events-none">
                {[maxCount, Math.ceil(maxCount * 0.75), Math.ceil(maxCount * 0.5), Math.ceil(maxCount * 0.25), 0].map((v, i) => (
                    <div key={i} className="border-b border-slate-800 w-full pb-1">{v}</div>
                ))}
            </div>

            {/* Chart SVG */}
            <div className="relative w-full h-full pl-8">
                {/* Area gradient fill */}
                <div
                    className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-lg"
                    style={{ clipPath: `polygon(${clipPath.split(' ').map(p => { const [x, y] = p.split(','); return `${x}% ${y}%`; }).join(', ')})` }}
                />
                {/* Line */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <polyline
                        fill="none"
                        points={points}
                        stroke="#8257e5"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {/* Data point dots */}
                    {data.map((d, i) => d.count > 0 && (
                        <circle
                            key={i}
                            cx={`${((i / (data.length - 1)) * 100).toFixed(1)}`}
                            cy={`${(100 - (d.count / maxCount) * 90).toFixed(1)}`}
                            r="1.5"
                            fill="#8257e5"
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                </svg>

                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-slate-500 translate-y-5">
                    <span>{formatDay(data[0]?.date ?? '')}</span>
                    <span>{formatDay(data[Math.floor(data.length / 2)]?.date ?? '')}</span>
                    <span>{formatDay(data[data.length - 1]?.date ?? '')}</span>
                </div>
            </div>
        </div>
    );
}

// ─── Form Card ────────────────────────────────────────────────────────────────

function FormCard({ id, title, isPublished, updatedAt, questionCount, submissionCount }: {
    id: string;
    title: string;
    isPublished: boolean;
    updatedAt: Date;
    questionCount: number;
    submissionCount: number;
}) {
    return (
        <div className="glass-card rounded-lg overflow-hidden flex flex-col group hover:border-primary/30 transition-all duration-300">
            <div className={`h-1 w-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />

            <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
                        {title}
                    </h3>
                    {isPublished ? (
                        <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                        </span>
                    ) : (
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase">
                            Draft
                        </span>
                    )}
                </div>

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

            <div className="px-5 py-3 border-t border-slate-800 flex items-center gap-2">
                <Link href={`/admin/builder?id=${id}`} className="flex-1">
                    <button className="w-full h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors">
                        Edit
                    </button>
                </Link>
                <CopyFormButton id={id} title={title} />
                <Link href={`/admin/submissions/${id}`}>
                    <button className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-primary transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bar_chart</span>
                    </button>
                </Link>
                <DeleteFormButton id={id} title={title} />
            </div>
        </div>
    );
}
