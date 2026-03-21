import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabaseStorage } from './supabaseStorage';
import { startOfDay, format, isSameDay, subDays, getDay, differenceInDays, addDays } from 'date-fns';
import { getNextReviewDate, isDueToday, getPhase } from '../utils/dateUtils';
import { problems, PHASE_1_CATEGORIES, PHASE_2_CATEGORIES } from '../data/problems';
import { fetchLeetCodeProfile } from '../services/leetcode';

export interface ProblemProgress {
  firstSolvedAt: string;
  lastReviewedAt: string;
  nextReviewAt: string;
  reviewCount: number;
  history: {
    date: string;
    rating: 1 | 2 | 3;
    elapsedSeconds?: number;
    sessionType?: 'new' | 'review' | 'cold_solve' | 'mock';
    rawCode?: string;
    optimalSolution?: string;
    approachSimilarity?: number;
    usedInAppEditor?: boolean;
    mockTimeLimitSeconds?: number;
    mockActualSecondsUsed?: number;
  }[];
  retired: boolean;
  consecutiveThrees: number;
  consecutiveSuccesses?: number;
  notes?: string;
}

export interface SyntaxProgress {
  lastPracticedAt: string;
  nextReviewAt: string;
  confidenceRating: number;
  reviewCount: number;
}

export interface ActivityLog {
  [dateString: string]: { solved: number; reviewed: number };
}

/** One timed session record stored for analytics */
export interface SessionTiming {
  id: string;
  problemId: string;
  category: string;
  date: string;
  elapsedSeconds: number;
  sessionType: 'new' | 'review' | 'cold_solve' | 'mock';
  rating: 1 | 2 | 3;
}

// ── Sprint Model Types ────────────────────────────────────────────────────────

export interface SprintState {
  currentCategory: string;
  sprintStartDate: string; // ISO date string
  sprintLength: number;    // total active days (not counting retro day)
  sprintStatus: 'active' | 'retrospective' | 'complete';
  sprintIndex: number;     // index into PHASE_1_CATEGORIES
  extensionDays: number;   // cumulative extra days from failed retros
  retroProblemId: string | null;
  retroAttempted: boolean;
}

export interface SprintHistoryEntry {
  category: string;
  startDate: string;
  endDate: string;
  passed: boolean;
  avgSolveSeconds: number;
  sprintLength: number;
}

// ─────────────────────────────────────────────────────────────────────────────

interface AppState {
  progress: Record<string, ProblemProgress>;
  activityLog: ActivityLog;
  syntaxProgress: Record<string, SyntaxProgress>;
  streak: {
    current: number;
    max: number;
    lastActiveDate: string | null;
  };
  leetcodeUsername: string | null;
  lastSync: string | null;
  lastSyncCount: number | null;
  syncError: string | null;
  targetInterviewDate: string;

  // ── Session Timing ──────────────────────────────────────────────
  activeSession: {
    problemId: string;
    startTimestamp: number;
    isReview: boolean;
    isColdSolve: boolean;
  } | null;

  sessionTimings: SessionTiming[];
  categoryAvgSolveTimes: Record<string, { totalSeconds: number; count: number }>;
  categoryAvgReviewTimes: Record<string, { totalSeconds: number; count: number }>;
  personalBestTimes: Record<string, number>;
  lastCategoryAvgUpdate: number | null;
  // ────────────────────────────────────────────────────────────────

  // ── Sprint State ─────────────────────────────────────────────────
  sprintState: SprintState | null;
  sprintHistory: SprintHistoryEntry[];

  /** per-category count of consecutive confidence-1 ratings on Medium problems */
  consecutiveLowConfByCategory: Record<string, number>;
  /** true if the category is in "struggling" mode → surface Easy problems */
  categoryStruggling: Record<string, boolean>;

  /** count of consecutive conf-1 ratings (any difficulty) — resets on ≥2 */
  consecutiveLowConfTotal: number;
  /** when ≥2 consecutive conf-1 across any, store the problem id whose videoUrl to surface */
  proactiveNeetCodeProblemId: string | null;

  /** free-pick tracking for Flexible Sprint Mode */
  sprintFreePick: { usedThisWeek: boolean; lastResetDate: string | null };
  // ────────────────────────────────────────────────────────────────

  settings: {
    studySchedule: {
      weekdayMinutes: number;
      weekendMinutes: number;
      restDay: number;
      blackoutDates: { start: string; end: string }[];
    };
    skillLevels: Record<string, 'not_familiar' | 'some_exposure' | 'comfortable'>;
    targetCompanyTier: 'FAANG' | 'FINTECH' | 'GENERAL' | 'MIXED';
    interviewType: 'INTERNSHIP' | 'FULL_TIME';
    srAggressiveness: 'RELAXED' | 'AGGRESSIVE';
    language: 'Python' | 'Java' | 'JavaScript';
    learningMode: 'SPRINT' | 'RANDOM';
    sprintSettings: {
      strictMode: boolean;
      lengthMultiplier: number; // 0.5 – 2.0
      targetDays: number; // 1 - 14
    };
  };
  targetEvents: { id: string; title: string; type: string; date: string }[];
  dayMode: { type: 'NORMAL' | 'EASY' | 'HARD'; dateSet: string | null };
  catchUpPlan: { active: boolean; type: 'EXTEND' | 'CATCH_UP' | null; startedAt: string | null; durationDays: number };
  graceDay: { usedThisWeek: boolean; lastResetDate: string | null };
  personalRecords: {
    longestStreak: number;
    currentStreak: number;
    fastestMockByCategory: Record<string, number>;
    mostProblemsInDay: number;
    highestReadinessScore: number;
    firstProblemSolvedDate: string | null;
    totalStudyTimeHours: number;
  };

  onboardingComplete: boolean;
  setOnboardingComplete: () => void;

