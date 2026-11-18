import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ensureExtendedCatalogLoaded } from "../data/problems";
import { useStore } from "../store/useStore";
import { codingElapsedSeconds, recallElapsedSeconds } from "../utils/sessionTime";
import { buildStudyPlan, type StudyTask } from "../utils/study";
import { useProblemProgress, useSessionTimings, useUserSettings } from "./useUserData";

export function activePracticePath() {
  const { activeSession, activeRecall } = useStore.getState();
  if (activeSession) return `/timer/${activeSession.problemId}`;
  if (activeRecall) return `/recall/${activeRecall.problemId}`;
  return null;
}

export function startPractice(task: Pick<StudyTask, "problemId" | "kind" | "minutes">, returnTo = "/dashboard") {
  const store = useStore.getState();
  if (activePracticePath()) return activePracticePath();
  if (task.kind === "recall") store.startRecall(task.problemId);
  else store.startSession(task.problemId, task.kind === "coding_review", task.kind === "variant",
    Date.now(), returnTo, { practiceKind: task.kind, plannedMinutes: task.minutes });
  return activePracticePath();
}

export function useTodayPlan() {
  const { settings, syntaxProgress, targetInterviewDate, ...settingsQuery } = useUserSettings();
  const { progress, ...progressQuery } = useProblemProgress();
  const { sessionTimings, ...timingQuery } = useSessionTimings();
  const [now, setNow] = useState(() => new Date());
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const activeSession = useStore(state => state.activeSession);
  const activeRecall = useStore(state => state.activeRecall);
  const reviewOnlyDate = useStore(state => state.reviewOnlyDate);
  const dayPlan = useStore(state => state.dayPlan);
  const date = format(now, "yyyy-MM-dd");
  const reviewsOnly = reviewOnlyDate === date;

  useEffect(() => {
    let current = true;
    void ensureExtendedCatalogLoaded().then(
      () => { if (current) setCatalogReady(true); },
      () => { if (current) setCatalogError(true); },
    );
    return () => { current = false; };
  }, []);
  useEffect(() => {
    const update = () => setNow(new Date());
    const interval = window.setInterval(update, activeSession || activeRecall ? 1_000 : 15_000);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", update);
    };
  }, [activeSession?.id, activeRecall?.id]);

  const timedIds = useMemo(() => new Set(sessionTimings.map(row => row.id)), [sessionTimings]);
  const build = (at: Date, store: Pick<ReturnType<typeof useStore.getState>, "activeSession" | "activeRecall" | "reviewOnlyDate" | "dayPlan">) => {
    const dateKey = format(at, "yyyy-MM-dd");
    const choices = store.dayPlan?.date === dateKey ? store.dayPlan : null;
    const timer = store.activeSession;
    const recall = store.activeRecall;
    const timerSeconds = timer && !timedIds.has(timer.id) ? codingElapsedSeconds(timer, at.getTime()) : 0;
    const recallSeconds = recall && !timedIds.has(recall.id) ? recallElapsedSeconds(recall, at.getTime()) : 0;
    return buildStudyPlan({
      progress, settings, timings: sessionTimings, syntaxProgress, targetInterviewDate,
      mode: store.reviewOnlyDate === dateKey ? "reviews" : "full",
      excludedIds: choices?.skipped,
      choice: choices?.choice,
      includeAlternatives: true,
      activeSeconds: timerSeconds + recallSeconds,
      activeRecallSeconds: recallSeconds,
      hasActiveSession: Boolean(timer || recall),
      now: at,
    });
  };
  const plan = useMemo(() => build(now, { activeSession, activeRecall, reviewOnlyDate, dayPlan }),
    [now, activeSession, activeRecall, reviewOnlyDate, dayPlan, settings, progress, sessionTimings,
      syntaxProgress, targetInterviewDate, catalogReady]);
  const error = settingsQuery.error || progressQuery.error || timingQuery.error || catalogError;
  const loading = settingsQuery.isLoading || progressQuery.isLoading || timingQuery.isLoading || !catalogReady;
  return {
    now, date, plan, activeSession, activeRecall, reviewsOnly, progress, settings, sessionTimings,
    catalogReady, catalogError, error, loading,
    freshPlan: () => build(new Date(), useStore.getState()),
    setReviewsOnly: (enabled: boolean) => useStore.getState().setReviewOnlyDate(enabled ? format(new Date(), "yyyy-MM-dd") : null),
    startTask: (task: StudyTask) => {
      const existing = activePracticePath();
      if (existing) return existing;
      const time = new Date();
      const store = useStore.getState();
      if (loading || error || date !== format(time, "yyyy-MM-dd")) return null;
      const current = build(time, store);
      const match = [...current.recallTasks, current.mainTask].find(item =>
        item?.problemId === task.problemId && item.kind === task.kind && item.minutes === task.minutes);
      return match ? startPractice(match) : null;
    },
  };
}
