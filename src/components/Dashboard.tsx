import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Brain,
  Clock,
  BookOpen,
  Play,
  ArrowRight,
  CircleCheck,
} from "lucide-react";
import {
  useProblemProgress,
  useSessionTimings,
  useUserSettings,
  useSyntaxProgress,
  useStreak,
} from "../hooks/useUserData";
import {
  buildStudyPlan,
  getLearningStatus,
  hasDelayedIndependentPass,
  type StudyTask,
} from "../utils/study";
import {
  problemMap,
  ensureExtendedCatalogLoaded,
  TARGET_CURRICULUM_LABELS,
  problemsPoolForTargetCurriculum,
} from "../data/problems";
import { getPatternForProblem } from "../utils/patternMapping";
import { useStore } from "../store/useStore";
import { PageHeader, QueryErrorBanner } from "./ui";
import { DashboardSkeleton } from "./loadingSkeletons";

const labels = {
  learning: "Learn a representative problem",
  variant: "Try an unseen variation",
  coding_review: "Practice implementation",
  recall: "Recall the approach",
};
export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const settingsQuery = useUserSettings();
  const progressQuery = useProblemProgress();
  const timingQuery = useSessionTimings();
  const syntaxQuery = useSyntaxProgress();
  const { streak } = useStreak();
  const activeSession = useStore((state) => state.activeSession);
  const activeRecall = useStore((state) => state.activeRecall);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    void ensureExtendedCatalogLoaded()
      .then(() => setCatalogReady(true))
      .catch(() => setCatalogError(true));
  }, []);
  useEffect(() => {
    const timer = window.setInterval(
      () => setNow(new Date()),
      activeSession || activeRecall ? 1000 : 60000,
    );
    return () => clearInterval(timer);
  }, [activeSession?.id, activeRecall?.id]);
  const { settings, targetInterviewDate } = settingsQuery;
  const { progress } = progressQuery;
  const timedIds = new Set(timingQuery.sessionTimings.map((t) => t.id));
  const timerSeconds =
    activeSession && !timedIds.has(activeSession.id)
      ? (activeSession.completion?.timing.elapsedSeconds ??
        activeSession.finishedElapsed ??
        Math.max(
          0,
          Math.floor((now.getTime() - activeSession.startTimestamp) / 1000) -
            (activeSession.pausedSeconds ?? 0) -
            (activeSession.pausedAt
              ? Math.floor((now.getTime() - activeSession.pausedAt) / 1000)
              : 0),
        ))
      : 0;
  const recallSeconds =
    activeRecall && !timedIds.has(activeRecall.id)
      ? (activeRecall.completion?.attempt.elapsedSeconds ??
        Math.max(
          0,
          Math.floor((now.getTime() - activeRecall.startedAt) / 1000) -
            (activeRecall.pausedSeconds ?? 0) -
            (activeRecall.pausedAt
              ? Math.floor((now.getTime() - activeRecall.pausedAt) / 1000)
              : 0),
        ))
      : 0;
  const plan = useMemo(
    () =>
      buildStudyPlan({
        progress,
        settings,
        timings: timingQuery.sessionTimings,
        syntaxProgress: syntaxQuery.syntaxProgress,
        targetInterviewDate,
        excludedIds: [
          ...excludedIds,
          ...(activeSession ? [activeSession.problemId] : []),
          ...(activeRecall ? [activeRecall.problemId] : []),
        ],
        activeSeconds: timerSeconds + recallSeconds,
        activeRecallSeconds: recallSeconds,
        now,
      }),
    [
      progress,
      settings,
      timingQuery.sessionTimings,
      syntaxQuery.syntaxProgress,
      targetInterviewDate,
      excludedIds,
      now,
      catalogReady,
      activeSession,
      activeRecall,
      timerSeconds,
      recallSeconds,
    ],
  );
  const evidence = useMemo(() => {
    const pool = problemsPoolForTargetCurriculum(settings.targetCurriculum);
    const covered = new Set(
      pool
        .filter((p) => progress[p.id])
        .map((p) => getPatternForProblem(p) ?? p.category),
    );
    const total = new Set(
      pool.map((p) => getPatternForProblem(p) ?? p.category),
    );
    return {
      covered: covered.size,
      total: total.size,
      dependable: Object.values(progress).filter(hasDelayedIndependentPass)
        .length,
      assess: Object.values(progress).filter(
        (p) => getLearningStatus(p) === "needs_assessment",
      ).length,
    };
  }, [progress, settings.targetCurriculum, catalogReady]);
  function start(task: StudyTask) {
    if (activeSession) {
      navigate(`/timer/${activeSession.problemId}`);
      return;
    }
    if (activeRecall) {
      navigate(`/recall/${activeRecall.problemId}`);
      return;
    }
    if (task.kind === "recall") {
      navigate(`/recall/${task.problemId}`);
      return;
    }
    const store = useStore.getState();
    store.startSession(
      task.problemId,
      task.kind === "coding_review",
      task.kind === "variant",
      Date.now(),
      "/dashboard",
    );
    store.updateActiveSession({
      practiceKind: task.kind,
      plannedMinutes: task.minutes,
    });
    navigate(`/timer/${task.problemId}`, { state: { returnTo: "/dashboard" } });
  }
  const error =
    settingsQuery.error ||
    progressQuery.error ||
    timingQuery.error ||
    syntaxQuery.error;
  if (error || catalogError)
    return <QueryErrorBanner onRetry={() => window.location.reload()} />;
  if (
    settingsQuery.isLoading ||
    progressQuery.isLoading ||
    timingQuery.isLoading ||
    !catalogReady
  )
    return <DashboardSkeleton />;
  const savedMessage = (location.state as { studyMessage?: string } | null)
    ?.studyMessage;
  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-12">
      <PageHeader
        title="Today’s study plan"
        icon={<BookOpen />}
        description="Build new skills, retrieve what you know, and check that you can implement it."
        actions={
          <Link
            to="/settings#section-schedule"
            className="text-sm text-emerald-400"
          >
            Adjust study time
          </Link>
        }
      />
      {savedMessage && (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-300 text-sm"
        >
          {savedMessage}
        </p>
      )}
      {(activeSession || activeRecall) && (
        <section className="premium-card p-5 border-emerald-500/30 flex flex-wrap gap-3 items-center justify-between">
          <div>
            <p className="font-semibold text-zinc-100">
              You have a session in progress
            </p>
            <p className="text-sm text-zinc-400">
              {
                problemMap[
                  (activeSession?.problemId ?? activeRecall?.problemId)!
                ]?.title
              }
            </p>
          </div>
          <Link
            to={
              activeSession
                ? `/timer/${activeSession.problemId}`
                : `/recall/${activeRecall!.problemId}`
            }
            className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-zinc-950"
          >
            Resume session
          </Link>
        </section>
      )}
      <section
        className="premium-card p-6 space-y-4"
        aria-label="Daily time budget"
      >
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400 flex items-center gap-2">
              <Clock size={16} /> Daily time budget
            </p>
            <p className="text-3xl font-semibold text-zinc-100 mt-1">
              {plan.dailyMinutes} min
            </p>
          </div>
          <div className="text-sm text-zinc-400 text-right">
            <p>
              {plan.spentMinutes} min used · {plan.remainingMinutes} min
              remaining
            </p>
            <p className="text-emerald-400 mt-1">
              {plan.plannedMinutes} min planned
            </p>
          </div>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500"
            style={{
              width: `${Math.min(100, plan.dailyMinutes ? (plan.spentMinutes / plan.dailyMinutes) * 100 : 0)}%`,
            }}
          />
        </div>
        <p className="text-xs text-zinc-500">
          Work blocks fit your remaining budget. If a problem needs longer,
          record an unfinished attempt and continue on another day.
        </p>
      </section>
      {plan.isBlackout || plan.isRestDay ? (
        <section className="premium-card p-6">
          <h2 className="text-xl font-semibold text-zinc-100">
            {plan.isBlackout ? "Scheduled break" : "Rest day"}
          </h2>
          <p className="text-zinc-400 mt-2">
            No assignments today. Your study queue will wait for your next study
            day.
          </p>
        </section>
      ) : plan.remainingMinutes === 0 ? (
        <section className="premium-card p-6">
          <h2 className="text-xl font-semibold text-emerald-300 flex gap-2 items-center">
            <CircleCheck /> Your time target is complete
          </h2>
          <p className="text-zinc-400 mt-2">
            You’ve used today’s study budget. Pick up the plan tomorrow.
          </p>
        </section>
      ) : (
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-6">
          <section className="premium-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="text-emerald-400" size={21} />
              <h2 className="text-xl font-semibold text-zinc-100">
                Brief recall checks
              </h2>
            </div>
            <p className="text-sm text-zinc-400">
              Explain the approach from memory, then compare with a reference.
              No full re-code required for this check.
            </p>
            {plan.recallTasks.length ? (
              plan.recallTasks.map((task) => (
                <div
                  key={task.problemId}
                  className="rounded-xl border border-zinc-800 p-4 space-y-2"
                >
                  <div className="flex gap-3 justify-between">
                    <h3 className="font-medium text-zinc-100">
                      {problemMap[task.problemId].title}
                    </h3>
                    <span className="text-xs text-zinc-500 shrink-0">
                      {task.minutes} min
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{task.reason}</p>
                  <div className="flex justify-between items-center gap-3">
                    <button
                      onClick={() => start(task)}
                      className="text-sm text-emerald-400 font-semibold"
                    >
                      Start recall check{" "}
                      <ArrowRight size={14} className="inline" />
                    </button>
                    <button
                      onClick={() =>
                        setExcludedIds((ids) => [...ids, task.problemId])
                      }
                      className="text-xs text-zinc-500"
                    >
                      Swap today
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-400">
                No more recall checks fit today’s allocation. Your remaining
                time is reserved for practice.
              </p>
            )}
            <p className="text-xs text-zinc-500">
              {plan.eligibleRecallCount} eligible in your queue. The plan
              selects only what fits; this is not a requirement to clear them
              all today.
            </p>
          </section>
          <section className="premium-card p-6 space-y-4 border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Play size={21} className="text-emerald-400" />
              <h2 className="text-xl font-semibold text-zinc-100">
                Main practice block
              </h2>
            </div>
            {plan.mainTask ? (
              <>
                <span className="text-xs uppercase tracking-wide text-emerald-400">
                  {labels[plan.mainTask.kind]}
                </span>
                <h3 className="text-2xl font-semibold text-zinc-100">
                  {problemMap[plan.mainTask.problemId].title}
                </h3>
                <p className="text-sm text-zinc-400">{plan.mainTask.reason}</p>
                <p className="text-sm text-zinc-300">
                  {plan.mainTask.minutes} min block
                  {plan.mainTask.minutes < plan.mainTask.estimatedMinutes
                    ? ` · about ${plan.mainTask.estimatedMinutes} min estimated for a full attempt`
                    : ""}
                </p>
                <p className="text-sm text-zinc-400">
                  Try independently first. Afterward, record correctness, hints
                  used, and whether you can explain the solution.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => start(plan.mainTask!)}
                    className="rounded-xl bg-emerald-500 px-5 py-3 text-zinc-950 font-semibold"
                  >
                    Start practice block
                  </button>
                  <button
                    onClick={() =>
                      setExcludedIds((ids) => [
                        ...ids,
                        plan.mainTask!.problemId,
                      ])
                    }
                    className="text-sm text-zinc-400"
                  >
                    Choose another
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-400">
                No additional coding assignment fits this plan. You can revisit
                a pattern lesson in your remaining time.
              </p>
            )}
            {plan.syntaxCards.length > 0 && (
              <Link
                className="block text-sm text-emerald-400 pt-3 border-t border-zinc-800"
                to="/syntax"
              >
                Optional syntax practice · 3 min
              </Link>
            )}
          </section>
        </div>
      )}
      <section
        className="grid sm:grid-cols-3 gap-4"
        aria-label="Learning evidence"
      >
        <div className="premium-card p-5">
          <p className="text-2xl font-semibold text-zinc-100">
            {evidence.covered}/{evidence.total}
          </p>
          <p className="text-sm text-zinc-400">
            Patterns encountered in{" "}
            {TARGET_CURRICULUM_LABELS[settings.targetCurriculum]}
          </p>
        </div>
        <div className="premium-card p-5">
          <p className="text-2xl font-semibold text-zinc-100">
            {evidence.dependable}
          </p>
          <p className="text-sm text-zinc-400">
            Problems with independent passes at least 7 days apart
          </p>
        </div>
        <div className="premium-card p-5">
          <p className="text-2xl font-semibold text-zinc-100">
            {evidence.assess}
          </p>
          <p className="text-sm text-zinc-400">
            Problems awaiting an assessment
          </p>
        </div>
      </section>
      <section className="premium-card p-6 space-y-3">
        <h2 className="text-lg font-semibold text-zinc-100">
          Your study rhythm
        </h2>
        <p className="text-sm text-zinc-400">
          Brief retrieval stays within about 30% of your daily budget. Learning
          days alternate with implementation checks. Unfinished attempts get a
          continuation block, and an upcoming interview shifts practice toward
          cold implementation.
        </p>
        <p className="text-xs text-zinc-500">
          {streak.current} day activity streak · Confidence and recorded
          outcomes are self-reports, not an interview pass prediction.
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-emerald-400">
          <Link to="/analytics">See learning evidence</Link>
          <Link to="/patterns">Explore pattern lessons</Link>
          <Link to="/library">Open problem library</Link>
        </div>
      </section>
    </div>
  );
}
