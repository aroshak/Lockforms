'use client';

import React from 'react';
import { motion } from 'framer-motion';

const themes = {
    midnight: {
        bg: "from-slate-900 via-purple-950 to-slate-900",
        blob1: "#4c1d95", // purple
        blob2: "#1e3a8a", // blue
        blob3: "#0f172a"  // slate
    },
    sunrise: {
        bg: "from-orange-950 via-rose-950 to-slate-900",
        blob1: "#f43f5e", // rose
        blob2: "#f97316", // orange
        blob3: "#7c2d12"  // brown
    },
    ocean: {
        bg: "from-cyan-950 via-blue-950 to-slate-900",
        blob1: "#06b6d4", // cyan
        blob2: "#2563eb", // blue
        blob3: "#0c4a6e"  // dark cyan
    },
    forest: {
        bg: "from-emerald-950 via-green-950 to-slate-900",
        blob1: "#10b981", // emerald
        blob2: "#15803d", // green
        blob3: "#064e3b"  // dark green
    },
    light: {
        bg: "from-slate-100 via-white to-slate-50",
        blob1: "#60a5fa", // light blue
        blob2: "#a78bfa", // light purple
        blob3: "#e2e8f0"  // slate 200
    },
    soft: {
        bg: "from-rose-50 via-white to-orange-50",
        blob1: "#fda4af", // rose
        blob2: "#fdba74", // orange
        blob3: "#fecdd3"  // light rose
    },
    corporate: {
        bg: "from-slate-200 via-slate-100 to-white",
        blob1: "#93c5fd", // blue
        blob2: "#cbd5e1", // slate
        blob3: "#e2e8f0"  // slate
    }
};

interface BackgroundProps {
    theme?: keyof typeof themes;
}

export function Background({ theme = 'midnight' }: BackgroundProps) {
    const currentTheme = themes[theme] || themes.midnight;

    return (
        <div className={`fixed inset-0 z-0 overflow-hidden bg-gradient-to-br ${currentTheme.bg}`}>
            <div className="absolute inset-0 opacity-40">
                <motion.div
                    animate={{
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[100px]"
                    style={{ backgroundColor: currentTheme.blob1 }}
                />
                <motion.div
                    animate={{
                        x: [0, -100, 0],
                        y: [0, 100, 0],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
                    className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full mix-blend-screen filter blur-[100px]"
                    style={{ backgroundColor: currentTheme.blob2 }}
                />
                <motion.div
                    animate={{
                        x: [0, 50, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 5
                    }}
                    className="absolute bottom-0 left-[20%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[120px]"
                    style={{ backgroundColor: currentTheme.blob3 }}
                />
            </div>

            {/* Noise Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay">
                <svg className="w-full h-full">
                    <filter id="noiseFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                </svg>
            </div>
        </div>
    );
};
