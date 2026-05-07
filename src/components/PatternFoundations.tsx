import React, { useMemo } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { patterns } from '../data/patterns';
import { getPatternForProblem } from '../utils/patternMapping';
import { problems, allProblems, problemMap, problemTitleMap } from '../data/problems';
import { computePatternCompletion } from '../utils/progressHelpers';
import { useProblemProgress } from '../hooks/useUserData';
import { getDifficultyColor } from '../utils/uiHelpers';
import { CheckCircle2, ChevronLeft, ExternalLink, Lock, Play } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PatternId } from '../types';
import { clsx } from 'clsx';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { useUser } from '@clerk/clerk-react';

export const PatternFoundations: React.FC = () => {
  const { data: problemProgress } = useProblemProgress();
  const startSession = useStore(state => state.startSession);

  const patternData = useMemo(() => {
    return patterns.map(pattern => {
      const coreMapped = problems.filter(p => getPatternForProblem(p) === pattern.id);
      const coreIds = new Set(coreMapped.map(p => p.id));
      
      const extraMapped = (pattern.educativeProblems || [])
        .map(ep => {
          const lowerTitle = ep.title.toLowerCase();
          return problemTitleMap[lowerTitle];
        })
        .filter((p): p is NonNullable<typeof p> => Boolean(p) && !coreIds.has(p.id));
        
      const allMapped = [...coreMapped, ...extraMapped];
      const problemIds = allMapped.map(p => p.id);
      
      const mastery = computePatternCompletion(pattern.id, problemIds, problemProgress || {});
      return {
        ...pattern,
        problemsCount: allMapped.length,
        completedCount: mastery.problemsCompletedCount,
        isCompleted: mastery.isCompleted,
        mappedProblems: allMapped
      };
    });
  }, [problemProgress]);


  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<PatternList patternData={patternData} />} />
      <Route path="/:patternId" element={<PatternDetail patternData={patternData} />} />
    </Routes>
  );
};

