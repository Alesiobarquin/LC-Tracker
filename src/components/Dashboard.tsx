import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Play, ArrowRight, CircleCheck, ArrowUpRight } from "lucide-react";
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
  getStudyEvaluation,
  type StudyTask,
} from "../utils/study";
import {
  problemMap,
  getNumberedProblemTitle,
  ensureExtendedCatalogLoaded,
  TARGET_CURRICULUM_LABELS,
  problemsPoolForTargetCurriculum,
} from "../data/problems";
import { getPatternForProblem } from "../utils/patternMapping";
import { useStore } from "../store/useStore";
import { Modal, PageHeader, QueryErrorBanner } from "./ui";
import { BudgetMeter, TraceIndex } from "./ui/StudyTrace";
import { Button } from "./ui/Button";
import { DashboardSkeleton } from "./loadingSkeletons";

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
  const [explainedTask, setExplainedTask] = useState<StudyTask | null>(null);
  const closeExplanation = useCallback(() => setExplainedTask(null), []);
  const explanationButton = (task: StudyTask) => (
    <button type="button" className="quiet-action mt-2" onClick={() => setExplainedTask(task)}>
      Why this recommendation?
    </button>
  );
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
  const evaluation = getStudyEvaluation(progress, now);
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
        hasActiveSession: Boolean(activeSession || activeRecall),
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
  const activeSessionNeedsOutcome = Boolean(
    activeSession?.completion || activeSession?.finishedElapsed !== undefined,
  );
  const hasPlannedWork = Boolean(
    plan.recallTasks.length || plan.mainTask || plan.syntaxCards.length,
  );
  const hasAssignments =
    !plan.isBlackout && !plan.isRestDay && plan.remainingMinutes > 0;
  const primaryTask = activeProblemId
    ? undefined
    : hasAssignments
      ? nextTask
      : undefined;
  const focusedProblem =
    problemMap[(activeProblemId ?? primaryTask?.problemId)!];
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const budget = (
    <>
      <p className="register-label">Time available today</p>
      <p className="mt-3 mb-5">
        <span className="register-value text-[48px] leading-none">
          {plan.remainingMinutes}
        </span>
        <span className="text-xs text-muted ml-2">min left</span>
      </p>
      <BudgetMeter spent={plan.spentMinutes} total={plan.dailyMinutes} />
      <div className="flex justify-between gap-2 text-[11px] font-mono text-subtle mt-3">
        <span>{plan.spentMinutes} min used</span>
        <span>{plan.dailyMinutes} min target</span>
      </div>
    </>
  );
  return (
    <div className="today-page space-y-7 pb-6">
      <PageHeader
        className="today-heading"
        title="Today’s study plan"
        description={dateLabel}
        actions={
          <Link
            to="/settings#section-schedule"
            aria-label="Adjust study time"
            className="quiet-action"
          >
            <span className="hidden sm:inline">Adjust study time</span>{" "}
            <ArrowUpRight size={14} />
          </Link>
        }
      />
      {savedMessage && (
        <p
          role="status"
          className="border-l-2 border-success bg-success/5 px-4 py-3 text-success text-sm"
        >
          {savedMessage}
        </p>
      )}
      <section
        aria-label="Daily time budget"
        className="mobile-budget md:hidden"
      >
        <span>
          <strong className="register-value">{plan.remainingMinutes}</strong>{" "}
          <span className="text-xs text-muted">min left today</span>
        </span>
        <div>
          <BudgetMeter spent={plan.spentMinutes} total={plan.dailyMinutes} />
          <p className="font-mono text-[10px] text-subtle mt-2">
            {plan.spentMinutes} / {plan.dailyMinutes} min used
          </p>
        </div>
      </section>
      <div className="study-layout">
        <div className="study-main">
          <section aria-label="Today's sequence" className="plan-track">
            <div className="plan-sequence-heading">
              <h2 className="register-label">Today’s sequence</h2>
              <span className="font-mono text-[10px] text-subtle">
                {activeProblemId
                  ? "Saved session"
                  : `${plan.plannedMinutes} min planned`}
              </span>
            </div>
            {(activeProblemId || primaryTask) && (
              <section aria-label="Your next action" className="study-next">
                <TraceIndex active>{activeProblemId ? "↳" : "01"}</TraceIndex>
                <div className="flex items-center gap-3 text-xs text-accent font-medium">
                  <span className="status-node bg-accent" aria-hidden="true" />
                  {activeProblemId
                    ? activeSessionNeedsOutcome
                      ? "Session ended · outcome ready to save"
                      : "Session in progress · draft saved"
                    : primaryTask?.kind === "recall"
                      ? "Recall warm-up · up next"
                      : "Coding practice · up next"}
                </div>
                <h2 className="study-next-title">
                  {getNumberedProblemTitle(focusedProblem)}
                </h2>
                {!activeProblemId && primaryTask && explanationButton(primaryTask)}
                <p className="text-sm text-muted leading-relaxed max-w-lg">
                  {activeProblemId
                    ? activeRecall
                      ? "Continue your saved recall check before starting another problem."
                      : activeSessionNeedsOutcome
                        ? "Record the outcome of this saved attempt to finish it. The plan will update after it is saved."
                        : "Continue your saved session before starting another problem."
                    : primaryTask!.reason}
                </p>
                <p className="font-mono text-[11px] text-subtle mt-4">
                  {primaryTask?.kind === "variant" || activeSession?.practiceKind === "variant"
                    ? "Topic hidden for unfamiliar check" : focusedProblem?.category}
                  <span className="mx-2 text-line-strong">/</span>
                  {primaryTask?.kind === "variant" || activeSession?.practiceKind === "variant"
                    ? "Choose your approach" : focusedProblem?.difficulty}
                  {primaryTask && (
                    <>
                      <span className="mx-2 text-line-strong">/</span>
                      {primaryTask.minutes} min
                    </>
                  )}
                </p>
                <div className="study-next-action">
                  {activeProblemId ? (
                    <Link
                      to={
                        activeSession
                          ? `/timer/${activeProblemId}`
                          : `/recall/${activeProblemId}`
                      }
                      className="brand-button-primary ui-button inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium"
                    >
                      <Play size={14} />
                      {activeSessionNeedsOutcome ? "Record outcome" : "Resume session"}
                    </Link>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => start(primaryTask!)}
                      >
                        {primaryTask?.kind === "recall"
                          ? "Start recall check"
                          : "Start practice block"}
                        <ArrowRight size={14} />
                      </Button>
                      <button
                        onClick={() =>
                          setExcludedIds((ids) => [
                            ...ids,
                            primaryTask!.problemId,
                          ])
                        }
                        aria-label={
                          primaryTask?.kind === "recall"
                            ? `Swap ${focusedProblem?.title} today`
                            : undefined
                        }
                        className="quiet-action text-subtle"
                      >
                        {primaryTask?.kind === "recall"
                          ? "Swap today"
                          : "Choose another"}
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}
            {plan.isBlackout || plan.isRestDay ? (
              <section className="empty-register">
                <p className="register-label mb-3">Schedule / pause</p>
                <h2 className="text-2xl font-medium tracking-tight">
                  {plan.isBlackout ? "Scheduled break" : "Rest day"}
                </h2>
                <p className="text-sm text-muted mt-3">
                  No assignments today. Your study queue will wait for your next
                  study day.
                </p>
              </section>
            ) : plan.remainingMinutes === 0 ? (
              <section className="empty-register">
                <CircleCheck size={22} className="text-success mb-3" />
                <h2 className="text-xl font-medium">
                  Your time target is complete
                </h2>
                <p className="text-sm text-muted mt-2">
                  You’ve used today’s study budget. Pick up the plan tomorrow.
                </p>
              </section>
            ) : activeProblemId ? null : !hasPlannedWork ? (
              <section className="empty-register">
                <CircleCheck size={22} className="text-success mb-3" />
                <h2 className="text-xl font-medium">Today’s plan is complete</h2>
                <p className="text-sm text-muted mt-2">
                  No additional assignment fits into the remaining time. Your
                  queue will be ready on your next study day.
                </p>
              </section>
            ) : (
              <>
                {plan.recallTasks
                  .filter(
                    (task) =>
                      task.problemId !== primaryTask?.problemId ||
                      primaryTask?.kind !== "recall",
                  )
                  .map((task, index) => (
                    <section
                      key={task.problemId}
                      className="study-step recall-plan-step"
                    >
                      <TraceIndex>
                        {String(index + 2).padStart(2, "0")}
                      </TraceIndex>
                      <div className="study-task-row">
                        <div className="min-w-0">
                          <p className="register-label mb-2">
                            Recall check / {task.minutes} min
                          </p>
                          <h3 className="text-lg font-medium tracking-tight">
                            {getNumberedProblemTitle(problemMap[task.problemId])}
                          </h3>
                          {explanationButton(task)}
                          <p className="text-xs text-muted mt-2 leading-relaxed">
                            {task.reason}
                          </p>
                        </div>
                        <div className="study-task-actions">
                          <button
                            onClick={() => start(task)}
                            className="quiet-action"
                          >
                            Start recall check <ArrowUpRight size={13} />
                          </button>
                          <button
                            onClick={() =>
                              setExcludedIds((ids) => [...ids, task.problemId])
                            }
                            aria-label={`Swap ${problemMap[task.problemId].title} today`}
                            className="quiet-action text-subtle"
                          >
                            Swap today
                          </button>
                        </div>
                      </div>
                    </section>
                  ))}
                {(primaryTask?.kind === "recall" ||
                  (!primaryTask && plan.recallTasks.length > 0)) && (
                  <section className="study-step practice-plan-step">
                    <TraceIndex>
                      {String(plan.recallTasks.length + 1).padStart(2, "0")}
                    </TraceIndex>
                    <h3 className="register-label">Main practice block</h3>
                    {plan.mainTask ? (
                      <>
                        <h4 className="practice-plan-title">
                          {getNumberedProblemTitle(problemMap[plan.mainTask.problemId])}
                        </h4>
                        {explanationButton(plan.mainTask)}
                        <p className="text-xs text-muted leading-relaxed mt-2 max-w-lg">
                          {plan.mainTask.reason}
                        </p>
                        <p className="font-mono text-[11px] text-subtle mt-3">
                          {plan.mainTask.minutes} min coding block
                          {plan.mainTask.minutes <
                          plan.mainTask.estimatedMinutes
                            ? ` · about ${plan.mainTask.estimatedMinutes} min for a full attempt`
                            : ""}
                        </p>
                        <div className="flex flex-wrap gap-5 mt-3">
                          <button
                            onClick={() => start(plan.mainTask!)}
                            className="quiet-action"
                          >
                            Start practice block <ArrowUpRight size={13} />
                          </button>
                          <button
                            onClick={() =>
                              setExcludedIds((ids) => [
                                ...ids,
                                plan.mainTask!.problemId,
                              ])
                            }
                            className="quiet-action text-subtle"
                          >
                            Choose another
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted mt-3">
                        No additional coding block fits into the remaining
                        time.
                      </p>
                    )}
                  </section>
                )}
                <div className="plan-endnote">
                  <span className="plan-end-mark" aria-hidden="true" />
                  <p className="text-[11px] text-subtle leading-relaxed">
                    {plan.eligibleRecallCount} eligible in your queue. Only what
                    fits is selected; you don’t need to clear the queue today.
                  </p>
                  {plan.syntaxCards.length > 0 && (
                    <Link to="/syntax" className="quiet-action mt-2">
                      Optional syntax practice · 3 min{" "}
                      <ArrowUpRight size={13} />
                    </Link>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
        <aside className="study-rail">
          <section
            className="rail-section time-budget"
            aria-label="Daily time budget"
          >
            {budget}
            <Link
              to="/settings#section-schedule"
              className="quiet-action mt-3 text-subtle"
            >
              Edit schedule <ArrowUpRight size={12} />
            </Link>
          </section>
          <section className="rail-section" aria-label="Learning evidence">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="register-label">Evidence register</h2>
              <Link
                to="/analytics"
                aria-label="View learning evidence details"
                className="quiet-action"
              >
                <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="evidence-row">
              <span className="register-value">
                {evidence.covered}
                <span className="text-xs text-subtle">/{evidence.total}</span>
              </span>
              <span className="text-xs text-muted leading-relaxed">
                Patterns encountered in{" "}
                {TARGET_CURRICULUM_LABELS[settings.targetCurriculum]}
              </span>
            </div>
            <div className="evidence-row">
              <span className="register-value">{evidence.dependable}</span>
              <span className="text-xs text-muted leading-relaxed">
                Problems with independent passes at least 7 days apart
              </span>
            </div>
            <div className="evidence-row">
              <span className="register-value">{evidence.assess}</span>
              <span className="text-xs text-muted leading-relaxed">
                Problems awaiting an assessment
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed mt-4">{evaluation.advice}</p>
          </section>
          <section className="rail-section">
            <h2 className="register-label mb-3">Study rhythm</h2>
            <p className="text-xs text-muted leading-relaxed">
              Recall, implement, revisit. Brief retrieval stays within about 30%
              of your budget, protecting time for new learning.
            </p>
            <p className="text-[11px] text-subtle mt-3">
              {streak.current} day activity streak
            </p>
            <Link to="/patterns" className="quiet-action mt-3">
              Explore pattern lessons <ArrowUpRight size={13} />
            </Link>
            <p className="text-[10px] text-subtle leading-relaxed mt-4">
              Confidence and outcomes are self-reports, not an interview pass
              prediction.
            </p>
          </section>
        </aside>
      </div>
      <Modal isOpen={!!explainedTask} onClose={closeExplanation} title="Why this recommendation?" description={explainedTask ? getNumberedProblemTitle(problemMap[explainedTask.problemId]) : undefined}>
        <div className="space-y-4 text-sm text-muted leading-relaxed">
          {explainedTask?.explanation.map((detail) => <p key={detail}>{detail}</p>)}
        </div>
      </Modal>
    </div>
  );
}
