'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionCard } from './QuestionCard';
import { WelcomeScreen } from './WelcomeScreen';
import { EndScreen } from './EndScreen';
import { Background } from '@/components/ui/Background';
import { FormSchema, Question } from '@/types/form';

interface FormRendererProps {
    form?: FormSchema;
    questions?: Question[];
    title?: string;
    onSubmit?: (answers: Record<string, any>) => void;
}

export function FormRenderer({ form, questions: questionsProp, title: titleProp, onSubmit }: FormRendererProps) {
    // Determine if welcome screen should be shown
    const welcomeSettings = form?.settings?.welcomeScreen;
    const showWelcome = welcomeSettings?.enabled ?? true;

    const endSettings = form?.settings?.endScreen;

    const currentTheme = form?.settings?.theme;
    const isLight = ['light', 'soft', 'corporate'].includes(currentTheme || 'midnight');

    // State
    const [hasStarted, setHasStarted] = useState(!showWelcome);
    const [isCompleted, setIsCompleted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    // const [direction, setDirection] = useState(0); // -1 for up/prev, 1 for down/next

    // Support both old API (questions, title) and new API (form) which might return schema or questions
    const questions = form?.questions || form?.schema || questionsProp || [];
    const title = form?.title || titleProp;

    if (!questions || questions.length === 0) {
        return <div className="flex items-center justify-center min-h-screen text-white">No questions available.</div>;
    }

    const isFirst = currentIndex === 0;
    const isLast = currentIndex === questions.length - 1;

    // Calculate progress
    const progress = ((currentIndex + 1) / questions.length) * 100;

    const handleAnswer = (value: any) => {
        setAnswers(prev => ({
            ...prev,
            [questions[currentIndex].id]: value
        }));
    };

    const evaluateCondition = (answer: any, rule: any): boolean => {
        if (!answer) return false;
        switch (rule.condition) {
            case 'equals': return String(answer) === rule.value;
            case 'not_equals': return String(answer) !== rule.value;
            default: return false;
        }
    };

    const handleNext = async () => {
        const currentQuestion = questions[currentIndex];
        const answer = answers[currentQuestion.id];

        let nextIndex = currentIndex + 1;

        // Logic Jumps
        if (currentQuestion.logic && currentQuestion.logic.length > 0) {
            for (const rule of currentQuestion.logic) {
                if (evaluateCondition(answer, rule)) {
                    const targetIndex = questions.findIndex(q => q.id === rule.to);
                    if (targetIndex !== -1) {
                        nextIndex = targetIndex;
                        break;
                    }
                }
            }
        }

        if (isLast) {
            console.log("Form Submitted", answers);
            setIsSubmitting(true);
            setSubmitError(null);

            try {
                if (onSubmit) {
                    await onSubmit(answers);
                }
                setIsCompleted(true);
            } catch (error: any) {
                console.error("Submission error:", error);
                setSubmitError(error.message || "Failed to submit form. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        // setDirection(1);
        setCurrentIndex(nextIndex);
    };

    const handlePrevious = () => {
        if (isFirst) return;
        // setDirection(-1);
        setCurrentIndex(prev => prev - 1);
    };

    const handleStart = () => {
        setHasStarted(true);
    };

    const handleRestart = () => {
        setIsCompleted(false);
        setHasStarted(!showWelcome);
        setCurrentIndex(0);
        setAnswers({});
    };

    // Layout Content
    const renderLayout = (children: React.ReactNode) => (
        <div className="min-h-screen w-full relative overflow-hidden font-sans text-slate-100 selection:bg-cyan-500/30">
            <Background theme={currentTheme} />

            {/* Progress Bar */}
            {hasStarted && !isCompleted && (
                <div className="fixed top-0 left-0 w-full h-1 bg-white/5 z-50">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                    />
                </div>
            )}

            {/* Header */}
            <header className="fixed top-0 w-full p-8 flex justify-between items-center z-40 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="pointer-events-auto"
                >
                    <span className="font-bold text-slate-400 tracking-widest uppercase text-xs backdrop-blur-md px-3 py-1 rounded-full border border-white/5 bg-white/5">
                        {title || "LockForms"}
                    </span>
                </motion.div>

                {hasStarted && !isCompleted && (
                    <div className="flex gap-4 pointer-events-auto">
                        <button
                            onClick={handlePrevious}
                            disabled={isFirst}
                            className="p-3 rounded-xl backdrop-blur-md border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rotate-90 text-slate-300"><path d="M7 13l5 5 5-5M7 6l5 5 5-5" /></svg>
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={isLast && !answers[questions[currentIndex].id]} // Weak check for now
                            className="p-3 rounded-xl backdrop-blur-md border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="-rotate-90 text-slate-300"><path d="M7 13l5 5 5-5M7 6l5 5 5-5" /></svg>
                        </button>
                    </div>
                )}
            </header>

            <main className="w-full h-screen flex flex-col items-center justify-center relative perspective-[1000px] overflow-hidden">
                {children}
            </main>

            <footer className="fixed bottom-6 right-8 text-[10px] text-slate-500 font-medium tracking-widest uppercase opacity-60">
                Powered by <span className="text-slate-400 font-bold">LockForms</span>
            </footer>
        </div>
    );

    if (isCompleted) {
        return renderLayout(
            <div className="relative z-10">
                <EndScreen
                    title={endSettings?.title || "Thank you!"}
                    description={endSettings?.description || "Your submission has been received."}
                    buttonText={endSettings?.buttonText || "Submit Another"}
                    redirectUrl={endSettings?.redirectUrl}
                    onRestart={handleRestart}
                />
            </div>
        );
    }

    if (!hasStarted) {
        return renderLayout(
            <div className="relative z-10">
                <WelcomeScreen
                    title={welcomeSettings?.title || `Welcome to ${title || 'LockForms'}`}
                    description={welcomeSettings?.description || "Experience the new standard in form interaction."}
                    buttonText={welcomeSettings?.buttonText || "Begin Journey"}
                    onStart={handleStart}
                />
            </div>
        );
    }

    // Transition Variants System
    const transitionType = form?.settings?.transition || 'tunnel';

    const getVariants = (type: string, offset: number, isActive: boolean) => {
        switch (type) {
            case 'slide': // Horizontal Slide "Flow"
                return {
                    initial: {
                        opacity: 0,
                        x: offset > 0 ? '100%' : '-100%',
                        scale: 1,
                        filter: 'blur(0px)'
                    },
                    animate: {
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        zIndex: 10,
                        filter: 'blur(0px)',
                        pointerEvents: 'auto'
                    },
                    exit: {
                        opacity: 0,
                        x: '-100%', // Always flow left
                        scale: 1,
                        zIndex: 0
                    }
                };
            case 'stack': // Vertical Stack
                return {
                    initial: {
                        opacity: 0,
                        y: '100%',
                        scale: 0.9,
                    },
                    animate: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        zIndex: 10,
                        pointerEvents: 'auto'
                    },
                    exit: {
                        opacity: 0,
                        y: '-50%',
                        scale: 0.9,
                        zIndex: 0
                    }
                };
            case 'fade': // Simple Fade
                return {
                    initial: { opacity: 0, scale: 0.95 },
                    animate: {
                        opacity: 1,
                        scale: 1,
                        zIndex: 10,
                        pointerEvents: 'auto'
                    },
                    exit: {
                        opacity: 0,
                        scale: 1.05,
                        zIndex: 0
                    }
                };
            case 'tunnel': // Default 3D Tunnel
            default:
                return {
                    initial: {
                        opacity: 0,
                        scale: 0.8,
                        y: -100,
                        zIndex: 10 - offset,
                        filter: 'blur(10px)'
                    },
                    animate: {
                        opacity: isActive ? 1 : (offset === 1 ? 0.6 : 0.3),
                        scale: isActive ? 1 : (offset === 1 ? 0.9 : 0.8),
                        y: isActive ? 0 : (offset === 1 ? -60 : -100),
                        zIndex: 10 - offset,
                        filter: isActive ? 'blur(0px)' : (offset === 1 ? 'blur(4px)' : 'blur(8px)'),
                        pointerEvents: isActive ? 'auto' : 'none'
                    },
                    exit: {
                        opacity: 0,
                        scale: 1.1,
                        y: 100,
                        filter: 'blur(10px)',
                        zIndex: 20
                    }
                };
        }
    };

    return renderLayout(
        <div className="relative w-full max-w-4xl h-[600px] flex items-center justify-center">
            <AnimatePresence initial={false} mode="popLayout">
                {questions.map((q, index) => {
                    const offset = index - currentIndex;

                    // Tunnel View Logic: Render Active and next 2 questions
                    const isTunnel = transitionType === 'tunnel';

                    // IF Tunnel: show next 2 for depth. IF others: only show Active (AnimatePresence handles exit)
                    if (isTunnel) {
                        if (offset < 0 || offset > 2) return null;
                    } else {
                        if (offset !== 0) return null;
                    }

                    const isActive = offset === 0;
                    const variants = getVariants(transitionType, offset, isActive);

                    return (
                        <motion.div
                            key={q.id}
                            className="absolute top-0 left-0 w-full h-full flex items-center justify-center p-4"
                            initial={variants.initial}
                            animate={variants.animate as any}
                            exit={variants.exit as any}
                            transition={{
                                type: "spring",
                                stiffness: transitionType === 'slide' ? 200 : 350,
                                damping: transitionType === 'slide' ? 25 : 40,
                                mass: 1
                            }}
                        >
                            <QuestionCard
                                question={q}
                                value={answers[q.id]}
                                onChange={handleAnswer}
                                onNext={handleNext}
                                isActive={isActive}
                                isLight={isLight}
                                isSubmitting={isSubmitting}
                                submitError={submitError}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
