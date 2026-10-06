import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../api/health';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
function response() {
  const res = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}
describe('read-only readiness endpoint', () => {
  it('returns a safe configuration error without network requests', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubGlobal('fetch', vi.fn());
    const res = response();
    await handler({ method: 'GET' } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ status: 'misconfigured' });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('checks provider readiness with bounded read-only requests', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-test-key');
    vi.stubEnv('VITE_CLERK_PUBLISHABLE_KEY', `pk_test_${Buffer.from('auth.example.invalid$').toString('base64')}`);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const res = response();
    await handler({ method: 'GET' } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok', checks: { database: true, authentication: true } });
    for (const [, options] of vi.mocked(fetch).mock.calls) expect(options?.signal).toBeInstanceOf(AbortSignal);
  });
  it('works when public API schema discovery is disabled', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-test-key');
    vi.stubEnv('VITE_CLERK_PUBLISHABLE_KEY', `pk_test_${Buffer.from('auth.example.invalid$').toString('base64')}`);
    const requests: URL[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      requests.push(url);
      return { ok: url.pathname !== '/rest/v1/' };
    }));
    const res = response();
    await handler({ method: 'GET' } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(200);
    const database = requests.find(url => url.hostname === 'test.supabase.co')!;
    expect(database.pathname).toBe('/rest/v1/problem_progress');
    expect(database.searchParams.get('limit')).toBe('0');
  });
});
