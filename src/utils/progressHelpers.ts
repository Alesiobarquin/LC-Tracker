import {
  addDays,
  differenceInDays,
  format,
  getDay,
  isSameDay,
  startOfDay,
  subDays,
} from 'date-fns';
import { getNextReviewDate, getPhase, isDueToday } from './dateUtils';
import {
  PHASE_1_CATEGORIES,
  PHASE_2_CATEGORIES,
  allProblems,
  isProblemPremium,
  problemMatchesTargetCurriculum,
  problems,
  problemMap,
  problemsPoolForTargetCurriculum,
  type Problem,
} from '../data/problems';
import type {
  ActivityLog,
  ActivityLogEntry,
  AppSettings,
  CatchUpPlanState,
  DayModeState,
  GraceDayState,
  ProblemProgress,
  ProblemSessionRating,
  SessionTiming,
  SprintHistoryEntry,
  SprintState,
  StreakState,
  SyntaxProgress,
  TargetCurriculum,
  PatternId,
  PatternProgress,
} from '../types';
import { patterns } from '../data/patterns';
import { getPatternForProblem } from './patternMapping';
import { DEFAULT_GRACE_DAY, DEFAULT_STREAK } from '../types';

/**
 * Baseline time estimates used for scheduling.
 * These are the fallback defaults when a user has no personal timing data yet.
 * New problem times are roughly interview-pace; review times are ~50-55% of that
 * since the solution pattern is already familiar.
 */
export function getEstimatedMinutesByDifficulty(
  difficulty: 'Easy' | 'Medium' | 'Hard',
  isNew: boolean
): number {
  if (isNew) {
    return difficulty === 'Easy' ? 12 : difficulty === 'Hard' ? 38 : 22;
  }
  return difficulty === 'Easy' ? 7 : difficulty === 'Hard' ? 18 : 12;
}

export const SPRINT_DESCRIPTIONS: Record<string, string> = {
  'Arrays & Hashing': 'Mastering hash maps, frequency counts, and conflict detection.',
  'Two Pointers': 'Scanning arrays from both ends to eliminate nested loops.',
  'Sliding Window': 'Dynamic subarray/substring problems with adaptive window bounds.',
  'Stack': 'Using LIFO order to track state, validate sequences, and match brackets.',
  'Binary Search': 'Solving search and optimization problems in O(log n) time.',
  'Linked List': 'Pointer manipulation, cycle detection, and in-place reversal.',
  Trees: 'DFS/BFS traversal, recursion, and BST invariants.',
  'Heap / Priority Queue': 'Top-K, streaming median, and priority-based scheduling patterns.',
};

export function computeSprintLength(
  category: string,
  skillLevels: Record<string, 'not_familiar' | 'some_exposure' | 'comfortable'>,
  multiplier: number,
  targetDays?: number
): number {
  if (targetDays !== undefined && targetDays > 0) return targetDays;
  const skill = skillLevels[category] ?? 'not_familiar';
  const base = skill === 'comfortable' ? 2 : skill === 'some_exposure' ? 4 : 7;
  return Math.max(1, Math.round(base * multiplier));
}

export function getReservedProblemIds(): Set<string> {
  return new Set(
    problems
      .filter(
        (p) =>
          p.mockInterviewContent &&
          p.mockInterviewContent.statement &&
          p.mockInterviewContent.optimalSolution &&
          p.mockInterviewContent.explanation
      )
      .map((p) => p.id)
  );
}

export type SprintPoolOptions = {
  /** When true with a non-NEET_75 target, reorder tiers so sprint matches target list intent. */
  alignPoolToTargetCurriculum?: boolean;
  targetCurriculum?: TargetCurriculum;
  /** When false, premium problems are excluded from automatic sprint assignment. */
  includePremiumInAssignments?: boolean;
};

/**
 * Sprint drills NeetCode curriculum in tiered order (default: NeetCode 75 → 150-only → 250-only → extended).
 * With `alignPoolToTargetCurriculum`, tier order follows the user’s target list setting.
 */
export function getSprintPoolProblems(
  category: string,
  solvedIds: Set<string>,
  reservedIds: Set<string>,
  options?: SprintPoolOptions
): Problem[] {
  const includePremium = options?.includePremiumInAssignments === true;
  const base = allProblems.filter(
    (p) =>
      p.category === category &&
      !solvedIds.has(p.id) &&
      !reservedIds.has(p.id) &&
      (includePremium || !isProblemPremium(p))
  );
  const tier75 = base.filter((p) => p.isNeetCode75);
  const tier150 = base.filter((p) => p.isNeetCode150 && !p.isNeetCode75);
  const tier250 = base.filter((p) => p.isNeetCode250 && !p.isNeetCode150);
  const tierCatalog = base.filter((p) => !!p.isExtendedCatalog);

  const tiers = { tier75, tier150, tier250, tierCatalog } as const;
  type TierKey = keyof typeof tiers;

  const defaultOrder: TierKey[] = ['tier75', 'tier150', 'tier250', 'tierCatalog'];
  let order: TierKey[] = defaultOrder;

  if (options?.alignPoolToTargetCurriculum && options.targetCurriculum) {
    switch (options.targetCurriculum) {
      case 'NEET_150':
        order = ['tier150', 'tier250', 'tier75', 'tierCatalog'];
        break;
      case 'NEET_250':
        order = ['tier250', 'tier150', 'tier75', 'tierCatalog'];
        break;
      case 'EXTENDED':
        order = ['tierCatalog', 'tier250', 'tier150', 'tier75'];
        break;
      default:
        order = defaultOrder;
    }
  }

  for (const key of order) {
    if (tiers[key].length) return tiers[key];
  }
  return [];
}

