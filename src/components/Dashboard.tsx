import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useStore, SPRINT_DESCRIPTIONS, SessionTiming } from '../store/useStore';
import { problems } from '../data/problems';
import { allSyntaxCards } from '../data/syntaxCards';
import { getPhase } from '../utils/dateUtils';
import { Play, CircleCheck, Clock, Flame, Target, ExternalLink, Youtube, CircleAlert, Sparkles, Snowflake, BookOpen, Zap, X, Brain, Shield, ShieldAlert, Timer, RotateCcw, TrendingDown, SkipForward, Trophy, Youtube as YT, Lock, ChevronRight, Swords } from 'lucide-react';
import { clsx } from 'clsx';
import { differenceInDays, startOfDay } from 'date-fns';
import { Timer as TimerComp } from './Timer';
import { WeeklySummary } from './WeeklySummary';

const DEFAULT_NEW_MINUTES = 20;
const DEFAULT_REVIEW_MINUTES = 10;
const MIN_DATA_POINTS = 3;

/** Minimal countdown clock for sprint retrospective (no active session involved) */
const RetroCountdown: React.FC<{ limitSeconds: number; onExpire: () => void }> = ({ limitSeconds, onExpire }) => {
  const [remaining, setRemaining] = useState(limitSeconds);
  const expiredRef = useRef(false);
  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          if (!expiredRef.current) { expiredRef.current = true; onExpire(); }
          clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const pct = Math.max(0, remaining / limitSeconds) * 100;
  const isLow = remaining < limitSeconds * 0.25;
  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={clsx('font-mono text-4xl font-bold tracking-tighter', isLow ? 'text-red-400' : 'text-amber-400')}>{m}:{s}</div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all duration-1000', isLow ? 'bg-red-500' : 'bg-amber-500')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/** Timer component for the dashboard header showing total time spent today */
const TodayTimer: React.FC<{ sessionTimings: SessionTiming[]; activeSession: any }> = ({ sessionTimings, activeSession }) => {
  const [activeElapsed, setActiveElapsed] = useState(0);

  const completedTodaySeconds = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return sessionTimings
      .filter(t => t.date.startsWith(todayStr))
      .reduce((sum, t) => sum + t.elapsedSeconds, 0);
  }, [sessionTimings]);

  useEffect(() => {
    if (!activeSession) {
      setActiveElapsed(0);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - activeSession.startTimestamp) / 1000);
      setActiveElapsed(Math.max(0, elapsed));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const totalSeconds = completedTodaySeconds + activeElapsed;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return (
    <div className="flex items-center gap-2 premium-card px-3 sm:px-4 py-2 border-emerald-500/20 bg-emerald-500/5">
      <Clock className="text-emerald-400 shrink-0" size={18} />
      <div className="flex flex-col">
        <span className="font-mono font-bold text-sm text-zinc-100 tabular-nums">
          {h > 0 ? `${h}h ` : ''}{m}m {s}s
        </span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Spent Today</span>
      </div>
    </div>
  );
};

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
  const activityLog = useStore((state) => state.activityLog);
  const activeSession = useStore((state) => state.activeSession);
  const startSession = useStore((state) => state.startSession);
  const categoryAvgSolveTimes = useStore((state) => state.categoryAvgSolveTimes);
  const categoryAvgReviewTimes = useStore((state) => state.categoryAvgReviewTimes);
  const sessionTimings = useStore((state) => state.sessionTimings);
  const lastCategoryAvgUpdate = useStore((state) => state.lastCategoryAvgUpdate);

  // Sprint state
  const sprintState = useStore((state) => state.sprintState);
  const sprintHistory = useStore((state) => state.sprintHistory);
  const recordSprintRetro = useStore((state) => state.recordSprintRetro);
  const proactiveNeetCodeProblemId = useStore((state) => state.proactiveNeetCodeProblemId);
  const dismissProactiveNeetCode = useStore((state) => state.dismissProactiveNeetCode);

  const { newProblem, additionalProblems, reviewProblems, coldSolveProblem, dueSyntaxCards, recommendationReason, totalDueReviews, dayModeType, isStabilizer, isRetro, sprintCategory, sprintDayInfo } = getDailyPlan();

  const [retroTimedOut, setRetroTimedOut] = useState(false);
  const [retroCompleted, setRetroCompleted] = useState(false);
  const [sprintCompletionDismissed, setSprintCompletionDismissed] = useState(false);

  const [isReview, setIsReview] = useState(false);
  const [isColdSolve, setIsColdSolve] = useState(false);
  const [skippedNewProblemIds, setSkippedNewProblemIds] = useState<Set<string>>(new Set());

  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneDismissed, setMilestoneDismissed] = useState(false);

  // Resolve the recommended new problem, excluding any the user has skipped this session
  const effectiveNewProblemId = useMemo(() => {
    if (!newProblem) return null;
    if (!skippedNewProblemIds.has(newProblem)) return newProblem;
    // Find the next unsolved problem not in the skip set
    const solvedIds = new Set(Object.keys(progress));
    const phase = getPhase();
    const allCandidates = problems.filter(p =>
      (phase === 3 ? p.isNeetCode150 : p.isNeetCode75) &&
      !solvedIds.has(p.id) &&
      !skippedNewProblemIds.has(p.id)
    );
    return allCandidates.length > 0 ? allCandidates[0].id : null;
  }, [newProblem, skippedNewProblemIds, progress]);

  const newProblemData = effectiveNewProblemId ? problems.find(p => p.id === effectiveNewProblemId) : null;
  const reviewProblemsData = reviewProblems.map(id => problems.find(p => p.id === id)).filter(Boolean);
  const coldSolveData = coldSolveProblem ? problems.find(p => p.id === coldSolveProblem) : null;
  const syntaxDrillsData = (dueSyntaxCards || []).map(id => allSyntaxCards.find(c => c.id === id)).filter(Boolean);

  // ── Dynamic Time Estimates ───────────────────────────────────────────────
  const getNewProblemMinutes = (category?: string): { minutes: number; isDefault: boolean } => {
    if (!category) return { minutes: DEFAULT_NEW_MINUTES, isDefault: true };
    const data = categoryAvgSolveTimes[category];
    if (!data || data.count < MIN_DATA_POINTS) return { minutes: DEFAULT_NEW_MINUTES, isDefault: true };
    return { minutes: Math.round(data.totalSeconds / data.count / 60), isDefault: false };
  };

  const getReviewMinutes = (category?: string): { minutes: number; isDefault: boolean } => {
    if (!category) return { minutes: DEFAULT_REVIEW_MINUTES, isDefault: true };
    const data = categoryAvgReviewTimes[category];
    if (!data || data.count < MIN_DATA_POINTS) return { minutes: DEFAULT_REVIEW_MINUTES, isDefault: true };
    return { minutes: Math.round(data.totalSeconds / data.count / 60), isDefault: false };
  };

  const timeItems: { label: string; minutes: number; isDefault: boolean }[] = [];

  if (newProblemData) {
    const est = getNewProblemMinutes(newProblemData.category);
    timeItems.push({ label: `1 new (${newProblemData.category})`, minutes: est.minutes, isDefault: est.isDefault });
  }
  additionalProblems.forEach(id => {
    const prob = problems.find(p => p.id === id);
    if (prob) {
      const est = getNewProblemMinutes(prob.category);
      timeItems.push({ label: `1 extra (${prob.category})`, minutes: est.minutes, isDefault: est.isDefault });
    }
  });
  reviewProblems.forEach(id => {
    const prob = problems.find(p => p.id === id);
    if (prob) {
      const est = getReviewMinutes(prob.category);
      timeItems.push({ label: `review (${prob.category})`, minutes: est.minutes, isDefault: est.isDefault });
    }
  });
  if (coldSolveData) {
    const est = getNewProblemMinutes(coldSolveData.category);
    timeItems.push({ label: `1 cold solve (${coldSolveData.category})`, minutes: est.minutes, isDefault: est.isDefault });
  }

  const totalTime = timeItems.reduce((sum, t) => sum + t.minutes, 0);
  const hasRealData = timeItems.some(t => !t.isDefault);
  const wasRecentlyRecalculated = lastCategoryAvgUpdate
    ? Date.now() - lastCategoryAvgUpdate < 30 * 60 * 1000 // within last 30 min
    : false;

  // ── Stats ─────────────────────────────────────────────────────────────────
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

  if (phase === 1 && !showMilestone && !milestoneDismissed) {
    if (phase1SolvedCount === 75 && avgConfidence >= 2.0) {
      setTimeout(() => setShowMilestone(true), 500);
    }
  }

  // ── Pacing ───────────────────────────────────────────────────────────────
  const today = new Date();
  const phase1TargetDate = new Date('2026-05-01T00:00:00Z');

  let effectiveProblemsRemaining = 0;
  problems.forEach(p => {
    if (p.isNeetCode75 && !progress[p.id]) {
      const skill = settings.skillLevels[p.category];
      if (skill === 'comfortable') {
        effectiveProblemsRemaining += 0;
      } else if (skill === 'some_exposure') {
        effectiveProblemsRemaining += 0.5;
      } else {
        effectiveProblemsRemaining += 1;
      }
    }
  });

  let availableDaysUntilTarget = 0;
  let currentDate = new Date(today);
  while (currentDate <= phase1TargetDate) {
    const isRestDay = currentDate.getDay() === settings.studySchedule.restDay;
    const dateStr = currentDate.toISOString().split('T')[0];
    const isBlackout = settings.studySchedule.blackoutDates.some(b => dateStr >= b.start && dateStr <= b.end);
    if (!isRestDay && !isBlackout) availableDaysUntilTarget++;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  availableDaysUntilTarget = Math.max(1, availableDaysUntilTarget);

  let solvedLast14Days = 0;
  let activeDaysLast14 = 0;
  let totalStudyDays = 0;

  Object.keys(activityLog).forEach(dateKey => {
    if (activityLog[dateKey].solved > 0 || activityLog[dateKey].reviewed > 0) totalStudyDays++;
  });
  for (let i = 0; i < 14; i++) {
    const dateKey = new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (activityLog[dateKey]) {
      solvedLast14Days += activityLog[dateKey].solved;
      if (activityLog[dateKey].solved > 0 || activityLog[dateKey].reviewed > 0) activeDaysLast14++;
    }
  }

  // Use real avg solve time for pacing if available
  const avgSolveMinutesForPacing = (() => {
    const cats = Object.keys(categoryAvgSolveTimes);
    if (cats.length === 0) return 25; // default
    const totalSec = cats.reduce((sum, c) => {
      const d = categoryAvgSolveTimes[c];
      return sum + (d.count >= MIN_DATA_POINTS ? d.totalSeconds / d.count : 25 * 60);
    }, 0);
    return Math.round(totalSec / cats.length / 60);
  })();

  const dailyMinutes = settings.studySchedule.weekdayMinutes;
  const problemsPerDay = Math.max(0.5, dailyMinutes / Math.max(avgSolveMinutesForPacing, 10));
  const solveRate = activeDaysLast14 === 0 ? problemsPerDay : solvedLast14Days / activeDaysLast14;
  const activeDaysNeeded = effectiveProblemsRemaining / solveRate;

  let projectedFinishDate = new Date(today);
  let daysSimulated = 0;
  let activeDaysCounted = 0;
  while (activeDaysCounted < activeDaysNeeded && daysSimulated < 365) {
    projectedFinishDate.setDate(projectedFinishDate.getDate() + 1);
    daysSimulated++;
    const isRestDay = projectedFinishDate.getDay() === settings.studySchedule.restDay;
    const dateStr = projectedFinishDate.toISOString().split('T')[0];
    const isBlackout = settings.studySchedule.blackoutDates.some(b => dateStr >= b.start && dateStr <= b.end);
    if (!isRestDay && !isBlackout) activeDaysCounted++;
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
    const effectiveDaysToTarget = catchUpPlan.active && catchUpPlan.type === 'EXTEND'
      ? availableDaysUntilTarget + (catchUpPlan.durationDays || 0)
      : availableDaysUntilTarget;
    const effectiveRequiredRate = effectiveProblemsRemaining / effectiveDaysToTarget;
    const extraPerDay = effectiveRequiredRate - solveRate;
    if (extraPerDay >= 1) {
      pacingStatus = 'red';
      pacingMessage = `At current pace you'll finish ${projectedFinishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Solve ${Math.ceil(extraPerDay)} extra problem${Math.ceil(extraPerDay) > 1 ? 's' : ''} on study days to hit required pace.`;
    } else if (extraPerDay > 0) {
      const daysPerExtra = 1 / extraPerDay;
      pacingStatus = 'yellow';
      pacingMessage = `At current pace you'll finish ${projectedFinishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Solve 1 extra problem every ${Math.round(daysPerExtra)} study days.`;
    } else {
      pacingStatus = 'green';
      pacingMessage = `On track to finish Phase 1 by ${projectedFinishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`;
    }
  }

  // ── Readiness Score ───────────────────────────────────────────────────────
  let phaseScore = 0;
  let confidenceScore = 0;
  let srHealthScore = 0;
  let mockScore = 0;
  let syntaxScore = 0;
  let speedBonusScore = 0;

  const readinessPhase1Problems = problems.filter(p => p.isNeetCode75);
  const readinessPhase1Solved = readinessPhase1Problems.filter(p => progress[p.id]).length;
  phaseScore = Math.min(30, (readinessPhase1Solved / 75) * 30);

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

  const totalActive = Object.values(progress).filter(p => !p.retired).length;
  const overdueCount = Object.values(progress).filter(p => !p.retired && new Date(p.nextReviewAt) < new Date(today.setHours(0, 0, 0, 0))).length;
  const srHealthRatio = totalActive > 0 ? Math.max(0, 1 - (overdueCount / totalActive)) : 1;
  srHealthScore = srHealthRatio * 20;

  let mockRatingTotal = 0;
  let mockCount = 0;
  Object.values(progress).forEach(prog => {
    prog.history.forEach(h => {
      if (h.rawCode) {
        mockRatingTotal += h.rating;
        mockCount++;
      }
    });
  });
  const avgMockRating = mockCount > 0 ? mockRatingTotal / mockCount : 0;
  mockScore = Math.min(15, (avgMockRating / 3.0) * 15);

  const syntaxProgress = useStore((state) => state.syntaxProgress);
  let syntaxRatingTotal = 0;
  let syntaxCount = 0;
  Object.values(syntaxProgress).forEach(prog => {
    syntaxRatingTotal += prog.confidenceRating;
    syntaxCount++;
  });
  const avgSyntaxRating = syntaxCount > 0 ? syntaxRatingTotal / syntaxCount : 0;
  syntaxScore = Math.min(10, (avgSyntaxRating / 3.0) * 10);

  // Solve time trend bonus — compare first 20 sessions avg vs last 20 sessions avg
  if (sessionTimings.length >= 20) {
    const sorted = [...sessionTimings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first20 = sorted.slice(0, 20);
    const last20 = sorted.slice(-20);
    const avgFirst = first20.reduce((s, t) => s + t.elapsedSeconds, 0) / 20;
    const avgLast = last20.reduce((s, t) => s + t.elapsedSeconds, 0) / 20;
    if (avgFirst > 0) {
      const improvement = (avgFirst - avgLast) / avgFirst;
      if (improvement >= 0.2) {
        speedBonusScore = 5; // max 5-point bonus
      } else if (improvement > 0) {
        speedBonusScore = Math.round((improvement / 0.2) * 5);
      }
    }
  }

  const readinessScore = Math.min(100, Math.round(phaseScore + confidenceScore + srHealthScore + mockScore + syntaxScore + speedBonusScore));

  let readinessMessage = "Just getting started. Keep building your foundation.";
  if (readinessScore >= 80) readinessMessage = "Highly prepared. Ready for onsite interviews.";
  else if (readinessScore >= 60) readinessMessage = "Solid progress. Good for phone screens, push harder for onsites.";
  else if (readinessScore >= 40) readinessMessage = "Building momentum. Focus on consistency and weak areas.";

  // ── Catch-Up Logic ─────────────────────────────────────────────────────────
  let missedDaysCount = 0;
  if (streak.lastActiveDate) {
    const lastActive = new Date(streak.lastActiveDate);
    const todayStart = startOfDay(new Date());
    const diff = differenceInDays(todayStart, startOfDay(lastActive));
    if (diff >= 2) missedDaysCount = diff - 1;
  }
  const showCatchUpBanner = missedDaysCount >= 2 && !catchUpPlan.active;

  // ── Active Session Handling ───────────────────────────────────────────────
  if (activeSession) {
    const problem = problems.find(p => p.id === activeSession.problemId);
    if (!problem) return null;
    return (
      <TimerComp
        problem={problem}
        isNew={!activeSession.isReview && !activeSession.isColdSolve}
        isColdSolve={activeSession.isColdSolve}
        onComplete={() => {/* session cleared in endSession */ }}
      />
    );
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
              Enter Phase 2 <Sparkles size={20} className="fill-current" />
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
              <button onClick={() => setCatchUpPlan('EXTEND', missedDaysCount)} className="flex-1 sm:flex-none px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-sm rounded-lg border border-zinc-700 flex items-center justify-center gap-2 transition-colors">
                <Clock size={16} /> Extend Timeline
              </button>
              <button onClick={() => setCatchUpPlan('CATCH_UP', missedDaysCount)} className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2">
                <Zap size={16} /> Catch Up Faster
              </button>
              <button onClick={dismissCatchUpBanner} className="px-2 py-2 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800/50 transition-colors"><X size={18} /></button>
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
          <div className="flex items-center gap-2 premium-card px-3 sm:px-4 py-2">
            <Flame className="text-orange-500" size={18} />
            <span className="font-medium text-sm sm:text-base text-zinc-100">{streak.current} Day Streak</span>
            {graceDay.usedThisWeek ? <ShieldAlert size={14} className="text-zinc-500 ml-1" /> : <Shield size={14} className="text-emerald-400 ml-1" />}
          </div>

          {/* Actual time spent today */}
          <TodayTimer sessionTimings={sessionTimings} activeSession={activeSession} />
        </div>
      </header>

      <WeeklySummary />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Proactive NeetCode Recommendation */}
          {proactiveNeetCodeProblemId && (() => {
            const ncp = problems.find(p => p.id === proactiveNeetCodeProblemId);
            if (!ncp) return null;
            return (
              <div className="premium-card p-4 border-red-500/30 bg-red-500/5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <Youtube size={18} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-400 mb-0.5">You've struggled with this pattern twice in a row</p>
                  <p className="text-xs text-zinc-400 mb-3">Here's the NeetCode explanation for <span className="text-zinc-200 font-medium">{ncp.title}</span> to build your foundation.</p>
                  <div className="flex gap-2">
                    {ncp.videoUrl && <a href={ncp.videoUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 flex items-center gap-1.5 transition-colors"><Youtube size={12} /> Watch Explanation</a>}
                    <button onClick={dismissProactiveNeetCode} className="px-3 py-1.5 bg-zinc-800/80 text-zinc-400 text-xs rounded-lg border border-zinc-700/50 hover:text-zinc-200 transition-colors">Dismiss</button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* New Problem / Sprint Retro */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              {isRetro ? <Swords size={20} className="text-amber-400" /> : <Target size={20} className="text-emerald-400" />}
              {isRetro ? 'Sprint Check' : "Today's Focus"}
            </h2>

            {isRetro && newProblemData ? (() => {
              const avgCatSeconds = categoryAvgSolveTimes[newProblemData.category];
              const avgSec = avgCatSeconds && avgCatSeconds.count >= 2
                ? Math.round(avgCatSeconds.totalSeconds / avgCatSeconds.count)
                : 20 * 60;
              const limitSeconds = Math.round(avgSec * 1.5);
              return (
                <div className="premium-card p-6 border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2 text-xs text-amber-400 font-semibold">
                    <Swords size={14} /> Sprint Check — Pass this to advance to the next category
                  </div>
                  <div className="mt-8 flex flex-col md:flex-row md:items-start gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-zinc-50 mb-3">{newProblemData.title}</h3>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className={clsx('px-2.5 py-1 rounded-md font-medium border', newProblemData.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : newProblemData.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20')}>{newProblemData.difficulty}</span>
                        <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">{newProblemData.category}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-3">Mock-interview style. Timer counts down. Rate yourself honestly — a 1 or timeout extends the sprint by 2 days.</p>
                      <div className="flex gap-2 mt-4">
                        <a href={newProblemData.leetcodeUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl text-zinc-300 transition-colors border border-zinc-700/50"><ExternalLink size={16} /></a>
                        <button onClick={() => startSession(newProblemData.id, false, false)} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl flex items-center gap-2 transition-all">
                          <Play size={16} className="fill-current" /> Start Sprint Check
                        </button>
                      </div>
                    </div>
                    <div className="md:w-48 shrink-0 flex flex-col items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Time Limit</p>
                      {retroTimedOut
                        ? <p className="text-red-400 font-semibold text-sm text-center">Time's up! Rate your attempt below.</p>
                        : <RetroCountdown limitSeconds={limitSeconds} onExpire={() => setRetroTimedOut(true)} />}
                      <p className="text-[10px] text-zinc-600 text-center mt-1">Based on your avg × 1.5 buffer</p>
                    </div>
                  </div>
                  {/* Quick rating after timeout or completion */}
                  {(retroTimedOut || retroCompleted) && (
                    <div className="mt-4 pt-4 border-t border-amber-500/20">
                      <p className="text-sm text-zinc-300 mb-3">How did the Sprint Check go?</p>
                      <div className="flex gap-2">
                        <button onClick={() => { recordSprintRetro(true, 3); setRetroCompleted(false); setRetroTimedOut(false); }} className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-lg border border-emerald-500/20 transition-colors">✓ Passed (2–3)</button>
                        <button onClick={() => { recordSprintRetro(false, 1); setRetroCompleted(false); setRetroTimedOut(false); }} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-lg border border-red-500/20 transition-colors">✗ Struggled (1)</button>
                      </div>
                    </div>
                  )}
                  {!retroTimedOut && !retroCompleted && (
                    <button onClick={() => setRetroCompleted(true)} className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 underline transition-colors">I finished — rate my attempt</button>
                  )}
                </div>
              );
            })() : newProblemData ? (
              <div className="space-y-4">
                {[newProblemData, ...(additionalProblems || []).map(id => problems.find(p => p.id === id)).filter(Boolean)].map((prob, idx) => {
                  if (!prob) return null;
                  const isPrimary = idx === 0;
                  const est = getNewProblemMinutes(prob.category);
                  const showStabilizer = isPrimary && isStabilizer;
                  return (
                    <div key={prob.id} className={clsx('premium-card p-6 relative overflow-hidden group border', isPrimary ? 'border-emerald-500/20' : 'border-amber-500/20')}>
                      {isPrimary && recommendationReason && (
                        <div className={clsx('absolute top-0 left-0 w-full border-b px-4 py-2 flex items-center gap-2 text-xs font-medium', showStabilizer ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400')}>
                          {showStabilizer ? <TrendingDown size={14} /> : <Sparkles size={14} />}
                          {recommendationReason}
                        </div>
                      )}
                      {!isPrimary && (
                        <div className="absolute top-0 left-0 w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2 text-xs text-amber-500 font-medium">
                          <Zap size={14} /> Catch-Up Mode Additional Problem
                        </div>
                      )}
                      <div className={clsx('flex justify-between items-start mb-4', (isPrimary && recommendationReason) || !isPrimary ? 'mt-8' : '')}>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={clsx('text-xl font-semibold transition-colors', isPrimary ? 'text-zinc-50 group-hover:text-emerald-400' : 'text-zinc-200 group-hover:text-amber-400')}>{prob.title}</h3>
                            {showStabilizer && <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-bold">Stabilizer</span>}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3 text-xs">
                            <span className={clsx('px-2.5 py-1 rounded-md font-medium border', prob.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : prob.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20')}>{prob.difficulty}</span>
                            <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">{prob.category}</span>
                            {prob.isBlind75 && <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Blind 75</span>}
                            <span className={clsx('px-2.5 py-1 rounded-md border flex items-center gap-1', est.isDefault ? 'bg-zinc-800/50 text-zinc-500 border-zinc-700/30' : 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20')}>
                              <Timer size={10} />
                              ~{est.minutes}m {est.isDefault ? '(default est.)' : 'avg'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isPrimary && (
                            <button
                              onClick={() => setSkippedNewProblemIds(prev => new Set([...prev, prob.id]))}
                              className="p-2.5 bg-zinc-800/80 hover:bg-amber-500/10 hover:border-amber-500/30 rounded-xl text-zinc-400 hover:text-amber-400 transition-colors border border-zinc-700/50"
                              title="Skip this problem"
                            >
                              <SkipForward size={18} />
                            </button>
                          )}
                          <a href={prob.leetcodeUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl text-zinc-300 transition-colors border border-zinc-700/50 hover:border-zinc-600"><ExternalLink size={18} /></a>
                          <a href={prob.videoUrl} target="_blank" rel="noreferrer" className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-xl text-red-400 transition-colors border border-zinc-700/50 hover:border-zinc-600"><Youtube size={18} /></a>
                        </div>
                      </div>
                      <button
                        onClick={() => startSession(prob.id, false, false)}
                        className={clsx(
                          'w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]',
                          !isPrimary && 'bg-amber-500 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                        )}
                      >
                        <Play size={18} className="fill-current" />
                        Start Session
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="premium-card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20"><CircleCheck size={32} className="text-emerald-500" /></div>
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
                    <p className="text-xs text-zinc-400 mt-1">Not touched in &gt;30 days. No hints. Your pace.</p>
                  </div>
                  <button
                    onClick={() => startSession(coldSolveData.id, true, true)}
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
              <RotateCcw size={20} className="text-amber-400" />
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
                  const reviewEst = getReviewMinutes(prob.category);
                  return (
                    <div key={prob.id} className="premium-card p-4 flex items-center justify-between group">
                      <div>
                        <h4 className="font-medium text-zinc-100 group-hover:text-amber-400 transition-colors">{prob.title}</h4>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                          <span className="px-2 py-0.5 rounded bg-zinc-800/50 border border-zinc-700/50">{prob.category}</span>
                          <span className={clsx("px-2 py-0.5 rounded border", lastRating === 1 ? "bg-red-500/10 text-red-400 border-red-500/20" : lastRating === 2 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : lastRating === 3 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800/50 text-zinc-400 border-zinc-700/50")}>
                            {lastRating ? `Last: ${lastRating}` : 'Unrated'}
                          </span>
                          <span className={clsx("px-2 py-0.5 rounded border flex items-center gap-0.5", reviewEst.isDefault ? "text-zinc-600 border-zinc-800" : "text-emerald-600 border-emerald-900")}>
                            <Timer size={9} />
                            ~{reviewEst.minutes}m
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => startSession(prob.id, true, false)}
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
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 border border-amber-500/20"><CircleCheck size={32} className="text-amber-500" /></div>
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
                          const syntaxTabBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.includes('Syntax Reference'));
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

        {/* Sidebar */}
        <div className="space-y-6 slide-in-from-bottom-4 lg:sticky lg:top-8 self-start" style={{ animationDelay: '0.3s' }}>
          {/* Sprint Card (Phase 1) or Phase Status (Phase 2+) */}
          {phase === 1 && sprintState && sprintState.sprintStatus !== 'complete' ? (
            <div className="premium-card p-6 border-indigo-500/20 bg-indigo-500/5">
              <div className="flex items-center gap-2 mb-1">
                <Swords size={18} className="text-indigo-400" />
                <h3 className="font-semibold text-zinc-100">Current Sprint</h3>
              </div>
              <p className="text-xs text-indigo-400 font-semibold mb-3 uppercase tracking-wider">{sprintState.currentCategory}</p>
              {sprintDayInfo && (
                <>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>Day {sprintDayInfo.day} of {sprintDayInfo.total}</span>
                    <span>{Math.round((sprintDayInfo.day / sprintDayInfo.total) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/50 mb-3">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.round((sprintDayInfo.day / sprintDayInfo.total) * 100))}%` }} />
                  </div>
                </>
              )}
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">{SPRINT_DESCRIPTIONS[sprintState.currentCategory] ?? 'Focused pattern drilling.'}</p>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Overall Progress</span>
                <span className="text-zinc-100 font-medium">{solvedCount} / {targetCount}</span>
              </div>
              <div className="h-1.5 bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/50 mt-1">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
              </div>
              {phase === 1 && (
                <div className="mt-3 text-xs">
                  <div className={clsx('flex items-start gap-2 p-2.5 rounded-lg border', pacingStatus === 'green' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : pacingStatus === 'yellow' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-red-500/10 border-red-500/20 text-red-400')}>
                    <Target size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{pacingMessage}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="premium-card p-6">
              <h3 className="font-semibold text-zinc-100 mb-2">Phase {phase} Status</h3>
              <p className="text-sm text-zinc-400 mb-5">
                {phase === 1 ? 'NeetCode 75 Core (No Graphs/DP)' : phase === 2 ? 'Internship Mode (3x/week)' : 'Recruiting Grind (NC 150 + Mocks)'}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Progress</span>
                  <span className="text-zinc-100 font-medium">{solvedCount} / {targetCount}</span>
                </div>
                <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/50">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 relative" style={{ width: `${progressPercent}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
                  </div>
                </div>
                {phase === 1 && (
                  <div className="mt-4 text-sm">
                    <div className={clsx('flex items-start gap-2 p-3 rounded-lg border', pacingStatus === 'green' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : pacingStatus === 'yellow' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-red-500/10 border-red-500/20 text-red-400')}>
                      <Target size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{pacingMessage}</span>
                    </div>
                    {Object.keys(categoryAvgSolveTimes).length >= 1 && (
                      <p className="text-[10px] text-zinc-600 mt-1 pl-1">Projection uses your real solve-time data.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Readiness Score */}
          <div className="premium-card p-6">
            <h3 className="font-semibold text-zinc-100 mb-1 flex items-center gap-2">
              <Brain size={18} className="text-indigo-400" />
              Interview Readiness
            </h3>
            <p className="text-xs text-zinc-500 mb-4">{readinessMessage}</p>
            <div className="text-5xl font-black text-zinc-50 mb-4">{readinessScore}<span className="text-xl text-zinc-500">/100</span></div>

            <div className="space-y-2 text-xs">
              {[
                { label: 'Phase Completion', value: phaseScore, max: 30 },
                { label: 'Avg Confidence', value: confidenceScore, max: 25 },
                { label: 'SR Health', value: srHealthScore, max: 20 },
                { label: 'Mock Performance', value: mockScore, max: 15 },
                { label: 'Syntax Mastery', value: syntaxScore, max: 10 },
              ].map(c => (
                <div key={c.label}>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>{c.label}</span>
                    <span>{Math.round(c.value)}/{c.max}</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(c.value / c.max) * 100}%` }} />
                  </div>
                </div>
              ))}
              {speedBonusScore > 0 && (
                <div>
                  <div className="flex justify-between text-emerald-400 mb-1">
                    <span className="flex items-center gap-1"><TrendingDown size={10} /> Speed Improvement Bonus</span>
                    <span>+{speedBonusScore}/5</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(speedBonusScore / 5) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Today's time breakdown detail */}
          {timeItems.length > 0 && (
            <div className="premium-card p-5">
              <h3 className="font-semibold text-zinc-100 mb-3 flex items-center gap-2 text-sm">
                <Clock size={16} className="text-emerald-400" />
                Time Breakdown
              </h3>
              <div className="space-y-2">
                {timeItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 capitalize">{item.label}</span>
                    <span className={clsx("font-mono font-medium", item.isDefault ? "text-zinc-500" : "text-emerald-400")}>
                      {item.minutes}m{item.isDefault ? ' *' : ''}
                    </span>
                  </div>
                ))}
                <div className="border-t border-zinc-800 pt-2 flex justify-between text-xs font-semibold">
                  <span className="text-zinc-300">Total</span>
                  <span className="text-zinc-100">{totalTime}m</span>
                </div>
                {timeItems.some(t => t.isDefault) && (
                  <p className="text-[10px] text-zinc-600">* default estimate (need 3+ sessions)</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
