import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLeetCodeProfile, LeetCodeApiError } from './leetcode';

describe('fetchLeetCodeProfile', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return submissions when the primary API succeeds', async () => {
    const mockSubmissions = [
      { title: 'Two Sum', titleSlug: 'two-sum', timestamp: '123', statusDisplay: 'Accepted', lang: 'python' }
    ];

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: {
          recentAcSubmissionList: mockSubmissions
        }
      })
    });

    const result = await fetchLeetCodeProfile('testuser');
    expect(result).toEqual(mockSubmissions);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should fallback to Alfa LeetCode API when the primary API fails', async () => {
    const mockSubmissions = [
      { title: 'Three Sum', titleSlug: 'three-sum', timestamp: '456', statusDisplay: 'Accepted', lang: 'java' }
    ];

    // Primary fails
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable'
    });

    // Fallback succeeds
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
    // Primary fails
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable'
    });

    // Fallback fails
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve('Fallback error message')
    });

    const promise = fetchLeetCodeProfile('testuser');
    await expect(promise).rejects.toThrow(LeetCodeApiError);
    await expect(promise).rejects.toThrow('Fallback API failed: Fallback error message');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should throw LeetCodeApiError when primary API returns GraphQL errors and fallback fails', async () => {
    // A single execution will exhaust the two mocked responses.
    // So we'll catch the error explicitly instead of calling the function twice.

    // Primary returns GraphQL error
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        errors: [{ message: 'User not found' }]
      })
    });

    // Fallback fails
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve('Internal Server Error')
    });

    const promise = fetchLeetCodeProfile('testuser');
    await expect(promise).rejects.toThrow(LeetCodeApiError);
    await expect(promise).rejects.toThrow('Fallback API failed: Internal Server Error');
  });

  it('should handle network errors by falling back', async () => {
    const mockSubmissions = [{ title: 'Add Two Numbers', titleSlug: 'add-two-numbers', timestamp: '789', statusDisplay: 'Accepted', lang: 'cpp' }];

    // Primary throws network error
    (fetch as any).mockRejectedValueOnce(new Error('Network failure'));

    // Fallback succeeds
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
