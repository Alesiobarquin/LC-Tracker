import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  problems,
  allProblems, allProblemsById,
  PHASE_1_CATEGORIES,
  problemsPoolForTargetCurriculum,
  countTargetCurriculumProblems,
  TARGET_CURRICULUM_LABELS,
} from '../data/problems';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import {
  Trophy, Lightbulb, TrendingUp, AlertTriangle, History,
  Timer, FileCode2, X, CheckSquare, Swords, CheckCircle2, RotateCcw, Target, LineChart,
} from 'lucide-react';
import { clsx } from 'clsx';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import {
  SPRINT_DESCRIPTIONS,
  fetchSessionTimingsBefore,
  getSessionTimingsWindowStartIso,
  useActivityLog,
  useProblemProgress,
  useSessionTimings,
  useSprintState,
  useUserSettings,
} from '../hooks/useUserData';
import { calculateSessionAggregates } from '../utils/progressHelpers';
import type { SessionTiming } from '../types';
import { useUser } from '@clerk/clerk-react';
import { AnalyticsSkeleton } from './loadingSkeletons';

const fmtSeconds = (s: number): string => {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
};

const SESSION_HISTORY_DEFAULT_COUNT = 5;
const neetcode250Total = problems.filter((p) => p.isNeetCode250).length;

