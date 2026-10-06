import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/react';
import { queryClient } from '../lib/queryClient';
import { userDataQueryKeys as queryKeys } from '../lib/userDataQueryKeys';
import { fetchLeetCodeProfile } from '../services/leetcode';
import { ensureExtendedCatalogLoaded } from '../data/problems';
import { safeUUID } from '../utils/uuid';
import { observeMutation } from '../lib/operationFeedback';
import { applySettingsPatch } from '../utils/settingsPatch';
import {
  DEFAULT_USER_SETTINGS, type ActivityLog, type AppSettings, type ProblemProgress,
  type ProblemSessionRating, type SessionTiming, type SprintState, type UserSettingsData, type TargetEvent,
} from '../types';
import { advanceSprintState, buildDailyPlan, calculateSessionAggregates, calculateStreakFromActivityLog,
  computeNewSyntaxProgress, computeSprintLength, createInitialSprintState, deriveMomentumState,
  setSprintCategoryState, SPRINT_DESCRIPTIONS } from '../utils/progressHelpers';
import { fetchUserSettings, fetchProblemProgress, fetchActivityLog, fetchSessionTimings, fetchSprintState,
  saveUserSettings, saveProblemSession, saveSprint, importSubmissions, removeProblemProgress,
  restoreUserBackup, exportBackup, type SaveProblemInput, type SprintData } from '../services/userData';

export { userDataQueryKeys } from '../lib/userDataQueryKeys';
export { fetchSessionTimingsBefore, getSessionTimingsWindowStartIso } from '../services/userData';
export { buildDailyPlan, computeSprintLength, SPRINT_DESCRIPTIONS };

function useUserId() {
  return useUser().user?.id ?? null;
}
async function refreshUserData(userId: string) {
  await Promise.all(Object.values(queryKeys).map((key) => queryClient.invalidateQueries({ queryKey: key(userId) })));
}

export function useUserSettings() {
  const userId = useUserId();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: userId ? queryKeys.settings(userId) : ['user-settings', 'anonymous'],
    queryFn: () => fetchUserSettings(userId!), enabled: !!userId,
  });
  const mutation = useMutation({
    mutationFn: (updater: (current: UserSettingsData) => UserSettingsData) => {
      if (!userId) throw new Error('No authenticated user');
      return saveUserSettings(userId, updater);
    },
    onSettled: () => userId ? refreshUserData(userId) : undefined,
  });
  const updateUserSettings = (updater: (current: UserSettingsData) => UserSettingsData) => observeMutation(mutation.mutateAsync(updater));
  const data = query.data ?? DEFAULT_USER_SETTINGS;
  return {
    data, isLoading: query.isLoading, isSuccess: query.isSuccess, error: query.error, refetch: query.refetch,
    ...data, lastSync, lastSyncCount, syncError,
    updateUserData: updateUserSettings,
    updateSettings: (patch: Partial<AppSettings>) => updateUserSettings((current) => ({
      ...current, settings: applySettingsPatch(data.settings, current.settings, patch),
    })),
    setOnboardingComplete: () =>
      updateUserSettings((current) => ({ ...current, onboardingComplete: true })),
    setTargetInterviewDate: (date: string) =>
      updateUserSettings((current) => ({ ...current, targetInterviewDate: date })),
    addTargetEvent: (event: Omit<TargetEvent, 'id'>) =>
      updateUserSettings((current) => {
        const newEvent = { ...event, id: safeUUID() };
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
        catchUpPlan: {
          active: true,
          type,
          startedAt: new Date().toISOString(),
          durationDays,
          bannerDismissed: false,
        },
      })),
    dismissCatchUpBanner: () =>
      updateUserSettings((current) => ({
        ...current,
        catchUpPlan: { ...current.catchUpPlan, bannerDismissed: true },
      })),
    setLeetCodeUsername: (username: string) =>
      updateUserSettings((current) => ({ ...current, leetcodeUsername: username.trim().replace(/^@/, '') })),
    syncLeetCode: async (usernameOverride?: string) => {
      if (!userId) throw new Error('No authenticated user');
      setSyncError(null);
      try {
        const settings = await fetchUserSettings(userId);
        const username = (usernameOverride ?? settings.leetcodeUsername ?? '').trim().replace(/^@/, '');
        if (!username) throw new Error('Enter a LeetCode username first');
        await ensureExtendedCatalogLoaded();
        const result = await importSubmissions(userId, await fetchLeetCodeProfile(username));
        setLastSync(new Date().toISOString());
        setLastSyncCount(result.imported);
        await refreshUserData(userId);
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : 'Failed to sync with LeetCode');
        throw error;
      }
    },
    exportBackup,
    restoreBackup: async (backup: unknown) => {
      if (!userId) throw new Error('No authenticated user');
      try { await restoreUserBackup(userId, backup); }
      finally { await refreshUserData(userId); }
    },
  };
}

