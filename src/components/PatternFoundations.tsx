import { PatternSkeleton } from "./loadingSkeletons";
import { getLearningStatus, LEARNING_STATUS_LABELS } from "../utils/study";
import { TraceIndex } from "./ui/StudyTrace";
import { preferenceStorage } from "../lib/safeStorage";
import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { useUser } from "@clerk/react";
import {
  ArrowRight,
  ChevronLeft,
  Copy,
  ExternalLink,
  Play,
  Search,
} from "lucide-react";
import { patterns } from "../data/patterns";
import {
  getPatternLessonMeta,
  PATTERN_STAGE_ORDER,
} from "../data/patternLessonMeta";
import { allProblems, problems } from "../data/problems";
import { useProblemProgress, useUserSettings } from "../hooks/useUserData";
import { useStore } from "../store/useStore";
import type { PatternId } from "../types";
import { getPatternForProblem } from "../utils/patternMapping";
import { computePatternCompletion } from "../utils/progressHelpers";
import {
  getDifficultyColor,
  getProblemStatusClass,
  getProblemStatusLabel,
  getProblemStatusTone,
} from "../utils/uiHelpers";
import { cn } from "../utils/cn";
import { Badge, Button, Card, Input, PageHeader, QueryErrorBanner } from "./ui";
import { syntaxHighlightExtensions } from "../utils/syntaxHighlightTheme";

