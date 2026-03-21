import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format, startOfDay, subDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { useAuth } from '../components/AuthProvider';
import { fetchLeetCodeProfile } from '../services/leetcode';
import {
  DEFAULT_SETTINGS,
  DEFAULT_USER_SETTINGS,
  type ActivityLog,
  type AppSettings,
  type ProblemProgress,
  type SessionTiming,
  type SprintHistoryEntry,
  type SprintState,
  type SyntaxProgress,
  type TargetEvent,
  type UserSettingsData,
} from '../types';
import {
  advanceSprintState,
  applyLeetCodeSubmissions,
  buildDailyPlan,
  calculateSessionAggregates,
  calculateStreakFromActivityLog,
  computeNewProblemProgress,
  computeNewSyntaxProgress,
  computeSprintLength,
  computeUpdatedActivityEntry,
  createInitialSprintState,
  deriveMomentumState,
  setSprintCategoryState,
  SPRINT_DESCRIPTIONS,
} from '../utils/progressHelpers';
import { getNextReviewDate } from '../utils/dateUtils';
import { problems } from '../data/problems';
import { userDataQueryKeys } from '../lib/userDataQueryKeys';

const queryKeys = userDataQueryKeys;

export { userDataQueryKeys };

type StoredSettingsJson = {
  settings?: Partial<AppSettings>;
  targetEvents?: TargetEvent[];
  dayMode?: UserSettingsData['dayMode'];
  catchUpPlan?: UserSettingsData['catchUpPlan'];
  syntaxProgress?: Record<string, SyntaxProgress>;
};

type ProblemProgressRow = {
  problem_id: string;
  first_solved_at: string | null;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  review_count: number;
  consecutive_threes: number;
  consecutive_successes: number;
  retired: boolean;
  notes: string | null;
  history: ProblemProgress['history'];
};

type SessionTimingRow = {
  id: string;
  problem_id: string;
  category: string;
  recorded_at: string;
  elapsed_seconds: number;
  session_type: SessionTiming['sessionType'];
  rating: 1 | 2 | 3;
};

type SprintStateRow = {
  current_category: string | null;
  sprint_start_date: string | null;
  sprint_length: number | null;
  sprint_status: SprintState['sprintStatus'] | null;
  sprint_index: number;
  extension_days: number;
  retro_problem_id: string | null;
  retro_attempted: boolean;
  sprint_history: SprintHistoryEntry[];
};

function mergeSettings(defaults: AppSettings, partial?: Partial<AppSettings>): AppSettings {
  return {
    ...defaults,
    ...partial,
    studySchedule: {
      ...defaults.studySchedule,
      ...(partial?.studySchedule ?? {}),
    },
    sprintSettings: {
      ...defaults.sprintSettings,
      ...(partial?.sprintSettings ?? {}),
    },
  };
}

function normalizeUserSettingsRow(row: {
  onboarding_complete?: boolean | null;
  leetcode_username?: string | null;
  target_interview_date?: string | null;
  settings_json?: StoredSettingsJson | null;
} | null): UserSettingsData {
  const settingsJson = row?.settings_json ?? {};

  return {
    onboardingComplete: row?.onboarding_complete ?? DEFAULT_USER_SETTINGS.onboardingComplete,
    leetcodeUsername: row?.leetcode_username ?? DEFAULT_USER_SETTINGS.leetcodeUsername,
    targetInterviewDate: row?.target_interview_date ?? DEFAULT_USER_SETTINGS.targetInterviewDate,
    settings: mergeSettings(DEFAULT_SETTINGS, settingsJson.settings),
    targetEvents: settingsJson.targetEvents ?? DEFAULT_USER_SETTINGS.targetEvents,
    dayMode: settingsJson.dayMode ?? DEFAULT_USER_SETTINGS.dayMode,
    catchUpPlan: settingsJson.catchUpPlan ?? DEFAULT_USER_SETTINGS.catchUpPlan,
    syntaxProgress: settingsJson.syntaxProgress ?? DEFAULT_USER_SETTINGS.syntaxProgress,
  };
}

