import { describe, expect, it, vi } from 'vitest';
import { fetchAllPages } from './pagination';

describe('complete paginated reads', () => {
  it('continues beyond the first full page and retains every row', async () => {
    const read = vi.fn().mockResolvedValueOnce({ data: [1, 2], error: null })
      .mockResolvedValueOnce({ data: [3, 4], error: null }).mockResolvedValueOnce({ data: [5], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    await expect(fetchAllPages(read, 2)).resolves.toEqual([1, 2, 3, 4, 5]);
    expect(read.mock.calls).toEqual([[0, 1], [2, 3], [4, 5], [5, 6]]);
  });
  it('continues when the server row cap is smaller than the requested page', async () => {
    const read = vi.fn().mockResolvedValueOnce({ data: [1, 2], error: null })
      .mockResolvedValueOnce({ data: [3], error: null }).mockResolvedValueOnce({ data: [], error: null });
    await expect(fetchAllPages(read, 500)).resolves.toEqual([1, 2, 3]);
    expect(read.mock.calls.map(([offset]) => offset)).toEqual([0, 2, 3]);
  });
  it('rejects a later failed page instead of publishing partial data', async () => {
    const read = vi.fn().mockResolvedValueOnce({ data: [1, 2], error: null })
      .mockResolvedValueOnce({ data: null, error: new Error('Unavailable') });
    await expect(fetchAllPages(read, 2)).rejects.toThrow('Unavailable');
  });
});
