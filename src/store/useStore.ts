import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { startOfDay, format, isSameDay, subDays, getDay, differenceInDays } from 'date-fns';
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
  /** Persisted active session — survives tab switches via localStorage */
  activeSession: {
    problemId: string;
    startTimestamp: number; // Date.now() at session start
    isReview: boolean;
    isColdSolve: boolean;
  } | null;

  /** All completed session timing records (append-only) */
  sessionTimings: SessionTiming[];

  /** Rolling avg new-solve time per category */
  categoryAvgSolveTimes: Record<string, { totalSeconds: number; count: number }>;

  /** Rolling avg review time per category */
  categoryAvgReviewTimes: Record<string, { totalSeconds: number; count: number }>;

  /** Personal best (fastest solve) time in seconds per problem id */
  personalBestTimes: Record<string, number>;

  /** Timestamp of last time category averages were updated (for "recalculated" badge) */
  lastCategoryAvgUpdate: number | null;
  // ────────────────────────────────────────────────────────────────

  settings: {
    studySchedule: {
      weekdayMinutes: number;
      weekendMinutes: number;
      restDay: number; // 0 = Sunday
      blackoutDates: { start: string; end: string }[];
    };
    skillLevels: Record<string, 'not_familiar' | 'some_exposure' | 'comfortable'>;
    targetCompanyTier: 'FAANG' | 'FINTECH' | 'GENERAL' | 'MIXED';
    interviewType: 'INTERNSHIP' | 'FULL_TIME';
    srAggressiveness: 'RELAXED' | 'AGGRESSIVE';
    language: 'Python' | 'Java' | 'JavaScript';
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
  getDailyPlan: () => {
    newProblem: string | null;
    additionalProblems: string[];
    reviewProblems: string[];
    coldSolveProblem: string | null;
    dueSyntaxCards: string[];
    recommendationReason?: string;
    totalDueReviews?: number;
    dayModeType: 'EASY' | 'HARD' | 'NORMAL';
  };
  setLeetCodeUsername: (username: string) => void;
  syncLeetCode: () => Promise<void>;
  setTargetInterviewDate: (date: string) => void;
}

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

      settings: {
        studySchedule: { weekdayMinutes: 60, weekendMinutes: 120, restDay: 0, blackoutDates: [] },
        skillLevels: {},
        targetCompanyTier: 'MIXED',
        interviewType: 'INTERNSHIP',
        srAggressiveness: 'RELAXED',
        language: 'Python'
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
      },

      recalcSpacedRepetition: () => set((state) => {
        const isAggressive = state.settings.srAggressiveness === 'AGGRESSIVE';
        const newProgress = { ...state.progress };
        let updated = false;

        Object.keys(newProgress).forEach(id => {
          const prog = newProgress[id];
          if (!prog.retired && prog.history.length > 0) {
            const lastRating = prog.history[prog.history.length - 1].rating;
            const newNextReviewAt = getNextReviewDate(lastRating, prog.consecutiveSuccesses || 0, isAggressive).toISOString();
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

        // Build session timing record
        const timingRecord: SessionTiming = {
          id: crypto.randomUUID(),
          problemId,
          category,
          date: new Date().toISOString(),
          elapsedSeconds,
          sessionType,
          rating,
        };

        // Update category averages
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

        // Update personal best
        const newPersonalBestTimes = { ...state.personalBestTimes };
        const currentBest = newPersonalBestTimes[problemId];
        if (currentBest === undefined || elapsedSeconds < currentBest) {
          newPersonalBestTimes[problemId] = elapsedSeconds;
        }

        // Call logProblem with timing data
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
          const isFirstRating = !existing || existing.history.length === 0;
          const consecutiveThrees = rating === 3 ? (existing?.consecutiveThrees || 0) + 1 : 0;

          const prevSuccesses = existing?.consecutiveSuccesses || 0;
          const consecutiveSuccesses = rating >= 2 ? prevSuccesses + 1 : 0;

          const retired = consecutiveSuccesses >= 4 && consecutiveThrees >= 2;
          const reviewCount = isFirstRating ? 0 : (existing ? existing.reviewCount + 1 : 0);

          const isAggressive = state.settings?.srAggressiveness === 'AGGRESSIVE';
          const nextReviewAt = getNextReviewDate(rating, consecutiveSuccesses, isAggressive).toISOString();

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

            if (diffInDays === 1) {
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

          return {
            progress: { ...state.progress, [problemId]: newProgress },
            activityLog: newLog,
            streak: newStreak,
            graceDay: newGraceDayObj
          };
        });
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

        // Also store timing record if we have time data
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
      }),

      getDailyPlan: () => {
        const state = get();
        const phase = getPhase();
        const today = new Date();
        const dayOfWeek = getDay(today);

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

        let newProblem: string | null = null;
        let additionalProblems: string[] = [];
        let recommendationReason = undefined;
        const solvedIds = new Set(Object.keys(state.progress));

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

        if (shouldAssignNewProblem) {
          let candidateCategories: string[] = [];
          if (phase === 1) {
            candidateCategories = PHASE_1_CATEGORIES;
          } else {
            candidateCategories = [...PHASE_1_CATEGORIES, ...PHASE_2_CATEGORIES];
          }

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

            const categoryProblems = problems.filter(p => p.category === category && (phase === 3 ? p.isNeetCode150 : p.isNeetCode75));
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
              const categoryProblems = problems.filter(p => p.category === category && (phase === 3 ? p.isNeetCode150 : p.isNeetCode75));
              const unsolvedOfDifficulty = categoryProblems.find(p => !solvedIds.has(p.id) && p.difficulty === targetDifficulty);

              if (unsolvedOfDifficulty) {
                newProblem = unsolvedOfDifficulty.id;
                recommendationReason = isEasyDay ? `Selected an Easy problem because you have Easy Mode enabled.` : isHardDay ? `Selected a Hard problem because you're on Hard Mode.` : `Selected a ${targetDifficulty} problem to match your ${state.settings.targetCompanyTier} company tier target.`;
                break;
              }
            }

            if (!newProblem) {
              for (const category of candidateCategories) {
                const categoryProblems = problems.filter(p => p.category === category && (phase === 3 ? p.isNeetCode150 : p.isNeetCode75));
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
            const unsolved = problems.find(p => p.isNeetCode150 && !solvedIds.has(p.id) && (isEasyDay ? p.difficulty === 'Easy' : true));
            if (unsolved) {
              newProblem = unsolved.id;
              recommendationReason = `Next up in NeetCode 150.`;
            }
          }

          if (newProblem && targetNewProblemCount > 1) {
            const secondUnsolved = problems.find(p => (phase === 3 ? p.isNeetCode150 : p.isNeetCode75) && !solvedIds.has(p.id) && p.id !== newProblem && (isEasyDay ? p.difficulty === 'Easy' : true));
            if (secondUnsolved) {
              additionalProblems.push(secondUnsolved.id);
            }
          }
        }

        return { newProblem, additionalProblems, reviewProblems, coldSolveProblem, dueSyntaxCards, recommendationReason, totalDueReviews, dayModeType: isEasyDay ? 'EASY' : isHardDay ? 'HARD' : 'NORMAL' };
      },
    }),
    {
      name: 'leetcode-tracker-storage',
    }
  )
);
