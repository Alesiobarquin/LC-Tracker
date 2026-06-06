/**
 * Sanitizes a given URL string to ensure it uses an allowed protocol (http: or https:).
 * This prevents XSS attacks via javascript: or other malicious URIs.
 *
 * @param urlString - The URL string to sanitize.
 * @param fallback - The fallback string to return if the URL is invalid or unsafe (default: '#').
 * @returns The original URL if valid and safe, otherwise the fallback string.
 */
export function sanitizeUrl(urlString: string | null | undefined, fallback: string = '#'): string {
  if (!urlString) return fallback;
  try {
    const url = new URL(urlString);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch (error) {
    // Invalid URL format
  }
  return fallback;
}
