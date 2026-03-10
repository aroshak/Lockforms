import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, RotateCcw } from 'lucide-react';

interface EndScreenProps {
    title: string;
    description?: string;
    buttonText?: string;
    redirectUrl?: string;
    onRestart?: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({
    title,
    description,
    buttonText = "Submit Another",
    redirectUrl,
    onRestart
}) => {
    return (
        <div className="w-full max-w-4xl mx-auto px-6 flex flex-col items-center justify-center text-center min-h-[60vh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-8"
            >
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.5)]"
                >
                    <CheckCircle2 className="w-12 h-12 text-black" />
                </motion.div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white drop-shadow-sm">
                        {title}
                    </h1>

                    {description && (
                        <p className="text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="pt-8"
                >
                    {redirectUrl ? (
                        <a
                            href={redirectUrl}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-white/10 border border-white/20 text-white rounded-full hover:bg-white/20 transition-all"
                        >
                            <span>{buttonText}</span>
                        </a>
                    ) : (
                        <button
                            onClick={onRestart}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-white/10 border border-white/20 text-white rounded-full hover:bg-white/20 transition-all"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>{buttonText}</span>
                        </button>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};
