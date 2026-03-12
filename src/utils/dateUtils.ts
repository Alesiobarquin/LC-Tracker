import { differenceInDays, isBefore, startOfDay, addDays, isSameDay } from 'date-fns';

export const getPhase = (date: Date = new Date()) => {
  const phase1End = new Date('2026-05-01T00:00:00Z');
  const phase2End = new Date('2026-08-01T00:00:00Z');

  if (isBefore(date, phase1End)) return 1;
  if (isBefore(date, phase2End)) return 2;
  return 3;
};

export const getNextReviewDate = (rating: 1 | 2 | 3, reviewCount: number) => {
  const today = startOfDay(new Date());
  
  if (rating === 1) {
    return addDays(today, 3);
  }
  
  if (rating === 2 || rating === 3) {
    if (reviewCount === 0) return addDays(today, 3);
    if (reviewCount === 1) return addDays(today, 7);
    return addDays(today, 21);
  }
  
  return addDays(today, 3);
};

export const isDueToday = (nextReviewAt: string) => {
  const today = startOfDay(new Date());
  const reviewDate = startOfDay(new Date(nextReviewAt));
  return isBefore(reviewDate, today) || isSameDay(reviewDate, today);
};
