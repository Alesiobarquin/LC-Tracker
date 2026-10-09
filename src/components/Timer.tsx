import { TraceIndex } from "./ui/StudyTrace";
import React, { useState, useEffect, useRef } from "react";
import { Problem } from "../data/problems";
import type { ProblemSessionRating, CodingOutcome } from "../types";
import { isIndependentPass, UNSEEN_CHECK_MINUTES } from "../utils/study";
import { useStore } from "../store/useStore";
import {
  ExternalLink,
  CircleCheck,
  Timer as TimerIcon,
  Pause,
  Play,
  AlertTriangle,
} from "lucide-react";
import { clsx } from "clsx";
import { useProblemProgress } from "../hooks/useUserData";
import { getDifficultyColor } from "../utils/uiHelpers";
import { MAX_BACKDATE_HOURS, validateStartTimestamp } from "../utils/dateUtils";
import { canPersistTimer } from "../lib/safeStorage";
import { TimeSpentInput } from "./TimeSpentInput";
import { parseTimeSpent } from "../utils/sessionTime";

interface TimerProps {
  problem: Problem;
  isNew: boolean;
  isColdSolve?: boolean;
  onComplete: () => void;
}

/** Format seconds → MM:SS */
const fmtTime = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const toTimeInputValue = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const parseTimeInputToTimestamp = (value: string): number | null => {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hourStr, minuteStr] = value.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  const candidate = new Date();
  candidate.setHours(hour, minute, 0, 0);
  return candidate.getTime();
};

