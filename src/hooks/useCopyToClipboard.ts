'use client';

import { useState, useCallback } from 'react';

/**
 * Custom hook for copying text to clipboard
 * Includes fallback for older browsers and automatic reset after delay
 *
 * @param resetDelay - Time in milliseconds before resetting copied state (default: 2000ms)
 * @returns Object with copied state and copyToClipboard function
 *
 * @example
 * const { copied, copyToClipboard } = useCopyToClipboard();
 *
 * <button onClick={() => copyToClipboard('Hello World')}>
 *   {copied ? 'Copied!' : 'Copy'}
 * </button>
 */
export function useCopyToClipboard(resetDelay = 2000) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = useCallback(async (text: string) => {
        if (!text) return;

        try {
            // Modern Clipboard API (preferred)
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = text;

                // Make the textarea invisible and position off-screen
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                textArea.style.opacity = '0';

                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                // Execute copy command
                const success = document.execCommand('copy');
                textArea.remove();

                if (!success) {
                    throw new Error('Copy command failed');
                }
            }

            // Set copied state to true
            setCopied(true);

            // Reset copied state after delay
            setTimeout(() => setCopied(false), resetDelay);
        } catch (error) {
            console.error('Failed to copy text to clipboard:', error);
            setCopied(false);
        }
    }, [resetDelay]);

    return { copied, copyToClipboard };
}
