import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchRecentAcSubmissionsFromLeetCode } from '../server/leetcodeAc';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
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
