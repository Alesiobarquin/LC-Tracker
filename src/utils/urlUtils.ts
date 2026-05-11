/**
 * Sanitizes a given URL string by ensuring it uses a safe protocol (http or https).
 * Prevents XSS attacks like javascript: URI injection.
 *
 * @param urlString The URL to sanitize.
 * @param fallback The fallback string to return if the URL is invalid. Defaults to '#'.
 * @returns The sanitized URL or the fallback.
 */
export function sanitizeUrl(urlString: string | null | undefined, fallback: string = '#'): string {
  if (!urlString) return fallback;

  try {
    const url = new URL(urlString);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch {
    // Invalid URL or parsing failed
  }

  return fallback;
}