function userSettingsToRow(userId: string, data: UserSettingsData) {
  return {
    user_id: userId,
    onboarding_complete: data.onboardingComplete,
    leetcode_username: data.leetcodeUsername,
    target_interview_date: data.targetInterviewDate,
    settings_json: {
      settings: data.settings,
      targetEvents: data.targetEvents,
      dayMode: data.dayMode,
      catchUpPlan: data.catchUpPlan,
      syntaxProgress: data.syntaxProgress,
    },
    updated_at: new Date().toISOString(),
  };
}

function rowToProgressMap(rows: ProblemProgressRow[] | null): Record<string, ProblemProgress> {
  const map: Record<string, ProblemProgress> = {};
  (rows ?? []).forEach((row) => {
    map[row.problem_id] = {
      firstSolvedAt: row.first_solved_at ?? new Date().toISOString(),
      lastReviewedAt: row.last_reviewed_at ?? new Date().toISOString(),
      nextReviewAt: row.next_review_at ?? new Date().toISOString(),
      reviewCount: row.review_count ?? 0,
      history: row.history ?? [],
      retired: row.retired ?? false,
      consecutiveThrees: row.consecutive_threes ?? 0,
      consecutiveSuccesses: row.consecutive_successes ?? 0,
      notes: row.notes ?? undefined,
    };
  });
  return map;
}

function progressToRow(userId: string, problemId: string, progress: ProblemProgress) {
  return {
    user_id: userId,
    problem_id: problemId,
    first_solved_at: progress.firstSolvedAt,
    last_reviewed_at: progress.lastReviewedAt,
    next_review_at: progress.nextReviewAt,
    review_count: progress.reviewCount,
    consecutive_threes: progress.consecutiveThrees,
    consecutive_successes: progress.consecutiveSuccesses ?? 0,
    retired: progress.retired,
    notes: progress.notes ?? null,
    history: progress.history,
    updated_at: new Date().toISOString(),
  };
}

function rowToTiming(row: SessionTimingRow): SessionTiming {
  return {
    id: row.id,
    problemId: row.problem_id,
    category: row.category,
    date: row.recorded_at,
    elapsedSeconds: row.elapsed_seconds,
    sessionType: row.session_type,
    rating: row.rating,
  };
}

function timingToRow(userId: string, timing: SessionTiming) {
  return {
    id: timing.id,
    user_id: userId,
    problem_id: timing.problemId,
    category: timing.category,
    recorded_at: timing.date,
    elapsed_seconds: timing.elapsedSeconds,
    session_type: timing.sessionType,
    rating: timing.rating,
  };
}

function normalizeSprintRow(row: SprintStateRow | null): { sprintState: SprintState | null; sprintHistory: SprintHistoryEntry[] } {
  if (!row?.current_category || !row.sprint_start_date || !row.sprint_length || !row.sprint_status) {
    return { sprintState: null, sprintHistory: row?.sprint_history ?? [] };
  }

  return {
    sprintState: {
      currentCategory: row.current_category,
      sprintStartDate: row.sprint_start_date,
      sprintLength: row.sprint_length,
      sprintStatus: row.sprint_status,
      sprintIndex: row.sprint_index ?? 0,
      extensionDays: row.extension_days ?? 0,
      retroProblemId: row.retro_problem_id ?? null,
      retroAttempted: row.retro_attempted ?? false,
    },
    sprintHistory: row.sprint_history ?? [],
  };
}

function sprintToRow(userId: string, sprintState: SprintState | null, sprintHistory: SprintHistoryEntry[]) {
  return {
    user_id: userId,
    current_category: sprintState?.currentCategory ?? null,
    sprint_start_date: sprintState?.sprintStartDate ?? null,
    sprint_length: sprintState?.sprintLength ?? null,
    sprint_status: sprintState?.sprintStatus ?? null,
    sprint_index: sprintState?.sprintIndex ?? 0,
    extension_days: sprintState?.extensionDays ?? 0,
    retro_problem_id: sprintState?.retroProblemId ?? null,
    retro_attempted: sprintState?.retroAttempted ?? false,
    sprint_history: sprintHistory,
    updated_at: new Date().toISOString(),
  };
}

async function fetchUserSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('onboarding_complete, leetcode_username, target_interview_date, settings_json')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return normalizeUserSettingsRow(data);
}

async function fetchProblemProgress(userId: string) {
  const { data, error } = await supabase
    .from('problem_progress')
    .select('problem_id, first_solved_at, last_reviewed_at, next_review_at, review_count, consecutive_threes, consecutive_successes, retired, notes, history')
    .eq('user_id', userId);

  if (error) throw error;
  return rowToProgressMap((data as ProblemProgressRow[]) ?? []);
}

