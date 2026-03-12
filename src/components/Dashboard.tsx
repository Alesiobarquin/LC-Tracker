import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { problems } from '../data/problems';
import { getPhase } from '../utils/dateUtils';
import { Play, CircleCheck, Clock, Flame, Target, ExternalLink, Youtube, CircleAlert, Sparkles, Snowflake } from 'lucide-react';
import { clsx } from 'clsx';
import { Timer } from './Timer';
import { WeeklySummary } from './WeeklySummary';

export const Dashboard: React.FC = () => {
  const streak = useStore((state) => state.streak);
  const progress = useStore((state) => state.progress);
  const getDailyPlan = useStore((state) => state.getDailyPlan);
  const phase = getPhase();
  const { newProblem, reviewProblems, coldSolveProblem, recommendationReason } = getDailyPlan();

  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [isReview, setIsReview] = useState(false);
  const [isColdSolve, setIsColdSolve] = useState(false);

  const newProblemData = newProblem ? problems.find(p => p.id === newProblem) : null;
  const reviewProblemsData = reviewProblems.map(id => problems.find(p => p.id === id)).filter(Boolean);
  const coldSolveData = coldSolveProblem ? problems.find(p => p.id === coldSolveProblem) : null;

  const newProblemTime = newProblem ? 35 : 0;
  const reviewTime = reviewProblems.length * 15;
  const coldSolveTime = coldSolveProblem ? 20 : 0;
  const totalTime = newProblemTime + reviewTime + coldSolveTime;
  const timeParts = [];
  if (newProblemTime > 0) timeParts.push(`${newProblemTime}m new`);
  if (reviewTime > 0) timeParts.push(`${reviewTime}m reviews`);
  if (coldSolveTime > 0) timeParts.push(`${coldSolveTime}m cold solve`);
  const timeBreakdown = timeParts.join(' + ');

  const solvedCount = Object.keys(progress).length;
  const targetCount = phase === 3 ? 150 : 75;
  const progressPercent = Math.round((solvedCount / targetCount) * 100);

  // Pacing Indicator Logic
  const activityLog = useStore((state) => state.activityLog);
  const today = new Date();
  const phase1TargetDate = new Date('2026-05-01T00:00:00Z');
  const daysUntilPhase1Target = Math.max(1, Math.ceil((phase1TargetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const problemsRemaining = Math.max(0, 75 - solvedCount);

  let solvedLast14Days = 0;
  for (let i = 0; i < 14; i++) {
    const dateKey = new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (activityLog[dateKey]) {
      solvedLast14Days += activityLog[dateKey].solved;
    }
  }

  // Default to 1 problem per day if no data to avoid infinity
  const solveRate = solvedLast14Days === 0 ? 1 : solvedLast14Days / 14;
  const daysNeeded = problemsRemaining / solveRate;
  const estimatedFinishDate = new Date(today.getTime() + daysNeeded * 24 * 60 * 60 * 1000);

  let pacingStatus = 'green';
  let pacingMessage = '';

  if (problemsRemaining === 0) {
    pacingStatus = 'green';
    pacingMessage = 'Phase 1 complete!';
  } else if (estimatedFinishDate <= phase1TargetDate) {
    pacingStatus = 'green';
    pacingMessage = `On track to finish Phase 1 by ${estimatedFinishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`;
  } else {
    const requiredRate = problemsRemaining / daysUntilPhase1Target;
    const extraPerDay = requiredRate - solveRate;

    if (extraPerDay > 0) {
      const daysPerExtraProblem = 1 / extraPerDay;
      if (daysPerExtraProblem <= 2) {
        pacingStatus = 'red';
        pacingMessage = `At current pace you will finish Phase 1 by ${estimatedFinishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Solve ${Math.ceil(extraPerDay)} extra problem${Math.ceil(extraPerDay) > 1 ? 's' : ''} every day to hit your May target.`;
      } else {
        pacingStatus = 'yellow';
        pacingMessage = `At current pace you will finish Phase 1 by ${estimatedFinishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Solve 1 extra problem every ${Math.round(daysPerExtraProblem)} days to hit your May target.`;
      }
    } else {
      pacingStatus = 'green';
      pacingMessage = `On track to finish Phase 1 by ${estimatedFinishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`;
    }
  }

  if (activeSession) {
    const problem = problems.find(p => p.id === activeSession);
    if (!problem) return null;
    return <Timer problem={problem} isNew={!isReview && !isColdSolve} isColdSolve={isColdSolve} onComplete={() => { setActiveSession(null); setIsColdSolve(false); }} />;
  }

  return (
    <div className="space-y-8 animate-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Daily Plan</h1>
          <p className="text-zinc-400 mt-1">Don't think, just execute.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 premium-card px-4 py-2">
            <Flame className="text-orange-500" size={20} />
            <span className="font-medium text-zinc-100">{streak.current} Day Streak</span>
          </div>
          <div className="flex items-center gap-2 premium-card px-4 py-2">
            <Clock className="text-emerald-400" size={20} />
            <span className="font-medium text-zinc-100">
              {timeBreakdown ? `${timeBreakdown} = ` : ''}~{totalTime}m today
            </span>
          </div>
        </div>
      </header>

      <WeeklySummary />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Problems */}
        <div className="lg:col-span-2 space-y-6">

          {/* New Problem */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <Target size={20} className="text-emerald-400" />
              Today's Focus
            </h2>
            {newProblemData ? (
              <div className="premium-card p-6 relative overflow-hidden group">
                {recommendationReason && (
                  <div className="absolute top-0 left-0 w-full bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <Sparkles size={14} />
                    {recommendationReason}
                  </div>
                )}
                <div className={clsx("flex justify-between items-start mb-4", recommendationReason ? "mt-8" : "")}>
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-50 group-hover:text-emerald-400 transition-colors">{newProblemData.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-3 text-xs">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-md font-medium border",
                        newProblemData.difficulty === 'Easy' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          newProblemData.difficulty === 'Medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {newProblemData.difficulty}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                        {newProblemData.category}
                      </span>
                      {newProblemData.isBlind75 && (
                        <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Blind 75
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={newProblemData.leetcodeUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl text-zinc-300 transition-colors border border-zinc-700/50 hover:border-zinc-600" title="LeetCode">
                      <ExternalLink size={18} />
                    </a>
                    <a href={newProblemData.videoUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl text-red-400 transition-colors border border-zinc-700/50 hover:border-zinc-600" title="NeetCode Video">
                      <Youtube size={18} />
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveSession(newProblemData.id); setIsReview(false); setIsColdSolve(false); }}
                  className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                >
                  <Play size={18} className="fill-current" />
                  Start 35m Session
                </button>
              </div>
            ) : (
              <div className="premium-card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <CircleCheck size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-lg font-medium text-zinc-100 mb-1">All Caught Up</h3>
                <p className="text-zinc-400 text-sm">No new problems scheduled for today. Focus on reviews or take a break!</p>
              </div>
            )}
          </section>

          {/* Cold Solve */}
          {coldSolveData && (
            <section className="slide-in-from-bottom-4" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                <Snowflake size={20} className="text-blue-400" />
                Cold Solve Challenge
              </h2>
              <div className="premium-card p-5 border-blue-500/20 hover:border-blue-500/40">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-zinc-100">{coldSolveData.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1">Not touched in &gt;30 days. No hints. 20 mins.</p>
                  </div>
                  <button
                    onClick={() => { setActiveSession(coldSolveData.id); setIsReview(true); setIsColdSolve(true); }}
                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-medium rounded-lg transition-colors border border-blue-500/20 flex items-center gap-2"
                  >
                    <Play size={16} className="fill-current" />
                    Start
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="slide-in-from-bottom-4" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-amber-400" />
              Spaced Repetition Reviews ({reviewProblemsData.length})
            </h2>
            {reviewProblemsData.length > 0 ? (
              <div className="space-y-3">
                {reviewProblemsData.map((prob) => {
                  if (!prob) return null;
                  const probProgress = progress[prob.id];
                  const lastRating = probProgress?.history[probProgress.history.length - 1]?.rating;

                  return (
                    <div key={prob.id} className="premium-card p-4 flex items-center justify-between group">
                      <div>
                        <h4 className="font-medium text-zinc-100 group-hover:text-amber-400 transition-colors">{prob.title}</h4>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                          <span className="px-2 py-0.5 rounded bg-zinc-800/50 border border-zinc-700/50">{prob.category}</span>
                          <span className={clsx(
                            "px-2 py-0.5 rounded border",
                            lastRating === 1 ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              lastRating === 2 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                lastRating === 3 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                  "bg-zinc-800/50 text-zinc-400 border-zinc-700/50"
                          )}>
                            {lastRating ? `Last Rating: ${lastRating}` : 'Needs Rating'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setActiveSession(prob.id); setIsReview(true); setIsColdSolve(false); }}
                        className="p-2.5 bg-zinc-800/80 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 rounded-xl transition-all duration-200 border border-zinc-700/50 hover:border-amber-500"
                      >
                        <Play size={18} className="fill-current" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="premium-card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                  <CircleCheck size={32} className="text-amber-500" />
                </div>
                <h3 className="text-lg font-medium text-zinc-100 mb-1">All Caught Up</h3>
                <p className="text-zinc-400 text-sm">Your review queue is empty for today.</p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6 slide-in-from-bottom-4 lg:sticky lg:top-8 self-start" style={{ animationDelay: '0.3s' }}>
          <div className="premium-card p-6">
            <h3 className="font-semibold text-zinc-100 mb-2">Phase {phase} Status</h3>
            <p className="text-sm text-zinc-400 mb-5">
              {phase === 1 ? "NeetCode 75 Core (No Graphs/DP)" :
                phase === 2 ? "Internship Mode (3x/week)" :
                  "Recruiting Grind (NC 150 + Mocks)"}
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Progress</span>
                <span className="text-zinc-100 font-medium">{solvedCount} / {targetCount}</span>
              </div>
              <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/50">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
                </div>
              </div>
              {phase === 1 && (
                <div className="mt-4 text-sm">
                  <div className={clsx(
                    "flex items-start gap-2 p-3 rounded-lg border",
                    pacingStatus === 'green' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      pacingStatus === 'yellow' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                        "bg-red-500/10 border-red-500/20 text-red-400"
                  )}>
                    <Target size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{pacingMessage}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="premium-card p-6">
            <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <CircleAlert size={18} className="text-indigo-400" />
              The 35 Min Rule
            </h3>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-8 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-100 font-medium text-xs border border-zinc-700">5m</span>
                <span className="pt-0.5">Read, understand, edge cases.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-8 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-100 font-medium text-xs border border-zinc-700">15m</span>
                <span className="pt-0.5">Attempt solution.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-8 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-100 font-medium text-xs border border-zinc-700">10m</span>
                <span className="pt-0.5">Watch video & understand the optimal solution.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-8 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-100 font-medium text-xs border border-zinc-700">5m</span>
                <span className="pt-0.5">Re-try / implement the optimal solution.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
