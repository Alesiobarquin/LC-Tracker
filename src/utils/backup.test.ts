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
