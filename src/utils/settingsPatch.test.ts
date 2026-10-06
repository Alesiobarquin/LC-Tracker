import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../types';
import { applySettingsPatch } from './settingsPatch';
describe('settings edits across devices', () => {
  it('preserves unrelated fields even when the UI supplied a whole nested object', () => {
    const latest = { ...DEFAULT_SETTINGS, studySchedule: { ...DEFAULT_SETTINGS.studySchedule, weekdayMinutes: 90 } };
    const patch = { studySchedule: { ...DEFAULT_SETTINGS.studySchedule, weekendMinutes: 80 } };
    const result = applySettingsPatch(DEFAULT_SETTINGS, latest, patch);
    expect(result.studySchedule.weekdayMinutes).toBe(90);
    expect(result.studySchedule.weekendMinutes).toBe(80);
  });
  it('rejects competing edits to the same field instead of overwriting them', () => {
    expect(() => applySettingsPatch(DEFAULT_SETTINGS, { ...DEFAULT_SETTINGS, language: 'Java' }, { language: 'JavaScript' }))
      .toThrow('changed on another device');
  });
});
