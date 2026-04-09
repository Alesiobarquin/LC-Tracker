import { Difficulty } from '../data/problems';

export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'Easy':
      return 'text-emerald-400';
    case 'Medium':
      return 'text-amber-400';
    case 'Hard':
      return 'text-red-400';
    default:
      return 'text-zinc-400';
  }
}