async function fetchActivityLog(userId: string) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('log_date, solved, reviewed')
    .eq('user_id', userId);

  if (error) throw error;

  const log: ActivityLog = {};
  (data ?? []).forEach((row: { log_date: string; solved: number; reviewed: number }) => {
    log[row.log_date] = { solved: row.solved ?? 0, reviewed: row.reviewed ?? 0 };
  });
  return log;
}

/** Last N days of session timings (default window for aggregates + dashboard). */
const SESSION_TIMINGS_RECENT_DAYS = 90;

async function fetchSessionTimings(userId: string) {
  const since = subDays(startOfDay(new Date()), SESSION_TIMINGS_RECENT_DAYS);
  const { data, error } = await supabase
    .from('session_timings')
    .select('id, problem_id, category, recorded_at, elapsed_seconds, session_type, rating')
    .eq('user_id', userId)
    .gte('recorded_at', since.toISOString())
    .order('recorded_at', { ascending: false });

  if (error) throw error;
  return ((data as SessionTimingRow[]) ?? []).map(rowToTiming);
}

/** Older rows than the default analytics window (for "Load more" in Analytics). */
export async function fetchSessionTimingsBefore(userId: string, beforeIso: string, limit = 500) {
  const { data, error } = await supabase
    .from('session_timings')
    .select('id, problem_id, category, recorded_at, elapsed_seconds, session_type, rating')
    .eq('user_id', userId)
    .lt('recorded_at', beforeIso)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data as SessionTimingRow[]) ?? []).map(rowToTiming);
}

export function getSessionTimingsWindowStartIso() {
  return subDays(startOfDay(new Date()), SESSION_TIMINGS_RECENT_DAYS).toISOString();
}

async function fetchSprintState(userId: string) {
  const { data, error } = await supabase
    .from('sprint_state')
    .select('current_category, sprint_start_date, sprint_length, sprint_status, sprint_index, extension_days, retro_problem_id, retro_attempted, sprint_history')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return normalizeSprintRow(data as SprintStateRow | null);
}

function useUserId() {
  const { user } = useAuth();
  return user?.id ?? null;
}

