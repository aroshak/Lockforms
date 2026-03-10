'use client';

import { useState } from 'react';
import { Share2, Check, Loader2 } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

interface QuickShareButtonProps {
    formSlug: string;
}

export function QuickShareButton({ formSlug }: QuickShareButtonProps) {
    const { copied, copyToClipboard } = useCopyToClipboard();
    const [isLoading, setIsLoading] = useState(false);

    const handleQuickShare = async () => {
        setIsLoading(true);
        try {
            // Try to get existing share link first
            const response = await fetch(`/api/forms/${formSlug}/share`);
            const data = await response.json();

            // Use the share URL from settings, or default to basic URL
            const shareUrl = data.success && data.shareUrl
                ? data.shareUrl
                : `${window.location.origin}/f/${formSlug}`;

            await copyToClipboard(shareUrl);
        } catch (error) {
            console.error('Error sharing:', error);
            // Fallback to basic URL if API fails
            await copyToClipboard(`${window.location.origin}/f/${formSlug}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleQuickShare}
            disabled={isLoading || copied}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-white/5 border border-white/10 rounded-md hover:bg-white/10 hover:text-white hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
            {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
                <Share2 className="w-3.5 h-3.5" />
            )}
            {copied ? 'Copied!' : 'Share'}
        </button>
    );
}
