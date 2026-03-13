import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { problems } from '../data/problems';
import { allSyntaxCards } from '../data/syntaxCards';
import { getPhase } from '../utils/dateUtils';
import { Play, CircleCheck, Clock, Flame, Target, ExternalLink, Youtube, CircleAlert, Sparkles, Snowflake, BookOpen, Zap, X, Brain, Shield, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';
import { differenceInDays, startOfDay } from 'date-fns';
import { Timer } from './Timer';
import { WeeklySummary } from './WeeklySummary';

export const Dashboard: React.FC = () => {
  const streak = useStore((state) => state.streak);
  const progress = useStore((state) => state.progress);
  const phase = getPhase();
  const settings = useStore((state) => state.settings);
  const graceDay = useStore((state) => state.graceDay);
  const catchUpPlan = useStore((state) => state.catchUpPlan);
  const setCatchUpPlan = useStore((state) => state.setCatchUpPlan);
  const dismissCatchUpBanner = useStore((state) => state.dismissCatchUpBanner);
  const setDayMode = useStore((state) => state.setDayMode);
  const getDailyPlan = useStore((state) => state.getDailyPlan);
  const { newProblem, additionalProblems, reviewProblems, coldSolveProblem, dueSyntaxCards, recommendationReason, totalDueReviews, dayModeType } = getDailyPlan();

  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [isReview, setIsReview] = useState(false);
  const [isColdSolve, setIsColdSolve] = useState(false);

  // Phase 1 Milestone state
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneDismissed, setMilestoneDismissed] = useState(false);

  const newProblemData = newProblem ? problems.find(p => p.id === newProblem) : null;
  const reviewProblemsData = reviewProblems.map(id => problems.find(p => p.id === id)).filter(Boolean);
  const coldSolveData = coldSolveProblem ? problems.find(p => p.id === coldSolveProblem) : null;
  const syntaxDrillsData = (dueSyntaxCards || []).map(id => allSyntaxCards.find(c => c.id === id)).filter(Boolean);

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

  const phase1Problems = problems.filter(p => p.isNeetCode75);
  const phase1SolvedCount = phase1Problems.filter(p => progress[p.id]).length;

  let totalRating = 0;
  let ratingCount = 0;
  Object.values(progress).forEach(prog => {
    if (prog.history.length > 0) {
      totalRating += prog.history[prog.history.length - 1].rating;
      ratingCount++;
    }
  });
  const avgConfidence = ratingCount > 0 ? totalRating / ratingCount : 0;

  // Check if Phase 1 is complete
  if (phase === 1 && !showMilestone && !milestoneDismissed) {
    if (phase1SolvedCount === 75 && avgConfidence >= 2.0) {
      setTimeout(() => setShowMilestone(true), 500); // Small delay to let other animations finish
    }
  }

  // Pacing Indicator Logic
  const activityLog = useStore((state) => state.activityLog);
  const today = new Date();
  const phase1TargetDate = new Date('2026-05-01T00:00:00Z');

  // Calculate effective remaining problems for Phase 1 based on skill levels
  let effectiveProblemsRemaining = 0;
  problems.forEach(p => {
    if (p.isNeetCode75 && !progress[p.id]) {
      const skill = settings.skillLevels[p.category];
      if (skill === 'comfortable') {
        // Assume they don't need to do it or it takes 0 effort
        effectiveProblemsRemaining += 0;
      } else if (skill === 'some_exposure') {
        // Half weight
        effectiveProblemsRemaining += 0.5;
      } else {
        effectiveProblemsRemaining += 1;
      }
    }
  });

  // Calculate available working days until target
  let availableDaysUntilTarget = 0;
  let currentDate = new Date(today);

  while (currentDate <= phase1TargetDate) {
    const isRestDay = currentDate.getDay() === settings.studySchedule.restDay;
    const dateStr = currentDate.toISOString().split('T')[0];
    const isBlackout = settings.studySchedule.blackoutDates.some(
      b => dateStr >= b.start && dateStr <= b.end
    );

    if (!isRestDay && !isBlackout) {
      availableDaysUntilTarget++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  availableDaysUntilTarget = Math.max(1, availableDaysUntilTarget);

  let solvedLast14Days = 0;
  let activeDaysLast14 = 0;
  let totalStudyDays = 0;

  Object.keys(activityLog).forEach(dateKey => {
    if (activityLog[dateKey].solved > 0 || activityLog[dateKey].reviewed > 0) {
      totalStudyDays++;
    }
  });

  for (let i = 0; i < 14; i++) {
    const dateKey = new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (activityLog[dateKey]) {
      solvedLast14Days += activityLog[dateKey].solved;
      if (activityLog[dateKey].solved > 0 || activityLog[dateKey].reviewed > 0) {
        activeDaysLast14++;
      }
    }
  }

  // Calculate solve rate per ACTIVE day (not literal days, since some are rest/blackout)
  const solveRate = activeDaysLast14 === 0 ? 1 : solvedLast14Days / activeDaysLast14;
  const activeDaysNeeded = effectiveProblemsRemaining / solveRate;

  // Project forward to find actual finish date accounting for rest/blackout
  let projectedFinishDate = new Date(today);
  let daysSimulated = 0;
  let activeDaysCounted = 0;

  while (activeDaysCounted < activeDaysNeeded && daysSimulated < 365) {
    projectedFinishDate.setDate(projectedFinishDate.getDate() + 1);
    daysSimulated++;

    const isRestDay = projectedFinishDate.getDay() === settings.studySchedule.restDay;
    const dateStr = projectedFinishDate.toISOString().split('T')[0];
    const isBlackout = settings.studySchedule.blackoutDates.some(
      b => dateStr >= b.start && dateStr <= b.end
    );

    if (!isRestDay && !isBlackout) {
      activeDaysCounted++;
    }
  }

  let pacingStatus = 'green';
  let pacingMessage = '';

  if (effectiveProblemsRemaining === 0) {
    pacingStatus = 'green';
    pacingMessage = 'Phase 1 complete!';
  } else if (projectedFinishDate <= phase1TargetDate) {
    pacingStatus = 'green';
    pacingMessage = `On track to finish Phase 1 by ${projectedFinishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`;
  } else {
    const requiredRate = effectiveProblemsRemaining / availableDaysUntilTarget;
    // If Extend Timeline catch up is active, stretch the available days
    const effectiveDaysToTarget = catchUpPlan.active && catchUpPlan.type === 'EXTEND'
      ? availableDaysUntilTarget + (catchUpPlan.durationDays || 0)
      : availableDaysUntilTarget;

    const effectiveRequiredRate = effectiveProblemsRemaining / effectiveDaysToTarget;
    const extraPerDoc = effectiveRequiredRate - solveRate;

    if (extraPerDoc > 0) {
      if (extraPerDoc >= 1) {
        pacingStatus = 'red';
        pacingMessage = `At current pace you'll finish ${projectedFinishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Solve ${Math.ceil(extraPerDoc)} extra problem${Math.ceil(extraPerDoc) > 1 ? 's' : ''} on study days to hit required pace.`;
      } else {
        const daysPerExtraProblem = 1 / extraPerDoc;
        pacingStatus = 'yellow';
        pacingMessage = `At current pace you'll finish ${projectedFinishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Solve 1 extra problem every ${Math.round(daysPerExtraProblem)} study days.`;
      }
    } else {
      pacingStatus = 'green';
      pacingMessage = `On track to finish Phase 1 by ${projectedFinishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`;
    }
  }

  // Interview Readiness Score Calculation
  let readinessScore = 0;
  let phaseScore = 0; // 30%
  let confidenceScore = 0; // 25%
  let srHealthScore = 0; // 20%
  let mockScore = 0; // 15%
  let syntaxScore = 0; // 10%

  // 1. Phase Completion (30%)
  const readinessPhase1Problems = problems.filter(p => p.isNeetCode75);
  const readinessPhase1Solved = readinessPhase1Problems.filter(p => progress[p.id]).length;
  phaseScore = Math.min(30, (readinessPhase1Solved / 75) * 30);

  // 2. Average Confidence (25%)
  let readinessTotalRating = 0;
  let readinessRatingCount = 0;
  let totalReviewsHistory = 0;
  Object.values(progress).forEach(prog => {
    totalReviewsHistory += prog.reviewCount;
    if (prog.history.length > 0) {
      readinessTotalRating += prog.history[prog.history.length - 1].rating;
      readinessRatingCount++;
    }
  });
  const readinessAvgConfidence = readinessRatingCount > 0 ? readinessTotalRating / readinessRatingCount : 0;
  confidenceScore = Math.min(25, (readinessAvgConfidence / 3.0) * 25);

  // 3. SR Health (20%)
  const totalActive = Object.values(progress).filter(p => !p.retired).length;
  const overdueCount = Object.values(progress).filter(p => !p.retired && new Date(p.nextReviewAt) < new Date(today.setHours(0, 0, 0, 0))).length;
  const srHealthRatio = totalActive > 0 ? Math.max(0, 1 - (overdueCount / totalActive)) : 1;
  srHealthScore = srHealthRatio * 20;

  // 4. Mock Performance (15%)
  let mockRatingTotal = 0;
  let mockCount = 0;
  Object.values(progress).forEach(prog => {
    prog.history.forEach(h => {
      if (h.rawCode) { // basic heuristic for mock interview logged
        mockRatingTotal += h.rating;
        mockCount++;
      }
    });
  });
  const avgMockRating = mockCount > 0 ? mockRatingTotal / mockCount : 0;
  mockScore = Math.min(15, (avgMockRating / 3.0) * 15);

  // 5. Syntax Mastery (10%)
  const syntaxProgress = useStore((state) => state.syntaxProgress);
  let syntaxRatingTotal = 0;
  let syntaxCount = 0;
  Object.values(syntaxProgress).forEach(prog => {
    syntaxRatingTotal += prog.confidenceRating;
    syntaxCount++;
  });
  const avgSyntaxRating = syntaxCount > 0 ? syntaxRatingTotal / syntaxCount : 0;
  syntaxScore = Math.min(10, (avgSyntaxRating / 3.0) * 10);

  readinessScore = Math.round(phaseScore + confidenceScore + srHealthScore + mockScore + syntaxScore);

  let readinessMessage = "Just getting started. Keep building your foundation.";
  if (readinessScore >= 80) readinessMessage = "Highly prepared. Ready for onsite interviews.";
  else if (readinessScore >= 60) readinessMessage = "Solid progress. Good for phone screens, push harder for onsites.";
  else if (readinessScore >= 40) readinessMessage = "Building momentum. Focus on consistency and weak areas.";

  // Adaptive Catch-Up Logic
  let missedDaysCount = 0;
  if (streak.lastActiveDate) {
    const lastActive = new Date(streak.lastActiveDate);
    const todayStart = startOfDay(new Date());
    // Only count if it's strictly before yesterday to count as "missed"
    const diff = differenceInDays(todayStart, startOfDay(lastActive));
    if (diff >= 2) {
      missedDaysCount = diff - 1; // if diff is 2 (e.g. today is 3rd, last is 1st), missed 1 day. if diff 3, missed 2 days.
    }
  }

  const showCatchUpBanner = missedDaysCount >= 2 && !catchUpPlan.active;

  if (activeSession) {
    const problem = problems.find(p => p.id === activeSession);
    if (!problem) return null;
    return <Timer problem={problem} isNew={!isReview && !isColdSolve} isColdSolve={isColdSolve} onComplete={() => { setActiveSession(null); setIsColdSolve(false); }} />;
  }

  if (showMilestone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.15),transparent_70%)]" />
        <div className="relative max-w-2xl w-full premium-card p-8 sm:p-12 text-center border-emerald-500/30 overflow-hidden slide-in-from-bottom-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20" />

          <div className="relative z-10">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-8 border-4 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-[bounce_3s_infinite]">
              <Target size={48} className="text-emerald-400" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">Phase 1 Complete</h1>
            <p className="text-xl sm:text-2xl text-emerald-400 font-medium mb-8">You've mastered the NeetCode 75 Core.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 text-left">
              <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                <div className="text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">Problems</div>
                <div className="text-2xl font-bold text-zinc-100">{phase1SolvedCount}<span className="text-sm text-zinc-500 font-normal">/75</span></div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                <div className="text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">Avg Confidence</div>
                <div className="text-2xl font-bold text-emerald-400">{avgConfidence.toFixed(1)}<span className="text-sm text-zinc-500 font-normal">/3.0</span></div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                <div className="text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">Total Reviews</div>
                <div className="text-2xl font-bold text-amber-400">{totalReviewsHistory}</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                <div className="text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">Study Days</div>
                <div className="text-2xl font-bold text-indigo-400">{totalStudyDays}</div>
              </div>
            </div>

            <button
              onClick={() => { setShowMilestone(false); setMilestoneDismissed(true); }}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all flex items-center justify-center gap-3 w-full sm:w-auto mx-auto"
            >
              Enter Phase 2
              <Sparkles size={20} className="fill-current" />
            </button>
            <p className="text-zinc-500 text-sm mt-4">Phase 2 shifts focus to mock interviews and harder problems.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">

      {showCatchUpBanner && (
        <div className="premium-card p-4 sm:p-6 border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 mb-1">
                <CircleAlert size={18} />
                You've missed {missedDaysCount} study days
              </h3>
              <p className="text-sm text-zinc-300">Life happens! How would you like to handle your LC Tracker plan?</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCatchUpPlan('EXTEND', missedDaysCount)}
                className="flex-1 sm:flex-none px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-sm rounded-lg border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
                title="Pushes your target finish date back."
              >
                <Clock size={16} />
                Extend Timeline
              </button>
              <button
                onClick={() => setCatchUpPlan('CATCH_UP', missedDaysCount)}
                className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2"
                title="Slightly increases daily problems for a few days to catch up to original target."
              >
                <Zap size={16} />
                Catch Up Faster
              </button>
              <button
                onClick={dismissCatchUpBanner}
                className="px-2 py-2 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800/50 transition-colors"
                title="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Daily Plan</h1>
          <p className="text-zinc-400 mt-1">Don't think, just execute.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex bg-zinc-800/50 rounded-lg p-1 border border-zinc-700/50 mr-2">
            <button
              onClick={() => setDayMode(dayModeType === 'EASY' ? 'NORMAL' : 'EASY')}
              className={clsx(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                dayModeType === 'EASY'
                  ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
              )}
              title="Easy Mode: Only easy problems, no cold solves."
            >
              <Snowflake size={14} />
              Easy
            </button>
            <button
              onClick={() => setDayMode(dayModeType === 'HARD' ? 'NORMAL' : 'HARD')}
              className={clsx(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                dayModeType === 'HARD'
                  ? "bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
              )}
              title="Hard Mode: Forces hard problems and additional review."
            >
              <Flame size={14} />
              Hard
            </button>
          </div>

          <div className="flex items-center gap-2 premium-card px-3 sm:px-4 py-2" title={graceDay.usedThisWeek ? "Grace Day Used This Week" : "Grace Day Available This Week"}>
            <Flame className="text-orange-500" size={18} />
            <span className="font-medium text-sm sm:text-base text-zinc-100">{streak.current} Day Streak</span>
            {graceDay.usedThisWeek ? (
              <ShieldAlert size={14} className="text-zinc-500 ml-1" />
            ) : (
              <Shield size={14} className="text-emerald-400 ml-1" />
            )}
          </div>
          <div className="flex items-center gap-2 premium-card px-3 sm:px-4 py-2">
            <Clock className="text-emerald-400" size={18} />
            <span className="font-medium text-sm sm:text-base text-zinc-100 hidden sm:inline">
              {timeBreakdown ? `${timeBreakdown} = ` : ''}~{totalTime}m today
            </span>
            <span className="font-medium text-sm text-zinc-100 sm:hidden">
              ~{totalTime}m
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

            {/* Support Catch Up multiple new problems */}
            {newProblemData ? (
              <div className="space-y-4">
                {[newProblemData, ...(additionalProblems || []).map(id => problems.find(p => p.id === id)).filter(Boolean)].map((prob, idx) => {
                  if (!prob) return null;
                  const isPrimary = idx === 0;
                  return (
                    <div key={prob.id} className={clsx("premium-card p-6 relative overflow-hidden group border", isPrimary ? "border-emerald-500/20" : "border-amber-500/20")}>
                      {isPrimary && recommendationReason && (
                        <div className="absolute top-0 left-0 w-full bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                          <Sparkles size={14} />
                          {recommendationReason}
                        </div>
                      )}
                      {!isPrimary && (
                        <div className="absolute top-0 left-0 w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2 text-xs text-amber-500 font-medium">
                          <Zap size={14} />
                          Catch-Up Mode Additional Problem
                        </div>
                      )}
                      <div className={clsx("flex justify-between items-start mb-4", (isPrimary && recommendationReason) || !isPrimary ? "mt-8" : "")}>
                        <div>
                          <h3 className={clsx("text-xl font-semibold transition-colors", isPrimary ? "text-zinc-50 group-hover:text-emerald-400" : "text-zinc-200 group-hover:text-amber-400")}>{prob.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-3 text-xs">
                            <span className={clsx(
                              "px-2.5 py-1 rounded-md font-medium border",
                              prob.difficulty === 'Easy' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                prob.difficulty === 'Medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                  "bg-red-500/10 text-red-400 border-red-500/20"
                            )}>
                              {prob.difficulty}
                            </span>
                            <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                              {prob.category}
                            </span>
                            {prob.isBlind75 && (
                              <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                Blind 75
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a href={prob.leetcodeUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl text-zinc-300 transition-colors border border-zinc-700/50 hover:border-zinc-600" title="LeetCode">
                            <ExternalLink size={18} />
                          </a>
                          <a href={prob.videoUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl text-red-400 transition-colors border border-zinc-700/50 hover:border-zinc-600" title="NeetCode Video">
                            <Youtube size={18} />
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => { setActiveSession(prob.id); setIsReview(false); setIsColdSolve(false); }}
                        className={clsx(
                          "w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]",
                          !isPrimary && "bg-amber-500 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]"
                        )}
                      >
                        <Play size={18} className="fill-current" />
                        Start 35m Session
                      </button>
                    </div>
                  );
                })}
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
              Spaced Repetition Reviews ({reviewProblemsData.length}{(totalDueReviews && totalDueReviews > 5) ? ` of ${totalDueReviews}` : ''})
            </h2>
            {(totalDueReviews && totalDueReviews > 5) ? (
              <p className="text-sm text-zinc-400 mb-4 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                <span className="text-amber-400 font-semibold">{totalDueReviews - 5} review{(totalDueReviews - 5) !== 1 ? 's' : ''} deferred</span> to tomorrow to maintain a healthy workload. The 5 hardest problems are prioritized.
              </p>
            ) : null}
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

          {/* Syntax Drills */}
          {syntaxDrillsData && syntaxDrillsData.length > 0 && (
            <section className="slide-in-from-bottom-4" style={{ animationDelay: '0.25s' }}>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
                  <BookOpen size={20} className="text-purple-400" />
                  Syntax Drills ({syntaxDrillsData.length})
                </h2>
                <div className="text-xs text-zinc-500">Takes ~{syntaxDrillsData.length * 2}m to complete</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {syntaxDrillsData.map((card) => {
                  if (!card) return null;
                  return (
                    <div key={card.id} className="premium-card p-4 flex flex-col justify-between group h-full">
                      <div>
                        <div className="text-xs font-medium text-purple-400 mb-1 truncate">{card.category}</div>
                        <h4 className="text-sm font-medium text-zinc-100 group-hover:text-purple-400 transition-colors line-clamp-2">{card.description}</h4>
                      </div>
                      <button
                        onClick={() => {
                          // Could just navigate them to the Syntax Reference page
                          // For now, let's keep it simple. Ideally they use the sidebar to go to the page and drill.
                          const syntaxTabBtn = document.querySelector('button[aria-label="Syntax Reference"]') as HTMLButtonElement ||
                            Array.from(document.querySelectorAll('button')).find(el => el.textContent?.includes('Syntax Reference'));
                          if (syntaxTabBtn) syntaxTabBtn.click();
                        }}
                        className="mt-4 w-full py-1.5 px-3 bg-purple-500/10 hover:bg-purple-500 hover:text-white text-purple-400 text-xs font-medium rounded-lg transition-all border border-purple-500/20 hover:border-purple-500"
                      >
                        Drill Now
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
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
