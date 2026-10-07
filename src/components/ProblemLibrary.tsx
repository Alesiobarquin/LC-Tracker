import {
  getLearningStatus,
  getStudyState,
  LEARNING_STATUS_LABELS,
} from "../utils/study";
import { preferenceStorage } from "../lib/safeStorage";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  problems,
  allProblems,
  problemMap,
  isProblemPremium,
  Category,
  Difficulty,
  ensureExtendedCatalogLoaded,
} from "../data/problems";
import {
  Search,
  Play,
  CircleCheck,
  Filter,
  Lock,
  ExternalLink,
  Copy,
  X,
} from "lucide-react";
import { useUser } from "@clerk/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clsx } from "clsx";
import { useProblemProgress, useUserSettings } from "../hooks/useUserData";
import { ProblemLibrarySkeleton } from "./loadingSkeletons";
import { getDifficultyColor } from "../utils/uiHelpers";
import { isDueToday } from "../utils/dateUtils";
import type { ProblemProgress } from "../types";
import { Modal, PageHeader } from "./ui";
import { hasProblemReference } from "../data/problemReferences";

const VIRTUALIZE_THRESHOLD = 200;
/** Initial rows to render per tab/filter (large lists load more on demand). */
const PROBLEM_LIST_INITIAL_CHUNK = 100;
const PROBLEM_LIST_LOAD_MORE_CHUNK = 200;
const RECENT_SOLVE_MS = 14 * 24 * 60 * 60 * 1000;

type LibraryTab =
  | "Pareto Set"
  | "NeetCode 75"
  | "NeetCode 150"
  | "NeetCode 250"
  | "Full Catalog"
  | "Solved Problems";

type SavedView = "all" | "due" | "weak" | "essentials" | "recent";
type ProgressStatusFilter = "all" | "unsolved" | "rotation" | "retired";
type PremiumFilter = "all" | "free" | "premium";
type DifficultyFilter = "All" | Difficulty;
type SortKey = "title" | "category" | "difficulty" | "status";

const LIBRARY_TABS: LibraryTab[] = [
  "Pareto Set",
  "NeetCode 75",
  "NeetCode 150",
  "NeetCode 250",
  "Full Catalog",
  "Solved Problems",
];

const TAB_TO_PARAM: Record<LibraryTab, string> = {
  "Pareto Set": "pareto",
  "NeetCode 75": "neetcode-75",
  "NeetCode 150": "neetcode-150",
  "NeetCode 250": "neetcode-250",
  "Full Catalog": "catalog",
  "Solved Problems": "solved",
};

const PARAM_TO_TAB: Record<string, LibraryTab> = Object.fromEntries(
  Object.entries(TAB_TO_PARAM).map(([tab, param]) => [
    param,
    tab as LibraryTab,
  ]),
) as Record<string, LibraryTab>;

const SAVED_VIEWS: { id: SavedView; label: string }[] = [
  { id: "all", label: "All" },
  { id: "due", label: "Due" },
  { id: "weak", label: "Weak" },
  { id: "essentials", label: "Unsolved essentials" },
  { id: "recent", label: "Recent" },
];

const parseLibraryTab = (raw: string | null): LibraryTab => {
  if (raw && PARAM_TO_TAB[raw]) return PARAM_TO_TAB[raw];
  if (raw && (LIBRARY_TABS as string[]).includes(raw)) return raw as LibraryTab;
  const saved = preferenceStorage.getItem("lc-tracker-active-library-tab");
  if (saved && (LIBRARY_TABS as string[]).includes(saved))
    return saved as LibraryTab;
  return "NeetCode 75";
};

const parseSavedView = (raw: string | null): SavedView =>
  raw === "due" || raw === "weak" || raw === "essentials" || raw === "recent"
    ? raw
    : "all";

const parseDifficulty = (raw: string | null): DifficultyFilter =>
  raw === "Easy" || raw === "Medium" || raw === "Hard" ? raw : "All";

const parseStatus = (raw: string | null): ProgressStatusFilter =>
  raw === "unsolved" || raw === "rotation" || raw === "retired" ? raw : "all";

