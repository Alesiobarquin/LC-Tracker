import { Difficulty } from '../data/problems';
import { cn } from './cn';

export { cn };

export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'Easy':
      return 'text-accent';
    case 'Medium':
      return 'text-warning';
    case 'Hard':
      return 'text-danger';
    default:
      return 'text-muted';
  }
}

/** Shared problem status vocabulary across Library, Patterns, and Dashboard. */
export type ProblemStatusTone = 'retired' | 'solved' | 'needsWork' | 'unsolved';

export function getProblemStatusTone(options: {
  isSolved: boolean;
  isRetired?: boolean;
  lastRating?: number;
}): ProblemStatusTone {
  if (options.isRetired) return 'retired';
  if (options.isSolved && options.lastRating === 1) return 'needsWork';
  if (options.isSolved) return 'solved';
  return 'unsolved';
}

export function getProblemStatusLabel(tone: ProblemStatusTone): string {
  switch (tone) {
    case 'retired':
      return 'Maintenance';
    case 'solved':
      return 'Solved';
    case 'needsWork':
      return 'Needs work';
    default:
      return 'Unsolved';
  }
}

export function getProblemStatusClass(tone: ProblemStatusTone): string {
  switch (tone) {
    case 'retired':
      return 'text-accent';
    case 'solved':
      return 'text-warning';
    case 'needsWork':
      return 'text-danger';
    default:
      return 'text-subtle';
  }
}

export function mergeFieldClass(...classes: Array<string | false | null | undefined>) {
  return cn(...classes);
}
