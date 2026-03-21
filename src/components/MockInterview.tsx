import React, { useState, useEffect, useRef } from 'react';
import { problems, Problem } from '../data/problems';
import { getPhase } from '../utils/dateUtils';
import { Play, Pause, ExternalLink, TriangleAlert, CircleCheck, Lock, CheckSquare, Square, Timer } from 'lucide-react';
import { clsx } from 'clsx';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import ReactMarkdown from 'react-markdown';
import { useProblemProgress } from '../hooks/useUserData';

export const MockInterview: React.FC = () => {
  const { logMockInterview } = useProblemProgress();
  const phase = getPhase();

  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const mockStartTimestampRef = useRef<number | null>(null);

  const [useExternalLeetCode, setUseExternalLeetCode] = useState(false);
  const [code, setCode] = useState('');
  const [approachSimilarity, setApproachSimilarity] = useState<number | null>(null);

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
    const eligibleProblems = problems.filter(p => {
      if (difficultyFilter !== 'Random' && p.difficulty !== difficultyFilter) return false;
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (!useExternalLeetCode && !p.mockInterviewContent) return false;
      return true;
    });

    if (eligibleProblems.length === 0) {
      alert("No problems match your selected filters. Try broadening your criteria.");
      return;
    }

    const randomProblem = eligibleProblems[Math.floor(Math.random() * eligibleProblems.length)];
    setActiveProblem(randomProblem);

    setEvalSolved(null);
    setEvalSyntax(null);
    setEvalComplexity(null);
    setApproachSimilarity(null);
    setCode('');

    if (useExternalLeetCode) {
      window.open(randomProblem.leetcodeUrl, '_blank');
      setIsRunning(false);
      setIsFinished(true);
    } else {
      const limit = randomProblem.mockInterviewContent ? 25 * 60 : 35 * 60;
      setTimeLeft(limit);
      setTimeLimitSeconds(limit);
      mockStartTimestampRef.current = Date.now();
      setIsRunning(true);
      setIsFinished(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };


  if (isFinished && activeProblem) {
    return (
      <div className="max-w-6xl mx-auto mt-8 animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-8">
        {activeProblem.mockInterviewContent && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-zinc-50 mb-4">Optimal Approach</h3>
            <p className="text-zinc-300 leading-relaxed mb-8">{activeProblem.mockInterviewContent.explanation}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-zinc-400 font-medium text-sm flex items-center justify-between">
                  Your Code
                  {useExternalLeetCode && <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-500">External IDE</span>}
                </h4>
                <div className="rounded-xl overflow-hidden border border-zinc-700 h-[450px]">
                  <CodeMirror
                    value={useExternalLeetCode ? '# Solved externally in LeetCode' : code}
                    extensions={[python()]}
                    theme="dark"
                    editable={false}
                    height="100%"
                    className="h-full text-sm"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-emerald-400 font-medium text-sm">Optimal Solution</h4>
                <div className="rounded-xl overflow-hidden border border-emerald-500/30 h-[450px]">
                  <CodeMirror
                    value={activeProblem.mockInterviewContent.optimalSolution}
                    extensions={[python()]}
                    theme="dark"
                    editable={false}
                    height="100%"
                    className="h-full text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-2xl mx-auto">
          <CircleCheck size={48} className="mx-auto text-indigo-500 mb-6" />
          <h2 className="text-2xl font-bold text-zinc-50 mb-2 text-center">Interview Complete</h2>
          <p className="text-zinc-400 mb-2 text-center">Self-Evaluation for {activeProblem.title}</p>
          {mockStartTimestampRef.current && (
            <div className="flex items-center justify-center gap-4 mb-6 text-sm">
              <span className="flex items-center gap-1.5 text-cyan-400 font-mono font-semibold">
                <Timer size={14} />
                Finished in {Math.round((Date.now() - (mockStartTimestampRef.current ?? Date.now())) / 60000)}m
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500">Limit: {Math.round(timeLimitSeconds / 60)}m</span>
            </div>
          )}

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

            {activeProblem.mockInterviewContent && (
              <div className="space-y-3">
                <p className="font-medium text-zinc-100">4. How similar was your approach to the optimal solution?</p>
                <div className="flex gap-4">
                  <button onClick={() => setApproachSimilarity(1)} className={clsx("flex-1 py-3 rounded-xl border transition-colors flex flex-col items-center justify-center gap-1", approachSimilarity === 1 ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700")}>
                    <span className="font-bold">1</span>
                    <span className="text-xs">Different</span>
                  </button>
                  <button onClick={() => setApproachSimilarity(2)} className={clsx("flex-1 py-3 rounded-xl border transition-colors flex flex-col items-center justify-center gap-1", approachSimilarity === 2 ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700")}>
                    <span className="font-bold">2</span>
                    <span className="text-xs">Same Pattern</span>
                  </button>
                  <button onClick={() => setApproachSimilarity(3)} className={clsx("flex-1 py-3 rounded-xl border transition-colors flex flex-col items-center justify-center gap-1", approachSimilarity === 3 ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700")}>
                    <span className="font-bold">3</span>
                    <span className="text-xs">Identical</span>
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                const actualSecondsUsed = mockStartTimestampRef.current
                  ? Math.round((Date.now() - mockStartTimestampRef.current) / 1000)
                  : undefined;
                void logMockInterview(
                  activeProblem.id,
                  evalSolved!,
                  evalSyntax!,
                  evalComplexity!,
                  approachSimilarity || 0,
                  code,
                  activeProblem.mockInterviewContent?.optimalSolution || '',
                  !useExternalLeetCode && !!activeProblem.mockInterviewContent,
                  actualSecondsUsed,
                  timeLimitSeconds
                );
                setActiveProblem(null);
                mockStartTimestampRef.current = null;
              }}
              disabled={evalSolved === null || evalSyntax === null || evalComplexity === null || (!!activeProblem.mockInterviewContent && approachSimilarity === null)}
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
      <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
        <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[600px] gap-4">

          {/* Header & Timer Panel */}
          <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shrink-0 shadow-lg">
            <div className="flex items-center gap-4 pl-2">
              <a href={activeProblem.leetcodeUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-100 transition-colors" title="Open in LeetCode">
                <ExternalLink size={18} />
              </a>
              <div>
                <h1 className="text-xl font-bold text-zinc-50">{activeProblem.title}</h1>
                <div className="flex gap-2 mt-0.5 text-xs">
                  <span className="text-zinc-400">{activeProblem.category}</span>
                  <span className="text-zinc-600">•</span>
                  <span className={clsx("font-medium", activeProblem.difficulty === 'Hard' ? 'text-red-400' : activeProblem.difficulty === 'Medium' ? 'text-amber-400' : 'text-emerald-400')}>
                    {activeProblem.difficulty}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 pr-2">
              <div className="flex flex-col items-center">
                <div className={clsx(
                  "font-mono text-4xl font-bold tracking-tighter transition-colors",
                  timeLeft <= 300 ? "text-red-500 animate-pulse" : timeLeft <= 600 ? "text-amber-400" : "text-zinc-50"
                )}>
                  {formatTime(timeLeft)}
                </div>
                {timeLeft <= 600 && <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{timeLeft <= 300 ? 'Time up soon' : '10 min warning'}</span>}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className="w-12 h-12 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-full transition-colors"
                >
                  {isRunning ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
                </button>
                <button
                  onClick={() => { setIsRunning(false); setIsFinished(true); }}
                  className="px-5 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-medium transition-colors"
                >
                  I'm done
                </button>
              </div>
            </div>
          </div>

          {/* Body Panels */}
          {activeProblem.mockInterviewContent ? (
            <div className="flex flex-1 gap-4 overflow-hidden mb-8 shadow-lg">
              {/* Left Panel: Problem Content */}
              <div className="w-[40%] bg-[#1c1c1e] border border-zinc-800 rounded-2xl overflow-y-auto custom-scrollbar p-6">
                <div className="text-zinc-300 space-y-4">
                  <div className="[&>p]:mb-4 [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>code]:bg-zinc-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-indigo-300">
                    <ReactMarkdown>{activeProblem.mockInterviewContent.statement}</ReactMarkdown>
                  </div>

                  <h3 className="text-lg font-semibold text-zinc-100 mt-8 mb-4 border-b border-zinc-800 pb-2">Examples</h3>
                  <div className="bg-[#121212] p-4 rounded-xl border border-zinc-800/80 font-mono text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {activeProblem.mockInterviewContent.examples}
                  </div>

                  <h3 className="text-lg font-semibold text-zinc-100 mt-8 mb-4 border-b border-zinc-800 pb-2">Constraints</h3>
                  <div className="bg-[#121212] p-4 rounded-xl border border-zinc-800/80 text-sm shadow-inner">
                    <div className="[&>p]:mb-2 [&>ul]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>li]:text-zinc-400 [&>code]:bg-zinc-800 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-indigo-300">
                      <ReactMarkdown>{activeProblem.mockInterviewContent.constraints}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Editor */}
              <div className="w-[60%] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
                <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between shadow-sm z-10">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400/20 border border-amber-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-400/20 border border-emerald-500/50"></div>
                    </div>
                    <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest ml-2">Editor (Python)</span>
                  </div>
                  <div className="text-[11px] font-medium text-amber-500/70 bg-amber-500/10 px-2 py-1 rounded bg-opacity-30 border border-amber-500/20 uppercase tracking-wider flex items-center gap-1.5">
                    <TriangleAlert size={12} /> No Autocomplete
                  </div>
                </div>
                <div className="flex-1 overflow-hidden relative">
                  <CodeMirror
                    value={code}
                    extensions={[python()]}
                    theme="dark"
                    onChange={(val) => setCode(val)}
                    height="100%"
                    className="h-[100%] text-[15px] font-mono leading-relaxed"
                    basicSetup={{
                      autocompletion: false,
                      foldGutter: false,
                      dropCursor: false,
                      allowMultipleSelections: false,
                      indentOnInput: false,
                    }}
                  />
                  {!isRunning && timeLeft > 0 && (
                    <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[2px] z-20 flex items-center justify-center">
                      <div className="bg-zinc-900 px-6 py-4 rounded-xl border border-zinc-700 shadow-2xl flex items-center gap-4">
                        <Pause className="text-zinc-400" size={24} />
                        <span className="text-zinc-200 font-medium">Interview Paused</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center mt-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden w-full max-w-2xl shadow-lg">
                <div className="absolute top-0 left-0 h-1 bg-zinc-800 w-full">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-1000"
                    style={{ width: `${((35 * 60 - timeLeft) / (35 * 60)) * 100}%` }}
                  />
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8 border border-indigo-500/20">
                  <TriangleAlert size={16} />
                  Strict Mode: No Hints
                </div>
                <div className="font-mono text-7xl md:text-9xl font-bold tracking-tighter text-zinc-50 mb-12">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-zinc-500 -mt-6 mb-8 text-sm">Problem doesn't have in-app editor content.</p>
              </div>
            </div>
          )}
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

        <div className="flex items-center justify-start max-w-md mx-auto mb-8 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl cursor-pointer" onClick={() => setUseExternalLeetCode(!useExternalLeetCode)}>
          {useExternalLeetCode ? <CheckSquare className="text-indigo-400 mr-3" /> : <Square className="text-zinc-500 mr-3" />}
          <div>
            <p className="text-zinc-200 font-medium">Open in LeetCode instead</p>
            <p className="text-zinc-400 text-sm">Skips the in-app editor and opens problem in a new tab</p>
          </div>
        </div>

        <ul className="text-zinc-400 space-y-3 mb-8 text-left max-w-md mx-auto">
          <li className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Random problem matching your filters
          </li>
          <li className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Strict {useExternalLeetCode ? 'timer on your own' : '25-minute timer (or 35m for old)'}
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
