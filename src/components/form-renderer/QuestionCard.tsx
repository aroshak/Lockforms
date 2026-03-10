import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Star, Upload, X, FileIcon, RotateCcw } from 'lucide-react';
import { SelectInput } from './SelectInput';
import { cn } from '@/lib/utils'; // Assuming this exists, or use utility from globals if possible, but cva/tailwind-merge is standard
import SignatureCanvas from 'react-signature-canvas';
import type { FileAnswer } from '@/types/form';

// If plain clsx is used in project
// import { clsx, type ClassValue } from "clsx"
// import { twMerge } from "tailwind-merge"

// export function cn(...inputs: ClassValue[]) {
//    return twMerge(clsx(inputs))
// }

import { Question } from '@/types/form';

// export type QuestionType = 'text' | 'email' | 'number' | 'paragraph' | 'date' | 'rating' | 'radio' | 'checkbox' | 'dropdown' | 'statement' | 'welcome' | 'thank-you';

// export interface Question {
//     id: string;
//     type: QuestionType;
//     title: string;
//     description?: string;
//     placeholder?: string;
//     required?: boolean;
//     options?: { id: string; label: string; value: string }[];
//     min?: number;
//     max?: number;
// }

// File Upload Component Props
interface FileUploadInputProps {
    value: FileAnswer | null;
    onChange: (value: FileAnswer | null) => void;
    accept?: string;
    max?: number; // Max file size in MB (defaults to 5MB)
    isLight?: boolean;
}

