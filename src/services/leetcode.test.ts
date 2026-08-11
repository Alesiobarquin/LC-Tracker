import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLeetCodeProfile, LeetCodeApiError } from './leetcode';

describe('fetchLeetCodeProfile', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return submissions when the same-origin proxy succeeds', async () => {
    const mockSubmissions = [
      { title: 'Two Sum', titleSlug: 'two-sum', timestamp: '123', statusDisplay: 'Accepted', lang: 'python' }
    ];

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ submissions: mockSubmissions })
    });

    const result = await fetchLeetCodeProfile('testuser');
    expect(result).toEqual(mockSubmissions);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      '/api/leetcode-ac?username=testuser&limit=50',
      expect.objectContaining({ headers: { Accept: 'application/json' } })
    );
  });

  it('should strip @ and whitespace from usernames', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ submissions: [] })
    });

    await fetchLeetCodeProfile('  @NeetCode  ');
    expect(fetch).toHaveBeenCalledWith(
      '/api/leetcode-ac?username=NeetCode&limit=50',
      expect.any(Object)
    );
  });

  it('should fallback to Alfa LeetCode API when the proxy fails', async () => {
    const mockSubmissions = [
      { title: 'Three Sum', titleSlug: 'three-sum', timestamp: '456', statusDisplay: 'Accepted', lang: 'java' }
    ];

    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: () => Promise.resolve({ error: 'proxy down' })
    });

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        submission: mockSubmissions
      })
    });

    const result = await fetchLeetCodeProfile('testuser');
    expect(result).toEqual(mockSubmissions);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalled();
  });

  it('should throw LeetCodeApiError when both APIs fail', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: () => Promise.resolve({ error: 'proxy down' })
    });

    (fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable',
      text: () => Promise.resolve('Fallback error message')
    });

    const promise = fetchLeetCodeProfile('testuser');
    await expect(promise).rejects.toBeInstanceOf(LeetCodeApiError);
    await expect(promise).rejects.toThrow('Fallback API failed: Fallback error message');
  });

  it('should throw when username is empty', async () => {
    await expect(fetchLeetCodeProfile('   ')).rejects.toThrow('Enter a LeetCode username');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle network errors by falling back', async () => {
    const mockSubmissions = [{ title: 'Add Two Numbers', titleSlug: 'add-two-numbers', timestamp: '789', statusDisplay: 'Accepted', lang: 'cpp' }];

    (fetch as any).mockRejectedValueOnce(new Error('Network failure'));

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        submission: mockSubmissions
      })
    });

    const result = await fetchLeetCodeProfile('testuser');
    expect(result).toEqual(mockSubmissions);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
