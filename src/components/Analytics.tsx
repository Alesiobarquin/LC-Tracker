import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { problems, Category } from '../data/problems';
import { allSyntaxCards } from '../data/syntaxCards';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Brain, Target, Trophy, Lightbulb, TrendingUp, AlertTriangle, History, Clock, BookOpen, FileCode2, X, CheckSquare } from 'lucide-react';
import { clsx } from 'clsx';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

export const Analytics: React.FC = () => {
  const progress = useStore((state) => state.progress);
  const activityLog = useStore((state) => state.activityLog);
  const syntaxProgress = useStore((state) => state.syntaxProgress);

  const [viewingSession, setViewingSession] = React.useState<any>(null);

  const solvedCount = Object.keys(progress).length;
  const activeRotationCount = Object.values(progress).filter(p => !p.retired).length;
  const retiredCount = Object.values(progress).filter(p => p.retired).length;

  const totalSyntaxCards = allSyntaxCards.length;
  const confidentSyntaxCards = Object.values(syntaxProgress).filter(p => p.confidenceRating === 3).length;

  // Calculate average confidence per category
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

  // Generate Insights
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

  // Session History
  const sessionHistory = useMemo(() => {
    const allSessions: {
      problemId: string;
      title: string;
      category: string;
      date: string;
      rating: number;
      timeSpent: string;
      rawCode?: string;
      optimalSolution?: string;
      approachSimilarity?: number;
      usedInAppEditor?: boolean;
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
          timeSpent: entry.rating === 3 ? '10m' : entry.rating === 2 ? '20m' : '30m',
          rawCode: entry.rawCode,
          optimalSolution: entry.optimalSolution,
          approachSimilarity: entry.approachSimilarity,
          usedInAppEditor: entry.usedInAppEditor
        });
      });
    });

    return allSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
  }, [progress]);

  // Heatmap generation
  const today = new Date();
  const targetDate = new Date('2026-09-15T00:00:00Z');

  // End the heatmap 14 days after the target date so the marker isn't right on the edge
  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + 14);

  const startDate = subDays(endDate, 364); // 365 days total
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const startDayOfWeek = startDate.getDay(); // 0 is Sunday

  // Pad the beginning with nulls
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="text-emerald-400" size={20} />
            <h3 className="text-zinc-400 font-medium">Total Solved</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-50">{solvedCount}</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-amber-400" size={20} />
            <h3 className="text-zinc-400 font-medium">Active Rotation</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-50">{activeRotationCount}</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="text-indigo-400" size={20} />
            <h3 className="text-zinc-400 font-medium">Mastered (Retired)</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-50">{retiredCount}</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="text-red-400" size={20} />
            <h3 className="text-zinc-400 font-medium">Overall Avg Rating</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-50">
            {activeChartData.length > 0
              ? (activeChartData.reduce((acc, curr) => acc + curr.avg, 0) / activeChartData.length).toFixed(1)
              : '0.0'}
          </p>
        </div>

        <div className="premium-card p-6 border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="text-emerald-400" size={20} />
            <h3 className="text-zinc-400 font-medium">Syntax Mastery</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-50 flex items-baseline gap-2">
            {confidentSyntaxCards} <span className="text-sm font-medium text-zinc-500">/ {totalSyntaxCards}</span>
          </p>
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

                  return (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-sm ${colorClass} transition-colors hover:ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950`}
                      title={`${dateKey}: ${totalActivity} problems`}
                    />
                  );
                })}
              </div>

              {/* Today Marker */}
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

              {/* Target Date Marker */}
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

          {/* Category Confidence */}
          <div className="premium-card p-6 h-[500px]">
            <h3 className="text-lg font-semibold text-zinc-100 mb-6">Confidence by Category</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                <XAxis type="number" domain={[0, 3]} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} width={120} />
                <Tooltip
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: '#f4f4f5' }}
                  formatter={(value: number) => [value === 0 ? 'N/A' : value, 'Confidence']}
                />
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

      {/* Session History Log */}
      <div className="premium-card p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-6 flex items-center gap-2">
          <History size={20} className="text-indigo-400" />
          Recent Sessions
        </h3>

        {sessionHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-lg">Problem</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Time/Env</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                  <th className="px-4 py-3 font-medium rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {sessionHistory.map((session, i) => (
                  <tr key={`${session.problemId}-${i}`} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-100">{session.title}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      <span className="px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/50 text-xs">
                        {session.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {format(new Date(session.date), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-xs">
                          <Clock size={12} className="text-zinc-500" />
                          {session.timeSpent}
                        </span>
                        {session.usedInAppEditor !== undefined && (
                          <span className="text-[10px] uppercase text-indigo-400/80 bg-indigo-500/10 px-1.5 py-0.5 rounded w-fit border border-indigo-500/20">
                            {session.usedInAppEditor ? 'In-App IDE' : 'External'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={clsx(
                          "px-2.5 py-1 rounded text-xs font-medium border w-fit",
                          session.rating === 3 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            session.rating === 2 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                          {session.rating === 3 ? '3 - Mastered' : session.rating === 2 ? '2 - Okay' : '1 - Struggled'}
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
                ))}
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
                  <span>{format(new Date(viewingSession.date), 'MMMM d, yyyy \u00B7 h:mm a')}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-1">
                    Approach: {viewingSession.approachSimilarity === 1 ? <span className="text-red-400">Different</span> : viewingSession.approachSimilarity === 2 ? <span className="text-amber-400">Same Pattern</span> : <span className="text-emerald-400">Identical</span>}
                  </span>
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
