export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '#';
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return parsedUrl.href;
    }
  } catch {
    // Invalid URL, safely fallback
  }
  return '#';
}