// File Upload Component
const FileUploadInput: React.FC<FileUploadInputProps> = ({
    value,
    onChange,
    accept,
    max = 5,
    isLight = false
}) => {
    const [dragActive, setDragActive] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const maxSizeBytes = max * 1024 * 1024;

    const handleFile = async (file: File) => {
        setError(null);
        setIsLoading(true);

        try {
            // Validate file size
            if (file.size > maxSizeBytes) {
                setError(`File size must not exceed ${max}MB`);
                setIsLoading(false);
                return;
            }

            // Validate file type if accept pattern is specified
            if (accept && !validateFileType(file.type, accept)) {
                setError(`File type not allowed. Expected: ${accept}`);
                setIsLoading(false);
                return;
            }

            // Convert to base64
            const base64Data = await fileToBase64(file);

            // Create FileAnswer object
            const fileAnswer: FileAnswer = {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                base64Data
            };

            onChange(fileAnswer);
        } catch (err) {
            setError('Failed to process file');
            console.error('File processing error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleRemove = () => {
        onChange(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const validateFileType = (mimeType: string, acceptPattern: string): boolean => {
        const patterns = acceptPattern.split(',').map(p => p.trim());
        return patterns.some(pattern => {
            if (pattern === mimeType) return true;
            if (pattern.endsWith('/*')) {
                const category = pattern.slice(0, -2);
                return mimeType.startsWith(category + '/');
            }
            if (pattern.startsWith('.')) {
                const extension = pattern.slice(1);
                return mimeType.includes(extension);
            }
            return false;
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const isImage = value && value.fileType.startsWith('image/');

    return (
        <div className="space-y-4">
            {!value ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "relative w-full h-48 rounded-2xl border-2 transition-all duration-300 cursor-pointer group/upload",
                        dragActive
                            ? (isLight ? "border-blue-500 bg-blue-50" : "border-cyan-400 bg-cyan-900/20")
                            : (isLight ? "border-dashed border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50" : "border-dashed border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10")
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleChange}
                        accept={accept}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                        {isLoading ? (
                            <div className="text-center">
                                <div className={cn("w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4", isLight ? "border-blue-500" : "border-cyan-400")} />
                                <p className={cn("text-lg font-medium", isLight ? "text-slate-700" : "text-slate-300")}>Processing file...</p>
                            </div>
                        ) : (
                            <>
                                <Upload className={cn("w-16 h-16 mb-4 transition-transform group-hover/upload:scale-110", isLight ? "text-blue-500" : "text-cyan-400")} />
                                <p className={cn("text-xl font-medium mb-2", isLight ? "text-slate-700" : "text-slate-200")}>
                                    Click or drag file to upload
                                </p>
                                <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
                                    {accept ? `Accepted: ${accept}` : 'Any file type'} (max {max}MB)
                                </p>
                            </>
                        )}
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                        "relative w-full rounded-2xl border-2 overflow-hidden",
                        isLight ? "border-blue-500 bg-blue-50" : "border-cyan-400 bg-cyan-900/20"
                    )}
                >
                    {isImage ? (
                        <div className="relative h-64">
                            <img
                                src={value.base64Data}
                                alt={value.fileName}
                                className="w-full h-full object-contain bg-slate-100 dark:bg-slate-800"
                            />
                            <button
                                onClick={handleRemove}
                                className={cn(
                                    "absolute top-2 right-2 p-2 rounded-full transition-all",
                                    isLight ? "bg-white hover:bg-red-50 text-red-600" : "bg-slate-900 hover:bg-red-900/50 text-red-400"
                                )}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-6">
                            <div className="flex items-center space-x-4">
                                <FileIcon className={cn("w-10 h-10", isLight ? "text-blue-500" : "text-cyan-400")} />
                                <div>
                                    <p className={cn("font-medium text-lg", isLight ? "text-slate-900" : "text-slate-100")}>
                                        {value.fileName}
                                    </p>
                                    <p className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-400")}>
                                        {formatFileSize(value.fileSize)} • {value.fileType}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleRemove}
                                className={cn(
                                    "p-2 rounded-full transition-all",
                                    isLight ? "hover:bg-red-50 text-red-600" : "hover:bg-red-900/50 text-red-400"
                                )}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </motion.div>
            )}

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800"
                >
                    <X className="w-5 h-5" />
                    <span className="text-sm font-medium">{error}</span>
                </motion.div>
            )}
        </div>
    );
};

// Signature Pad Component Props
interface SignaturePadInputProps {
    value: string | null; // base64 PNG string
    onChange: (value: string | null) => void;
    isLight?: boolean;
}

// Signature Pad Component
const SignaturePadInput: React.FC<SignaturePadInputProps> = ({
    value,
    onChange,
    isLight = false
}) => {
    const sigCanvasRef = React.useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = React.useState(true);

    const handleEnd = () => {
        if (sigCanvasRef.current) {
            const canvas = sigCanvasRef.current;

            // Check if signature is empty
            if (canvas.isEmpty()) {
                setIsEmpty(true);
                onChange(null);
            } else {
                setIsEmpty(false);
                // Convert to base64 PNG
                const base64Data = canvas.toDataURL('image/png');
                onChange(base64Data);
            }
        }
    };

    const handleClear = () => {
        if (sigCanvasRef.current) {
            sigCanvasRef.current.clear();
            setIsEmpty(true);
            onChange(null);
        }
    };

    React.useEffect(() => {
        // Load existing signature if value is provided
        if (value && sigCanvasRef.current) {
            sigCanvasRef.current.fromDataURL(value);
            setIsEmpty(false);
        }
    }, []);

    return (
        <div className="space-y-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "relative w-full rounded-2xl border-2 overflow-hidden",
                    isLight ? "border-slate-300 bg-white" : "border-white/10 bg-white/5"
                )}
            >
                <SignatureCanvas
                    ref={sigCanvasRef}
                    canvasProps={{
                        className: cn(
                            'w-full h-64 touch-none',
                            isLight ? 'bg-white' : 'bg-slate-900'
                        ),
                        style: { touchAction: 'none' }
                    }}
                    backgroundColor={isLight ? '#ffffff' : '#0f172a'}
                    penColor={isLight ? '#000000' : '#ffffff'}
                    onEnd={() => {
                        handleEnd();
                        // Force a small delay to ensure canvas data is ready
                        setTimeout(handleEnd, 100);
                    }}
                />

                {/* Signature Line */}
                <div className={cn(
                    "absolute bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-px pointer-events-none",
                    isLight ? "bg-slate-300" : "bg-white/20"
                )} />

                {/* Sign Here Label (when empty) */}
                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <p className={cn(
                                "text-3xl font-script italic mb-2",
                                isLight ? "text-slate-300" : "text-slate-600"
                            )}>
                                Sign Here
                            </p>
                            <p className={cn(
                                "text-sm",
                                isLight ? "text-slate-400" : "text-slate-500"
                            )}>
                                Draw your signature above
                            </p>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Clear Button */}
            {!isEmpty && (
                <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleClear}
                    className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all",
                        isLight
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            : "bg-white/10 hover:bg-white/20 text-slate-300"
                    )}
                >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-sm font-medium">Clear Signature</span>
                </motion.button>
            )}

            {/* Instructions */}
            <p className={cn(
                "text-sm text-center",
                isLight ? "text-slate-500" : "text-slate-400"
            )}>
                Use your mouse or touchscreen to draw your signature
            </p>
        </div>
    );
};

