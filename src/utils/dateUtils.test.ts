import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getNextReviewDate, getSrIntervalMultiplier } from './dateUtils';

describe('getSrIntervalMultiplier', () => {
  it('maps presets', () => {
    expect(getSrIntervalMultiplier('RELAXED')).toBe(1);
    expect(getSrIntervalMultiplier('BALANCED')).toBe(0.85);
    expect(getSrIntervalMultiplier('AGGRESSIVE')).toBe(0.7);
  });
});

describe('getNextReviewDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('rating 1 schedules two days out', () => {
    const d = getNextReviewDate(1, 1, 'RELAXED', 'Medium', false);
    expect(d.toISOString().slice(0, 10)).toBe('2026-06-17');
  });

  it('relaxed spacing is farther out than aggressive for same rating', () => {
    const relaxed = getNextReviewDate(5, 3, 'RELAXED', 'Medium', false);
    const aggressive = getNextReviewDate(5, 3, 'AGGRESSIVE', 'Medium', false);
    expect(relaxed.getTime()).toBeGreaterThan(aggressive.getTime());
  });

  it('balanced sits between relaxed and aggressive', () => {
    const relaxed = getNextReviewDate(4, 2, 'RELAXED', 'Medium', false);
    const balanced = getNextReviewDate(4, 2, 'BALANCED', 'Medium', false);
    const aggressive = getNextReviewDate(4, 2, 'AGGRESSIVE', 'Medium', false);
    expect(relaxed.getTime()).toBeGreaterThan(balanced.getTime());
    expect(balanced.getTime()).toBeGreaterThan(aggressive.getTime());
  });

  it('syntaxCard path uses 1–3 only for quality bump', () => {
    const prob = getNextReviewDate(3, 2, 'RELAXED', 'Medium', false);
    const syn = getNextReviewDate(3, 2, 'RELAXED', 'Medium', true);
    expect(syn.getTime()).toBeGreaterThanOrEqual(prob.getTime());
  });
});
