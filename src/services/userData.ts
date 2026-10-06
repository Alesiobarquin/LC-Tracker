import { format, startOfDay, subDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import {
  DEFAULT_SETTINGS, DEFAULT_USER_SETTINGS,
  type ActivityLog, type AppSettings, type ProblemProgress, type ProblemSessionRating,
  type SessionTiming, type SprintHistoryEntry, type SprintState, type SyntaxProgress,
  type TargetEvent, type UserSettingsData,
} from '../types';
import { advanceSprintState, applyLeetCodeSubmissions, calculateSessionAggregates,
  computeNewProblemProgress } from '../utils/progressHelpers';
import { getNextReviewDate } from '../utils/dateUtils';
import { problemMap } from '../data/problems';
import { safeUUID } from '../utils/uuid';
import { fetchAllPages } from '../lib/pagination';
import { validateBackup, type UserBackup } from '../utils/backup';

type StoredSettingsJson = {
  settings?: Partial<AppSettings>;
  ratingHistoryMigrationVersion?: number;
  targetEvents?: TargetEvent[];
  dayMode?: UserSettingsData['dayMode'];
  catchUpPlan?: UserSettingsData['catchUpPlan'];
  syntaxProgress?: Record<string, SyntaxProgress>;
};

type ProblemProgressRow = {
  version: number;
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
  rating: ProblemSessionRating;
};

type SprintStateRow = {
  version: number;
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

export function mergeSettings(defaults: AppSettings, partial?: Partial<AppSettings> | null): AppSettings {
  const patch = partial && typeof partial === 'object' ? partial : {};
  const studyPatch: Partial<AppSettings['studySchedule']> =
    patch.studySchedule && typeof patch.studySchedule === 'object' ? patch.studySchedule : {};
  const sprintPatch: Partial<AppSettings['sprintSettings']> =
    patch.sprintSettings && typeof patch.sprintSettings === 'object' ? patch.sprintSettings : {};
  const skillLevels =
    patch.skillLevels && typeof patch.skillLevels === 'object' && !Array.isArray(patch.skillLevels)
      ? patch.skillLevels
      : {};

  return {
    ...defaults,
    ...patch,
    // Nested objects must never be null — a null overwrite from settings_json crashes Dashboard.
    skillLevels: { ...defaults.skillLevels, ...skillLevels },
    studySchedule: {
      ...defaults.studySchedule,
      ...studyPatch,
      blackoutDates: Array.isArray(studyPatch.blackoutDates)
        ? studyPatch.blackoutDates
        : defaults.studySchedule.blackoutDates,
    },
    sprintSettings: {
      lengthMultiplier: sprintPatch.lengthMultiplier ?? defaults.sprintSettings.lengthMultiplier,
      targetDays: sprintPatch.targetDays ?? defaults.sprintSettings.targetDays,
      alignPoolToTargetCurriculum:
        sprintPatch.alignPoolToTargetCurriculum ?? defaults.sprintSettings.alignPoolToTargetCurriculum,
    },
  };
}

export function normalizeUserSettingsRow(row: {
  onboarding_complete?: boolean | null;
  leetcode_username?: string | null;
  target_interview_date?: string | null;
  settings_json?: StoredSettingsJson | null;
  version?: number;
} | null): UserSettingsData {
  const settingsJson = row?.settings_json ?? {};

  return {
    version: row?.version ?? 0,
    onboardingComplete: row?.onboarding_complete ?? DEFAULT_USER_SETTINGS.onboardingComplete,
    leetcodeUsername: row?.leetcode_username ?? DEFAULT_USER_SETTINGS.leetcodeUsername,
    targetInterviewDate: row?.target_interview_date ?? DEFAULT_USER_SETTINGS.targetInterviewDate,
    settings: mergeSettings(DEFAULT_SETTINGS, settingsJson.settings),
    ratingHistoryMigrationVersion:
      settingsJson.ratingHistoryMigrationVersion ?? DEFAULT_USER_SETTINGS.ratingHistoryMigrationVersion,
    targetEvents: Array.isArray(settingsJson.targetEvents)
      ? settingsJson.targetEvents
      : DEFAULT_USER_SETTINGS.targetEvents,
    dayMode:
      settingsJson.dayMode && typeof settingsJson.dayMode === 'object'
        ? settingsJson.dayMode
        : DEFAULT_USER_SETTINGS.dayMode,
    catchUpPlan:
      settingsJson.catchUpPlan && typeof settingsJson.catchUpPlan === 'object'
        ? settingsJson.catchUpPlan
        : DEFAULT_USER_SETTINGS.catchUpPlan,
    syntaxProgress:
      settingsJson.syntaxProgress && typeof settingsJson.syntaxProgress === 'object'
        ? settingsJson.syntaxProgress
        : DEFAULT_USER_SETTINGS.syntaxProgress,
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
      ratingHistoryMigrationVersion: data.ratingHistoryMigrationVersion,
      targetEvents: data.targetEvents,
      dayMode: data.dayMode,
      catchUpPlan: data.catchUpPlan,
      syntaxProgress: data.syntaxProgress,
    },
    updated_at: new Date().toISOString(),
  };
}

export function rowToProgressMap(rows: ProblemProgressRow[] | null): Record<string, ProblemProgress> {
  const map: Record<string, ProblemProgress> = {};
  (rows ?? []).forEach((row) => {
    map[row.problem_id] = {
      version: row.version,
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

export function rowToTiming(row: SessionTimingRow): SessionTiming {
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

export function normalizeSprintRow(row: SprintStateRow | null): { sprintState: SprintState | null; sprintHistory: SprintHistoryEntry[]; version: number } {
  if (!row?.current_category || !row.sprint_start_date || !row.sprint_length || !row.sprint_status) {
    return { sprintState: null, sprintHistory: row?.sprint_history ?? [], version: row?.version ?? 0 };
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
    version: row.version,
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

export async function fetchUserSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('version, onboarding_complete, leetcode_username, target_interview_date, settings_json')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return normalizeUserSettingsRow(data);
}

export async function fetchProblemProgress(userId: string) {
  const data = await fetchAllPages<ProblemProgressRow>((from, to) => supabase
    .from('problem_progress')
    .select('version, problem_id, first_solved_at, last_reviewed_at, next_review_at, review_count, consecutive_threes, consecutive_successes, retired, notes, history')
    .eq('user_id', userId).order('problem_id').range(from, to));
  return rowToProgressMap(data);
}

export async function fetchActivityLog(userId: string) {
  const data = await fetchAllPages<{ log_date: string; solved: number; reviewed: number }>((from, to) => supabase
    .from('activity_log').select('log_date, solved, reviewed')
    .eq('user_id', userId).order('log_date').range(from, to));

  const log: ActivityLog = {};
  (data ?? []).forEach((row: { log_date: string; solved: number; reviewed: number }) => {
    log[row.log_date] = { solved: row.solved ?? 0, reviewed: row.reviewed ?? 0 };
  });
  return log;
}

/** Last N days of session timings (default window for aggregates + dashboard). */
const SESSION_TIMINGS_RECENT_DAYS = 90;

export async function fetchSessionTimings(userId: string) {
  const since = subDays(startOfDay(new Date()), SESSION_TIMINGS_RECENT_DAYS);
  const data = await fetchAllPages<SessionTimingRow>((from, to) => supabase
    .from('session_timings').select('id, problem_id, category, recorded_at, elapsed_seconds, session_type, rating')
    .eq('user_id', userId).gte('recorded_at', since.toISOString())
    .order('recorded_at', { ascending: false }).order('id', { ascending: false }).range(from, to));
  return data.map(rowToTiming);
}

/** Older rows than the default analytics window (for "Load more" in Analytics). */
export type TimingCursor = { date: string; id?: string };
export async function fetchSessionTimingsBefore(userId: string, cursor: TimingCursor, limit = 500) {
  if (!Number.isFinite(Date.parse(cursor.date)) || (cursor.id && !/^[0-9a-f-]{36}$/i.test(cursor.id))) {
    throw new Error('Invalid session history cursor');
  }
  const date = new Date(cursor.date).toISOString();
  let query = supabase.from('session_timings')
    .select('id, problem_id, category, recorded_at, elapsed_seconds, session_type, rating')
    .eq('user_id', userId);
  // Secondary ID ordering retains rows sharing a timestamp across page boundaries.
  query = cursor.id
    ? query.or(`recorded_at.lt.${date},and(recorded_at.eq.${date},id.lt.${cursor.id})`)
    : query.lt('recorded_at', date);
  const { data, error } = await query.order('recorded_at', { ascending: false })
    .order('id', { ascending: false }).limit(limit);
  if (error) throw error;
  return ((data as SessionTimingRow[]) ?? []).map(rowToTiming);
}

export function getSessionTimingsWindowStartIso() {
  return subDays(startOfDay(new Date()), SESSION_TIMINGS_RECENT_DAYS).toISOString();
}

export async function fetchSprintState(userId: string) {
  const { data, error } = await supabase
    .from('sprint_state')
    .select('version, current_category, sprint_start_date, sprint_length, sprint_status, sprint_index, extension_days, retro_problem_id, retro_attempted, sprint_history')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return normalizeSprintRow(data as SprintStateRow | null);
}


export type SprintData = ReturnType<typeof normalizeSprintRow>;

type ExpectedVersions = { settings?: number; sprint?: number; progress?: Record<string, number> };
async function commit(operationId: string, kind: string, expected: ExpectedVersions, payload: Record<string, unknown>, userId: string) {
  const { data, error } = await supabase.rpc('commit_user_change', {
    p_operation_id: operationId, p_kind: kind, p_expected: expected, p_payload: { ...payload, clientUserId: userId },
  });
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42703') {
      throw new Error('The database needs the reliability migration before saving. Please contact the site owner.');
    }
    throw error;
  }
  return data as { duplicate: boolean; imported: number };
}

/** Retry application revision conflicts with fresh inputs, never an ambiguous network error. */
export async function retryConflict<T>(action: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await action(); }
    catch (error) {
      if ((error as { code?: string })?.code !== 'PT409' || attempt >= 2) throw error;
    }
  }
}

export interface SaveProblemInput {
  operationId: string;
  problemId: string;
  rating: ProblemSessionRating;
  notes?: string;
  additionalData?: Record<string, unknown>;
  timing?: SessionTiming;
}

export async function saveProblemSession(userId: string, input: SaveProblemInput) {
  return retryConflict(async () => {
    const [settings, progress, sprint, timings] = await Promise.all([
      fetchUserSettings(userId), fetchProblemProgress(userId), fetchSprintState(userId), fetchSessionTimings(userId),
    ]);
    const existing = progress[input.problemId];
    // Classify against confirmed data, not the UI's potentially stale isNew flag.
    const isNew = !existing;
    const next = computeNewProblemProgress(existing, input.problemId, input.rating, isNew,
      input.notes, input.additionalData, settings.settings.srAggressiveness);
    const payload: Record<string, unknown> = {
      problemId: input.problemId, progress: [progressToRow(userId, input.problemId, next)],
      logDate: format(new Date(input.timing?.date ?? Date.now()), 'yyyy-MM-dd'), isNew,
      timings: input.timing ? [timingToRow(userId, input.timing)] : [],
    };
    if (sprint.sprintState?.sprintStatus === 'retrospective' && sprint.sprintState.retroProblemId === input.problemId) {
      const nextSprint = input.rating >= 3
        ? advanceSprintState(sprint.sprintState, sprint.sprintHistory, { ...progress, [input.problemId]: next },
          settings.settings, calculateSessionAggregates(input.timing ? [input.timing, ...timings] : timings).categoryAvgSolveTimes)
        : { ...sprint, sprintState: { ...sprint.sprintState, extensionDays: sprint.sprintState.extensionDays + 2, retroAttempted: true } };
      payload.sprint = sprintToRow(userId, nextSprint.sprintState, nextSprint.sprintHistory);
    }
    return commit(input.operationId, 'session', {
      settings: settings.version, sprint: sprint.version,
      progress: { [input.problemId]: existing?.version ?? 0 },
    }, payload, userId);
  });
}

export async function saveUserSettings(userId: string, updater: (current: UserSettingsData) => UserSettingsData) {
  const operationId = safeUUID();
  return retryConflict(async () => {
    const current = await fetchUserSettings(userId);
    const next = updater(current);
    const expected: ExpectedVersions = { settings: current.version };
    const reviewDates: Array<{ problemId: string; nextReviewAt: string }> = [];
    if (current.settings.srAggressiveness !== next.settings.srAggressiveness) {
      const progress = await fetchProblemProgress(userId);
      expected.progress = {};
      for (const [problemId, prog] of Object.entries(progress)) {
        const problem = problemMap[problemId];
        if (!problem || prog.retired || !prog.history.length) continue;
        expected.progress[problemId] = prog.version ?? 0;
        reviewDates.push({ problemId, nextReviewAt: getNextReviewDate(
          prog.history.at(-1)!.rating, prog.consecutiveSuccesses ?? 0,
          next.settings.srAggressiveness, problem.difficulty).toISOString() });
      }
    }
    return commit(operationId, 'settings', expected, { settings: userSettingsToRow(userId, next), reviewDates }, userId);
  });
}

export async function saveSprint(userId: string, updater: (current: SprintData, settings: UserSettingsData,
  progress: Record<string, ProblemProgress>, timings: SessionTiming[]) => { sprintState: SprintState | null; sprintHistory: SprintHistoryEntry[] } | null) {
  const operationId = safeUUID();
  return retryConflict(async () => {
    const [current, settings, progress, timings] = await Promise.all([
      fetchSprintState(userId), fetchUserSettings(userId), fetchProblemProgress(userId), fetchSessionTimings(userId),
    ]);
    const next = updater(current, settings, progress, timings);
    if (!next) return;
    return commit(operationId, 'sprint', { sprint: current.version, settings: settings.version },
      { sprint: sprintToRow(userId, next.sprintState, next.sprintHistory) }, userId);
  });
}

export async function importSubmissions(userId: string, submissions: Array<{ titleSlug: string; timestamp: string }>) {
  // Insert-only server behavior preserves reviews imported or logged on other devices.
  const next = applyLeetCodeSubmissions({}, submissions);
  return commit(safeUUID(), 'import', {}, {
    progress: Object.entries(next.progress).map(([id, entry]) => progressToRow(userId, id, entry)),
  }, userId);
}

export async function removeProblemProgress(userId: string, problemId: string) {
  const progress = await fetchProblemProgress(userId);
  return commit(safeUUID(), 'remove', { progress: { [problemId]: progress[problemId]?.version ?? 0 } }, { problemId }, userId);
}

export async function exportBackup(): Promise<UserBackup> {
  const { data, error } = await supabase.rpc('export_user_data');
  if (error) throw error;
  const snapshot = data as {
    settings: Parameters<typeof normalizeUserSettingsRow>[0]; progress: ProblemProgressRow[];
    activity: Array<{ log_date: string; solved: number; reviewed: number }>;
    timings: SessionTimingRow[]; sprint: SprintStateRow | null;
  };
  const sprint = normalizeSprintRow(snapshot.sprint);
  return validateBackup({
    formatVersion: 1, exportedAt: new Date().toISOString(),
    userSettings: normalizeUserSettingsRow(snapshot.settings), progress: rowToProgressMap(snapshot.progress),
    activityLog: Object.fromEntries(snapshot.activity.map((row) => [row.log_date, { solved: row.solved, reviewed: row.reviewed }])),
    sessionTimings: snapshot.timings.map(rowToTiming), sprintState: sprint.sprintState, sprintHistory: sprint.sprintHistory,
  });
}

export async function restoreUserBackup(userId: string, value: unknown) {
  const backup = validateBackup(value); // Validate the entire file before writing anything.
  const payload: Record<string, unknown> = {
    progress: Object.entries(backup.progress ?? {}).map(([id, entry]) => progressToRow(userId, id, entry)),
    activity: Object.entries(backup.activityLog ?? {}).map(([log_date, entry]) => ({ log_date, ...entry })),
    timings: (backup.sessionTimings ?? []).map((entry) => timingToRow(userId, entry)),
  };
  if (backup.userSettings) payload.settings = userSettingsToRow(userId, backup.userSettings);
  if (backup.sprintState !== undefined || backup.sprintHistory !== undefined) {
    const current = await fetchSprintState(userId);
    payload.sprint = sprintToRow(userId, backup.sprintState === undefined ? current.sprintState : backup.sprintState,
      backup.sprintHistory ?? current.sprintHistory);
    return commit(safeUUID(), 'restore', { sprint: current.version }, payload, userId);
  }
  return commit(safeUUID(), 'restore', {}, payload, userId);
}
