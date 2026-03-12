'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, Search, Calendar, User, Clock, ChevronRight, X, BarChart, List, FileIcon, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { FileAnswer } from '@/types/form';

interface SubmissionsClientProps {
    form: any;
    submissions: any[];
}

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to check if answer is a FileAnswer object
function isFileAnswer(answer: any): answer is FileAnswer {
    return (
        typeof answer === 'object' &&
        answer !== null &&
        'fileName' in answer &&
        typeof answer.fileName === 'string'
    );
}

// Helper to unwrap double-wrapped file answers (DB stores {fileName: {fileName: ..., ...}})
function unwrapFileAnswer(answer: any): FileAnswer | null {
    if (isFileAnswer(answer)) return answer;
    if (typeof answer === 'object' && answer !== null && 'fileName' in answer) {
        const inner = answer.fileName;
        if (typeof inner === 'object' && inner !== null && 'fileName' in inner && typeof inner.fileName === 'string') {
            return inner as FileAnswer;
        }
    }
    return null;
}

// Helper function to check if answer is a signature (base64 PNG string)
function isSignature(answer: any): boolean {
    return typeof answer === 'string' && answer.startsWith('data:image/png;base64,');
}

// Helper function to resolve option value to human-readable label
function resolveOptionLabel(question: any, value: string): string {
    if (!question?.options || !Array.isArray(question.options)) return value;
    const option = question.options.find((opt: any) => opt.value === value);
    return option?.label || value;
}

// Helper function to format any answer for display, resolving values to labels
function formatAnswerDisplay(answer: any, question: any): string {
    if (answer === undefined || answer === null) return '';
    const fileData = unwrapFileAnswer(answer);
    if (fileData) return `📎 ${fileData.fileName}`;
    if (isSignature(answer)) return '✍️ Digital Signature';
    if (Array.isArray(answer)) {
        return answer.map((a: any) => resolveOptionLabel(question, String(a))).join(', ');
    }
    // For choice-type questions, resolve value to label
    if (question && ['radio', 'choice', 'dropdown', 'picture-choice'].includes(question.type)) {
        return resolveOptionLabel(question, String(answer));
    }
    // For rating, show stars
    if (question?.type === 'rating') {
        const num = Number(answer);
        if (!isNaN(num) && num >= 1 && num <= 5) {
            return '★'.repeat(num) + '☆'.repeat(5 - num) + ` (${num}/5)`;
        }
    }
    return String(answer);
}

// Helper function to escape CSV values
function escapeCSV(val: string): string {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
}

