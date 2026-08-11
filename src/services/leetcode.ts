export interface LeetCodeSubmission {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

export class LeetCodeApiError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LeetCodeApiError';
    Object.setPrototypeOf(this, LeetCodeApiError.prototype);
  }
}

function normalizeUsername(username: string): string {
  return username.trim().replace(/^@/, '');
}

function asSubmissions(value: unknown): LeetCodeSubmission[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is LeetCodeSubmission => {
    return (
      !!row &&
      typeof row === 'object' &&
      typeof (row as LeetCodeSubmission).titleSlug === 'string' &&
      typeof (row as LeetCodeSubmission).timestamp === 'string'
    );
  });
}

async function fetchViaSameOriginProxy(username: string): Promise<LeetCodeSubmission[]> {
  const response = await fetch(
    `/api/leetcode-ac?username=${encodeURIComponent(username)}&limit=50`,
    { headers: { Accept: 'application/json' } }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new LeetCodeApiError(
      typeof payload?.error === 'string' ? payload.error : `LeetCode proxy failed (${response.status})`
    );
  }

  const submissions = asSubmissions(payload?.submissions);
  if (payload?.submissions && !Array.isArray(payload.submissions)) {
    throw new LeetCodeApiError('Unexpected LeetCode proxy response');
  }
  return submissions;
}

async function fetchViaAlfaFallback(username: string): Promise<LeetCodeSubmission[]> {
  const fallbackEndpoint = `https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/acSubmission`;
  const response = await fetch(fallbackEndpoint);
  if (!response.ok) {
    const errorText = await response.text();
    throw new LeetCodeApiError(`Fallback API failed: ${errorText || response.statusText}`);
  }
  const data = await response.json();
  return asSubmissions(data?.submission);
}

/**
 * Fetch recent accepted LeetCode submissions for a public username.
 * Prefers the same-origin `/api/leetcode-ac` proxy (no CORS), then Alfa fallback.
 */
export const fetchLeetCodeProfile = async (username: string): Promise<LeetCodeSubmission[]> => {
  const cleaned = normalizeUsername(username);
  if (!cleaned) {
    throw new LeetCodeApiError('Enter a LeetCode username');
  }

  try {
    return await fetchViaSameOriginProxy(cleaned);
  } catch (error) {
    console.warn('Primary LeetCode proxy failed, falling back to Alfa API...', error);

    try {
      return await fetchViaAlfaFallback(cleaned);
    } catch (fallbackError) {
      if (fallbackError instanceof LeetCodeApiError) {
        throw fallbackError;
      }
      if (error instanceof LeetCodeApiError) {
        throw error;
      }
      throw new LeetCodeApiError('All LeetCode API methods failed', { cause: fallbackError });
    }
  }
};