  updateSettings: (newSettings: Partial<AppState['settings']>) => void;
  recalcSpacedRepetition: () => void;
  addTargetEvent: (event: Omit<AppState['targetEvents'][0], 'id'>) => void;
  removeTargetEvent: (id: string) => void;
  setDayMode: (mode: 'NORMAL' | 'EASY' | 'HARD') => void;
  setCatchUpPlan: (type: 'EXTEND' | 'CATCH_UP', durationDays: number) => void;
  dismissCatchUpBanner: () => void;
  useGraceDay: () => void;
  resetGraceDayIfNeeded: () => void;
  updatePersonalRecords: (updates: Partial<AppState['personalRecords']>) => void;

  // ── Session Timing Actions ───────────────────────────────────────
  startSession: (problemId: string, isReview: boolean, isColdSolve?: boolean) => void;
  endSession: (elapsedSeconds: number, rating: 1 | 2 | 3, notes?: string, additionalHistoryData?: any) => void;
  abandonSession: () => void;
  // ────────────────────────────────────────────────────────────────

  // ── Sprint Actions ───────────────────────────────────────────────
  initCurrentSprint: () => void;
  advanceSprint: () => void;
  extendSprint: (days: number) => void;
  recordSprintRetro: (passed: boolean, rating: 1 | 2 | 3) => void;
  setSprintCategory: (category: string) => void;
  dismissProactiveNeetCode: () => void;
  useSprintFreePick: () => void;
  resetSprintFreePickIfNeeded: () => void;
  // ────────────────────────────────────────────────────────────────

  logProblem: (problemId: string, rating: 1 | 2 | 3, isNew: boolean, notes?: string, additionalHistoryData?: any) => void;
  logMockInterview: (
    problemId: string,
    evalSolved: boolean,
    evalSyntax: boolean,
    evalComplexity: boolean,
    approachSimilarity: number,
    rawCode: string,
    optimalSolution: string,
    usedInAppEditor: boolean,
    actualSecondsUsed?: number,
    timeLimitSeconds?: number
  ) => void;
  logSyntaxPractice: (cardId: string, rating: 1 | 2 | 3) => void;
  resetProgress: () => void;
  removeProblem: (problemId: string) => void;
  getDailyPlan: () => {
    newProblem: string | null;
    additionalProblems: string[];
    reviewProblems: string[];
    coldSolveProblem: string | null;
    dueSyntaxCards: string[];
    recommendationReason?: string;
    totalDueReviews?: number;
    dayModeType: 'EASY' | 'HARD' | 'NORMAL';
    isStabilizer?: boolean;
    isRetro?: boolean;
    sprintCategory?: string;
    sprintDayInfo?: { day: number; total: number };
  };
  setLeetCodeUsername: (username: string) => void;
  syncLeetCode: () => Promise<void>;
  setTargetInterviewDate: (date: string) => void;
}

// ── Sprint Helpers (module-level, pure) ─────────────────────────────────────

/** Sprint descriptions per category — shown on the dashboard sprint card */
export const SPRINT_DESCRIPTIONS: Record<string, string> = {
  'Arrays & Hashing': 'Mastering hash maps, frequency counts, and conflict detection.',
  'Two Pointers': 'Scanning arrays from both ends to eliminate nested loops.',
  'Sliding Window': 'Dynamic subarray/substring problems with adaptive window bounds.',
  'Stack': 'Using LIFO order to track state, validate sequences, and match brackets.',
  'Binary Search': 'Solving search and optimization problems in O(log n) time.',
  'Linked List': 'Pointer manipulation, cycle detection, and in-place reversal.',
  'Trees': 'DFS/BFS traversal, recursion, and BST invariants.',
  'Heap / Priority Queue': 'Top-K, streaming median, and priority-based scheduling patterns.',
};

