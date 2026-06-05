/**
 * Sanitizes a URL to prevent javascript: URI injection and other malicious protocols.
 * Allows only http: and https: protocols.
 *
 * @param url The URL string to sanitize.
 * @param fallback The fallback URL to return if the input is invalid or malicious.
 * @returns The sanitized URL or the fallback.
 */
export function sanitizeUrl(url: string | undefined | null, fallback = '#'): string {
  if (!url) return fallback;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return parsedUrl.href;
    }
  } catch (e) {
    // Invalid URL format
  }

  return fallback;
}