export function useUserSettings() {
  const userId = useUserId();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: userId ? queryKeys.settings(userId) : ['user-settings', 'anonymous'],
    queryFn: () => fetchUserSettings(userId!),
    enabled: !!userId,
  });

  const applySettingsMutation = useMutation({
    mutationFn: async (updater: (current: UserSettingsData) => UserSettingsData) => {
      if (!userId) throw new Error('No authenticated user');
      const current = queryClient.getQueryData<UserSettingsData>(queryKeys.settings(userId)) ?? DEFAULT_USER_SETTINGS;
      const next = updater(current);

      const { error } = await supabase.from('user_settings').upsert(userSettingsToRow(userId, next));
      if (error) throw error;

      if (current.settings.srAggressiveness !== next.settings.srAggressiveness) {
        const progress = queryClient.getQueryData<Record<string, ProblemProgress>>(queryKeys.progress(userId)) ?? {};
        const updatedRows = Object.entries(progress).flatMap(([problemId, prog]) => {
          const problem = problems.find((item) => item.id === problemId);
          if (!problem || prog.retired || prog.history.length === 0) return [];
          const lastRating = prog.history[prog.history.length - 1].rating;
          const nextReviewAt = getNextReviewDate(
            lastRating,
            prog.consecutiveSuccesses || 0,
            next.settings.srAggressiveness === 'AGGRESSIVE',
            problem.difficulty
          ).toISOString();
          if (nextReviewAt === prog.nextReviewAt) return [];
          return [progressToRow(userId, problemId, { ...prog, nextReviewAt })];
        });

        if (updatedRows.length > 0) {
          const { error: progressError } = await supabase.from('problem_progress').upsert(updatedRows);
          if (progressError) throw progressError;
        }
      }
    },
    onMutate: async (updater) => {
      if (!userId) return {};
      await queryClient.cancelQueries({ queryKey: queryKeys.settings(userId) });
      const previous = queryClient.getQueryData<UserSettingsData>(queryKeys.settings(userId)) ?? DEFAULT_USER_SETTINGS;
      const next = updater(previous);
      queryClient.setQueryData(queryKeys.settings(userId), next);

      if (previous.settings.srAggressiveness !== next.settings.srAggressiveness) {
        const progress = queryClient.getQueryData<Record<string, ProblemProgress>>(queryKeys.progress(userId)) ?? {};
        const optimisticProgress = { ...progress };
        Object.entries(optimisticProgress).forEach(([problemId, prog]) => {
          const problem = problems.find((item) => item.id === problemId);
          if (!problem || prog.retired || prog.history.length === 0) return;
          const lastRating = prog.history[prog.history.length - 1].rating;
          optimisticProgress[problemId] = {
            ...prog,
            nextReviewAt: getNextReviewDate(
              lastRating,
              prog.consecutiveSuccesses || 0,
              next.settings.srAggressiveness === 'AGGRESSIVE',
              problem.difficulty
            ).toISOString(),
          };
        });
        queryClient.setQueryData(queryKeys.progress(userId), optimisticProgress);
      }

      return { previous };
    },
    onError: (_error, _updater, context) => {
      if (!userId || !context?.previous) return;
      queryClient.setQueryData(queryKeys.settings(userId), context.previous);
    },
    onSettled: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.settings(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress(userId) });
    },
  });

  const updateUserSettings = (updater: (current: UserSettingsData) => UserSettingsData) =>
    applySettingsMutation.mutateAsync(updater);

  const data = query.data ?? DEFAULT_USER_SETTINGS;

  return {
    data,
    isLoading: query.isLoading,
    error: query.error,
    settings: data.settings,
    targetEvents: data.targetEvents,
    targetInterviewDate: data.targetInterviewDate,
    leetcodeUsername: data.leetcodeUsername,
    catchUpPlan: data.catchUpPlan,
    dayMode: data.dayMode,
    onboardingComplete: data.onboardingComplete,
    syntaxProgress: data.syntaxProgress,
    lastSync,
    lastSyncCount,
    syncError,
    updateUserData: updateUserSettings,
    updateSettings: (patch: Partial<AppSettings>) =>
      updateUserSettings((current) => ({
        ...current,
        settings: mergeSettings(current.settings, patch),
      })),
    setOnboardingComplete: () =>
      updateUserSettings((current) => ({ ...current, onboardingComplete: true })),
    setTargetInterviewDate: (date: string) =>
      updateUserSettings((current) => ({ ...current, targetInterviewDate: date })),
    addTargetEvent: (event: Omit<TargetEvent, 'id'>) =>
      updateUserSettings((current) => {
        const newEvent = { ...event, id: crypto.randomUUID() };
        const targetEvents = [...current.targetEvents, newEvent].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const today = new Date().toISOString().split('T')[0];
        const nextEvent = targetEvents.find((item) => item.date >= today);
        return {
          ...current,
          targetEvents,
          targetInterviewDate: nextEvent ? nextEvent.date : current.targetInterviewDate,
        };
      }),
    removeTargetEvent: (id: string) =>
      updateUserSettings((current) => {
        const targetEvents = current.targetEvents.filter((item) => item.id !== id);
        const today = new Date().toISOString().split('T')[0];
        const nextEvent = targetEvents.find((item) => item.date >= today);
        return {
          ...current,
          targetEvents,
          targetInterviewDate: nextEvent
            ? nextEvent.date
            : targetEvents.length > 0
              ? targetEvents[targetEvents.length - 1].date
              : current.targetInterviewDate,
        };
      }),
    setDayMode: (mode: UserSettingsData['dayMode']['type']) =>
      updateUserSettings((current) => ({
        ...current,
        dayMode: { type: mode, dateSet: new Date().toISOString() },
      })),
    setCatchUpPlan: (type: UserSettingsData['catchUpPlan']['type'], durationDays: number) =>
      updateUserSettings((current) => ({
        ...current,
        catchUpPlan: { active: true, type, startedAt: new Date().toISOString(), durationDays },
      })),
    dismissCatchUpBanner: () =>
      updateUserSettings((current) => ({
        ...current,
        catchUpPlan: { ...current.catchUpPlan, active: false },
      })),
    setLeetCodeUsername: (username: string) =>
      updateUserSettings((current) => ({ ...current, leetcodeUsername: username })),
    syncLeetCode: async () => {
      if (!userId) throw new Error('No authenticated user');
      const username = (queryClient.getQueryData<UserSettingsData>(queryKeys.settings(userId)) ?? data).leetcodeUsername;
      if (!username) return;

      setSyncError(null);
      try {
        const submissions = await fetchLeetCodeProfile(username);
        const progress = queryClient.getQueryData<Record<string, ProblemProgress>>(queryKeys.progress(userId)) ?? {};
        const next = applyLeetCodeSubmissions(progress, submissions);
        const changedRows = Object.entries(next.progress)
          .filter(([problemId, prog]) => {
            const current = progress[problemId];
            return !current || current.firstSolvedAt !== prog.firstSolvedAt;
          })
          .map(([problemId, prog]) => progressToRow(userId, problemId, prog));

        queryClient.setQueryData(queryKeys.progress(userId), next.progress);
        if (changedRows.length > 0) {
          const { error } = await supabase.from('problem_progress').upsert(changedRows);
          if (error) throw error;
        }

        setLastSync(new Date().toISOString());
        setLastSyncCount(next.pulledCount);
        queryClient.invalidateQueries({ queryKey: queryKeys.progress(userId) });
      } catch (error: any) {
        setSyncError(error?.message || 'Failed to sync with LeetCode');
        throw error;
      }
    },
  };
}

