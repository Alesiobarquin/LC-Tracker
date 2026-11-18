import { SectionHeading } from "./ui/StudyTrace";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ExternalLink, ArrowLeft, Clock, Pause, Play } from "lucide-react";
import { problemMap } from "../data/problems";
import { patterns } from "../data/patterns";
import { getPatternForProblem } from "../utils/patternMapping";
import { getPatternLessonMeta } from "../data/patternLessonMeta";
import { useProblemProgress } from "../hooks/useUserData";
import { useTodayPlan } from "../hooks/useTodayPlan";
import { useStore } from "../store/useStore";
import { canPersistTimer } from "../lib/safeStorage";
import { TimeSpentInput } from "./TimeSpentInput";
import { parseTimeSpent, recallElapsedSeconds, timeSpentDraft } from "../utils/sessionTime";
import { Button } from "./ui/Button";
import type { RecallAttempt, TimeSpentDraft } from "../types";
import { PageHeader, QueryErrorBanner } from "./ui";
import { Modal } from "./ui/Modal";
import { useRegisterCoachTools } from "../coach/commands";
import { z } from "zod";
import {
  hasProblemReference,
  type ReferenceLanguage,
} from "../data/problemReferences";
import {
  ProblemExplanation,
  ExplanationLinks,
} from "./ProblemExplanation";
import { ReferenceCode } from "./ReferenceCode";
import { RecallEditor } from "./RecallEditor";
import {
  parsePersonalExplanation,
  formatPersonalExplanation,
} from "../utils/personalExplanation";

const button =
  "rounded-md bg-accent px-4 py-3 text-sm font-semibold text-on-accent hover:bg-accent-strong disabled:opacity-40";
const recallCommand = z.strictObject({
  action: z.enum(["pause", "resume", "correct_time", "use_timer", "answer", "reveal", "compare", "notes", "save", "retry", "discard", "next_review", "finish_reviews"]),
  sessionId: z.string().optional(),
  minutes: z.number().int().nonnegative().optional(),
  seconds: z.number().int().min(0).max(59).optional(),
  text: z.string().max(20000).optional(),
  outcome: z.enum(["recalled", "partial", "forgot"]).optional(),
});
export function RecallPage() {
  const { problemId } = useParams();
  return <RecallCheck key={problemId} problemId={problemId} />;
}

