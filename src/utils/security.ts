/**
 * Validates URLs to prevent XSS attacks like javascript: URI injection.
 * Allows safe absolute protocols (http:, https:) and relative paths.
 * Use this function to sanitize user-provided URLs before rendering them in href or src attributes.
 */
export function isSafeUrl(url: string | null | undefined, fallback = '#'): string {
  if (!url) return fallback;

  // Allow relative URLs starting with / (but not // which is protocol-relative)
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return parsedUrl.href;
    }
  } catch (error) {
    // Return fallback for invalid URLs
    return fallback;
  }

  return fallback;
}
