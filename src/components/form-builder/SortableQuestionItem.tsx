'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Question } from '@/types/form';
import { Trash2, GripVertical, Copy, ChevronDown, Star, Upload, Calendar, Image as ImageIcon, Plus, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SortableQuestionItemProps {
    question: Question;
    isSelected: boolean;
    onDelete: () => void;
    onDuplicate?: () => void;
    onUpdate: (updates: Partial<Question>) => void;
}

export function SortableQuestionItem({ question, isSelected, onDelete, onUpdate }: SortableQuestionItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            // Listeners removed from root to enable interaction with inputs
            className={cn(
                "group relative p-6 rounded-xl border transition-all duration-200 mb-3",
                isDragging ? "shadow-2xl scale-105 bg-zinc-900 border-primary/50" : "",
                isSelected
                    ? "bg-[#13161c] border-primary/50 shadow-[0_0_20px_rgba(130,87,229,0.15)] ring-1 ring-primary/20"
                    : "bg-[#0f1219] border-white/10 hover:border-white/20 hover:bg-[#181b21]"
            )}
        >
            {/* Drag Handle - Listeners applied here */}
            <div
                {...listeners}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white/10 group-hover:text-white/30 transition-colors cursor-move p-2 hover:bg-white/5 rounded-md"
            >
                <GripVertical className="h-5 w-5" />
            </div>

            <div className="pl-6 space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        {/* Inline Title Editor */}
                        <input
                            value={question.title}
                            onChange={(e) => onUpdate({ title: e.target.value })}
                            placeholder="Type your question here..."
                            className={cn(
                                "w-full bg-transparent text-sm font-semibold transition-colors focus:outline-none focus:border-b focus:border-primary/50 placeholder:text-muted-foreground/50",
                                !question.title ? "text-muted-foreground italic" : "text-white"
                            )}
                        />

                        {/* Inline Description Editor */}
                        <input
                            value={question.description || ''}
                            onChange={(e) => onUpdate({ description: e.target.value })}
                            placeholder="Description (optional)"
                            className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none focus:border-b focus:border-primary/50 placeholder:text-muted-foreground/30"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-black/40 text-muted-foreground border border-white/5">
                            {question.type}
                        </span>
                        {question.required && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-red-900/20 text-red-400 border border-red-500/20">
                                Required
                            </span>
                        )}
                    </div>
                </div>

                {/* Input Preview & Inline Options */}
                <div className="pt-2">
                    {/* Text-based inputs */}
                    {['text', 'email', 'number', 'website', 'url'].includes(question.type) && (
                        <div className="h-9 w-full rounded-md bg-[#0B0E14] border border-white/10 px-3 flex items-center text-xs text-muted-foreground/50">
                            Short answer text...
                        </div>
                    )}

                    {/* Paragraph */}
                    {question.type === 'paragraph' && (
                        <div className="h-20 w-full rounded-md bg-[#0B0E14] border border-white/10 p-3 text-xs text-muted-foreground/50">
                            Long answer text...
                        </div>
                    )}

                    {/* Radio & Choice (Circle Icons) */}
                    {['choice', 'radio'].includes(question.type) && (
                        <div className="space-y-2">
                            {question.options?.map((option, index) => (
                                <div key={option.id} className="flex items-center gap-2 group/option">
                                    <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                                        <div className="w-2 h-2 rounded-full bg-white/10" />
                                    </div>
                                    <input
                                        value={option.label}
                                        onChange={(e) => {
                                            const newOptions = [...(question.options || [])];
                                            newOptions[index] = { ...option, label: e.target.value };
                                            onUpdate({ options: newOptions });
                                        }}
                                        className="flex-1 bg-transparent text-sm text-slate-300 focus:outline-none focus:text-white border-b border-transparent focus:border-white/20 transition-colors"
                                    />
                                    <button onClick={() => { const newOptions = question.options?.filter(o => o.id !== option.id); onUpdate({ options: newOptions }); }} className="opacity-0 group-hover/option:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            ))}
                            <button onClick={() => { const newOption = { id: crypto.randomUUID(), label: `Option ${(question.options?.length || 0) + 1}`, value: `option_${(question.options?.length || 0) + 1}` }; onUpdate({ options: [...(question.options || []), newOption] }); }} className="text-xs text-primary-400 hover:text-primary-300 font-medium pl-6 transition-colors">+ Add Option</button>
                        </div>
                    )}

                    {/* Checkbox (Square Icons) */}
                    {question.type === 'checkbox' && (
                        <div className="space-y-2">
                            {question.options?.map((option, index) => (
                                <div key={option.id} className="flex items-center gap-2 group/option">
                                    <div className="w-4 h-4 rounded-md border border-white/20 flex items-center justify-center shrink-0">
                                        <div className="w-2 h-2 rounded-sm bg-white/10" />
                                    </div>
                                    <input
                                        value={option.label}
                                        onChange={(e) => {
                                            const newOptions = [...(question.options || [])];
                                            newOptions[index] = { ...option, label: e.target.value };
                                            onUpdate({ options: newOptions });
                                        }}
                                        className="flex-1 bg-transparent text-sm text-slate-300 focus:outline-none focus:text-white border-b border-transparent focus:border-white/20 transition-colors"
                                    />
                                    <button onClick={() => { const newOptions = question.options?.filter(o => o.id !== option.id); onUpdate({ options: newOptions }); }} className="opacity-0 group-hover/option:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            ))}
                            <button onClick={() => { const newOption = { id: crypto.randomUUID(), label: `Option ${(question.options?.length || 0) + 1}`, value: `option_${(question.options?.length || 0) + 1}` }; onUpdate({ options: [...(question.options || []), newOption] }); }} className="text-xs text-primary-400 hover:text-primary-300 font-medium pl-6 transition-colors">+ Add Option</button>
                        </div>
                    )}

                    {/* Dropdown */}
                    {question.type === 'dropdown' && (
                        <div className="space-y-2">
                            <div className="relative">
                                <div className="w-full h-10 rounded-md bg-[#0B0E14] border border-white/10 px-3 flex items-center justify-between text-muted-foreground text-sm">
                                    <span>Select an option...</span>
                                    <ChevronDown className="w-4 h-4 opacity-50" />
                                </div>
                            </div>
                            {question.options?.map((option, index) => (
                                <div key={option.id} className="flex items-center gap-2 group/option pl-2">
                                    <span className="text-xs text-white/20 w-4 text-center">{index + 1}.</span>
                                    <input
                                        value={option.label}
                                        onChange={(e) => {
                                            const newOptions = [...(question.options || [])];
                                            newOptions[index] = { ...option, label: e.target.value };
                                            onUpdate({ options: newOptions });
                                        }}
                                        className="flex-1 bg-transparent text-sm text-slate-300 focus:outline-none focus:text-white border-b border-transparent focus:border-white/20 transition-colors"
                                    />
                                    <button onClick={() => { const newOptions = question.options?.filter(o => o.id !== option.id); onUpdate({ options: newOptions }); }} className="opacity-0 group-hover/option:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            ))}
                            <button onClick={() => { const newOption = { id: crypto.randomUUID(), label: `Option ${(question.options?.length || 0) + 1}`, value: `option_${(question.options?.length || 0) + 1}` }; onUpdate({ options: [...(question.options || []), newOption] }); }} className="text-xs text-primary-400 hover:text-primary-300 font-medium pl-6 transition-colors">+ Add Option</button>
                        </div>
                    )}

                    {/* Picture Choice */}
                    {question.type === 'picture-choice' && (
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            {question.options?.map((option, index) => (
                                <div key={option.id} className="group/option relative rounded-lg border border-white/10 bg-[#0B0E14] overflow-hidden">
                                    <div className="aspect-video bg-white/5 flex items-center justify-center">
                                        {option.imageUrl ? (
                                            <img src={option.imageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 text-white/20" />
                                        )}
                                    </div>
                                    <div className="p-2 flex gap-2 items-center">
                                        <div className="w-3 h-3 rounded-full border border-white/20 shrink-0" />
                                        <input
                                            value={option.label}
                                            onChange={(e) => {
                                                const newOptions = [...(question.options || [])];
                                                newOptions[index] = { ...option, label: e.target.value };
                                                onUpdate({ options: newOptions });
                                            }}
                                            className="w-full bg-transparent text-xs text-slate-300 focus:outline-none"
                                        />
                                    </div>
                                    <button onClick={() => { const newOptions = question.options?.filter(o => o.id !== option.id); onUpdate({ options: newOptions }); }} className="absolute top-1 right-1 p-1 bg-black/50 rounded hover:bg-red-500/50 text-white/50 hover:text-white transition-all opacity-0 group-hover/option:opacity-100"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            ))}
                            <button onClick={() => { const newOption = { id: crypto.randomUUID(), label: `Image ${(question.options?.length || 0) + 1}`, value: `option_${(question.options?.length || 0) + 1}` }; onUpdate({ options: [...(question.options || []), newOption] }); }} className="flex flex-col items-center justify-center gap-2 aspect-video rounded-lg border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary">
                                <Plus className="w-5 h-5" />
                                <span className="text-xs font-medium">Add Image</span>
                            </button>
                        </div>
                    )}

                    {/* Rating */}
                    {question.type === 'rating' && (
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} className="w-6 h-6 text-white/10" />
                            ))}
                        </div>
                    )}

                    {/* Scale 1-10 */}
                    {question.type === 'scale' && (
                        <div className="flex gap-1.5 flex-wrap">
                            {Array.from({ length: (question.max ?? 10) - (question.min ?? 1) + 1 }, (_, i) => (question.min ?? 1) + i).map((num) => (
                                <div key={num} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/30">
                                    {num}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* File Upload */}
                    {question.type === 'file' && (
                        <div className="w-full h-24 border-2 border-dashed border-white/10 rounded-lg bg-white/[0.02] flex flex-col items-center justify-center text-muted-foreground">
                            <Upload className="w-6 h-6 mb-2 opacity-50" />
                            <span className="text-xs">File upload area</span>
                        </div>
                    )}

                    {/* Signature */}
                    {question.type === 'signature' && (
                        <div className="w-full h-24 rounded-lg bg-[#0B0E14] border-b border-white/10 relative p-4">
                            <PenTool className="absolute top-4 right-4 w-4 h-4 text-white/20" />
                            <div className="absolute bottom-4 left-4 right-4 h-px bg-white/10" />
                        </div>
                    )}

                    {/* Date */}
                    {question.type === 'date' && (
                        <div className="h-10 w-full rounded-md bg-[#0B0E14] border border-white/10 px-3 flex items-center justify-between text-muted-foreground">
                            <span className="text-sm opacity-50">Select a date</span>
                            <Calendar className="w-4 h-4 opacity-50" />
                        </div>
                    )}

                    {/* Statement */}
                    {question.type === 'statement' && (
                        <div className="p-3 rounded bg-primary/10 border-l-2 border-primary text-xs text-primary-200">
                            This block is for displaying text or instructions without collecting input.
                        </div>
                    )}
                </div>
            </div>

            {/* Action Bar - shows on hover or selection */}
            <div className={cn(
                "absolute -right-2 top-2 flex flex-col gap-1 transition-all duration-200",
                isSelected || isDragging ? "opacity-100 translate-x-full" : "opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-full"
            )}>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Add duplicate logic later if needed
                    }}
                    className="h-8 w-8 rounded-l-none rounded-r-lg bg-zinc-900 border border-l-0 border-white/10 hover:bg-zinc-800 text-muted-foreground hover:text-white shadow-lg"
                    title="Duplicate"
                >
                    <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="h-8 w-8 rounded-l-none rounded-r-lg bg-zinc-900 border border-l-0 border-white/10 hover:bg-red-900/30 text-muted-foreground hover:text-red-400 shadow-lg"
                    title="Delete"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