/**
 * If the account never recorded 4 or 5, historic “3” may mean old “mastered” — remap to 4 (current “strong” band).
 */
export function migrateLegacyRatingHistoryIfNeeded(
  progress: Record<string, ProblemProgress>
): { map: Record<string, ProblemProgress>; changed: boolean } {
  let has45 = false;
  for (const p of Object.values(progress)) {
    for (const h of p.history) {
      if (h.rating >= 4) {
        has45 = true;
        break;
      }
    }
    if (has45) break;
  }
  if (has45) {
    return { map: progress, changed: false };
  }
  let has3 = false;
  for (const p of Object.values(progress)) {
    if (p.history.some((h) => h.rating === 3)) {
      has3 = true;
      break;
    }
  }
  if (!has3) {
    return { map: progress, changed: false };
  }
  const map: Record<string, ProblemProgress> = {};
  for (const [id, prog] of Object.entries(progress)) {
    map[id] = {
      ...prog,
      history: prog.history.map((h) =>
        h.rating === 3 ? { ...h, rating: 4 as ProblemSessionRating } : h
      ),
    };
  }
  return { map, changed: true };
}

export function categoryHasSprintWork(
  category: string,
  solvedIds: Set<string>,
  reservedIds: Set<string>,
  options?: SprintPoolOptions
): boolean {
  return getSprintPoolProblems(category, solvedIds, reservedIds, options).length > 0;
}

export function findInitialSprintIndex(solvedIds: Set<string>, phase1Cats: readonly string[]): number {
  const reservedIds = getReservedProblemIds();
  for (let i = 0; i < phase1Cats.length; i += 1) {
    const cat = phase1Cats[i];
    if (categoryHasSprintWork(cat, solvedIds, reservedIds)) return i;
  }
  return phase1Cats.length - 1;
}

function tierDifficultyWeights(tier: AppSettings['targetCompanyTier']): Record<'Easy' | 'Medium' | 'Hard', number> {
  switch (tier) {
    case 'FAANG':
      return { Easy: 20, Medium: 60, Hard: 20 };
    case 'FINTECH':
      return { Easy: 30, Medium: 60, Hard: 10 };
    case 'GENERAL':
      return { Easy: 50, Medium: 45, Hard: 5 };
    default:
      return { Easy: 33, Medium: 34, Hard: 33 };
  }
}

/**
 * Pick one unsolved problem from a candidate list using interview type + company tier heuristics.
 */
