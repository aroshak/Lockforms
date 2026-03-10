'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormSettingsPanelProps {
    settings: any;
    onChange: (settings: any) => void;
}

const themes = [
    { value: 'midnight', label: 'Midnight', gradient: 'from-indigo-900 via-purple-900 to-pink-900' },
    { value: 'sunrise', label: 'Sunrise', gradient: 'from-orange-400 via-pink-500 to-purple-600' },
    { value: 'ocean', label: 'Ocean', gradient: 'from-blue-500 via-cyan-500 to-teal-500' },
    { value: 'forest', label: 'Forest', gradient: 'from-green-700 via-emerald-600 to-teal-600' },
    { value: 'light', label: 'Crisp White', gradient: 'from-gray-100 to-white' },
    { value: 'soft', label: 'Soft Pearl', gradient: 'from-slate-200 via-gray-100 to-zinc-100' },
    { value: 'corporate', label: 'Corporate', gradient: 'from-slate-700 via-gray-600 to-slate-500' },
];

const transitions = [
    { value: 'tunnel', label: 'Tunnel', description: '3D depth effect' },
    { value: 'slide', label: 'Flow', description: 'Smooth horizontal slide' },
    { value: 'fade', label: 'Fade', description: 'Simple fade transition' },
    { value: 'stack', label: 'Stack', description: 'Vertical stacking' },
];

export function FormSettingsPanel({ settings = {}, onChange }: FormSettingsPanelProps) {
    const currentTheme = settings.theme || 'midnight';
    const currentTransition = settings.transition || 'tunnel';
    const welcomeScreen = settings.welcomeScreen || { enabled: false, title: '', description: '', buttonText: "Let's Start" };
    const endScreen = settings.endScreen || { enabled: false, title: 'Thank you!', description: 'Your submission has been received.', buttonText: 'Submit another', redirectUrl: '' };

    const updateSettings = (key: string, value: any) => {
        onChange({ ...settings, [key]: value });
    };

    const updateWelcomeScreen = (key: string, value: any) => {
        onChange({
            ...settings,
            welcomeScreen: { ...welcomeScreen, [key]: value }
        });
    };

    const updateEndScreen = (key: string, value: any) => {
        onChange({
            ...settings,
            endScreen: { ...endScreen, [key]: value }
        });
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
            {/* Theme Selection */}
            <div className="space-y-3">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Theme</Label>
                <div className="grid grid-cols-2 gap-2">
                    {themes.map((theme) => (
                        <button
                            key={theme.value}
                            onClick={() => updateSettings('theme', theme.value)}
                            className={cn(
                                "relative p-3 rounded-lg border transition-all text-left overflow-hidden group",
                                currentTheme === theme.value
                                    ? "border-primary ring-2 ring-primary/20 bg-primary/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                            )}
                        >
                            <div className={cn("absolute inset-0 opacity-30 bg-gradient-to-br", theme.gradient)} />
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-white">{theme.label}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Transition Selection */}
            <div className="space-y-3">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Transitions</Label>
                <div className="grid grid-cols-2 gap-2">
                    {transitions.map((transition) => (
                        <button
                            key={transition.value}
                            onClick={() => updateSettings('transition', transition.value)}
                            className={cn(
                                "p-3 rounded-lg border transition-all text-left",
                                currentTransition === transition.value
                                    ? "border-primary ring-2 ring-primary/20 bg-primary/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                            )}
                        >
                            <p className="text-sm font-medium text-white">{transition.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{transition.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                <Label className="text-white">Show Progress Bar</Label>
                <input
                    type="checkbox"
                    checked={settings.showProgressBar !== false}
                    onChange={(e) => updateSettings('showProgressBar', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                />
            </div>

            {/* Welcome Screen */}
            <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Welcome Screen</Label>
                    <input
                        type="checkbox"
                        checked={welcomeScreen.enabled}
                        onChange={(e) => updateWelcomeScreen('enabled', e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                    />
                </div>

                {welcomeScreen.enabled && (
                    <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                        <div>
                            <Label className="text-xs text-muted-foreground">Title</Label>
                            <Input
                                value={welcomeScreen.title}
                                onChange={(e) => updateWelcomeScreen('title', e.target.value)}
                                placeholder="Welcome to my form"
                                className="mt-1 bg-white/5 border-white/10"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <Input
                                value={welcomeScreen.description || ''}
                                onChange={(e) => updateWelcomeScreen('description', e.target.value)}
                                placeholder="Optional description"
                                className="mt-1 bg-white/5 border-white/10"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Button Text</Label>
                            <Input
                                value={welcomeScreen.buttonText}
                                onChange={(e) => updateWelcomeScreen('buttonText', e.target.value)}
                                placeholder="Let's Start"
                                className="mt-1 bg-white/5 border-white/10"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* End Screen */}
            <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">End Screen</Label>
                    <input
                        type="checkbox"
                        checked={endScreen.enabled}
                        onChange={(e) => updateEndScreen('enabled', e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                    />
                </div>

                {endScreen.enabled && (
                    <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                        <div>
                            <Label className="text-xs text-muted-foreground">Title</Label>
                            <Input
                                value={endScreen.title}
                                onChange={(e) => updateEndScreen('title', e.target.value)}
                                placeholder="Thank you!"
                                className="mt-1 bg-white/5 border-white/10"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <Input
                                value={endScreen.description || ''}
                                onChange={(e) => updateEndScreen('description', e.target.value)}
                                placeholder="Your submission has been received"
                                className="mt-1 bg-white/5 border-white/10"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Button Text</Label>
                            <Input
                                value={endScreen.buttonText || ''}
                                onChange={(e) => updateEndScreen('buttonText', e.target.value)}
                                placeholder="Submit another"
                                className="mt-1 bg-white/5 border-white/10"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Redirect URL (optional)</Label>
                            <Input
                                value={endScreen.redirectUrl || ''}
                                onChange={(e) => updateEndScreen('redirectUrl', e.target.value)}
                                placeholder="https://example.com"
                                className="mt-1 bg-white/5 border-white/10"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
