'use client';

import { EmbedSettings } from '@/types/form';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { isValidDomain } from '@/lib/utils';

interface EmbedCustomizerProps {
    settings: EmbedSettings;
    onChange: (settings: EmbedSettings) => void;
}

export function EmbedCustomizer({ settings, onChange }: EmbedCustomizerProps) {
    const [newDomain, setNewDomain] = useState('');
    const [domainError, setDomainError] = useState('');

    const addDomain = () => {
        const domain = newDomain.trim().toLowerCase();

        if (!domain) {
            setDomainError('Domain cannot be empty');
            return;
        }

        if (!isValidDomain(domain)) {
            setDomainError('Invalid domain format (e.g., example.com)');
            return;
        }

        if (settings.allowedDomains?.includes(domain)) {
            setDomainError('Domain already added');
            return;
        }

        onChange({
            ...settings,
            allowedDomains: [...(settings.allowedDomains || []), domain],
        });

        setNewDomain('');
        setDomainError('');
    };

    const removeDomain = (domain: string) => {
        onChange({
            ...settings,
            allowedDomains: settings.allowedDomains?.filter(d => d !== domain),
        });
    };

    const handleWidthChange = (value: string) => {
        if (value === 'full') {
            onChange({ ...settings, customWidth: 'full' });
        } else {
            const numValue = parseInt(value);
            if (!isNaN(numValue) && numValue > 0) {
                onChange({ ...settings, customWidth: numValue });
            }
        }
    };

    const handleHeightChange = (value: string) => {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue > 0) {
            onChange({ ...settings, customHeight: numValue });
        }
    };

    return (
        <div className="space-y-4 p-4 glass rounded-xl border border-primary/10">
            <h3 className="font-medium text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Embed Customization
            </h3>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                        Width
                    </label>
                    <select
                        value={settings.customWidth === 'full' ? 'full' : settings.customWidth || 600}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        className="w-full px-3 py-2 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-white"
                    >
                        <option value="full">Full Width (100%)</option>
                        <option value="400">400px</option>
                        <option value="600">600px (Default)</option>
                        <option value="800">800px</option>
                        <option value="1000">1000px</option>
                        <option value="1200">1200px</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                        Height
                    </label>
                    <select
                        value={settings.customHeight || 500}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        className="w-full px-3 py-2 bg-primary/5 border border-primary/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-white"
                    >
                        <option value="400">400px</option>
                        <option value="500">500px (Default)</option>
                        <option value="600">600px</option>
                        <option value="700">700px</option>
                        <option value="800">800px</option>
                        <option value="1000">1000px</option>
                    </select>
                </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="show-branding"
                        checked={settings.showBranding ?? true}
                        onChange={(e) => onChange({ ...settings, showBranding: e.target.checked })}
                        className="w-4 h-4 rounded border-primary/20 bg-primary/5 text-primary focus:ring-primary/50"
                    />
                    <label htmlFor="show-branding" className="text-sm text-muted-foreground cursor-pointer">
                        Show &ldquo;Powered by LockForms&rdquo; branding
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="transparent"
                        checked={settings.transparentBackground ?? false}
                        onChange={(e) => onChange({ ...settings, transparentBackground: e.target.checked })}
                        className="w-4 h-4 rounded border-primary/20 bg-primary/5 text-primary focus:ring-primary/50"
                    />
                    <label htmlFor="transparent" className="text-sm text-muted-foreground cursor-pointer">
                        Transparent background
                    </label>
                </div>
            </div>

            {/* Domain Whitelist */}
            <div className="space-y-2 pt-3 border-t border-primary/10">
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                        Allowed Domains (optional)
                    </label>
                    <p className="text-xs text-muted-foreground/60 mb-2">
                        Leave empty to allow embedding from any domain
                    </p>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={newDomain}
                            onChange={(e) => {
                                setNewDomain(e.target.value);
                                setDomainError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                            placeholder="example.com"
                            className={`w-full px-3 py-2 bg-primary/5 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-white placeholder:text-muted-foreground/50 ${
                                domainError ? 'border-red-500' : 'border-primary/20'
                            }`}
                        />
                        {domainError && (
                            <p className="text-xs text-red-400 mt-1">{domainError}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={addDomain}
                        className="px-3 py-2 bg-primary text-white rounded-md hover:brightness-110 transition-all flex items-center gap-1 shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                </div>

                {settings.allowedDomains && settings.allowedDomains.length > 0 && (
                    <div className="space-y-1">
                        {settings.allowedDomains.map((domain) => (
                            <div
                                key={domain}
                                className="flex items-center justify-between p-2 glass rounded-lg text-sm"
                            >
                                <span className="font-mono text-white/80">{domain}</span>
                                <button
                                    type="button"
                                    onClick={() => removeDomain(domain)}
                                    className="text-muted-foreground hover:text-red-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
