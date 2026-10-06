import { describe, it, expect } from 'vitest';
import { getDifficultyColor } from './uiHelpers';

describe('getDifficultyColor', () => {
  it('returns text-success for Easy', () => {
    expect(getDifficultyColor('Easy')).toBe('text-success');
  });

  it('returns text-warning for Medium', () => {
    expect(getDifficultyColor('Medium')).toBe('text-warning');
  });

  it('returns text-danger for Hard', () => {
    expect(getDifficultyColor('Hard')).toBe('text-danger');
  });

  it('returns text-muted for unknown difficulties', () => {
    // @ts-ignore - testing runtime fallback for invalid type
    expect(getDifficultyColor('Unknown')).toBe('text-muted');
  });
});