export function useProblemProgress() {
  const userId = useUserId();
  const { data: userSettings = DEFAULT_USER_SETTINGS } = useUserSettings();

  const query = useQuery({
    queryKey: userId ? queryKeys.progress(userId) : ['progress', 'anonymous'],
    queryFn: () => fetchProblemProgress(userId!),
    enabled: !!userId,
  });

  const logProblemMutation = useMutation({
    mutationFn: async (variables: {
      problemId: string;
      rating: 1 | 2 | 3;
      isNew: boolean;
      notes?: string;
      additionalData?: Record<string, unknown>;
    }) => {
      if (!userId) throw new Error('No authenticated user');

      const progress = queryClient.getQueryData<Record<string, ProblemProgress>>(queryKeys.progress(userId)) ?? {};
      const activity = queryClient.getQueryData<ActivityLog>(queryKeys.activity(userId)) ?? {};
      const sessionTimings = queryClient.getQueryData<SessionTiming[]>(queryKeys.timings(userId)) ?? [];
      const sprint = queryClient.getQueryData<{ sprintState: SprintState | null; sprintHistory: SprintHistoryEntry[] }>(
        queryKeys.sprint(userId)
      ) ?? { sprintState: null, sprintHistory: [] };

      const existing = progress[variables.problemId];
      const nextProgressEntry = computeNewProblemProgress(
        existing,
        variables.problemId,
        variables.rating,
        variables.isNew,
        variables.notes,
        variables.additionalData,
        userSettings.settings.srAggressiveness
      );

      const dateKey = format(startOfDay(new Date()), 'yyyy-MM-dd');
      const nextActivityEntry = computeUpdatedActivityEntry(activity[dateKey], variables.isNew);

      const { error: progressError } = await supabase
        .from('problem_progress')
        .upsert(progressToRow(userId, variables.problemId, nextProgressEntry));
      if (progressError) throw progressError;

      const { error: activityError } = await supabase.from('activity_log').upsert({
        user_id: userId,
        log_date: dateKey,
        solved: nextActivityEntry.solved,
        reviewed: nextActivityEntry.reviewed,
      });
      if (activityError) throw activityError;

      if (
        sprint.sprintState?.sprintStatus === 'retrospective' &&
        sprint.sprintState.retroProblemId === variables.problemId
      ) {
        const aggregates = calculateSessionAggregates(sessionTimings);
        const nextSprint = advanceSprintState(
          sprint.sprintState,
          sprint.sprintHistory,
          { ...progress, [variables.problemId]: nextProgressEntry },
          userSettings.settings,
          aggregates.categoryAvgSolveTimes
        );

        const { error: sprintError } = await supabase
          .from('sprint_state')
          .upsert(sprintToRow(userId, nextSprint.sprintState, nextSprint.sprintHistory));
        if (sprintError) throw sprintError;
      }
    },
    onMutate: async (variables) => {
      if (!userId) return {};
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.progress(userId) }),
        queryClient.cancelQueries({ queryKey: queryKeys.activity(userId) }),
        queryClient.cancelQueries({ queryKey: queryKeys.sprint(userId) }),
      ]);

      const previousProgress = queryClient.getQueryData<Record<string, ProblemProgress>>(queryKeys.progress(userId)) ?? {};
      const previousActivity = queryClient.getQueryData<ActivityLog>(queryKeys.activity(userId)) ?? {};
      const previousSprint =
        queryClient.getQueryData<{ sprintState: SprintState | null; sprintHistory: SprintHistoryEntry[] }>(
          queryKeys.sprint(userId)
        ) ?? { sprintState: null, sprintHistory: [] };
      const sessionTimings = queryClient.getQueryData<SessionTiming[]>(queryKeys.timings(userId)) ?? [];

      const nextProgressEntry = computeNewProblemProgress(
        previousProgress[variables.problemId],
        variables.problemId,
        variables.rating,
        variables.isNew,
        variables.notes,
        variables.additionalData,
        userSettings.settings.srAggressiveness
      );

      const nextProgress = { ...previousProgress, [variables.problemId]: nextProgressEntry };
      const dateKey = format(startOfDay(new Date()), 'yyyy-MM-dd');
      const nextActivity = {
        ...previousActivity,
        [dateKey]: computeUpdatedActivityEntry(previousActivity[dateKey], variables.isNew),
      };

      queryClient.setQueryData(queryKeys.progress(userId), nextProgress);
      queryClient.setQueryData(queryKeys.activity(userId), nextActivity);

      if (
        previousSprint.sprintState?.sprintStatus === 'retrospective' &&
        previousSprint.sprintState.retroProblemId === variables.problemId
      ) {
        const aggregates = calculateSessionAggregates(sessionTimings);
        queryClient.setQueryData(
          queryKeys.sprint(userId),
          advanceSprintState(
            previousSprint.sprintState,
            previousSprint.sprintHistory,
            nextProgress,
            userSettings.settings,
            aggregates.categoryAvgSolveTimes
          )
        );
      }

      return { previousProgress, previousActivity, previousSprint };
    },
    onError: (_error, _variables, context) => {
      if (!userId || !context) return;
      queryClient.setQueryData(queryKeys.progress(userId), context.previousProgress);
      queryClient.setQueryData(queryKeys.activity(userId), context.previousActivity);
      queryClient.setQueryData(queryKeys.sprint(userId), context.previousSprint);
    },
    onSettled: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.progress(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sprint(userId) });
    },
  });

  const removeProblemMutation = useMutation({
    mutationFn: async (problemId: string) => {
      if (!userId) throw new Error('No authenticated user');
      const { error } = await supabase
        .from('problem_progress')
        .delete()
        .eq('user_id', userId)
        .eq('problem_id', problemId);
      if (error) throw error;
    },
    onMutate: async (problemId) => {
      if (!userId) return {};
      await queryClient.cancelQueries({ queryKey: queryKeys.progress(userId) });
      const previous = queryClient.getQueryData<Record<string, ProblemProgress>>(queryKeys.progress(userId)) ?? {};
      const next = { ...previous };
      delete next[problemId];
      queryClient.setQueryData(queryKeys.progress(userId), next);
      return { previous };
    },
    onError: (_error, _problemId, context) => {
      if (!userId || !context?.previous) return;
      queryClient.setQueryData(queryKeys.progress(userId), context.previous);
    },
    onSettled: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.progress(userId) });
    },
  });

  const logMockInterviewMutation = useMutation({
    mutationFn: async (variables: {
      problemId: string;
      evalSolved: boolean;
      evalSyntax: boolean;
      evalComplexity: boolean;
      approachSimilarity: number;
      rawCode: string;
      optimalSolution: string;
      usedInAppEditor: boolean;
      actualSecondsUsed?: number;
      timeLimitSeconds?: number;
    }) => {
      if (!userId) throw new Error('No authenticated user');
      let rating: 1 | 2 | 3 = 2;
      if (!variables.evalSolved || !variables.evalSyntax || variables.approachSimilarity === 1) {
        rating = 1;
      } else if (
        variables.evalSolved &&
        variables.evalSyntax &&
        variables.evalComplexity &&
        variables.approachSimilarity === 3
      ) {
        rating = 3;
      }

      const problem = problems.find((item) => item.id === variables.problemId);
      if (variables.actualSecondsUsed !== undefined && problem) {
        const timing: SessionTiming = {
          id: crypto.randomUUID(),
          problemId: variables.problemId,
          category: problem.category,
          date: new Date().toISOString(),
          elapsedSeconds: variables.actualSecondsUsed,
          sessionType: 'mock',
          rating,
        };

        const { error: timingError } = await supabase.from('session_timings').insert(timingToRow(userId, timing));
        if (timingError) throw timingError;
      }

      await logProblemMutation.mutateAsync({
        problemId: variables.problemId,
        rating,
        isNew: false,
        notes: 'Mock Interview',
        additionalData: {
          rawCode: variables.rawCode,
          optimalSolution: variables.optimalSolution,
          approachSimilarity: variables.approachSimilarity,
          usedInAppEditor: variables.usedInAppEditor,
          sessionType: 'mock',
          elapsedSeconds: variables.actualSecondsUsed,
          mockTimeLimitSeconds: variables.timeLimitSeconds ?? 25 * 60,
          mockActualSecondsUsed: variables.actualSecondsUsed,
        },
      });
    },
  });

  const progress = query.data ?? {};
  const momentum = useMemo(() => deriveMomentumState(progress), [progress]);

  return {
    data: progress,
    progress,
    isLoading: query.isLoading,
    error: query.error,
    ...momentum,
    logProblem: (
      problemId: string,
      rating: 1 | 2 | 3,
      isNew: boolean,
      notes?: string,
      additionalData?: Record<string, unknown>
    ) => logProblemMutation.mutateAsync({ problemId, rating, isNew, notes, additionalData }),
    removeProblem: (problemId: string) => removeProblemMutation.mutateAsync(problemId),
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
    ) =>
      logMockInterviewMutation.mutateAsync({
        problemId,
        evalSolved,
        evalSyntax,
        evalComplexity,
        approachSimilarity,
        rawCode,
        optimalSolution,
        usedInAppEditor,
        actualSecondsUsed,
        timeLimitSeconds,
      }),
  };
}