/** Compute sprint length in days given skill level and multiplier/target */
function computeSprintLength(
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

/** Returns the set of reserved problem IDs (those with full mock content) */
function getReservedProblemIds(): Set<string> {
  return new Set(
    problems
      .filter(p => p.mockInterviewContent &&
        p.mockInterviewContent.statement &&
        p.mockInterviewContent.optimalSolution &&
        p.mockInterviewContent.explanation)
      .map(p => p.id)
  );
}

/** Find the first sprint index that still has unsolved problems */
function findInitialSprintIndex(
  solvedIds: Set<string>,
  phase1Cats: readonly string[]
): number {
  for (let i = 0; i < phase1Cats.length; i++) {
    const cat = phase1Cats[i];
    const unsolved = problems.filter(
      p => p.category === cat && p.isNeetCode75 && !solvedIds.has(p.id)
    );
    if (unsolved.length > 0) return i;
  }
  return phase1Cats.length - 1; // all done, stay at last
}

// ─────────────────────────────────────────────────────────────────────────────

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      progress: {},
      activityLog: {},
      syntaxProgress: {},
      streak: {
        current: 0,
        max: 0,
        lastActiveDate: null,
      },
      onboardingComplete: false,
      leetcodeUsername: null,
      lastSync: null,
      lastSyncCount: null,
      syncError: null,
      targetInterviewDate: '2026-09-15',

      // ── Session Timing defaults ──────────────────────────────────
      activeSession: null,
      sessionTimings: [],
      categoryAvgSolveTimes: {},
      categoryAvgReviewTimes: {},
      personalBestTimes: {},
      lastCategoryAvgUpdate: null,
      // ─────────────────────────────────────────────────────────────

      // ── Sprint defaults ──────────────────────────────────────────
      sprintState: null,
      sprintHistory: [],
      consecutiveLowConfByCategory: {},
      categoryStruggling: {},
      consecutiveLowConfTotal: 0,
      proactiveNeetCodeProblemId: null,
      sprintFreePick: { usedThisWeek: false, lastResetDate: null },
      // ─────────────────────────────────────────────────────────────

      settings: {
        studySchedule: { weekdayMinutes: 60, weekendMinutes: 120, restDay: 0, blackoutDates: [] },
        skillLevels: {},
        targetCompanyTier: 'MIXED',
        interviewType: 'INTERNSHIP',
        srAggressiveness: 'RELAXED',
        language: 'Python',
        learningMode: 'SPRINT',
        sprintSettings: {
          strictMode: true,
          lengthMultiplier: 1.0,
          targetDays: 7,
        },
      },
      targetEvents: [],
      dayMode: { type: 'NORMAL', dateSet: null },
      catchUpPlan: { active: false, type: null, startedAt: null, durationDays: 0 },
      graceDay: { usedThisWeek: false, lastResetDate: null },
      personalRecords: {
        longestStreak: 0,
        currentStreak: 0,
        fastestMockByCategory: {},
        mostProblemsInDay: 0,
        highestReadinessScore: 0,
        firstProblemSolvedDate: null,
        totalStudyTimeHours: 0
      },

      setOnboardingComplete: () => set({ onboardingComplete: true }),

      setTargetInterviewDate: (date) => set({ targetInterviewDate: date }),

      addTargetEvent: (event: Omit<{ id: string; title: string; type: string; date: string }, "id">) => set((state) => {
        const newEvent = { ...event, id: crypto.randomUUID() };
        const newEvents = [...state.targetEvents, newEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const today = new Date().toISOString().split('T')[0];
        const nextEvent = newEvents.find(e => e.date >= today);
        return {
          targetEvents: newEvents,
          targetInterviewDate: nextEvent ? nextEvent.date : state.targetInterviewDate
        };
      }),

      removeTargetEvent: (id) => set((state) => {
        const newEvents = state.targetEvents.filter(e => e.id !== id);
        const today = new Date().toISOString().split('T')[0];
        const nextEvent = newEvents.find(e => e.date >= today);
        return {
          targetEvents: newEvents,
          targetInterviewDate: nextEvent ? nextEvent.date : (newEvents.length > 0 ? newEvents[newEvents.length - 1].date : state.targetInterviewDate)
        };
      }),

      updateSettings: (newSettings) => {
        set((state) => ({ settings: { ...state.settings, ...newSettings } }));
        if (newSettings.srAggressiveness) {
          get().recalcSpacedRepetition();
        }
        // If sprint multiplier or targetDays changed, recompute sprint length
        if (newSettings.sprintSettings?.lengthMultiplier !== undefined || newSettings.sprintSettings?.targetDays !== undefined) {
          const state = get();
          if (state.sprintState) {
            const { currentCategory, sprintIndex } = state.sprintState;
            const newLength = computeSprintLength(
              currentCategory,
              state.settings.skillLevels,
              newSettings.sprintSettings?.lengthMultiplier ?? state.settings.sprintSettings.lengthMultiplier,
              newSettings.sprintSettings?.targetDays ?? state.settings.sprintSettings.targetDays
            );
            set(s => ({
              sprintState: s.sprintState ? { ...s.sprintState, sprintLength: newLength } : null
            }));
          }
        }
      },

      recalcSpacedRepetition: () => set((state) => {
        const isAggressive = state.settings.srAggressiveness === 'AGGRESSIVE';
        const newProgress = { ...state.progress };
        let updated = false;

        Object.keys(newProgress).forEach(id => {
          const prog = newProgress[id];
          const prob = problems.find(p => p.id === id);
          if (!prog.retired && prog.history.length > 0) {
            const lastRating = prog.history[prog.history.length - 1].rating;
            const newNextReviewAt = getNextReviewDate(lastRating, prog.consecutiveSuccesses || 0, isAggressive, prob?.difficulty).toISOString();
            if (prog.nextReviewAt !== newNextReviewAt) {
              newProgress[id] = { ...prog, nextReviewAt: newNextReviewAt };
              updated = true;
            }
          }
        });

        return updated ? { progress: newProgress } : {};
      }),

      setDayMode: (mode) => set({ dayMode: { type: mode, dateSet: new Date().toISOString() } }),

      setCatchUpPlan: (type, durationDays) => set({ catchUpPlan: { active: true, type, startedAt: new Date().toISOString(), durationDays } }),

      dismissCatchUpBanner: () => set((state) => ({ catchUpPlan: { ...state.catchUpPlan, active: false } })),

      useGraceDay: () => set((state) => ({ graceDay: { ...state.graceDay, usedThisWeek: true } })),

      resetGraceDayIfNeeded: () => set((state) => {
        const today = new Date();
        const mondayOfThisWeek = new Date(today);
        mondayOfThisWeek.setDate(today.getDate() - today.getDay() + 1);
        mondayOfThisWeek.setHours(0, 0, 0, 0);

        if (!state.graceDay.lastResetDate || new Date(state.graceDay.lastResetDate) < mondayOfThisWeek) {
          return { graceDay: { usedThisWeek: false, lastResetDate: mondayOfThisWeek.toISOString() } };
        }
        return {};
      }),

      updatePersonalRecords: (updates) => set((state) => ({
        personalRecords: { ...state.personalRecords, ...updates }
      })),

      setLeetCodeUsername: (username) => {
        set({ leetcodeUsername: username });
        get().syncLeetCode();
      },

      syncLeetCode: async () => {
        const { leetcodeUsername, progress } = get();
        if (!leetcodeUsername) return;

        try {
          const submissions = await fetchLeetCodeProfile(leetcodeUsername);

          const newProgress = { ...progress };
          let updated = false;
          let pulledCount = 0;

          submissions.forEach(sub => {
            const problemId = sub.titleSlug;
            const existsInLibrary = problems.some(p => p.id === problemId);

            if (existsInLibrary && !newProgress[problemId]) {
              const solveDate = new Date(parseInt(sub.timestamp) * 1000);
              const solveDateStr = solveDate.toISOString();
              const nextReview = new Date(solveDate);
              nextReview.setDate(nextReview.getDate() + 3);

              newProgress[problemId] = {
                firstSolvedAt: solveDateStr,
                lastReviewedAt: solveDateStr,
                nextReviewAt: startOfDay(nextReview).toISOString(),
                reviewCount: 0,
                history: [{ date: solveDateStr, rating: 3 }],
                retired: false,
                consecutiveThrees: 1,
                consecutiveSuccesses: 1,
              };
              updated = true;
              pulledCount++;
            }
          });

          set({
            syncError: null,
            lastSync: new Date().toISOString(),
            lastSyncCount: pulledCount
          });

          if (updated) {
            set({ progress: newProgress });
          }
        } catch (error: any) {
          set({ syncError: error.message || 'Failed to sync with LeetCode' });
        }
      },

      // ── Session Timing Actions ─────────────────────────────────────────────

      startSession: (problemId, isReview, isColdSolve = false) => {
        set({
          activeSession: {
            problemId,
            startTimestamp: Date.now(),
            isReview,
            isColdSolve,
          }
        });
      },

      endSession: (elapsedSeconds, rating, notes, additionalHistoryData) => {
        const state = get();
        const session = state.activeSession;
        if (!session) return;

        const { problemId, isReview, isColdSolve } = session;
        const prob = problems.find(p => p.id === problemId);
        const category = prob?.category ?? 'Unknown';
        const sessionType: SessionTiming['sessionType'] = isReview
          ? 'review'
          : isColdSolve
            ? 'cold_solve'
            : 'new';

        const timingRecord: SessionTiming = {
          id: crypto.randomUUID(),
          problemId,
          category,
          date: new Date().toISOString(),
          elapsedSeconds,
          sessionType,
          rating,
        };

        const newCategoryAvgSolveTimes = { ...state.categoryAvgSolveTimes };
        const newCategoryAvgReviewTimes = { ...state.categoryAvgReviewTimes };

        if (sessionType === 'review') {
          const existing = newCategoryAvgReviewTimes[category] ?? { totalSeconds: 0, count: 0 };
          newCategoryAvgReviewTimes[category] = {
            totalSeconds: existing.totalSeconds + elapsedSeconds,
            count: existing.count + 1,
          };
        } else {
          const existing = newCategoryAvgSolveTimes[category] ?? { totalSeconds: 0, count: 0 };
          newCategoryAvgSolveTimes[category] = {
            totalSeconds: existing.totalSeconds + elapsedSeconds,
            count: existing.count + 1,
          };
        }

        const newPersonalBestTimes = { ...state.personalBestTimes };
        const currentBest = newPersonalBestTimes[problemId];
        if (currentBest === undefined || elapsedSeconds < currentBest) {
          newPersonalBestTimes[problemId] = elapsedSeconds;
        }

        const isNew = !isReview && !isColdSolve;
        get().logProblem(problemId, rating, isNew, notes, {
          elapsedSeconds,
          sessionType,
          ...additionalHistoryData,
        });

        set({
          activeSession: null,
          sessionTimings: [...state.sessionTimings, timingRecord],
          categoryAvgSolveTimes: newCategoryAvgSolveTimes,
          categoryAvgReviewTimes: newCategoryAvgReviewTimes,
          personalBestTimes: newPersonalBestTimes,
          lastCategoryAvgUpdate: Date.now(),
        });
      },

      abandonSession: () => {
        set({ activeSession: null });
      },

      // ──────────────────────────────────────────────────────────────────────

      logProblem: (problemId, rating, isNew, notes, additionalHistoryData) => {
        set((state) => {
          const today = startOfDay(new Date());
          const todayStr = today.toISOString();
          const dateKey = format(today, 'yyyy-MM-dd');

          const existing = state.progress[problemId];
          const prob = problems.find(p => p.id === problemId);
          const isFirstRating = !existing || existing.history.length === 0;
          const consecutiveThrees = rating === 3 ? (existing?.consecutiveThrees || 0) + 1 : 0;

          const prevSuccesses = existing?.consecutiveSuccesses || 0;
          const consecutiveSuccesses = rating >= 2 ? prevSuccesses + 1 : 0;

          const difficulty = prob?.difficulty || 'Medium';
          const retireThreshold = difficulty === 'Easy' ? 2 : difficulty === 'Hard' ? 6 : 4;
          const retired = consecutiveSuccesses >= retireThreshold && consecutiveThrees >= 2;

          const reviewCount = isFirstRating ? 0 : (existing ? existing.reviewCount + 1 : 0);

          const isAggressive = state.settings?.srAggressiveness === 'AGGRESSIVE';
          const nextReviewAt = getNextReviewDate(rating, consecutiveSuccesses, isAggressive, difficulty).toISOString();

          const newProgress: ProblemProgress = {
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

          const currentLog = state.activityLog[dateKey] || { solved: 0, reviewed: 0 };
          const newLog = {
            ...state.activityLog,
            [dateKey]: {
              solved: currentLog.solved + (isNew ? 1 : 0),
              reviewed: currentLog.reviewed + (!isNew ? 1 : 0),
            },
          };

          let newStreak = { ...state.streak };
          let newGraceDayObj = { ...state.graceDay };

          if (!state.streak.lastActiveDate) {
            newStreak = { current: 1, max: Math.max(1, state.streak.max), lastActiveDate: todayStr };
          } else {
            const lastActive = startOfDay(new Date(state.streak.lastActiveDate));
            const diffInDays = differenceInDays(today, lastActive);

            if (diffInDays === 0) {
              newStreak.lastActiveDate = todayStr;
            } else if (diffInDays === 1) {
              newStreak.current += 1;
              newStreak.max = Math.max(newStreak.current, newStreak.max);
              newStreak.lastActiveDate = todayStr;
            } else if (diffInDays === 2 && !state.graceDay.usedThisWeek) {
              newGraceDayObj.usedThisWeek = true;
              newStreak.current += 1;
              newStreak.max = Math.max(newStreak.current, newStreak.max);
              newStreak.lastActiveDate = todayStr;
            } else if (diffInDays > 1) {
              newStreak.current = 1;
              newStreak.lastActiveDate = todayStr;
            }
          }

          // ── Adaptive Momentum: track consecutive low-confidence per category ──
          const category = prob?.category ?? 'Unknown';
          let newConsecLowByCategory = { ...state.consecutiveLowConfByCategory };
          let newCategoryStruggling = { ...state.categoryStruggling };
          let newConsecLowTotal = state.consecutiveLowConfTotal;
          let newProactiveId = state.proactiveNeetCodeProblemId;

          if (isNew) {
            if (rating === 1 && difficulty === 'Medium') {
              const prev = newConsecLowByCategory[category] ?? 0;
              newConsecLowByCategory[category] = prev + 1;
              if (newConsecLowByCategory[category] >= 2) {
                newCategoryStruggling[category] = true;
              }
            } else if (rating >= 2 && difficulty === 'Easy' && newCategoryStruggling[category]) {
              // Cleared struggling status after rating easy ≥ 2
              newCategoryStruggling[category] = false;
              newConsecLowByCategory[category] = 0;
            }

            if (rating === 1) {
              newConsecLowTotal += 1;
              if (newConsecLowTotal >= 2 && !newProactiveId) {
                newProactiveId = problemId;
              }
            } else {
              newConsecLowTotal = 0;
            }
          }
          // ────────────────────────────────────────────────────────────────────

          return {
            progress: { ...state.progress, [problemId]: newProgress },
            activityLog: newLog,
            streak: newStreak,
            graceDay: newGraceDayObj,
            consecutiveLowConfByCategory: newConsecLowByCategory,
            categoryStruggling: newCategoryStruggling,
            consecutiveLowConfTotal: newConsecLowTotal,
            proactiveNeetCodeProblemId: newProactiveId,
          };
        });

        // Auto-handle sprint retrospective if this is the retro problem
        const newState = get();
        if (
          newState.sprintState?.sprintStatus === 'retrospective' &&
          newState.sprintState.retroProblemId === problemId
        ) {
          get().recordSprintRetro(rating >= 2, rating);
        }
      },

      logMockInterview: (
        problemId, evalSolved, evalSyntax, evalComplexity, approachSimilarity,
        rawCode, optimalSolution, usedInAppEditor, actualSecondsUsed, timeLimitSeconds = 25 * 60
      ) => {
        let rating: 1 | 2 | 3 = 2;
        if (!evalSolved || !evalSyntax || (approachSimilarity === 1)) {
          rating = 1;
        } else if (evalSolved && evalSyntax && evalComplexity && approachSimilarity === 3) {
          rating = 3;
        }

        if (actualSecondsUsed !== undefined) {
          const prob = problems.find(p => p.id === problemId);
          const category = prob?.category ?? 'Unknown';
          const timingRecord: SessionTiming = {
            id: crypto.randomUUID(),
            problemId,
            category,
            date: new Date().toISOString(),
            elapsedSeconds: actualSecondsUsed,
            sessionType: 'mock',
            rating,
          };
          set(state => ({ sessionTimings: [...state.sessionTimings, timingRecord] }));
        }

        get().logProblem(problemId, rating, false, "Mock Interview", {
          rawCode,
          optimalSolution,
          approachSimilarity,
          usedInAppEditor,
          sessionType: 'mock',
          elapsedSeconds: actualSecondsUsed,
          mockTimeLimitSeconds: timeLimitSeconds,
          mockActualSecondsUsed: actualSecondsUsed,
        });
      },

      logSyntaxPractice: (cardId, rating) => {
        set((state) => {
          const today = startOfDay(new Date());
          const todayStr = today.toISOString();

          const existing = state.syntaxProgress[cardId];
          const reviewCount = existing ? existing.reviewCount + 1 : 1;

          let consecutiveSuccesses = existing && existing.confidenceRating >= 2 ? 1 : 0;
          if (rating >= 2) consecutiveSuccesses += 1;

          const isAggressive = state.settings?.srAggressiveness === 'AGGRESSIVE';
          const nextReviewAt = getNextReviewDate(rating, consecutiveSuccesses, isAggressive).toISOString();

          const newProgress: SyntaxProgress = {
            lastPracticedAt: todayStr,
            nextReviewAt,
            confidenceRating: rating,
            reviewCount,
          };

          return {
            syntaxProgress: { ...state.syntaxProgress, [cardId]: newProgress }
          };
        });
      },

      resetProgress: () => set({
        progress: {},
        activityLog: {},
        syntaxProgress: {},
        streak: { current: 0, max: 0, lastActiveDate: null },
        activeSession: null,
        sessionTimings: [],
        categoryAvgSolveTimes: {},
        categoryAvgReviewTimes: {},
        personalBestTimes: {},
        lastCategoryAvgUpdate: null,
        sprintState: null,
        sprintHistory: [],
        consecutiveLowConfByCategory: {},
        categoryStruggling: {},
        consecutiveLowConfTotal: 0,
        proactiveNeetCodeProblemId: null,
        sprintFreePick: { usedThisWeek: false, lastResetDate: null },
      }),

      removeProblem: (problemId) => set((state) => {
        const newProgress = { ...state.progress };
        delete newProgress[problemId];
        return { progress: newProgress };
      }),

      // ── Sprint Actions ─────────────────────────────────────────────────────

      initCurrentSprint: () => {
        const state = get();
        const solvedIds = new Set(Object.keys(state.progress));
        const idx = findInitialSprintIndex(solvedIds, PHASE_1_CATEGORIES);
        const category = PHASE_1_CATEGORIES[idx];
        const sprintLength = computeSprintLength(
          category,
          state.settings.skillLevels,
          state.settings.sprintSettings?.lengthMultiplier ?? 1.0,
          state.settings.sprintSettings?.targetDays ?? 7
        );
        const sprintState: SprintState = {
          currentCategory: category,
          sprintStartDate: startOfDay(new Date()).toISOString(),
          sprintLength,
          sprintStatus: 'active',
          sprintIndex: idx,
          extensionDays: 0,
          retroProblemId: null,
          retroAttempted: false,
        };
        set({ sprintState });
      },

      advanceSprint: () => {
        const state = get();
        if (!state.sprintState) return;
        const { sprintIndex, currentCategory, sprintStartDate, sprintLength, extensionDays } = state.sprintState;

        // Record in history
        const historyEntry: SprintHistoryEntry = {
          category: currentCategory,
          startDate: sprintStartDate,
          endDate: new Date().toISOString(),
          passed: true,
          avgSolveSeconds: (() => {
            const data = state.categoryAvgSolveTimes[currentCategory];
            return data && data.count > 0 ? Math.round(data.totalSeconds / data.count) : 0;
          })(),
          sprintLength: sprintLength + extensionDays,
        };

        const solvedIds = new Set(Object.keys(state.progress));
        const reservedIds = getReservedProblemIds();
        let nextIdx = sprintIndex + 1;
        while (nextIdx < PHASE_1_CATEGORIES.length) {
          const cat = PHASE_1_CATEGORIES[nextIdx];
          const hasUnsolved = problems.some(
            p => p.category === cat && p.isNeetCode75 && !solvedIds.has(p.id) && !reservedIds.has(p.id)
          );
          if (hasUnsolved) break;
          nextIdx++;
        }

        if (nextIdx >= PHASE_1_CATEGORIES.length) {
          // All Phase 1 sprints done
          set({
            sprintState: { ...state.sprintState, sprintStatus: 'complete' },
            sprintHistory: [...state.sprintHistory, historyEntry],
          });
          return;
        }

        const nextCategory = PHASE_1_CATEGORIES[nextIdx];
        const nextLength = computeSprintLength(
          nextCategory,
          state.settings.skillLevels,
          state.settings.sprintSettings?.lengthMultiplier ?? 1.0,
          state.settings.sprintSettings?.targetDays ?? 7
        );

        set({
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
          sprintHistory: [...state.sprintHistory, historyEntry],
        });
      },

      extendSprint: (days: number) => {
        set((state) => {
          if (!state.sprintState) return {};
          return {
            sprintState: {
              ...state.sprintState,
              sprintStatus: 'active',
              extensionDays: state.sprintState.extensionDays + days,
              retroAttempted: true,
            }
          };
        });
      },

      recordSprintRetro: (passed, rating) => {
        // ALWAYS advance the sprint now, "no matter how you did"
        get().advanceSprint();
      },

      setSprintCategory: (category) => {
        const state = get();
        const solvedIds = new Set(Object.keys(state.progress));
        const idx1 = PHASE_1_CATEGORIES.indexOf(category as any);
        const idx2 = PHASE_2_CATEGORIES.indexOf(category as any);
        
        const isPhase2 = idx2 !== -1;
        const idx = isPhase2 ? idx2 : idx1 !== -1 ? idx1 : 0;
        
        const newLength = computeSprintLength(
          category,
          state.settings.skillLevels,
          state.settings.sprintSettings?.lengthMultiplier ?? 1.0,
          state.settings.sprintSettings?.targetDays ?? 7
        );

        set({
          sprintState: {
            currentCategory: category,
            sprintStartDate: startOfDay(new Date()).toISOString(),
            sprintLength: newLength,
            sprintStatus: 'active',
            sprintIndex: idx,
            extensionDays: 0,
            retroProblemId: null,
            retroAttempted: false,
          }
        });
      },

      dismissProactiveNeetCode: () => set({ proactiveNeetCodeProblemId: null, consecutiveLowConfTotal: 0 }),

      useSprintFreePick: () => set((state) => ({
        sprintFreePick: { ...state.sprintFreePick, usedThisWeek: true }
      })),

      resetSprintFreePickIfNeeded: () => set((state) => {
        const today = new Date();
        const mondayOfThisWeek = new Date(today);
        mondayOfThisWeek.setDate(today.getDate() - today.getDay() + 1);
        mondayOfThisWeek.setHours(0, 0, 0, 0);
        if (!state.sprintFreePick.lastResetDate || new Date(state.sprintFreePick.lastResetDate) < mondayOfThisWeek) {
          return { sprintFreePick: { usedThisWeek: false, lastResetDate: mondayOfThisWeek.toISOString() } };
        }
        return {};
      }),

      // ──────────────────────────────────────────────────────────────────────

      getDailyPlan: () => {
        const state = get();
        const phase = getPhase();
        const today = new Date();
        const dayOfWeek = getDay(today);

        // ── Review queue (unchanged — all categories, no sprint bias) ────────
        const allDueReviews = Object.entries(state.progress)
          .filter(([_, prog]) => !prog.retired && isDueToday(prog.nextReviewAt))
          .map(([id, prog]) => ({ id, prog }))
          .sort((a, b) => {
            const successA = a.prog.consecutiveSuccesses || 0;
            const successB = b.prog.consecutiveSuccesses || 0;
            if (successA !== successB) return successA - successB;

            const probA = problems.find(p => p.id === a.id);
            const probB = problems.find(p => p.id === b.id);
            if (probA?.isBlind75 && !probB?.isBlind75) return -1;
            if (!probA?.isBlind75 && probB?.isBlind75) return 1;
            return 0;
          });

        const totalDueReviews = allDueReviews.length;
        const reviewProblems = allDueReviews.slice(0, 5).map(r => r.id);

        const allDueSyntax = Object.entries(state.syntaxProgress || {})
          .filter(([_, prog]) => isDueToday(prog.nextReviewAt))
          .sort((a, b) => a[1].confidenceRating - b[1].confidenceRating)
          .map(([id]) => id);

        const dueSyntaxCards = allDueSyntax.slice(0, 5);

        const isEasyDay = state.dayMode.type === 'EASY' && state.dayMode.dateSet && isSameDay(today, new Date(state.dayMode.dateSet));
        const isHardDay = state.dayMode.type === 'HARD' && state.dayMode.dateSet && isSameDay(today, new Date(state.dayMode.dateSet));

        let coldSolveProblem: string | null = null;
        if (!isEasyDay) {
          const potentialColdSolves = Object.entries(state.progress)
            .filter(([_, prog]) => {
              if (prog.history.length === 0) return false;
              const daysSinceLastReview = differenceInDays(today, new Date(prog.lastReviewedAt));
              return daysSinceLastReview > 30;
            })
            .sort((a, b) => new Date(a[1].lastReviewedAt).getTime() - new Date(b[1].lastReviewedAt).getTime())
            .map(([id]) => id);

          if (potentialColdSolves.length > 0) {
            coldSolveProblem = potentialColdSolves[0];
          }
        }

        // ── New problem slot ─────────────────────────────────────────────────
        let newProblem: string | null = null;
        let additionalProblems: string[] = [];
        let recommendationReason: string | undefined = undefined;
        let isStabilizer = false;
        let isRetro = false;
        let sprintCategory: string | undefined = undefined;
        let sprintDayInfo: { day: number; total: number } | undefined = undefined;

        const solvedIds = new Set(Object.keys(state.progress));
        const reservedIds = getReservedProblemIds();

        let shouldAssignNewProblem = true;
        let targetNewProblemCount = 1;

        if (state.catchUpPlan?.active && state.catchUpPlan?.type === 'CATCH_UP') {
          targetNewProblemCount = 2;
          if (state.catchUpPlan.startedAt) {
            const daysSinceStart = differenceInDays(today, new Date(state.catchUpPlan.startedAt));
            if (daysSinceStart >= (state.catchUpPlan.durationDays || 0)) {
              targetNewProblemCount = 1;
            }
          }
        }

        if (state.settings.studySchedule.restDay === dayOfWeek) {
          shouldAssignNewProblem = false;
        }

        if (phase === 2 && shouldAssignNewProblem) {
          let solvedThisWeek = 0;
          for (let i = 0; i <= dayOfWeek; i++) {
            const dateKey = format(subDays(today, i), 'yyyy-MM-dd');
            if (state.activityLog[dateKey]?.solved > 0) {
              solvedThisWeek++;
            }
          }
          if (solvedThisWeek >= 3) {
            shouldAssignNewProblem = false;
          }
        }

        // ── Phase 1 Sprint Logic ─────────────────────────────────────────────
        const useSprintLogic = phase === 1 && state.settings.learningMode !== 'RANDOM';
        if (shouldAssignNewProblem && useSprintLogic) {
          // Ensure sprint is initialized
          let sprint = state.sprintState;
          if (!sprint) {
            get().initCurrentSprint();
            sprint = get().sprintState;
          }

          if (sprint && sprint.sprintStatus !== 'complete') {
            sprintCategory = sprint.currentCategory;

            // Compute sprint day info
            const sprintStart = startOfDay(new Date(sprint.sprintStartDate));
            const todayStart = startOfDay(today);
            const daysSinceStart = differenceInDays(todayStart, sprintStart);
            const totalDays = sprint.sprintLength + sprint.extensionDays;
            const currentDay = Math.min(daysSinceStart + 1, totalDays);
            sprintDayInfo = { day: currentDay, total: totalDays };

            const findRetroCandidate = () => {
              const cat = sprint!.currentCategory;
              return problems.find(p => p.category === cat && p.isNeetCode75 && !solvedIds.has(p.id) && !reservedIds.has(p.id) && p.difficulty === 'Medium')
                ?? problems.find(p => p.category === cat && p.isNeetCode75 && !solvedIds.has(p.id) && !reservedIds.has(p.id))
                ?? problems.find(p => p.category === cat && !solvedIds.has(p.id) && !reservedIds.has(p.id))
                ?? problems.find(p => p.category === cat && !reservedIds.has(p.id));
            };

            // Check if it's the retrospective phase
            if (sprint.sprintStatus === 'retrospective') {
              isRetro = true;
              // Surface the retro problem (a medium from the sprint category not yet solved)
              let retroId = sprint.retroProblemId;
              if (!retroId) {
                const retroCandidate = findRetroCandidate();
                if (retroCandidate) {
                  retroId = retroCandidate.id;
                  // Persist the retro problem id only if it's a new ID
                  if (sprint.retroProblemId !== retroId) {
                    set(s => ({
                      sprintState: s.sprintState
                        ? { ...s.sprintState, retroProblemId: retroId }
                        : null
                    }));
                  }
                }
              }
              newProblem = retroId;
              recommendationReason = `Sprint Check — complete this problem to pass your ${sprint.currentCategory} sprint.`;
            } else {
              // Check if today goes past the sprint length → transition to retrospective
              if (daysSinceStart >= totalDays) {
                // Time for retrospective
                if ((sprint.sprintStatus as string) !== 'retrospective') {
                  set(s => ({
                    sprintState: s.sprintState
                      ? { ...s.sprintState, sprintStatus: 'retrospective' }
                      : null
                  }));
                }
                isRetro = true;
                const retroCandidate = findRetroCandidate();
                if (retroCandidate) {
                  set(s => ({
                    sprintState: s.sprintState
                      ? { ...s.sprintState, retroProblemId: retroCandidate.id }
                      : null
                  }));
                  newProblem = retroCandidate.id;
                }
                recommendationReason = `Sprint Check — complete this problem to pass your ${sprint.currentCategory} sprint.`;
              } else {
                // Regular sprint day — pick from sprint category
                const sprintCat = sprint.currentCategory;
                const isStruggling = state.categoryStruggling[sprintCat] ?? false;

                // Find next unsolved problem in sprint category (not reserved)
                const categoryProblems = problems.filter(
                  p => p.category === sprintCat && p.isNeetCode75 && !solvedIds.has(p.id) && !reservedIds.has(p.id)
                );

                let candidate = null;

                if (isEasyDay) {
                  candidate = categoryProblems.find(p => p.difficulty === 'Easy') ?? categoryProblems[0];
                } else if (isHardDay) {
                  candidate = categoryProblems.find(p => p.difficulty === 'Hard') ?? categoryProblems[0];
                } else if (isStruggling) {
                  // Adaptive downshift: prefer Easy
                  const easyCandidates = categoryProblems.filter(p => p.difficulty === 'Easy');
                  candidate = easyCandidates[0] ?? categoryProblems[0];
                  if (candidate && candidate.difficulty === 'Easy') {
                    isStabilizer = true;
                  }
                } else {
                  candidate = categoryProblems[0];
                }

                if (candidate) {
                  newProblem = candidate.id;
                  if (isStabilizer) {
                    recommendationReason = `Stabilizer: Easy problem selected as you've been struggling with ${sprintCat} mediums.`;
                  } else {
                    recommendationReason = `Sprint Day ${currentDay}/${totalDays}: Drilling ${sprintCat} patterns.`;
                  }
                } else {
                  // Sprint category exhausted → transition to retrospective
                  if ((sprint.sprintStatus as string) !== 'retrospective') {
                    set(s => ({
                      sprintState: s.sprintState
                        ? { ...s.sprintState, sprintStatus: 'retrospective' }
                        : null
                    }));
                  }
                  isRetro = true;
                  recommendationReason = `${sprintCat} problems exhausted — Sprint Check coming.`;
                }

                // Additional problem (catch-up) also from sprint category
                if (newProblem && targetNewProblemCount > 1) {
                  const secondCandidate = categoryProblems.find(
                    p => !solvedIds.has(p.id) && p.id !== newProblem && !reservedIds.has(p.id)
                  );
                  if (secondCandidate) {
                    additionalProblems.push(secondCandidate.id);
                  }
                }
              }
            }
          }
        }

        // ── Phase 2+ or RANDOM fallback (original weakest-category logic) ──────────────
        if (shouldAssignNewProblem && !useSprintLogic && !newProblem) {
          const candidateCategories: string[] = [...PHASE_1_CATEGORIES, ...PHASE_2_CATEGORIES];

          const categoryStats: Record<string, { total: number; count: number }> = {};
          Object.entries(state.progress).forEach(([id, prog]) => {
            const prob = problems.find(p => p.id === id);
            if (prob && prog.history.length > 0) {
              const lastRating = prog.history[prog.history.length - 1].rating;
              if (!categoryStats[prob.category]) categoryStats[prob.category] = { total: 0, count: 0 };
              categoryStats[prob.category].total += lastRating;
              categoryStats[prob.category].count += 1;
            }
          });

          const categoryAverages = Object.entries(categoryStats).map(([cat, stats]) => ({
            category: cat,
            avg: stats.total / stats.count
          })).sort((a, b) => a.avg - b.avg);

          for (const { category, avg } of categoryAverages) {
            if (!candidateCategories.includes(category)) continue;
            if (avg >= 2.5) continue;

            const categoryProblems = problems.filter(
              p => p.category === category && (phase === 3 ? p.isNeetCode150 : p.isNeetCode75) && !reservedIds.has(p.id)
            );
            const unsolved = categoryProblems.find(p => !solvedIds.has(p.id));

            if (unsolved) {
              newProblem = unsolved.id;
              recommendationReason = `Recommending this because your ${category} confidence average is ${avg.toFixed(1)}.`;
              break;
            }
          }

          if (!newProblem) {
            let easyRatio = 33, medRatio = 34;
            if (state.settings.targetCompanyTier === 'FAANG') { easyRatio = 20; medRatio = 60; }
            else if (state.settings.targetCompanyTier === 'FINTECH') { easyRatio = 30; medRatio = 60; }
            else if (state.settings.targetCompanyTier === 'GENERAL') { easyRatio = 50; medRatio = 45; }

            const rand = Math.random() * 100;
            let targetDifficulty: 'Easy' | 'Medium' | 'Hard' = 'Hard';
            if (isEasyDay) targetDifficulty = 'Easy';
            else if (isHardDay) targetDifficulty = 'Hard';
            else if (rand < easyRatio) targetDifficulty = 'Easy';
            else if (rand < easyRatio + medRatio) targetDifficulty = 'Medium';

            for (const category of candidateCategories) {
              const categoryProblems = problems.filter(
                p => p.category === category && (phase === 3 ? p.isNeetCode150 : p.isNeetCode75) && !reservedIds.has(p.id)
              );
              const unsolvedOfDifficulty = categoryProblems.find(
                p => !solvedIds.has(p.id) && p.difficulty === targetDifficulty
              );

              if (unsolvedOfDifficulty) {
                newProblem = unsolvedOfDifficulty.id;
                recommendationReason = isEasyDay
                  ? `Selected an Easy problem because you have Easy Mode enabled.`
                  : isHardDay
                    ? `Selected a Hard problem because you're on Hard Mode.`
                    : `Selected a ${targetDifficulty} problem to match your ${state.settings.targetCompanyTier} company tier target.`;
                break;
              }
            }

            if (!newProblem) {
              for (const category of candidateCategories) {
                const categoryProblems = problems.filter(
                  p => p.category === category && (phase === 3 ? p.isNeetCode150 : p.isNeetCode75) && !reservedIds.has(p.id)
                );
                const unsolved = categoryProblems.find(p => !solvedIds.has(p.id));
                if (unsolved) {
                  newProblem = unsolved.id;
                  recommendationReason = `Next up in your sequential plan.`;
                  break;
                }
              }
            }
          }

          if (!newProblem && phase === 3) {
            const unsolved = problems.find(
              p => p.isNeetCode150 && !solvedIds.has(p.id) && !reservedIds.has(p.id) && (isEasyDay ? p.difficulty === 'Easy' : true)
            );
            if (unsolved) {
              newProblem = unsolved.id;
              recommendationReason = `Next up in NeetCode 150.`;
            }
          }

          if (newProblem && targetNewProblemCount > 1) {
            const secondUnsolved = problems.find(
              p => (phase === 3 ? p.isNeetCode150 : p.isNeetCode75) && !solvedIds.has(p.id) && !reservedIds.has(p.id) && p.id !== newProblem && (isEasyDay ? p.difficulty === 'Easy' : true)
            );
            if (secondUnsolved) {
              additionalProblems.push(secondUnsolved.id);
            }
          }
        }

        return {
          newProblem,
          additionalProblems,
          reviewProblems,
          coldSolveProblem,
          dueSyntaxCards,
          recommendationReason,
          totalDueReviews,
          dayModeType: isEasyDay ? 'EASY' : isHardDay ? 'HARD' : 'NORMAL',
          isStabilizer,
          isRetro,
          sprintCategory,
          sprintDayInfo,
        };
      },
    }),
    {
      name: 'leetcode-tracker-storage',
      storage: createJSONStorage(() => supabaseStorage),
    }
  )
);
