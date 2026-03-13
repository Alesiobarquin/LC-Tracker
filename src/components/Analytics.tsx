import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { problems, Category } from '../data/problems';
import { allSyntaxCards } from '../data/syntaxCards';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import {
  Activity, Brain, Target, Trophy, Lightbulb, TrendingUp, AlertTriangle, History,
  Clock, BookOpen, FileCode2, X, CheckSquare, Timer, TrendingDown, Zap, Filter
} from 'lucide-react';
import { clsx } from 'clsx';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

const fmtSeconds = (s: number): string => {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
};

export const Analytics: React.FC = () => {
  const progress = useStore((state) => state.progress);
  const activityLog = useStore((state) => state.activityLog);
  const syntaxProgress = useStore((state) => state.syntaxProgress);
  const sessionTimings = useStore((state) => state.sessionTimings);
  const categoryAvgSolveTimes = useStore((state) => state.categoryAvgSolveTimes);
  const categoryAvgReviewTimes = useStore((state) => state.categoryAvgReviewTimes);
  const personalBestTimes = useStore((state) => state.personalBestTimes);

  const [viewingSession, setViewingSession] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'above' | 'below'>('all');
  const [timeFilterMinutes, setTimeFilterMinutes] = useState(30);

  const solvedCount = Object.keys(progress).length;
  const activeRotationCount = Object.values(progress).filter(p => !p.retired).length;
  const retiredCount = Object.values(progress).filter(p => p.retired).length;

  const totalSyntaxCards = allSyntaxCards.length;
  const confidentSyntaxCards = Object.values(syntaxProgress).filter(p => p.confidenceRating === 3).length;

  // ── Category Stats ─────────────────────────────────────────────────────────
  const categoryStats = useMemo(() => {
    const allCategories = Array.from(new Set(problems.map(p => p.category)));
    const stats = allCategories.reduce((acc, cat) => {
      acc[cat] = { totalRating: 0, count: 0, totalSolveTime: 0 };
      return acc;
    }, {} as Record<string, { totalRating: number; count: number; totalSolveTime: number }>);

    problems.forEach((prob) => {
      const prog = progress[prob.id];
      if (prog && prog.history.length > 0) {
        const lastRating = prog.history[prog.history.length - 1].rating;
        stats[prob.category].totalRating += lastRating;
        stats[prob.category].count += 1;
        stats[prob.category].totalSolveTime += (4 - lastRating) * 10;
      }
    });
    return stats;
  }, [progress]);

  const chartData = useMemo(() => {
    return Object.entries(categoryStats).map(([category, stats]: [string, any]) => ({
      name: category,
      avg: stats.count > 0 ? Number((stats.totalRating / stats.count).toFixed(1)) : 0,
      avgTime: stats.count > 0 ? Math.round(stats.totalSolveTime / stats.count) : 0,
    })).sort((a, b) => b.avg - a.avg);
  }, [categoryStats]);

  // ── Mastery Badges ─────────────────────────────────────────────────────────
  const earnedBadges = useMemo(() => {
    const allCategories = Array.from(new Set(problems.map(p => p.category)));
    const badges: string[] = [];
    allCategories.forEach(category => {
      const phase1CatProblems = problems.filter(p => p.category === category && p.isNeetCode75);
      const allSolved = phase1CatProblems.every(p => progress[p.id]);
      const stat = categoryStats[category];
      const avgConfidence = stat && stat.count > 0 ? stat.totalRating / stat.count : 0;
      if (phase1CatProblems.length > 0 && allSolved && avgConfidence >= 2.5) {
        badges.push(category);
      }
    });
    return badges;
  }, [progress, categoryStats]);

  // ── Insights ───────────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const activeData = chartData.filter(d => d.avg > 0);
    if (activeData.length === 0) return [];
    const sortedByWeakness = [...activeData].sort((a, b) => a.avg - b.avg);
    const weakest = sortedByWeakness[0];
    const strongest = sortedByWeakness[sortedByWeakness.length - 1];
    const generatedInsights = [];

    if (weakest && weakest.avg < 2.0) {
      generatedInsights.push({
        type: 'weakness',
        title: `Needs Work: ${weakest.name}`,
        description: `Your confidence in ${weakest.name} is low (${weakest.avg}/3). Focus on foundational problems in this category next week.`,
        icon: <AlertTriangle className="text-red-400" size={20} />,
        color: 'border-red-500/20 bg-red-500/5'
      });
    }
    const developing = sortedByWeakness.find(c => c.avg >= 2.0 && c.avg < 2.5);
    if (developing) {
      generatedInsights.push({
        type: 'developing',
        title: `Developing: ${developing.name}`,
        description: `You're getting the hang of ${developing.name} (${developing.avg}/3), but might be slow. Try to optimize your solutions.`,
        icon: <TrendingUp className="text-amber-400" size={20} />,
        color: 'border-amber-500/20 bg-amber-500/5'
      });
    }
    if (strongest && strongest.avg >= 2.5) {
      generatedInsights.push({
        type: 'strength',
        title: `Strong: ${strongest.name}`,
        description: `Great job on ${strongest.name} (${strongest.avg}/3). You're solving these quickly and confidently.`,
        icon: <Trophy className="text-emerald-400" size={20} />,
        color: 'border-emerald-500/20 bg-emerald-500/5'
      });
    }
    return generatedInsights;
  }, [chartData]);

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
      const prob = problems.find(p => p.id === problemId);
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

  const filteredHistory = useMemo(() => {
    const thresholdSeconds = timeFilterMinutes * 60;
    return sessionHistory.filter(s => {
      if (timeFilter === 'all' || s.elapsedSeconds === undefined) return true;
      if (timeFilter === 'above') return s.elapsedSeconds >= thresholdSeconds;
      return s.elapsedSeconds < thresholdSeconds;
    }).slice(0, 30);
  }, [sessionHistory, timeFilter, timeFilterMinutes]);

  // ── Solve Time Analytics ───────────────────────────────────────────────────
  // Total time by session type
  const totalTimeByType = useMemo(() => {
    const totals: Record<string, number> = { new: 0, review: 0, cold_solve: 0, mock: 0 };
    sessionTimings.forEach(t => {
      totals[t.sessionType] = (totals[t.sessionType] || 0) + t.elapsedSeconds;
    });
    return totals;
  }, [sessionTimings]);

  const totalSecondsAllTime = Object.values(totalTimeByType).reduce((a, b) => a + b, 0);

  // Category avg solve time chart (from real session timings)
  const categoryTimeChartData = useMemo(() => {
    if (sessionTimings.length === 0) return [];

    // Group new-solve timings by category, split into first half and recent half
    const byCat: Record<string, number[]> = {};
    sessionTimings
      .filter(t => t.sessionType === 'new' || t.sessionType === 'cold_solve')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(t => {
        if (!byCat[t.category]) byCat[t.category] = [];
        byCat[t.category].push(t.elapsedSeconds);
      });

    return Object.entries(byCat)
      .filter(([_, times]) => times.length >= 1)
      .map(([category, times]) => {
        const avg = times.reduce((s, t) => s + t, 0) / times.length;
        const firstHalf = times.slice(0, Math.max(1, Math.floor(times.length / 2)));
        const lastHalf = times.slice(Math.floor(times.length / 2));
        const firstAvg = firstHalf.reduce((s, t) => s + t, 0) / firstHalf.length;
        const lastAvg = lastHalf.reduce((s, t) => s + t, 0) / lastHalf.length;
        const improving = lastAvg < firstAvg * 0.95; // 5% improvement threshold
        return {
          name: category,
          avgMinutes: Math.round(avg / 60),
          firstAvgMinutes: Math.round(firstAvg / 60),
          lastAvgMinutes: Math.round(lastAvg / 60),
          improving,
          count: times.length,
        };
      })
      .sort((a, b) => b.avgMinutes - a.avgMinutes); // slowest first
  }, [sessionTimings]);

  // Last 30 sessions trend
  const trendData = useMemo(() => {
    return [...sessionTimings]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((t, i) => ({
        index: i + 1,
        minutes: Math.round(t.elapsedSeconds / 60),
        type: t.sessionType,
      }));
  }, [sessionTimings]);

  // Heatmap
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

  const activeChartData = chartData.filter(d => d.avg > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Analytics</h1>
        <p className="text-zinc-400 mt-1">Track your progress and identify weaknesses.</p>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-2"><Trophy className="text-emerald-400" size={20} /><h3 className="text-zinc-400 font-medium">Total Solved</h3></div>
          <p className="text-3xl font-bold text-zinc-50">{solvedCount}</p>
        </div>
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-2"><Activity className="text-amber-400" size={20} /><h3 className="text-zinc-400 font-medium">Active Rotation</h3></div>
          <p className="text-3xl font-bold text-zinc-50">{activeRotationCount}</p>
        </div>
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-2"><Brain className="text-indigo-400" size={20} /><h3 className="text-zinc-400 font-medium">Mastered</h3></div>
          <p className="text-3xl font-bold text-zinc-50">{retiredCount}</p>
        </div>
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-2"><Timer className="text-rose-400" size={20} /><h3 className="text-zinc-400 font-medium">Time Invested</h3></div>
          <p className="text-3xl font-bold text-zinc-50">
            {totalSecondsAllTime >= 3600
              ? `${Math.round(totalSecondsAllTime / 3600)}h`
              : `${Math.round(totalSecondsAllTime / 60)}m`}
          </p>
        </div>
        <div className="premium-card p-6 border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-3 mb-2"><BookOpen className="text-emerald-400" size={20} /><h3 className="text-zinc-400 font-medium">Syntax Mastery</h3></div>
          <p className="text-3xl font-bold text-zinc-50 flex items-baseline gap-2">{confidentSyntaxCards} <span className="text-sm font-medium text-zinc-500">/ {totalSyntaxCards}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights Panel */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-400" />
            Pattern Insights
          </h3>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className={`premium-card p-4 border ${insight.color}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{insight.icon}</div>
                    <div>
                      <h4 className="font-medium text-zinc-100">{insight.title}</h4>
                      <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="premium-card p-6 text-center text-zinc-500 border-dashed border-zinc-800">
              Solve more problems to generate AI insights.
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Heatmap */}
          <div className="premium-card p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-zinc-100">Activity (365 Days)</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-zinc-800/50 border border-zinc-800" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-900/50 border border-emerald-800" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-700/60 border border-emerald-600" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-500/80 border border-emerald-400" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-400 border border-emerald-300" />
                </div>
                <span>More</span>
              </div>
            </div>
            <div className="relative overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <div className="grid grid-rows-7 grid-flow-col gap-1 min-w-max">
                {paddedDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} className="w-3 h-3" />;
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const activity = activityLog[dateKey];
                  const totalActivity = activity ? activity.solved + activity.reviewed : 0;
                  let colorClass = "bg-zinc-800/50 border border-zinc-800";
                  if (totalActivity > 0) colorClass = "bg-emerald-900/50 border-emerald-800";
                  if (totalActivity > 2) colorClass = "bg-emerald-700/60 border-emerald-600";
                  if (totalActivity > 4) colorClass = "bg-emerald-500/80 border-emerald-400";
                  if (totalActivity > 6) colorClass = "bg-emerald-400 border-emerald-300";
                  return <div key={i} className={`w-3 h-3 rounded-sm ${colorClass} transition-colors hover:ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950`} title={`${dateKey}: ${totalActivity} problems`} />;
                })}
              </div>
              {todayColumn >= 0 && (
                <div className="absolute top-0 bottom-4 w-px bg-emerald-500/50 border-r border-dashed border-emerald-400/50 z-10 pointer-events-none" style={{ left: `${todayColumn * 16 - 2}px` }}>
                  <div className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Today</div>
                </div>
              )}
              {targetColumn >= 0 && (
                <div className="absolute top-0 bottom-4 w-px bg-indigo-500/50 border-r border-dashed border-indigo-400/50 z-10 pointer-events-none" style={{ left: `${targetColumn * 16 - 2}px` }}>
                  <div className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Target: Sep 15</div>
                </div>
              )}
            </div>
          </div>

          {/* Category Confidence */}
          <div className="premium-card p-6 h-[500px]">
            <h3 className="text-lg font-semibold text-zinc-100 mb-6">Confidence by Category</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                <XAxis type="number" domain={[0, 3]} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} width={120} />
                <Tooltip cursor={{ fill: '#27272a', opacity: 0.4 }} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} itemStyle={{ color: '#f4f4f5' }} formatter={(value: number) => [value === 0 ? 'N/A' : value, 'Confidence']} />
                <Bar dataKey="avg" radius={[0, 4, 4, 0]} barSize={16}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avg === 0 ? '#3f3f46' : entry.avg >= 2.5 ? '#34d399' : entry.avg >= 1.5 ? '#fbbf24' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Solve Time Insights ─────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Timer size={16} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Solve Time Insights</h2>
            <p className="text-zinc-500 text-sm">Real timing data from your sessions</p>
          </div>
        </div>

        {sessionTimings.length === 0 ? (
          <div className="premium-card p-10 text-center border-dashed border-zinc-800">
            <Timer size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">Complete sessions with the new stopwatch timer to see solve time analytics here.</p>
          </div>
        ) : (
          <>
            {/* Total Time Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'New Problems', seconds: totalTimeByType.new || 0, color: 'text-emerald-400', border: 'border-emerald-500/20' },
                { label: 'Reviews', seconds: totalTimeByType.review || 0, color: 'text-amber-400', border: 'border-amber-500/20' },
                { label: 'Cold Solves', seconds: totalTimeByType.cold_solve || 0, color: 'text-blue-400', border: 'border-blue-500/20' },
                { label: 'Mock Interviews', seconds: totalTimeByType.mock || 0, color: 'text-indigo-400', border: 'border-indigo-500/20' },
              ].map(({ label, seconds, color, border }) => (
                <div key={label} className={`premium-card p-4 border ${border}`}>
                  <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${color}`}>{label}</div>
                  <div className="text-2xl font-bold text-zinc-100">
                    {seconds >= 3600 ? `${(seconds / 3600).toFixed(1)}h` : `${Math.round(seconds / 60)}m`}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {sessionTimings.filter(t => t.sessionType === label.toLowerCase().replace(' ', '_')).length} sessions
                  </div>
                </div>
              ))}
            </div>

            {/* Avg Solve Time Per Category Bar */}
            {categoryTimeChartData.length > 0 && (
              <div className="premium-card p-6">
                <h3 className="text-base font-semibold text-zinc-100 mb-2 flex items-center gap-2">
                  <TrendingDown size={16} className="text-cyan-400" />
                  Avg Solve Time by Category
                  <span className="text-xs text-zinc-500 font-normal ml-auto">green = improving · yellow = flat/slower</span>
                </h3>
                <div className="space-y-3 mt-4">
                  {categoryTimeChartData.map(cat => {
                    const maxMin = Math.max(...categoryTimeChartData.map(c => c.avgMinutes), 1);
                    return (
                      <div key={cat.name} className="flex items-center gap-3">
                        <div className="w-28 text-xs text-zinc-400 text-right shrink-0 truncate">{cat.name}</div>
                        <div className="flex-1 bg-zinc-800 rounded-full h-5 overflow-hidden">
                          <div
                            className={clsx("h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2", cat.improving ? "bg-emerald-500/70" : "bg-amber-500/60")}
                            style={{ width: `${Math.max(4, (cat.avgMinutes / maxMin) * 100)}%` }}
                          >
                            <span className="text-[10px] font-bold text-white">{cat.avgMinutes}m</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-zinc-500 w-16 shrink-0">{cat.count} session{cat.count !== 1 ? 's' : ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* First vs Most Recent Solve Time */}
            {categoryTimeChartData.filter(c => c.firstAvgMinutes !== c.lastAvgMinutes && c.count >= 2).length > 0 && (
              <div className="premium-card p-6">
                <h3 className="text-base font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-amber-400" />
                  First Solve vs. Most Recent Solve
                  <span className="text-xs text-zinc-500 font-normal ml-auto">your real improvement over time</span>
                </h3>
                <div className="space-y-4">
                  {categoryTimeChartData.filter(c => c.count >= 2).map(cat => {
                    const improved = cat.lastAvgMinutes < cat.firstAvgMinutes;
                    const pctChange = cat.firstAvgMinutes > 0
                      ? Math.round(((cat.firstAvgMinutes - cat.lastAvgMinutes) / cat.firstAvgMinutes) * 100)
                      : 0;
                    return (
                      <div key={cat.name} className="flex items-center gap-4">
                        <div className="w-28 text-xs text-zinc-400 text-right shrink-0">{cat.name}</div>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xs text-zinc-500 w-10 text-right">{cat.firstAvgMinutes}m</span>
                          <div className="flex-1 h-2 bg-zinc-800 rounded-full relative">
                            <div className="absolute left-0 top-0 h-full bg-zinc-600 rounded-full" style={{ width: '100%' }} />
                            <div
                              className={clsx("absolute left-0 top-0 h-full rounded-full", improved ? "bg-emerald-500" : "bg-red-500")}
                              style={{ width: `${Math.min(100, (cat.lastAvgMinutes / cat.firstAvgMinutes) * 100)}%` }}
                            />
                          </div>
                          <span className={clsx("text-xs font-bold w-10", improved ? "text-emerald-400" : "text-red-400")}>
                            {cat.lastAvgMinutes}m
                          </span>
                          <span className={clsx("text-[10px] font-semibold w-12", improved ? "text-emerald-500" : "text-red-500")}>
                            {improved ? `↓${pctChange}%` : `↑${Math.abs(pctChange)}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 30-Session Trend Line */}
            {trendData.length >= 3 && (
              <div className="premium-card p-6 h-64">
                <h3 className="text-base font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-400" />
                  Solve Time Trend (last {Math.min(30, sessionTimings.length)} sessions)
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="index" tick={{ fill: '#71717a', fontSize: 11 }} label={{ value: 'Session', position: 'insideBottom', fill: '#71717a', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} unit="m" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '10px' }}
                      formatter={(v: number) => [`${v}m`, 'Solve Time']}
                    />
                    <Line type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </section>

      {/* Session History Log */}
      <div className="premium-card p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <History size={20} className="text-indigo-400" />
            Session History
          </h3>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-zinc-500" />
            <select
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-300 text-xs focus:outline-none"
            >
              <option value="all">All sessions</option>
              <option value="above">Above threshold</option>
              <option value="below">Below threshold</option>
            </select>
            {timeFilter !== 'all' && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={timeFilterMinutes}
                  onChange={e => setTimeFilterMinutes(Number(e.target.value))}
                  min={1}
                  max={120}
                  className="w-16 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-300 text-xs focus:outline-none text-center"
                />
                <span className="text-zinc-500 text-xs">min</span>
              </div>
            )}
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-lg">Problem</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actual Time</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                  <th className="px-4 py-3 font-medium rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredHistory.map((session, i) => {
                  const isPB = session.elapsedSeconds !== undefined && personalBestTimes[session.problemId] === session.elapsedSeconds;
                  const isMock = session.sessionType === 'mock';
                  return (
                    <tr key={`${session.problemId}-${i}`} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-100">
                        <div className="flex items-center gap-2">
                          {isPB && <span title="Personal Best!" className="shrink-0"><Trophy size={12} className="text-amber-400 fill-current" /></span>}
                          {session.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        <span className="px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/50 text-xs">{session.category}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {format(new Date(session.date), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        <div className="flex flex-col gap-1">
                          {session.elapsedSeconds !== undefined ? (
                            <span className="flex items-center gap-1.5 text-xs font-mono font-medium text-zinc-200">
                              <Timer size={10} className="text-zinc-500 shrink-0" />
                              {fmtSeconds(session.elapsedSeconds)}
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-xs">—</span>
                          )}
                          {isMock && session.mockTimeLimitSeconds && (
                            <span className="text-[10px] text-indigo-400/80">
                              Limit: {Math.round(session.mockTimeLimitSeconds / 60)}:00
                            </span>
                          )}
                          {session.sessionType && (
                            <span className={clsx("text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded w-fit border",
                              session.sessionType === 'mock' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                session.sessionType === 'review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  session.sessionType === 'cold_solve' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            )}>
                              {session.sessionType === 'cold_solve' ? 'Cold' : session.sessionType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={clsx("px-2.5 py-1 rounded text-xs font-medium border w-fit",
                            session.rating === 3 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              session.rating === 2 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                "bg-red-500/10 text-red-400 border-red-500/20"
                          )}>
                            {session.rating === 3 ? '3 — Mastered' : session.rating === 2 ? '2 — Okay' : '1 — Struggled'}
                          </span>
                          {session.approachSimilarity !== undefined && (
                            <span className="text-[10px] text-zinc-500">
                              Approach: {session.approachSimilarity === 1 ? 'Different' : session.approachSimilarity === 2 ? 'Same Pattern' : 'Identical'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {session.rawCode && (
                          <button
                            onClick={() => setViewingSession(session)}
                            className="text-indigo-400 hover:text-indigo-300 font-medium text-xs flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors border border-indigo-500/20"
                          >
                            <FileCode2 size={14} />
                            View Code
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No sessions recorded yet. Start solving problems to see your history!
          </div>
        )}
      </div>

      {/* Code Review Modal */}
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
                        Approach: {viewingSession.approachSimilarity === 1 ? <span className="text-red-400">Different</span> : viewingSession.approachSimilarity === 2 ? <span className="text-amber-400">Same Pattern</span> : <span className="text-emerald-400">Identical</span>}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => setViewingSession(null)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[500px]">
                <div className="flex flex-col space-y-3">
                  <h3 className="text-zinc-400 font-medium flex items-center gap-2"><History size={16} /> Past Attempt</h3>
                  <div className="flex-1 rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950 shadow-inner">
                    <CodeMirror value={viewingSession.rawCode} extensions={[python()]} theme="dark" editable={false} className="text-sm h-full" height="100%" />
                  </div>
                </div>
                <div className="flex flex-col space-y-3">
                  <h3 className="text-emerald-400/80 font-medium flex items-center gap-2"><CheckSquare size={16} /> Optimal Solution</h3>
                  <div className="flex-1 rounded-xl border border-emerald-500/20 overflow-hidden bg-zinc-950 shadow-inner">
                    <CodeMirror value={viewingSession.optimalSolution} extensions={[python()]} theme="dark" editable={false} className="text-sm h-full" height="100%" />
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
