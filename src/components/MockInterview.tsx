import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { problems, Problem } from '../data/problems';
import { getPhase } from '../utils/dateUtils';
import { Play, Pause, ExternalLink, TriangleAlert, CircleCheck, Lock } from 'lucide-react';
import { clsx } from 'clsx';

export const MockInterview: React.FC = () => {
  const progress = useStore((state) => state.progress);
  const phase = getPhase();

  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [timeLeft, setTimeLeft] = useState(35 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [evalSolved, setEvalSolved] = useState<boolean | null>(null);
  const [evalSyntax, setEvalSyntax] = useState<boolean | null>(null);
  const [evalComplexity, setEvalComplexity] = useState<boolean | null>(null);

  const [difficultyFilter, setDifficultyFilter] = useState<'Easy' | 'Medium' | 'Hard' | 'Random'>('Medium');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(problems.map(p => p.category)))];

  useEffect(() => {
    let interval: number;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setIsFinished(true);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const startMock = () => {
    const solvedIds = Object.keys(progress);
    const eligibleProblems = problems.filter(p => {
      if (!solvedIds.includes(p.id)) return false;
      if (difficultyFilter !== 'Random' && p.difficulty !== difficultyFilter) return false;
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      return true;
    });

    if (eligibleProblems.length === 0) {
      alert("No solved problems match your selected filters. Try broadening your criteria.");
      return;
    }

    const randomProblem = eligibleProblems[Math.floor(Math.random() * eligibleProblems.length)];
    setActiveProblem(randomProblem);
    setTimeLeft(35 * 60);
    setIsRunning(true);
    setIsFinished(false);
    setEvalSolved(null);
    setEvalSyntax(null);
    setEvalComplexity(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };


  if (isFinished && activeProblem) {
    return (
      <div className="max-w-2xl mx-auto mt-12 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <CircleCheck size={48} className="mx-auto text-indigo-500 mb-6" />
          <h2 className="text-2xl font-bold text-zinc-50 mb-2 text-center">Interview Complete</h2>
          <p className="text-zinc-400 mb-8 text-center">Self-Evaluation for {activeProblem.title}</p>

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="font-medium text-zinc-100">1. Did you solve the problem optimally?</p>
              <div className="flex gap-4">
                <button onClick={() => setEvalSolved(true)} className={clsx("flex-1 py-3 rounded-xl border transition-colors", evalSolved === true ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700")}>Yes</button>
                <button onClick={() => setEvalSolved(false)} className={clsx("flex-1 py-3 rounded-xl border transition-colors", evalSolved === false ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700")}>No</button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-medium text-zinc-100">2. Was your syntax clean and bug-free?</p>
              <div className="flex gap-4">
                <button onClick={() => setEvalSyntax(true)} className={clsx("flex-1 py-3 rounded-xl border transition-colors", evalSyntax === true ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700")}>Yes</button>
                <button onClick={() => setEvalSyntax(false)} className={clsx("flex-1 py-3 rounded-xl border transition-colors", evalSyntax === false ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700")}>No</button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-medium text-zinc-100">3. Could you explain time and space complexity clearly?</p>
              <div className="flex gap-4">
                <button onClick={() => setEvalComplexity(true)} className={clsx("flex-1 py-3 rounded-xl border transition-colors", evalComplexity === true ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700")}>Yes</button>
                <button onClick={() => setEvalComplexity(false)} className={clsx("flex-1 py-3 rounded-xl border transition-colors", evalComplexity === false ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700")}>No</button>
              </div>
            </div>

            <button
              onClick={() => setActiveProblem(null)}
              disabled={evalSolved === null || evalSyntax === null || evalComplexity === null}
              className="w-full mt-8 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-50 font-semibold py-4 rounded-xl transition-colors"
            >
              Finish Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeProblem) {
    return (
      <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">{activeProblem.title}</h1>
            <div className="flex gap-2 mt-2 text-sm">
              <span className="text-zinc-400">{activeProblem.category}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-amber-400 font-medium">Medium</span>
            </div>
          </div>
          <a href={activeProblem.leetcodeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-100 transition-colors">
            <ExternalLink size={18} />
            <span className="hidden sm:inline">LeetCode</span>
          </a>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 bg-zinc-800 w-full">
            <div
              className="h-full bg-indigo-500 transition-all duration-1000"
              style={{ width: `${((35 * 60 - timeLeft) / (35 * 60)) * 100}%` }}
            />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8">
            <TriangleAlert size={16} />
            Strict Mode: No Hints
          </div>

          <div className="font-mono text-7xl md:text-9xl font-bold tracking-tighter text-zinc-50 mb-12">
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="w-16 h-16 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-full transition-colors"
            >
              {isRunning ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
            </button>

            <button
              onClick={() => { setIsRunning(false); setIsFinished(true); }}
              className="px-6 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl font-medium transition-colors"
            >
              End Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Mock Interview</h1>
        <p className="text-zinc-400 mt-1">Simulate the live coding environment.</p>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center max-w-2xl mx-auto mt-12">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={32} className="text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-50 mb-4">Ready for a challenge?</h2>

        <div className="text-left max-w-md mx-auto mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Difficulty</label>
            <div className="flex gap-2">
              {['Easy', 'Medium', 'Hard', 'Random'].map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff as any)}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors border",
                    difficultyFilter === diff
                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                  )}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500/50 transition-colors"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <ul className="text-zinc-400 space-y-3 mb-8 text-left max-w-md mx-auto">
          <li className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Random problem matching your filters
          </li>
          <li className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Strict 35-minute timer
          </li>
          <li className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            No hints, no solution videos allowed
          </li>
          <li className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Self-evaluation at the end
          </li>
        </ul>
        <button
          onClick={startMock}
          className="bg-indigo-500 hover:bg-indigo-600 text-zinc-50 font-semibold px-8 py-4 rounded-xl transition-colors inline-flex items-center gap-2"
        >
          <Play size={20} />
          Start Mock Interview
        </button>
      </div>
    </div>
  );
};
