export function sanitizeUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch (e) {
    // Invalid URL
  }
  return '#';
}
