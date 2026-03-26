import { isBefore, startOfDay, addDays, isSameDay } from 'date-fns';

export const getPhase = (date: Date = new Date()) => {
  const phase1End = new Date('2026-05-01T00:00:00Z');
  const phase2End = new Date('2026-08-01T00:00:00Z');

  if (isBefore(date, phase1End)) return 1;
  if (isBefore(date, phase2End)) return 2;
  return 3;
};

export const getNextReviewDate = (
  rating: 1 | 2 | 3,
  consecutiveSuccesses: number,
  isAggressive: boolean = false,
  difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'
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
  const aggMultiplier = isAggressive ? 0.7 : 1.0;
  // Rating 3 = solved cold with no hints → reward with 25% longer interval.
  // Rating 2 = solved but needed hints → baseline interval.
  const qualityMultiplier = rating === 3 ? 1.25 : 1.0;

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
  const finalDays = Math.max(1, Math.min(Math.round(days), maxGap));

  return addDays(today, finalDays);
};

export const isDueToday = (nextReviewAt: string) => {
  const today = startOfDay(new Date());
  const reviewDate = startOfDay(new Date(nextReviewAt));
  return isBefore(reviewDate, today) || isSameDay(reviewDate, today);
};