interface QuestionCardProps {
    question: Question;
    value: any;
    onChange: (value: any) => void;
    onNext: () => void;
    isActive: boolean;
    isLight?: boolean;
    isSubmitting?: boolean;
    submitError?: string | null;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, value, onChange, onNext, isActive, isLight = false, isSubmitting = false, submitError = null }) => {
    const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const [shake, setShake] = React.useState(0);

    React.useEffect(() => {
        if (isActive && inputRef.current) {
            // slightly delay focus for animation
            setTimeout(() => inputRef.current?.focus(), 500);
        }
    }, [isActive]);

    // Gap 2.2: Keyboard A/B/C shortcuts for choice-type questions
    React.useEffect(() => {
        if (!isActive) return;
        const isChoiceType = question.type === 'radio' || question.type === 'checkbox' || question.type === 'picture-choice' || question.type === 'choice';
        if (!isChoiceType || !question.options?.length) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input/textarea
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;

            const key = e.key.toLowerCase();
            const idx = key.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
            if (idx >= 0 && idx < (question.options?.length || 0)) {
                e.preventDefault();
                const option = question.options![idx];
                if (question.type === 'radio' || question.type === 'picture-choice' || question.type === 'choice') {
                    onChange(option.value);
                    setTimeout(onNext, 400);
                } else if (question.type === 'checkbox') {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValue = currentValues.includes(option.value)
                        ? currentValues.filter((v: string) => v !== option.value)
                        : [...currentValues, option.value];
                    onChange(newValue);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isActive, question, value, onChange, onNext]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (question.required && !value) {
                setShake(prev => prev + 1); // Trigger shake
                return;
            }
            onNext();
        }
    };

    return (
        <div className={cn("w-full max-w-3xl mx-auto px-6 py-12 relative")}>
            <motion.div
                animate={{ x: shake ? [0, -10, 10, -10, 10, 0] : 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-start space-x-6"
            >
                {/* Index Indicator */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : -20 }}
                    transition={{ delay: 0.2 }}
                    className="hidden md:flex items-center justify-center pt-3"
                >
                    <ArrowRight className={cn("w-6 h-6 animate-pulse", isLight ? "text-blue-600 drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]" : "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]")} />
                </motion.div>

                <div className="flex-1 space-y-12">
                    {/* Header */}
                    <div className="space-y-4">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
                            className={cn("text-4xl md:text-5xl font-bold tracking-tight leading-tight drop-shadow-md", isLight ? "text-slate-900" : "text-white")}
                        >
                            <span className={cn("bg-clip-text text-transparent bg-gradient-to-r", isLight ? "from-slate-900 to-slate-600" : "from-white to-slate-400")}>
                                {question.title}
                            </span>
                            {question.required && <span className="text-red-400 ml-2 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]">*</span>}
                        </motion.h2>
                        {question.description && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className={cn("text-xl md:text-2xl font-light", isLight ? "text-slate-500" : "text-slate-400")}
                            >
                                {question.description}
                            </motion.p>
                        )}
                    </div>

                    {/* Input Area */}
                    <motion.div
                        className="relative group min-h-[120px]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        {question.type === 'datetime' ? (
                            <div className="relative">
                                <input
                                    ref={inputRef as React.RefObject<HTMLInputElement>}
                                    type="datetime-local"
                                    value={value || ''}
                                    onChange={(e) => onChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={question.placeholder || 'Select date and time...'}
                                    className={cn(
                                        "w-full bg-transparent text-4xl md:text-5xl font-medium focus:outline-none py-6 transition-all duration-500",
                                        isLight
                                            ? "text-blue-900 placeholder:text-slate-400 border-b border-slate-300 focus:border-blue-500 focus:text-blue-950 focus:placeholder:text-slate-300"
                                            : "text-cyan-50 placeholder:text-slate-600 border-b border-white/10 focus:border-cyan-400 focus:text-white focus:placeholder:text-slate-500/50"
                                    )}
                                    style={{ textShadow: isLight ? 'none' : '0 0 20px rgba(34,211,238,0.1)' }}
                                />
                                <div className={cn("absolute bottom-0 left-0 w-full h-[1px] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700 ease-out origin-left",
                                    isLight ? "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(34,211,238,0.6)]")} />
                            </div>
                        ) : question.type === 'text' || question.type === 'email' || question.type === 'number' || question.type === 'date' ? (
                            <div className="relative">
                                <input
                                    ref={inputRef as React.RefObject<HTMLInputElement>}
                                    type={question.type}
                                    value={value || ''}
                                    onChange={(e) => onChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={question.placeholder || 'Type your answer here...'}
                                    className={cn(
                                        "w-full bg-transparent text-4xl md:text-5xl font-medium focus:outline-none py-6 transition-all duration-500",
                                        isLight
                                            ? "text-blue-900 placeholder:text-slate-400 border-b border-slate-300 focus:border-blue-500 focus:text-blue-950 focus:placeholder:text-slate-300"
                                            : "text-cyan-50 placeholder:text-slate-600 border-b border-white/10 focus:border-cyan-400 focus:text-white focus:placeholder:text-slate-500/50"
                                    )}
                                    style={{ textShadow: isLight ? 'none' : '0 0 20px rgba(34,211,238,0.1)' }}
                                />
                                <div className={cn("absolute bottom-0 left-0 w-full h-[1px] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700 ease-out origin-left", isLight ? "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(34,211,238,0.6)]")} />
                            </div>
                        ) : question.type === 'paragraph' ? (
                            <div className="relative">
                                <textarea
                                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                                    value={value || ''}
                                    onChange={(e) => onChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.ctrlKey) onNext();
                                    }}
                                    rows={3}
                                    placeholder={question.placeholder || 'Type your answer here...'}
                                    className={cn(
                                        "w-full bg-transparent text-3xl md:text-4xl font-light focus:outline-none py-4 transition-all resize-none focus:scale-[1.01] origin-left relative z-10",
                                        isLight
                                            ? "text-slate-700 placeholder:text-slate-400 border-b border-slate-300 focus:border-blue-500"
                                            : "text-slate-200 placeholder:text-slate-600 border-b border-white/10 focus:border-cyan-400/50"
                                    )}
                                    // FIXED: Ensure stopPropagation to prevent drag interfering with text selection
                                    onPointerDown={(e) => e.stopPropagation()}
                                />
                                <div className={cn("absolute bottom-2 left-0 w-full h-[1px] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700 ease-out origin-left", isLight ? "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(34,211,238,0.6)]")} />
                            </div>
                        ) : question.type === 'rating' ? (
                            <div className="flex gap-4 flex-wrap">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <motion.button
                                        key={star}
                                        whileHover={{ scale: 1.2, rotate: 10 }}
                                        whileTap={{ scale: 0.9 }}
                                        type="button"
                                        onClick={() => { onChange(star); setTimeout(onNext, 400); }}
                                        className={cn(
                                            "relative z-10 p-4 rounded-2xl transition-all duration-500 border",
                                            isLight ? "border-slate-200" : "border-white/5",
                                            (value || 0) >= star
                                                ? "text-yellow-500 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-400/10 shadow-[0_0_30px_rgba(250,204,21,0.4)] border-yellow-400/50"
                                                : cn("text-slate-400", isLight ? "hover:bg-slate-100" : "hover:text-yellow-200/50 hover:bg-white/5")
                                        )}
                                    >
                                        <Star className={cn("w-10 h-10 md:w-14 md:h-14 transition-all", (value || 0) >= star ? "fill-current" : "fill-none stroke-current stroke-1")} />
                                    </motion.button>
                                ))}
                            </div>
                        ) : question.type === 'scale' ? (
                            (() => {
                                const scaleMin = question.min ?? 1;
                                const scaleMax = question.max ?? 10;
                                const range = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i);

                                return (
                                    <div className="flex gap-2 flex-wrap">
                                        {range.map((num) => (
                                            <motion.button
                                                key={num}
                                                whileHover={{ scale: 1.1, y: -4 }}
                                                whileTap={{ scale: 0.9 }}
                                                type="button"
                                                onClick={() => { onChange(num); setTimeout(onNext, 400); }}
                                                className={cn(
                                                    "relative z-10 w-14 h-14 md:w-16 md:h-16 rounded-2xl transition-all duration-500 border flex items-center justify-center",
                                                    "text-2xl md:text-3xl font-bold backdrop-blur-sm",
                                                    isLight ? "border-slate-200" : "border-white/10",
                                                    value === num
                                                        ? cn(
                                                            isLight
                                                                ? "bg-blue-500 text-white border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                                                                : "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.5)]"
                                                        )
                                                        : cn(
                                                            isLight
                                                                ? "bg-white/50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                                                                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/30"
                                                        )
                                                )}
                                            >
                                                {num}
                                            </motion.button>
                                        ))}
                                    </div>
                                );
                            })()
                        ) : question.type === 'radio' || question.type === 'checkbox' || question.type === 'picture-choice' ? (
                            <div className={cn(
                                "grid gap-4",
                                question.options?.some(opt => opt.imageUrl)
                                    ? "grid-cols-2 md:grid-cols-3"
                                    : "grid-cols-1"
                            )}>
                                {question.options?.map((option, idx) => (
                                    <motion.div
                                        key={option.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + (idx * 0.1) }}
                                        onClick={() => {
                                            if (question.type === 'radio' || question.type === 'picture-choice') {
                                                onChange(option.value);
                                                setTimeout(onNext, 400);
                                            } else {
                                                // Checkbox logic
                                                const currentValues = Array.isArray(value) ? value : [];
                                                const newValue = currentValues.includes(option.value)
                                                    ? currentValues.filter((v: string) => v !== option.value)
                                                    : [...currentValues, option.value];
                                                onChange(newValue);
                                            }
                                        }}
                                        className={cn(
                                            "cursor-pointer rounded-2xl border transition-all duration-300 relative overflow-hidden group/opt backdrop-blur-sm",
                                            question.options?.some(opt => opt.imageUrl) ? "aspect-[4/5] p-0 flex flex-col" : "p-6 flex items-center gap-6",
                                            (Array.isArray(value) ? value.includes(option.value) : value === option.value)
                                                ? cn(isLight ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50" : "border-cyan-400 ring-2 ring-cyan-400/20 bg-cyan-900/40")
                                                : cn(isLight ? "border-slate-200 bg-white/50 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1" : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 hover:-translate-y-1")
                                        )}
                                    >
                                        {/* Image Area if present */}
                                        {option.imageUrl && (
                                            <div className="relative w-full h-2/3 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                <img
                                                    src={option.imageUrl}
                                                    alt={option.label}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/opt:scale-110"
                                                />
                                                <div className={cn("absolute inset-0 transition-opacity duration-300",
                                                    (Array.isArray(value) ? value.includes(option.value) : value === option.value)
                                                        ? "opacity-0"
                                                        : "bg-black/20 opacity-0 group-hover/opt:opacity-100"
                                                )} />

                                                {/* Selected Check Overlay */}
                                                {(Array.isArray(value) ? value.includes(option.value) : value === option.value) && (
                                                    <div className={cn("absolute inset-0 flex items-center justify-center backdrop-blur-[2px]", isLight ? "bg-blue-500/20" : "bg-cyan-500/20")}>
                                                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform scale-100 transition-transform", isLight ? "bg-blue-500 text-white" : "bg-cyan-400 text-black")}>
                                                            <Check className="w-6 h-6 stroke-[3]" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Content Area */}
                                        <div className={cn("flex items-center gap-4", question.options?.some(opt => opt.imageUrl) ? "p-4 h-1/3 w-full" : "w-full")}>
                                            {/* Key Badge + Radio/Check Icon if NO Image */}
                                            {!question.options?.some(opt => opt.imageUrl) && (
                                                <div className="flex items-center gap-3 shrink-0">
                                                    {/* Keyboard shortcut badge */}
                                                    <span className={cn(
                                                        "hidden md:flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold border transition-all duration-300",
                                                        (Array.isArray(value) ? value.includes(option.value) : value === option.value)
                                                            ? (isLight ? "border-blue-500 bg-blue-500 text-white" : "border-cyan-400 bg-cyan-400 text-black")
                                                            : (isLight ? "border-slate-300 text-slate-500 group-hover/opt:border-blue-400 group-hover/opt:text-blue-500" : "border-white/20 text-slate-500 group-hover/opt:border-white/40 group-hover/opt:text-slate-300")
                                                    )}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </span>
                                                    {/* Check icon */}
                                                    <div className={cn("w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-300",
                                                        (Array.isArray(value) ? value.includes(option.value) : value === option.value)
                                                            ? (isLight ? "border-blue-500 bg-blue-500 text-white" : "border-cyan-400 bg-cyan-400 rotate-12")
                                                            : "border-slate-400 group-hover/opt:border-blue-400"
                                                    )}>
                                                        {(Array.isArray(value) ? value.includes(option.value) : value === option.value) &&
                                                            <Check className={cn("w-4 h-4 stroke-[3]", isLight ? "text-white" : "text-black")} />
                                                        }
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-col">
                                                <span className={cn("font-medium transition-colors line-clamp-2",
                                                    question.options?.some(opt => opt.imageUrl) ? "text-base md:text-lg text-center w-full" : "text-xl md:text-2xl font-light",
                                                    (Array.isArray(value) ? value.includes(option.value) : value === option.value)
                                                        ? (isLight ? "text-blue-900" : "text-cyan-100")
                                                        : (isLight ? "text-slate-700" : "text-slate-300")
                                                )}>
                                                    {option.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Interaction Gradient */}
                                        {(Array.isArray(value) ? value.includes(option.value) : value === option.value) && (
                                            <motion.div
                                                layoutId={`highlight-${question.id}`}
                                                className={cn("absolute inset-0 z-[-1]", isLight ? "bg-gradient-to-r from-blue-500/10 to-transparent" : "bg-gradient-to-r from-cyan-500/10 to-transparent")}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            />
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        ) : question.type === 'dropdown' ? (
                            <SelectInput
                                value={value}
                                onChange={onChange}
                                onNext={onNext}
                                options={question.options || []}
                                isLight={isLight}
                                placeholder="Select an option..."
                            />
                        ) : question.type === 'file' || question.type === 'file-upload' ? (
                            <FileUploadInput
                                value={value}
                                onChange={onChange}
                                accept={question.accept}
                                max={question.max}
                                isLight={isLight}
                            />
                        ) : question.type === 'signature' ? (
                            <SignaturePadInput
                                value={value}
                                onChange={onChange}
                                isLight={isLight}
                            />
                        ) : question.type === 'url' || question.type === 'website' ? (
                            <div className="relative">
                                <input
                                    ref={inputRef as React.RefObject<HTMLInputElement>}
                                    type="url"
                                    value={value || ''}
                                    onChange={(e) => onChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={question.placeholder || 'https://example.com'}
                                    className={cn(
                                        "w-full bg-transparent text-4xl md:text-5xl font-medium focus:outline-none py-6 transition-all duration-500",
                                        isLight
                                            ? "text-blue-900 placeholder:text-slate-400 border-b border-slate-300 focus:border-blue-500 focus:text-blue-950 focus:placeholder:text-slate-300"
                                            : "text-cyan-50 placeholder:text-slate-600 border-b border-white/10 focus:border-cyan-400 focus:text-white focus:placeholder:text-slate-500/50"
                                    )}
                                    style={{ textShadow: isLight ? 'none' : '0 0 20px rgba(34,211,238,0.1)' }}
                                />
                                <div className={cn("absolute bottom-0 left-0 w-full h-[1px] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700 ease-out origin-left", isLight ? "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(34,211,238,0.6)]")} />
                            </div>
                        ) : question.type === 'statement' ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "w-full rounded-2xl border-l-4 p-8 backdrop-blur-sm",
                                    isLight
                                        ? "border-blue-500 bg-blue-50/50 text-slate-700"
                                        : "border-cyan-400 bg-white/5 text-slate-300"
                                )}
                            >
                                <p className={cn(
                                    "text-xl md:text-2xl font-light leading-relaxed",
                                    isLight ? "text-slate-600" : "text-slate-300"
                                )}>
                                    {question.description || 'This is an informational statement.'}
                                </p>
                            </motion.div>
                        ) : null}
                    </motion.div>

                    {/* Error Message */}
                    {submitError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm"
                        >
                            <div className="flex items-start gap-3">
                                <X className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-red-200 font-medium text-sm">{submitError}</p>
                                    <p className="text-red-300/70 text-xs mt-1">Please review your answer and try again.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Button / Hint */}
                    <motion.div
                        className="pt-8 flex items-center space-x-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <motion.button
                            onClick={() => {
                                if (question.required && !value) {
                                    setShake(prev => prev + 1);
                                    return;
                                }
                                onNext();
                            }}
                            disabled={isSubmitting}
                            whileHover={{ scale: isSubmitting ? 1 : 1.05, boxShadow: isSubmitting ? "none" : "0 0 40px -10px rgba(34, 211, 238, 0.4)" }}
                            whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                            className={cn(
                                "group flex items-center space-x-3 px-8 py-3 rounded-xl text-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300",
                                isSubmitting
                                    ? "bg-white/50 text-slate-400 cursor-wait"
                                    : "bg-white text-slate-900 hover:bg-cyan-50"
                            )}
                        >
                            {isSubmitting ? (
                                <>
                                    <span>Submitting...</span>
                                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                </>
                            ) : (
                                <>
                                    <span>OK</span>
                                    <Check className="w-5 h-5 group-hover:translate-x-1 transition-transform stroke-[3]" />
                                </>
                            )}
                        </motion.button>

                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            <span className="hidden md:inline">press</span>
                            <kbd className="flex items-center gap-1 px-2 py-1 bg-white/10 border-b-2 border-white/20 rounded-md text-slate-300 text-xs font-sans tracking-wide shadow-sm">
                                <span>Enter</span>
                                <span className="text-[10px]">↵</span>
                            </kbd>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};
