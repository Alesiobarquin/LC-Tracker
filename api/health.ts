import type { IncomingMessage, ServerResponse } from 'node:http';

type Response = ServerResponse & { status: (code: number) => Response; json: (body: unknown) => void };
/** Read-only readiness check: no user rows, secrets, or provider errors in the response. */
export default async function handler(req: IncomingMessage, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET'); res.status(405).json({ status: 'method_not_allowed' }); return;
  }
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  const clerk = process.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!url || !key || !clerk) { res.status(503).json({ status: 'misconfigured' }); return; }
  try {
    const clerkDomain = Buffer.from(clerk.replace(/^pk_(live|test)_/, ''), 'base64').toString().replace(/\$$/, '');
    if (!/^[a-z0-9.-]+$/i.test(clerkDomain)) throw new Error('Invalid auth configuration');
    const results = await Promise.allSettled([
      fetch(`${url}/rest/v1/`, { headers: { apikey: key }, signal: AbortSignal.timeout(5000) }),
      fetch(`https://${clerkDomain}/.well-known/jwks.json`, { signal: AbortSignal.timeout(5000) }),
    ]);
    const checks = { database: results[0].status === 'fulfilled' && results[0].value.ok,
      authentication: results[1].status === 'fulfilled' && results[1].value.ok };
    const ready = checks.database && checks.authentication;
    res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'degraded', checks });
  } catch { res.status(503).json({ status: 'misconfigured' }); }
}
