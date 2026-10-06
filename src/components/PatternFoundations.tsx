import { getLearningStatus, LEARNING_STATUS_LABELS } from '../utils/study';
import { preferenceStorage } from '../lib/safeStorage';
import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { useUser } from '@clerk/react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Copy,
  ExternalLink,
  Play,
  Search,
  Sparkles,
} from 'lucide-react';
import { patterns } from '../data/patterns';
import { getPatternLessonMeta, PATTERN_STAGE_ORDER } from '../data/patternLessonMeta';
import { allProblems, problems } from '../data/problems';
import { useProblemProgress, useUserSettings } from '../hooks/useUserData';
import { useStore } from '../store/useStore';
import type { PatternId } from '../types';
import { getPatternForProblem } from '../utils/patternMapping';
import { computePatternCompletion } from '../utils/progressHelpers';
import {
  getDifficultyColor,
  getProblemStatusClass,
  getProblemStatusLabel,
  getProblemStatusTone,
} from '../utils/uiHelpers';
import { cn } from '../utils/cn';
import { Badge, Button, Card, Input, PageHeader, QueryErrorBanner } from './ui';
import { syntaxHighlightExtensions } from '../utils/syntaxHighlightTheme';

type ViewMode = 'essential' | 'complete';
type TemplateLanguage = 'python' | 'javascript';

type PatternCardData = (typeof patterns)[number] & {
  problemsCount: number;
  completedCount: number;
  masteredCount: number;
  dueCount: number;
  needsWorkCount: number;
  isCompleted: boolean;
  mappedProblems: typeof problems;
  estimatedMinutes: number;
  stage: string;
  recognitionSignals: string[];
  prerequisites: PatternId[];
};

function usePatternData() {
  const { data: problemProgress, isLoading, error, refetch } = useProblemProgress();

  const patternData = useMemo<PatternCardData[]>(() => {
    return patterns.map((pattern) => {
      const lesson = getPatternLessonMeta(pattern.id, pattern.isCore);
      const coreMapped = problems.filter((p) => getPatternForProblem(p) === pattern.id);
      const coreIds = new Set(coreMapped.map((p) => p.id));
      const extraMapped = (pattern.educativeProblems || [])
        .map((ep) => allProblems.find((ap) => ap.title.toLowerCase() === ep.title.toLowerCase()))
        .filter((p): p is NonNullable<typeof p> => Boolean(p) && !coreIds.has(p!.id));
      const mappedProblems = [...coreMapped, ...extraMapped];
      const problemIds = mappedProblems.map((p) => p.id);
      const mastery = computePatternCompletion(pattern.id, problemIds, problemProgress || {});

      return {
        ...pattern,
        problemsCount: mappedProblems.length,
        completedCount: mastery.problemsCompletedCount,
        masteredCount: mastery.masteredCount,
        dueCount: mastery.dueCount,
        needsWorkCount: mastery.needsWorkCount,
        isCompleted: mastery.isCompleted,
        mappedProblems,
        estimatedMinutes: lesson.estimatedMinutes,
        stage: lesson.stage,
        recognitionSignals: lesson.recognitionSignals,
        prerequisites: lesson.prerequisites,
      };
    });
  }, [problemProgress]);

  return { patternData, isLoading, error, refetch, problemProgress };
}

export const PatternFoundations: React.FC = () => {
  const { patternData, isLoading, error, refetch, problemProgress } = usePatternData();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PatternList
            patternData={patternData}
            isLoading={isLoading}
            error={error}
            onRetry={() => void refetch?.()}
          />
        }
      />
      <Route
        path="/:patternId"
        element={
          <PatternDetail
            patternData={patternData}
            problemProgress={problemProgress || {}}
            isLoading={isLoading}
          />
        }
      />
    </Routes>
  );
};

