import React, { useMemo } from 'react';
import { patterns } from '../data/patterns';
import { getPatternForProblem } from '../utils/patternMapping';
import { problems } from '../data/problems';
import { computePatternMastery } from '../utils/progressHelpers';
import { useProblemProgress } from '../hooks/useUserData';
import { CheckCircle2, ChevronLeft, ExternalLink, Lock, Play } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PatternId } from '../types';
import { clsx } from 'clsx';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

export const PatternFoundations: React.FC = () => {
  const { data: problemProgress } = useProblemProgress();
  const startSession = useStore(state => state.startSession);

  const patternData = useMemo(() => {
    return patterns.map(pattern => {
      const mappedProblems = problems.filter(p => getPatternForProblem(p) === pattern.id);
      const problemIds = mappedProblems.map(p => p.id);
      const mastery = computePatternMastery(pattern.id, problemIds, problemProgress || {});
      return {
        ...pattern,
        problemsCount: mappedProblems.length,
        masteredCount: mastery.problemsMasteredCount,
        isMastered: mastery.isMastered,
        mappedProblems
      };
    });
  }, [problemProgress]);

  const [selectedPattern, setSelectedPattern] = React.useState<PatternId | null>(null);
  const masteredPatternsCount = patternData.filter((p) => p.isMastered).length;
  const totalPatternProblems = patternData.reduce((sum, p) => sum + p.problemsCount, 0);
  const masteredPatternProblems = patternData.reduce((sum, p) => sum + p.masteredCount, 0);
  const overallProblemPercent = totalPatternProblems > 0
    ? Math.round((masteredPatternProblems / totalPatternProblems) * 100)
    : 0;

  if (selectedPattern) {
    const pattern = patternData.find(p => p.id === selectedPattern)!;
    return (
      <div className="max-w-5xl mx-auto space-y-16 pb-24">
        <button 
          onClick={() => setSelectedPattern(null)}
          className="text-zinc-400 hover:text-zinc-100 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-medium group transition-colors"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Roadmap
        </button>

        <header className="space-y-6">
          <h1 className="text-5xl sm:text-6xl font-black text-zinc-100 tracking-tight leading-tight">
            {pattern.name}
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl leading-relaxed">
            {pattern.description}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 lg:gap-24 items-start">
          <div className="space-y-8">
            <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-zinc-500 border-b border-zinc-800 pb-4">
              Logic Template
            </h2>
            <div className="bg-[#0f0f11] border border-zinc-800/50 p-4 sm:p-6 shadow-2xl">
              <CodeMirror
                value={pattern.templateCodePython}
                extensions={[python()]}
                theme="dark"
                editable={false}
                className="text-base sm:text-lg font-mono opacity-95"
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-zinc-500">
                Core Problems
              </h2>
              <span className="text-[10px] font-medium px-2 py-0.5 bg-zinc-800/40 text-emerald-400/80 uppercase tracking-widest border border-emerald-500/10">
                {pattern.masteredCount} / {pattern.problemsCount} Mastered
              </span>
            </div>
            
            <div className="flex flex-col gap-2">
              {pattern.mappedProblems.map((prob) => {
                const prog = problemProgress?.[prob.id];
                const isRetired = prog?.retired;
                
                return (
                  <div 
                    key={prob.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-900/20 hover:bg-zinc-900/50 border border-transparent hover:border-zinc-800 transition-colors group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex-shrink-0 pt-0.5">
                        {isRetired ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full border border-zinc-600 group-hover:border-zinc-500 transition-colors" />
                        )}
                      </div>
                      <h3 className={clsx(
                        "text-sm sm:text-base font-medium transition-colors cursor-default",
                        isRetired ? "text-zinc-300" : "text-zinc-200 group-hover:text-zinc-100"
                      )}>
                        {prob.title}
                      </h3>
                    </div>
                    
                    <div className="ml-[30px] sm:ml-0 mt-4 sm:mt-0 flex items-center justify-between sm:w-auto w-full gap-4">
                      <span className={clsx(
                        "text-[10px] uppercase tracking-widest font-bold",
                        prob.difficulty === 'Easy' ? 'text-emerald-400' : 
                        prob.difficulty === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                      )}>
                        {prob.difficulty}
                      </span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={prob.leetcodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                          title="Open on LeetCode"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startSession(prob.id, false, false);
                          }}
                          className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all flex items-center gap-2"
                          title="Start Session"
                        >
                          <Play size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 pt-6">
      <header className="space-y-4">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50">
          Pattern Mastery
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-3xl">
          Internalize the 8 essential algorithmic paradigms sequentially. Score <span className="font-black bg-emerald-500/10 px-2 py-0.5 rounded-md text-emerald-400">5s</span> repeatedly on core problems to retire them and advance your roadmap.
        </p>
      </header>

      <div className="premium-card p-5 border-emerald-500/20 bg-emerald-500/[0.04]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-400/80 font-bold">Roadmap Progress</p>
            <p className="text-sm text-zinc-300 mt-1">
              {masteredPatternsCount} / {patternData.length} patterns fully mastered
            </p>
          </div>
          <span className="text-sm font-semibold text-emerald-400">
            {masteredPatternProblems} / {totalPatternProblems} problems mastered
          </span>
        </div>
        <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/50">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${overallProblemPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {patternData.map((pattern, index) => {
          const progressPercentage = pattern.problemsCount > 0
            ? (pattern.masteredCount / pattern.problemsCount) * 100
            : 0;
          const isUnlocked = index === 0 || patternData.slice(0, index).every((p) => p.isMastered);
          const isMastered = pattern.isMastered;

          return (
            <button
              key={pattern.id}
              onClick={() => setSelectedPattern(pattern.id)}
              className={clsx(
                'w-full text-left premium-card p-5 sm:p-6 border transition-all duration-300 group',
                isMastered
                  ? 'border-emerald-500/30 bg-emerald-500/[0.06] hover:border-emerald-500/55'
                  : isUnlocked
                    ? 'border-zinc-700/70 bg-zinc-900/65 hover:border-emerald-500/35 hover:bg-zinc-900/90'
                    : 'border-zinc-800/80 bg-zinc-900/45 hover:border-zinc-700/80'
              )}
            >
              <div className="flex items-start gap-4 sm:gap-5">
                <div className={clsx(
                  'w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 text-xs font-black tracking-wider transition-colors',
                  isMastered
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : isUnlocked
                      ? 'border-zinc-600 bg-zinc-800/70 text-zinc-200 group-hover:border-emerald-500/40'
                      : 'border-zinc-700 bg-zinc-800/40 text-zinc-500'
                )}>
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className={clsx(
                        'text-xl sm:text-2xl font-black tracking-tight transition-colors',
                        isMastered
                          ? 'text-emerald-200'
                          : isUnlocked
                            ? 'text-zinc-100 group-hover:text-emerald-300'
                            : 'text-zinc-400'
                      )}>
                        {pattern.name}
                      </h3>
                      <p className={clsx(
                        'mt-2 text-sm sm:text-base leading-relaxed max-w-3xl',
                        isUnlocked ? 'text-zinc-400' : 'text-zinc-500'
                      )}>
                        {pattern.description}
                      </p>
                    </div>

                    <span className={clsx(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider',
                      isMastered
                        ? 'bg-emerald-500/12 border-emerald-500/25 text-emerald-300'
                        : isUnlocked
                          ? 'bg-zinc-800/70 border-zinc-600/60 text-zinc-300'
                          : 'bg-zinc-800/45 border-zinc-700 text-zinc-500'
                    )}>
                      {isMastered ? <CheckCircle2 size={12} /> : !isUnlocked ? <Lock size={12} /> : null}
                      {isMastered ? 'Completed' : isUnlocked ? 'Active' : 'Locked'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 font-semibold">
                        Pattern Progress
                      </span>
                      <span className={clsx(
                        'text-sm font-semibold',
                        isMastered ? 'text-emerald-300' : isUnlocked ? 'text-zinc-200' : 'text-zinc-500'
                      )}>
                        {pattern.masteredCount} / {pattern.problemsCount} mastered
                      </span>
                    </div>

                    <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/55">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-700',
                          isMastered
                            ? 'bg-emerald-500'
                            : isUnlocked
                              ? 'bg-emerald-500/70'
                              : 'bg-zinc-600'
                        )}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
