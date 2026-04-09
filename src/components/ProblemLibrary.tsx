import React, { useState, useMemo, useEffect } from 'react';
import { problems, allProblems, problemMap, isProblemPremium, Category } from '../data/problems';
import { Search, Play, CircleCheck, Filter, Lock, ExternalLink, Library } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Timer } from './Timer';
import { useProblemProgress, useUserSettings } from '../hooks/useUserData';
import { ProblemLibrarySkeleton } from './loadingSkeletons';
import { getDifficultyColor } from '../utils/uiHelpers';

const VIRTUALIZE_THRESHOLD = 200;
/** Initial rows to render per tab/filter (large lists load more on demand). */
const PROBLEM_LIST_INITIAL_CHUNK = 100;
const PROBLEM_LIST_LOAD_MORE_CHUNK = 200;

export const ProblemLibrary: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { progress, logProblem, removeProblem, isLoading } = useProblemProgress();
  const { settings } = useUserSettings();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [pendingPremiumStartId, setPendingPremiumStartId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    'NeetCode 75' | 'NeetCode 150' | 'NeetCode 250' | 'Full Catalog'
  >('NeetCode 75');
  const [visibleLimit, setVisibleLimit] = useState(PROBLEM_LIST_INITIAL_CHUNK);
  const [sortConfig, setSortConfig] = useState<{ key: 'title' | 'category' | 'difficulty' | 'status'; direction: 'asc' | 'desc' } | null>(null);

  const tabProblems = useMemo(() => {
    if (activeTab === 'NeetCode 75') return problems.filter((p) => p.isNeetCode75);
    if (activeTab === 'NeetCode 150') return problems.filter((p) => p.isNeetCode150);
    if (activeTab === 'NeetCode 250') return problems.filter((p) => p.isNeetCode250);
    if (activeTab === 'Full Catalog') return allProblems;
    return [];
  }, [activeTab]);

  useEffect(() => {
    setVisibleLimit(PROBLEM_LIST_INITIAL_CHUNK);
  }, [activeTab, search, activeCategory, sortConfig]);

  const categories = ['All', ...Array.from(new Set(tabProblems.map(p => p.category)))];

  const filteredProblems = useMemo(() => {
    let result = tabProblems.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof typeof a];
        let bValue: any = b[sortConfig.key as keyof typeof b];

        if (sortConfig.key === 'status') {
          const aProg = progress[a.id];
          const bProg = progress[b.id];
          aValue = aProg ? (aProg.retired ? 2 : 1) : 0;
          bValue = bProg ? (bProg.retired ? 2 : 1) : 0;
        } else if (sortConfig.key === 'difficulty') {
          const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          aValue = difficultyOrder[a.difficulty as keyof typeof difficultyOrder];
          bValue = difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [tabProblems, search, activeCategory, sortConfig, progress]);

  const displayedProblems = useMemo(
    () => filteredProblems.slice(0, visibleLimit),
    [filteredProblems, visibleLimit]
  );
  const hiddenCount = Math.max(0, filteredProblems.length - displayedProblems.length);
  const pendingPremiumProblem = pendingPremiumStartId
    ? problemMap[pendingPremiumStartId] ?? null
    : null;

  const handleSort = (key: 'title' | 'category' | 'difficulty' | 'status') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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

  const handleStartSession = (problemId: string, isPremium: boolean) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isPremium && !settings.includePremiumInAssignments) {
      setPendingPremiumStartId(problemId);
      return;
    }
    setActiveSession(problemId);
  };

  const confirmPremiumStart = () => {
    if (!pendingPremiumStartId) return;
    setActiveSession(pendingPremiumStartId);
    setPendingPremiumStartId(null);
  };
  
  const solvedInTab = tabProblems.filter(p => progress[p.id]).length;
  const totalInTab = tabProblems.length;
  const progressPercent = totalInTab > 0 ? Math.round((solvedInTab / totalInTab) * 100) : 0;

  const virtualRowStyle: React.CSSProperties | undefined =
    displayedProblems.length >= VIRTUALIZE_THRESHOLD
      ? { contentVisibility: 'auto', containIntrinsicSize: 'auto 52px' }
      : undefined;

  if (isLoading) {
    return <ProblemLibrarySkeleton />;
  }

  if (activeSession) {
    const problem = problemMap[activeSession];
    if (!problem) return null;
    return <Timer problem={problem} isNew={!progress[problem.id]} onComplete={() => setActiveSession(null)} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 flex items-center gap-3">
          <Library className="text-emerald-400" size={32} />
          Problem Library
        </h1>
      </header>

      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
          {(['NeetCode 75', 'NeetCode 150', 'NeetCode 250', 'Full Catalog'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="premium-card p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-400">{activeTab} Progress</span>
            <span className="text-zinc-100 font-medium">{solvedInTab} / {totalInTab}</span>
          </div>
          <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/50">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input 
            type="text" 
            placeholder="Search problems..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="relative">
          <select 
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value as Category | 'All')}
            className="appearance-none bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-10 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-zinc-800/70 bg-zinc-900/40 px-3 py-2 text-[11px] text-zinc-400">
        <span className="uppercase tracking-wider text-zinc-500">Status key</span>
        <span className="inline-flex items-center gap-1.5">
          <CircleCheck size={13} className="text-emerald-500" />
          Mastered (retired)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CircleCheck size={13} className="text-amber-500" />
          Solved (active queue)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CircleCheck size={13} className="text-red-500" />
          Needs work (last rating 1)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-[13px] h-[13px] rounded-full border-2 border-zinc-700" />
          Unsolved
        </span>
      </div>

      {pendingPremiumProblem && (
        <div className="premium-card p-4 border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-amber-300 font-medium flex items-center gap-2">
              <Lock size={14} /> LeetCode Premium problem selected
            </p>
            <p className="text-xs text-zinc-300 mt-1">
              {pendingPremiumProblem.title} requires LeetCode Premium. This label is about LeetCode access, not any LC-Tracker plan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPendingPremiumStartId(null)}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmPremiumStart}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950"
            >
              Start anyway
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {filteredProblems.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
            No problems found matching your criteria.
          </div>
        ) : (
          Object.entries(
            displayedProblems.reduce((acc, prob) => {
              if (!acc[prob.category]) acc[prob.category] = [];
              acc[prob.category].push(prob);
              return acc;
            }, {} as Record<string, typeof displayedProblems>)
          ).map(([category, problems]) => (
            <div key={category} className="space-y-3">
              <div className="text-center text-sm font-medium text-zinc-300 py-2">
                {category}
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th 
                          className="px-6 py-4 font-medium cursor-pointer hover:text-zinc-200 select-none transition-colors"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-1">
                            Status {sortConfig?.key === 'status' && <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-4 font-medium cursor-pointer hover:text-zinc-200 select-none transition-colors"
                          onClick={() => handleSort('title')}
                        >
                          <div className="flex items-center gap-1">
                            Problem {sortConfig?.key === 'title' && <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-4 font-medium cursor-pointer hover:text-zinc-200 select-none transition-colors"
                          onClick={() => handleSort('difficulty')}
                        >
                          <div className="flex items-center gap-1">
                            Difficulty {sortConfig?.key === 'difficulty' && <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                          </div>
                        </th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {problems.map(prob => {
                        const prog = progress[prob.id];
                        const isSolved = !!prog;
                        const isRetired = prog?.retired;
                        const lastRating = prog && prog.history.length > 0
                          ? prog.history[prog.history.length - 1].rating
                          : undefined;
                        const needsWork = isSolved && !isRetired && lastRating === 1;
                        const isPremium = isProblemPremium(prob);
                        const statusTitle = isRetired
                          ? 'Mastered (retired) — mark as unsolved'
                          : needsWork
                            ? 'Solved but struggling (last rating 1) — mark as unsolved'
                            : isSolved
                            ? 'Solved (active queue) — mark as unsolved'
                            : 'Mark as solved';
                        
                        return (
                          <tr key={prob.id} className="hover:bg-zinc-800/50 transition-colors group" style={virtualRowStyle}>
                            <td className="px-6 py-4">
                              <button 
                                 onClick={() => toggleSolved(prob.id, isSolved)}
                                 className="focus:outline-none hover:scale-110 transition-transform active:scale-95"
                                 title={statusTitle}
                                 aria-label={statusTitle}
                              >
                                {isRetired ? (
                                  <CircleCheck size={20} className="text-emerald-500" />
                                ) : needsWork ? (
                                  <CircleCheck size={20} className="text-red-500" />
                                ) : isSolved ? (
                                  <CircleCheck size={20} className="text-amber-500" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-zinc-700 hover:border-emerald-500/50 transition-colors" />
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-4 font-medium text-zinc-100">
                              <span className="flex items-center gap-2">
                                {prob.title}
                                {isPremium && (
                                  <span title="Requires LeetCode Premium" className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/25">
                                    <Lock size={9} /> LC Premium
                                  </span>
                                )}
                                {activeTab === 'NeetCode 150' && prob.isNeetCode75 && <span className="ml-1 text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">NeetCode 75</span>}
                                {activeTab === 'NeetCode 250' && prob.isNeetCode150 && !prob.isNeetCode75 && (
                                  <span className="ml-1 text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20">NC150+</span>
                                )}
                                {activeTab === 'Full Catalog' && prob.isExtendedCatalog && (
                                  <span className="ml-1 text-[10px] uppercase tracking-wider bg-zinc-500/10 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-500/20">Catalog</span>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={clsx(getDifficultyColor(prob.difficulty))}>
                                {prob.difficulty}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center justify-end gap-2">
                                <a
                                  href={prob.leetcodeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors border border-zinc-700/50 hover:border-zinc-600 text-xs font-medium"
                                  title="Open on LeetCode to view your submission status"
                                  aria-label={`Open ${prob.title} on LeetCode`}
                                >
                                  <ExternalLink size={14} className="shrink-0" />
                                  <span className="hidden sm:inline">LeetCode</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleStartSession(prob.id, isPremium)}
                                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title={isPremium && !settings.includePremiumInAssignments ? 'LeetCode Premium problem: confirm before starting' : 'Start practice timer'}
                                >
                                  <Play size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
        {hiddenCount > 0 && (
          <div className="flex flex-col items-center gap-2 pt-4 pb-2">
            <p className="text-xs text-zinc-500">
              Showing {displayedProblems.length} of {filteredProblems.length} problems
            </p>
            <button
              type="button"
              onClick={() =>
                setVisibleLimit((prev) =>
                  Math.min(prev + PROBLEM_LIST_LOAD_MORE_CHUNK, filteredProblems.length)
                )
              }
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium border border-zinc-700 transition-colors"
            >
              Show more ({hiddenCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