const parsePremium = (raw: string | null): PremiumFilter =>
  raw === "free" || raw === "premium" ? raw : "all";

const isRecentSolve = (prog: ProblemProgress): boolean => {
  const cutoff = Date.now() - RECENT_SOLVE_MS;
  return [prog.firstSolvedAt, prog.lastReviewedAt].some((d) => {
    const t = new Date(d).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
};

const ariaSortValue = (
  sortConfig: { key: SortKey; direction: "asc" | "desc" } | null,
  key: SortKey,
): "none" | "ascending" | "descending" => {
  if (!sortConfig || sortConfig.key !== key) return "none";
  return sortConfig.direction === "asc" ? "ascending" : "descending";
};

export const ProblemLibrary: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { progress, logProblem, removeProblem, isLoading } =
    useProblemProgress();
  const { settings } = useUserSettings();
  const [catalogReady, setCatalogReady] = useState(
    allProblems.length > problems.length,
  );

  const search = searchParams.get("q") ?? "";
  const activeTab = parseLibraryTab(searchParams.get("tab"));
  const activeCategory =
    (searchParams.get("cat") as Category | "All" | null) || "All";
  const savedView = parseSavedView(searchParams.get("view"));
  const difficultyFilter = parseDifficulty(searchParams.get("diff"));
  const statusFilter = parseStatus(searchParams.get("status"));
  const premiumFilter = parsePremium(searchParams.get("premium"));

  useEffect(() => {
    let cancelled = false;
    void ensureExtendedCatalogLoaded().then(() => {
      if (!cancelled) setCatalogReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    preferenceStorage.setItem("lc-tracker-active-library-tab", activeTab);
  }, [activeTab]);

  const updateFilterParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === "") next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setSearch = (value: string) => updateFilterParams({ q: value || null });
  const setActiveTab = (tab: LibraryTab) => {
    updateFilterParams({
      tab: TAB_TO_PARAM[tab],
      cat: null,
    });
  };
  const setActiveCategory = (cat: Category | "All") =>
    updateFilterParams({ cat: cat === "All" ? null : cat });
  const setSavedView = (view: SavedView) =>
    updateFilterParams({ view: view === "all" ? null : view });
  const setDifficultyFilter = (diff: DifficultyFilter) =>
    updateFilterParams({ diff: diff === "All" ? null : diff });
  const setStatusFilter = (status: ProgressStatusFilter) =>
    updateFilterParams({ status: status === "all" ? null : status });
  const setPremiumFilter = (premium: PremiumFilter) =>
    updateFilterParams({ premium: premium === "all" ? null : premium });

  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [pendingImportId, setPendingImportId] = useState<string | null>(null);
  const closeImportDialog = useCallback(() => setPendingImportId(null), []);
  const [pendingPremiumStartId, setPendingPremiumStartId] = useState<
    string | null
  >(null);

  useEffect(() => {
    preferenceStorage.setItem("lc-tracker-active-library-tab", activeTab);
  }, [activeTab]);

  const [visibleLimit, setVisibleLimit] = useState(PROBLEM_LIST_INITIAL_CHUNK);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  } | null>(null);

  const tabProblems = useMemo(() => {
    if (activeTab === "Pareto Set") return problems.filter((p) => p.isPareto);
    if (activeTab === "NeetCode 75")
      return problems.filter((p) => p.isNeetCode75);
    if (activeTab === "NeetCode 150")
      return problems.filter((p) => p.isNeetCode150);
    if (activeTab === "NeetCode 250")
      return problems.filter((p) => p.isNeetCode250);
    if (activeTab === "Full Catalog") return allProblems;
    if (activeTab === "Solved Problems")
      return allProblems.filter((p) => progress[p.id]);
    return [];
  }, [activeTab, progress, catalogReady]);

  useEffect(() => {
    setVisibleLimit(PROBLEM_LIST_INITIAL_CHUNK);
  }, [
    activeTab,
    search,
    activeCategory,
    savedView,
    difficultyFilter,
    statusFilter,
    premiumFilter,
    sortConfig,
  ]);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(tabProblems.map((p) => p.category)))];
  }, [tabProblems]);

  const filteredProblems = useMemo(() => {
    const searchLower = search.toLowerCase();

    let result = tabProblems.filter((p) => {
      const prog = progress[p.id];
      const matchesSearch =
        !searchLower || p.title.toLowerCase().includes(searchLower);
      const matchesCategory =
        activeCategory === "All" || p.category === activeCategory;
      const matchesDifficulty =
        difficultyFilter === "All" || p.difficulty === difficultyFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "unsolved" && !prog) ||
        (statusFilter === "rotation" &&
          !!prog &&
          getLearningStatus(prog) !== "maintenance") ||
        (statusFilter === "retired" &&
          getLearningStatus(prog) === "maintenance");

      const isPremium = isProblemPremium(p);
      const matchesPremium =
        premiumFilter === "all" ||
        (premiumFilter === "free" && !isPremium) ||
        (premiumFilter === "premium" && isPremium);

      let matchesView = true;
      if (savedView === "due") {
        matchesView =
          !!prog &&
          (isDueToday(getStudyState(prog).nextRecallAt) ||
            isDueToday(getStudyState(prog).nextCodingAt));
      } else if (savedView === "weak") {
        const lastRating = prog?.history[prog.history.length - 1]?.rating;
        matchesView =
          !!prog &&
          (getLearningStatus(prog) === "relearning" ||
            lastRating === 1 ||
            lastRating === 2);
      } else if (savedView === "essentials") {
        matchesView = !!p.isNeetCode75 && !prog;
      } else if (savedView === "recent") {
        matchesView = !!prog && isRecentSolve(prog);
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDifficulty &&
        matchesStatus &&
        matchesPremium &&
        matchesView
      );
    });

    if (sortConfig) {
      const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };

      result = [...result].sort((a, b) => {
        let aValue: string | number = a[
          sortConfig.key as "title" | "category" | "difficulty"
        ] as string;
        let bValue: string | number = b[
          sortConfig.key as "title" | "category" | "difficulty"
        ] as string;

        if (sortConfig.key === "status") {
          const aProg = progress[a.id];
          const bProg = progress[b.id];
          aValue = aProg
            ? getLearningStatus(aProg) === "maintenance"
              ? 2
              : 1
            : 0;
          bValue = bProg
            ? getLearningStatus(bProg) === "maintenance"
              ? 2
              : 1
            : 0;
        } else if (sortConfig.key === "difficulty") {
          aValue = difficultyOrder[a.difficulty];
          bValue = difficultyOrder[b.difficulty];
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [
    tabProblems,
    search,
    activeCategory,
    savedView,
    difficultyFilter,
    statusFilter,
    premiumFilter,
    sortConfig,
    progress,
  ]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (search) {
      chips.push({
        key: "q",
        label: `Search: ${search}`,
        clear: () => setSearch(""),
      });
    }
    if (activeCategory !== "All") {
      chips.push({
        key: "cat",
        label: `Category: ${activeCategory}`,
        clear: () => setActiveCategory("All"),
      });
    }
    if (savedView !== "all") {
      const viewLabel =
        SAVED_VIEWS.find((v) => v.id === savedView)?.label ?? savedView;
      chips.push({
        key: "view",
        label: `View: ${viewLabel}`,
        clear: () => setSavedView("all"),
      });
    }
    if (difficultyFilter !== "All") {
      chips.push({
        key: "diff",
        label: `Difficulty: ${difficultyFilter}`,
        clear: () => setDifficultyFilter("All"),
      });
    }
    if (statusFilter !== "all") {
      const statusLabel =
        statusFilter === "unsolved"
          ? "Unsolved"
          : statusFilter === "rotation"
            ? "In rotation"
            : "Maintenance";
      chips.push({
        key: "status",
        label: `Status: ${statusLabel}`,
        clear: () => setStatusFilter("all"),
      });
    }
    if (premiumFilter !== "all") {
      chips.push({
        key: "premium",
        label: `Premium: ${premiumFilter === "free" ? "Free" : "Premium"}`,
        clear: () => setPremiumFilter("all"),
      });
    }
    return chips;
  }, [
    search,
    activeCategory,
    savedView,
    difficultyFilter,
    statusFilter,
    premiumFilter,
  ]);

  const displayedProblems = useMemo(
    () => filteredProblems.slice(0, visibleLimit),
    [filteredProblems, visibleLimit],
  );
  const hiddenCount = Math.max(
    0,
    filteredProblems.length - displayedProblems.length,
  );
  const pendingPremiumProblem = pendingPremiumStartId
    ? (problemMap[pendingPremiumStartId] ?? null)
    : null;

  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const toggleSolved = (problemId: string, isSolved: boolean) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (isSolved) {
      void removeProblem(problemId);
      return;
    }
    setPendingImportId(problemId);
  };

  const confirmImportSolve = (rating: 3 | 4) => {
    if (!pendingImportId) return;
    void logProblem(
      pendingImportId,
      rating,
      true,
      rating === 4 ? "Imported strong solve" : "Imported solve",
    );
    setPendingImportId(null);
  };

  const handleStartSession = (problemId: string, isPremium: boolean) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (isPremium && !settings.includePremiumInAssignments) {
      setPendingPremiumStartId(problemId);
      return;
    }
    setActiveSession(problemId);
  };

  const [isCopied, setIsCopied] = useState(false);

  const confirmPremiumStart = () => {
    if (!pendingPremiumStartId) return;
    setActiveSession(pendingPremiumStartId);
    setPendingPremiumStartId(null);
  };

  const copySolvedProblems = () => {
    const solvedList = allProblems
      .filter((p) => progress[p.id])
      .map((p) => p.title)
      .join("\n");
    navigator.clipboard.writeText(solvedList).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Conditionally navigate to timer if a session starts
  useEffect(() => {
    if (activeSession) {
      navigate(`/timer/${activeSession}`, { state: { returnTo: "/library" } });
      setActiveSession(null);
    }
  }, [activeSession, navigate]);

  const solvedInTab = tabProblems.filter((p) => progress[p.id]).length;
  const totalInTab = tabProblems.length;

  const virtualRowStyle: React.CSSProperties | undefined =
    displayedProblems.length >= VIRTUALIZE_THRESHOLD
      ? { contentVisibility: "auto", containIntrinsicSize: "auto 52px" }
      : undefined;

  if (isLoading) {
    return <ProblemLibrarySkeleton />;
  }

  return (
    <div className="library-page space-y-5 animate-in">
      <PageHeader
        title="Problem Library"
        description="Find a problem, revisit your notes, or start an independent attempt."
        actions={
          <div className="text-right">
            <p className="library-count register-value text-foreground">
              {solvedInTab}
              <span className="text-xs text-subtle"> / {totalInTab}</span>
            </p>
            <p className="hidden sm:block text-[10px] text-subtle mt-1">
              previously solved in this list
            </p>
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-line">
          <div className="filter-tabs border-b-0 min-w-0">
            {LIBRARY_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
                className="filter-tab"
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab === "Solved Problems" && (
            <button
              type="button"
              onClick={copySolvedProblems}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted-surface hover:bg-hover-surface text-body transition-colors border border-line-strong"
            >
              {isCopied ? (
                <CircleCheck size={14} className="text-accent" />
              ) : (
                <Copy size={14} />
              )}
              {isCopied ? "Copied!" : "Copy List"}
            </button>
          )}
        </div>
      </div>

      <div className="library-toolbar space-y-3">
        <div
          className="library-views flex flex-wrap gap-3"
          role="group"
          aria-label="Saved views"
        >
          {SAVED_VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setSavedView(view.id)}
              aria-pressed={savedView === view.id}
              className={clsx(
                "index-tab py-1.5 text-xs transition-colors",
                savedView === view.id
                  ? "is-selected text-foreground"
                  : "text-muted hover:text-body hover:bg-muted-surface",
              )}
            >
              {view.label}
            </button>
          ))}
        </div>

        <div className="library-search-row flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1 min-w-[12rem]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
              size={16}
            />
            <input
              type="text"
              placeholder="Search problems..."
              aria-label="Search problems"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="library-search w-full bg-surface border border-line rounded-md pl-9 pr-9 py-2.5 text-foreground placeholder:text-subtle focus:outline-none focus:border-accent transition-colors"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            aria-expanded={filtersExpanded}
            aria-controls="library-filters"
            className="mobile-filter-toggle quiet-action"
          >
            <Filter size={13} />
            Filters{" "}
            <span aria-hidden="true">{filtersExpanded ? "−" : "+"}</span>
          </button>
          <div
            id="library-filters"
            className={clsx(
              "library-filters flex flex-wrap gap-2",
              filtersExpanded && "filters-expanded",
            )}
          >
            <div className="relative">
              <select
                value={activeCategory}
                onChange={(e) =>
                  setActiveCategory(e.target.value as Category | "All")
                }
                aria-label="Filter by category"
                className="appearance-none bg-surface border border-line rounded-md pl-3 pr-8 py-2.5 text-foreground focus:outline-none focus:border-accent/50 transition-colors"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All categories" : c}
                  </option>
                ))}
              </select>
              <Filter
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
                size={16}
              />
            </div>
            <select
              value={difficultyFilter}
              onChange={(e) =>
                setDifficultyFilter(e.target.value as DifficultyFilter)
              }
              aria-label="Filter by difficulty"
              className="appearance-none bg-surface border border-line rounded-md px-3 py-2.5 text-foreground focus:outline-none focus:border-accent/50 transition-colors"
            >
              <option value="All">All difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ProgressStatusFilter)
              }
              aria-label="Filter by progress status"
              className="appearance-none bg-surface border border-line rounded-md px-3 py-2.5 text-foreground focus:outline-none focus:border-accent/50 transition-colors"
            >
              <option value="all">All statuses</option>
              <option value="unsolved">Unsolved</option>
              <option value="rotation">In rotation</option>
              <option value="retired">Maintenance</option>
            </select>
            <select
              value={premiumFilter}
              onChange={(e) =>
                setPremiumFilter(e.target.value as PremiumFilter)
              }
              aria-label="Filter by premium"
              className="appearance-none bg-surface border border-line rounded-md px-3 py-2.5 text-foreground focus:outline-none focus:border-accent/50 transition-colors"
            >
              <option value="all">All access</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>

        {activeFilterChips.some((chip) => chip.key !== "q") && (
          <div
            className="flex flex-wrap items-center gap-2"
            aria-label="Active filters"
          >
            {activeFilterChips
              .filter((chip) => chip.key !== "q")
              .map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex items-center gap-1.5 py-1 text-xs text-muted hover:text-accent transition-colors"
                >
                  {chip.label}
                  <X size={12} aria-hidden />
                  <span className="sr-only">Clear filter</span>
                </button>
              ))}
          </div>
        )}
      </div>

      <details className="library-key text-[10px] text-muted">
        <summary>Reading the record</summary>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3">
          <span className="inline-flex items-center gap-1.5">
            <CircleCheck size={13} className="text-success" />
            Maintenance
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CircleCheck size={13} className="text-warning" />
            Solved (active queue)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CircleCheck size={13} className="text-danger" />
            Needs work (last rating 1)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-[13px] h-[13px] rounded-full border-2 border-line-strong" />
            Unsolved
          </span>
        </div>
      </details>

      <Modal
        isOpen={pendingImportId !== null}
        onClose={closeImportDialog}
        title="Mark as previously solved?"
        description={
          pendingImportId ? problemMap[pendingImportId]?.title : undefined
        }
      >
        <div className="space-y-5">
          <p className="text-sm text-body">
            Record your prior solve and an honest self-rating. A recall check
            and independent coding attempts will assess current ability.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeImportDialog}
              className="px-3 py-2 rounded-sm text-xs font-medium bg-muted-surface hover:bg-hover-surface text-body border border-line-strong focus-visible:ring-2 focus-visible:ring-accent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => confirmImportSolve(3)}
              className="px-3 py-2 rounded-sm text-xs font-semibold bg-muted-surface hover:bg-hover-surface text-body border border-line-strong focus-visible:ring-2 focus-visible:ring-accent"
            >
              Acceptable (3)
            </button>
            <button
              type="button"
              onClick={() => confirmImportSolve(4)}
              className="px-3 py-2 rounded-sm text-xs font-semibold bg-accent hover:bg-accent-strong text-on-accent focus-visible:ring-2 focus-visible:ring-accent"
            >
              Strong (4)
            </button>
          </div>
        </div>
      </Modal>

      {pendingPremiumProblem && (
        <div className="premium-card p-4 border-warning/30 bg-warning/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-warning font-medium flex items-center gap-2">
              <Lock size={14} /> LeetCode Premium problem selected
            </p>
            <p className="text-xs text-body mt-1">
              {pendingPremiumProblem.title} requires LeetCode Premium. This
              label is about LeetCode access, not any LC-Tracker plan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPendingPremiumStartId(null)}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-muted-surface hover:bg-hover-surface text-body border border-line-strong"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmPremiumStart}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-accent hover:bg-accent-strong text-on-accent"
            >
              Start anyway
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {filteredProblems.length === 0 ? (
          <div className="empty-register text-muted text-sm">
            No problems match these filters. Clear a filter or try another
            search.
          </div>
        ) : (
          Object.entries(
            displayedProblems.reduce(
              (acc, prob) => {
                if (!acc[prob.category]) acc[prob.category] = [];
                acc[prob.category].push(prob);
                return acc;
              },
              {} as Record<string, typeof displayedProblems>,
            ),
          ).map(([category, problems]) => (
            <div key={category} className="space-y-0">
              <h2 className="library-group-heading">{category}</h2>
              <div className="library-table">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-canvas/50 text-muted border-b border-line">
                      <tr>
                        <th
                          className="px-6 py-4 font-medium"
                          aria-sort={ariaSortValue(sortConfig, "status")}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort("status")}
                            className="inline-flex items-center gap-1 hover:text-body select-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
                          >
                            Status
                            {sortConfig?.key === "status" && (
                              <span className="text-accent" aria-hidden>
                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                        </th>
                        <th
                          className="px-6 py-4 font-medium"
                          aria-sort={ariaSortValue(sortConfig, "title")}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort("title")}
                            className="inline-flex items-center gap-1 hover:text-body select-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
                          >
                            Problem
                            {sortConfig?.key === "title" && (
                              <span className="text-accent" aria-hidden>
                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                        </th>
                        <th
                          className="px-6 py-4 font-medium"
                          aria-sort={ariaSortValue(sortConfig, "difficulty")}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort("difficulty")}
                            className="inline-flex items-center gap-1 hover:text-body select-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
                          >
                            Difficulty
                            {sortConfig?.key === "difficulty" && (
                              <span className="text-accent" aria-hidden>
                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-4 font-medium text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {problems.map((prob) => {
                        const prog = progress[prob.id];
                        const isSolved = !!prog;
                        const isRetired =
                          getLearningStatus(prog) === "maintenance";
                        const needsWork =
                          getLearningStatus(prog) === "relearning";
                        const isPremium = isProblemPremium(prob);
                        const statusTitle = isRetired
                          ? "Maintenance — mark as unsolved"
                          : needsWork
                            ? "Solved but struggling (last rating 1) — mark as unsolved"
                            : isSolved
                              ? `${LEARNING_STATUS_LABELS[getLearningStatus(prog)]} — mark as unsolved`
                              : "Mark as solved";

                        return (
                          <tr
                            key={prob.id}
                            className="hover:bg-muted-surface/50 transition-colors group"
                            style={virtualRowStyle}
                          >
                            <td className="px-6 py-4">
                              <button
                                onClick={() => toggleSolved(prob.id, isSolved)}
                                className="min-h-8 min-w-8 inline-flex items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:ring-accent"
                                title={statusTitle}
                                aria-label={statusTitle}
                              >
                                {isRetired ? (
                                  <CircleCheck
                                    size={17}
                                    className="text-success"
                                  />
                                ) : needsWork ? (
                                  <CircleCheck
                                    size={17}
                                    className="text-danger"
                                  />
                                ) : isSolved ? (
                                  <CircleCheck
                                    size={17}
                                    className="text-warning"
                                  />
                                ) : (
                                  <div className="w-[17px] h-[17px] rounded-full border border-line-strong hover:border-accent/50 transition-colors" />
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-4 font-medium text-foreground">
                              <span className="flex items-center gap-2">
                                {prob.title}
                                {prog && (
                                  <span
                                    className="problem-record"
                                    title={`${prog.history.length} history records · includes historical ratings`}
                                  >
                                    <span
                                      className="attempt-marks"
                                      aria-hidden="true"
                                    >
                                      {prog.history.slice(-6).map((_, i) => (
                                        <i key={i} />
                                      ))}
                                    </span>
                                    <span className="font-mono text-[9px] text-subtle">
                                      {prog.history.length} recorded
                                    </span>
                                  </span>
                                )}
                                <span className="sm:hidden basis-full font-mono text-[10px] text-subtle mt-1">
                                  {prob.difficulty}
                                </span>
                                {isPremium && (
                                  <span
                                    title="Requires LeetCode Premium"
                                    className="catalog-note inline-flex items-center gap-1"
                                  >
                                    <Lock size={9} /> LC Premium
                                  </span>
                                )}
                                {activeTab === "NeetCode 150" &&
                                  prob.isNeetCode75 && (
                                    <span className="catalog-note">
                                      NeetCode 75
                                    </span>
                                  )}
                                {activeTab === "NeetCode 250" &&
                                  prob.isNeetCode150 &&
                                  !prob.isNeetCode75 && (
                                    <span className="catalog-note">NC150+</span>
                                  )}
                                {activeTab === "Full Catalog" &&
                                  prob.isExtendedCatalog && (
                                    <span className="catalog-note">
                                      Catalog
                                    </span>
                                  )}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={clsx(
                                  getDifficultyColor(prob.difficulty),
                                )}
                              >
                                {prob.difficulty}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center justify-end gap-2">
                                {hasProblemReference(prob.id) && <button type="button" className="row-action"
                                  aria-label={`Explanation for ${prob.title}`} onClick={() => navigate(`/library/${prob.id}/explanation`)}>
                                  Explanation
                                </button>}
                                <a
                                  href={prob.leetcodeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="row-action"
                                  title="Open on LeetCode to view your submission status"
                                  aria-label={`Open ${prob.title} on LeetCode`}
                                >
                                  <ExternalLink
                                    size={14}
                                    className="shrink-0"
                                  />
                                  <span className="hidden sm:inline">
                                    LeetCode
                                  </span>
                                </a>
                                {isSolved && user && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(`/recall/${prob.id}`)
                                    }
                                    className="row-action"
                                    aria-label={`Recall ${prob.title}`}
                                  >
                                    Recall
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStartSession(prob.id, isPremium)
                                  }
                                  className="row-action focus-visible:ring-2 focus-visible:ring-accent"
                                  title={
                                    isPremium &&
                                    !settings.includePremiumInAssignments
                                      ? "LeetCode Premium problem: confirm before starting"
                                      : "Start practice timer"
                                  }
                                  aria-label={
                                    isPremium &&
                                    !settings.includePremiumInAssignments
                                      ? "LeetCode Premium problem: confirm before starting"
                                      : `Start practice timer for ${prob.title}`
                                  }
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
            <p className="text-xs text-subtle">
              Showing {displayedProblems.length} of {filteredProblems.length}{" "}
              problems
            </p>
            <button
              type="button"
              onClick={() =>
                setVisibleLimit((prev) =>
                  Math.min(
                    prev + PROBLEM_LIST_LOAD_MORE_CHUNK,
                    filteredProblems.length,
                  ),
                )
              }
              className="px-5 py-2.5 rounded-xl bg-muted-surface hover:bg-hover-surface text-foreground text-sm font-medium border border-line-strong transition-colors"
            >
              Show more ({hiddenCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
