import React, { useState, useEffect, useRef } from 'react';
import { Problem } from '../data/problems';
import type { ProblemSessionRating } from '../types';
import { useStore } from '../store/useStore';
import { ExternalLink, CircleCheck, BookOpen, Timer as TimerIcon, Trophy, Pause, Play, X, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { useProblemProgress, useSessionTimings } from '../hooks/useUserData';

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

const MAX_BACKDATE_HOURS = 12;

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
  const endSession = useStore((state) => state.endSession);
  const abandonSession = useStore((state) => state.abandonSession);
  const { progress, logProblem } = useProblemProgress();
  const { personalBestTimes, recordSession } = useSessionTimings();

  const [notes, setNotes] = useState(progress[problem.id]?.notes || '');
  const [phase, setPhase] = useState<'idle' | 'running' | 'rating'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [frozenElapsed, setFrozenElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const [isNewPB, setIsNewPB] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showStartTimeEditor, setShowStartTimeEditor] = useState(false);
  const [manualStartTime, setManualStartTime] = useState('');
  const [startTimeError, setStartTimeError] = useState<string | null>(null);
  // Total seconds that the timer was paused — subtracted from elapsed so only work time counts.
  const pausedSecondsRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);

  // If there's already an active session for this problem, pick it up
  useEffect(() => {
    if (activeSession && activeSession.problemId === problem.id) {
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

  const validateStartTimestamp = (startTimestamp: number): string | null => {
    const now = Date.now();
    if (startTimestamp >= now) {
      return 'Start time must be in the past.';
    }
    const maxBackdateMs = MAX_BACKDATE_HOURS * 60 * 60 * 1000;
    if (now - startTimestamp > maxBackdateMs) {
      return `Start time can be backdated up to ${MAX_BACKDATE_HOURS} hours.`;
    }
    return null;
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
      startSession(problem.id, !isNew && !isColdSolve, isColdSolve ?? false, parsedTimestamp);
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
    startSession(problem.id, !isNew && !isColdSolve, isColdSolve ?? false);
    setPhase('running');
    setShowStartTimeEditor(false);
    setStartTimeError(null);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      // Resuming: accumulate how long we were paused
      if (pausedAtRef.current !== null) {
        pausedSecondsRef.current += Math.floor((Date.now() - pausedAtRef.current) / 1000);
        pausedAtRef.current = null;
      }
      setIsPaused(false);
    } else {
      // Pausing: record when we paused
      pausedAtRef.current = Date.now();
      setIsPaused(true);
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

    // Check if this is a personal best
    const currentBest = personalBestTimes[problem.id];
    if (currentBest === undefined || finalElapsed < currentBest) {
      setIsNewPB(true);
    }

    setIsPaused(false);
    setPhase('rating');
  };

  const handleRating = (rating: ProblemSessionRating) => {
    const sessionType = activeSession?.isReview
      ? 'review'
      : activeSession?.isColdSolve
        ? 'cold_solve'
        : 'new';

    void Promise.allSettled([
      recordSession({
        id: crypto.randomUUID(),
        problemId: problem.id,
        category: problem.category,
        date: new Date().toISOString(),
        elapsedSeconds: frozenElapsed,
        sessionType,
        rating,
      }),
      logProblem(problem.id, rating, isNew, notes, {
        elapsedSeconds: frozenElapsed,
        sessionType,
      })
    ]).finally(() => {
      endSession();
      onComplete();
    });
  };

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
          <div className="mb-6 p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/50">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TimerIcon size={16} className="text-emerald-400" />
              <span className="text-zinc-400 text-sm">Time spent</span>
            </div>
            <div className="font-mono text-4xl font-bold text-zinc-50 tracking-tighter">
              {fmtTime(frozenElapsed)}
            </div>
            <div className="text-zinc-500 text-xs mt-1">{timeLabel} elapsed</div>
            {isNewPB && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-amber-400 text-xs font-semibold">
                <Trophy size={14} className="fill-current" />
                New Personal Best!
              </div>
            )}
          </div>

          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <CircleCheck size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 mb-1">Session Complete</h2>
          <p className="text-zinc-400 mb-6 text-sm">
            Rate how you’d perform on <strong className="text-zinc-200">{problem.title}</strong> if you saw it again soon — not whether the code compiled once.
          </p>

          <div className="mb-6 text-left">
            <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-400" />
              Key Insight / Notes (Optional)
            </label>
            {existingNotes && (
              <div className="mb-2 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg text-xs text-zinc-400">
                <span className="text-emerald-400 font-medium">Previous: </span>{existingNotes}
              </div>
            )}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down the key trick or pattern for this problem..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none h-20 text-sm"
            />
          </div>

          <div className="space-y-2">
            {(
              [
                {
                  r: 5 as const,
                  title: '5 — Cold / automatic',
                  hint: 'Could solve again without prep; pattern feels automatic. Use when you’d trust yourself in an interview cold.',
                  tone: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20',
                },
                {
                  r: 4 as const,
                  title: '4 — Strong',
                  hint: 'Solid solve you could explain out loud; small slips ok. Stronger than “acceptable” but not fully muscle-memory yet.',
                  tone: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20',
                },
                {
                  r: 3 as const,
                  title: '3 — Acceptable',
                  hint: 'You finished or mostly got it, but it was slow, messy, or you needed small nudges. Honest middle tier.',
                  tone: 'text-teal-400 border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20',
                },
                {
                  r: 2 as const,
                  title: '2 — Shaky',
                  hint: 'Heavy hints, bugs, wrong approach first, or only a partial solution.',
                  tone: 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20',
                },
                {
                  r: 1 as const,
                  title: '1 — Could not',
                  hint: 'Did not finish, or needed a full walkthrough. Schedules a quick revisit.',
                  tone: 'text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20',
                },
              ] as const
            ).map(({ r, title, hint, tone }) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRating(r)}
                className={clsx(
                  'w-full border p-3 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 text-left transition-colors group',
                  tone
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
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">{problem.title}</h1>
          <div className="flex gap-2 mt-2 text-sm">
            <span className="text-zinc-400">{problem.category}</span>
            <span className="text-zinc-600">•</span>
            <span className={clsx(
              'font-medium',
              problem.difficulty === 'Easy' ? 'text-emerald-400' :
                problem.difficulty === 'Medium' ? 'text-amber-400' :
                  'text-red-400'
            )}>
              {problem.difficulty}
            </span>
            {isColdSolve && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-400 font-medium">Cold Solve</span>
              </>
            )}
            {!isNew && !isColdSolve && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-amber-400 font-medium">Review</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href={problem.leetcodeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-100 transition-colors border border-zinc-700/50 hover:border-zinc-600"
          >
            <ExternalLink size={18} />
            <span className="hidden sm:inline">LeetCode</span>
          </a>
        </div>
      </div>

      <div className="premium-card p-8 md:p-12 text-center relative overflow-hidden">
        {/* Thin progress "vibe" bar that pulses when running */}
        <div className="absolute top-0 left-0 h-1 bg-zinc-800 w-full">
          {phase === 'running' && (
            <div className="h-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]" style={{ width: '100%' }} />
          )}
        </div>

        {/* Label */}
        <div className={clsx(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 border transition-colors",
          phase === 'running'
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-zinc-800/80 text-zinc-400 border-zinc-700/50"
        )}>
          <TimerIcon size={14} className={phase === 'running' ? 'animate-[spin_3s_linear_infinite]' : ''} />
          {phase === 'idle' ? 'Ready to start' : 'Session in progress'}
        </div>

        {/* Stopwatch Display */}
        <div className="font-mono text-7xl md:text-9xl font-bold tracking-tighter text-zinc-50 mb-12">
          {fmtTime(displayElapsed)}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-4">
            {phase === 'idle' ? (
              <button
                onClick={handleStart}
                className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-lg rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-3"
              >
                Start Session
              </button>
            ) : showCancelConfirm ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-sm font-medium text-red-400 flex items-center gap-2">
                  <AlertTriangle size={16} /> Discard this session? No progress will be saved.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => {
                      abandonSession();
                      onComplete();
                    }}
                    className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
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
                    "w-12 h-12 flex items-center justify-center rounded-full transition-all border",
                    isPaused
                      ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                      : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300"
                  )}
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <Play size={18} className="fill-current ml-0.5" /> : <Pause size={18} className="fill-current" />}
                </button>

                <button
                  onClick={handleDone}
                  disabled={isPaused}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-2"
                >
                  <CircleCheck size={20} className="fill-current" />
                  I'm Done
                </button>

                <button
                  onClick={() => {
                    setShowStartTimeEditor(false);
                    setStartTimeError(null);
                    setShowCancelConfirm(true);
                  }}
                  className="px-6 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl font-medium transition-colors flex items-center gap-2"
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
              className="text-xs sm:text-sm text-emerald-400/90 hover:text-emerald-300 underline underline-offset-2 transition-colors"
            >
              Started earlier? Enter start time
            </button>
          )}

          {phase === 'running' && !showCancelConfirm && !showStartTimeEditor && (
            <button
              type="button"
              onClick={openStartTimeEditor}
              className="text-xs sm:text-sm text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors"
            >
              Adjust start time
            </button>
          )}

          {showStartTimeEditor && !showCancelConfirm && (
            <div className="w-full max-w-md rounded-xl border border-zinc-700/60 bg-zinc-950/70 p-4 text-left">
              <label htmlFor="manual-start-time" className="text-sm font-medium text-zinc-300">
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
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={applyManualStartTime}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-lg transition-colors"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStartTimeEditor(false);
                    setStartTimeError(null);
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
              {startTimeError && (
                <p className="mt-2 text-xs text-red-400">{startTimeError}</p>
              )}
              <p className="mt-2 text-[11px] text-zinc-500">
                Start time must be in the past. Backdating is limited to {MAX_BACKDATE_HOURS} hours.
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
          {phase === 'idle' && (
            <span>Open the problem in LeetCode, then click Start Session. Forgot earlier? Use the start-time link to backdate.</span>
          )}
          {phase === 'running' && isPaused && (
            <span className="text-amber-400/80">Timer paused. Click resume when you're ready to continue.</span>
          )}
          {phase === 'running' && !isPaused && isColdSolve && (
            <span>Cold Solve: No hints, no videos. Test your true retention.</span>
          )}
          {phase === 'running' && !isPaused && !isColdSolve && (
            <span>Work through the problem at your own pace. Click I'm Done whenever you're finished.</span>
          )}
        </div>
      </div>
    </div>
  );
};