export const Timer: React.FC<TimerProps> = ({
  problem,
  isNew,
  isColdSolve,
  onComplete,
}) => {
  const activeSession = useStore((state) => state.activeSession);
  const blindCheck = activeSession?.practiceKind === "variant";
  const startSession = useStore((state) => state.startSession);
  const setSessionStartTimestamp = useStore(
    (state) => state.setSessionStartTimestamp,
  );
  const updateActiveSession = useStore((state) => state.updateActiveSession);
  const endSession = useStore((state) => state.endSession);
  const abandonSession = useStore((state) => state.abandonSession);
  const { progress, saveSession } = useProblemProgress();

  const [notes, setNotes] = useState(
    activeSession?.draftNotes ?? progress[problem.id]?.notes ?? "",
  );
  const [codingOutcome, setCodingOutcome] = useState<Partial<CodingOutcome>>(
    activeSession?.completion?.codingOutcome ??
      activeSession?.codingOutcome ??
      {},
  );
  const [confidenceRating, setConfidenceRating] = useState<ProblemSessionRating | undefined>(
    activeSession?.completion
      ? activeSession.completion.confidenceReported === false
        ? undefined
        : activeSession.completion.rating
      : activeSession?.confidenceRating,
  );
  const independent = isIndependentPass(codingOutcome as CodingOutcome);
  const outcomeComplete = Boolean(
    codingOutcome.correctness && codingOutcome.assistance && codingOutcome.explanation,
  );
  const changeOutcome = (next: Partial<CodingOutcome>) => {
    setCodingOutcome(next);
    updateActiveSession({ codingOutcome: next });
    setSubmitError(null);
  };
  const [phase, setPhase] = useState<"idle" | "running" | "rating">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [frozenElapsed, setFrozenElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showStartTimeEditor, setShowStartTimeEditor] = useState(false);
  const [manualStartTime, setManualStartTime] = useState("");
  const [startTimeError, setStartTimeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const notesEdited = useRef(activeSession?.draftNotes !== undefined);
  const [storageAvailable] = useState(canPersistTimer);
  useEffect(() => {
    if (!notesEdited.current && !activeSession?.completion)
      setNotes(progress[problem.id]?.notes ?? "");
  }, [progress[problem.id]?.notes]);
  // Total seconds that the timer was paused — subtracted from elapsed so only work time counts.
  const pausedSecondsRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);

  // If there's already an active session for this problem, pick it up (including pause state)
  useEffect(() => {
    if (activeSession && activeSession.problemId === problem.id) {
      if (activeSession.completion) {
        setFrozenElapsed(activeSession.completion.timing.elapsedSeconds);
        setNotes(
          activeSession.completion.notes ?? progress[problem.id]?.notes ?? "",
        );
        setPhase("rating");
        return;
      }
      if (activeSession.finishedElapsed !== undefined) {
        setFrozenElapsed(activeSession.finishedElapsed);
        setPhase("rating");
        return;
      }
      pausedSecondsRef.current = activeSession.pausedSeconds ?? 0;
      pausedAtRef.current = activeSession.pausedAt ?? null;
      setIsPaused(activeSession.pausedAt != null);
      setPhase("running");
    }
  }, []); // eslint-disable-line

  // Tick every second — uses Date.now() math so it's drift-free.
  // Paused seconds are subtracted so elapsed = actual working time only.
  useEffect(() => {
    if (phase === "running" && !isPaused && activeSession) {
      const tick = () => {
        const raw = Math.floor(
          (Date.now() - activeSession.startTimestamp) / 1000,
        );
        setElapsed(Math.max(0, raw - pausedSecondsRef.current));
      };
      tick();
      intervalRef.current = window.setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, isPaused, activeSession]);

  const computeElapsedFromStart = (startTimestamp: number) => {
    const raw = Math.floor((Date.now() - startTimestamp) / 1000);
    const currentPauseSeconds =
      isPaused && pausedAtRef.current !== null
        ? Math.floor((Date.now() - pausedAtRef.current) / 1000)
        : 0;

    return Math.max(0, raw - pausedSecondsRef.current - currentPauseSeconds);
  };

  const openStartTimeEditor = () => {
    const fallbackTimestamp = Date.now() - 5 * 60 * 1000;
    const seedTimestamp = activeSession?.startTimestamp ?? fallbackTimestamp;
    setManualStartTime(toTimeInputValue(seedTimestamp));
    setStartTimeError(null);
    setShowStartTimeEditor(true);
  };

  const applyManualStartTime = () => {
    const parsedTimestamp = parseTimeInputToTimestamp(manualStartTime);
    if (parsedTimestamp === null) {
      setStartTimeError("Select a valid time first.");
      return;
    }

    const validationError = validateStartTimestamp(parsedTimestamp);
    if (validationError) {
      setStartTimeError(validationError);
      return;
    }

    if (phase === "idle") {
      startSession(
        problem.id,
        !isNew && !isColdSolve,
        isColdSolve ?? false,
        parsedTimestamp,
        useStore.getState().sessionReturnTo,
      );
      setPhase("running");
      setIsPaused(false);
      pausedSecondsRef.current = 0;
      pausedAtRef.current = null;
    } else {
      setSessionStartTimestamp(parsedTimestamp);
    }

    setElapsed(computeElapsedFromStart(parsedTimestamp));
    setStartTimeError(null);
    setShowStartTimeEditor(false);
  };

  const handleStart = () => {
    startSession(
      problem.id,
      !isNew && !isColdSolve,
      isColdSolve ?? false,
      Date.now(),
      useStore.getState().sessionReturnTo,
    );
    setPhase("running");
    setShowStartTimeEditor(false);
    setStartTimeError(null);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      // Resuming: accumulate how long we were paused
      let nextPausedSeconds = pausedSecondsRef.current;
      if (pausedAtRef.current !== null) {
        nextPausedSeconds += Math.floor(
          (Date.now() - pausedAtRef.current) / 1000,
        );
        pausedSecondsRef.current = nextPausedSeconds;
        pausedAtRef.current = null;
      }
      setIsPaused(false);
      updateActiveSession({ pausedSeconds: nextPausedSeconds, pausedAt: null });
    } else {
      // Pausing: record when we paused
      const pausedAt = Date.now();
      pausedAtRef.current = pausedAt;
      setIsPaused(true);
      updateActiveSession({
        pausedSeconds: pausedSecondsRef.current,
        pausedAt,
      });
    }
  };

  const handleDone = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // If paused when Done is clicked, add remaining paused time first
    if (isPaused && pausedAtRef.current !== null) {
      pausedSecondsRef.current += Math.floor(
        (Date.now() - pausedAtRef.current) / 1000,
      );
    }
    const raw = activeSession
      ? Math.floor((Date.now() - activeSession.startTimestamp) / 1000)
      : elapsed;
    const finalElapsed = Math.max(0, raw - pausedSecondsRef.current);
    setFrozenElapsed(finalElapsed);

    pausedAtRef.current = null;
    setIsPaused(false);
    updateActiveSession({
      pausedSeconds: pausedSecondsRef.current,
      pausedAt: null,
      finishedElapsed: finalElapsed,
    });
    setPhase("rating");
  };

  const handleSave = async () => {
    if (submittingRef.current || !activeSession) return;
    const correctedElapsed = activeSession.timeSpentDraft
      ? parseTimeSpent(activeSession.timeSpentDraft)
      : frozenElapsed;
    if (!activeSession.completion && correctedElapsed === null) {
      setSubmitError("Enter a valid time spent before saving.");
      return;
    }
    if (!activeSession.completion && !outcomeComplete) {
      setSubmitError("Choose a result and answer the follow-ups before saving.");
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    // Prefer cold_solve over review — cold solves may also carry isReview=false explicitly,
    // but never classify a cold solve as a spaced-repetition review.
    const sessionType = activeSession?.isColdSolve
      ? "cold_solve"
      : activeSession?.isReview
        ? "review"
        : "new";

    // The legacy numeric field remains required by the database. An unreported
    // placeholder is marked in history and never displayed as self-confidence.
    // Scheduling uses the coding outcome, so this value does not change intervals.
    const rating = confidenceRating ?? 3;
    const completion = activeSession.completion ?? {
      timing: {
        id: activeSession.id,
        problemId: problem.id,
        category: problem.category,
        date: new Date().toISOString(),
        elapsedSeconds: correctedElapsed ?? frozenElapsed,
        sessionType,
        rating,
      },
      rating,
      confidenceReported: confidenceRating !== undefined,
      notes: notesEdited.current ? notes : undefined,
      codingOutcome: codingOutcome as CodingOutcome,
      practiceKind: activeSession.practiceKind,
    };
    // Persist the exact attempted completion before sending. Retries after an
    // ambiguous timeout or a page reload retain both the operation ID and payload.
    updateActiveSession({ completion });
    try {
      await saveSession({
        operationId: completion.timing.id,
        problemId: problem.id,
        rating: completion.rating,
        notes: completion.notes,
        timing: completion.timing,
        codingOutcome: completion.codingOutcome,
        practiceKind: completion.practiceKind,
        additionalData: {
          ...(completion.confidenceReported !== undefined
            ? { confidenceReported: completion.confidenceReported }
            : {}),
          elapsedSeconds: completion.timing.elapsedSeconds,
          sessionType: completion.timing.sessionType,
        },
      });
      if (useStore.getState().activeSession?.id === completion.timing.id) {
        endSession();
        onComplete();
      }
    } catch {
      setSubmitError(
        "Could not confirm your save. Your session is preserved. Retry to save it once.",
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "Escape") {
        if (phase === "running" && !showCancelConfirm) {
          e.preventDefault();
          setShowCancelConfirm(true);
        } else if (showCancelConfirm) {
          e.preventDefault();
          setShowCancelConfirm(false);
        }
        return;
      }
      if (e.code === "Space" || e.key === " ") {
        if (phase === "idle") {
          e.preventDefault();
          handleStart();
        } else if (phase === "running" && !showCancelConfirm) {
          e.preventDefault();
          handlePauseResume();
        }
        return;
      }
      if (
        phase === "running" &&
        !showCancelConfirm &&
        !isPaused &&
        (e.key === "Enter" || e.key === "d" || e.key === "D")
      ) {
        e.preventDefault();
        handleDone();
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, showCancelConfirm, isPaused, isSubmitting]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rating Screen ────────────────────────────────────────────────────────
  if (phase === "rating") {
    return (
      <div className="timer-assessment animate-in">
        <div className="timer-assessment-body">
          <div className="mb-6 border-b border-line pb-5">
            <TimeSpentInput
              timerSeconds={activeSession?.completion?.timing.elapsedSeconds ?? frozenElapsed}
              draft={activeSession?.completion ? undefined : activeSession?.timeSpentDraft}
              disabled={isSubmitting || !!activeSession?.completion}
              onChange={(timeSpentDraft) => {
                updateActiveSession({ timeSpentDraft });
                setSubmitError(null);
              }}
            />
          </div>

          <p className="register-label mb-3">02 / Record the outcome</p>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Session Complete
          </h2>
          {!storageAvailable && (
            <p role="alert" className="text-warning text-sm mb-3">
              Your browser cannot preserve this timer after reload. Keep this
              tab open until saving finishes.
            </p>
          )}
          <p className="text-muted mb-2 text-sm">
            How did <strong className="text-body">{problem.title}</strong> go?
          </p>
          <p className="text-subtle text-xs mb-6">
            Timer stopped. Your result sets the next review.
          </p>
          <fieldset disabled={isSubmitting || !!activeSession?.completion} className="mb-5">
            <legend className="sr-only">Session result</legend>
            <div className="grid grid-cols-2 gap-2 text-left">
              {([
                { value: "independent", title: "Solved independently", hint: "Tests passed, no hints or solution; I can explain correctness, complexity, and edge cases.", correctness: "passed" },
                { value: "passed", title: "Passed with help or gaps", hint: "Used help or need a better explanation.", correctness: "passed" },
                { value: "unfinished", title: "Not finished", hint: "Continue in another block.", correctness: "unfinished" },
                { value: "failed", title: "Tests failed", hint: "The solution needs a fix.", correctness: "failed" },
                { value: "unchecked", title: "Not tested", hint: "Correctness is still unknown.", correctness: "unchecked" },
              ] as const).map(({ value, title, hint, correctness }) => {
                const selected = value === (independent ? "independent" : codingOutcome.correctness);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      if (!selected) changeOutcome(value === "independent"
                        ? { correctness: "passed", assistance: "none", explanation: "clear" }
                        : { correctness });
                    }}
                    className={clsx(
                      "rounded-md border p-3 text-left transition-colors disabled:cursor-default",
                      value === "independent" && "col-span-2",
                      selected ? "border-accent bg-accent/10" : "border-line hover:bg-surface",
                    )}
                  >
                    <span className="block text-sm font-medium text-foreground">{title}</span>
                    <span className="block text-xs text-muted mt-1">{hint}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {codingOutcome.correctness && !independent && (
            <fieldset disabled={isSubmitting || !!activeSession?.completion} className="space-y-4 mb-5">
              <legend className="sr-only">Result details</legend>
              <div>
                <label htmlFor="coding-assistance" className="block text-sm text-body mb-2">Assistance used</label>
                <select
                  id="coding-assistance"
                  value={codingOutcome.assistance ?? ""}
                  onChange={(e) => changeOutcome({ ...codingOutcome, assistance: e.target.value as CodingOutcome["assistance"] })}
                  className="w-full rounded-md border border-line-strong bg-canvas p-2.5 text-sm"
                >
                  <option value="">Choose assistance</option>
                  <option value="none">No hints or solution</option>
                  <option value="hint">Used hints</option>
                  <option value="solution">Read / followed the solution</option>
                </select>
              </div>
              <div>
                <label htmlFor="coding-explanation" className="block text-sm text-body mb-2">Can you explain why it works?</label>
                <select
                  id="coding-explanation"
                  value={codingOutcome.explanation ?? ""}
                  onChange={(e) => changeOutcome({ ...codingOutcome, explanation: e.target.value as CodingOutcome["explanation"] })}
                  className="w-full rounded-md border border-line-strong bg-canvas p-2.5 text-sm"
                >
                  <option value="">Choose explanation</option>
                  <option value="clear">Yes, including complexity and edge cases</option>
                  <option value="partial">Partly</option>
                  <option value="not_yet">Not yet</option>
                </select>
              </div>
            </fieldset>
          )}

          <details className="mb-5 text-left" open={notesEdited.current || activeSession?.completion?.notes !== undefined || confidenceRating !== undefined || undefined}>
            <summary className="quiet-action cursor-pointer py-2">Notes & confidence (optional)</summary>
            <div className="space-y-4 pt-3">
              <div>
                <label htmlFor="session-notes" className="block text-sm text-body mb-2">Key insight or corrected explanation</label>
                <textarea
                  id="session-notes"
                  value={notes}
                  onChange={(e) => {
                    notesEdited.current = true;
                    setNotes(e.target.value);
                    updateActiveSession({ draftNotes: e.target.value });
                  }}
                  disabled={isSubmitting || !!activeSession?.completion}
                  placeholder="Jot down the key trick or pattern for this problem..."
                  className="w-full bg-canvas border border-line rounded-md px-3 py-2 text-foreground resize-none h-20 text-sm"
                />
              </div>
              <div>
                <label htmlFor="session-confidence" className="block text-sm text-body mb-2">Confidence (optional)</label>
                <select
                  id="session-confidence"
                  value={confidenceRating ?? ""}
                  disabled={isSubmitting || !!activeSession?.completion}
                  onChange={(e) => {
                    const next = e.target.value ? Number(e.target.value) as ProblemSessionRating : undefined;
                    setConfidenceRating(next);
                    updateActiveSession({ confidenceRating: next });
                  }}
                  className="w-full rounded-md border border-line-strong bg-canvas p-2.5 text-sm"
                >
                  <option value="">Skip confidence rating</option>
                  <option value="5">5 — Automatic</option>
                  <option value="4">4 — Strong</option>
                  <option value="3">3 — Acceptable</option>
                  <option value="2">2 — Shaky</option>
                  <option value="1">1 — Could not</option>
                </select>
                <p className="text-xs text-subtle mt-2">For your own history. Review timing uses your result.</p>
              </div>
            </div>
          </details>

          {submitError && (
            <div role="alert" className="mb-4 flex items-start gap-2 p-3 text-left text-danger bg-danger/10 border border-danger/20 rounded-md text-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSubmitting || (!activeSession?.completion && (!outcomeComplete ||
              (!!activeSession?.timeSpentDraft && parseTimeSpent(activeSession.timeSpentDraft) === null)))}
            className="brand-button-primary w-full rounded-md px-4 py-3 text-sm font-medium disabled:opacity-40"
          >
            {isSubmitting ? "Saving…" : activeSession?.completion ? "Retry save" : "Save & continue"}
          </button>
          <p className="text-xs text-subtle mt-3">Self-reported result; the app does not grade your code.</p>
        </div>
      </div>
    );
  }

  // ── Idle / Running Screen ───────────────────────────────────────────────
  const displayElapsed = phase === "running" ? elapsed : 0;
  const rulerStepMinutes = Math.max(
    5,
    Math.ceil(
      Math.max(displayElapsed / 60, activeSession?.plannedMinutes ?? 0) / 60,
    ) * 5,
  );

  return (
    <div className="timer-workspace mx-auto animate-in pb-8">
      <header className="page-heading flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="register-label mb-3">01 / Independent coding</p>
          <h1 className="text-[28px] sm:text-[34px] font-medium tracking-[-0.045em]">
            {problem.title}
          </h1>
          <div className="flex flex-wrap gap-2 text-xs text-muted mt-3">
            {blindCheck ? (
              <span>Unfamiliar check · topic hidden</span>
            ) : (
              <>
                <span>{problem.category}</span>
                <span className="text-line-strong">/</span>
                <span className={getDifficultyColor(problem.difficulty)}>
                  {problem.difficulty}
                </span>
              </>
            )}
            {isColdSolve && <span>· Cold Solve</span>}
            {!isNew && !isColdSolve && <span>· Review</span>}
          </div>
        </div>
        <a
          href={problem.leetcodeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="quiet-action shrink-0"
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline">LeetCode</span>
        </a>
      </header>
      {!storageAvailable && (
        <p role="alert" className="text-warning text-sm mb-4">
          Your browser cannot preserve this timer after reload. Keep this tab
          open until saving finishes.
        </p>
      )}
      {activeSession?.plannedMinutes && (
        <div
          role="status"
          className="border-l-2 border-accent bg-accent/5 px-4 py-3 text-xs leading-relaxed text-body mb-6"
        >
          {elapsed >= activeSession.plannedMinutes * 60
            ? "Your planned block is complete. You can finish and record an unfinished attempt to continue another day."
            : `Today’s practice block: ${activeSession.plannedMinutes} minutes. Try independently before using a hint.`}
        </div>
      )}
      <div className="timer-console">
        <section className="timer-console-body" aria-label="Coding timer">
          <div className="flex items-center justify-between gap-4">
            <span className="flex gap-3 items-center">
              <TraceIndex active={phase === "running" && !isPaused}>
                {phase === "running" ? "C" : "01"}
              </TraceIndex>
              <span className="text-xs text-muted">
                {phase === "idle"
                  ? "Ready to start"
                  : isPaused
                    ? "Timer paused"
                    : "Session in progress"}
              </span>
            </span>
            <span className="text-[10px] font-mono text-subtle">
              {phase === "running" ? "Draft saved locally" : "Code on LeetCode"}
            </span>
          </div>
          <div
            className="timer-display"
            aria-label={`${fmtTime(displayElapsed)} elapsed`}
          >
            <span>{fmtTime(displayElapsed).split(":")[0]}</span>
            <span className="timer-seconds">
              :{fmtTime(displayElapsed).split(":").slice(1).join(":")}
            </span>
          </div>
          <div className="timer-ruler" aria-hidden="true">
            {Array.from({ length: 13 }, (_, i) => (
              <span
                key={i}
                className={
                  displayElapsed >= i * rulerStepMinutes * 60 ? "is-used" : ""
                }
              >
                <i />
                {i % 3 === 0 && <small>{i * rulerStepMinutes}</small>}
              </span>
            ))}
          </div>
          <p className="font-mono text-[9px] text-subtle mt-3 mb-6">
            Elapsed minutes /{" "}
            {activeSession?.plannedMinutes
              ? `${activeSession.plannedMinutes} min planned block`
              : "Independent attempt"}
          </p>
          {blindCheck && (
            <p className="text-xs text-muted mb-5" role="status">
              {displayElapsed >=
              (activeSession?.plannedMinutes ?? UNSEEN_CHECK_MINUTES) * 60
                ? "Your check block has ended. Record the current result; unfinished work can continue later."
                : `Work without notes, hints, or topic tags. Use this ${activeSession?.plannedMinutes ?? UNSEEN_CHECK_MINUTES}-minute block to code, test, and explain. A short block can end unfinished.`}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {phase === "idle" ? (
              <button
                onClick={handleStart}
                className="brand-button-primary px-5 py-3 rounded-md text-sm font-medium"
              >
                Start Session
              </button>
            ) : showCancelConfirm ? (
              <div className="space-y-4">
                <p className="text-sm text-danger">
                  Discard this session? No progress will be saved.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="brand-button-secondary px-4 py-2.5 rounded-md text-sm"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => {
                      abandonSession();
                      onComplete();
                    }}
                    className="px-4 py-2.5 border border-danger/30 text-danger rounded-md text-sm"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={handlePauseResume}
                  title={isPaused ? "Resume" : "Pause"}
                  aria-label={isPaused ? "Resume session" : "Pause session"}
                  className="brand-button-secondary min-w-11 min-h-11 rounded-md flex items-center justify-center"
                >
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                </button>
                <button
                  onClick={handleDone}
                  disabled={isPaused}
                  className="brand-button-primary inline-flex gap-2 items-center px-5 py-3 rounded-md text-sm font-medium disabled:opacity-40"
                >
                  <CircleCheck size={16} />
                  I'm Done
                </button>
                <button
                  onClick={() => {
                    setShowStartTimeEditor(false);
                    setStartTimeError(null);
                    setShowCancelConfirm(true);
                  }}
                  className="quiet-action ml-2"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
          {!showStartTimeEditor && !showCancelConfirm && (
            <button
              onClick={openStartTimeEditor}
              className="quiet-action text-subtle mt-5"
            >
              {phase === "idle"
                ? "Started earlier? Enter start time"
                : "Adjust start time"}
            </button>
          )}
          {showStartTimeEditor && !showCancelConfirm && (
            <div className="mt-5 border-t border-line pt-5">
              <label htmlFor="manual-start-time" className="text-xs text-body">
                Session start time (today)
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  id="manual-start-time"
                  type="time"
                  step={60}
                  value={manualStartTime}
                  onChange={(e) => {
                    setManualStartTime(e.target.value);
                    setStartTimeError(null);
                  }}
                  className="bg-surface border border-line rounded-md px-3 py-2 text-sm min-w-0"
                />
                <button
                  onClick={applyManualStartTime}
                  className="brand-button-primary px-4 py-2 rounded-md text-xs"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setShowStartTimeEditor(false);
                    setStartTimeError(null);
                  }}
                  className="quiet-action"
                >
                  Cancel
                </button>
              </div>
              {startTimeError && (
                <p className="text-danger text-xs mt-2">{startTimeError}</p>
              )}
              <p className="text-[10px] text-subtle mt-2">
                Start time must be in the past. Backdating is limited to{" "}
                {MAX_BACKDATE_HOURS} hours.
              </p>
            </div>
          )}
        </section>
        <aside className="timer-console-rail">
          <p className="register-label mb-4">Session protocol</p>
          <ol className="protocol-track text-xs text-muted leading-relaxed">
            <li>
              <span className="text-foreground block mb-1">Implement</span>Try
              the problem independently before using a hint or solution.
            </li>
            <li>
              <span className="text-foreground block mb-1">Test & explain</span>
              Check correctness, complexity, and edge cases.
            </li>
            <li>
              <span className="text-foreground block mb-1">Record</span>Save the
              result. Notes and confidence are optional.
            </li>
          </ol>
          <div className="border-t border-line mt-6 pt-4 space-y-2 text-[10px] font-mono text-subtle">
            <p>
              <kbd>Space</kbd> {phase === "idle" ? "Start" : "Pause / resume"}
            </p>
            <p>
              <kbd>Enter</kbd> Finish
            </p>
            <p>
              <kbd>Esc</kbd> Cancel
            </p>
          </div>
          <p className="text-[10px] text-subtle leading-relaxed mt-5">
            An unfinished attempt can continue in another practice block.
          </p>
        </aside>
      </div>
    </div>
  );
};
