import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_USER_SETTINGS } from '../types';

const mocks = vi.hoisted(() => ({
  rows: new Map<string, unknown>(), readError: null as unknown,
  rpc: vi.fn(), order: vi.fn(), or: vi.fn(),
}));
vi.mock('../lib/supabase', () => ({ supabase: {
  rpc: mocks.rpc,
  from: (table: string) => {
    let offset = 0; let limit = 500;
    const query: any = {
      select: () => query, eq: () => query, gte: () => query, lt: () => query, limit: () => query,
      order: (...args: unknown[]) => { mocks.order(...args); return query; },
      or: (...args: unknown[]) => { mocks.or(...args); return query; },
      range: (from: number, to: number) => { offset = from; limit = to - from + 1; return query; }, maybeSingle: () => query,
      then: (resolve: (result: unknown) => unknown) => Promise.resolve(resolve({
        data: Array.isArray(mocks.rows.get(table)) ? (mocks.rows.get(table) as unknown[]).slice(offset, offset + limit) : mocks.rows.get(table) ?? (['user_settings', 'sprint_state'].includes(table) ? null : []),
        error: mocks.readError,
      })),
    };
    return query;
  },
} }));

import { fetchProblemProgress, fetchSessionTimingsBefore, saveProblemSession,
  saveUserSettings, importSubmissions, restoreUserBackup, exportBackup, saveRecallSession } from './userData';

const operationId = '00000000-0000-4000-8000-000000000001';
const timing = { id: operationId, problemId: 'two-sum', category: 'Arrays & Hashing',
  date: '2026-10-06T12:00:00Z', elapsedSeconds: 120, sessionType: 'new' as const, rating: 3 as const };
const settingsRow = { version: 1, onboarding_complete: true, target_interview_date: '2027-01-01', settings_json: {
  ...DEFAULT_USER_SETTINGS, settings: DEFAULT_USER_SETTINGS.settings,
} };