type ViewMode = "essential" | "complete";
type TemplateLanguage = "python" | "javascript";

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
  const {
    data: problemProgress,
    isLoading,
    error,
    refetch,
  } = useProblemProgress();

  const patternData = useMemo<PatternCardData[]>(() => {
    return patterns.map((pattern) => {
      const lesson = getPatternLessonMeta(pattern.id, pattern.isCore);
      const coreMapped = problems.filter(
        (p) => getPatternForProblem(p) === pattern.id,
      );
      const coreIds = new Set(coreMapped.map((p) => p.id));
      const extraMapped = (pattern.educativeProblems || [])
        .map((ep) =>
          allProblems.find(
            (ap) => ap.title.toLowerCase() === ep.title.toLowerCase(),
          ),
        )
        .filter(
          (p): p is NonNullable<typeof p> => Boolean(p) && !coreIds.has(p!.id),
        );
      const mappedProblems = [...coreMapped, ...extraMapped];
      const problemIds = mappedProblems.map((p) => p.id);
      const mastery = computePatternCompletion(
        pattern.id,
        problemIds,
        problemProgress || {},
      );

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
  const { patternData, isLoading, error, refetch, problemProgress } =
    usePatternData();

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
    const saved = preferenceStorage.getItem("patternViewMode");
    if (saved === "extensive" || saved === "complete") return "complete";
    return "essential";
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "next" | "due" | "mastered"
  >("all");

  useEffect(() => {
    preferenceStorage.setItem(
      "patternViewMode",
      viewMode === "essential" ? "core" : "complete",
    );
  }, [viewMode]);

  const visiblePatternData = useMemo(() => {
    const base =
      viewMode === "complete"
        ? patternData
        : patternData.filter((p) => p.isCore !== false);
    return base.filter((pattern) => {
      const haystack =
        `${pattern.name} ${pattern.description} ${pattern.stage}`.toLowerCase();
      if (query && !haystack.includes(query.toLowerCase())) return false;
      if (statusFilter === "mastered") return pattern.isCompleted;
      if (statusFilter === "due")
        return pattern.dueCount > 0 || pattern.needsWorkCount > 0;
      if (statusFilter === "next") return !pattern.isCompleted;
      return true;
    });
  }, [patternData, viewMode, query, statusFilter]);

  const recommended =
    visiblePatternData.find((p) => !p.isCompleted) ?? visiblePatternData[0];
  const masteredCount = visiblePatternData.filter((p) => p.isCompleted).length;
  const dueCount = visiblePatternData.reduce((sum, p) => sum + p.dueCount, 0);
  const totalProblems = visiblePatternData.reduce(
    (sum, p) => sum + p.problemsCount,
    0,
  );
  const masteredProblems = visiblePatternData.reduce(
    (sum, p) => sum + p.masteredCount,
    0,
  );

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
    return <PatternSkeleton />;
  }

  return (
    <div className="pattern-roadmap space-y-7 pb-12 animate-in">
      <PageHeader
        title="Pattern learning"
        description={
          "Recognition, reasoning, implementation. Build evidence across spaced attempts."
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

      {visiblePatternData.length > 0 && (
        <section aria-label="Roadmap progress" className="pattern-progress">
          <div>
            <p className="register-label mb-2">Roadmap progress</p>
            <p className="text-sm text-body">
              <span className="pattern-progress-value register-value">
                {masteredCount}
                <span>/{visiblePatternData.length}</span>
              </span>{" "}
              patterns established{" "}
              <span className="mx-2 text-line-strong">/</span>
              <span className="font-mono text-foreground">
                {masteredProblems}/{totalProblems}
              </span>{" "}
              dependable<span className="hidden sm:inline"> problems</span>
            </p>
          </div>
          <span className="text-[11px] font-mono text-subtle whitespace-nowrap">
            {dueCount} reviews due
          </span>
        </section>
      )}

      <div className="pattern-controls flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
            size={18}
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patterns, stages, or recognition cues..."
            className="pl-10"
            aria-label="Search patterns"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="index-tabs flex items-center gap-1">
            {(
              [
                ["essential", "Essential 8"],
                ["complete", "Complete (29)"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  "index-tab px-2 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  viewMode === mode
                    ? "is-selected text-foreground"
                    : "text-subtle hover:text-body hover:bg-muted-surface/50",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="index-tabs flex items-center gap-1">
            {(
              [
                ["all", "All"],
                ["next", "In progress"],
                ["due", "Due / weak"],
                ["mastered", "Established"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setStatusFilter(mode)}
                className={cn(
                  "index-tab px-2 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  statusFilter === mode
                    ? "is-selected text-foreground"
                    : "text-subtle hover:text-body",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="empty-register text-sm text-muted">
          <p>No patterns match your filters.</p>
          <button
            type="button"
            className="quiet-action mt-3"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
            }}
          >
            Clear filters <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        <div className="space-y-7">
          {grouped.map(([stage, items], stageIndex) => (
            <section key={stage} className="pattern-chapter">
              <div className="chapter-heading">
                <span className="chapter-address">
                  {String(stageIndex + 1).padStart(2, "0")}
                </span>
                <h2 className="register-label">{stage}</h2>
                <div className="h-px flex-1 bg-muted-surface" />
                <span className="text-xs text-subtle">
                  {items.length} pattern{items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div>
                {items.map((pattern, index) => {
                  const progressPct = pattern.problemsCount
                    ? Math.round(
                        (pattern.masteredCount / pattern.problemsCount) * 100,
                      )
                    : 0;
                  const isNext = recommended?.id === pattern.id;
                  return (
                    <Link
                      key={pattern.id}
                      to={`/patterns/${pattern.id}`}
                      className={cn(
                        "pattern-row",
                        isNext && "pattern-row-current",
                      )}
                    >
                      <TraceIndex active={isNext}>
                        {String(index + 1).padStart(2, "0")}
                      </TraceIndex>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="pattern-row-title">{pattern.name}</h3>
                          {pattern.isCompleted ? (
                            <span className="font-mono text-[10px] text-success">
                              Established
                            </span>
                          ) : (
                            isNext && (
                              <span className="font-mono text-[10px] text-accent">
                                Continue here
                              </span>
                            )
                          )}
                        </div>
                        {isNext && (
                          <p className="text-xs text-muted leading-relaxed mt-2 max-w-xl">
                            {pattern.description}
                          </p>
                        )}
                        <p className="pattern-recognition text-[11px] text-muted leading-relaxed mt-2">
                          {pattern.recognitionSignals[0]}
                        </p>
                      </div>
                      <div className="pattern-row-evidence space-y-2">
                        <p className="pattern-depth">
                          <strong>{pattern.masteredCount}</strong>
                          <span>/{pattern.problemsCount}</span>
                          <span className="pattern-depth-label">
                            {" "}
                            dependable
                          </span>
                        </p>
                        <div className="pattern-depth-line">
                          <div style={{ width: `${progressPct}%` }} />
                        </div>
                        <p>
                          ~{pattern.estimatedMinutes} min{" "}
                          <span className="text-line-strong mx-1">/</span>
                          {pattern.dueCount} due
                          {pattern.needsWorkCount > 0 && (
                            <span className="text-warning">
                              {" "}
                              · {pattern.needsWorkCount} weak
                            </span>
                          )}
                        </p>
                      </div>
                      <ArrowRight
                        size={15}
                        className="text-subtle"
                        aria-hidden="true"
                      />
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
  const settingsLanguage = (settings.language || "Python").toLowerCase();
  const initialTemplateLang: TemplateLanguage =
    settingsLanguage.includes("java") && !settingsLanguage.includes("script")
      ? "javascript"
      : settingsLanguage.includes("script")
        ? "javascript"
        : "python";
  const [language, setLanguage] =
    useState<TemplateLanguage>(initialTemplateLang);
  const [copied, setCopied] = useState(false);

  const pattern = patternData.find((p) => p.id === patternId);
  const lesson = pattern
    ? getPatternLessonMeta(pattern.id, pattern.isCore)
    : null;

  if (!isLoading && !pattern) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-foreground">
          Pattern not found
        </h1>
        <p className="text-muted">That roadmap link is invalid or outdated.</p>
        <Button variant="primary" onClick={() => navigate("/patterns")}>
          Back to roadmap
        </Button>
      </div>
    );
  }

  if (!pattern || !lesson) {
    return (
      <div className="h-64 rounded-2xl bg-surface/70 border border-line animate-pulse" />
    );
  }

  const template =
    language === "python" ? pattern.templateCodePython : pattern.templateCodeJs;
  const learnProblems = pattern.mappedProblems.slice(
    0,
    Math.min(5, pattern.mappedProblems.length),
  );
  const reinforceProblems = pattern.mappedProblems.slice(5, 12);
  const challengeProblems = pattern.mappedProblems.slice(12);

  const toggleSolved = (problemId: string, isSolved: boolean) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (isSolved) {
      void removeProblem(problemId);
    } else {
      void logProblem(problemId, 3, true, "Imported solve");
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

  const renderProblemGroup = (
    title: string,
    items: typeof pattern.mappedProblems,
  ) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-subtle">
            {title}
          </h3>
          <span className="text-xs text-subtle">{items.length}</span>
        </div>
        <div className="space-y-2">
          {items.map((prob) => {
            const prog = problemProgress[prob.id];
            const isSolved = !!prog;
            const tone = getProblemStatusTone({
              isSolved,
              isRetired: getLearningStatus(prog) === "maintenance",
              lastRating: prog?.history?.[prog.history.length - 1]?.rating,
            });
            return (
              <div
                key={prob.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-line"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    className="mt-1 p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    title={getProblemStatusLabel(tone)}
                    aria-label={`${getProblemStatusLabel(tone)} — toggle ${prob.title}`}
                    onClick={() => toggleSolved(prob.id, isSolved)}
                  >
                    <span
                      className={cn(
                        "block w-2.5 h-2.5 rounded-full",
                        getProblemStatusClass(tone),
                        tone === "unsolved"
                          ? "border border-line-strong bg-transparent"
                          : "bg-current",
                      )}
                    />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {prob.title}
                    </p>
                    <p className="text-xs text-subtle mt-1">
                      {LEARNING_STATUS_LABELS[getLearningStatus(prog)]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      getDifficultyColor(prob.difficulty),
                    )}
                  >
                    {prob.difficulty}
                  </span>
                  <a
                    href={prob.leetcodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="row-action"
                  >
                    <ExternalLink size={14} />
                    LeetCode
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        navigate("/login");
                        return;
                      }
                      startSession(
                        prob.id,
                        Boolean(problemProgress[prob.id]),
                        false,
                        Date.now(),
                        `/patterns/${pattern.id}`,
                      );
                      navigate(`/timer/${prob.id}`, {
                        state: { returnTo: `/patterns/${pattern.id}` },
                      });
                    }}
                    className="row-action"
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
    <div className="pattern-detail space-y-8 pb-12 animate-in">
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
          <Badge tone="success">
            {pattern.masteredCount}/{pattern.problemsCount} dependable
          </Badge>
          <Badge tone={pattern.dueCount ? "warning" : "neutral"}>
            {pattern.dueCount} due
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight leading-tight">
          {pattern.name}
        </h1>
        <p className="text-base text-muted max-w-3xl leading-relaxed">
          {pattern.description}
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] gap-8 items-start">
        <div className="space-y-8">
          <Card className="p-6 space-y-4">
            <h2 className="lesson-section-title">
              <span>01</span>Recognition
            </h2>
            <ul className="space-y-2 text-sm text-body leading-relaxed">
              {lesson.recognitionSignals.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 border-t border-line space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">
                When not to use it
              </h3>
              {lesson.antiPatterns.map((item) => (
                <p key={item} className="text-sm text-muted leading-relaxed">
                  {item}
                </p>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="lesson-section-title">
                <span>02</span>Logic template
              </h2>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["python", "Python"],
                    ["javascript", "JavaScript"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLanguage(value)}
                    aria-pressed={language === value}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      language === value
                        ? "bg-accent/15 text-accent border-accent/30"
                        : "bg-canvas text-muted border-line",
                    )}
                  >
                    {label}
                  </button>
                ))}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void copyTemplate()}
                >
                  <Copy size={14} />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
            <div className="bg-canvas border border-line/50 p-3 sm:p-4 rounded-xl overflow-x-auto">
              <CodeMirror
                value={template}
                extensions={[
                  language === "python"
                    ? python()
                    : javascript({ typescript: false }),
                  ...syntaxHighlightExtensions,
                ]}
                theme="none"
                editable={false}
                readOnly
                basicSetup={false}
                className="syntax-highlighted-code syntax-highlighted-code--md"
              />
            </div>
            <p className="text-xs text-subtle leading-relaxed">
              {lesson.complexity}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {lesson.invariants.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-line bg-canvas/50 p-3 text-sm text-body"
                >
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="lesson-section-title">
              <span>03</span>Worked example
            </h2>
            <div>
              <p className="text-base font-semibold text-foreground">
                {lesson.workedExample.title}
              </p>
              <p className="text-sm text-muted mt-1 font-mono">
                {lesson.workedExample.input}
              </p>
            </div>
            <ol className="space-y-2 list-decimal list-inside text-sm text-body leading-relaxed">
              {lesson.workedExample.walkthrough.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="text-sm text-accent font-medium">
              Result: {lesson.workedExample.result}
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Common pitfalls
            </h2>
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

        <aside className="space-y-6 xl:sticky xl:top-24">
          <Card accent className="p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Practice ladder
            </h2>
            <p className="text-xs text-muted leading-relaxed">
              Learn representative problems, check implementation after a delay,
              and try unseen variations. Successful recall checks stay separate
              from coding evidence. Dependable problems remain eligible for
              maintenance.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge>~{lesson.estimatedMinutes} min lesson</Badge>
              <Badge tone="warning">{pattern.dueCount} due</Badge>
              <Badge tone="danger">{pattern.needsWorkCount} weak</Badge>
            </div>
          </Card>

          {renderProblemGroup("Learn", learnProblems)}
          {renderProblemGroup("Reinforce", reinforceProblems)}
          {renderProblemGroup("Challenge", challengeProblems)}
        </aside>
      </div>
    </div>
  );
};
