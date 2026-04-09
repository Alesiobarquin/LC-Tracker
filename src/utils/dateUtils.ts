import { isBefore, startOfDay, addDays, isSameDay } from 'date-fns';
import type { ProblemSessionRating, SrAggressiveness } from '../types';

/** Shorter gaps between reviews as aggressiveness increases (RELAXED → BALANCED → AGGRESSIVE). */
export function getSrIntervalMultiplier(sr: SrAggressiveness): number {
  switch (sr) {
    case 'RELAXED':
      return 1.0;
    case 'BALANCED':
      return 0.85;
    case 'AGGRESSIVE':
      return 0.7;
    default:
      return 1.0;
  }
}

export const getPhase = (date: Date = new Date()) => {
  const phase1End = new Date('2026-05-01T00:00:00Z');
  const phase2End = new Date('2026-08-01T00:00:00Z');

  if (isBefore(date, phase1End)) return 1;
  if (isBefore(date, phase2End)) return 2;
  return 3;
};

/**
 * Problem session ratings (1–5). Syntax cards still pass 1–3 only (see `syntaxCard`).
 * Future improvement: per-item stability (FSRS / SM-2 ease) using review history — would
 * replace fixed multipliers without changing the 1–5 self-rating UX.
 */
export const getNextReviewDate = (
  rating: ProblemSessionRating,
  consecutiveSuccesses: number,
  srAggressiveness: SrAggressiveness = 'RELAXED',
  difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium',
  /** Syntax cards use a 1–3 scale where 3 = “good”; problems use 1–5 where 4–5 are the strong tiers. */
  syntaxCard: boolean = false
) => {
  const today = startOfDay(new Date());

  if (rating === 1) {
    // 2 days for all difficulties — Hard needs more repetition not less,
    // consistent with the philosophy that Hard intervals stay shorter overall.
    return addDays(today, 2);
  }

  // Opinionated scaling: Coding is about patterns, not rote memory.
  // Easies should back off very fast. Hards should stay closer.
  const diffMultiplier = difficulty === 'Easy' ? 2.5 : difficulty === 'Medium' ? 1.0 : 0.7;
  const aggMultiplier = getSrIntervalMultiplier(srAggressiveness);
  let qualityMultiplier = 1.0;
  if (syntaxCard) {
    if (rating === 3) qualityMultiplier = 1.25;
  } else {
    if (rating === 4) qualityMultiplier = 1.25;
    else if (rating === 5) qualityMultiplier = 1.55;
  }

  let days = 3;
  if (consecutiveSuccesses === 1) {
    days = Math.round(4 * diffMultiplier * aggMultiplier * qualityMultiplier);
  } else if (consecutiveSuccesses === 2) {
    days = Math.round(14 * diffMultiplier * aggMultiplier * qualityMultiplier);
  } else if (consecutiveSuccesses >= 3) {
    days = Math.round(45 * diffMultiplier * aggMultiplier * qualityMultiplier);
  }

  // Cap intervals based on difficulty to ensure Hards don't drift too far
  const maxGap = difficulty === 'Easy' ? 180 : difficulty === 'Medium' ? 90 : 45;
  let finalDays = Math.max(1, Math.min(Math.round(days), maxGap));

  // Apply a small random fuzz (±15% spread) to spread out bulk manual completions
  // so items rated on the same day don't cluster on the exact same future date.
  if (finalDays >= 3) {
    const maxFuzz = Math.max(1, Math.round(finalDays * 0.15));
    const fuzz = Math.floor(Math.random() * (2 * maxFuzz + 1)) - maxFuzz;
    finalDays = Math.max(1, finalDays + fuzz);
  }

  return addDays(today, finalDays);
};

export const isDueToday = (nextReviewAt: string) => {
  const today = startOfDay(new Date());
  const reviewDate = startOfDay(new Date(nextReviewAt));
  return isBefore(reviewDate, today) || isSameDay(reviewDate, today);
};
