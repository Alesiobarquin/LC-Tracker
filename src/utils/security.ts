export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '#';
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return parsedUrl.href;
    }
  } catch (error) {
    // Ignore invalid URLs
  }
  return '#';
}