export function useActivityLog() {
  const userId = useUserId();
  const query = useQuery({
    queryKey: userId ? queryKeys.activity(userId) : ['activity-log', 'anonymous'],
    queryFn: () => fetchActivityLog(userId!),
    enabled: !!userId,
  });

  return {
    data: query.data ?? {},
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useSessionTimings() {
  const userId = useUserId();
  const query = useQuery({
    queryKey: userId ? queryKeys.timings(userId) : ['session-timings', 'anonymous'],
    queryFn: () => fetchSessionTimings(userId!),
    enabled: !!userId,
  });

  const recordSessionMutation = useMutation({
    mutationFn: async (timing: SessionTiming) => {
      if (!userId) throw new Error('No authenticated user');
      const { error } = await supabase.from('session_timings').insert(timingToRow(userId, timing));
      if (error) throw error;
    },
    onMutate: async (timing) => {
      if (!userId) return {};
      await queryClient.cancelQueries({ queryKey: queryKeys.timings(userId) });
      const previous = queryClient.getQueryData<SessionTiming[]>(queryKeys.timings(userId)) ?? [];
      queryClient.setQueryData(queryKeys.timings(userId), [timing, ...previous]);
      return { previous };
    },
    onError: (_error, _timing, context) => {
      if (!userId || !context?.previous) return;
      queryClient.setQueryData(queryKeys.timings(userId), context.previous);
    },
    onSettled: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.timings(userId) });
    },
  });

  const timings = query.data ?? [];
  const aggregates = useMemo(() => calculateSessionAggregates(timings), [timings]);

  return {
    data: timings,
    sessionTimings: timings,
    isLoading: query.isLoading,
    error: query.error,
    ...aggregates,
    recordSession: (timing: SessionTiming) => recordSessionMutation.mutateAsync(timing),
  };
}

