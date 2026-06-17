export function sanitizeUrl(urlStr: string | undefined | null): string {
  if (!urlStr) return '#';
  try {
    const url = new URL(urlStr);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch {
    // Invalid URL, safely fallback to '#'
  }
  return '#';
}
