import { preferenceStorage } from "../lib/safeStorage";
import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { allSyntaxCards, SyntaxCard } from "../data/syntaxCards";
import { SyntaxCardComponent } from "./SyntaxCardComponent";
import {
  SyntaxFlashcardSession,
  SessionOrderMode,
} from "./SyntaxFlashcardSession";
import {
  Search,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Zap,
  Layers,
  Shuffle,
} from "lucide-react";
import { useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "motion/react";
import { useSyntaxProgress } from "../hooks/useUserData";

const SESSION_ORDER_KEY = "syntax-session-order";

const readStoredOrderMode = (): SessionOrderMode => {
  if (typeof window === "undefined") return "random";
  return preferenceStorage.getItem(SESSION_ORDER_KEY) === "category"
    ? "category"
    : "random";
};

function matchesSyntaxSearch(card: SyntaxCard, query: string): boolean {
  if (!query) return true;
  const haystack = [
    card.description,
    card.syntax,
    card.category,
    card.useCase,
    card.explanation,
  ]
    .join("\n")
    .toLowerCase();
  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export const SyntaxReference: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { syntaxProgress } = useSyntaxProgress();
  const [viewMode, setViewMode] = useState<"due" | "browse">("due");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<
    "python" | "java" | "javascript" | "cpp"
  >("python");
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const [showOnlyWeak, setShowOnlyWeak] = useState(false);
  const [sessionCards, setSessionCards] = useState<SyntaxCard[] | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionOrderMode, setSessionOrderMode] =
    useState<SessionOrderMode>(readStoredOrderMode);

  useEffect(() => {
    preferenceStorage.setItem(SESSION_ORDER_KEY, sessionOrderMode);
  }, [sessionOrderMode]);

  // Search is for the full reference — jump out of Due-now when the user types.
  useEffect(() => {
    if (searchQuery.trim()) {
      setViewMode("browse");
    }
  }, [searchQuery]);

  // Collapse state for categories
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) newSet.delete(category);
      else newSet.add(category);
      return newSet;
    });
  };

  // Filter cards
  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allSyntaxCards.filter((card) => {
      if (card.language !== selectedLanguage) return false;
      if (!matchesSyntaxSearch(card, query)) return false;

      if (showOnlyWeak) {
        const prog = syntaxProgress[card.id];
        // Weak means practiced and rating < 3
        if (!prog || prog.confidenceRating >= 3) return false;
      }

      return true;
    });
  }, [searchQuery, selectedLanguage, showOnlyWeak, syntaxProgress]);

  // Group by category
  const categories = useMemo(() => {
    const map = new Map<string, typeof allSyntaxCards>();
    filteredCards.forEach((card) => {
      if (!map.has(card.category)) map.set(card.category, []);
      map.get(card.category)!.push(card);
    });
    return Array.from(map.entries());
  }, [filteredCards]);

  // Due cards: never practiced OR nextReviewAt <= now, for current language
  const dueCards = useMemo(() => {
    const now = new Date();
    const query = searchQuery.trim().toLowerCase();
    return allSyntaxCards.filter((card) => {
      if (card.language !== selectedLanguage) return false;
      if (!matchesSyntaxSearch(card, query)) return false;
      if (showOnlyWeak) {
        const prog = syntaxProgress[card.id];
        if (!prog || prog.confidenceRating >= 3) return false;
      }
      const prog = syntaxProgress[card.id];
      if (!prog) return true;
      return new Date(prog.nextReviewAt) <= now;
    });
  }, [searchQuery, selectedLanguage, showOnlyWeak, syntaxProgress]);

  const launchSession = (cards: SyntaxCard[], title: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (cards.length === 0) return;
    setSessionCards(cards);
    setSessionTitle(title);
  };

  // Overall stats for the selected language only
  const totalCardsForLang = allSyntaxCards.filter(
    (c) => c.language === selectedLanguage,
  ).length;
  const langCardIds = useMemo(
    () =>
      new Set(
        allSyntaxCards
          .filter((c) => c.language === selectedLanguage)
          .map((c) => c.id),
      ),
    [selectedLanguage],
  );
  const practicedCards = Object.keys(syntaxProgress).filter((id) =>
    langCardIds.has(id),
  ).length;
  const confidentCards = Object.entries(syntaxProgress).filter(
    ([id, p]) => langCardIds.has(id) && p.confidenceRating === 3,
  ).length;

  return (
    <>
      {sessionCards &&
        createPortal(
          <SyntaxFlashcardSession
            cards={sessionCards}
            title={sessionTitle}
            orderMode={sessionOrderMode}
            onClose={() => setSessionCards(null)}
          />,
          document.body,
        )}
      <div className="syntax-reference space-y-7 animate-in w-full pb-12">
        <header className="syntax-heading flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-[28px] sm:text-[32px] font-medium tracking-[-0.045em] text-foreground">
                Syntax Reference
              </h1>
              <p className="text-sm text-muted mt-2">
                Recall the syntax you use, then compare it with the reference.
              </p>
            </div>

            <div className="syntax-launchers flex items-center gap-3 flex-wrap w-full md:w-auto">
              <div
                className="syntax-mode index-tabs flex items-center gap-4 mr-auto md:mr-0"
                role="tablist"
                aria-label="Syntax study mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "due"}
                  onClick={() => setViewMode("due")}
                  className={clsx(
                    "index-tab py-2 text-xs min-h-10 transition-colors",
                    viewMode === "due"
                      ? "is-selected text-foreground"
                      : "text-subtle hover:text-body",
                  )}
                >
                  Due now ({dueCards.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "browse"}
                  onClick={() => setViewMode("browse")}
                  className={clsx(
                    "index-tab py-2 text-xs min-h-10 transition-colors",
                    viewMode === "browse"
                      ? "is-selected text-foreground"
                      : "text-subtle hover:text-body",
                  )}
                >
                  Browse all
                </button>
              </div>
              {/* Practice session launchers — due first */}
              <button
                onClick={() =>
                  launchSession(dueCards, `Due Now · ${selectedLanguage}`)
                }
                disabled={dueCards.length === 0}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2.5 rounded-md border text-sm font-semibold transition-colors min-h-11",
                  dueCards.length > 0
                    ? "bg-accent border-accent text-on-accent hover:bg-accent-strong"
                    : "bg-muted-surface/50 border-line-strong/50 text-subtle cursor-not-allowed",
                )}
              >
                <Zap size={15} />
                Practice Due
                <span
                  className={clsx(
                    "px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums",
                    dueCards.length > 0
                      ? "text-on-accent"
                      : "bg-hover-surface text-subtle",
                  )}
                >
                  {dueCards.length}
                </span>
              </button>

              <button
                onClick={() =>
                  launchSession(
                    allSyntaxCards.filter(
                      (c) => c.language === selectedLanguage,
                    ),
                    `All ${selectedLanguage} cards`,
                  )
                }
                className="quiet-action syntax-practice-all"
              >
                <Layers size={15} />
                Practice All
              </button>

              {/* Stats panel */}
              <p className="text-xs text-muted w-full md:w-auto py-1">
                <span className="font-medium text-body">
                  {practicedCards} / {totalCardsForLang}
                </span>{" "}
                practiced
                {" · "}
                <span className="font-medium text-body">
                  {confidentCards}
                </span>{" "}
                confident
              </p>
            </div>
          </div>

          {/* Filters Row */}
          <div className="syntax-filters flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                size={18}
              />
              <input
                type="text"
                placeholder="Search syntax, descriptions, or use cases..."
                aria-label="Search syntax"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-line rounded-md pl-10 pr-4 py-3 text-foreground placeholder:text-subtle focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>

            <button
              type="button"
              className="syntax-options-toggle quiet-action"
              onClick={() => setOptionsExpanded(!optionsExpanded)}
              aria-expanded={optionsExpanded}
              aria-controls="syntax-options"
            >
              {selectedLanguage === "python" ? "Python" : "C++"} · Options{" "}
              <span aria-hidden="true">{optionsExpanded ? "−" : "+"}</span>
            </button>
            <div
              id="syntax-options"
              className={clsx(
                "syntax-options flex flex-wrap gap-2",
                optionsExpanded && "options-expanded",
              )}
            >
              <select
                aria-label="Syntax language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="bg-surface border border-line rounded-md px-3 py-3 text-foreground focus:outline-none focus:border-accent/50 transition-colors w-[132px]"
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java" disabled>
                  Java (Coming Soon)
                </option>
                <option value="javascript" disabled>
                  JavaScript (Coming Soon)
                </option>
              </select>

              <button
                onClick={() => setShowOnlyWeak(!showOnlyWeak)}
                aria-pressed={showOnlyWeak}
                className={clsx(
                  "px-4 py-3 rounded-md border flex items-center gap-2 transition-colors font-medium text-sm whitespace-nowrap",
                  showOnlyWeak
                    ? "bg-warning/10 border-warning/30 text-warning hover:bg-warning/20"
                    : "bg-surface border-line text-body hover:bg-muted-surface",
                )}
              >
                <AlertCircle size={16} />
                Weak Areas
              </button>

              <div className="flex rounded-md border border-line bg-surface p-1">
                <button
                  type="button"
                  onClick={() => setSessionOrderMode("random")}
                  aria-pressed={sessionOrderMode === "random"}
                  className={clsx(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap",
                    sessionOrderMode === "random"
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-body",
                  )}
                >
                  <Shuffle size={14} />
                  Random
                </button>
                <button
                  type="button"
                  onClick={() => setSessionOrderMode("category")}
                  aria-pressed={sessionOrderMode === "category"}
                  className={clsx(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap",
                    sessionOrderMode === "category"
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-body",
                  )}
                >
                  <Layers size={14} />
                  By category
                </button>
              </div>
            </div>
          </div>
        </header>
        <div
          className={clsx(
            "syntax-book",
            viewMode === "due" && "syntax-due-book",
          )}
        >
          {/* Category Jump Anchor Links */}
          {viewMode === "browse" && (
            <div className="syntax-index">
              {categories.map(([category, cards], index) => (
                <a
                  key={category}
                  href={`#cat-${category.replace(/[^a-zA-Z]/g, "")}`}
                  className="syntax-index-entry"
                >
                  <span className="font-mono text-[10px] text-subtle">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{category}</span>
                  <span className="font-mono text-[10px] text-subtle">
                    {cards.length}
                  </span>
                </a>
              ))}
            </div>
          )}
          <div className="space-y-6 relative">
            {viewMode === "due" ? (
              dueCards.length === 0 ? (
                <div className="empty-register reference-empty">
                  <h3 className="text-xl font-medium text-foreground">
                    Nothing due right now
                  </h3>
                  <p className="text-muted text-sm mt-2 max-w-md">
                    Catch up later or switch to Browse all to study reference
                    cards.
                  </p>
                  <button
                    type="button"
                    onClick={() => setViewMode("browse")}
                    className="quiet-action mt-3"
                  >
                    Browse all
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-foreground">
                      Due now · {selectedLanguage}
                    </h2>
                    <button
                      type="button"
                      onClick={() =>
                        launchSession(dueCards, `Due Now · ${selectedLanguage}`)
                      }
                      className="quiet-action"
                    >
                      Start due session
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {dueCards.map((card) => (
                      <SyntaxCardComponent key={card.id} card={card} />
                    ))}
                  </div>
                </div>
              )
            ) : categories.length === 0 ? (
              <div className="empty-register reference-empty">
                <h3 className="text-xl font-medium text-foreground">
                  No syntax cards found
                </h3>
                <p className="text-muted text-sm mt-2">
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              categories.map(([category, cards]) => {
                const isCollapsed = collapsedCategories.has(category);
                const anchorId = `cat-${category.replace(/[^a-zA-Z]/g, "")}`;

                return (
                  <section
                    key={category}
                    id={anchorId}
                    className="scroll-mt-24"
                  >
                    <div className="syntax-category-heading flex items-center gap-3 py-3">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="flex items-center gap-3 group flex-1 min-w-0"
                      >
                        <div className="text-muted group-hover:text-accent transition-colors flex-shrink-0">
                          {isCollapsed ? (
                            <ChevronRight size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </div>
                        <h2 className="text-sm font-semibold text-foreground">
                          {category}{" "}
                          <span className="text-sm font-normal text-subtle ml-2">
                            ({cards.length})
                          </span>
                        </h2>
                        <div className="h-px bg-muted-surface/80 flex-1 ml-2 group-hover:bg-accent/20 transition-colors" />
                      </button>
                      <button
                        onClick={() => launchSession(cards, category)}
                        className="quiet-action flex-shrink-0"
                      >
                        <Zap size={12} />
                        Practice
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="syntax-grid pb-4">
                            {cards.map((card) => (
                              <SyntaxCardComponent key={card.id} card={card} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};