export function useSprintState() {
  const userId = useUserId();
  const { data: settingsData = DEFAULT_USER_SETTINGS } = useUserSettings();
  const { progress } = useProblemProgress();
  const { categoryAvgSolveTimes } = useSessionTimings();

  const query = useQuery({
    queryKey: userId ? queryKeys.sprint(userId) : ['sprint-state', 'anonymous'],
    queryFn: () => fetchSprintState(userId!),
    enabled: !!userId,
  });

  const upsertSprintMutation = useMutation({
    mutationFn: async (next: { sprintState: SprintState | null; sprintHistory: SprintHistoryEntry[] }) => {
      if (!userId) throw new Error('No authenticated user');
      const { error } = await supabase.from('sprint_state').upsert(
        sprintToRow(userId, next.sprintState, next.sprintHistory)
      );
      if (error) throw error;
    },
    onMutate: async (next) => {
      if (!userId) return {};
      await queryClient.cancelQueries({ queryKey: queryKeys.sprint(userId) });
      const previous =
        queryClient.getQueryData<{ sprintState: SprintState | null; sprintHistory: SprintHistoryEntry[] }>(
          queryKeys.sprint(userId)
        ) ?? { sprintState: null, sprintHistory: [] };
      queryClient.setQueryData(queryKeys.sprint(userId), next);
      return { previous };
    },
    onError: (_error, _next, context) => {
      if (!userId || !context?.previous) return;
      queryClient.setQueryData(queryKeys.sprint(userId), context.previous);
    },
    onSettled: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.sprint(userId) });
    },
  });

  const sprintData = query.data ?? { sprintState: null, sprintHistory: [] };

  useEffect(() => {
    if (!userId) return;
    if (query.isLoading) return;
    if (sprintData.sprintState) return;
    if (settingsData.settings.learningMode !== 'SPRINT') return;

    upsertSprintMutation.mutate({
      sprintState: createInitialSprintState(progress, settingsData.settings),
      sprintHistory: sprintData.sprintHistory,
    });
  }, [userId, query.isLoading, sprintData.sprintState, sprintData.sprintHistory, progress, settingsData.settings, upsertSprintMutation]);

  return {
    data: sprintData,
    sprintState: sprintData.sprintState,
    sprintHistory: sprintData.sprintHistory,
    isLoading: query.isLoading,
    error: query.error,
    updateSprintState: (patch: Partial<SprintState>) =>
      upsertSprintMutation.mutateAsync({
        sprintState: sprintData.sprintState ? { ...sprintData.sprintState, ...patch } : null,
        sprintHistory: sprintData.sprintHistory,
      }),
    initializeSprint: () =>
      upsertSprintMutation.mutateAsync({
        sprintState: createInitialSprintState(progress, settingsData.settings),
        sprintHistory: sprintData.sprintHistory,
      }),
    setSprintCategory: (category: string) =>
      upsertSprintMutation.mutateAsync({
        sprintState: setSprintCategoryState(category, progress, settingsData.settings),
        sprintHistory: sprintData.sprintHistory,
      }),
    recordSprintRetro: (_passed: boolean, _rating: 1 | 2 | 3) =>
      upsertSprintMutation.mutateAsync(
        sprintData.sprintState
          ? advanceSprintState(
              sprintData.sprintState,
              sprintData.sprintHistory,
              progress,
              settingsData.settings,
              categoryAvgSolveTimes
            )
          : {
              sprintState: createInitialSprintState(progress, settingsData.settings),
              sprintHistory: sprintData.sprintHistory,
            }
      ),
  };
}

export function useSyntaxProgress() {
  const userId = useUserId();
  const { data, isLoading, error, updateUserData } = useUserSettings();

  return {
    data: data.syntaxProgress,
    syntaxProgress: data.syntaxProgress,
    isLoading,
    error,
    logSyntaxPractice: async (cardId: string, rating: 1 | 2 | 3) => {
      const existing = data.syntaxProgress[cardId];
      const nextEntry = computeNewSyntaxProgress(existing, rating, data.settings.srAggressiveness);
      await updateUserData((current) => ({
        ...current,
        syntaxProgress: {
          ...current.syntaxProgress,
          [cardId]: nextEntry,
        },
      }));

      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.settings(userId) });
      }
    },
  };
}

export function useStreak() {
  const { data: activityLog, isLoading, error } = useActivityLog();
  const derived = useMemo(() => calculateStreakFromActivityLog(activityLog), [activityLog]);

  return {
    data: derived.streak,
    streak: derived.streak,
    graceDay: derived.graceDay,
    isLoading,
    error,
  };
}

export { buildDailyPlan, computeSprintLength, SPRINT_DESCRIPTIONS };
