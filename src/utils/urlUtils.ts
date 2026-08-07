export function sanitizeUrl(urlStr: string | undefined | null, fallback = '#'): string {
  if (!urlStr) return fallback;

  try {
    const url = new URL(urlStr);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch {
    // Invalid URL or failed parsing, fall through to returning fallback
  }

  return fallback;
}