export function pickUnsolvedForRandomRecommendation(
  candidates: Problem[],
  solvedIds: Set<string>,
  settings: AppSettings,
  progress: Record<string, ProblemProgress>
): Problem | undefined {
  const includePremium = settings.includePremiumInAssignments === true;
  const unsolved = candidates.filter((p) => !solvedIds.has(p.id) && (includePremium || !isProblemPremium(p)));
  if (unsolved.length === 0) return undefined;
  if (unsolved.length === 1) return unsolved[0];

  if (settings.interviewType === 'INTERNSHIP') {
    const order = { Easy: 0, Medium: 1, Hard: 2 } as const;
    return [...unsolved].sort((a, b) => order[a.difficulty] - order[b.difficulty])[0];
  }

  const weights = tierDifficultyWeights(settings.targetCompanyTier);
  const curriculum = settings.targetCurriculum ?? 'NEET_75';
  const solvedCounts: Record<'Easy' | 'Medium' | 'Hard', number> = { Easy: 0, Medium: 0, Hard: 0 };
  Object.entries(progress).forEach(([id, prog]) => {
    if (prog.history.length === 0) return;
    const p = problemMap.get(id);
    if (!p || !problemMatchesTargetCurriculum(p, curriculum)) return;
    solvedCounts[p.difficulty] += 1;
  });

  let best = unsolved[0];
  let bestScore = -1;
  for (const p of unsolved) {
    const w = weights[p.difficulty];
    const c = solvedCounts[p.difficulty];
    const score = w / (1 + c);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

export function computeNewProblemProgress(
  existing: ProblemProgress | undefined,
  problemId: string,
  rating: ProblemSessionRating,
  isNew: boolean,
  notes: string | undefined,
  additionalHistoryData: Record<string, unknown> | undefined,
  srAggressiveness: AppSettings['srAggressiveness']
): ProblemProgress {
  const today = startOfDay(new Date());
  const todayStr = today.toISOString();
  const prob = problemMap.get(problemId);
  const isFirstRating = !existing || existing.history.length === 0;
  const consecutiveThrees = rating >= 4 ? (existing?.consecutiveThrees || 0) + 1 : 0;
  const prevSuccesses = existing?.consecutiveSuccesses || 0;
  const consecutiveSuccesses = rating >= 3 ? prevSuccesses + 1 : 0;
  const difficulty = prob?.difficulty || 'Medium';
  const retireThreshold = difficulty === 'Easy' ? 2 : difficulty === 'Hard' ? 6 : 4;
  const retired = consecutiveSuccesses >= retireThreshold && consecutiveThrees >= 2;
  const reviewCount = isFirstRating ? 0 : existing ? existing.reviewCount + 1 : 0;
  const nextReviewAt = getNextReviewDate(rating, consecutiveSuccesses, srAggressiveness, difficulty, false).toISOString();

  return {
    firstSolvedAt: existing ? existing.firstSolvedAt : todayStr,
    lastReviewedAt: todayStr,
    nextReviewAt,
    reviewCount,
    history: [...(existing?.history || []), { date: todayStr, rating, ...additionalHistoryData }],
    retired,
    consecutiveThrees,
    consecutiveSuccesses,
    notes: notes !== undefined ? notes : existing?.notes,
  };
}

export function computeUpdatedActivityEntry(
  currentLog: ActivityLogEntry | undefined,
  isNew: boolean
): ActivityLogEntry {
  const existing = currentLog || { solved: 0, reviewed: 0 };
  return {
    solved: existing.solved + (isNew ? 1 : 0),
    reviewed: existing.reviewed + (!isNew ? 1 : 0),
  };
}

export function computeNewSyntaxProgress(
  existing: SyntaxProgress | undefined,
  rating: 1 | 2 | 3,
  srAggressiveness: AppSettings['srAggressiveness']
): SyntaxProgress {
  const today = startOfDay(new Date());
  const todayStr = today.toISOString();
  const reviewCount = existing ? existing.reviewCount + 1 : 1;

  // Use the stored count directly so it can grow past 2 and reach the 45-day tier.
  const prevSuccesses = existing?.consecutiveSuccesses ?? 0;
  const consecutiveSuccesses = rating >= 2 ? prevSuccesses + 1 : 0;

  const nextReviewAt = getNextReviewDate(rating, consecutiveSuccesses, srAggressiveness, 'Medium', true).toISOString();

  return {
    lastPracticedAt: todayStr,
    nextReviewAt,
    confidenceRating: rating,
    reviewCount,
    consecutiveSuccesses,
  };
}

function getMondayOfWeek(date: Date): Date {
  const value = new Date(date);
  const day = value.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + delta);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function calculateStreakFromActivityLog(activityLog: ActivityLog): {
  streak: StreakState;
  graceDay: GraceDayState;
} {
  const activeDates = Object.keys(activityLog)
    .filter((dateKey) => {
      const log = activityLog[dateKey];
      return (log?.solved || 0) > 0 || (log?.reviewed || 0) > 0;
    })
    .sort();

  let streak: StreakState = { ...DEFAULT_STREAK };
  let graceDay: GraceDayState = { ...DEFAULT_GRACE_DAY };

  activeDates.forEach((dateKey) => {
    const today = startOfDay(new Date(`${dateKey}T00:00:00`));
    const todayStr = today.toISOString();
    const mondayOfThisWeek = getMondayOfWeek(today);

    if (!graceDay.lastResetDate || new Date(graceDay.lastResetDate) < mondayOfThisWeek) {
      graceDay = { usedThisWeek: false, lastResetDate: mondayOfThisWeek.toISOString() };
    }

    if (!streak.lastActiveDate) {
      streak = { current: 1, max: Math.max(1, streak.max), lastActiveDate: todayStr };
      return;
    }

    const lastActive = startOfDay(new Date(streak.lastActiveDate));
    const diffInDays = differenceInDays(today, lastActive);

    if (diffInDays === 0) {
      streak = { ...streak, lastActiveDate: todayStr };
    } else if (diffInDays === 1) {
      const current = streak.current + 1;
      streak = { current, max: Math.max(current, streak.max), lastActiveDate: todayStr };
    } else if (diffInDays === 2 && !graceDay.usedThisWeek) {
      const current = streak.current + 1;
      graceDay = { ...graceDay, usedThisWeek: true };
      streak = { current, max: Math.max(current, streak.max), lastActiveDate: todayStr };
    } else if (diffInDays > 1) {
      streak = { current: 1, max: streak.max, lastActiveDate: todayStr };
    }
  });

  return { streak, graceDay };
}

export function calculateSessionAggregates(sessionTimings: SessionTiming[]) {
  const categoryAvgSolveTimes: Record<string, { totalSeconds: number; count: number }> = {};
  const categoryAvgReviewTimes: Record<string, { totalSeconds: number; count: number }> = {};
  const personalBestTimes: Record<string, number> = {};
  let lastCategoryAvgUpdate: number | null = null;

  sessionTimings.forEach((timing) => {
    if (timing.sessionType === 'review') {
      const existing = categoryAvgReviewTimes[timing.category] ?? { totalSeconds: 0, count: 0 };
      categoryAvgReviewTimes[timing.category] = {
        totalSeconds: existing.totalSeconds + timing.elapsedSeconds,
        count: existing.count + 1,
      };
    } else {
      const existing = categoryAvgSolveTimes[timing.category] ?? { totalSeconds: 0, count: 0 };
      categoryAvgSolveTimes[timing.category] = {
        totalSeconds: existing.totalSeconds + timing.elapsedSeconds,
        count: existing.count + 1,
      };
    }

    const currentBest = personalBestTimes[timing.problemId];
    if (currentBest === undefined || timing.elapsedSeconds < currentBest) {
      personalBestTimes[timing.problemId] = timing.elapsedSeconds;
    }

    lastCategoryAvgUpdate = Math.max(lastCategoryAvgUpdate ?? 0, new Date(timing.date).getTime());
  });

  return { categoryAvgSolveTimes, categoryAvgReviewTimes, personalBestTimes, lastCategoryAvgUpdate };
}

export function deriveMomentumState(progress: Record<string, ProblemProgress>) {
  const events: Array<{
    problemId: string;
    rating: ProblemSessionRating;
    date: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    isNew: boolean;
  }> = [];

  Object.entries(progress).forEach(([problemId, prog]) => {
    const problem = problemMap.get(problemId);
    if (!problem) return;

    prog.history.forEach((entry, index) => {
      const isNew =
        index === 0 ||
        entry.sessionType === 'new' ||
        (entry.sessionType === undefined && index === 0);

      events.push({
        problemId,
        rating: entry.rating,
        date: entry.date,
        difficulty: problem.difficulty,
        category: problem.category,
        isNew,
      });
    });
  });

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const consecutiveLowConfByCategory: Record<string, number> = {};
  const categoryStruggling: Record<string, boolean> = {};
  let consecutiveLowConfTotal = 0;
  let proactiveNeetCodeProblemId: string | null = null;

  events.forEach((event) => {
    if (!event.isNew) return;

    if (event.rating === 1 && event.difficulty === 'Medium') {
      const prev = consecutiveLowConfByCategory[event.category] ?? 0;
      consecutiveLowConfByCategory[event.category] = prev + 1;
      if (consecutiveLowConfByCategory[event.category] >= 2) {
        categoryStruggling[event.category] = true;
      }
    } else if (
      event.rating >= 3 &&
      event.difficulty === 'Easy' &&
      categoryStruggling[event.category]
    ) {
      categoryStruggling[event.category] = false;
      consecutiveLowConfByCategory[event.category] = 0;
    }

    if (event.rating === 1) {
      consecutiveLowConfTotal += 1;
      if (consecutiveLowConfTotal >= 2 && !proactiveNeetCodeProblemId) {
        proactiveNeetCodeProblemId = event.problemId;
      }
    } else {
      consecutiveLowConfTotal = 0;
    }
  });

  return {
    consecutiveLowConfByCategory,
    categoryStruggling,
    consecutiveLowConfTotal,
    proactiveNeetCodeProblemId,
  };
}

export function createInitialSprintState(
  progress: Record<string, ProblemProgress>,
  settings: AppSettings
): SprintState {
  const solvedIds = new Set(Object.keys(progress));
  const idx = findInitialSprintIndex(solvedIds, PHASE_1_CATEGORIES);
  const category = PHASE_1_CATEGORIES[idx];
  const sprintLength = computeSprintLength(
    category,
    settings.skillLevels,
    settings.sprintSettings?.lengthMultiplier ?? 1.0,
    settings.sprintSettings?.targetDays ?? 7
  );

  return {
    currentCategory: category,
    sprintStartDate: startOfDay(new Date()).toISOString(),
    sprintLength,
    sprintStatus: 'active',
    sprintIndex: idx,
    extensionDays: 0,
    retroProblemId: null,
    retroAttempted: false,
  };
}

export function setSprintCategoryState(
  category: string,
  progress: Record<string, ProblemProgress>,
  settings: AppSettings
): SprintState {
  const idx1 = PHASE_1_CATEGORIES.indexOf(category as (typeof PHASE_1_CATEGORIES)[number]);
  const idx2 = PHASE_2_CATEGORIES.indexOf(category as (typeof PHASE_2_CATEGORIES)[number]);
  const idx = idx2 !== -1 ? idx2 : idx1 !== -1 ? idx1 : 0;
  const sprintLength = computeSprintLength(
    category,
    settings.skillLevels,
    settings.sprintSettings?.lengthMultiplier ?? 1.0,
    settings.sprintSettings?.targetDays ?? 7
  );

  void progress;

  return {
    currentCategory: category,
    sprintStartDate: startOfDay(new Date()).toISOString(),
    sprintLength,
    sprintStatus: 'active',
    sprintIndex: idx,
    extensionDays: 0,
    retroProblemId: null,
    retroAttempted: false,
  };
}

export function advanceSprintState(
  sprintState: SprintState,
  sprintHistory: SprintHistoryEntry[],
  progress: Record<string, ProblemProgress>,
  settings: AppSettings,
  categoryAvgSolveTimes: Record<string, { totalSeconds: number; count: number }>
): { sprintState: SprintState; sprintHistory: SprintHistoryEntry[] } {
  const { sprintIndex, currentCategory, sprintStartDate, sprintLength, extensionDays } = sprintState;
  const historyEntry: SprintHistoryEntry = {
    category: currentCategory,
    startDate: sprintStartDate,
    endDate: new Date().toISOString(),
    passed: true,
    avgSolveSeconds: (() => {
      const data = categoryAvgSolveTimes[currentCategory];
      return data && data.count > 0 ? Math.round(data.totalSeconds / data.count) : 0;
    })(),
    sprintLength: sprintLength + extensionDays,
  };

  const solvedIds = new Set(Object.keys(progress));
  const reservedIds = getReservedProblemIds();
  let nextIdx = sprintIndex + 1;

  while (nextIdx < PHASE_1_CATEGORIES.length) {
    const cat = PHASE_1_CATEGORIES[nextIdx];
    if (categoryHasSprintWork(cat, solvedIds, reservedIds)) break;
    nextIdx += 1;
  }

  if (nextIdx >= PHASE_1_CATEGORIES.length) {
    return {
      sprintState: { ...sprintState, sprintStatus: 'complete' },
      sprintHistory: [...sprintHistory, historyEntry],
    };
  }

  const nextCategory = PHASE_1_CATEGORIES[nextIdx];
  const nextLength = computeSprintLength(
    nextCategory,
    settings.skillLevels,
    settings.sprintSettings?.lengthMultiplier ?? 1.0,
    settings.sprintSettings?.targetDays ?? 7
  );

  return {
    sprintState: {
      currentCategory: nextCategory,
      sprintStartDate: startOfDay(new Date()).toISOString(),
      sprintLength: nextLength,
      sprintStatus: 'active',
      sprintIndex: nextIdx,
      extensionDays: 0,
      retroProblemId: null,
      retroAttempted: false,
    },
    sprintHistory: [...sprintHistory, historyEntry],
  };
}

export function applyLeetCodeSubmissions(
  progress: Record<string, ProblemProgress>,
  submissions: Array<{ titleSlug: string; timestamp: string }>
) {
  const nextProgress = { ...progress };
  let pulledCount = 0;

  submissions.forEach((sub) => {
    const problemId = sub.titleSlug;
    const prob = problemMap.get(problemId);

    if (prob && !nextProgress[problemId]) {
      const solveDate = new Date(parseInt(sub.timestamp, 10) * 1000);
      const solveDateStr = solveDate.toISOString();
      const difficulty = prob.difficulty ?? 'Medium';
      // Compute the first-success interval from the actual solve date so old
      // imports surface as overdue today rather than being pushed into the future.
      const diffMultiplier = difficulty === 'Easy' ? 2.5 : difficulty === 'Medium' ? 1.0 : 0.7;
      const intervalDays = Math.round(4 * diffMultiplier); // consecutiveSuccesses=1, assumed strong first pass (rating 4)
      const nextReview = startOfDay(new Date(solveDate));
      nextReview.setDate(nextReview.getDate() + intervalDays);

      nextProgress[problemId] = {
        firstSolvedAt: solveDateStr,
        lastReviewedAt: solveDateStr,
        nextReviewAt: nextReview.toISOString(),
        reviewCount: 0,
        history: [{ date: solveDateStr, rating: 4 }],
        retired: false,
        consecutiveThrees: 1,
        consecutiveSuccesses: 1,
      };
      pulledCount += 1;
    }
  });

  return { progress: nextProgress, pulledCount };
}

const MIN_TIMING_DATA_POINTS = 3;

/**
 * Compute how many reviews fit in the remaining time budget after reserving
 * time for the new problem, additional problems, cold solve and syntax cards.
 * Exported so the Dashboard can re-run it reactively when the user skips.
 */
export function computeReviewProblems(params: {
  allDueReviewIds: string[];
  newProblemId: string | null;
  additionalProblemIds: string[];
  coldSolveProblemId: string | null;
  dueSyntaxCardCount: number;
  settings: AppSettings;
  categoryAvgSolveTimes?: Record<string, { totalSeconds: number; count: number }>;
  categoryAvgReviewTimes?: Record<string, { totalSeconds: number; count: number }>;
}): string[] {
  const {
    allDueReviewIds, newProblemId, additionalProblemIds, coldSolveProblemId,
    dueSyntaxCardCount, settings, categoryAvgSolveTimes, categoryAvgReviewTimes,
  } = params;

  const getSolveMins = (id: string): number => {
    const prob = problemMap.get(id);
    if (!prob) return 22;
    const data = categoryAvgSolveTimes?.[prob.category];
    if (data && data.count >= MIN_TIMING_DATA_POINTS) {
      return Math.max(1, Math.round(data.totalSeconds / data.count / 60));
    }
    return getEstimatedMinutesByDifficulty(prob.difficulty, true);
  };

  const getReviewMins = (id: string): number => {
    const prob = problemMap.get(id);
    if (!prob) return 12;
    const data = categoryAvgReviewTimes?.[prob.category];
    if (data && data.count >= MIN_TIMING_DATA_POINTS) {
      return Math.max(1, Math.round(data.totalSeconds / data.count / 60));
    }
    return getEstimatedMinutesByDifficulty(prob.difficulty, false);
  };

  const dayOfWeek = getDay(new Date());
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const availableMinutes = isWeekend
    ? settings.studySchedule.weekendMinutes
    : settings.studySchedule.weekdayMinutes;
  const includePremium = settings.includePremiumInAssignments === true;

  const reservedNew = newProblemId ? getSolveMins(newProblemId) : 0;
  const reservedAdditional = additionalProblemIds.reduce((sum, id) => sum + getSolveMins(id), 0);
  const reservedColdSolve = coldSolveProblemId ? getSolveMins(coldSolveProblemId) : 0;
  const reservedSyntax = dueSyntaxCardCount * 3;

  let budget = Math.max(
    0,
    availableMinutes - reservedNew - reservedAdditional - reservedColdSolve - reservedSyntax
  );
  const result: string[] = [];
  for (const id of allDueReviewIds) {
    const prob = problemMap.get(id);
    if (!prob) continue;
    if (!includePremium && isProblemPremium(prob)) continue;
    const est = getReviewMins(id);
    if (budget <= 0 && result.length >= 1) break;
    result.push(id);
    budget -= est;
  }
  return result;
}

export function buildDailyPlan(params: {
  progress: Record<string, ProblemProgress>;
  syntaxProgress: Record<string, SyntaxProgress>;
  settings: AppSettings;
  catchUpPlan: CatchUpPlanState;
  dayMode: DayModeState;
  activityLog: ActivityLog;
  sprintState: SprintState | null;
  categoryStruggling: Record<string, boolean>;
  categoryAvgSolveTimes?: Record<string, { totalSeconds: number; count: number }>;
  categoryAvgReviewTimes?: Record<string, { totalSeconds: number; count: number }>;
}) {
  const {
    progress, syntaxProgress, settings, catchUpPlan, dayMode, activityLog,
    sprintState, categoryStruggling,
    categoryAvgSolveTimes, categoryAvgReviewTimes,
  } = params;
  const phase = getPhase();
  const includePremium = settings.includePremiumInAssignments === true;
  const targetPool = problemsPoolForTargetCurriculum(settings.targetCurriculum ?? 'NEET_75').filter(
    (p) => includePremium || !isProblemPremium(p)
  );
  const sprintPoolOpts: SprintPoolOptions = {
    alignPoolToTargetCurriculum: settings.sprintSettings.alignPoolToTargetCurriculum,
    targetCurriculum: settings.targetCurriculum ?? 'NEET_75',
    includePremiumInAssignments: includePremium,
  };
  const today = new Date();
  const dayOfWeek = getDay(today);

  const allDueReviews = Object.entries(progress)
    .filter(([id, prog]) => {
      if (prog.retired || !isDueToday(prog.nextReviewAt)) return false;
      const problem = problemMap.get(id);
      if (!problem) return false;
      return includePremium || !isProblemPremium(problem);
    })
    .map(([id, prog]) => ({ id, prog }))
    .sort((a, b) => {
      // Primary: fewest consecutive successes first (weakest items reviewed first).
      const successA = a.prog.consecutiveSuccesses || 0;
      const successB = b.prog.consecutiveSuccesses || 0;
      if (successA !== successB) return successA - successB;

      // Secondary: most overdue first — items that have been waiting longest
      // relative to their scheduled date get priority within the same tier.
      return new Date(a.prog.nextReviewAt).getTime() - new Date(b.prog.nextReviewAt).getTime();
    });

  const totalDueReviews = allDueReviews.length;
  // reviewProblems is computed after newProblem is known (see end of function).

  const allDueSyntax = Object.entries(syntaxProgress || {})
    .filter(([, prog]) => isDueToday(prog.nextReviewAt))
    .sort((a, b) => a[1].confidenceRating - b[1].confidenceRating)
    .map(([id]) => id);

  const dueSyntaxCards = allDueSyntax.slice(0, 5);
  const isEasyDay = dayMode.type === 'EASY' && dayMode.dateSet && isSameDay(today, new Date(dayMode.dateSet));
  const isHardDay = dayMode.type === 'HARD' && dayMode.dateSet && isSameDay(today, new Date(dayMode.dateSet));

  let coldSolveProblem: string | null = null;
  if (!isEasyDay) {
    const potentialColdSolves = Object.entries(progress)
      .filter(([id, prog]) => {
        if (prog.history.length === 0) return false;
        const problem = problemMap.get(id);
        if (!problem) return false;
        if (!includePremium && isProblemPremium(problem)) return false;
        const daysSinceLastReview = differenceInDays(today, new Date(prog.lastReviewedAt));
        return daysSinceLastReview > 30;
      })
      .sort((a, b) => new Date(a[1].lastReviewedAt).getTime() - new Date(b[1].lastReviewedAt).getTime())
      .map(([id]) => id);

    if (potentialColdSolves.length > 0) {
      coldSolveProblem = potentialColdSolves[0];
    }
  }

  let newProblem: string | null = null;
  let additionalProblems: string[] = [];
  let recommendationReason: string | undefined;
  let isStabilizer = false;
  let isRetro = false;
  let sprintCategory: string | undefined;
  let sprintDayInfo: { day: number; total: number } | undefined;

  const solvedIds = new Set(Object.keys(progress));
  const reservedIds = getReservedProblemIds();
  let shouldAssignNewProblem = true;
  let targetNewProblemCount = 1;

  if (catchUpPlan?.active && catchUpPlan?.type === 'CATCH_UP') {
    targetNewProblemCount = 2;
    if (catchUpPlan.startedAt) {
      const daysSinceStart = differenceInDays(today, new Date(catchUpPlan.startedAt));
      if (daysSinceStart >= (catchUpPlan.durationDays || 0)) {
        targetNewProblemCount = 1;
      }
    }
  }

  if (settings.studySchedule.restDay === dayOfWeek) {
    shouldAssignNewProblem = false;
  }

  if (phase === 2 && shouldAssignNewProblem) {
    let solvedThisWeek = 0;
    for (let i = 0; i <= dayOfWeek; i += 1) {
      const dateKey = format(subDays(today, i), 'yyyy-MM-dd');
      if (activityLog[dateKey]?.solved > 0) {
        solvedThisWeek += 1;
      }
    }
    if (solvedThisWeek >= 3) shouldAssignNewProblem = false;
  }

  const useSprintLogic = phase === 1 && settings.learningMode === 'CURRICULUM';
  const usePatternLogic = settings.learningMode === 'PATTERNS';
  const effectiveSprint =
    useSprintLogic && !sprintState ? createInitialSprintState(progress, settings) : sprintState;

  if (shouldAssignNewProblem && useSprintLogic && effectiveSprint && effectiveSprint.sprintStatus !== 'complete') {
    sprintCategory = effectiveSprint.currentCategory;

    const sprintStart = startOfDay(new Date(effectiveSprint.sprintStartDate));
    const todayStart = startOfDay(today);
    const daysSinceStart = differenceInDays(todayStart, sprintStart);
    const totalDays = effectiveSprint.sprintLength + effectiveSprint.extensionDays;
    const currentDay = Math.min(daysSinceStart + 1, totalDays);
    sprintDayInfo = { day: currentDay, total: totalDays };

    const findRetroCandidate = () => {
      const cat = effectiveSprint.currentCategory;
      const pool = getSprintPoolProblems(cat, solvedIds, reservedIds, sprintPoolOpts);
      return (
        pool.find((p) => p.difficulty === 'Medium') ??
        pool[0] ??
        allProblems.find(
          (p) =>
            p.category === cat &&
            !solvedIds.has(p.id) &&
            !reservedIds.has(p.id) &&
            (includePremium || !isProblemPremium(p))
        ) ??
        allProblems.find(
          (p) => p.category === cat && !reservedIds.has(p.id) && (includePremium || !isProblemPremium(p))
        )
      );
    };

    if (effectiveSprint.sprintStatus === 'retrospective' || daysSinceStart >= totalDays) {
      isRetro = true;
      newProblem = effectiveSprint.retroProblemId ?? findRetroCandidate()?.id ?? null;
      recommendationReason = `Sprint Check — complete this problem to pass your ${effectiveSprint.currentCategory} sprint.`;
    } else {
      const sprintCat = effectiveSprint.currentCategory;
      const isStruggling = categoryStruggling[sprintCat] ?? false;
      const categoryProblems = getSprintPoolProblems(sprintCat, solvedIds, reservedIds, sprintPoolOpts);

      let candidate = null;

      if (isEasyDay) {
        candidate = categoryProblems.find((p) => p.difficulty === 'Easy') ?? categoryProblems[0];
      } else if (isHardDay) {
        candidate = categoryProblems.find((p) => p.difficulty === 'Hard') ?? categoryProblems[0];
      } else if (isStruggling) {
        const easyCandidates = categoryProblems.filter((p) => p.difficulty === 'Easy');
        candidate = easyCandidates[0] ?? categoryProblems[0];
        if (candidate && candidate.difficulty === 'Easy') {
          isStabilizer = true;
        }
      } else {
        candidate = categoryProblems[0];
      }

      if (candidate) {
        newProblem = candidate.id;
        recommendationReason = isStabilizer
          ? `Stabilizer: Easy problem selected as you've been struggling with ${sprintCat} mediums.`
          : `Sprint Day ${currentDay}/${totalDays}: Drilling ${sprintCat} patterns.`;
      } else {
        isRetro = true;
        recommendationReason = `${sprintCat} problems exhausted — Sprint Check coming.`;
      }

      if (newProblem && targetNewProblemCount > 1) {
        const secondCandidate = categoryProblems.find(
          (p) => !solvedIds.has(p.id) && p.id !== newProblem && !reservedIds.has(p.id)
        );
        if (secondCandidate) additionalProblems.push(secondCandidate.id);
      }
    }
  }

  if (shouldAssignNewProblem && usePatternLogic && !newProblem) {
    let targetPattern = null;
    for (const pattern of patterns) {
      const patternProblems = targetPool.filter((p) => getPatternForProblem(p) === pattern.id);
      const masteredCount = patternProblems.filter((p) => progress[p.id]?.retired === true).length;
      
      if (masteredCount < patternProblems.length && patternProblems.length > 0) {
        targetPattern = pattern;
        break;
      }
    }

    if (targetPattern) {
      let patternProblems = targetPool.filter((p) => getPatternForProblem(p) === targetPattern.id && !reservedIds.has(p.id));
      let picked = pickUnsolvedForRandomRecommendation(patternProblems, solvedIds, settings, progress);
      
      // If the target pool is exhausted but mastery isn't achieved, pull from the extended catalog
      // to ensure continuous practice until the core foundational problems are retired.
      if (!picked) {
        const extendedPool = allProblems.filter((p) => p.isExtendedCatalog || p.isNeetCode250);
        const overflowProblems = extendedPool.filter((p) => getPatternForProblem(p) === targetPattern.id && !reservedIds.has(p.id));
        picked = pickUnsolvedForRandomRecommendation(overflowProblems, solvedIds, settings, progress);
      }

      if (picked) {
        newProblem = picked.id;
        recommendationReason = `Mastering ${targetPattern.name}`;
      }
    }
  }

  if (shouldAssignNewProblem && !useSprintLogic && !usePatternLogic && !newProblem) {
    const candidateCategories: string[] = [...PHASE_1_CATEGORIES, ...PHASE_2_CATEGORIES];
    const categoryStats: Record<string, { total: number; count: number }> = {};

    Object.entries(progress).forEach(([id, prog]) => {
      const prob = problemMap.get(id);
      if (prob && prog.history.length > 0) {
        const lastRating = prog.history[prog.history.length - 1].rating;
        if (!categoryStats[prob.category]) categoryStats[prob.category] = { total: 0, count: 0 };
        categoryStats[prob.category].total += lastRating;
        categoryStats[prob.category].count += 1;
      }
    });

    const categoryAverages = Object.entries(categoryStats)
      .map(([category, stats]) => ({ category, avg: stats.total / stats.count }))
      .sort((a, b) => a.avg - b.avg);

    for (const { category, avg } of categoryAverages) {
      if (!candidateCategories.includes(category)) continue;
      if (avg >= 3) continue;

      const categoryProblems = targetPool.filter(
        (p) => p.category === category && !reservedIds.has(p.id)
      );
      const picked = pickUnsolvedForRandomRecommendation(categoryProblems, solvedIds, settings, progress);

      if (picked) {
        newProblem = picked.id;
        recommendationReason = `Recommending this because your ${category} confidence average is ${avg.toFixed(1)}.`;
        break;
      }
    }

    if (!newProblem) {
      const allCandidates = targetPool.filter((p) => !reservedIds.has(p.id));
      const picked = pickUnsolvedForRandomRecommendation(allCandidates, solvedIds, settings, progress);
      newProblem = picked?.id ?? null;
      if (newProblem) recommendationReason = 'Best next unsolved problem from your target list.';
    }
  }

  const allDueReviewIds = allDueReviews.map((item) => item.id);

  const reviewProblems = computeReviewProblems({
    allDueReviewIds,
    newProblemId: newProblem,
    additionalProblemIds: additionalProblems,
    coldSolveProblemId: coldSolveProblem,
    dueSyntaxCardCount: dueSyntaxCards.length,
    settings,
    categoryAvgSolveTimes,
    categoryAvgReviewTimes,
  });

  return {
    newProblem,
    additionalProblems,
    allDueReviewIds,
    reviewProblems,
    coldSolveProblem,
    dueSyntaxCards,
    recommendationReason,
    totalDueReviews,
    dayModeType: dayMode.type,
    isStabilizer,
    isRetro,
    sprintCategory,
    sprintDayInfo,
  };
}


export function computePatternMastery(
  patternId: PatternId,
  patternProblemIds: string[],
  problemProgress: Record<string, ProblemProgress>
): Pick<PatternProgress, 'problemsMasteredCount' | 'isMastered'> {
  const masteredCount = patternProblemIds.filter(id => {
    const prog = problemProgress[id];
    return prog?.retired === true;
  }).length;
  
  return {
    problemsMasteredCount: masteredCount,
    isMastered: masteredCount === patternProblemIds.length && patternProblemIds.length > 0
  };
}