const PatternDetail: React.FC<{ patternData: any[] }> = ({ patternData }) => {
  const { patternId } = useParams();
  const navigate = useNavigate();
  const startSession = useStore(state => state.startSession);
  const { user } = useUser();

  const { data: problemProgress, logProblem, removeProblem } = useProblemProgress();
  const pattern = patternData.find((p: any) => p.id === patternId);
  
  const toggleSolved = (problemId: string, isSolved: boolean) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isSolved) {
      void removeProblem(problemId);
    } else {
      void logProblem(problemId, 4, true, "Quick solve");
    }
  };

  if (!pattern) return <div>Pattern not found</div>;
    return (
      <div className="max-w-5xl mx-auto space-y-16 pb-24">
        <Link 
          to="/patterns"
          className="text-zinc-400 hover:text-zinc-100 flex w-fit items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-medium group transition-colors"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Roadmap
        </Link>

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
                {pattern.isCore === false ? 'Curated Problems' : 'Core Problems'}
              </h2>
              <span className="text-[10px] font-medium px-2 py-0.5 bg-zinc-800/40 text-emerald-400/80 uppercase tracking-widest border border-emerald-500/10">
                {pattern.isCore === false ? `${pattern.educativeProblems?.length || 0} Listed` : `${pattern.completedCount} / ${pattern.problemsCount} Completed`}
              </span>
            </div>
            
            <div className="flex flex-col gap-2">
              {pattern.mappedProblems.map((prob: any) => {
                const prog = problemProgress?.[prob.id];
                const isSolved = !!prog;
                const isRetired = prog?.retired;
                const lastRating = prog && prog.history && prog.history.length > 0
                  ? prog.history[prog.history.length - 1].rating
                  : undefined;
                const needsWork = isSolved && !isRetired && lastRating === 1;
                
                return (
                  <div 
                    key={prob.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-900/20 hover:bg-zinc-900/50 border border-transparent hover:border-zinc-800 transition-colors group"
                  >
                    <div className="flex items-center gap-5">
                      <button 
                        className="flex-shrink-0 pt-0.5 p-2 -m-2 focus:outline-none hover:scale-110 transition-transform active:scale-95" 
                        title={isRetired ? "Completed — mark as unsolved" : needsWork ? "Needs Work — mark as unsolved" : isSolved ? "Solved — mark as unsolved" : "Mark as solved"}
                        onClick={() => toggleSolved(prob.id, isSolved)}
                        aria-label="Toggle Problem Status"
                      >
                        {isRetired ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        ) : needsWork ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                        ) : isSolved ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full border border-zinc-600 group-hover:border-zinc-500 transition-colors" />
                        )}
                      </button>
                      <h3 className={clsx(
                        "text-sm sm:text-base font-medium transition-colors cursor-default",
                        isRetired ? "text-zinc-500" : isSolved ? "text-zinc-300" : "text-zinc-200 group-hover:text-zinc-100"
                      )}>
                        {prob.title}
                      </h3>
                    </div>
                    
                    <div className="ml-[30px] sm:ml-0 mt-4 sm:mt-0 flex items-center justify-between sm:w-auto w-full gap-4">
                      <span className={clsx(
                        "text-[10px] uppercase tracking-widest font-bold",
                        getDifficultyColor(prob.difficulty)
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
                            if (!user) {
                              navigate('/login');
                              return;
                            }
                            startSession(prob.id, false);
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

              {(!pattern.mappedProblems || pattern.mappedProblems.length === 0) && pattern.educativeProblems?.map((prob: any, idx: number) => {
                const badgeString = (prob.badges || []).map((b: string) => b.toLowerCase()).join(' ');
                const isHard = badgeString.includes('hard');
                const isEasy = badgeString.includes('easy');
                const isMedium = !isHard && !isEasy;
                const isBlind75 = badgeString.includes('blind 75');
                
                return (
                  <div 
                    key={`edu-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-900/20 hover:bg-zinc-900/50 border border-transparent hover:border-zinc-800 transition-colors group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="w-2.5 h-2.5 rounded-full border border-zinc-600/50 group-hover:border-zinc-500 transition-colors" />
                      </div>
                      <h3 className="text-sm sm:text-base font-medium transition-colors cursor-default text-zinc-300 group-hover:text-zinc-200">
                        {prob.title}
                      </h3>
                    </div>
                    
                    <div className="ml-[30px] sm:ml-0 mt-4 sm:mt-0 flex items-center justify-between sm:w-auto w-full gap-4">
                      <div className="flex items-center gap-2">
                        {isBlind75 && (
                          <span className="text-[10px] uppercase tracking-widest font-bold text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            Blind 75
                          </span>
                        )}
                        <span className={clsx(
                          "text-[10px] uppercase tracking-widest font-bold w-12 text-right",
                          isEasy ? 'text-emerald-400/80' : 
                          isMedium ? 'text-amber-400/80' : 'text-rose-400/80'
                        )}>
                          {isHard ? 'Hard' : isEasy ? 'Easy' : 'Medium'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] uppercase tracking-widest text-zinc-600 font-bold px-2 border border-zinc-800/50 rounded bg-zinc-900/50">
                        Untracked
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
};

const PatternList: React.FC<{ patternData: any[] }> = ({ patternData }) => {
  const [viewMode, setViewMode] = React.useState<'core' | 'extensive'>(() => {
    return (localStorage.getItem('patternViewMode') as 'core' | 'extensive') || 'core';
  });

  React.useEffect(() => {
    localStorage.setItem('patternViewMode', viewMode);
  }, [viewMode]);

  const visiblePatternData = useMemo(() => {
    if (viewMode === 'extensive') return patternData;
    return patternData.filter(p => p.isCore !== false);
  }, [patternData, viewMode]);

  const navigate = useNavigate();
  const completedPatternsCount = visiblePatternData.filter((p: any) => p.isCompleted).length;
  const totalPatternProblems = visiblePatternData.reduce((sum: number, p: any) => sum + p.problemsCount, 0);
  const completedPatternProblems = visiblePatternData.reduce((sum: number, p: any) => sum + p.completedCount, 0);
  const overallProblemPercent = totalPatternProblems > 0
    ? Math.round((completedPatternProblems / totalPatternProblems) * 100)
    : 0;


  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 pt-6">
      <header className="space-y-4">
        <div className="flex sm:items-end justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50">
              Pattern Mastery
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-3xl mt-4">
              Internalize the essential algorithmic paradigms sequentially. Score <span className="font-black bg-emerald-500/10 px-2 py-0.5 rounded-md text-emerald-400">5s</span> repeatedly on core problems to retire them and advance your roadmap.
            </p>
          </div>
          
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800/80 p-1 rounded-xl self-start sm:self-auto shrink-0 shadow-sm">
            <button
              onClick={() => setViewMode('core')}
              className={clsx(
                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                viewMode === 'core' 
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              )}
            >
              Core (8)
            </button>
            <button
              onClick={() => setViewMode('extensive')}
              className={clsx(
                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                viewMode === 'extensive' 
                  ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              )}
              >
                Extensive (29)
              </button>
            </div>
          </div>
        </header>

      <div className="premium-card p-5 border-emerald-500/20 bg-emerald-500/[0.04]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-400/80 font-bold">Roadmap Progress</p>
            <p className="text-sm text-zinc-300 mt-1">
              {completedPatternsCount} / {visiblePatternData.length} patterns fully completed
            </p>
          </div>
          <span className="text-sm font-semibold text-emerald-400">
            {completedPatternProblems} / {totalPatternProblems} problems completed
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
        {visiblePatternData.map((pattern, index) => {
          const progressPercentage = pattern.problemsCount > 0
            ? (pattern.completedCount / pattern.problemsCount) * 100
            : 0;
            
          const isUnlocked = true;
          
          // An extensive pattern with 0 core problems but some educative ones
          const isCompleted = pattern.isCompleted || (pattern.problemsCount === 0 && (pattern.educativeProblems?.length || 0) === 0);

          return (
            <Link
              key={pattern.id}
              to={`/patterns/${pattern.id}`}
              className={clsx(
                'block w-full text-left premium-card p-5 sm:p-6 border transition-all duration-300 group',
                isCompleted
                  ? 'border-emerald-500/30 bg-emerald-500/[0.06] hover:border-emerald-500/55'
                  : 'border-zinc-700/70 bg-zinc-900/65 hover:border-emerald-500/35 hover:bg-zinc-900/90'
              )}
            >
              <div className="flex items-start gap-4 sm:gap-5">
                <div className={clsx(
                  'w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 text-xs font-black tracking-wider transition-colors',
                  isCompleted
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-zinc-600 bg-zinc-800/70 text-zinc-200 group-hover:border-emerald-500/40'
                )}>
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className={clsx(
                        'text-xl sm:text-2xl font-black tracking-tight transition-colors',
                        isCompleted
                          ? 'text-emerald-200'
                          : 'text-zinc-100 group-hover:text-emerald-300'
                      )}>
                        {pattern.name}
                      </h3>
                      <p className={clsx(
                        'mt-2 text-sm sm:text-base leading-relaxed max-w-3xl',
                        'text-zinc-400'
                      )}>
                        {pattern.description}
                      </p>
                    </div>

                    <span className={clsx(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider',
                      isCompleted
                        ? 'bg-emerald-500/12 border-emerald-500/25 text-emerald-300'
                        : 'bg-zinc-800/70 border-zinc-600/60 text-zinc-300'
                    )}>
                      {isCompleted ? <CheckCircle2 size={12} /> : null}
                      {isCompleted ? 'Completed' : 'Active'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 font-semibold">
                        Pattern Progress
                      </span>
                      <span className={clsx(
                        'text-sm font-semibold',
                        isCompleted ? 'text-emerald-300' : 'text-zinc-200'
                      )}>
                        {pattern.isCore === false ? `${pattern.educativeProblems?.length || 0} Listed` : `${pattern.completedCount} / ${pattern.problemsCount} completed`}
                      </span>
                    </div>

                    <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/55">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-700',
                          isCompleted
                            ? 'bg-emerald-500'
                            : 'bg-emerald-500/70'
                        )}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