describe('transactional user-data service', () => {
  beforeEach(() => {
    mocks.rows.clear(); mocks.readError = null;
    mocks.rows.set('user_settings', settingsRow);
    mocks.rpc.mockReset().mockResolvedValue({ data: { duplicate: false, imported: 1 }, error: null });
    mocks.order.mockClear(); mocks.or.mockClear();
  });

  it('writes progress, timing and activity in one RPC with the same session ID', async () => {
    await saveProblemSession('user_test', { operationId, problemId: 'two-sum', rating: 3, timing });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    const [name, request] = mocks.rpc.mock.calls[0];
    expect(name).toBe('commit_user_change');
    expect(request.p_operation_id).toBe(operationId);
    expect(request.p_expected).toEqual({ settings: 1, sprint: 0, progress: { 'two-sum': 0 } });
    expect(request.p_payload.progress[0].history).toHaveLength(1);
    expect(request.p_payload.timings[0].id).toBe(operationId);
    expect(request.p_payload.isNew).toBe(true);
    expect(request.p_payload.clientUserId).toBe('user_test');
  });

  it('never writes when a required source read fails', async () => {
    mocks.readError = new Error('Read unavailable');
    await expect(saveProblemSession('user_test', { operationId, problemId: 'two-sum', rating: 3 }))
      .rejects.toThrow('Read unavailable');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('retries confirmed version conflicts with the original operation ID', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: 'PT409' } });
    await saveProblemSession('user_test', { operationId, problemId: 'two-sum', rating: 3 });
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(mocks.rpc.mock.calls.map(([, args]) => args.p_operation_id)).toEqual([operationId, operationId]);
  });

  it('bounds conflict retries', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'PT409' } });
    await expect(saveProblemSession('user_test', { operationId, problemId: 'two-sum', rating: 3 })).rejects.toEqual({ code: 'PT409' });
    expect(mocks.rpc).toHaveBeenCalledTimes(3);
  });

  it('does not automatically retry ambiguous network failures', async () => {
    mocks.rpc.mockRejectedValue(new Error('Connection lost after commit'));
    await expect(saveProblemSession('user_test', { operationId, problemId: 'two-sum', rating: 3 })).rejects.toThrow('Connection lost');
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });

  it('reads progress without performing heuristic rating migration writes', async () => {
    await fetchProblemProgress('user_test');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('applies settings updaters to the confirmed server row', async () => {
    await saveUserSettings('user_test', (current) => ({ ...current, leetcodeUsername: 'newname' }));
    const request = mocks.rpc.mock.calls[0][1];
    expect(request.p_expected.settings).toBe(1);
    expect(request.p_payload.settings.onboarding_complete).toBe(true);
    expect(request.p_payload.settings.leetcode_username).toBe('newname');
  });

  it('imports through an insert-only operation', async () => {
    await importSubmissions('user_test', [{ titleSlug: 'two-sum', timestamp: '1700000000' }]);
    expect(mocks.rpc.mock.calls[0][1].p_kind).toBe('import');
  });

  it('validates a complete backup before making any write', async () => {
    await expect(restoreUserBackup('user_test', { progress: {}, sessionTimings: [{ ...timing, rating: 9 }] }))
      .rejects.toThrow('Invalid backup');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('restores session history and progress using one operation', async () => {
    await restoreUserBackup('user_test', { progress: {}, sessionTimings: [timing] });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    const request = mocks.rpc.mock.calls[0][1];
    expect(request.p_kind).toBe('restore');
    expect(request.p_payload.timings[0].recorded_at).toBe(timing.date);
  });

  it('exports history outside the normal ninety-day window', async () => {
    mocks.rpc.mockResolvedValue({ error: null, data: { settings: settingsRow, progress: [], activity: [], sprint: null,
      timings: [{ id: operationId, problem_id: 'two-sum', category: timing.category, recorded_at: '2020-01-01T00:00:00Z',
        elapsed_seconds: 120, session_type: 'new', rating: 3 }] } });
    const backup = await exportBackup();
    expect(backup.sessionTimings?.[0].date).toBe('2020-01-01T00:00:00Z');
    expect(backup.formatVersion).toBe(2);
  });

  it('uses a secondary ID cursor for equal timing timestamps', async () => {
    await fetchSessionTimingsBefore('user_test', { date: timing.date, id: operationId });
    expect(mocks.or).toHaveBeenCalledWith(expect.stringContaining(`id.lt.${operationId}`));
    expect(mocks.order).toHaveBeenCalledWith('id', { ascending: false });
  });
  it('saves recall atomically without appending a coding rating', async () => {
    const history = [{ date: '2020-01-01T00:00:00Z', rating: 4 }];
    mocks.rows.set('problem_progress', [{ problem_id: 'two-sum', version: 2, first_solved_at: timing.date,
      last_reviewed_at: timing.date, next_review_at: timing.date, review_count: 0, history,
      retired: false, consecutive_threes: 1, consecutive_successes: 1, notes: null }]);
    await saveRecallSession('user_test', { problemId: 'two-sum', attempt: { id: operationId, date: timing.date,
      elapsedSeconds: 180, outcome: 'partial', answer: 'An attempt from memory', checkedAgainst: 'external' } });
    const request = mocks.rpc.mock.calls[0][1];
    expect(request.p_kind).toBe('recall');
    expect(request.p_operation_id).toBe(operationId);
    expect(request.p_expected.progress).toEqual({ 'two-sum': 2 });
    expect(request.p_payload.progress[0].history).toEqual(history);
    expect(request.p_payload.progress[0].study_state.recallHistory).toHaveLength(1);
    expect(request.p_payload.timings[0].session_type).toBe('recall');
    expect(request.p_payload.isNew).toBe(false);
  });
  it('does not recreate a removed problem or write after a failed recall source read', async () => {
    const input = { problemId: 'two-sum', attempt: { id: operationId, date: timing.date, elapsedSeconds: 180,
      outcome: 'forgot' as const, answer: '', checkedAgainst: 'external' as const } };
    await expect(saveRecallSession('user_test', input)).rejects.toThrow('removed');
    mocks.readError = new Error('Read unavailable');
    await expect(saveRecallSession('user_test', input)).rejects.toThrow('Read unavailable');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('changes intensity without rewriting historical due dates or ratings', async () => {
    await saveUserSettings('user_test', current => ({ ...current, settings: { ...current.settings, srAggressiveness: 'AGGRESSIVE' } }));
    expect(mocks.rpc.mock.calls[0][1].p_payload).not.toHaveProperty('reviewDates');
    expect(mocks.rpc.mock.calls[0][1].p_expected).not.toHaveProperty('progress');
  });

});
