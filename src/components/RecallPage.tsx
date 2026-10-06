import { SectionHeading } from "./ui/StudyTrace";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ExternalLink, ArrowLeft, Clock } from "lucide-react";
import { problemMap, ensureExtendedCatalogLoaded } from "../data/problems";
import { patterns } from "../data/patterns";
import { getPatternForProblem } from "../utils/patternMapping";
import { getPatternLessonMeta } from "../data/patternLessonMeta";
import { useProblemProgress } from "../hooks/useUserData";
import { useStore } from "../store/useStore";
import { canPersistTimer } from "../lib/safeStorage";
import type { RecallAttempt } from "../types";
import { PageHeader, QueryErrorBanner } from "./ui";

const button =
  "rounded-md bg-accent px-4 py-3 text-sm font-semibold text-on-accent hover:bg-accent-strong disabled:opacity-40";
export function RecallPage() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { progress, isLoading, error, refetch, saveRecall } =
    useProblemProgress();
  const draft = useStore((state) => state.activeRecall);
  const activeSession = useStore((state) => state.activeSession);
  const { startRecall, updateRecall, endRecall } = useStore.getState();
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const [promptsExpanded, setPromptsExpanded] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const submitting = useRef(false);
  const [storageAvailable] = useState(canPersistTimer);
  useEffect(() => {
    void ensureExtendedCatalogLoaded()
      .then(() => setCatalogReady(true))
      .catch(() => setCatalogError(true));
  }, []);
  useEffect(() => {
    if (
      !isLoading &&
      !error &&
      catalogReady &&
      problemId &&
      progress[problemId] &&
      !draft &&
      !activeSession
    )
      startRecall(problemId);
  }, [
    isLoading,
    error,
    catalogReady,
    problemId,
    progress,
    draft,
    activeSession,
  ]);
  useEffect(() => {
    if (!draft) return;
    const tick = () =>
      setElapsed(
        draft.completion?.attempt.elapsedSeconds ??
          Math.max(
            0,
            Math.floor((Date.now() - draft.startedAt) / 1000) -
              (draft.pausedSeconds ?? 0) -
              (draft.pausedAt
                ? Math.floor((Date.now() - draft.pausedAt) / 1000)
                : 0),
          ),
      );
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [
    draft?.startedAt,
    draft?.completion,
    draft?.pausedAt,
    draft?.pausedSeconds,
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
  function togglePause() {
    if (!draft || draft.completion) return;
    if (draft.pausedAt)
      updateRecall({
        pausedSeconds:
          (draft.pausedSeconds ?? 0) +
          Math.floor((Date.now() - draft.pausedAt) / 1000),
        pausedAt: null,
      });
    else updateRecall({ pausedAt: Date.now() });
  }

  async function finish(outcome: RecallAttempt["outcome"]) {
    if (!draft || submitting.current || (!checked && !draft.completion)) return;
    if (outcome !== "forgot" && !draft.answer.trim()) {
      setSaveError(
        "Write your attempt before recording recalled or partial recall.",
      );
      return;
    }
    submitting.current = true;
    setSaving(true);
    setSaveError("");
    const completion = draft.completion ?? {
      attempt: {
        id: draft.id,
        date: new Date().toISOString(),
        elapsedSeconds: elapsed,
        outcome,
        answer: draft.answer,
        checkedAgainst: draft.checkedAgainst,
      },
      notes: draft.notes,
    };
    updateRecall({ completion });
    try {
      await saveRecall({ problemId: draft.problemId, ...completion });
      if (useStore.getState().activeRecall?.id === draft.id) endRecall();
      navigate("/dashboard", {
        state: {
          studyMessage:
            outcome === "recalled"
              ? "Approach recalled. Your coding check remains separate."
              : "Recall saved. A future coding practice block will help close the gap.",
        },
      });
    } catch {
      setSaveError(
        "Could not confirm your save. Your answer and attempt are preserved. Retry to save it once.",
      );
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  if (error || catalogError)
    return (
      <QueryErrorBanner
        onRetry={() =>
          catalogError ? window.location.reload() : void refetch()
        }
      />
    );
  if (isLoading || !catalogReady)
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
  if (!draft) return <p role="status">Preparing recall check…</p>;
  const pattern = patterns.find((p) => p.id === getPatternForProblem(problem));
  const lesson = pattern
    ? getPatternLessonMeta(pattern.id, pattern.isCore)
    : null;
  const frozen = !!draft.completion;
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
          <li className={draft.revealed ? "is-current" : ""}>
            <span>02</span>Compare
          </li>
          <li>
            <span>03</span>Record
          </li>
        </ol>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="attempt-problem-title text-foreground">
            {problem.title}
          </h2>
          <span className="text-subtle text-xs font-mono inline-flex gap-2 items-center">
            <Clock size={16} /> {Math.floor(elapsed / 60)}:
            {String(elapsed % 60).padStart(2, "0")} · aim for 3 min
          </span>
        </div>
        <div className="attempt-tools">
          {!frozen && (
            <div className="flex gap-4 items-center text-sm">
              <button className="text-accent" onClick={togglePause}>
                {draft.pausedAt ? "Resume check" : "Pause check"}
              </button>
              {draft.pausedAt && (
                <span className="text-subtle">Timer paused</span>
              )}
            </div>
          )}
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
            <label htmlFor="recall-answer" className="block text-sm text-body">
              Your attempt · explanation or pseudocode
            </label>
            <textarea
              id="recall-answer"
              rows={7}
              maxLength={20000}
              value={draft.answer}
              disabled={draft.revealed || frozen}
              onChange={(e) => updateRecall({ answer: e.target.value })}
              placeholder="Write what you remember without opening your notes or the solution."
              className="notebook-answer w-full text-foreground font-mono text-sm placeholder:text-subtle"
            />
            {!draft.revealed && (
              <div className="flex flex-wrap gap-3">
                <button
                  className={button}
                  onClick={() => updateRecall({ revealed: true })}
                >
                  Compare with a reference
                </button>
                <button
                  className="text-sm text-muted underline"
                  onClick={() => updateRecall({ revealed: true })}
                >
                  I can’t recall it
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
      {!frozen && (
        <button
          className="text-xs text-subtle underline"
          onClick={() => {
            endRecall();
            navigate("/dashboard");
          }}
        >
          Discard unsaved check
        </button>
      )}
      {draft.revealed && (
        <section className="recall-stage recall-comparison space-y-5">
          <SectionHeading index="02" title="Compare and identify gaps" />
          {progress[problem.id].notes && (
            <div className="saved-recall-reference">
              <h3 className="text-sm font-semibold text-accent mb-2">
                Your saved notes
              </h3>
              <p className="whitespace-pre-wrap text-sm text-body">
                {progress[problem.id].notes}
              </p>
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
          <a
            href={problem.leetcodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-accent text-sm"
          >
            Check the explanation on LeetCode <ExternalLink size={14} />
          </a>
          <p className="text-sm text-muted">
            Check the approach, correctness argument, complexity, and edge
            cases. This is a self-check; the app does not automatically grade
            your answer.
          </p>
          <label className="block text-sm text-body">
            Reference used
            <select
              aria-label="Reference used"
              value={draft.checkedAgainst}
              disabled={frozen}
              onChange={(e) =>
                updateRecall({
                  checkedAgainst: e.target
                    .value as RecallAttempt["checkedAgainst"],
                })
              }
              className="block mt-2 w-full rounded-md bg-surface border border-line-strong p-3 text-foreground"
            >
              <option value="external">
                Problem explanation / external reference
              </option>
              <option value="notes">My saved notes</option>
              <option value="reference">Pattern reference</option>
            </select>
          </label>
          <label className="flex gap-3 text-sm text-body">
            <input
              type="checkbox"
              checked={checked || frozen}
              disabled={frozen}
              onChange={(e) => setChecked(e.target.checked)}
            />{" "}
            I compared my answer with a reference and identified any gaps.
          </label>
          <label className="block text-sm text-body">
            Save a corrected explanation or key insight (optional)
            <textarea
              aria-label="Corrected explanation"
              rows={3}
              maxLength={20000}
              disabled={frozen}
              value={draft.notes ?? ""}
              onChange={(e) => updateRecall({ notes: e.target.value })}
              className="mt-2 w-full rounded-md border border-line-strong bg-surface p-3 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>
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
                  (!checked && !frozen) ||
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
