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
  history: { date: string; rating: 1 | 2 | 3 }[];
  retired: boolean;
  consecutiveThrees: number;
  consecutiveSuccesses?: number;
  notes?: string;
}

export interface ActivityLog {
  [dateString: string]: { solved: number; reviewed: number };
}

interface AppState {
  progress: Record<string, ProblemProgress>;
  activityLog: ActivityLog;
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

  logProblem: (problemId: string, rating: 1 | 2 | 3, isNew: boolean, notes?: string) => void;
  logMockInterview: (problemId: string, evalSolved: boolean, evalSyntax: boolean, evalComplexity: boolean) => void;
  resetProgress: () => void;
  getDailyPlan: () => {
    newProblem: string | null;
    reviewProblems: string[];
    coldSolveProblem: string | null;
    recommendationReason?: string;
    totalDueReviews?: number;
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
      streak: {
        current: 0,
        max: 0,
        lastActiveDate: null,
      },
      leetcodeUsername: null,
      lastSync: null,
      lastSyncCount: null,
      syncError: null,
      targetInterviewDate: '2026-09-15', // Default to Sept 15, 2026

      setTargetInterviewDate: (date) => set({ targetInterviewDate: date }),

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
            // Check if it's in our library
            const existsInLibrary = problems.some(p => p.id === problemId);

            if (existsInLibrary && !newProgress[problemId]) {
              // Add as solved with default rating of 3
              const solveDate = new Date(parseInt(sub.timestamp) * 1000);
              const solveDateStr = solveDate.toISOString();

              // Calculate next review based on solve date (Day 3)
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

      logProblem: (problemId, rating, isNew, notes) => {
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

          const nextReviewAt = getNextReviewDate(rating, consecutiveSuccesses).toISOString();

          const newProgress: ProblemProgress = {
            firstSolvedAt: existing ? existing.firstSolvedAt : todayStr,
            lastReviewedAt: todayStr,
            nextReviewAt,
            reviewCount,
            history: [...(existing?.history || []), { date: todayStr, rating }],
            retired,
            consecutiveThrees,
            consecutiveSuccesses,
            notes: notes !== undefined ? notes : existing?.notes,
          };

          // Update Activity Log
          const currentLog = state.activityLog[dateKey] || { solved: 0, reviewed: 0 };
          const newLog = {
            ...state.activityLog,
            [dateKey]: {
              solved: currentLog.solved + (isNew ? 1 : 0),
              reviewed: currentLog.reviewed + (!isNew ? 1 : 0),
            },
          };

          // Update Streak
          let newStreak = { ...state.streak };
          if (!state.streak.lastActiveDate) {
            newStreak = { current: 1, max: Math.max(1, state.streak.max), lastActiveDate: todayStr };
          } else {
            const lastActive = startOfDay(new Date(state.streak.lastActiveDate));
            if (isSameDay(lastActive, subDays(today, 1))) {
              newStreak.current += 1;
              newStreak.max = Math.max(newStreak.current, newStreak.max);
              newStreak.lastActiveDate = todayStr;
            } else if (!isSameDay(lastActive, today)) {
              newStreak.current = 1;
              newStreak.lastActiveDate = todayStr;
            }
          }

          return {
            progress: { ...state.progress, [problemId]: newProgress },
            activityLog: newLog,
            streak: newStreak,
          };
        });
      },

      logMockInterview: (problemId, evalSolved, evalSyntax, evalComplexity) => {
        let rating: 1 | 2 | 3 = 2;
        if (!evalSolved || !evalSyntax) {
          rating = 1;
        } else if (evalSolved && evalSyntax && evalComplexity) {
          rating = 3;
        }
        get().logProblem(problemId, rating, false, "Mock Interview");
      },

      resetProgress: () => set({ progress: {}, activityLog: {}, streak: { current: 0, max: 0, lastActiveDate: null } }),

      getDailyPlan: () => {
        const state = get();
        const phase = getPhase();
        const today = new Date();
        const dayOfWeek = getDay(today);

        // Review Problems
        const allDueReviews = Object.entries(state.progress)
          .filter(([_, prog]) => !prog.retired && isDueToday(prog.nextReviewAt))
          .map(([id, prog]) => ({ id, prog }))
          .sort((a, b) => {
            const successA = a.prog.consecutiveSuccesses || 0;
            const successB = b.prog.consecutiveSuccesses || 0;
            if (successA !== successB) return successA - successB; // Lowest successes first

            // Fallback to Blind75 priority
            const probA = problems.find(p => p.id === a.id);
            const probB = problems.find(p => p.id === b.id);
            if (probA?.isBlind75 && !probB?.isBlind75) return -1;
            if (!probA?.isBlind75 && probB?.isBlind75) return 1;
            return 0;
          });

        const totalDueReviews = allDueReviews.length;
        const reviewProblems = allDueReviews.slice(0, 5).map(r => r.id);

        // Cold Solve Logic
        let coldSolveProblem: string | null = null;
        const potentialColdSolves = Object.entries(state.progress)
          .filter(([_, prog]) => {
            if (prog.history.length === 0) return false;
            const daysSinceLastReview = differenceInDays(today, new Date(prog.lastReviewedAt));
            return daysSinceLastReview > 30;
          })
          .sort((a, b) => new Date(a[1].lastReviewedAt).getTime() - new Date(b[1].lastReviewedAt).getTime())
          .map(([id]) => id);

        if (potentialColdSolves.length > 0) {
          // Pick the absolute oldest
          coldSolveProblem = potentialColdSolves[0];
        }

        // New Problem Logic (Smart Recommendation)
        let newProblem: string | null = null;
        let recommendationReason = undefined;
        const solvedIds = new Set(Object.keys(state.progress));

        let shouldAssignNewProblem = true;
        if (phase === 2) {
          const startOfWeek = subDays(today, dayOfWeek);
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

          // Calculate category averages
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

          // Find the lowest confidence category that has unsolved problems
          for (const { category, avg } of categoryAverages) {
            if (!candidateCategories.includes(category)) continue;
            if (avg >= 2.5) continue; // Only prioritize if it's actually a weak category

            const categoryProblems = problems.filter(p => p.category === category && (phase === 3 ? p.isNeetCode150 : p.isNeetCode75));
            const unsolved = categoryProblems.find(p => !solvedIds.has(p.id));

            if (unsolved) {
              newProblem = unsolved.id;
              recommendationReason = `Recommending this because your ${category} confidence average is ${avg.toFixed(1)}.`;
              break;
            }
          }

          // Fallback to sequential if no recommendation found
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

          if (!newProblem && phase === 3) {
            const unsolved = problems.find(p => p.isNeetCode150 && !solvedIds.has(p.id));
            if (unsolved) {
              newProblem = unsolved.id;
              recommendationReason = `Next up in NeetCode 150.`;
            }
          }
        }

        return { newProblem, reviewProblems, coldSolveProblem, recommendationReason, totalDueReviews };
      },
    }),
    {
      name: 'leetcode-tracker-storage',
    }
  )
);

