/**
 * Sanitizes a URL by ensuring it uses HTTP or HTTPS protocol to prevent XSS.
 * @param url The URL to sanitize.
 * @param fallback The fallback string to use if the URL is invalid.
 * @returns The original URL if it's safe, otherwise the fallback.
 */
export function sanitizeUrl(url: string | undefined | null, fallback: string = '#'): string {
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch (e) {
    // Invalid URL
  }
  return fallback;
}
