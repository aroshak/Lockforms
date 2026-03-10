import React from 'react';
import { motion } from 'framer-motion';
import { MousePointerClick } from 'lucide-react';

interface WelcomeScreenProps {
    title: string;
    description?: string;
    buttonText?: string;
    onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
    title,
    description,
    buttonText = "Let's Start",
    onStart
}) => {
    return (
        <div className="w-full max-w-4xl mx-auto px-6 flex flex-col items-center justify-center text-center min-h-[60vh]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-6"
            >
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-sm">
                    {title}
                </h1>

                {description && (
                    <p className="text-xl md:text-2xl text-slate-100/90 font-light max-w-2xl mx-auto leading-relaxed">
                        {description}
                    </p>
                )}

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="pt-12"
                >
                    <button
                        onClick={onStart}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 text-lg font-medium rounded-full hover:bg-slate-50 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95"
                    >
                        <span>{buttonText}</span>
                        <MousePointerClick className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <p className="mt-4 text-sm text-slate-300/60 uppercase tracking-widest font-medium">
                        Press <span className="font-bold text-white">Enter ↵</span>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};
