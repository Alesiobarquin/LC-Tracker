import React, { useState, useEffect } from 'react';
import { Problem } from '../data/problems';
import { useStore } from '../store/useStore';
import { Play, Pause, Square, ExternalLink, Youtube, ChevronRight, CircleCheck, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';

interface TimerProps {
  problem: Problem;
  isNew: boolean;
  isColdSolve?: boolean;
  onComplete: () => void;
}

type TimerPhase = 'read' | 'attempt' | 'review' | 'retry' | 'rating';

const PHASE_DURATIONS = {
  read: 5 * 60,
  attempt: 15 * 60,
  review: 10 * 60,
  retry: 5 * 60,
};

export const Timer: React.FC<TimerProps> = ({ problem, isNew, isColdSolve, onComplete }) => {
  const logProblem = useStore((state) => state.logProblem);
  const progress = useStore((state) => state.progress);
  const [phase, setPhase] = useState<TimerPhase>(isColdSolve ? 'attempt' : 'read');
  const [timeLeft, setTimeLeft] = useState(isColdSolve ? 20 * 60 : PHASE_DURATIONS.read);
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState(progress[problem.id]?.notes || '');

  useEffect(() => {
    let interval: number;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handlePhaseComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handlePhaseComplete = () => {
    setIsRunning(false);
    if (isColdSolve) {
      setPhase('rating');
      return;
    }

    if (phase === 'read') {
      setPhase('attempt');
      setTimeLeft(PHASE_DURATIONS.attempt);
    } else if (phase === 'attempt') {
      setPhase('review');
      setTimeLeft(PHASE_DURATIONS.review);
    } else if (phase === 'review') {
      setPhase('retry');
      setTimeLeft(PHASE_DURATIONS.retry);
    } else if (phase === 'retry') {
      setPhase('rating');
    }
  };

  const skipPhase = () => {
    handlePhaseComplete();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRating = (rating: 1 | 2 | 3) => {
    logProblem(problem.id, rating, isNew, notes);
    onComplete();
  };

  if (phase === 'rating') {
    return (
      <div className="max-w-xl mx-auto mt-12 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="premium-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CircleCheck size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 mb-2">Session Complete</h2>
          <p className="text-zinc-400 mb-6">How confident do you feel about {problem.title}?</p>

          <div className="mb-8 text-left">
            <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-400" />
              Key Insight / Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down the key trick or pattern for this problem..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none h-24 text-sm"
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleRating(3)}
              className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center justify-between transition-colors group"
            >
              <span className="font-semibold text-lg group-hover:scale-105 transition-transform">3 - Mastered</span>
              <span className="text-sm opacity-80">Clean, fast, could explain it</span>
            </button>

            <button
              onClick={() => handleRating(2)}
              className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 p-4 rounded-xl flex items-center justify-between transition-colors group"
            >
              <span className="font-semibold text-lg group-hover:scale-105 transition-transform">2 - Okay</span>
              <span className="text-sm opacity-80">Solved, but slow or had bugs</span>
            </button>

            <button
              onClick={() => handleRating(1)}
              className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center justify-between transition-colors group"
            >
              <span className="font-semibold text-lg group-hover:scale-105 transition-transform">1 - Struggled</span>
              <span className="text-sm opacity-80">Needed video, couldn't finish</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const existingNotes = progress[problem.id]?.notes;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">{problem.title}</h1>
          <div className="flex gap-2 mt-2 text-sm">
            <span className="text-zinc-400">{problem.category}</span>
            <span className="text-zinc-600">•</span>
            <span className={clsx(
              "font-medium",
              problem.difficulty === 'Easy' ? "text-emerald-400" :
                problem.difficulty === 'Medium' ? "text-amber-400" :
                  "text-red-400"
            )}>
              {problem.difficulty}
            </span>
            {isColdSolve && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-blue-400 font-medium">Cold Solve</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <a href={problem.leetcodeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-100 transition-colors border border-zinc-700/50 hover:border-zinc-600">
            <ExternalLink size={18} />
            <span className="hidden sm:inline">LeetCode</span>
          </a>
          {!isColdSolve && (
            <a href={problem.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-red-400 transition-colors border border-zinc-700/50 hover:border-zinc-600">
              <Youtube size={18} />
              <span className="hidden sm:inline">NeetCode</span>
            </a>
          )}
        </div>
      </div>

      <div className="premium-card p-8 md:p-12 text-center relative overflow-hidden">
        {/* Progress Bar Background */}
        <div className="absolute top-0 left-0 h-1 bg-zinc-800 w-full">
          <div
            className={clsx(
              "h-full transition-all duration-1000",
              isColdSolve ? "bg-blue-500" :
                phase === 'read' ? "bg-indigo-500" :
                  phase === 'attempt' ? "bg-emerald-500" :
                    phase === 'review' ? "bg-amber-500" :
                      "bg-purple-500"
            )}
            style={{ width: `${(((isColdSolve ? 20 * 60 : PHASE_DURATIONS[phase]) - timeLeft) / (isColdSolve ? 20 * 60 : PHASE_DURATIONS[phase])) * 100}%` }}
          />
        </div>

        {!isColdSolve && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/80 text-zinc-300 text-sm font-medium mb-8 border border-zinc-700/50">
            <span className={clsx(phase === 'read' && "text-indigo-400")}>1. Read</span>
            <ChevronRight size={14} className="text-zinc-600" />
            <span className={clsx(phase === 'attempt' && "text-emerald-400")}>2. Attempt</span>
            <ChevronRight size={14} className="text-zinc-600" />
            <span className={clsx(phase === 'review' && "text-amber-400")}>3. Review</span>
            <ChevronRight size={14} className="text-zinc-600" />
            <span className={clsx(phase === 'retry' && "text-purple-400")}>4. Re-try</span>
          </div>
        )}

        <div className="font-mono text-7xl md:text-9xl font-bold tracking-tighter text-zinc-50 mb-12">
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="w-16 h-16 flex items-center justify-center bg-zinc-100 hover:bg-white text-zinc-950 rounded-full transition-colors shadow-lg"
          >
            {isRunning ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
          </button>

          <button
            onClick={skipPhase}
            className="px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl font-medium transition-colors border border-zinc-700/50"
          >
            Skip Phase
          </button>

          <button
            onClick={() => setPhase('rating')}
            className="px-6 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl font-medium transition-colors"
          >
            End Session
          </button>
        </div>

        <div className="mt-12 text-zinc-400 max-w-md mx-auto">
          {isColdSolve && "Cold Solve: No hints, no videos. Test your true retention."}
          {!isColdSolve && phase === 'read' && "Read the problem carefully. Identify edge cases and constraints. Do not write code yet."}
          {!isColdSolve && phase === 'attempt' && "Write your solution. Focus on correctness first, then optimization."}
          {!isColdSolve && phase === 'review' && "If stuck, watch the NeetCode video. Focus carefully on the optimal algorithm."}
          {!isColdSolve && phase === 'retry' && "Close the video and try to implement the optimal solution from scratch."}
        </div>

        {!isColdSolve && phase === 'retry' && existingNotes && (
          <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-left max-w-lg mx-auto">
            <h4 className="text-emerald-400 text-sm font-semibold mb-2 flex items-center gap-2">
              <BookOpen size={16} />
              Your Previous Notes
            </h4>
            <p className="text-zinc-300 text-sm">{existingNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
