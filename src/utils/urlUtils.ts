export function sanitizeUrl(urlStr: string | null | undefined): string {
  if (!urlStr) return '#';
  try {
    const url = new URL(urlStr);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
    return '#';
  } catch {
    return '#';
  }
}
