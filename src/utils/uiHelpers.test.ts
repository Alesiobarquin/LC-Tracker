import { describe, it, expect } from 'vitest';
import { getDifficultyColor } from './uiHelpers';

describe('getDifficultyColor', () => {
  it('returns text-emerald-400 for Easy', () => {
    expect(getDifficultyColor('Easy')).toBe('text-emerald-400');
  });

  it('returns text-amber-400 for Medium', () => {
    expect(getDifficultyColor('Medium')).toBe('text-amber-400');
  });

  it('returns text-red-400 for Hard', () => {
    expect(getDifficultyColor('Hard')).toBe('text-red-400');
  });

  it('returns text-zinc-400 for unknown difficulties', () => {
    // @ts-ignore - testing runtime fallback for invalid type
    expect(getDifficultyColor('Unknown')).toBe('text-zinc-400');
  });
});
