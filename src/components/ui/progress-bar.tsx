import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
    progress: number; // 0 to 100
    className?: string;
}

export function ProgressBar({ progress, className }: ProgressBarProps) {
    return (
        <div className={cn("w-full bg-gray-100 rounded-full h-1.5 overflow-hidden", className)}>
            <div
                className="bg-primary-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
        </div>
    );
}
