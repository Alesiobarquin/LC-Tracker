import { describe, expect, it } from 'vitest';
import { validateBackup } from './backup';
import { DEFAULT_USER_SETTINGS } from '../types';
describe('backup validation', () => {
  it('accepts older exports without format metadata', () => {
    expect(validateBackup({ userSettings: DEFAULT_USER_SETTINGS, progress: {} }).userSettings.onboardingComplete).toBe(false);
  });
  it('rejects invalid history before restoring any table', () => {
    expect(() => validateBackup({ userSettings: DEFAULT_USER_SETTINGS, progress: { 'two-sum': { history: [] } } })).toThrow('Invalid backup');
  });
  it('strips imported database ownership and version metadata', () => {
    const backup = validateBackup({ userSettings: { ...DEFAULT_USER_SETTINGS, user_id: 'other', version: 999 } });
    expect(backup.userSettings).not.toHaveProperty('user_id');
    expect(backup.userSettings).not.toHaveProperty('version');
  });
  it('rejects unrelated JSON', () => {
    expect(() => validateBackup({ hello: 'world' })).toThrow('No backup data found');
  });
  it('round-trips a study schedule with no weekly rest day', () => {
    const userSettings = { ...DEFAULT_USER_SETTINGS, settings: { ...DEFAULT_USER_SETTINGS.settings,
      studySchedule: { ...DEFAULT_USER_SETTINGS.settings.studySchedule, restDay: -1 } } };
    expect(validateBackup(JSON.parse(JSON.stringify({ userSettings }))).userSettings.settings.studySchedule.restDay).toBe(-1);
  });
});

it('round-trips original recall, corrections, built-in reference type, and personal code', () => {
  const date = '2026-10-06T12:00:00Z';
  const progress = { 'two-sum': { firstSolvedAt: date, lastReviewedAt: date, nextReviewAt: date,
    reviewCount: 0, history: [], retired: false, consecutiveThrees: 0,
    notes: 'Personal logic\n\n```cpp\nint value = 1;\n```', studyState: {
      version: 1, source: 'practice', recallIntervalDays: 3, codingIntervalDays: 7,
      nextRecallAt: date, nextCodingAt: date, lapses: 0, recallHistory: [{
        id: '00000000-0000-4000-8000-000000000001', date, elapsedSeconds: 180,
        outcome: 'partial', answer: 'Original from memory', revisedAnswer: 'Corrected after comparing', checkedAgainst: 'solution',
      }],
    } } };
  expect(validateBackup(JSON.parse(JSON.stringify({ formatVersion: 2, progress }))).progress).toEqual(progress);
});
