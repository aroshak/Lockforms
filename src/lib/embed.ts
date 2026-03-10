import { EmbedSettings } from '@/types/form';

/**
 * Generates HTML iframe embed code for a form
 * @param embedUrl - The URL to embed (should include ?embed=true parameter)
 * @param settings - Embed customization settings
 * @returns HTML string for iframe embed code
 */
export function generateEmbedCode(embedUrl: string, settings: EmbedSettings): string {
    const width = settings.customWidth === 'full' ? '100%' : `${settings.customWidth || 600}px`;
    const height = `${settings.customHeight || 500}px`;
    const transparent = settings.transparentBackground ? ' style="background: transparent;"' : '';
    const showBranding = settings.showBranding ?? true;

    const iframeCode = `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  frameborder="0"
  allowfullscreen${transparent}
  title="LockForms Embedded Form"
></iframe>`;

    const brandingCode = showBranding
        ? `\n<p style="font-size: 10px; color: #666; margin-top: 8px;">
  Powered by <a href="https://lockforms.io" target="_blank" style="color: #3b82f6; text-decoration: none;">LockForms</a>
</p>`
        : '';

    return `${iframeCode}${brandingCode}`;
}

/**
 * Generates a shareable URL for a form
 * @param baseUrl - The base URL of the application (e.g., https://example.com)
 * @param slug - The form slug
 * @param token - Optional secure token for link-only access
 * @returns Full shareable URL
 */
export function generateShareableUrl(
    baseUrl: string,
    slug: string,
    token?: string
): string {
    return `${baseUrl}/f/${slug}${token ? `?token=${token}` : ''}`;
}

/**
 * Generates an embed URL for a form (includes ?embed=true parameter)
 * @param baseUrl - The base URL of the application
 * @param slug - The form slug
 * @param token - Optional secure token for link-only access
 * @returns Full embed URL with embed parameter
 */
export function generateEmbedUrl(
    baseUrl: string,
    slug: string,
    token?: string
): string {
    return `${baseUrl}/f/${slug}?embed=true${token ? `&token=${token}` : ''}`;
}

/**
 * Gets the preview URL for an embed (same as embed URL)
 * @param baseUrl - The base URL of the application
 * @param slug - The form slug
 * @param token - Optional secure token
 * @returns Embed preview URL
 */
export function getEmbedPreviewUrl(
    baseUrl: string,
    slug: string,
    token?: string
): string {
    return generateEmbedUrl(baseUrl, slug, token);
}
