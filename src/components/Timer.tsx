import React, { useState, useEffect, useRef } from 'react';
import { Problem } from '../data/problems';
import type { ProblemSessionRating, CodingOutcome } from '../types';
import { useStore } from '../store/useStore';
import { ExternalLink, CircleCheck, BookOpen, Timer as TimerIcon, Pause, Play, X, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { useProblemProgress } from '../hooks/useUserData';
import { getDifficultyColor } from '../utils/uiHelpers';
import { MAX_BACKDATE_HOURS, validateStartTimestamp } from '../utils/dateUtils';
import { canPersistTimer } from '../lib/safeStorage';

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
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const toTimeInputValue = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const parseTimeInputToTimestamp = (value: string): number | null => {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  const candidate = new Date();
  candidate.setHours(hour, minute, 0, 0);
  return candidate.getTime();
};

export const Timer: React.FC<TimerProps> = ({ problem, isNew, isColdSolve, onComplete }) => {
  const activeSession = useStore((state) => state.activeSession);
  const startSession = useStore((state) => state.startSession);
  const setSessionStartTimestamp = useStore((state) => state.setSessionStartTimestamp);
  const updateActiveSession = useStore((state) => state.updateActiveSession);
  const endSession = useStore((state) => state.endSession);
  const abandonSession = useStore((state) => state.abandonSession);
  const { progress, saveSession } = useProblemProgress();

  const [notes, setNotes] = useState(activeSession?.draftNotes ?? progress[problem.id]?.notes ?? '');
  const [codingOutcome, setCodingOutcome] = useState<Partial<CodingOutcome>>(activeSession?.completion?.codingOutcome ?? activeSession?.codingOutcome ?? {});
  const [phase, setPhase] = useState<'idle' | 'running' | 'rating'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [frozenElapsed, setFrozenElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showStartTimeEditor, setShowStartTimeEditor] = useState(false);
  const [manualStartTime, setManualStartTime] = useState('');
  const [startTimeError, setStartTimeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const notesEdited = useRef(activeSession?.draftNotes !== undefined);
  const [storageAvailable] = useState(canPersistTimer);
  useEffect(() => {
    if (!notesEdited.current && !activeSession?.completion) setNotes(progress[problem.id]?.notes ?? '');
  }, [progress[problem.id]?.notes]);
  // Total seconds that the timer was paused — subtracted from elapsed so only work time counts.
  const pausedSecondsRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);

  // If there's already an active session for this problem, pick it up (including pause state)
  useEffect(() => {
    if (activeSession && activeSession.problemId === problem.id) {
      if (activeSession.completion) {
        setFrozenElapsed(activeSession.completion.timing.elapsedSeconds);
        setNotes(activeSession.completion.notes ?? progress[problem.id]?.notes ?? '');
        setPhase('rating');
        return;
      }
      if (activeSession.finishedElapsed !== undefined) {
        setFrozenElapsed(activeSession.finishedElapsed);
        setPhase('rating');
        return;
      }
      pausedSecondsRef.current = activeSession.pausedSeconds ?? 0;
      pausedAtRef.current = activeSession.pausedAt ?? null;
      setIsPaused(activeSession.pausedAt != null);
      setPhase('running');
    }
  }, []); // eslint-disable-line

  // Tick every second — uses Date.now() math so it's drift-free.
  // Paused seconds are subtracted so elapsed = actual working time only.
  useEffect(() => {
    if (phase === 'running' && !isPaused && activeSession) {
      const tick = () => {
        const raw = Math.floor((Date.now() - activeSession.startTimestamp) / 1000);
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
      setStartTimeError('Select a valid time first.');
      return;
    }

    const validationError = validateStartTimestamp(parsedTimestamp);
    if (validationError) {
      setStartTimeError(validationError);
      return;
    }

    if (phase === 'idle') {
      startSession(problem.id, !isNew && !isColdSolve, isColdSolve ?? false, parsedTimestamp, useStore.getState().sessionReturnTo);
      setPhase('running');
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
    startSession(problem.id, !isNew && !isColdSolve, isColdSolve ?? false, Date.now(), useStore.getState().sessionReturnTo);
    setPhase('running');
    setShowStartTimeEditor(false);
    setStartTimeError(null);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      // Resuming: accumulate how long we were paused
      let nextPausedSeconds = pausedSecondsRef.current;
      if (pausedAtRef.current !== null) {
        nextPausedSeconds += Math.floor((Date.now() - pausedAtRef.current) / 1000);
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
      updateActiveSession({ pausedSeconds: pausedSecondsRef.current, pausedAt });
    }
  };

  const handleDone = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // If paused when Done is clicked, add remaining paused time first
    if (isPaused && pausedAtRef.current !== null) {
      pausedSecondsRef.current += Math.floor((Date.now() - pausedAtRef.current) / 1000);
    }
    const raw = activeSession
      ? Math.floor((Date.now() - activeSession.startTimestamp) / 1000)
      : elapsed;
    const finalElapsed = Math.max(0, raw - pausedSecondsRef.current);
    setFrozenElapsed(finalElapsed);

    pausedAtRef.current = null;
    setIsPaused(false);
    updateActiveSession({ pausedSeconds: pausedSecondsRef.current, pausedAt: null, finishedElapsed: finalElapsed });
    setPhase('rating');
  };

  const handleRating = async (rating: ProblemSessionRating) => {
    if (submittingRef.current || !activeSession) return;
    if (activeSession.completion && activeSession.completion.rating !== rating) return;
    if (!activeSession.completion && (!codingOutcome.correctness || !codingOutcome.assistance || !codingOutcome.explanation)) {
      setSubmitError('Record correctness, assistance, and explanation before saving your confidence.');
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    // Prefer cold_solve over review — cold solves may also carry isReview=false explicitly,
    // but never classify a cold solve as a spaced-repetition review.
    const sessionType = activeSession?.isColdSolve
      ? 'cold_solve'
      : activeSession?.isReview
        ? 'review'
        : 'new';

    const completion = activeSession.completion ?? {
      timing: {
        id: activeSession.id,
        problemId: problem.id,
        category: problem.category,
        date: new Date().toISOString(),
        elapsedSeconds: frozenElapsed,
        sessionType,
        rating,
      }, rating, notes: notesEdited.current ? notes : undefined,
      codingOutcome: codingOutcome as CodingOutcome, practiceKind: activeSession.practiceKind,
    };
    // Persist the exact attempted completion before sending. Retries after an
    // ambiguous timeout or a page reload retain both the operation ID and payload.
    updateActiveSession({ completion });
    try {
      await saveSession({
        operationId: completion.timing.id, problemId: problem.id,
        rating: completion.rating, notes: completion.notes, timing: completion.timing,
        codingOutcome: completion.codingOutcome, practiceKind: completion.practiceKind,
        additionalData: { elapsedSeconds: completion.timing.elapsedSeconds, sessionType: completion.timing.sessionType },
      });
      if (useStore.getState().activeSession?.id === completion.timing.id) {
        endSession();
        onComplete();
      }
    } catch {
      setSubmitError('Could not confirm your save. Your session is preserved. Retry to save it once.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'Escape') {
        if (phase === 'running' && !showCancelConfirm) {
          e.preventDefault();
          setShowCancelConfirm(true);
        } else if (showCancelConfirm) {
          e.preventDefault();
          setShowCancelConfirm(false);
        }
        return;
      }
      if (e.code === 'Space' || e.key === ' ') {
        if (phase === 'idle') {
          e.preventDefault();
          handleStart();
        } else if (phase === 'running' && !showCancelConfirm) {
          e.preventDefault();
          handlePauseResume();
        }
        return;
      }
      if (phase === 'running' && !showCancelConfirm && !isPaused && (e.key === 'Enter' || e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        handleDone();
        return;
      }
      if (phase === 'rating' && !isSubmitting) {
        const rating = Number(e.key) as ProblemSessionRating;
        if (rating >= 1 && rating <= 5) {
          e.preventDefault();
          void handleRating(rating);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, showCancelConfirm, isPaused, isSubmitting]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rating Screen ────────────────────────────────────────────────────────
  if (phase === 'rating') {
    const minutes = Math.floor(frozenElapsed / 60);
    const seconds = frozenElapsed % 60;
    const timeLabel = minutes > 0
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`;

    const existingNotes = progress[problem.id]?.notes;

    return (
      <div className="max-w-xl mx-auto mt-12 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="premium-card p-8 text-center">
          {/* Time taken banner */}
          <div className="mb-6 p-4 rounded-xl bg-muted-surface/60 border border-line-strong/50">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TimerIcon size={16} className="text-accent" />
              <span className="text-muted text-sm">Time spent</span>
            </div>
            <div className="font-mono text-4xl font-bold text-foreground tracking-tighter">
              {fmtTime(frozenElapsed)}
            </div>
            <div className="text-subtle text-xs mt-1">{timeLabel} elapsed</div>

          </div>

          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 border border-accent/20">
            <CircleCheck size={28} className="text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Session Complete</h2>
          {!storageAvailable && <p role="alert" className="text-warning text-sm mb-3">Your browser cannot preserve this timer after reload. Keep this tab open until saving finishes.</p>}
          <p className="text-muted mb-2 text-sm">
            Record what happened on <strong className="text-body">{problem.title}</strong>, then rate your confidence.
          </p>
          <p className="text-subtle text-xs mb-6">Independent passes need passing tests, no hints, and a clear explanation. These outcomes are self-reported.</p>
          <div className="space-y-3 text-left mb-6">
            {([
              { key: 'correctness', label: 'Correctness', options: [['passed', 'Passed the problem tests'], ['failed', 'Failed tests / incorrect'], ['unfinished', 'Unfinished — continue another day'], ['unchecked', 'Not checked against tests']] },
              { key: 'assistance', label: 'Assistance used', options: [['none', 'No hints or solution'], ['hint', 'Used hints'], ['solution', 'Read / followed the solution']] },
              { key: 'explanation', label: 'Can you explain why it works?', options: [['clear', 'Yes, including complexity and edge cases'], ['partial', 'Partly'], ['not_yet', 'Not yet']] },
            ] as const).map(({ key, label, options }) => <label key={key} className="block text-sm text-body">{label}
              <select aria-label={label} value={codingOutcome[key] ?? ''} disabled={isSubmitting || !!activeSession?.completion} onChange={e => {
                const next = { ...codingOutcome, [key]: e.target.value };
                setCodingOutcome(next); updateActiveSession({ codingOutcome: next as CodingOutcome }); setSubmitError(null);
              }} className="mt-2 w-full rounded-xl border border-line-strong bg-canvas p-3">
                <option value="">Select an outcome</option>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
              </select>
            </label>)}
          </div>

          <div className="mb-6 text-left">
            <label className="block text-sm font-medium text-body mb-2 flex items-center gap-2">
              <BookOpen size={16} className="text-accent" />
              Corrected Explanation / Key Insight (Optional)
            </label>
            {existingNotes && (
              <div className="mb-2 p-3 bg-accent/5 border border-accent/15 rounded-lg text-xs text-muted">
                <span className="text-accent font-medium">Previous: </span>{existingNotes}
              </div>
            )}
            <textarea
              value={notes}
              onChange={(e) => { notesEdited.current = true; setNotes(e.target.value); updateActiveSession({ draftNotes: e.target.value }); }}
              disabled={isSubmitting || !!activeSession?.completion}
              placeholder="Jot down the key trick or pattern for this problem..."
              className="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent/50 transition-colors resize-none h-20 text-sm"
            />
          </div>

          {submitError && (
            <div className="mb-4 flex items-start gap-2 p-3 text-left text-danger bg-danger/10 border border-danger/20 rounded-xl text-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="space-y-2">
            {(
              [
                { r: 5 as const, title: '5 — Automatic', hint: 'Very confident after this attempt.', tone: 'text-accent border-accent/30 bg-accent/10 hover:bg-accent/20' },
                { r: 4 as const, title: '4 — Strong', hint: 'Confident, with small slips.', tone: 'text-accent border-accent/30 bg-accent/10 hover:bg-accent/20' },
                { r: 3 as const, title: '3 — Acceptable', hint: 'Some confidence, still rough.', tone: 'text-accent border-accent/30 bg-accent/10 hover:bg-accent/20' },
                { r: 2 as const, title: '2 — Shaky', hint: 'Low confidence; needs practice.', tone: 'text-warning border-warning/30 bg-warning/10 hover:bg-warning/20' },
                { r: 1 as const, title: '1 — Could not', hint: 'Not confident yet.', tone: 'text-danger border-danger/30 bg-danger/10 hover:bg-danger/20' },
              ] as const
            ).map(({ r, title, hint, tone }) => (
              <button
                key={r}
                type="button"
                disabled={isSubmitting || (!!activeSession?.completion && activeSession.completion.rating !== r)}
                onClick={() => handleRating(r)}
                className={clsx(
                  'w-full border p-3 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 text-left transition-colors group cursor-pointer',
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : tone
                )}
              >
                <span className="font-semibold text-base group-hover:scale-[1.02] transition-transform">{title}</span>
                <span className="text-xs opacity-85 sm:text-right">{hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Idle / Running Screen ───────────────────────────────────────────────
  const displayElapsed = phase === 'running' ? elapsed : 0;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 pb-24 md:pb-8">
      {activeSession?.plannedMinutes && <div role="status" className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm text-body mb-5">
        {elapsed >= activeSession.plannedMinutes * 60 ? 'Your planned block is complete. You can finish and record an unfinished attempt to continue another day.' : `Today’s practice block: ${activeSession.plannedMinutes} minutes. Try independently before using a hint.`}
      </div>}
      {/* Sticky mobile focus chrome */}
      <div className="md:hidden sticky top-0 z-30 -mx-4 px-4 py-3 mb-4 border-b border-line/80 bg-canvas/95 backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{problem.title}</p>
          <p className="text-[11px] text-subtle">
            {phase === 'running' ? fmtTime(elapsed) : 'Ready'}
            {isPaused ? ' · paused' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {phase === 'idle' && (
            <button type="button" onClick={handleStart} className="px-3 py-2 rounded-lg border border-accent/40 text-accent hover:bg-accent/10 text-xs font-semibold">
              Start
            </button>
          )}
          {phase === 'running' && (
            <>
              <button type="button" onClick={handlePauseResume} className="px-3 py-2 rounded-lg bg-muted-surface text-body text-xs font-semibold border border-line-strong">
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button type="button" onClick={handleDone} disabled={isPaused} className="px-3 py-2 rounded-lg border border-accent/40 text-accent hover:bg-accent/10 disabled:opacity-40 text-xs font-semibold">
                Done
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{problem.title}</h1>
          <div className="flex gap-2 mt-2 text-sm">
            <span className="text-muted">{isColdSolve || activeSession?.isReview ? 'Independent attempt' : problem.category}</span>
            <span className="text-subtle">•</span>
            <span className={clsx('font-medium', getDifficultyColor(problem.difficulty))}>
              {problem.difficulty}
            </span>
            {isColdSolve && (
              <>
                <span className="text-subtle">•</span>
                <span className="text-accent font-medium">Cold Solve</span>
              </>
            )}
            {!isNew && !isColdSolve && (
              <>
                <span className="text-subtle">•</span>
                <span className="text-warning font-medium">Review</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href={problem.leetcodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-muted-surface hover:bg-hover-surface rounded-xl text-foreground transition-colors border border-line-strong/50 hover:border-line-strong"
          >
            <ExternalLink size={18} />
            <span className="hidden sm:inline">LeetCode</span>
          </a>
        </div>
      </div>

      <div className="premium-card p-8 md:p-12 text-center relative overflow-hidden">
        {/* The running state is also labeled below the status line. */}
        <div className="absolute top-0 left-0 h-1 bg-muted-surface w-full">
          {phase === 'running' && (
            <div className="h-full bg-accent" style={{ width: '100%' }} />
          )}
        </div>

        {/* Label */}
        <div className={clsx(
          "inline-flex items-center gap-2 text-sm font-medium mb-7 transition-colors",
          phase === 'running'
            ? "text-accent"
            : "text-muted"
        )}>
          <TimerIcon size={14} />
          {phase === 'idle' ? 'Ready to start' : 'Session in progress'}
        </div>

        {/* Stopwatch Display */}
        <div className="font-mono text-6xl sm:text-7xl md:text-8xl font-medium tabular-nums tracking-tight text-foreground mb-10">
          {fmtTime(displayElapsed)}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {phase === 'idle' ? (
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-accent hover:bg-accent-strong text-on-accent font-semibold text-base rounded-lg transition-colors flex items-center gap-3"
              >
                Start Session
              </button>
            ) : showCancelConfirm ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-sm font-medium text-danger flex items-center gap-2">
                  <AlertTriangle size={16} /> Discard this session? No progress will be saved.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-6 py-3 bg-muted-surface hover:bg-hover-surface text-body rounded-xl font-medium transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => {
                      abandonSession();
                      onComplete();
                    }}
                    className="px-6 py-3 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 font-semibold rounded-lg transition-colors"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={handlePauseResume}
                  className={clsx(
                    "w-12 h-12 flex items-center justify-center rounded-lg transition-colors border",
                    isPaused
                      ? "bg-accent/10 hover:bg-accent/20 border-accent/30 text-accent"
                      : "bg-muted-surface hover:bg-hover-surface border-line-strong text-body"
                  )}
                  title={isPaused ? 'Resume' : 'Pause'}
                  aria-label={isPaused ? 'Resume session' : 'Pause session'}
                >
                  {isPaused ? <Play size={18} className="fill-current ml-0.5" /> : <Pause size={18} className="fill-current" />}
                </button>

                <button
                  onClick={handleDone}
                  disabled={isPaused}
                  className="px-8 py-3 bg-accent hover:bg-accent-strong disabled:opacity-40 disabled:cursor-not-allowed text-on-accent font-semibold rounded-lg min-h-12 transition-colors flex items-center gap-2"
                >
                  <CircleCheck size={20} />
                  I'm Done
                </button>

                <button
                  onClick={() => {
                    setShowStartTimeEditor(false);
                    setStartTimeError(null);
                    setShowCancelConfirm(true);
                  }}
                  className="px-4 py-3 hover:bg-danger/10 text-muted hover:text-danger rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <X size={18} />
                  Cancel
                </button>
              </>
            )}
          </div>

          {phase === 'idle' && !showStartTimeEditor && (
            <button
              type="button"
              onClick={openStartTimeEditor}
              className="text-xs sm:text-sm text-accent/90 hover:text-accent underline underline-offset-2 transition-colors"
            >
              Started earlier? Enter start time
            </button>
          )}

          {phase === 'running' && !showCancelConfirm && !showStartTimeEditor && (
            <button
              type="button"
              onClick={openStartTimeEditor}
              className="text-xs sm:text-sm text-muted hover:text-body underline underline-offset-2 transition-colors"
            >
              Adjust start time
            </button>
          )}

          {showStartTimeEditor && !showCancelConfirm && (
            <div className="w-full max-w-md rounded-xl border border-line-strong/60 bg-canvas/70 p-4 text-left">
              <label htmlFor="manual-start-time" className="text-sm font-medium text-body">
                Session start time (today)
              </label>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <input
                  id="manual-start-time"
                  type="time"
                  step={60}
                  value={manualStartTime}
                  onChange={(e) => {
                    setManualStartTime(e.target.value);
                    setStartTimeError(null);
                  }}
                  className="flex-1 bg-surface border border-line-strong rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent/50"
                />
                <button
                  type="button"
                  onClick={applyManualStartTime}
                  className="px-4 py-2 bg-accent hover:bg-accent-strong text-on-accent font-semibold rounded-lg transition-colors"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStartTimeEditor(false);
                    setStartTimeError(null);
                  }}
                  className="px-4 py-2 bg-muted-surface hover:bg-hover-surface text-body font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
              {startTimeError && (
                <p className="mt-2 text-xs text-danger">{startTimeError}</p>
              )}
              <p className="mt-2 text-[11px] text-subtle">
                Start time must be in the past. Backdating is limited to {MAX_BACKDATE_HOURS} hours.
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 text-subtle text-sm max-w-md mx-auto leading-relaxed">
          {phase === 'idle' && (
            <span>Open the problem in LeetCode, then start. Shortcuts: Space to start · Enter/D when done · Esc to cancel.</span>
          )}
          {phase === 'running' && isPaused && (
            <span className="text-warning/80">Timer paused. Space resumes · Esc cancels.</span>
          )}
          {phase === 'running' && !isPaused && isColdSolve && (
            <span>Cold Solve: No hints, no videos. Test your true retention. Space pauses · Enter finishes.</span>
          )}
          {phase === 'running' && !isPaused && !isColdSolve && (
            <span>Work at your own pace. Space pauses · Enter finishes · Esc cancels.</span>
          )}
        </div>
      </div>
    </div>
  );
};
