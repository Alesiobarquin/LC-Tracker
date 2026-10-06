import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRecentAcSubmissionsFromLeetCode } from './leetcodeAc';
beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
afterEach(() => vi.unstubAllGlobals());
describe('LeetCode upstream proxy', () => {
  it('normalizes limits and gives the upstream request a deadline', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ data: { recentAcSubmissionList: [] } }) } as Response);
    await fetchRecentAcSubmissionsFromLeetCode(' @test ', NaN);
    const options = vi.mocked(fetch).mock.calls[0][1]!;
    expect(JSON.parse(options.body as string).variables).toEqual({ username: 'test', limit: 50 });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
  it('rejects invalid usernames before making requests', async () => {
    await expect(fetchRecentAcSubmissionsFromLeetCode(' '.repeat(3))).rejects.toMatchObject({ statusCode: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('surfaces invalid successful responses as upstream errors', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    await expect(fetchRecentAcSubmissionsFromLeetCode('test')).rejects.toMatchObject({ statusCode: 502 });
  });
});
