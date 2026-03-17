'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Question } from '@/types/form';
import { Star, Upload, Calendar, Image as ImageIcon, Plus, PenTool, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableQuestionItemProps {
    question:   Question;
    isSelected: boolean;
    onDelete:   () => void;
    onUpdate:   (updates: Partial<Question>) => void;
}

export function SortableQuestionItem({ question, isSelected, onDelete, onUpdate }: SortableQuestionItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex:   isDragging ? 50 : 'auto',
        opacity:  isDragging ? 0.5 : 1,
    } as React.CSSProperties;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn(
                'group relative rounded-xl p-6 transition-all',
                isDragging
                    ? 'shadow-2xl scale-[1.02] glass-active border-2 border-primary/50'
                    : isSelected
                        ? 'glass-active border-2 border-primary/50 ring-4 ring-primary/10'
                        : 'glass border border-primary/10 hover:border-primary/30'
            )}
        >
            {/* ── Action buttons — top-right corner ── */}
            <div className={cn(
                'absolute -right-3 -top-3 flex items-center gap-1 transition-opacity duration-200',
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}>
                {/* Drag handle (always show on hover) */}
                <button
                    {...listeners}
                    className="flex h-8 w-8 cursor-grab items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 shadow-xl hover:text-white transition-colors"
                    title="Drag to reorder"
                    onClick={e => e.stopPropagation()}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>drag_indicator</span>
                </button>

                {/* Edit — only on selected */}
                {isSelected && (
                    <button
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-xl"
                        title="Edit field"
                        onClick={e => e.stopPropagation()}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                    </button>
                )}

                {/* Delete */}
                <button
                    onClick={e => { e.stopPropagation(); onDelete(); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-red-400 shadow-xl transition-all hover:bg-red-500 hover:text-white"
                    title="Delete field"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                </button>
            </div>

            {/* ── Field label ── */}
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-primary">
                {question.title || <span className="italic text-primary/40">Untitled Field</span>}
            </label>

            {/* ── Inline title editor ── */}
            <input
                value={question.title}
                onChange={e => onUpdate({ title: e.target.value })}
                placeholder="Type your question here…"
                onClick={e => e.stopPropagation()}
                className="mb-3 w-full bg-transparent text-sm font-medium text-slate-300 placeholder:text-white/20 focus:outline-none"
            />

            {/* ── Input preview ── */}
            <FieldPreview question={question} onUpdate={onUpdate} />

            {/* ── Bottom badges (selected state) ── */}
            {isSelected && (
                <div className="mt-4 flex items-center gap-2 border-t border-primary/10 pt-3">
                    {question.required && (
                        <span className="rounded bg-primary/20 px-2 py-1 text-[10px] font-bold uppercase text-primary">Required</span>
                    )}
                    <span className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase text-slate-400">{question.type}</span>
                </div>
            )}
        </div>
    );
}

// ─── Field preview per type ────────────────────────────────────────────────────

function FieldPreview({ question, onUpdate }: { question: Question; onUpdate: (u: Partial<Question>) => void }) {
    const inputCls = 'w-full rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-400';

    switch (question.type) {

        case 'text':
        case 'email':
        case 'number':
        case 'url':
        case 'website':
            return <div className={inputCls}>{question.placeholder || 'Enter your answer…'}</div>;

        case 'paragraph':
            return <div className={cn(inputCls, 'h-20')}>{question.placeholder || 'Long answer text…'}</div>;

        case 'dropdown':
            return (
                <div>
                    <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-900/50 p-3 text-white">
                        <span className="text-sm text-slate-400">Select an option…</span>
                        <ChevronDown className="h-4 w-4 text-primary opacity-70" />
                    </div>
                    <InlineOptions question={question} onUpdate={onUpdate} numbered />
                </div>
            );

        case 'radio':
        case 'choice':
            return <InlineOptions question={question} onUpdate={onUpdate} variant="radio" />;

        case 'checkbox':
            return <InlineOptions question={question} onUpdate={onUpdate} variant="checkbox" />;

        case 'picture-choice':
            return <PictureChoicePreview question={question} onUpdate={onUpdate} />;

        case 'rating':
            return (
                <div className="flex gap-2">
                    {[1,2,3,4,5].map(i => (
                        <Star key={i} className="h-6 w-6 text-white/10" />
                    ))}
                </div>
            );

        case 'scale':
            return (
                <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: (question.max ?? 10) - (question.min ?? 1) + 1 }, (_, i) => (question.min ?? 1) + i).map(n => (
                        <div key={n} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-white/30">
                            {n}
                        </div>
                    ))}
                </div>
            );

        case 'date':
        case 'datetime':
            return (
                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                    <span className="text-sm text-slate-500">Select a date</span>
                    <Calendar className="h-4 w-4 text-primary/50" />
                </div>
            );

        case 'file':
            return (
                <div className="flex h-20 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 bg-white/[0.02] text-muted-foreground">
                    <Upload className="mb-1 h-5 w-5 opacity-40" />
                    <span className="text-xs">File upload area</span>
                </div>
            );

        case 'signature':
            return (
                <div className="relative h-20 w-full rounded-lg border-b border-white/10 bg-[#0B0E14] p-4">
                    <PenTool className="absolute right-4 top-4 h-4 w-4 text-white/20" />
                    <div className="absolute bottom-4 left-4 right-4 h-px bg-white/10" />
                </div>
            );

        case 'statement':
            return (
                <div className="rounded border-l-2 border-primary bg-primary/10 p-3 text-xs text-primary/80">
                    This block displays text without collecting input.
                </div>
            );

        default:
            return <div className={inputCls}>Answer field</div>;
    }
}

