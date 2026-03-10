import { Button } from '@/components/ui/button';
import { Plus, BarChart2, Clock, FileText, Hash, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import prisma from '@/lib/db';
import Link from 'next/link';
import { DeleteFormButton } from './DeleteFormButton';
import { CopyFormButton } from './CopyFormButton';

async function getForms() {
    try {
        const forms = await prisma.form.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { submissions: true }
                }
            }
        });
        return forms;
    } catch (error) {
        console.error('Error fetching forms:', error);
        return [];
    }
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    const days = Math.floor(seconds / 86400);
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

function getQuestionCount(schema: any): number {
    if (Array.isArray(schema)) return schema.length;
    return 0;
}

// Generate a deterministic accent color from the form title
function getCardAccent(title: string): string {
    const accents = [
        'from-violet-500/20 to-indigo-500/10',
        'from-cyan-500/20 to-blue-500/10',
        'from-emerald-500/20 to-teal-500/10',
        'from-amber-500/20 to-orange-500/10',
        'from-rose-500/20 to-pink-500/10',
        'from-fuchsia-500/20 to-purple-500/10',
    ];
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return accents[Math.abs(hash) % accents.length];
}

export default async function AdminDashboard() {
    const forms = await getForms();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white tracking-tight">Your Forms</h2>
                    <p className="text-muted-foreground mt-1">Manage and monitor your secure forms.</p>
                </div>
                <Link href="/admin/builder">
                    <Button className="shadow-lg shadow-primary-500/20 rounded-xl px-6 h-11 font-semibold">
                        <Plus className="mr-2 h-4 w-4" /> Create Form
                    </Button>
                </Link>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total Forms</p>
                    <p className="text-2xl font-bold text-white mt-1">{forms.length}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Published</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{forms.filter(f => f.isPublished).length}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Drafts</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{forms.filter(f => !f.isPublished).length}</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total Responses</p>
                    <p className="text-2xl font-bold text-primary-400 mt-1">{forms.reduce((sum, f) => sum + f._count.submissions, 0)}</p>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Create New Card */}
                <Link href="/admin/builder" className="group" id="create-new-form-card">
                    <Card className="h-[320px] border-dashed border-2 border-white/10 bg-transparent hover:border-primary-500/50 hover:bg-primary-500/5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4 group-hover:scale-[1.02]">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary-500/30">
                            <Plus className="h-8 w-8 text-white/50 group-hover:text-white transition-colors" />
                        </div>
                        <p className="font-semibold text-muted-foreground group-hover:text-primary-300 transition-colors">Create New Form</p>
                        <p className="text-xs text-muted-foreground/50">Start from scratch</p>
                    </Card>
                </Link>

                {/* Form Cards */}
                {forms.map((form) => {
                    const questionCount = getQuestionCount(form.schema);
                    const accentGradient = getCardAccent(form.title);

                    return (
                        <Card
                            key={form.id}
                            id={`form-card-${form.id}`}
                            className="group relative overflow-hidden hover:border-primary-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1 h-[320px] flex flex-col"
                        >
                            {/* Accent gradient strip at top */}
                            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${accentGradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

                            {/* Background hover glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-transparent to-primary-500/0 group-hover:from-primary-500/[0.03] group-hover:to-primary-500/[0.06] transition-all duration-500" />

                            <CardHeader className="pb-3 relative z-10">
                                <div className="flex justify-between items-start gap-3">
                                    <CardTitle className="truncate text-lg font-bold text-white group-hover:text-primary-200 transition-colors leading-snug">
                                        {form.title}
                                    </CardTitle>
                                    {/* Status Badge */}
                                    {form.isPublished ? (
                                        <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#22c55e] animate-pulse" />
                                            Live
                                        </span>
                                    ) : (
                                        <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold uppercase tracking-wider">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                            Draft
                                        </span>
                                    )}
                                </div>
                                <CardDescription className="flex items-center gap-3 text-xs mt-1">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-muted-foreground/70" />
                                        {formatTimeAgo(form.updatedAt)}
                                    </span>
                                    {questionCount > 0 && (
                                        <span className="flex items-center gap-1 text-muted-foreground/60">
                                            <Hash className="w-3 h-3" />
                                            {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                                        </span>
                                    )}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 relative z-10 pb-3">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center group/stat hover:bg-white/[0.06] transition-colors">
                                        <div className="text-2xl font-bold text-white group-hover/stat:text-primary-300 transition-colors">
                                            {form._count.submissions}
                                        </div>
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mt-1">
                                            Responses
                                        </div>
                                    </div>
                                    <Link
                                        href={`/admin/submissions/${form.id}`}
                                        className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center flex flex-col items-center justify-center hover:bg-primary-500/10 hover:border-primary-500/20 transition-all group/analytics"
                                    >
                                        <BarChart2 className="w-6 h-6 text-primary-400/50 group-hover/analytics:text-primary-400 transition-colors" />
                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mt-1 group-hover/analytics:text-primary-300">
                                            Analytics
                                        </div>
                                    </Link>
                                </div>

                                {/* Description preview (if exists) */}
                                {form.description && (
                                    <p className="text-xs text-muted-foreground/60 mt-3 line-clamp-2 leading-relaxed">
                                        {form.description}
                                    </p>
                                )}
                            </CardContent>

                            <CardFooter className="pt-0 relative z-10 border-t border-white/[0.04] py-3 px-6 gap-1 flex justify-between items-center">
                                {/* Primary Action */}
                                <Link href={`/admin/builder?id=${form.id}`} className="flex-1 mr-2">
                                    <Button
                                        variant="secondary"
                                        className="w-full bg-white/5 hover:bg-white/10 hover:text-white border-white/5 rounded-lg h-9 text-sm font-medium group/edit"
                                    >
                                        Edit
                                        <ArrowUpRight className="w-3.5 h-3.5 ml-1 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                                    </Button>
                                </Link>

                                {/* Action Icons */}
                                <div className="flex items-center gap-0.5">
                                    <CopyFormButton id={form.id} title={form.title} />
                                    <Link href={`/admin/submissions/${form.id}`}>
                                        <Button size="icon" variant="ghost" className="hover:bg-primary-500/20 hover:text-primary-300 w-9 h-9">
                                            <BarChart2 className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <DeleteFormButton id={form.id} title={form.title} />
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Empty State */}
            {forms.length === 0 && (
                <div className="text-center py-16">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No forms yet</h3>
                    <p className="text-sm text-muted-foreground mb-6">Create your first form to get started.</p>
                    <Link href="/admin/builder">
                        <Button className="shadow-lg shadow-primary-500/20">
                            <Plus className="mr-2 h-4 w-4" /> Create Your First Form
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
