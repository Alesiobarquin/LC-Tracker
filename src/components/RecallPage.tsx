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
import {
  hasProblemReference,
  type ReferenceLanguage,
} from "../data/problemReferences";
import { ProblemExplanation, ExplanationLinks } from "./ProblemExplanation";
import { ReferenceCode } from "./ReferenceCode";
import {
  parsePersonalExplanation,
  formatPersonalExplanation,
} from "../utils/personalExplanation";

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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const submitting = useRef(false);
  const closed = useRef(false);
  const recordSection = useRef<HTMLElement>(null);
  useEffect(() => {
    if (draft?.compared) recordSection.current?.focus();
  }, [draft?.compared]);
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
      !activeSession &&
      !closed.current
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
    if (!draft || submitting.current || (!draft.compared && !draft.completion))
      return;
    const originalAnswer = draft.retrievedAnswer ?? draft.answer;
    if (outcome !== "forgot" && !originalAnswer.trim()) {
      setSaveError(
        "Your original attempt was empty. Record Forgot; a correction after comparison does not count as unaided recall.",
      );
      return;
    }
    if ((draft.notes?.length ?? 0) > 20000) {
      setSaveError(
        "Keep your personal explanation and code within 20,000 characters.",
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
        answer: originalAnswer,
        ...(originalAnswer !== draft.answer
          ? { revisedAnswer: draft.answer }
          : {}),
        checkedAgainst: draft.checkedAgainst,
      },
      notes: draft.notes,
    };
    updateRecall({ completion });
    try {
      await saveRecall({ problemId: draft.problemId, ...completion });
      closed.current = true;
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
  const compared = !!draft.compared || frozen;
  const parsedPersonal = parsePersonalExplanation(
    draft.notes ?? progress[problem.id].notes ?? "",
  );
  const personal = {
    ...parsedPersonal,
    language: draft.notesLanguage ?? parsedPersonal.language,
  };
  function revealReference() {
    if (!draft || draft.revealed) return;
    updateRecall({
      revealed: true,
      retrievedAnswer: draft.answer,
      notes: progress[problem!.id].notes ?? "",
      checkedAgainst: progress[problem!.id].notes
        ? "notes"
        : hasProblemReference(problem!.id)
          ? "solution"
          : "external",
    });
  }
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
              disabled={frozen}
              onChange={(e) => updateRecall({ answer: e.target.value })}
              placeholder="Write what you remember without opening your notes or the solution."
              className="notebook-answer w-full text-foreground font-mono text-sm placeholder:text-subtle"
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
          onClick={() => {
            closed.current = true;
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
          <label className="block text-sm text-body">
            Explanation to compare against
            <select
              aria-label="Reference used"
              value={draft.checkedAgainst}
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
              {hasProblemReference(problem.id) && (
                <option value="solution">Built-in problem explanation</option>
              )}
              <option value="notes">My explanation · edit or replace</option>
              <option value="external">
                LeetCode / video / external reference
              </option>
              {lesson && (
                <option value="reference">General pattern guidance</option>
              )}
            </select>
          </label>
          {draft.checkedAgainst === "solution" && (
            <ProblemExplanation problem={problem} />
          )}
          {draft.checkedAgainst === "notes" && (
            <div className="personal-explanation space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Your explanation
              </h3>
              <p className="text-xs text-muted">
                Write the logic in your own words. This replaces the built-in
                text when you revisit this problem. Changes save with your
                recall outcome.
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
              {!frozen && hasProblemReference(problem.id) && (
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
          <p className="text-sm text-muted">
            Check the approach, correctness argument, complexity, and edge
            cases. This is a self-check; the app does not automatically grade
            your answer.
          </p>
          {!compared && (
            <div className="comparison-next space-y-3">
              <p className="text-sm text-body">
                Compare the reference with your original answer, identify the
                gaps, then record what you recalled.
              </p>
              <button
                className={button}
                onClick={() => updateRecall({ compared: true })}
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
          className="recall-stage recall-record space-y-4"
          aria-label="Record recall outcome"
        >
          <SectionHeading index="03" title="Record what you recalled" />
          <p className="text-sm text-muted">
            Rate your original answer from memory. Reading or correcting the
            explanation does not count as unaided recall or a coding pass.
          </p>
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
