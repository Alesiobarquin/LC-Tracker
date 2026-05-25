export function sanitizeUrl(urlStr: string, fallback = '#'): string {
  if (!urlStr) return fallback;
  try {
    const url = new URL(urlStr);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
