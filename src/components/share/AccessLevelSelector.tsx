'use client';

import { AccessLevel } from '@/types/form';
import { Globe, Lock, Link as LinkIcon, Key } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AccessLevelSelectorProps {
    accessLevel: AccessLevel;
    onChange: (level: AccessLevel) => void;
    password?: string;
    onPasswordChange?: (password: string) => void;
}

export function AccessLevelSelector({ accessLevel, onChange, password, onPasswordChange }: AccessLevelSelectorProps) {
    const options = [
        {
            value: 'public' as AccessLevel,
            label: 'Public',
            description: 'Anyone with the link can access this form',
            icon: Globe,
        },
        {
            value: 'link-only' as AccessLevel,
            label: 'Link Only',
            description: 'Only those with a special link can access',
            icon: LinkIcon,
        },
        {
            value: 'password-protected' as AccessLevel,
            label: 'Password Protected',
            description: 'Requires a password to access',
            icon: Key,
        },
        {
            value: 'private' as AccessLevel,
            label: 'Private',
            description: 'Form is disabled and cannot be accessed',
            icon: Lock,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-white">Access Level</label>
                <div className="grid grid-cols-1 gap-3">
                    {options.map((option) => {
                        const isSelected = accessLevel === option.value;
                        const Icon = option.icon;

                        return (
                            <button
                                key={option.value}
                                onClick={() => onChange(option.value)}
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-200 border",
                                    isSelected
                                        ? "bg-primary/20 border-primary/50 ring-1 ring-primary/50"
                                        : "bg-black/20 border-white/10 hover:bg-black/40 hover:border-white/20"
                                )}
                            >
                                <div className={cn(
                                    "rounded-lg p-2 flex items-center justify-center",
                                    isSelected ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className={cn(
                                        "font-medium text-sm mb-0.5",
                                        isSelected ? "text-white" : "text-gray-300"
                                    )}>
                                        {option.label}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {option.description}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {accessLevel === 'password-protected' && (
                <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-medium text-primary-300 uppercase tracking-wider">Required Password</label>
                    <Input
                        type="text"
                        value={password || ''}
                        onChange={(e) => onPasswordChange?.(e.target.value)}
                        placeholder="Set a secure password..."
                        className="bg-black/40 border-primary/30 text-white placeholder:text-muted-foreground/50 focus:ring-primary/50"
                    />
                </div>
            )}
        </div>
    );
}
