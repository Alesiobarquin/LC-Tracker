import React, { useState, useMemo } from 'react';
import { problems, Category } from '../data/problems';
import { useStore } from '../store/useStore';
import { Search, Play, CircleCheck, Check, Filter, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { Timer } from './Timer';

export const ProblemLibrary: React.FC = () => {
  const progress = useStore((state) => state.progress);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const logProblem = useStore((state) => state.logProblem);
  const removeProblem = useStore((state) => state.removeProblem);

  const [activeTab, setActiveTab] = useState<'NeetCode 75' | 'Blind 75' | 'NeetCode 150'>('NeetCode 75');
  const [sortConfig, setSortConfig] = useState<{ key: 'title' | 'category' | 'difficulty' | 'status'; direction: 'asc' | 'desc' } | null>(null);

  // Reserved problems (those with full mock interview content)
  const reservedProblems = useMemo(() => new Set(
    problems
      .filter(p => p.mockInterviewContent?.statement && p.mockInterviewContent?.optimalSolution && p.mockInterviewContent?.explanation)
      .map(p => p.id)
  ), []);

  const tabProblems = problems.filter(p => {
    if (activeTab === 'NeetCode 75') return p.isNeetCode75;
    if (activeTab === 'Blind 75') return p.isBlind75;
    if (activeTab === 'NeetCode 150') return p.isNeetCode150;
    return false;
  });

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

  const handleSort = (key: 'title' | 'category' | 'difficulty' | 'status') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleSolved = (problemId: string, isSolved: boolean) => {
    if (isSolved) {
      removeProblem(problemId);
    } else {
      logProblem(problemId, 3, true, "Quick solve");
    }
  };
  
  const solvedInTab = tabProblems.filter(p => progress[p.id]).length;
  const totalInTab = tabProblems.length;
  const progressPercent = totalInTab > 0 ? Math.round((solvedInTab / totalInTab) * 100) : 0;

  if (activeSession) {
    const problem = problems.find(p => p.id === activeSession);
    if (!problem) return null;
    return <Timer problem={problem} isNew={!progress[problem.id]} onComplete={() => setActiveSession(null)} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Problem Library</h1>
        <p className="text-zinc-400 mt-1">Curated lists for interview preparation</p>
      </header>

      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex space-x-2 border-b border-zinc-800 pb-2">
          {['NeetCode 75', 'Blind 75', 'NeetCode 150'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
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
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    Category {sortConfig?.key === 'category' && <span className="text-emerald-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
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
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredProblems.map(prob => {
                const prog = progress[prob.id];
                const isSolved = !!prog;
                const isRetired = prog?.retired;
                
                return (
                  <tr key={prob.id} className="hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <button 
                         onClick={() => toggleSolved(prob.id, isSolved)}
                         className="focus:outline-none hover:scale-110 transition-transform active:scale-95"
                         title={isSolved ? "Mark as unsolved" : "Mark as solved"}
                      >
                        {isRetired ? (
                          <CircleCheck size={20} className="text-emerald-500" />
                        ) : isSolved ? (
                          <Check size={20} className="text-amber-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-zinc-700 hover:border-emerald-500/50 transition-colors" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-100">
                      <span className="flex items-center gap-2">
                        {prob.title}
                        {reservedProblems.has(prob.id) && (
                          <span title="Reserved for Mock Interviews — not shown in daily plan" className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                            <Lock size={9} /> Mock Only
                          </span>
                        )}
                        {activeTab === 'NeetCode 75' && prob.isBlind75 && <span className="ml-1 text-[10px] uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">Blind 75</span>}
                        {activeTab === 'Blind 75' && prob.isNeetCode75 && <span className="ml-1 text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">NeetCode 75</span>}
                        {activeTab === 'NeetCode 150' && prob.isBlind75 && <span className="ml-1 text-[10px] uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">Blind 75</span>}
                        {activeTab === 'NeetCode 150' && prob.isNeetCode75 && <span className="ml-1 text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">NeetCode 75</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{prob.category}</td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        prob.difficulty === 'Easy' ? "text-emerald-400" :
                        prob.difficulty === 'Medium' ? "text-amber-400" :
                        "text-red-400"
                      )}>
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setActiveSession(prob.id)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Play size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredProblems.length === 0 && (
          <div className="p-12 text-center text-zinc-500">
            No problems found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};
