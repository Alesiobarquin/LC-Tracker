/**
 * Centralized utility functions for URL handling and sanitization.
 */

/**
 * Sanitizes a URL to ensure it uses safe protocols (http or https).
 * Returns '#' if the URL is invalid or uses an unsafe protocol (like javascript:).
 *
 * @param urlString The raw URL string to sanitize
 * @returns The sanitized URL string or '#'
 */
export function sanitizeUrl(urlString: string | null | undefined): string {
  if (!urlString) return '#';

  try {
    const url = new URL(urlString);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch {
    // Invalid URL structure, fallback to '#'
  }

  return '#';
}
