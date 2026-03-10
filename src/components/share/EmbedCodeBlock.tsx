'use client';

import { EmbedSettings } from '@/types/form';
import { Copy, Check } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { generateEmbedCode } from '@/lib/embed';

interface EmbedCodeBlockProps {
    embedUrl: string;
    settings: EmbedSettings;
}

export function EmbedCodeBlock({ embedUrl, settings }: EmbedCodeBlockProps) {
    const { copied, copyToClipboard } = useCopyToClipboard();
    const embedCode = generateEmbedCode(embedUrl, settings);

    if (!embedUrl) {
        return (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
                Generate a share link first to get the embed code
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Embed Code</label>
                <button
                    type="button"
                    onClick={() => copyToClipboard(embedCode)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            Copy Code
                        </>
                    )}
                </button>
            </div>

            <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-gray-700">
                    <code>{embedCode}</code>
                </pre>
            </div>

            {/* Live Preview */}
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Live Preview
                </label>
                <div className="border-2 border-gray-300 border-dashed rounded-lg overflow-hidden bg-white p-4">
                    <div
                        className="mx-auto"
                        style={{
                            width: settings.customWidth === 'full' ? '100%' : `${settings.customWidth || 600}px`,
                            maxWidth: '100%'
                        }}
                    >
                        <iframe
                            src={embedUrl}
                            width="100%"
                            height={settings.customHeight || 500}
                            frameBorder="0"
                            className="rounded-lg shadow-sm"
                            style={{
                                background: settings.transparentBackground ? 'transparent' : 'white'
                            }}
                            title="Form Embed Preview"
                        />
                        {settings.showBranding && (
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Powered by{' '}
                                <a
                                    href="https://lockforms.io"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    LockForms
                                </a>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
