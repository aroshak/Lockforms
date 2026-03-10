import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
    id: string;
    label: string;
    value: string;
    imageUrl?: string;
}

interface SelectInputProps {
    value: string;
    onChange: (value: string) => void;
    onNext?: () => void;
    options: Option[];
    placeholder?: string;
    isLight?: boolean;
}

export const SelectInput: React.FC<SelectInputProps> = ({
    value,
    onChange,
    onNext,
    options,
    placeholder = "Select an option...",
    isLight = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Gap 2.2: Keyboard shortcuts for dropdown options
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input/textarea
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;

            const key = e.key.toLowerCase();
            const idx = key.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
            if (idx >= 0 && idx < options.length) {
                e.preventDefault();
                const option = options[idx];
                onChange(option.value);
                setIsOpen(false);
                if (onNext) setTimeout(onNext, 400);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [options, onChange, onNext]);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={containerRef} className="relative group min-w-[300px]">
            {/* Main Trigger Button */}
            <motion.button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between py-6 pr-4 bg-transparent text-left transition-all duration-300",
                    "text-3xl md:text-5xl font-medium focus:outline-none",
                    isLight
                        ? "text-blue-900 border-b border-slate-300 hover:border-blue-400"
                        : "text-white border-b border-white/10 hover:border-white/30"
                )}
            >
                <span className={cn(
                    "truncate mr-8",
                    !selectedOption ? (isLight ? "text-slate-400" : "text-slate-500/50") : ""
                )}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn("shrink-0", isLight ? "text-blue-500" : "text-cyan-400")}
                >
                    <ChevronDown className="w-8 h-8 opacity-80" />
                </motion.div>

                {/* Bottom Highlight Line */}
                <div className={cn(
                    "absolute bottom-0 left-0 w-full h-[1px] scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out origin-left",
                    isLight ? "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(34,211,238,0.6)]"
                )} />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "absolute z-50 top-full left-0 w-full mt-2 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl border max-h-[300px] overflow-y-auto",
                            isLight
                                ? "bg-white/90 border-slate-200 shadow-slate-200/50"
                                : "bg-[#0f1219]/90 border-white/10 shadow-black/50"
                        )}
                    >
                        <div className="p-2 space-y-1">
                            {options.map((option, idx) => {
                                const isSelected = value === option.value;
                                return (
                                    <motion.button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                            if (onNext) setTimeout(onNext, 0);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-lg text-lg transition-all text-left",
                                            isSelected
                                                ? (isLight ? "bg-blue-50 text-blue-700" : "bg-cyan-900/30 text-cyan-50")
                                                : (isLight ? "text-slate-700 hover:bg-slate-50" : "text-slate-300 hover:bg-white/5")
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Keyboard shortcut badge */}
                                            <span className={cn(
                                                "hidden md:flex items-center justify-center w-6 h-6 rounded text-xs font-bold border transition-all",
                                                isSelected
                                                    ? (isLight ? "border-blue-500 bg-blue-500 text-white" : "border-cyan-400 bg-cyan-400 text-black")
                                                    : (isLight ? "border-slate-300 text-slate-400" : "border-white/20 text-slate-500")
                                            )}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="font-medium">{option.label}</span>
                                        </div>
                                        {isSelected && (
                                            <Check className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-cyan-400")} />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop for mobile overlays if needed, but styling above covers most cases. 
                Using a fixed inset backdrop is safer for closing but can intercept clicks elsewhere. 
                The useEffect approach handles clicks outside efficiently. */}
        </div>
    );
};
