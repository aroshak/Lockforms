'use client';

import { useState, useEffect } from 'react';
import { Link as LinkIcon, Code, Copy, Check, Loader2 } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { AccessLevelSelector } from './AccessLevelSelector';
import { EmbedCustomizer } from './EmbedCustomizer';
import { EmbedCodeBlock } from './EmbedCodeBlock';
import { AccessLevel, SharingSettings, EmbedSettings } from '@/types/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SharePanelProps {
    formId: string;
    formSlug: string;
    initialSettings?: SharingSettings;
}

export function SharePanel({ formId: _formId, formSlug, initialSettings }: SharePanelProps) {
    const [activeTab, setActiveTab] = useState<'link' | 'embed'>('link');
    const [accessLevel, setAccessLevel] = useState<AccessLevel>(initialSettings?.accessLevel || 'public');
    const [allowEmbedding, setAllowEmbedding] = useState(initialSettings?.allowEmbedding || false);
    const [embedSettings, setEmbedSettings] = useState<EmbedSettings>(
        initialSettings?.embedSettings || {
            customHeight: 500,
            customWidth: 600,
            showBranding: true,
            transparentBackground: false,
            allowedDomains: []
        }
    );
    const [shareUrl, setShareUrl] = useState('');
    const [embedUrl, setEmbedUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [password, setPassword] = useState('');

    const { copied, copyToClipboard } = useCopyToClipboard();

    // Load existing share settings on mount
    useEffect(() => {
        loadShareSettings();
    }, [formSlug]);

    const loadShareSettings = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/forms/${formSlug}/share`);
            const data = await response.json();

            if (data.success && data.sharingSettings) {
                setAccessLevel(data.sharingSettings.accessLevel);
                // setPassword(data.sharingSettings.password || ''); // Don't expose password
                setAllowEmbedding(data.sharingSettings.allowEmbedding);
                if (data.sharingSettings.embedSettings) {
                    setEmbedSettings(data.sharingSettings.embedSettings);
                }
                setShareUrl(data.shareUrl);
                setEmbedUrl(data.shareUrl); // Usually same as share URL but might differ
            } else {
                // Default
                const url = `${window.location.origin}/f/${formSlug}`;
                setShareUrl(url);
                setEmbedUrl(url);
            }
        } catch (error) {
            console.error(error);
            const url = `${window.location.origin}/f/${formSlug}`;
            setShareUrl(url);
            setEmbedUrl(url);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateLink = async () => {
        setIsSaving(true);
        try {
            const settings: SharingSettings = {
                accessLevel,
                password: accessLevel === 'password-protected' ? password : undefined,
                allowEmbedding,
                embedSettings: allowEmbedding ? embedSettings : undefined
            };

            const response = await fetch(`/api/forms/${formSlug}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await response.json();

            if (data.success) {
                setShareUrl(data.shareUrl);
                // Toast success
            }
        } catch (error) {
            console.error('Error saving share settings:', error);
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-white/10 bg-black/20">
                <h2 className="text-lg font-bold text-white mb-1">Share Form</h2>
                <p className="text-xs text-muted-foreground">Control access and distribution</p>

                <div className="flex gap-2 mt-4 bg-black/40 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('link')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'link' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-white'}`}
                    >
                        <LinkIcon className="w-3 h-3" /> Link
                    </button>
                    <button
                        onClick={() => setActiveTab('embed')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'embed' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-white'}`}
                    >
                        <Code className="w-3 h-3" /> Embed
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Link Tab */}
                        {activeTab === 'link' && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white">Share URL</label>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={shareUrl}
                                            className="bg-black/40 border-white/10 text-muted-foreground font-mono text-xs"
                                        />
                                        <Button size="icon" variant="secondary" onClick={() => copyToClipboard(shareUrl)}>
                                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-4">
                                    <AccessLevelSelector
                                        accessLevel={accessLevel}
                                        onChange={setAccessLevel}
                                        password={password}
                                        onPasswordChange={setPassword}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-black/20 hover:bg-black/30 transition-colors">
                                    <div>
                                        <label className="text-sm font-medium text-white block">Allow Embedding</label>
                                        <span className="text-xs text-muted-foreground">Enable to generate embed code</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={allowEmbedding}
                                        onChange={(e) => setAllowEmbedding(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                                    />
                                </div>

                                <Button
                                    onClick={handleGenerateLink}
                                    disabled={isSaving}
                                    className="w-full bg-primary hover:bg-primary/90 text-white"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Save Settings
                                </Button>
                            </div>
                        )}

                        {/* Embed Code Tab */}
                        {activeTab === 'embed' && (
                            <div className="space-y-4">
                                {!allowEmbedding ? (
                                    <div className="p-4 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
                                        <p className="text-sm text-yellow-200">
                                            ⚠️ Embedding is disabled. Enable it in the "Link" tab to generate embed code.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <EmbedCustomizer
                                            settings={embedSettings}
                                            onChange={setEmbedSettings}
                                        />

                                        <EmbedCodeBlock
                                            embedUrl={embedUrl}
                                            settings={embedSettings}
                                        />

                                        <Button
                                            onClick={handleGenerateLink}
                                            disabled={isSaving}
                                            variant="outline"
                                            className="w-full border-primary/50 text-primary-200 hover:bg-primary/10 hover:text-white"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : null}
                                            Update Embed Settings
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