const PatternList: React.FC<{
  patternData: PatternCardData[];
  isLoading: boolean;
  error: unknown;
  onRetry?: () => void;
}> = ({ patternData, isLoading, error, onRetry }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = preferenceStorage.getItem('patternViewMode');
    if (saved === 'extensive' || saved === 'complete') return 'complete';
    return 'essential';
  });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'next' | 'due' | 'mastered'>('all');

  useEffect(() => {
    preferenceStorage.setItem('patternViewMode', viewMode === 'essential' ? 'core' : 'complete');
  }, [viewMode]);

  const visiblePatternData = useMemo(() => {
    const base = viewMode === 'complete' ? patternData : patternData.filter((p) => p.isCore !== false);
    return base.filter((pattern) => {
      const haystack = `${pattern.name} ${pattern.description} ${pattern.stage}`.toLowerCase();
      if (query && !haystack.includes(query.toLowerCase())) return false;
      if (statusFilter === 'mastered') return pattern.isCompleted;
      if (statusFilter === 'due') return pattern.dueCount > 0 || pattern.needsWorkCount > 0;
      if (statusFilter === 'next') return !pattern.isCompleted;
      return true;
    });
  }, [patternData, viewMode, query, statusFilter]);

  const recommended = visiblePatternData.find((p) => !p.isCompleted) ?? visiblePatternData[0];
  const masteredCount = visiblePatternData.filter((p) => p.isCompleted).length;
  const dueCount = visiblePatternData.reduce((sum, p) => sum + p.dueCount, 0);
  const totalProblems = visiblePatternData.reduce((sum, p) => sum + p.problemsCount, 0);
  const masteredProblems = visiblePatternData.reduce((sum, p) => sum + p.masteredCount, 0);

  const grouped = useMemo(() => {
    const map = new Map<string, PatternCardData[]>();
    for (const stage of PATTERN_STAGE_ORDER) map.set(stage, []);
    for (const pattern of visiblePatternData) {
      if (!map.has(pattern.stage)) map.set(pattern.stage, []);
      map.get(pattern.stage)!.push(pattern);
    }
    return [...map.entries()].filter(([, items]) => items.length > 0);
  }, [visiblePatternData]);

  if (isLoading && patternData.length === 0) {
    return (
      <div className="space-y-6 animate-in">
        <div className="h-24 rounded-2xl bg-surface/70 border border-line animate-pulse" />
        <div className="h-28 rounded-2xl bg-surface/70 border border-line animate-pulse" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-surface/70 border border-line animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 animate-in">
      <PageHeader
        icon={<Sparkles size={28} />}
        title="Pattern learning"
        description={
          <>
            Learn recognition cues, walk a worked example, then test recall, implementation, and transfer across spaced attempts.
            Established patterns require spaced independent coding and an unseen-variation pass.
          </>
        }
        actions={
          recommended ? (
            <Button
              variant="primary"
              onClick={() => navigate(`/patterns/${recommended.id}`)}
            >
              Continue learning
              <ArrowRight size={16} />
            </Button>
          ) : null
        }
      />

      {error ? (
        <QueryErrorBanner
          title="Pattern progress could not be refreshed"
          message="You can still browse the roadmap. Retry to sync mastery and due counts."
          onRetry={onRetry}
        />
      ) : null}

      <Card className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted font-medium">Roadmap progress</p>
            <p className="text-sm text-body">
              {masteredCount} / {visiblePatternData.length} patterns established · {masteredProblems} / {totalProblems} dependable problems
            </p>
            <p className="text-xs text-subtle">{dueCount} review{dueCount === 1 ? '' : 's'} currently due across this track</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">{viewMode === 'essential' ? 'Essential 8' : 'Complete catalog'}</Badge>
            {recommended ? <Badge>Next: {recommended.name}</Badge> : <Badge tone="success">Track complete</Badge>}
          </div>
        </div>
        <div className="mt-4 h-2 bg-muted-surface/80 rounded-full overflow-hidden border border-line-strong/50">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700"
            style={{ width: `${totalProblems ? Math.round((masteredProblems / totalProblems) * 100) : 0}%` }}
          />
        </div>
      </Card>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" size={18} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patterns, stages, or recognition cues..."
            className="pl-10"
            aria-label="Search patterns"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-canvas border border-line/80 p-1 rounded-xl">
            {([
              ['essential', 'Essential 8'],
              ['complete', 'Complete (29)'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  viewMode === mode
                    ? 'bg-accent/15 text-accent ring-1 ring-accent/30'
                    : 'text-subtle hover:text-body hover:bg-muted-surface/50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-canvas border border-line/80 p-1 rounded-xl">
            {([
              ['all', 'All'],
              ['next', 'In progress'],
              ['due', 'Due / weak'],
              ['mastered', 'Established'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setStatusFilter(mode)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  statusFilter === mode
                    ? 'bg-muted-surface text-foreground'
                    : 'text-subtle hover:text-body'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {grouped.length === 0 ? (
        <Card className="p-10 text-center text-subtle">No patterns match your filters.</Card>
      ) : (
        <div className="space-y-10">
          {grouped.map(([stage, items]) => (
            <section key={stage} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">{stage}</h2>
                <div className="h-px flex-1 bg-muted-surface" />
                <span className="text-xs text-subtle">{items.length} pattern{items.length === 1 ? '' : 's'}</span>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {items.map((pattern, index) => {
                  const progressPct = pattern.problemsCount
                    ? Math.round((pattern.masteredCount / pattern.problemsCount) * 100)
                    : 0;
                  const isNext = recommended?.id === pattern.id;
                  return (
                    <Link
                      key={pattern.id}
                      to={`/patterns/${pattern.id}`}
                      className={cn(
                        'block premium-card p-5 border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        pattern.isCompleted
                          ? 'border-accent/30 bg-accent/[0.06] hover:border-accent/55'
                          : isNext
                            ? 'border-accent/40 bg-surface/90 hover:border-accent/60'
                            : 'border-line-strong/70 bg-surface/65 hover:border-accent/35'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 text-xs font-black tracking-wider',
                            pattern.isCompleted
                              ? 'border-accent/40 bg-accent/15 text-accent'
                              : 'border-line-strong bg-muted-surface/70 text-body'
                          )}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-xl font-bold tracking-tight text-foreground">{pattern.name}</h3>
                              <p className="mt-2 text-sm text-muted leading-relaxed">{pattern.description}</p>
                            </div>
                            <Badge tone={pattern.isCompleted ? 'success' : isNext ? 'info' : 'neutral'}>
                              {pattern.isCompleted ? (
                                <>
                                  <CheckCircle2 size={12} /> Established
                                </>
                              ) : isNext ? (
                                'Continue here'
                              ) : (
                                'Open'
                              )}
                            </Badge>
                          </div>

                          <p className="text-xs text-subtle leading-relaxed">
                            <span className="text-body font-medium">Recognize it when: </span>
                            {pattern.recognitionSignals[0]}
                          </p>

                          <div className="flex flex-wrap gap-2 text-[11px] text-muted">
                            <Badge>~{pattern.estimatedMinutes} min</Badge>
                            <Badge tone={pattern.dueCount ? 'warning' : 'neutral'}>{pattern.dueCount} due</Badge>
                            <Badge tone={pattern.needsWorkCount ? 'danger' : 'neutral'}>
                              {pattern.needsWorkCount} weak
                            </Badge>
                            {pattern.prerequisites.length > 0 ? (
                              <Badge>Recommended after {pattern.prerequisites.length} earlier pattern{pattern.prerequisites.length === 1 ? '' : 's'}</Badge>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-[11px] uppercase tracking-[0.16em] text-subtle font-semibold">
                                Implementation evidence
                              </span>
                              <span className="font-semibold text-body">
                                {pattern.masteredCount} / {pattern.problemsCount} dependable
                              </span>
                            </div>
                            <div className="h-2 bg-muted-surface/80 rounded-full overflow-hidden border border-line-strong/55">
                              <div
                                className="h-full rounded-full bg-accent/80 transition-all duration-700"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

const PatternDetail: React.FC<{
  patternData: PatternCardData[];
  problemProgress: Record<string, any>;
  isLoading: boolean;
}> = ({ patternData, problemProgress, isLoading }) => {
  const { patternId } = useParams();
  const navigate = useNavigate();
  const startSession = useStore((state) => state.startSession);
  const { user } = useUser();
  const { logProblem, removeProblem } = useProblemProgress();
  const { settings } = useUserSettings();
  const settingsLanguage = (settings.language || 'Python').toLowerCase();
  const initialTemplateLang: TemplateLanguage =
    settingsLanguage.includes('java') && !settingsLanguage.includes('script')
      ? 'javascript'
      : settingsLanguage.includes('script')
        ? 'javascript'
        : 'python';
  const [language, setLanguage] = useState<TemplateLanguage>(initialTemplateLang);
  const [copied, setCopied] = useState(false);

  const pattern = patternData.find((p) => p.id === patternId);
  const lesson = pattern ? getPatternLessonMeta(pattern.id, pattern.isCore) : null;

  if (!isLoading && !pattern) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-foreground">Pattern not found</h1>
        <p className="text-muted">That roadmap link is invalid or outdated.</p>
        <Button variant="primary" onClick={() => navigate('/patterns')}>
          Back to roadmap
        </Button>
      </div>
    );
  }

  if (!pattern || !lesson) {
    return <div className="h-64 rounded-2xl bg-surface/70 border border-line animate-pulse" />;
  }

  const template = language === 'python' ? pattern.templateCodePython : pattern.templateCodeJs;
  const learnProblems = pattern.mappedProblems.slice(0, Math.min(5, pattern.mappedProblems.length));
  const reinforceProblems = pattern.mappedProblems.slice(5, 12);
  const challengeProblems = pattern.mappedProblems.slice(12);

  const toggleSolved = (problemId: string, isSolved: boolean) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isSolved) {
      void removeProblem(problemId);
    } else {
      void logProblem(problemId, 3, true, 'Imported solve');
    }
  };

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const renderProblemGroup = (title: string, items: typeof pattern.mappedProblems) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-subtle">{title}</h3>
          <span className="text-xs text-subtle">{items.length}</span>
        </div>
        <div className="space-y-2">
          {items.map((prob) => {
            const prog = problemProgress[prob.id];
            const isSolved = !!prog;
            const tone = getProblemStatusTone({
              isSolved,
              isRetired: getLearningStatus(prog) === 'maintenance',
              lastRating: prog?.history?.[prog.history.length - 1]?.rating,
            });
            return (
              <div
                key={prob.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-line/80 bg-canvas/40"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    className="mt-1 p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    title={getProblemStatusLabel(tone)}
                    aria-label={`${getProblemStatusLabel(tone)} — toggle ${prob.title}`}
                    onClick={() => toggleSolved(prob.id, isSolved)}
                  >
                    <span className={cn('block w-2.5 h-2.5 rounded-full', getProblemStatusClass(tone), tone === 'unsolved' ? 'border border-line-strong bg-transparent' : 'bg-current')} />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{prob.title}</p>
                    <p className="text-xs text-subtle mt-1">{LEARNING_STATUS_LABELS[getLearningStatus(prog)]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <span className={cn('text-[10px] uppercase tracking-widest font-bold', getDifficultyColor(prob.difficulty))}>
                    {prob.difficulty}
                  </span>
                  <a
                    href={prob.leetcodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-line-strong text-body hover:text-accent hover:border-accent/40 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <ExternalLink size={14} />
                    LeetCode
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        navigate('/login');
                        return;
                      }
                      startSession(prob.id, Boolean(problemProgress[prob.id]), false, Date.now(), `/patterns/${pattern.id}`);
                      navigate(`/timer/${prob.id}`, { state: { returnTo: `/patterns/${pattern.id}` } });
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <Play size={14} />
                    Start
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24 animate-in">
      <Link
        to="/patterns"
        className="text-muted hover:text-foreground inline-flex w-fit items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
      >
        <ChevronLeft className="w-4 h-4" />
        Roadmap
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge>{lesson.stage}</Badge>
          <Badge tone="success">{pattern.masteredCount}/{pattern.problemsCount} dependable</Badge>
          <Badge tone={pattern.dueCount ? 'warning' : 'neutral'}>{pattern.dueCount} due</Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight leading-tight">
          {pattern.name}
        </h1>
        <p className="text-base text-muted max-w-3xl leading-relaxed">{pattern.description}</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] gap-8 items-start">
        <div className="space-y-8">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Recognition</h2>
            <ul className="space-y-2 text-sm text-body leading-relaxed">
              {lesson.recognitionSignals.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 border-t border-line space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">When not to use it</h3>
              {lesson.antiPatterns.map((item) => (
                <p key={item} className="text-sm text-muted leading-relaxed">{item}</p>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Logic template</h2>
              <div className="flex flex-wrap gap-2">
                {([
                  ['python', 'Python'],
                  ['javascript', 'JavaScript'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLanguage(value)}
                    aria-pressed={language === value}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                      language === value
                        ? 'bg-accent/15 text-accent border-accent/30'
                        : 'bg-canvas text-muted border-line'
                    )}
                  >
                    {label}
                  </button>
                ))}
                <Button size="sm" variant="secondary" onClick={() => void copyTemplate()}>
                  <Copy size={14} />
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            <div className="bg-canvas border border-line/50 p-3 sm:p-4 rounded-xl overflow-x-auto">
              <CodeMirror
                value={template}
                extensions={[language === 'python' ? python() : javascript({ typescript: false }), ...syntaxHighlightExtensions]}
                theme="none"
                editable={false}
                readOnly
                basicSetup={false}
                className="syntax-highlighted-code syntax-highlighted-code--md"
              />
            </div>
            <p className="text-xs text-subtle leading-relaxed">{lesson.complexity}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {lesson.invariants.map((item) => (
                <div key={item} className="rounded-xl border border-line bg-canvas/50 p-3 text-sm text-body">
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Worked example</h2>
            <div>
              <p className="text-base font-semibold text-foreground">{lesson.workedExample.title}</p>
              <p className="text-sm text-muted mt-1 font-mono">{lesson.workedExample.input}</p>
            </div>
            <ol className="space-y-2 list-decimal list-inside text-sm text-body leading-relaxed">
              {lesson.workedExample.walkthrough.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="text-sm text-accent font-medium">Result: {lesson.workedExample.result}</p>
          </Card>

          <Card className="p-6 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Common pitfalls</h2>
            <ul className="space-y-2 text-sm text-body leading-relaxed">
              {lesson.commonMistakes.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-warning mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8">
          <Card accent className="p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Practice ladder</h2>
            <p className="text-xs text-muted leading-relaxed">
              Learn representative problems, check implementation after a delay, and try unseen variations. Successful recall checks stay separate from coding evidence. Dependable problems remain eligible for maintenance.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge>~{lesson.estimatedMinutes} min lesson</Badge>
              <Badge tone="warning">{pattern.dueCount} due</Badge>
              <Badge tone="danger">{pattern.needsWorkCount} weak</Badge>
            </div>
          </Card>

          {renderProblemGroup('Learn', learnProblems)}
          {renderProblemGroup('Reinforce', reinforceProblems)}
          {renderProblemGroup('Challenge', challengeProblems)}
        </aside>
      </div>
    </div>
  );
};