// Helper function to download file from base64
function downloadFile(fileAnswer: FileAnswer): void {
    if (!fileAnswer.base64Data) {
        alert("File data not available.");
        return;
    }
    const link = document.createElement('a');
    link.href = fileAnswer.base64Data;
    link.download = fileAnswer.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function SubmissionsClient({ form, submissions }: SubmissionsClientProps) {
    const [view, setView] = useState<'list' | 'analytics'>('list');
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Extract questions from schema (can be array or object with questions property)
    const schema = form.schema as any;
    const questions: any[] = Array.isArray(schema) ? schema : (schema?.questions || []);

    // --- Analytics Logic ---
    const analyticsData = useMemo(() => {
        // 1. Submissions over time (Last 7 days)
        const last7Days = new Array(7).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const submissionsByDate = last7Days.map(date => {
            const count = submissions.filter(s => new Date(s.submittedAt).toISOString().split('T')[0] === date).length;
            return { date, count };
        });

        // 2. Question Analysis (for choice fields)
        const choiceQuestions = questions.filter(q =>
            ['radio', 'checkbox', 'dropdown', 'rating', 'picture-choice'].includes(q.type)
        );

        const questionStats = choiceQuestions.map(q => {
            const counts: Record<string, number> = {};
            submissions.forEach(sub => {
                const answer = sub.answers[q.id];
                if (Array.isArray(answer)) {
                    answer.forEach(a => counts[a] = (counts[a] || 0) + 1);
                } else if (answer) {
                    counts[answer] = (counts[answer] || 0) + 1;
                }
            });
            return {
                id: q.id,
                title: q.title,
                type: q.type,
                counts,
                total: submissions.length
            };
        });

        return { submissionsByDate, questionStats };
    }, [submissions, questions]);


    const filteredSubmissions = submissions.filter(sub =>
        JSON.stringify(sub.answers).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen pb-20 text-foreground">
            {/* Header */}
            <div className="sidebar-glass border-b border-primary/10 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="hover:bg-white/10">
                                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-white">{form.title}</h1>
                            <p className="text-xs text-muted-foreground">SUBMISSIONS</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 p-1 glass rounded-lg">
                        <button
                            onClick={() => setView('list')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white hover:bg-primary/10'}`}
                        >
                            <List className="w-4 h-4" />
                            List
                        </button>
                        <button
                            onClick={() => setView('analytics')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'analytics' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white hover:bg-primary/10'}`}
                        >
                            <BarChart className="w-4 h-4" />
                            Analytics
                        </button>
                    </div>

                    <Button
                        variant="outline"
                        className="hidden sm:flex bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                        onClick={() => {
                            const exportQuestions = questions.filter((q: any) => !['statement', 'section'].includes(q.type));
                            const headers = ['Submission ID', 'Submitted At', ...exportQuestions.map((q: any) => q.title || q.id)];
                            const rows = submissions.map((sub: any) => [
                                sub.id,
                                new Date(sub.submittedAt).toISOString(),
                                ...exportQuestions.map((q: any) => formatAnswerDisplay(sub.answers[q.id], q))
                            ]);
                            const csv = [
                                headers.map(escapeCSV).join(','),
                                ...rows.map((row: string[]) => row.map(escapeCSV).join(','))
                            ].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${form.title || 'submissions'}-${new Date().toISOString().split('T')[0]}.csv`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        }}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {view === 'analytics' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        {/* Stats Overview — glass-card with left accent border */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-card rounded-xl overflow-hidden flex">
                                <div className="w-1 bg-primary flex-shrink-0" />
                                <div className="p-6 flex items-center justify-between flex-1">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Submissions</p>
                                        <h2 className="text-4xl font-bold mt-2 text-white">{submissions.length}</h2>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <User className="w-6 h-6 text-primary" />
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card rounded-xl overflow-hidden flex">
                                <div className="w-1 bg-emerald-400 flex-shrink-0" />
                                <div className="p-6 flex items-center justify-between flex-1">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Completion Rate</p>
                                        <h2 className="text-4xl font-bold mt-2 text-white">100%</h2>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-6 h-6 text-emerald-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card rounded-xl overflow-hidden flex">
                                <div className="w-1 bg-primary-400 flex-shrink-0" />
                                <div className="p-6 flex items-center justify-between flex-1">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Last Activity</p>
                                        <h2 className="text-xl font-bold mt-2 text-white" suppressHydrationWarning>
                                            {submissions.length > 0
                                                ? new Date(submissions[0].submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : 'N/A'}
                                        </h2>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-6 h-6 text-primary-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {analyticsData.questionStats.map((stat) => (
                                <Card key={stat.id} className="glass-card">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
                                            {stat.title}
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{stat.type.toUpperCase()}</span>
                                        </CardTitle>
                                        <div className="text-xs text-muted-foreground">{stat.total} RESPONSES</div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {Object.entries(stat.counts).map(([value, count]) => {
                                                const question = questions.find((q: any) => q.id === stat.id);
                                                const displayLabel = question?.type === 'rating'
                                                    ? '★'.repeat(Number(value)) + '☆'.repeat(5 - Number(value))
                                                    : resolveOptionLabel(question, value);
                                                const percentage = Math.round((count as number / stat.total) * 100);
                                                return (
                                                    <div key={value} className="space-y-1">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-white font-medium">{displayLabel}</span>
                                                            <span className="text-muted-foreground">{percentage}% ({count})</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${percentage}%` }}
                                                                className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(130,87,229,0.5)]"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 flex gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search answers..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredSubmissions.map((sub) => (
                                <motion.div
                                    key={sub.id}
                                    layoutId={sub.id}
                                    onClick={() => setSelectedSubmission(sub)}
                                    className="p-4 bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 rounded-xl cursor-pointer transition-all group"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                #{sub.id.slice(-4)}
                                            </div>
                                            <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                                                {new Date(sub.submittedAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                                    </div>

                                    {/* Preview first 3 answers */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                                        {Object.entries(sub.answers).slice(0, 3).map(([qId, ans]) => {
                                            const question = questions.find(q => q.id === qId);

                                            const displayValue = formatAnswerDisplay(ans, question);

                                            return question ? (
                                                <div key={qId} className="text-xs p-2 rounded bg-black/20 border border-white/5 truncate">
                                                    <span className="text-muted-foreground block mb-0.5">{question.title}</span>
                                                    <span className="text-white font-medium" title={displayValue}>
                                                        {displayValue}
                                                    </span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedSubmission && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedSubmission(null)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            layoutId={selectedSubmission.id}
                            className="fixed inset-y-0 right-0 w-full max-w-xl bg-[#0B0E14] border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-black/50 backdrop-blur-md p-6 border-b border-white/10 flex justify-between items-center z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Submission Details</h2>
                                    <p className="text-sm text-muted-foreground">ID: {selectedSubmission.id}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedSubmission(null)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    {questions.map((q) => {
                                        // Skip display-only question types (no user input)
                                        if (['statement', 'section'].includes(q.type)) return null;
                                        const answer = selectedSubmission.answers[q.id];
                                        const fileData = unwrapFileAnswer(answer);
                                        return (
                                            <div key={q.id} className="space-y-2">
                                                <h4 className="text-sm font-medium text-primary-200">{q.title}</h4>
                                                <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-sm text-white break-words">
                                                    {fileData ? (
                                                        // File Upload Answer (handles both direct and double-wrapped)
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <FileIcon className="w-8 h-8 text-primary" />
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-white">{fileData.fileName}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {fileData.fileSize ? formatFileSize(fileData.fileSize) : 'Size unknown'} • {fileData.fileType || 'Unknown Type'}
                                                                    </p>
                                                                </div>
                                                                {fileData.base64Data && (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => downloadFile(fileData)}
                                                                        className="bg-primary/20 hover:bg-primary/30 text-primary-200 border border-primary/30"
                                                                    >
                                                                        <Download className="w-4 h-4 mr-1" />
                                                                        Download
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            {fileData.fileType?.startsWith('image/') && fileData.base64Data && (
                                                                <div className="mt-2">
                                                                    <img
                                                                        src={fileData.base64Data}
                                                                        alt={fileData.fileName}
                                                                        className="max-w-full h-auto rounded-lg border border-white/10"
                                                                        style={{ maxHeight: '300px' }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : isSignature(answer) ? (
                                                        // Signature Answer
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-primary-200 mb-2">
                                                                <ImageIcon className="w-4 h-4" />
                                                                <span className="text-xs font-medium">Digital Signature</span>
                                                            </div>
                                                            <div className="bg-white rounded-lg p-4 border-2 border-primary/20">
                                                                <img
                                                                    src={answer}
                                                                    alt="Signature"
                                                                    className="w-full h-auto"
                                                                    style={{ maxHeight: '150px', objectFit: 'contain' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : Array.isArray(answer) ? (
                                                        // Checkbox Array Answer
                                                        <div className="flex flex-wrap gap-2">
                                                            {answer.map((a: unknown, i: number) => (
                                                                <span key={i} className="px-2 py-1 bg-primary/20 border border-primary/30 rounded text-xs font-medium text-primary-200">
                                                                    {(() => { const f = unwrapFileAnswer(a); return f ? `📎 ${f.fileName}` : typeof a === 'object' ? JSON.stringify(a) : resolveOptionLabel(q, String(a)); })()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : typeof answer === 'object' && answer !== null ? (
                                                        // Unknown object - render as JSON
                                                        <span className="text-muted-foreground">{JSON.stringify(answer)}</span>
                                                    ) : answer && q.type === 'rating' ? (
                                                        // Rating Answer — show stars
                                                        <span>{'★'.repeat(Number(answer))}{'☆'.repeat(5 - Number(answer))} ({answer}/5)</span>
                                                    ) : answer && ['radio', 'choice', 'dropdown', 'picture-choice'].includes(q.type) ? (
                                                        // Choice Answer — resolve value to label
                                                        <span>{resolveOptionLabel(q, String(answer))}</span>
                                                    ) : answer ? (
                                                        // Regular Text Answer
                                                        <span>{String(answer)}</span>
                                                    ) : (
                                                        // No Answer
                                                        <span className="text-muted-foreground italic">Skipped / No Answer</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
