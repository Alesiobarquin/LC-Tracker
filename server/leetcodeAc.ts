const RECENT_AC_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
      statusDisplay
      lang
    }
  }
`;

/**
 * Server-side LeetCode recent AC submissions fetch (bypasses browser CORS).
 * Used by Vercel `/api/leetcode-ac` and the Vite dev middleware.
 */
export async function fetchRecentAcSubmissionsFromLeetCode(
  username: string,
  limit = 50
): Promise<{
  submissions: Array<{
    id?: string;
    title: string;
    titleSlug: string;
    timestamp: string;
    statusDisplay: string;
    lang: string;
  }>;
}> {
  const cleaned = username.trim().replace(/^@/, '');
  if (!cleaned) {
    const error = new Error('Enter a LeetCode username');
    (error as Error & { statusCode: number }).statusCode = 400;
    throw error;
  }

  const clampedLimit = Math.min(Math.max(limit, 1), 50);
  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
      Origin: 'https://leetcode.com',
      'User-Agent': 'LC-Tracker/1.0',
    },
    body: JSON.stringify({
      query: RECENT_AC_QUERY,
      variables: { username: cleaned, limit: clampedLimit },
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(`LeetCode returned ${response.status}`);
    (error as Error & { statusCode: number }).statusCode = 502;
    throw error;
  }

  if (payload?.errors?.length) {
    const message = String(payload.errors[0]?.message || 'LeetCode GraphQL error');
    const error = new Error(message);
    (error as Error & { statusCode: number }).statusCode = /not found|user/i.test(message)
      ? 404
      : 502;
    throw error;
  }

  const submissions = payload?.data?.recentAcSubmissionList;
  if (!Array.isArray(submissions)) {
    const error = new Error('Unexpected LeetCode response shape');
    (error as Error & { statusCode: number }).statusCode = 502;
    throw error;
  }

  return { submissions };
}
