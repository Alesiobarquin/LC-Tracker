import type { IncomingMessage, ServerResponse } from 'node:http';
type VercelRequest = IncomingMessage & { query: Record<string, string | string[] | undefined> };
type VercelResponse = ServerResponse & { status: (code: number) => VercelResponse; json: (body: unknown) => void };
import { fetchRecentAcSubmissionsFromLeetCode } from '../server/leetcodeAc';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const usernameParam = req.query.username;
  const username = Array.isArray(usernameParam) ? usernameParam[0] : usernameParam;
  const limitParam = req.query.limit;
  const limitRaw = Array.isArray(limitParam) ? limitParam[0] : limitParam;
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;

  if (!username || typeof username !== 'string') {
    res.status(400).json({ error: 'Missing username' });
    return;
  }

  try {
    const { submissions } = await fetchRecentAcSubmissionsFromLeetCode(username, limit);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(200).json({ submissions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch LeetCode submissions';
    const statusCode =
      typeof error === 'object' &&
      error &&
      'statusCode' in error &&
      typeof (error as { statusCode: unknown }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 502;
    res.status(statusCode).json({ error: message });
  }
}
