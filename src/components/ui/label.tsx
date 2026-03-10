import * as React from "react";
import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority"; // Using helper type if available or just raw

// Simplified label component
export function Label({ className, children, required, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
    return (
        <label
            className={cn(
                "text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-primary mb-3 block",
                className
            )}
            {...props}
        >
            {children}
            {required && <span className="text-error ml-1">*</span>}
        </label>
    );
}
