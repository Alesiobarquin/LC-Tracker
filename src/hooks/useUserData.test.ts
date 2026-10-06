import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_USER_SETTINGS } from '../types';
import { userDataQueryKeys as keys } from '../lib/userDataQueryKeys';

const mocks = vi.hoisted(() => ({
  cache: new Map<string, unknown>(),
  write: vi.fn(),
  fetchProfile: vi.fn(),
}));

vi.mock('react', () => ({
  useState: (value: unknown) => [value, vi.fn()],
  useMemo: (fn: () => unknown) => fn(),
  useEffect: vi.fn(),
}));
vi.mock('@clerk/react', () => ({ useUser: () => ({ user: { id: 'user_test' } }) }));
vi.mock('../services/userData', () => ({
  fetchUserSettings: async () => DEFAULT_USER_SETTINGS,
  exportBackup: vi.fn(),
  saveProblemSession: (userId: string, input: unknown) => mocks.write('session', input),
  importSubmissions: (userId: string, submissions: unknown) => mocks.write('import', submissions),
}));
vi.mock('../services/leetcode', () => ({ fetchLeetCodeProfile: mocks.fetchProfile }));
vi.mock('../lib/queryClient', () => ({
  queryClient: {
    getQueryData: (key: unknown) => mocks.cache.get(JSON.stringify(key)),
    setQueryData: (key: unknown, value: unknown) => mocks.cache.set(JSON.stringify(key), value),
    cancelQueries: vi.fn().mockResolvedValue(undefined),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown }) => ({
    data: mocks.cache.get(JSON.stringify(queryKey)), isLoading: false, isSuccess: true,
  }),
  // Exercise the actual order: onMutate runs before mutationFn.
  useMutation: (options: any) => ({
    mutateAsync: async (variables: unknown) => {
      const context = await options.onMutate?.(variables);
      try {
        return await options.mutationFn(variables);
      } catch (error) {
        options.onError?.(error, variables, context);
        throw error;
      } finally {
        await options.onSettled?.();
      }
    },
  }),
}));

import { useProblemProgress, useUserSettings } from './useUserData';

describe('confirmed user-data writes', () => {
  beforeEach(() => {
    mocks.cache.clear();
    mocks.write.mockReset().mockResolvedValue({ error: null });
    mocks.fetchProfile.mockReset();
    mocks.cache.set(JSON.stringify(keys.settings('user_test')), DEFAULT_USER_SETTINGS);
  });

  it('forwards one problem rating to a single transactional save', async () => {
    await useProblemProgress().logProblem('two-sum', 3, true);
    expect(mocks.write).toHaveBeenCalledTimes(1);
    expect(mocks.write).toHaveBeenCalledWith('session', expect.objectContaining({ problemId: 'two-sum', rating: 3 }));
  });

  it('leaves confirmed progress intact when a save fails', async () => {
    const progress = {};
    mocks.cache.set(JSON.stringify(keys.progress('user_test')), progress);
    mocks.write.mockRejectedValue(new Error('Database unavailable'));
    await expect(useProblemProgress().logProblem('1', 3, true)).rejects.toThrow('Database unavailable');
    expect(mocks.cache.get(JSON.stringify(keys.progress('user_test')))).toBe(progress);
  });

  it('does not show imported progress as saved when the database rejects it', async () => {
    const progress = {};
    mocks.cache.set(JSON.stringify(keys.progress('user_test')), progress);
    mocks.fetchProfile.mockResolvedValue([
      { titleSlug: 'two-sum', timestamp: '1700000000', title: 'Two Sum', lang: 'python' },
    ]);
    mocks.write.mockRejectedValue(new Error('Database unavailable'));
    await expect(useUserSettings().syncLeetCode('test')).rejects.toThrow('Database unavailable');
    expect(mocks.cache.get(JSON.stringify(keys.progress('user_test')))).toBe(progress);
  });
});
