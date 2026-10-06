import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Brain,
  Clock,
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
  const nextTask = plan.recallTasks[0] ?? plan.mainTask;
  const activeProblemId = activeSession?.problemId ?? activeRecall?.problemId;
  const hasAssignments =
    !plan.isBlackout && !plan.isRestDay && plan.remainingMinutes > 0;
  const primaryTask = activeProblemId ? undefined : hasAssignments ? nextTask : undefined;
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <PageHeader
        title="Today’s study plan"
        description="A short recall warm-up, then one focused practice block."
        actions={
          <Link
            to="/settings#section-schedule"
            className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
          >
            Adjust study time
          </Link>
        }
      />
      {savedMessage && (
        <p
          role="status"
          className="rounded-md border border-accent/25 bg-accent/5 px-4 py-3 text-accent text-sm"
        >
          {savedMessage}
        </p>
      )}
      <section
        className="border-b border-line pb-5 space-y-3"
        aria-label="Daily time budget"
      >
        <div className="flex flex-wrap gap-x-6 gap-y-2 items-center justify-between text-sm">
          <p className="flex items-center gap-2 text-muted">
            <Clock size={16} aria-hidden="true" />
            Daily time budget
            <span className="font-semibold text-foreground">{plan.dailyMinutes} min</span>
          </p>
          <p className="text-muted tabular-nums">
            <span className="text-foreground">{plan.spentMinutes} min used</span>
            {" · "}{plan.remainingMinutes} min remaining
          </p>
        </div>
        <div
          className="h-1 bg-muted-surface overflow-hidden"
          role="progressbar"
          aria-label="Daily study time used"
          aria-valuemin={0}
          aria-valuemax={plan.dailyMinutes || 1}
          aria-valuenow={Math.min(plan.spentMinutes, plan.dailyMinutes || 1)}
          aria-valuetext={`${plan.spentMinutes} of ${plan.dailyMinutes} minutes used`}
        >
          <div
            className="h-full bg-accent"
            style={{
              width: `${Math.min(100, plan.dailyMinutes ? (plan.spentMinutes / plan.dailyMinutes) * 100 : 0)}%`,
            }}
          />
        </div>
      </section>
      {(activeProblemId || primaryTask) && (
        <section
          aria-label="Your next action"
          className="border border-line border-l-[3px] border-l-accent rounded-md bg-surface p-5 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-semibold text-muted tracking-wide uppercase">
                {activeProblemId
                  ? "Session in progress"
                  : primaryTask?.kind === "recall"
                    ? "Start here · Recall warm-up"
                    : "Start here · Coding practice"}
              </p>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                {problemMap[(activeProblemId ?? primaryTask?.problemId)!]?.title}
              </h2>
              <p className="text-sm text-muted leading-relaxed max-w-xl">
                {activeProblemId
                  ? "Continue your saved session before starting another problem."
                  : `${primaryTask!.minutes} min · ${primaryTask!.reason}`}
              </p>
            </div>
            {activeProblemId ? (
              <Link
                to={activeSession ? `/timer/${activeProblemId}` : `/recall/${activeProblemId}`}
                className="shrink-0 inline-flex justify-center items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-on-accent hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <Play size={16} aria-hidden="true" /> Resume session
              </Link>
            ) : (
              <button
                onClick={() => start(primaryTask!)}
                className="shrink-0 inline-flex justify-center items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-on-accent hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Begin study <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </section>
      )}
      {plan.isBlackout || plan.isRestDay ? (
        <section className="border border-line rounded-md bg-surface p-6">
          <h2 className="text-xl font-semibold text-foreground">
            {plan.isBlackout ? "Scheduled break" : "Rest day"}
          </h2>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            No assignments today. Your study queue will wait for your next study
            day.
          </p>
        </section>
      ) : plan.remainingMinutes === 0 ? (
        <section className="border border-line rounded-md bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground flex gap-2 items-center">
            <CircleCheck size={20} className="text-accent" /> Your time target is complete
          </h2>
          <p className="text-muted mt-2 text-sm">
            You’ve used today’s study budget. Pick up the plan tomorrow.
          </p>
        </section>
      ) : (
        <section aria-label="Today's sequence" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Today’s sequence</h2>
            <p className="text-xs text-muted">{plan.plannedMinutes} min planned</p>
          </div>
          <section className="border border-line rounded-md bg-surface">
            <div className="p-4 sm:p-5 border-b border-line">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-subtle tabular-nums">01</span>
                <Brain size={17} className="text-muted" aria-hidden="true" />
                <h3 className="font-semibold text-foreground">Recall warm-up</h3>
              </div>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Explain the approach from memory, then compare with a reference.
                No full re-code required for this check.
              </p>
            </div>
            {plan.recallTasks.length ? (
              <div className="divide-y divide-line">
                {plan.recallTasks.map((task) => (
                  <div key={task.problemId} className="px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-baseline gap-3 justify-between sm:justify-start">
                        <h4 className="text-sm font-medium text-foreground">
                          {problemMap[task.problemId].title}
                        </h4>
                        <span className="text-xs text-subtle shrink-0 tabular-nums">
                          {task.minutes} min
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">{task.reason}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => start(task)}
                        className="inline-flex items-center gap-2 min-h-10 rounded-md border border-line-strong px-3 text-xs font-medium text-body hover:bg-muted-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Start recall check <ArrowRight size={13} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setExcludedIds((ids) => [...ids, task.problemId])}
                        aria-label={`Swap ${problemMap[task.problemId].title} today`}
                        className="min-h-10 px-1 text-xs text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
                      >
                        Swap today
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-4 sm:px-5 text-sm text-muted">
                No more recall checks fit today’s allocation. Your remaining
                time is reserved for practice.
              </p>
            )}
            <p className="px-4 pb-4 sm:px-5 text-xs text-subtle leading-relaxed">
              {plan.eligibleRecallCount} eligible in your queue. The plan
              selects only what fits; this is not a requirement to clear them
              all today.
            </p>
          </section>
          <section className="border border-line rounded-md bg-surface p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-subtle tabular-nums">02</span>
              <Play size={17} className="text-muted" aria-hidden="true" />
              <h3 className="font-semibold text-foreground">Main practice block</h3>
            </div>
            {plan.mainTask ? (
              <div className="space-y-3">
                <p className="text-xs text-muted">{labels[plan.mainTask.kind]}</p>
                <h4 className="text-lg font-semibold tracking-tight text-foreground">
                  {problemMap[plan.mainTask.problemId].title}
                </h4>
                <p className="text-sm text-muted leading-relaxed">{plan.mainTask.reason}</p>
                <p className="text-xs text-body">
                  {plan.mainTask.minutes} min coding block
                  {plan.mainTask.minutes < plan.mainTask.estimatedMinutes
                    ? ` · about ${plan.mainTask.estimatedMinutes} min estimated for a full attempt`
                    : ""}
                </p>
                <p className="text-xs text-muted leading-relaxed">
                  Try independently first. Afterward, record correctness, hints
                  used, and whether you can explain the solution. If you need longer,
                  record an unfinished attempt and continue another day.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <button
                    onClick={() => start(plan.mainTask!)}
                    className="rounded-md border border-line-strong px-4 py-2.5 text-sm font-medium text-body hover:bg-muted-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Start practice block
                  </button>
                  <button
                    onClick={() => setExcludedIds((ids) => [...ids, plan.mainTask!.problemId])}
                    className="text-xs min-h-10 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
                  >
                    Choose another
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted leading-relaxed">
                No additional coding assignment fits this plan. You can revisit
                a pattern lesson in your remaining time.
              </p>
            )}
            {plan.syntaxCards.length > 0 && (
              <Link className="block text-xs text-muted hover:text-foreground pt-3 border-t border-line" to="/syntax">
                Optional syntax practice · 3 min
              </Link>
            )}
          </section>
        </section>
      )}
      <section aria-label="Learning evidence" className="border-t border-line pt-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Learning evidence</h2>
          <Link to="/analytics" className="text-xs text-muted hover:text-foreground underline underline-offset-4">View details</Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="space-y-1">
            <p className="text-lg font-semibold text-body tabular-nums">{evidence.covered}/{evidence.total}</p>
            <p className="text-xs text-muted leading-relaxed">
              Patterns encountered in {TARGET_CURRICULUM_LABELS[settings.targetCurriculum]}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-body tabular-nums">{evidence.dependable}</p>
            <p className="text-xs text-muted leading-relaxed">Problems with independent passes at least 7 days apart</p>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-body tabular-nums">{evidence.assess}</p>
            <p className="text-xs text-muted leading-relaxed">Problems awaiting an assessment</p>
          </div>
        </div>
      </section>
      <details className="border-t border-line pt-4 text-sm">
        <summary className="cursor-pointer text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md">Your study rhythm</summary>
        <div className="pt-3 space-y-3">
          <p className="text-sm text-muted leading-relaxed">
            Brief retrieval stays within about 30% of your daily budget. Learning
            days alternate with implementation checks. Unfinished attempts get a
            continuation block, and an upcoming interview shifts practice toward
            cold implementation.
          </p>
          <p className="text-xs text-subtle leading-relaxed">
            {streak.current} day activity streak · Confidence and recorded
            outcomes are self-reports, not an interview pass prediction.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-muted">
            <Link to="/analytics" className="underline underline-offset-4 hover:text-foreground">See learning evidence</Link>
            <Link to="/patterns" className="underline underline-offset-4 hover:text-foreground">Explore pattern lessons</Link>
            <Link to="/library" className="underline underline-offset-4 hover:text-foreground">Open problem library</Link>
          </div>
        </div>
      </details>
    </div>
  );
}
