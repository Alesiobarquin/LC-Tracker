/**
 * Safely parses a URL string and ensures it uses an allowed protocol (http: or https:).
 * Returns the sanitized URL string, or the fallback string if invalid.
 */
export function sanitizeUrl(url: string | undefined | null, fallback = '#'): string {
  if (!url) return fallback;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return parsedUrl.href;
    }
    return fallback;
  } catch (e) {
    return fallback;
  }
}
