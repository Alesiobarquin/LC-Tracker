/**
 * Sanitizes a URL to prevent XSS attacks like javascript: URI injection.
 * Enforces http: or https: protocols.
 */
export function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return url;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return parsedUrl.toString();
    }
  } catch (error) {
    // If URL parsing fails, it's likely a relative URL or invalid.
    // If it starts with '/', let it pass as a relative route.
    if (url.startsWith('/')) {
        return url;
    }
  }

  // Return undefined for unsafe URLs
  return undefined;
}