export const Analytics: React.FC = () => {
  const { user } = useUser();
  const { progress, isLoading: progressLoading } = useProblemProgress();
  const { data: activityLog } = useActivityLog();
  const { sessionTimings, isLoading: timingsLoading } = useSessionTimings();
  const { sprintState, sprintHistory } = useSprintState();
  const { settings } = useUserSettings();

  const [olderTimings, setOlderTimings] = useState<SessionTiming[]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [viewingSession, setViewingSession] = useState<any>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  useEffect(() => {
    setOlderTimings([]);
    setOlderCursor(null);
    setHasMoreOlder(true);
  }, [user?.id]);

  const combinedTimings = useMemo(() => {
    const map = new Map<string, SessionTiming>();
    for (const t of sessionTimings) map.set(t.id, t);
    for (const t of olderTimings) map.set(t.id, t);
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [sessionTimings, olderTimings]);

  const { personalBestTimes } = useMemo(
    () => calculateSessionAggregates(combinedTimings),
    [combinedTimings]
  );

  const handleLoadMoreTimings = useCallback(async () => {
    if (!user?.id || loadingOlder || !hasMoreOlder) return;
    setLoadingOlder(true);
    try {
      const cursor = olderCursor ?? getSessionTimingsWindowStartIso();
      const batch = await fetchSessionTimingsBefore(user.id, cursor, 500);
      if (batch.length === 0) {
        setHasMoreOlder(false);
      } else {
        setOlderTimings((prev) => [...prev, ...batch]);
        setOlderCursor(batch[batch.length - 1].date);
        if (batch.length < 500) setHasMoreOlder(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOlder(false);
    }
  }, [user?.id, loadingOlder, hasMoreOlder, olderCursor]);

  const solvedCount = Object.keys(progress).length;
  const activeRotationCount = Object.values(progress).filter(p => !p.retired).length;
  const retiredCount = Object.values(progress).filter(p => p.retired).length;

  const curriculum = settings.targetCurriculum ?? 'NEET_75';
  const targetCurriculumTotal = countTargetCurriculumProblems(curriculum);
  const targetCurriculumSolved = useMemo(
    () => problemsPoolForTargetCurriculum(curriculum).filter((p) => !!progress[p.id]).length,
    [progress, curriculum]
  );
  const targetCurriculumPct =
    targetCurriculumTotal > 0 ? Math.round((targetCurriculumSolved / targetCurriculumTotal) * 100) : 0;

  const neetcode250Solved = useMemo(
    () => problems.filter(p => p.isNeetCode250 && !!progress[p.id]).length,
    [progress]
  );
  const neetcode250Pct = neetcode250Total > 0 ? Math.round((neetcode250Solved / neetcode250Total) * 100) : 0;

  // ── Category Stats ─────────────────────────────────────────────────────────
  const categoryStats = useMemo(() => {
    const stats: Record<string, { totalRating: number; count: number }> = {};

    Object.entries(progress).forEach(([problemId, prog]) => {
      const prob = allProblemsById.get(problemId);
      if (!prob || prog.history.length === 0) return;
      const lastRating = prog.history[prog.history.length - 1].rating;
      if (!stats[prob.category]) stats[prob.category] = { totalRating: 0, count: 0 };
      stats[prob.category].totalRating += lastRating;
      stats[prob.category].count += 1;
    });
    return stats;
  }, [progress]);

  // Confidence per category, sorted weakest-first for actionability
  const confidenceData = useMemo(() => {
    return Object.entries(categoryStats)
      .filter(([, s]) => s.count > 0)
      .map(([name, s]) => ({
        name,
        avg: Number((s.totalRating / s.count).toFixed(1)),
      }))
      .sort((a, b) => a.avg - b.avg);
  }, [categoryStats]);

  // ── Insights ───────────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    if (confidenceData.length === 0) return [];
    const weakest = confidenceData[0];
    const strongest = confidenceData[confidenceData.length - 1];
    const result = [];

    if (weakest && weakest.avg < 2.0) {
      result.push({
        title: `Needs Work: ${weakest.name}`,
        description: `Your confidence in ${weakest.name} is low (${weakest.avg}/5). Prioritize foundational problems here.`,
        icon: <AlertTriangle className="text-red-400" size={18} />,
        color: 'border-red-500/20 bg-red-500/5',
      });
    }
    const developing = confidenceData.find(c => c.avg >= 2.0 && c.avg < 2.5);
    if (developing) {
      result.push({
        title: `Developing: ${developing.name}`,
        description: `Getting there on ${developing.name} (${developing.avg}/5) — focus on optimizing time complexity.`,
        icon: <TrendingUp className="text-amber-400" size={18} />,
        color: 'border-amber-500/20 bg-amber-500/5',
      });
    }
    if (strongest && strongest.avg >= 2.5) {
      result.push({
        title: `Strong: ${strongest.name}`,
        description: `${strongest.name} is your strongest area (${strongest.avg}/5). Keep maintaining it.`,
        icon: <Trophy className="text-emerald-400" size={18} />,
        color: 'border-emerald-500/20 bg-emerald-500/5',
      });
    }
    return result;
  }, [confidenceData]);

  // ── Session History ────────────────────────────────────────────────────────
  const sessionHistory = useMemo(() => {
    const allSessions: {
      problemId: string;
      title: string;
      category: string;
      date: string;
      rating: number;
      elapsedSeconds?: number;
      sessionType?: string;
      rawCode?: string;
      optimalSolution?: string;
      approachSimilarity?: number;
      usedInAppEditor?: boolean;
      mockTimeLimitSeconds?: number;
    }[] = [];

    Object.entries(progress).forEach(([problemId, prog]) => {
      const prob = allProblemsById.get(problemId);
      if (!prob) return;
      prog.history.forEach(entry => {
        allSessions.push({
          problemId,
          title: prob.title,
          category: prob.category,
          date: entry.date,
          rating: entry.rating,
          elapsedSeconds: entry.elapsedSeconds,
          sessionType: entry.sessionType,
          rawCode: entry.rawCode,
          optimalSolution: entry.optimalSolution,
          approachSimilarity: entry.approachSimilarity,
          usedInAppEditor: entry.usedInAppEditor,
          mockTimeLimitSeconds: entry.mockTimeLimitSeconds,
        });
      });
    });

    return allSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [progress]);

  // ── Solve Time per Category ────────────────────────────────────────────────
  const totalSecondsAllTime = useMemo(
    () => combinedTimings.reduce((acc, t) => acc + t.elapsedSeconds, 0),
    [combinedTimings]
  );

  // Avg new/cold-solve time per category with improvement direction
  const categoryTimeData = useMemo(() => {
    const byCat: Record<string, number[]> = {};
    combinedTimings
      .filter(t => t.sessionType === 'new' || t.sessionType === 'cold_solve')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(t => {
        if (!byCat[t.category]) byCat[t.category] = [];
        byCat[t.category].push(t.elapsedSeconds);
      });

    return Object.fromEntries(
      Object.entries(byCat)
        .filter(([, times]) => times.length >= 1)
        .map(([cat, times]) => {
          const avg = times.reduce((s, t) => s + t, 0) / times.length;
          const firstHalf = times.slice(0, Math.max(1, Math.floor(times.length / 2)));
          const lastHalf = times.slice(Math.floor(times.length / 2));
          const firstAvg = firstHalf.reduce((s, t) => s + t, 0) / firstHalf.length;
          const lastAvg = lastHalf.reduce((s, t) => s + t, 0) / lastHalf.length;
          return [cat, {
            avgMinutes: Math.round(avg / 60),
            improving: lastAvg < firstAvg * 0.95,
            count: times.length,
          }];
        })
    ) as Record<string, { avgMinutes: number; improving: boolean; count: number }>;
  }, [combinedTimings]);

  // Unified category performance — confidence + solve time on one row, weakest first
  const categoryPerformanceData = useMemo(() => {
    return confidenceData.map(cat => ({
      name: cat.name,
      confidence: cat.avg,
      ...(categoryTimeData[cat.name] ?? { avgMinutes: null, improving: null, count: 0 }),
    }));
  }, [confidenceData, categoryTimeData]);

  // ── Heatmap ────────────────────────────────────────────────────────────────
  const today = new Date();
  const targetDate = new Date('2026-09-15T00:00:00Z');
  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + 14);
  const startDate = subDays(endDate, 364);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const startDayOfWeek = startDate.getDay();
  const paddedDays = Array(startDayOfWeek).fill(null).concat(days);
  const targetIndex = paddedDays.findIndex(d => d && isSameDay(d, targetDate));
  const targetColumn = targetIndex >= 0 ? Math.floor(targetIndex / 7) : -1;
  const todayIndex = paddedDays.findIndex(d => d && isSameDay(d, today));
  const todayColumn = todayIndex >= 0 ? Math.floor(todayIndex / 7) : -1;

  const isSprintActive = !!sprintState && sprintState.sprintStatus !== 'complete';

  // ── Sprint helpers ─────────────────────────────────────────────────────────
  const getSprintEstimatedLength = (cat: string): number => {
    const historyEntry = sprintHistory.find(h => h.category === cat);
    const isCurrent = sprintState?.currentCategory === cat && sprintState.sprintStatus !== 'complete';
    const skillLevel = settings.skillLevels?.[cat] ?? 'not_familiar';
    const baseLen = skillLevel === 'comfortable' ? 2 : skillLevel === 'some_exposure' ? 4 : 6;
    const multiplier = settings.sprintSettings?.lengthMultiplier ?? 1.0;
    if (historyEntry) return historyEntry.sprintLength;
    if (isCurrent) return sprintState!.sprintLength + sprintState!.extensionDays;
    return Math.round(baseLen * multiplier);
  };

  if (progressLoading || timingsLoading) {
    return <AnalyticsSkeleton />;
  }

  // ── Sprint Schedule (conditionally positioned) ─────────────────────────────
  const SprintScheduleSection = (
    <section className="premium-card p-6 border-indigo-500/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Swords size={16} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Sprint Schedule</h2>
          <p className="text-sm text-zinc-500">Phase 1 learning plan — each row is one category sprint.</p>
        </div>
      </div>

      <div className="space-y-2.5 mb-8">
        {PHASE_1_CATEGORIES.map((cat, index) => {
          const historyEntry = sprintHistory.find(h => h.category === cat);
          const isCurrent = sprintState?.currentCategory === cat && sprintState.sprintStatus !== 'complete';
          const isCompleted = !!historyEntry;
          const estLen = getSprintEstimatedLength(cat);
          return (
            <div key={cat} className={clsx(
              'relative rounded-xl border px-5 py-4 transition-all duration-300',
              isCurrent
                ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                : isCompleted
                  ? 'bg-zinc-900/30 border-zinc-800/40 opacity-70'
                  : 'bg-zinc-900/20 border-zinc-800/30'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-700 shrink-0" />
                  )}
                  <div>
                    <p className={clsx(
                      'font-semibold text-sm',
                      isCurrent ? 'text-zinc-50' : isCompleted ? 'text-zinc-400' : 'text-zinc-500'
                    )}>{cat}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {(SPRINT_DESCRIPTIONS[cat] ?? '').substring(0, 60)}…
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-xs text-zinc-500">{estLen} day{estLen !== 1 ? 's' : ''}</p>
                    {isCurrent && (
                      <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mt-0.5">Active</p>
                    )}
                    {isCompleted && (
                      <p className={clsx(
                        'text-[10px] font-semibold uppercase tracking-wider mt-0.5',
                        historyEntry!.passed ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {historyEntry!.passed ? 'Passed' : 'Extended'}
                      </p>
                    )}
                  </div>
                  <span className={clsx(
                    'text-[10px] font-bold uppercase px-2 py-1 rounded-md border',
                    isCompleted
                      ? 'bg-zinc-800/50 text-zinc-600 border-zinc-700/30'
                      : isCurrent
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                        : 'bg-zinc-800/30 text-zinc-700 border-zinc-800/30'
                  )}>Sprint {index + 1}</span>
                </div>
              </div>
              {isCurrent && sprintState && (() => {
                const start = new Date(sprintState.sprintStartDate);
                const day = Math.min(Math.ceil((Date.now() - start.getTime()) / 86400000), estLen);
                const pct = Math.min(100, Math.round((day / estLen) * 100));
                return (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Day {day} of {estLen}</span><span>{pct}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {sprintHistory.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <History size={16} className="text-zinc-500" /> Sprint History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 font-medium">Duration</th>
                  <th className="pb-2 pr-4 font-medium">Avg Solve</th>
                  <th className="pb-2 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {sprintHistory.map((entry, i) => (
                  <tr key={i} className="text-xs">
                    <td className="py-2.5 pr-4 text-zinc-200 font-medium">{entry.category}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{entry.sprintLength}d</td>
                    <td className="py-2.5 pr-4 text-zinc-400">
                      {entry.avgSolveSeconds > 0 ? `${Math.round(entry.avgSolveSeconds / 60)}m` : '—'}
                    </td>
                    <td className="py-2.5">
                      {entry.passed
                        ? <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={13} /> Passed</span>
                        : <span className="flex items-center gap-1 text-amber-400"><RotateCcw size={13} /> Extended</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 flex items-center gap-3">
          <LineChart className="text-emerald-400" size={32} />
          Analytics
        </h1>
        <p className="text-zinc-400 mt-1">Track your progress and identify areas to improve.</p>
      </header>

      {/* ── Active Sprint Banner ──────────────────────────────────────────────── */}
      {isSprintActive && sprintState && (() => {
        const estLen = sprintState.sprintLength + sprintState.extensionDays;
        const start = new Date(sprintState.sprintStartDate);
        const day = Math.min(Math.ceil((Date.now() - start.getTime()) / 86400000), estLen);
        const pct = Math.min(100, Math.round((day / estLen) * 100));
        return (
          <div className="premium-card p-6 border-indigo-500/30 bg-indigo-500/5 slide-in-from-bottom-4 shadow-[0_0_30px_rgba(99,102,241,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Swords size={20} className="text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-zinc-100">Active Sprint</h2>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 tracking-wider">
                      In Progress
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm mt-0.5">
                    <span className="text-zinc-200 font-medium">{sprintState.currentCategory}</span>
                    {' · '}Day {day} of {estLen}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-indigo-400">{pct}%</p>
                <p className="text-xs text-zinc-500">complete</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-zinc-600 mt-2 line-clamp-1">
                {SPRINT_DESCRIPTIONS[sprintState.currentCategory] ?? ''}
              </p>
            </div>
          </div>
        );
      })()}

      {/* ── Stat Cards — 3 metrics that matter ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Solved */}
        <div className="premium-card p-6 slide-in-from-bottom-4" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="text-emerald-400" size={20} />
            <h3 className="text-zinc-400 font-medium">Total Solved</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-50">{solvedCount}</p>
          <p className="text-xs text-zinc-500 mt-2">{retiredCount} mastered · {activeRotationCount} in queue</p>
        </div>

        {/* Target curriculum (Settings) — same list the planner uses */}
        <div className="premium-card p-6 slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <Target className="text-indigo-400" size={20} />
            <h3 className="text-zinc-400 font-medium">Target list</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-2">{TARGET_CURRICULUM_LABELS[curriculum]}</p>
          <p className="text-3xl font-bold text-zinc-50 flex items-baseline gap-2">
            {targetCurriculumSolved}
            <span className="text-sm font-medium text-zinc-500">/ {targetCurriculumTotal}</span>
          </p>
          <div className="mt-3">
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${targetCurriculumPct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1.5">{targetCurriculumPct}% complete</p>
          </div>
        </div>

        {/* NeetCode 250 — full beginner curriculum */}
        <div className="premium-card p-6 slide-in-from-bottom-4" style={{ animationDelay: '125ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <Target className="text-cyan-400" size={20} />
            <h3 className="text-zinc-400 font-medium">NeetCode 250</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-50 flex items-baseline gap-2">
            {neetcode250Solved}
            <span className="text-sm font-medium text-zinc-500">/ {neetcode250Total}</span>
          </p>
          <div className="mt-3">
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-700"
                style={{ width: `${neetcode250Pct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1.5">{neetcode250Pct}% complete</p>
          </div>
        </div>

        {/* Time Invested */}
        <div className="premium-card p-6 slide-in-from-bottom-4" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <Timer className="text-rose-400" size={20} />
            <h3 className="text-zinc-400 font-medium">Time Invested</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-50">
            {totalSecondsAllTime >= 3600
              ? `${Math.round(totalSecondsAllTime / 3600)}h`
              : `${Math.round(totalSecondsAllTime / 60)}m`}
          </p>
          <p className="text-xs text-zinc-500 mt-2">{combinedTimings.length} timed sessions</p>
        </div>
      </div>

      {/* ── Sprint Schedule (elevated when active) ───────────────────────────── */}
      {isSprintActive && SprintScheduleSection}

      {/* ── Pattern Insights + Heatmap ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights */}
        <div className="lg:col-span-1 space-y-3 slide-in-from-bottom-4" style={{ animationDelay: '200ms' }}>
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-400" />
            Pattern Insights
          </h3>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className={`premium-card p-4 border ${insight.color}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{insight.icon}</div>
                    <div>
                      <h4 className="font-medium text-zinc-100 text-sm">{insight.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="premium-card p-8 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="w-12 h-12 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mx-auto mb-4 relative z-10">
                <Lightbulb size={20} className="text-zinc-600 group-hover:text-amber-400 transition-colors duration-500" />
              </div>
              <p className="text-zinc-400 text-sm relative z-10">
                Solve more problems to unlock <span className="text-amber-400/80 font-medium">insights</span>.
              </p>
            </div>
          )}
        </div>

        {/* Activity Heatmap */}
        <div className="lg:col-span-2 premium-card p-6 overflow-hidden slide-in-from-bottom-4" style={{ animationDelay: '250ms' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-zinc-100">Activity (365 Days)</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3.5 h-3.5 rounded-[4px] bg-zinc-900/30 border border-zinc-800/50" />
                <div className="w-3.5 h-3.5 rounded-[4px] bg-emerald-900/40 border border-emerald-800/50" />
                <div className="w-3.5 h-3.5 rounded-[4px] bg-emerald-700/60 border border-emerald-600/50" />
                <div className="w-3.5 h-3.5 rounded-[4px] bg-emerald-500/80 border border-emerald-400/50" />
                <div className="w-3.5 h-3.5 rounded-[4px] bg-emerald-400 border border-emerald-300/50 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
              </div>
              <span>More</span>
            </div>
          </div>
          <div className="relative overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            <div className="grid grid-rows-7 grid-flow-col gap-1 min-w-max">
              {paddedDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="w-3.5 h-3.5" />;
                const dateKey = format(day, 'yyyy-MM-dd');
                const activity = activityLog[dateKey];
                const totalActivity = activity ? activity.solved + activity.reviewed : 0;
                let colorClass = 'bg-zinc-900/30 border border-zinc-800/50';
                if (totalActivity > 0) colorClass = 'bg-emerald-900/40 border-emerald-800/50';
                if (totalActivity > 2) colorClass = 'bg-emerald-700/60 border-emerald-600/50';
                if (totalActivity > 4) colorClass = 'bg-emerald-500/80 border-emerald-400/50';
                if (totalActivity > 6) colorClass = 'bg-emerald-400 border-emerald-300/50 shadow-[0_0_8px_rgba(52,211,153,0.3)] z-10 relative';
                return (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-[4px] ${colorClass} transition-all duration-300 hover:scale-125 hover:z-20 hover:shadow-[0_0_12px_rgba(52,211,153,0.6)] hover:border-emerald-400 cursor-pointer`}
                    title={`${dateKey}: ${totalActivity} problem${totalActivity !== 1 ? 's' : ''}`}
                  />
                );
              })}
            </div>
            {todayColumn >= 0 && (
              <div
                className="absolute top-0 bottom-4 w-px bg-emerald-500/50 border-r border-dashed border-emerald-400/50 z-10 pointer-events-none"
                style={{ left: `${todayColumn * 16 - 2}px` }}
              >
                <div className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Today
                </div>
              </div>
            )}
            {targetColumn >= 0 && (
              <div
                className="absolute top-0 bottom-4 w-px bg-indigo-500/50 border-r border-dashed border-indigo-400/50 z-10 pointer-events-none"
                style={{ left: `${targetColumn * 16 - 2}px` }}
              >
                <div className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Target: Sep 15
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Category Performance ─────────────────────────────────────────────────
          Unified view: confidence rating + avg solve time on the same row.
          Sorted weakest-first so the most actionable data is at the top.
          Previously these lived in two separate sections requiring mental
          cross-referencing; merging eliminates that friction entirely.       */}
      <div className="premium-card p-6 slide-in-from-bottom-4" style={{ animationDelay: '300ms' }}>
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Category Performance</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Confidence rating (1–5) · avg new-solve time · sorted weakest first
            </p>
          </div>
          {hasMoreOlder && user?.id && combinedTimings.length > 0 && (
            <button
              type="button"
              onClick={() => void handleLoadMoreTimings()}
              disabled={loadingOlder}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-50 mt-0.5"
            >
              {loadingOlder ? 'Loading…' : 'Load older timings'}
            </button>
          )}
        </div>

        {categoryPerformanceData.length === 0 ? (
          <p className="text-sm text-zinc-600 text-center py-10">
            No data yet — start solving problems.
          </p>
        ) : (
          <div className="space-y-2.5 mt-5">
            {categoryPerformanceData.map(cat => (
              <div key={cat.name} className="flex items-center gap-3 min-w-0">
                {/* Category label */}
                <div className="w-36 text-xs text-zinc-400 text-right shrink-0 truncate" title={cat.name}>
                  {cat.name}
                </div>

                {/* Confidence bar */}
                <div className="flex-1 min-w-0 bg-zinc-800/70 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(cat.confidence / 3) * 100}%`,
                      backgroundColor:
                        cat.confidence >= 2.5 ? '#34d399' : cat.confidence >= 1.5 ? '#fbbf24' : '#f87171',
                    }}
                  />
                </div>

                {/* Confidence value */}
                <div className="text-xs font-mono text-zinc-400 w-6 text-right shrink-0">
                  {cat.confidence}
                </div>

                {/* Avg solve time */}
                <div className="w-20 text-right shrink-0">
                  {cat.avgMinutes != null ? (
                    <span className={clsx(
                      'text-xs font-medium',
                      cat.improving ? 'text-emerald-400' : 'text-amber-400/80'
                    )}>
                      {cat.avgMinutes}m{cat.improving ? ' ↓' : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-700">no timings</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load older sessions prompt — only shown when there are no timings at all */}
        {combinedTimings.length === 0 && hasMoreOlder && user?.id && (
          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-500 mb-3">No timed sessions in the last 90 days.</p>
            <button
              type="button"
              onClick={() => void handleLoadMoreTimings()}
              disabled={loadingOlder}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-50"
            >
              {loadingOlder ? 'Loading…' : 'Load older sessions'}
            </button>
          </div>
        )}
      </div>

      {/* ── Session History ─────────────────────────────────────────────────── */}
      <div className="premium-card p-6">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mb-6">
          <History size={20} className="text-indigo-400" />
          Session History
        </h3>

        {sessionHistory.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50 border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Problem</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Time · Type</th>
                    <th className="px-4 py-3 font-medium">Confidence</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg">Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {sessionHistory
                    .slice(0, historyExpanded ? undefined : SESSION_HISTORY_DEFAULT_COUNT)
                    .map((session, i) => {
                      const isPB =
                        session.elapsedSeconds !== undefined &&
                        personalBestTimes[session.problemId] === session.elapsedSeconds;
                      return (
                        <tr key={`${session.problemId}-${i}`} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-zinc-100">
                            <div className="flex items-center gap-2">
                              {isPB && (
                                <span title="Personal Best!" className="shrink-0">
                                  <Trophy size={12} className="text-amber-400 fill-current" />
                                </span>
                              )}
                              {session.title}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            <span className="px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/50 text-xs">
                              {session.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                            {format(new Date(session.date), 'MMM d, h:mm a')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {session.elapsedSeconds !== undefined ? (
                                <span className="text-xs font-mono font-medium text-zinc-200">
                                  {fmtSeconds(session.elapsedSeconds)}
                                </span>
                              ) : (
                                <span className="text-zinc-600 text-xs">—</span>
                              )}
                              {session.sessionType && (
                                <span className={clsx(
                                  'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border',
                                  session.sessionType === 'mock'
                                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                    : session.sessionType === 'review'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                      : session.sessionType === 'cold_solve'
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                )}>
                                  {session.sessionType === 'cold_solve' ? 'Cold' : session.sessionType}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={clsx(
                              'px-2.5 py-1 rounded text-xs font-medium border',
                              session.rating >= 5
                                ? 'bg-violet-500/10 text-violet-300 border-violet-500/20'
                                : session.rating === 4
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : session.rating === 3
                                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                                    : session.rating === 2
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                            )}>
                              {session.rating >= 5
                                ? 'Cold / auto'
                                : session.rating === 4
                                  ? 'Strong'
                                  : session.rating === 3
                                    ? 'Acceptable'
                                    : session.rating === 2
                                      ? 'Shaky'
                                      : 'Could not'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {session.rawCode && (
                              <button
                                onClick={() => setViewingSession(session)}
                                className="text-indigo-400 hover:text-indigo-300 font-medium text-xs flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors border border-indigo-500/20"
                              >
                                <FileCode2 size={14} />
                                View
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {sessionHistory.length > SESSION_HISTORY_DEFAULT_COUNT && (
              <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                  Showing{' '}
                  {historyExpanded ? sessionHistory.length : Math.min(SESSION_HISTORY_DEFAULT_COUNT, sessionHistory.length)}{' '}
                  of {sessionHistory.length} sessions
                </p>
                <button
                  onClick={() => setHistoryExpanded(prev => !prev)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                >
                  {historyExpanded ? 'Show less' : `Show all ${sessionHistory.length} sessions`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center relative overflow-hidden group border border-zinc-800/50 rounded-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.03),transparent_60%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.08),transparent_70%)] transition-all duration-700" />
            <div className="w-16 h-16 rounded-full bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center mx-auto mb-4 relative z-10">
              <History size={24} className="text-zinc-600 group-hover:text-emerald-400 transition-colors duration-500" />
            </div>
            <h3 className="text-lg font-medium text-zinc-100 mb-1 relative z-10">No sessions recorded yet</h3>
            <p className="text-zinc-500 text-sm relative z-10">Start solving problems to see your history.</p>
          </div>
        )}
      </div>

      {/* ── Sprint Schedule (resting position when no sprint active) ─────────── */}
      {!isSprintActive && SprintScheduleSection}

      {/* ── Code Review Modal ────────────────────────────────────────────────── */}
      {viewingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">{viewingSession.title}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                  <span>{format(new Date(viewingSession.date), 'MMMM d, yyyy · h:mm a')}</span>
                  {viewingSession.elapsedSeconds !== undefined && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Timer size={12} />
                        {fmtSeconds(viewingSession.elapsedSeconds)}
                      </span>
                    </>
                  )}
                  {viewingSession.approachSimilarity !== undefined && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span className="flex items-center gap-1">
                        Approach:{' '}
                        {viewingSession.approachSimilarity === 1
                          ? <span className="text-red-400">Different</span>
                          : viewingSession.approachSimilarity === 2
                            ? <span className="text-amber-400">Same Pattern</span>
                            : <span className="text-emerald-400">Identical</span>}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingSession(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[500px]">
                <div className="flex flex-col space-y-3">
                  <h3 className="text-zinc-400 font-medium flex items-center gap-2">
                    <History size={16} /> Past Attempt
                  </h3>
                  <div className="flex-1 rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950 shadow-inner">
                    <CodeMirror
                      value={viewingSession.rawCode}
                      extensions={[python()]}
                      theme="dark"
                      editable={false}
                      className="text-sm h-full"
                      height="100%"
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-3">
                  <h3 className="text-emerald-400/80 font-medium flex items-center gap-2">
                    <CheckSquare size={16} /> Optimal Solution
                  </h3>
                  <div className="flex-1 rounded-xl border border-emerald-500/20 overflow-hidden bg-zinc-950 shadow-inner">
                    <CodeMirror
                      value={viewingSession.optimalSolution}
                      extensions={[python()]}
                      theme="dark"
                      editable={false}
                      className="text-sm h-full"
                      height="100%"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