export function useProblemProgress() {
  const userId = useUserId();
  const query = useQuery({
    queryKey: userId ? queryKeys.progress(userId) : ['progress', 'anonymous'],
    queryFn: () => fetchProblemProgress(userId!), enabled: !!userId,
  });
  const mutation = useMutation({
    mutationFn: (input: SaveProblemInput) => {
      if (!userId) throw new Error('No authenticated user');
      return saveProblemSession(userId, input);
    },
    onSettled: () => userId ? refreshUserData(userId) : undefined,
  });
  const removeMutation = useMutation({
    mutationFn: (problemId: string) => {
      if (!userId) throw new Error('No authenticated user');
      return removeProblemProgress(userId, problemId);
    },
    onSettled: () => userId ? refreshUserData(userId) : undefined,
  });
  const progress = query.data ?? {};
  const momentum = useMemo(() => deriveMomentumState(progress), [progress]);
  return {
    data: progress, progress, isLoading: query.isLoading, isSuccess: query.isSuccess,
    error: query.error, refetch: query.refetch, ...momentum,
    saveSession: (input: SaveProblemInput) => observeMutation(mutation.mutateAsync(input)),
    logProblem: (problemId: string, rating: ProblemSessionRating, _isNew: boolean, notes?: string,
      additionalData?: Record<string, unknown>) => observeMutation(mutation.mutateAsync({
        operationId: safeUUID(), problemId, rating, notes, additionalData,
      })),
    removeProblem: (problemId: string) => observeMutation(removeMutation.mutateAsync(problemId)),
  };
}

export function useActivityLog() {
  const userId = useUserId();
  const query = useQuery({
    queryKey: userId ? queryKeys.activity(userId) : ['activity-log', 'anonymous'],
    queryFn: () => fetchActivityLog(userId!), enabled: !!userId,
  });
  return { data: query.data ?? {}, isLoading: query.isLoading, error: query.error };
}

export function useSessionTimings() {
  const userId = useUserId();
  const query = useQuery({
    queryKey: userId ? queryKeys.timings(userId) : ['session-timings', 'anonymous'],
    queryFn: () => fetchSessionTimings(userId!), enabled: !!userId,
  });
  const timings = query.data ?? [];
  const aggregates = useMemo(() => calculateSessionAggregates(timings), [timings]);
  return {
    data: timings, sessionTimings: timings, isLoading: query.isLoading, error: query.error, ...aggregates,
  };
}

export function useSprintState() {
  const userId = useUserId();
  const settingsQuery = useUserSettings();
  const progressQuery = useProblemProgress();
  const query = useQuery({
    queryKey: userId ? queryKeys.sprint(userId) : ['sprint-state', 'anonymous'],
    queryFn: () => fetchSprintState(userId!), enabled: !!userId,
  });
  type SprintUpdater = Parameters<typeof saveSprint>[1];
  const mutation = useMutation({
    mutationFn: (updater: SprintUpdater) => {
      if (!userId) throw new Error('No authenticated user');
      return saveSprint(userId, updater);
    },
    onSettled: () => userId ? refreshUserData(userId) : undefined,
  });
  const update = (updater: SprintUpdater) => observeMutation(mutation.mutateAsync(updater));
  const sprintData: SprintData = query.data ?? { sprintState: null, sprintHistory: [], version: 0 };
  const initialize: SprintUpdater = (current, settings, progress) => current.sprintState ? null : {
    sprintState: createInitialSprintState(progress, settings.settings), sprintHistory: current.sprintHistory,
  };
  useEffect(() => {
    if (!userId || !query.isSuccess || !settingsQuery.isSuccess || !progressQuery.isSuccess) return;
    if (mutation.isPending || mutation.isError || sprintData.sprintState) return;
    if (settingsQuery.settings.learningMode !== 'CURRICULUM') return;
    mutation.mutate(initialize);
  }, [userId, query.isSuccess, settingsQuery.isSuccess, progressQuery.isSuccess,
    settingsQuery.settings.learningMode, sprintData.sprintState, mutation.isPending, mutation.isError]);
  return {
    data: sprintData, ...sprintData, isLoading: query.isLoading, error: query.error,
    updateSprintState: (patch: Partial<SprintState> | ((state: SprintState) => Partial<SprintState>)) => update((current) => {
      if (!current.sprintState) throw new Error('Load your sprint before changing it');
      return { ...current, sprintState: { ...current.sprintState, ...(typeof patch === 'function' ? patch(current.sprintState) : patch) } };
    }),
    initializeSprint: () => update(initialize),
    setSprintCategory: (category: string) => update((current, settings, progress) => ({
      sprintState: setSprintCategoryState(category, progress, settings.settings), sprintHistory: current.sprintHistory,
    })),
    recordSprintRetro: (_passed: boolean, _rating: ProblemSessionRating) => update((current, settings, progress, timings) =>
      current.sprintState ? advanceSprintState(current.sprintState, current.sprintHistory, progress,
        settings.settings, calculateSessionAggregates(timings).categoryAvgSolveTimes) : initialize(current, settings, progress, timings)),
  };
}

export function useSyntaxProgress() {
  const { data, isLoading, error, updateUserData } = useUserSettings();
  return {
    data: data.syntaxProgress, syntaxProgress: data.syntaxProgress, isLoading, error,
    logSyntaxPractice: (cardId: string, rating: 1 | 2 | 3) => updateUserData((current) => ({
      ...current, syntaxProgress: { ...current.syntaxProgress, [cardId]: computeNewSyntaxProgress(
        current.syntaxProgress[cardId], rating, current.settings.srAggressiveness) },
    })),
  };
}
export function useStreak() {
  const { data: activityLog, isLoading, error } = useActivityLog();
  const derived = useMemo(() => calculateStreakFromActivityLog(activityLog), [activityLog]);
  return { data: derived.streak, ...derived, isLoading, error };
}