// ── Inline options editor (radio / checkbox / numbered) ──────────────────────

function InlineOptions({
    question, onUpdate, variant, numbered
}: {
    question: Question;
    onUpdate: (u: Partial<Question>) => void;
    variant?:  'radio' | 'checkbox';
    numbered?: boolean;
}) {
    const options = question.options ?? [];

    const updateOption = (index: number, label: string) => {
        const next = options.map((o, i) => i === index ? { ...o, label } : o);
        onUpdate({ options: next });
    };

    const removeOption = (id: string) => onUpdate({ options: options.filter(o => o.id !== id) });

    const addOption = () => onUpdate({
        options: [...options, { id: crypto.randomUUID(), label: `Option ${options.length + 1}`, value: `option_${options.length + 1}` }]
    });

    return (
        <div className="space-y-2">
            {options.map((option, i) => (
                <div key={option.id} className="group/opt flex items-center gap-2">
                    {/* indicator */}
                    {variant === 'radio' && (
                        <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-white/20">
                            <div className="h-2 w-2 rounded-full bg-white/10" />
                        </div>
                    )}
                    {variant === 'checkbox' && (
                        <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md border border-white/20">
                            <div className="h-2 w-2 rounded-sm bg-white/10" />
                        </div>
                    )}
                    {numbered && (
                        <span className="w-5 flex-shrink-0 text-center text-xs text-white/20">{i + 1}.</span>
                    )}
                    <input
                        value={option.label}
                        onChange={e => updateOption(i, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 border-b border-transparent bg-transparent text-sm text-slate-300 transition-colors focus:border-white/20 focus:outline-none focus:text-white"
                    />
                    <button
                        onClick={e => { e.stopPropagation(); removeOption(option.id); }}
                        className="p-1 text-muted-foreground opacity-0 transition-all hover:text-red-400 group-hover/opt:opacity-100"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            ))}
            <button
                onClick={e => { e.stopPropagation(); addOption(); }}
                className="pl-6 text-xs font-medium text-primary/70 transition-colors hover:text-primary"
            >
                + Add Option
            </button>
        </div>
    );
}

// ── Picture choice grid ───────────────────────────────────────────────────────

function PictureChoicePreview({ question, onUpdate }: { question: Question; onUpdate: (u: Partial<Question>) => void }) {
    const options = question.options ?? [];

    return (
        <div className="grid grid-cols-2 gap-3 mt-2">
            {options.map((option, index) => (
                <div key={option.id} className="group/pc relative overflow-hidden rounded-lg border border-white/10 bg-[#0B0E14]">
                    <div className="flex aspect-video items-center justify-center bg-white/5">
                        {option.imageUrl
                            ? <img src={option.imageUrl} alt="" className="h-full w-full object-cover" />
                            : <ImageIcon className="h-6 w-6 text-white/20" />
                        }
                    </div>
                    <div className="flex items-center gap-2 p-2">
                        <div className="h-3 w-3 flex-shrink-0 rounded-full border border-white/20" />
                        <input
                            value={option.label}
                            onChange={e => {
                                const next = [...options];
                                next[index] = { ...option, label: e.target.value };
                                onUpdate({ options: next });
                            }}
                            onClick={e => e.stopPropagation()}
                            className="w-full bg-transparent text-xs text-slate-300 focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={e => { e.stopPropagation(); onUpdate({ options: options.filter(o => o.id !== option.id) }); }}
                        className="absolute right-1 top-1 rounded bg-black/50 p-1 text-white/50 opacity-0 transition-all hover:bg-red-500/50 hover:text-white group-hover/pc:opacity-100"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            ))}
            <button
                onClick={e => {
                    e.stopPropagation();
                    onUpdate({ options: [...options, { id: crypto.randomUUID(), label: `Image ${options.length + 1}`, value: `option_${options.length + 1}` }] });
                }}
                className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            >
                <Plus className="h-5 w-5" />
                <span className="text-xs font-medium">Add Image</span>
            </button>
        </div>
    );
}
