import type { ActiveSession, RecallDraft, TimeSpentDraft } from "../types";

export function timeSpentDraft(seconds: number): TimeSpentDraft {
  return {
    minutes: String(Math.floor(seconds / 60)),
    seconds: String(seconds % 60),
  };
}

export function isTimeSpentDraft(value: unknown): value is TimeSpentDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<TimeSpentDraft>;
  return typeof draft.minutes === "string" && typeof draft.seconds === "string";
}

export function parseTimeSpent(draft?: TimeSpentDraft): number | null {
  if (!draft || !/^\d+$/.test(draft.minutes) || !/^\d+$/.test(draft.seconds))
    return null;
  const minutes = Number(draft.minutes);
  const seconds = Number(draft.seconds);
  const total = minutes * 60 + seconds;
  // session_timings.elapsed_seconds is a PostgreSQL integer.
  return seconds < 60 && Number.isSafeInteger(total) && total <= 2_147_483_647
    ? total
    : null;
}

function elapsedSince(start: number, pausedSeconds = 0, pausedAt?: number | null, now = Date.now()) {
  return Math.max(0, Math.floor((now - start) / 1000) - pausedSeconds -
    (pausedAt != null ? Math.floor((now - pausedAt) / 1000) : 0));
}

export function codingElapsedSeconds(session: ActiveSession, now = Date.now()): number {
  return session.completion?.timing.elapsedSeconds ??
    parseTimeSpent(session.timeSpentDraft) ?? session.finishedElapsed ??
    elapsedSince(session.startTimestamp, session.pausedSeconds, session.pausedAt, now);
}

export function recallElapsedSeconds(draft: RecallDraft, now = Date.now()): number {
  return draft.completion?.attempt.elapsedSeconds ?? parseTimeSpent(draft.timeSpentDraft) ??
    elapsedSince(draft.startedAt, draft.pausedSeconds, draft.pausedAt, now);
}
