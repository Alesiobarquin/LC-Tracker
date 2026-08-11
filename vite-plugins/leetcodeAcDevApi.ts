import type { Plugin } from 'vite';
import { fetchRecentAcSubmissionsFromLeetCode } from '../server/leetcodeAc';

/** Local `/api/leetcode-ac` for Vite so Settings sync works without Vercel. */
export function leetcodeAcDevApi(): Plugin {
  return {
    name: 'leetcode-ac-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/leetcode-ac', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const host = req.headers.host || 'localhost';
          const url = new URL(req.url || '/', `http://${host}`);
          const username = url.searchParams.get('username');
          const limit = Number.parseInt(url.searchParams.get('limit') || '50', 10);

          if (!username) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing username' }));
            return;
          }

          const { submissions } = await fetchRecentAcSubmissionsFromLeetCode(username, limit);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify({ submissions }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch LeetCode submissions';
          const statusCode =
            typeof error === 'object' &&
            error &&
            'statusCode' in error &&
            typeof (error as { statusCode: unknown }).statusCode === 'number'
              ? (error as { statusCode: number }).statusCode
              : 502;
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}
