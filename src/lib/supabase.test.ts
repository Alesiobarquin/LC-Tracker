import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createClient: vi.fn(() => ({})) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

async function clientOptions() {
  await import('./supabase');
  return (mocks.createClient.mock.calls[0] as unknown as [string, string, {
    accessToken: () => Promise<string | null>;
    global: { fetch: typeof fetch };
  }])[2];
}

describe('Clerk-backed Supabase client', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.createClient.mockClear();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
    vi.stubGlobal('window', {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('supplies the Clerk token through the SDK accessToken option', async () => {
    vi.stubGlobal('window', { Clerk: { session: { getToken: async () => 'clerk-jwt' } } });
    const options = await clientOptions();
    await expect(options.accessToken()).resolves.toBe('clerk-jwt');
  });

  it('allows anonymous access when there is no Clerk session', async () => {
    await expect((await clientOptions()).accessToken()).resolves.toBeNull();
  });

  it('surfaces token failures instead of silently reading as an anonymous user', async () => {
    vi.stubGlobal('window', { Clerk: { session: { getToken: async () => { throw new Error('Clerk offline'); } } } });
    await expect((await clientOptions()).accessToken()).rejects.toThrow('Clerk offline');
  });

  it('rejects stalled token requests and cleans up the deadline timer', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', { Clerk: { session: { getToken: () => new Promise(() => {}) } } });
    const options = await clientOptions();
    const pending = expect(options.accessToken()).rejects.toThrow('Sign-in token timed out');
    await vi.advanceTimersByTimeAsync(3000);
    await pending;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves caller cancellation while adding a network deadline', async () => {
    const request = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', request);
    const options = await clientOptions();
    const controller = new AbortController();
    await options.global.fetch('https://test.supabase.co', { signal: controller.signal });
    const passedSignal = request.mock.calls[0][1].signal as AbortSignal;
    expect(passedSignal.aborted).toBe(false);
    controller.abort();
    expect(passedSignal.aborted).toBe(true);
  });
});
