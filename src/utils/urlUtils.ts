export function sanitizeUrl(urlString: string | null | undefined, fallback: string = '#'): string {
  if (!urlString) return fallback;
  try {
    const url = new URL(urlString);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch {
    // Invalid URL
  }
  return fallback;
}