function RecallCheck({ problemId }: { problemId?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const reviewSaved = (location.state as { reviewSaved?: boolean } | null)?.reviewSaved === true;
  const { progress, isLoading, error, refetch, saveRecall } =
    useProblemProgress();
  const today = useTodayPlan();
  const { activeRecall: draft, activeSession, catalogReady, catalogError, reviewsOnly } = today;
  const queueError = (reviewsOnly || reviewSaved) && today.error;
  const queueLoading = (reviewsOnly || reviewSaved) && today.loading;
  const { startRecall, updateRecall, endRecall } = useStore.getState();
  const updateAnswer = useCallback(
    (answer: string) => updateRecall({ answer }),
    [updateRecall],
  );
  const [promptsExpanded, setPromptsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const elapsed = draft ? recallElapsedSeconds({ ...draft, timeSpentDraft: undefined }) : 0;
  const submitting = useRef(false);
  const closed = useRef(false);
  const comparisonSection = useRef<HTMLElement>(null);
  const recordSection = useRef<HTMLElement>(null);
  const savedSection = useRef<HTMLElement>(null);
  useEffect(() => {
    if (isLoading || error || !catalogReady) return;
    const section = reviewSaved && !draft
      ? savedSection.current
      : draft?.compared || draft?.completion
      ? recordSection.current
      : draft?.revealed
        ? comparisonSection.current
        : null;
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: "start" });
    if (section === recordSection.current && section && comparisonSection.current) {
      // A lazy explanation can expand above the outcome after a reload.
      const observer = new ResizeObserver(() => {
        if (document.activeElement === section) section.scrollIntoView({ block: "start" });
      });
      observer.observe(comparisonSection.current);
      return () => observer.disconnect();
    }
  }, [isLoading, error, catalogReady, draft?.revealed, draft?.compared, draft?.completion, draft?.id, reviewSaved, queueLoading]);
  const [storageAvailable] = useState(canPersistTimer);
  useEffect(() => {
    if (
      !isLoading &&
      !error &&
      !queueError &&
      !queueLoading &&
      catalogReady &&
      problemId &&
      progress[problemId] &&
      !draft &&
      !activeSession &&
      !reviewSaved &&
      !closed.current
    )
      startRecall(problemId);
  }, [
    isLoading,
    error,
    queueError,
    queueLoading,
    catalogReady,
    problemId,
    progress,
    draft,
    activeSession,
    reviewSaved,
  ]);
  useEffect(() => {
    const pause = () => {
      const current = useStore.getState().activeRecall;
      if (
        current &&
        current.id === draft?.id &&
        !current.completion &&
        !current.pausedAt
      )
        updateRecall({ pausedAt: Date.now() });
    };
    window.addEventListener("pagehide", pause);
    return () => {
      window.removeEventListener("pagehide", pause);
      pause();
    };
  }, [draft?.id]);
  function setPaused(paused: boolean) {
    const current = useStore.getState().activeRecall;
    if (!current || current.id !== draft?.id || current.completion || paused === (current.pausedAt != null)) return;
    if (current.pausedAt != null)
      updateRecall({
        pausedSeconds:
          (current.pausedSeconds ?? 0) +
          Math.floor((Date.now() - current.pausedAt) / 1000),
        pausedAt: null,
      });
    else updateRecall({ pausedAt: Date.now() });
  }

  async function finish(outcome: RecallAttempt["outcome"]) {
    const current = useStore.getState().activeRecall;
    if (!current || current.id !== draft?.id || submitting.current || (!current.compared && !current.completion))
      return "Compare the original answer before recording the result.";
    const correctedElapsed = current.timeSpentDraft ? parseTimeSpent(current.timeSpentDraft) : recallElapsedSeconds(current);
    if (!current.completion && correctedElapsed === null) {
      const message = "Enter a valid time spent before saving.";
      setSaveError(message);
      return message;
    }
    const originalAnswer = current.retrievedAnswer ?? current.answer;
    if (!current.completion && outcome !== "forgot" && !originalAnswer.trim()) {
      const message = "Your original attempt was empty. Record Forgot; a correction after comparison does not count as unaided recall.";
      setSaveError(message);
      return message;
    }
    if (!current.completion && (current.notes?.length ?? 0) > 20000) {
      const message = "Keep your personal explanation and code within 20,000 characters.";
      setSaveError(message);
      return message;
    }
    submitting.current = true;
    setSaving(true);
    setSaveError("");
    const completion = current.completion ?? {
      attempt: {
        id: current.id,
        date: new Date().toISOString(),
        elapsedSeconds: correctedElapsed ?? elapsed,
        outcome,
        answer: originalAnswer,
        ...(originalAnswer !== current.answer
          ? { revisedAnswer: current.answer }
          : {}),
        checkedAgainst: current.checkedAgainst,
      },
      notes: current.notes,
    };
    updateRecall({ completion });
    try {
      await saveRecall({ problemId: current.problemId, ...completion });
      if (useStore.getState().activeRecall?.id !== current.id) return "Recall result saved.";
      closed.current = true;
      endRecall();
      const savedAt = new Date();
      const continueReviews = useStore.getState().reviewOnlyDate === format(savedAt, "yyyy-MM-dd");
      navigate(continueReviews ? `/recall/${current.problemId}` : "/dashboard", {
        replace: continueReviews,
        state: {
          reviewSaved: continueReviews,
          studyMessage:
            completion.attempt.outcome === "recalled"
              ? "Approach recalled. Your coding check remains separate."
              : "Recall saved. A future coding practice block will help close the gap.",
        },
      });
      return "Recall result saved.";
    } catch {
      const message = "Could not confirm your save. Your answer and attempt are preserved. Retry to save it once.";
      setSaveError(message);
      return message;
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  const hasBuiltIn = !!problemId && hasProblemReference(problemId);
  const comparisonReference = draft?.checkedAgainst === "notes" || !hasBuiltIn
    ? "notes"
    : "solution";
  function revealReference() {
    const current = useStore.getState().activeRecall;
    if (!current || current.id !== draft?.id || current.revealed) return;
    const notes = progress[current.problemId]?.notes ?? "";
    updateRecall({
      revealed: true,
      retrievedAnswer: current.answer,
      notes,
      checkedAgainst: hasBuiltIn ? "solution" : notes ? "notes" : "external",
    });
  }
  function compareAnswer() {
    updateRecall({ compared: true, checkedAgainst: comparisonReference });
  }
  function changeTimeSpent(timeSpentDraft: TimeSpentDraft | undefined) {
    updateRecall({ timeSpentDraft });
    setSaveError("");
  }
  function discardDraft() {
    const current = useStore.getState().activeRecall;
    if (!current || current.id !== draft?.id || current.completion) return;
    closed.current = true;
    endRecall();
    navigate("/dashboard");
  }

  const savedPlan = reviewSaved && !draft && today.plan;
  const nextReview = reviewsOnly && savedPlan ? savedPlan.recallTasks[0] : undefined;
  function continueToNextReview() {
    const { activeSession, activeRecall, reviewOnlyDate } = useStore.getState();
    if (!nextReview || activeSession || activeRecall || reviewOnlyDate !== format(new Date(), "yyyy-MM-dd")) return false;
    const path = today.startTask(nextReview);
    if (!path) return false;
    navigate(path, { replace: true, state: null });
    return true;
  }

  useRegisterCoachTools((draft?.problemId === problemId || reviewSaved) && !isLoading && !error && !queueError && !queueLoading && catalogReady ? {
    recall_status: {
      kind: "read",
      duringPractice: true,
      description: "Read the active recall stage, elapsed seconds, and save state without revealing any answers. No arguments.",
      run: () => {
        const current = useStore.getState().activeRecall;
        if (!current || current.id !== draft?.id)
          return reviewSaved ? {
            message: "Recall saved.",
            actions: [
              ...(nextReview ? [{ label: "Next review", name: "recall_session", args: { action: "next_review" } }] : []),
              { label: "Finish reviewing", name: "recall_session", args: { action: "finish_reviews" } },
            ],
          } : { message: "There is no matching recall draft." };
        const status = submitting.current ? "saving" : current.completion ? "save unconfirmed"
          : current.compared ? "record outcome" : current.revealed ? "compare" : "retrieve";
        const seconds = recallElapsedSeconds(current);
        const action = status === "save unconfirmed" ? "retry" : status === "compare" ? "compare" : status === "retrieve" ? "reveal" : undefined;
        return {
          message: `Recall stage: ${status} · ${seconds} seconds spent${current.pausedAt ? " · paused" : ""}.`,
          data: { seconds, status, paused: current.pausedAt != null },
          actions: status === "record outcome"
            ? (["Recalled", "Partial", "Forgot"] as const).map(label => ({
              label: `Save ${label.toLowerCase()}`,
              name: "recall_session",
              args: { action: "save", sessionId: current.id, outcome: label.toLowerCase() },
            }))
            : action ? [{ label: action === "retry" ? "Retry save" : action === "compare" ? "I’ve compared my answer" : "Compare with a reference", name: "recall_session", args: { action, sessionId: current.id } }] : undefined,
        };
      },
    },
    recall_session: {
      duringPractice: true,
      description: "Operate recall using action (pause, resume, correct_time, use_timer, answer, reveal, compare, notes, save, retry, discard, next_review, finish_reviews). Optional sessionId binds the current draft. correct_time takes numeric minutes and seconds. answer and notes take exact user-supplied text; reveal opens the built-in comparison on the page. compare means the learner has completed comparison. save needs the learner's outcome (recalled, partial or forgot). next_review and finish_reviews are available after saving.",
      run: async (args) => {
        const parsed = recallCommand.safeParse(args);
        if (!parsed.success) return { message: "Specify a valid recall action and its values." };
        const { action, sessionId, minutes, seconds, text, outcome } = parsed.data;
        const current = useStore.getState().activeRecall;
        if (action === "next_review" || action === "finish_reviews") {
          if (current || !savedPlan || sessionId) return { message: "Record the current recall check first." };
          if (action === "finish_reviews") {
            navigate("/dashboard");
            return { message: "Returned to Today." };
          }
          if (!continueToNextReview())
            return { message: "There is no next recall check in today's review queue." };
          return { message: "Opened the next recall check." };
        }
        if (!current || current.id !== draft?.id || (sessionId && current.id !== sessionId))
          return { message: "That recall draft is no longer active." };
        if (submitting.current) return { message: "The recall result is still saving." };
        if (current.completion && action !== "save" && action !== "retry")
          return { message: "The attempted save is frozen. Retry the saved result." };
        if (action === "save" || action === "retry") {
          if (action === "retry" && !current.completion)
            return { message: "There is no unconfirmed recall save to retry." };
          const reported = current.completion?.attempt.outcome ?? outcome;
          if (!reported) return { message: "Report recalled, partial, or forgot after comparing your answer." };
          return { message: await finish(reported) };
        }
        if (action === "pause" || action === "resume") {
          setPaused(action === "pause");
          return { message: action === "pause" ? "Recall timer paused." : "Recall timer running." };
        }
        if (action === "discard") {
          setConfirmDiscard(true);
          return { message: "Review the discard confirmation on the recall page." };
        }
        if (action === "correct_time" || action === "use_timer") {
          const total = (minutes ?? 0) * 60 + (seconds ?? 0);
          if (action === "correct_time" && ((minutes === undefined && seconds === undefined) || !Number.isSafeInteger(total) || total > 2_147_483_647))
            return { message: "Enter a valid duration in minutes and seconds." };
          changeTimeSpent(action === "use_timer" ? undefined : timeSpentDraft(total));
          return { message: action === "use_timer" ? "Using the measured recall time." : `Time spent set to ${total} seconds.` };
        }
        if (action === "reveal") {
          revealReference();
          return { message: "The comparison is open on the recall page." };
        }
        if (action === "compare") {
          if (!current.revealed) return { message: "Open the comparison before marking it complete." };
          compareAnswer();
          return { message: "Report your unaided recall in the outcome form." };
        }
        if (text === undefined) return { message: "Supply the text to place in your recall draft." };
        if (action === "notes" && !current.revealed) return { message: "Personal explanations are available after revealing the reference." };
        if (action === "notes") updateRecall({ notes: text });
        else updateAnswer(text);
        return { message: action === "notes" ? "Personal explanation updated in the draft." : "Recall answer updated in the draft." };
      },
    },
  } : {});

  if (error || catalogError || queueError)
    return (
      <QueryErrorBanner
        onRetry={() =>
          catalogError || queueError ? window.location.reload() : void refetch()
        }
      />
    );
  if (isLoading || !catalogReady || queueLoading)
    return (
      <p role="status" className="text-muted">
        Loading recall check…
      </p>
    );
  const problem = problemId ? problemMap[problemId] : undefined;
  if (!problem || !progress[problem.id])
    return (
      <div className="premium-card p-6">
        <p>
          This problem needs to be in your study history before a recall check.
        </p>
        <Link to="/library" className="text-accent">
          Open library
        </Link>
      </div>
    );
  if (activeSession)
    return (
      <div className="premium-card p-6">
        <p className="mb-4">
          Finish or pause your coding session before starting a recall check.
        </p>
        <Link className="text-accent" to={`/timer/${activeSession.problemId}`}>
          Resume coding session
        </Link>
      </div>
    );
  if (draft && draft.problemId !== problem.id)
    return (
      <div className="premium-card p-6">
        <p className="mb-4">You have another recall check in progress.</p>
        <Link className="text-accent" to={`/recall/${draft.problemId}`}>
          Resume your recall check
        </Link>
      </div>
    );
  if (savedPlan) {
    const plan = savedPlan;
    const stopMessage = !reviewsOnly
      ? "Reviews only has ended for today. Return to today’s plan to choose what’s next."
      : plan.isBlackout || plan.isRestDay
        ? "Your schedule is paused. No more assignments today."
        : plan.remainingMinutes === 0
          ? "Your time target is complete. Pick up your reviews another day."
          : plan.remainingMinutes < 3
            ? "There’s less than 3 minutes left in today’s budget. Stop here and pick up your reviews another day."
            : "No more due reviews for today.";
    return (
      <section ref={savedSection} tabIndex={-1} className="recall-workspace recall-complete mx-auto space-y-6 pb-12" aria-label="Review complete">
        <PageHeader title="Review saved" description="Your answer and time have been recorded." />
        <p role="status" className="text-sm text-success">Recall saved. Your coding check remains separate.</p>
        {nextReview ? (
          <div className="space-y-3 border-y border-line py-5">
            <p className="register-label">Next recall check / about 3 min</p>
            <h2 className="text-2xl font-medium tracking-tight">{problemMap[nextReview.problemId].title}</h2>
            <p className="text-sm text-muted">{plan.remainingMinutes} min left today. Continue when you’re ready, or finish here.</p>
          </div>
        ) : <p className="text-body">{stopMessage}</p>}
        <div className="flex flex-wrap items-center gap-3">
          {nextReview && (
            <Button variant="primary" onClick={continueToNextReview}>
              Next review
            </Button>
          )}
          <Button variant={nextReview ? "secondary" : "primary"} onClick={() => navigate("/dashboard")}>
            Finish reviewing
          </Button>
        </div>
      </section>
    );
  }
  if (!draft) return <p role="status">Preparing recall check…</p>;
  const pattern = patterns.find((p) => p.id === getPatternForProblem(problem));
  const lesson = pattern
    ? getPatternLessonMeta(pattern.id, pattern.isCore)
    : null;
  const frozen = !!draft.completion;
  const compared = !!draft.compared || frozen;
  // Older drafts retain their recorded source. Display a usable reference even
  // when their external/pattern option is no longer part of the selector.
  const parsedPersonal = parsePersonalExplanation(
    draft.notes ?? progress[problem.id].notes ?? "",
  );
  const personal = {
    ...parsedPersonal,
    language: draft.notesLanguage ?? parsedPersonal.language,
  };
  function updatePersonal(
    explanation: string,
    code: string,
    language: ReferenceLanguage,
  ) {
    updateRecall({
      notes: formatPersonalExplanation(explanation, code, language),
      notesLanguage: language,
    });
  }
  return (
    <div className="recall-workspace mx-auto space-y-6 pb-12">
      <div className="attempt-context-header">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted"
        >
          <ArrowLeft size={14} /> Today’s plan · draft saved
        </Link>
        <PageHeader title="Recall check" className="attempt-page-heading" />
      </div>
      {!storageAvailable && (
        <p role="alert" className="text-warning">
          This browser cannot preserve your answer after reload. Keep this tab
          open until saving finishes.
        </p>
      )}
      <section className="recall-stage space-y-4">
        <ol className="attempt-stages" aria-label="Recall stages">
          <li className={!draft.revealed ? "is-current" : "is-complete"}>
            <span>01</span>Retrieve
          </li>
          <li
            className={
              compared ? "is-complete" : draft.revealed ? "is-current" : ""
            }
          >
            <span>02</span>Compare
          </li>
          <li className={compared ? "is-current" : ""}>
            <span>03</span>Record
          </li>
        </ol>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="attempt-problem-title text-foreground">
            {problem.leetcodeNumber != null && (
              <span className="mr-3 font-mono text-foreground">
                {problem.leetcodeNumber}.
              </span>
            )}
            {problem.title}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-subtle text-xs font-mono inline-flex gap-2 items-center">
              <Clock size={16} /> {Math.floor(elapsed / 60)}:
              {String(elapsed % 60).padStart(2, "0")} · aim for 3 min
            </span>
            {!frozen && (
              <div className="flex gap-3 items-center text-sm">
                <button
                  type="button"
                  className="text-accent inline-flex w-[7.5rem] shrink-0 items-center justify-start gap-1.5"
                  onClick={() => setPaused(draft.pausedAt == null)}
                  aria-pressed={!!draft.pausedAt}
                >
                  {draft.pausedAt ? <Play size={14} /> : <Pause size={14} />}
                  {draft.pausedAt ? "Resume check" : "Pause check"}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="attempt-tools">
          <a
            href={problem.leetcodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent inline-flex gap-2 items-center"
          >
            Read the problem statement <ExternalLink size={14} />
          </a>
        </div>
        <div className="recall-writing-layout">
          <aside className="recall-guide">
            <p className="register-label recall-guide-label">
              Check your reasoning
            </p>
            <button
              type="button"
              className="recall-guide-toggle quiet-action"
              onClick={() => setPromptsExpanded(!promptsExpanded)}
              aria-expanded={promptsExpanded}
              aria-controls="recall-prompts"
            >
              Reasoning prompts{" "}
              <span className="font-mono text-[10px] text-subtle">
                04 / {promptsExpanded ? "−" : "+"}
              </span>
            </button>
            <ol
              id="recall-prompts"
              className={`recall-prompts text-body ${promptsExpanded ? "prompts-expanded" : ""}`}
            >
              <li>
                Which approach would you choose, and what clues lead you to it?
              </li>
              <li>What invariant or recurrence makes it correct?</li>
              <li>What are the time and space costs?</li>
              <li>
                Which edge cases or implementation details could break it?
              </li>
            </ol>
          </aside>
          <div className="recall-writing-sheet">
            {reviewsOnly && <p className="text-sm text-muted mb-3">Reviews only · short written bullets are enough. No full implementation needed.</p>}
            <RecallEditor
              value={draft.answer}
              readOnly={frozen}
              onChange={updateAnswer}
            />
            {!draft.revealed && (
              <div className="flex flex-wrap gap-3">
                <button className={button} onClick={revealReference}>
                  Compare with a reference
                </button>
                <button
                  className="text-sm text-muted underline"
                  onClick={revealReference}
                >
                  I can’t recall it
                </button>
              </div>
            )}
            {draft.revealed && (
              <p className="text-xs text-muted mt-3">
                Keep editing to close the gaps. Your original answer is
                preserved; rate what you remembered before seeing the reference.
              </p>
            )}
            {draft.revealed && (
              <details className="text-sm text-muted mt-3">
                <summary className="cursor-pointer text-accent">
                  View original answer from memory
                </summary>
                <p className="whitespace-pre-wrap mt-3">
                  {draft.retrievedAnswer ||
                    "No answer was written before comparison."}
                </p>
              </details>
            )}
            {frozen && (
              <p role="status" className="text-sm text-muted mt-3">
                This attempt is ready to save. Its answer and outcome are fixed
                so a retry records it once.
              </p>
            )}
          </div>
        </div>
      </section>
      {!frozen && (
        <button
          className="text-xs text-subtle underline"
          onClick={() => setConfirmDiscard(true)}
        >
          Discard unsaved check
        </button>
      )}
      <Modal isOpen={confirmDiscard && !frozen} onClose={() => setConfirmDiscard(false)} title="Discard recall check?" size="sm">
        <p className="mb-4 text-sm text-muted">Your unsaved answer and timer will be cleared.</p>
        <div className="flex gap-2">
          <Button onClick={() => setConfirmDiscard(false)}>Keep check</Button>
          <Button variant="danger" onClick={discardDraft}>Discard check</Button>
        </div>
      </Modal>
      {draft.revealed && (
        <section
          ref={comparisonSection}
          tabIndex={-1}
          aria-label="Compare recall answer"
          className="recall-stage recall-comparison space-y-5 scroll-mt-24"
        >
          <SectionHeading index="02" title="Compare and identify gaps" />
          <label className="block text-sm text-body">
            Explanation to compare against
            <select
              aria-label="Reference used"
              value={comparisonReference}
              disabled={frozen}
              onChange={(e) =>
                updateRecall({
                  checkedAgainst: e.target
                    .value as RecallAttempt["checkedAgainst"],
                  compared: false,
                })
              }
              className="block mt-2 w-full rounded-md bg-surface border border-line-strong p-3 text-foreground"
            >
              {hasBuiltIn && (
                <option value="solution">Built-in problem explanation</option>
              )}
              <option value="notes">My explanation · edit or replace</option>
            </select>
          </label>
          {!hasBuiltIn && (
            <p className="text-sm text-muted">
              A built-in solution isn’t available for this problem yet. Use the
              linked explanations below or write your own notes.
            </p>
          )}
          {comparisonReference === "solution" && (
            <ProblemExplanation problem={problem} />
          )}
          {comparisonReference === "notes" && (
            <div className="personal-explanation space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Your explanation
              </h3>
              <p className="text-xs text-muted">
                Write the logic in your own words. Your notes stay available
                alongside the built-in solution. Changes save with your recall
                outcome.
              </p>
              <label className="block text-sm text-body">
                Explanation in plain English
                <textarea
                  aria-label="Personal explanation"
                  value={personal.explanation}
                  disabled={frozen}
                  rows={7}
                  maxLength={20000}
                  onChange={(e) =>
                    updatePersonal(
                      e.target.value,
                      personal.code,
                      personal.language,
                    )
                  }
                  placeholder="Explain the approach, why it works, complexity, and edge cases."
                  className="mt-2 w-full rounded-md border border-line-strong bg-surface p-3 text-foreground focus-visible:ring-2 focus-visible:ring-accent"
                />
              </label>
              <label className="flex gap-3 items-center text-sm text-body">
                Your code language
                <select
                  aria-label="Personal code language"
                  value={personal.language}
                  disabled={frozen}
                  onChange={(e) =>
                    updatePersonal(
                      personal.explanation,
                      personal.code,
                      e.target.value as ReferenceLanguage,
                    )
                  }
                  className="rounded-md border border-line-strong bg-surface text-foreground p-2"
                >
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>
              </label>
              <p className="text-sm text-muted">Your code example (optional)</p>
              <ReferenceCode
                code={personal.code}
                language={personal.language}
                label="Personal code example"
                onChange={
                  frozen
                    ? undefined
                    : (code) =>
                        updatePersonal(
                          personal.explanation,
                          code,
                          personal.language,
                        )
                }
              />
              {!frozen && hasBuiltIn && (
                <div className="flex flex-wrap gap-5">
                  <button
                    className="quiet-action"
                    onClick={() =>
                      updateRecall({
                        checkedAgainst: "solution",
                        compared: false,
                      })
                    }
                  >
                    Use built-in explanation
                  </button>
                  <button
                    className="quiet-action text-muted"
                    onClick={() =>
                      updateRecall({
                        notes: "",
                        checkedAgainst: "solution",
                        compared: false,
                      })
                    }
                  >
                    Remove my saved explanation
                  </button>
                </div>
              )}
            </div>
          )}
          {lesson && (
            <details className="recall-pattern-reference">
              <summary className="cursor-pointer text-sm text-accent">
                Pattern reference: {pattern?.name}
              </summary>
              <p className="text-xs text-subtle my-3">
                General pattern guidance. Check the problem’s explanation for
                its exact solution and complexity.
              </p>
              <ul className="text-sm text-body list-disc pl-5 space-y-2">
                {lesson.invariants.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
              <p className="text-sm text-muted mt-3">{lesson.complexity}</p>
              <Link
                to={`/patterns/${pattern?.id}`}
                className="text-accent text-sm mt-3 inline-block"
              >
                Open the pattern lesson
              </Link>
            </details>
          )}
          <ExplanationLinks problem={problem} />
          {!compared && (
            <div className="comparison-next space-y-3">
              <p className="text-sm text-body">
                Compare the reference with your original answer, identify the
                gaps, then record what you recalled.
              </p>
              <button
                className={button}
                onClick={compareAnswer}
              >
                I’ve compared my answer — continue
              </button>
            </div>
          )}
        </section>
      )}
      {draft.revealed && compared && (
        <section
          ref={recordSection}
          tabIndex={-1}
          className="recall-stage recall-record space-y-4 scroll-mt-24"
          aria-label="Record recall outcome"
        >
          <SectionHeading index="03" title="Record what you recalled" />
          <p className="text-sm text-muted">
            Rate your original answer from memory. Reading or correcting the
            explanation does not count as unaided recall or a coding pass.
          </p>
          <TimeSpentInput
            timerSeconds={elapsed}
            draft={frozen ? undefined : draft.timeSpentDraft}
            disabled={saving || frozen}
            onChange={changeTimeSpent}
          />
          {!frozen && (
            <button
              className="quiet-action"
              onClick={() => updateRecall({ compared: false })}
            >
              Return to comparison
            </button>
          )}
          {saveError && (
            <p role="alert" className="text-danger">
              {saveError}
            </p>
          )}
          <div className="recall-outcomes">
            {(
              [
                [
                  "recalled",
                  "Recalled",
                  "The key reasoning and details were correct.",
                ],
                [
                  "partial",
                  "Partial recall",
                  "I knew some of it, but missed important details.",
                ],
                ["forgot", "Forgot", "I could not retrieve the approach."],
              ] as const
            ).map(([outcome, label, description]) => (
              <button
                key={outcome}
                disabled={
                  saving ||
                  (!frozen && !!draft.timeSpentDraft && parseTimeSpent(draft.timeSpentDraft) === null) ||
                  (frozen && draft.completion?.attempt.outcome !== outcome)
                }
                onClick={() => void finish(outcome)}
                className="rating-row recall-outcome-row text-left disabled:opacity-40"
              >
                <span className="font-medium text-foreground">
                  {saving ? "Saving…" : frozen ? `Retry: ${label}` : label}
                </span>
                <span className="text-xs text-muted">{description}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-subtle">
            Recall success never counts as an independent coding pass.
          </p>
        </section>
      )}
    </div>
  );
}
