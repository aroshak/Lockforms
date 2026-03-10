'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, Loader2, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { duplicateForm } from './builder/actions';

interface CopyFormButtonProps {
    id: string;
    title: string;
}

function DuplicateModal({
    title,
    id,
    onClose,
}: {
    title: string;
    id: string;
    onClose: () => void;
}) {
    const [isCopying, setIsCopying] = useState(false);
    const [newTitle, setNewTitle] = useState(`Copy of ${title}`);
    const [success, setSuccess] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Auto-focus and select input text on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Lock body scroll
    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = original;
        };
    }, []);

    const handleDuplicate = useCallback(async () => {
        if (!newTitle.trim() || isCopying) return;

        setIsCopying(true);
        try {
            const result = await duplicateForm(id, newTitle.trim());
            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 1000);
            } else {
                alert('Failed to duplicate form: ' + result.message);
            }
        } catch (error) {
            console.error('Error duplicating form:', error);
            alert('An error occurred while duplicating the form.');
        } finally {
            setIsCopying(false);
        }
    }, [id, newTitle, isCopying, onClose]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleDuplicate();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ isolation: 'isolate' }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
                style={{
                    animation: 'modalBackdropIn 0.2s ease-out forwards',
                }}
            />

            {/* Modal Panel */}
            <div
                ref={panelRef}
                className="relative z-10 w-full max-w-[480px] mx-4"
                style={{
                    animation: 'modalPanelIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Glow effect behind modal */}
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-primary-500/30 via-primary-500/10 to-transparent blur-sm pointer-events-none" />

                <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c0f16] shadow-[0_32px_64px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden">

                    {/* Accent line at top */}
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-primary-500 to-transparent" />

                    {/* Header */}
                    <div className="px-7 pt-6 pb-4 flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20 flex items-center justify-center shadow-lg shadow-primary-500/10">
                                <Copy className="w-5 h-5 text-primary-400" />
                            </div>
                            <div>
                                <h3 className="text-[17px] font-bold text-white tracking-tight leading-tight">
                                    Duplicate Form
                                </h3>
                                <p className="text-[13px] text-white/40 mt-0.5">
                                    Create an identical copy as a draft
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 -mr-1 -mt-1 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all duration-200"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-7 pb-6 space-y-5">
                        {/* Source form */}
                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold mb-1.5">
                                Source Form
                            </p>
                            <p className="text-[15px] font-semibold text-white truncate leading-snug">
                                {title}
                            </p>
                        </div>

                        {/* New name input */}
                        <div className="space-y-2.5">
                            <label
                                htmlFor="duplicate-form-name"
                                className="text-[13px] font-semibold text-white/70 block"
                            >
                                New form name
                            </label>
                            <div className="relative group/input">
                                <input
                                    ref={inputRef}
                                    id="duplicate-form-name"
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter a name for the copy..."
                                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[15px] text-white placeholder:text-white/20 focus:border-primary-500/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200"
                                    disabled={isCopying || success}
                                    autoComplete="off"
                                    spellCheck="false"
                                />
                                {/* Focus glow */}
                                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-primary-500/20 to-transparent opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none blur-sm -z-10" />
                            </div>
                            <p className="text-[11px] text-white/25 leading-relaxed">
                                All questions, settings, and logic will be copied. Submissions will not be included.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-7 py-5 border-t border-white/[0.05] bg-white/[0.02] flex items-center justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isCopying}
                            className="h-11 px-5 text-[13px] font-medium text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all duration-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDuplicate}
                            disabled={isCopying || !newTitle.trim() || success}
                            className="h-11 px-6 text-[13px] font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-200 min-w-[140px]"
                        >
                            {isCopying ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Duplicating…
                                </span>
                            ) : success ? (
                                <span className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span className="text-emerald-300">Created!</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Duplicate
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CopyFormButton({ id, title }: CopyFormButtonProps) {
    const [showDialog, setShowDialog] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Ensure we only use portal after hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDialog(true);
                }}
                title="Duplicate form"
                className="hover:bg-primary-500/20 hover:text-primary-300 transition-colors w-9 h-9"
            >
                <Copy className="w-4 h-4" />
            </Button>

            {/* Portal: renders modal at document.body level, escaping all parent overflow/transform */}
            {showDialog && mounted && createPortal(
                <DuplicateModal
                    id={id}
                    title={title}
                    onClose={() => setShowDialog(false)}
                />,
                document.body
            )}
        </>
    );
}
