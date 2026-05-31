/**
 * Sanitizes a given URL string by ensuring it uses a secure protocol (http or https).
 * Fallbacks to '#' if the URL is invalid or uses a non-secure protocol (e.g., javascript:, data:).
 *
 * @param urlString The raw URL string to sanitize.
 * @returns A sanitized URL string safe for href or src attributes.
 */
export function sanitizeUrl(urlString: string | undefined | null): string {
  const fallbackUrl = '#';
  if (!urlString) return fallbackUrl;

  try {
    const url = new URL(urlString);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
    return fallbackUrl;
  } catch (e) {
    // Invalid URL format
    return fallbackUrl;
  }
}
