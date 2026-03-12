import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { problems } from '../data/problems';
import { startOfWeek, endOfWeek, format, subDays, isWithinInterval } from 'date-fns';
import { Trophy, Target, TrendingUp, AlertCircle } from 'lucide-react';

export const WeeklySummary: React.FC = () => {
  const progress = useStore((state) => state.progress);
  const activityLog = useStore((state) => state.activityLog);
  const streak = useStore((state) => state.streak);

  const summary = useMemo(() => {
    const today = new Date();
    // Assuming week starts on Monday for this summary
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    let solvedThisWeek = 0;
    let reviewedThisWeek = 0;
    const categoriesWorkedOn = new Set<string>();

    // Calculate activity for the week
    Object.entries(activityLog).forEach(([dateStr, log]) => {
      const date = new Date(dateStr);
      if (isWithinInterval(date, { start: weekStart, end: weekEnd })) {
        solvedThisWeek += log.solved;
        reviewedThisWeek += log.reviewed;
      }
    });

    // Find categories worked on and calculate weaknesses
    const categoryStats: Record<string, { totalRating: number; count: number }> = {};
    
    Object.entries(progress).forEach(([id, prog]) => {
      const prob = problems.find(p => p.id === id);
      if (!prob) return;

      // Check if worked on this week (rough estimate based on lastReviewedAt)
      const lastReviewed = new Date(prog.lastReviewedAt);
      if (isWithinInterval(lastReviewed, { start: weekStart, end: weekEnd })) {
        categoriesWorkedOn.add(prob.category);
      }

      // Calculate overall stats for weakness detection
      if (prog.history.length > 0) {
        if (!categoryStats[prob.category]) {
          categoryStats[prob.category] = { totalRating: 0, count: 0 };
        }
        const lastRating = prog.history[prog.history.length - 1].rating;
        categoryStats[prob.category].totalRating += lastRating;
        categoryStats[prob.category].count += 1;
      }
    });

    // Find top weakness
    let topWeakness = null;
    let lowestAvg = Infinity;
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const avg = stats.totalRating / stats.count;
      if (avg < lowestAvg) {
        lowestAvg = avg;
        topWeakness = category;
      }
    });

    return {
      weekStartStr: format(weekStart, 'MMM d'),
      weekEndStr: format(weekEnd, 'MMM d'),
      solvedThisWeek,
      reviewedThisWeek,
      categoriesCount: categoriesWorkedOn.size,
      topWeakness,
      lowestAvg: lowestAvg === Infinity ? null : lowestAvg.toFixed(1)
    };
  }, [progress, activityLog]);

  // Only show summary if it's Sunday (0) or Monday (1)
  const todayDay = new Date().getDay();
  if (todayDay !== 0 && todayDay !== 1) {
    return null;
  }

  return (
    <div className="premium-card p-6 mb-8 border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      
      <div className="relative z-10">
        <h2 className="text-xl font-bold text-zinc-50 mb-1 flex items-center gap-2">
          <Trophy className="text-indigo-400" size={24} />
          Weekly Debrief
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          {summary.weekStartStr} - {summary.weekEndStr}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <div className="text-zinc-400 text-xs mb-1">New Problems</div>
            <div className="text-2xl font-bold text-emerald-400">{summary.solvedThisWeek}</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <div className="text-zinc-400 text-xs mb-1">Reviews</div>
            <div className="text-2xl font-bold text-amber-400">{summary.reviewedThisWeek}</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <div className="text-zinc-400 text-xs mb-1">Current Streak</div>
            <div className="text-2xl font-bold text-orange-400">{streak.current}</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <div className="text-zinc-400 text-xs mb-1">Categories Touched</div>
            <div className="text-2xl font-bold text-blue-400">{summary.categoriesCount}</div>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-100 mb-2 flex items-center gap-2">
            <Target size={16} className="text-red-400" />
            Coach's Recommendation for Next Week
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {summary.solvedThisWeek === 0 && summary.reviewedThisWeek === 0 ? (
              "You took a break this week. Let's get back on track! Start with a quick review session to warm up."
            ) : summary.topWeakness ? (
              <>
                Great consistency! Your data shows that <strong className="text-red-400">{summary.topWeakness}</strong> is currently your weakest area (Avg Confidence: {summary.lowestAvg}). 
                I recommend focusing your new problem sessions on this category next week to build a stronger foundation.
              </>
            ) : (
              "Solid work this week! You're making steady progress across the board. Keep following the daily plan."
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
