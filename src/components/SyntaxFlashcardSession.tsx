import { preferenceStorage } from "../lib/safeStorage";
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { SyntaxCard } from "../data/syntaxCards";
import {
  X,
  Clock,
  Keyboard,
  RotateCcw,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  BookOpen,
  Shuffle,
  Layers,
} from "lucide-react";
import { clsx } from "clsx";
import { useSyntaxProgress } from "../hooks/useUserData";
import { motion } from "motion/react";
import { SyntaxHighlightedCode } from "./SyntaxHighlightedCode";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { TraceIndex } from "./ui/StudyTrace";
import { Modal } from "./ui/Modal";

export type SessionOrderMode = "random" | "category";

interface SyntaxFlashcardSessionProps {
  cards: SyntaxCard[];
  title: string;
  orderMode?: SessionOrderMode;
  onClose: () => void;
}

type Phase = "active" | "summary";
type Rating = 1 | 2 | 3;

interface SessionResult {
  cardId: string;
  rating: Rating;
}

const shuffleCards = (items: SyntaxCard[]) =>
  [...items].sort(() => Math.random() - 0.5);

export const orderSessionCards = (
  items: SyntaxCard[],
  mode: SessionOrderMode,
): SyntaxCard[] => {
  if (mode === "random") return shuffleCards(items);

  const categoryOrder: string[] = [];
  const byCategory = new Map<string, SyntaxCard[]>();

  for (const card of items) {
    if (!byCategory.has(card.category)) {
      categoryOrder.push(card.category);
      byCategory.set(card.category, []);
    }
    byCategory.get(card.category)!.push(card);
  }

  return categoryOrder.flatMap((category) => byCategory.get(category)!);
};

const ratingLabel = (rating: Rating) => {
  if (rating === 1) return "Don't know";
  if (rating === 2) return "Shaky";
  return "Know it";
};

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT";
};

// Language-specific exclusion sets so Python variable names like `stack`, `count`
// aren't accidentally filtered because they clash with C++ STL names.
const PYTHON_EXCLUDED = new Set([
  // keywords
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
  // builtins
  "abs",
  "all",
  "any",
  "bin",
  "bool",
  "chr",
  "dict",
  "divmod",
  "enumerate",
  "filter",
  "float",
  "format",
  "frozenset",
  "getattr",
  "hasattr",
  "hash",
  "hex",
  "id",
  "input",
  "int",
  "isinstance",
  "iter",
  "len",
  "list",
  "map",
  "max",
  "min",
  "next",
  "object",
  "oct",
  "open",
  "ord",
  "pow",
  "print",
  "property",
  "range",
  "repr",
  "reversed",
  "round",
  "set",
  "setattr",
  "slice",
  "sorted",
  "staticmethod",
  "str",
  "sum",
  "super",
  "tuple",
  "type",
  "vars",
  "zip",
  // stdlib / third-party modules & classes used in syntax cards
  "heapq",
  "collections",
  "bisect",
  "math",
  "os",
  "sys",
  "re",
  "defaultdict",
  "OrderedDict",
  "Counter",
  "deque",
  "namedtuple",
  // throwaway
  "_",
]);

const CPP_EXCLUDED = new Set([
  // keywords
  "auto",
  "bool",
  "break",
  "case",
  "char",
  "class",
  "const",
  "continue",
  "default",
  "delete",
  "do",
  "double",
  "else",
  "enum",
  "explicit",
  "false",
  "float",
  "for",
  "if",
  "inline",
  "int",
  "long",
  "namespace",
  "new",
  "nullptr",
  "operator",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "signed",
  "sizeof",
  "static",
  "struct",
  "switch",
  "template",
  "this",
  "throw",
  "true",
  "try",
  "typedef",
  "typename",
  "union",
  "unsigned",
  "using",
  "virtual",
  "void",
  "volatile",
  "while",
  // STL types
  "string",
  "vector",
  "pair",
  "map",
  "set",
  "unordered_map",
  "unordered_set",
  "stack",
  "queue",
  "deque",
  "priority_queue",
  "multimap",
  "multiset",
  "list",
  "array",
  "bitset",
  "tuple",
  "optional",
  "variant",
  // STL methods & free functions
  "begin",
  "end",
  "push_back",
  "pop_back",
  "push",
  "pop",
  "top",
  "front",
  "back",
  "size",
  "empty",
  "find",
  "insert",
  "erase",
  "count",
  "sort",
  "lower_bound",
  "upper_bound",
  "make_pair",
  "emplace",
  "emplace_back",
  "reserve",
  "resize",
  "clear",
  "swap",
  "at",
  "contains",
  // std namespace helpers
  "std",
  "cout",
  "cin",
  "endl",
  // throwaway
  "_",
]);

/**
 * Extracts likely user-defined variable names from a syntax string.
 * Skips keywords, builtins, method calls (after dot), string literals, and numbers.
 * Language-aware so Python vars like `stack` or `count` are not hidden.
 */
function extractVarHints(syntax: string, language: string): string[] {
  const excluded = language === "cpp" ? CPP_EXCLUDED : PYTHON_EXCLUDED;

  const cleaned = syntax
    .replace(/'[^']*'/g, "''")
    .replace(/"[^"]*"/g, '""')
    .replace(/\/\/[^\n]*/g, "")
    .replace(/#[^\n]*/g, "");

  const seen = new Set<string>();
  const results: string[] = [];
  const regex = /(?<!\.)(\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleaned)) !== null) {
    const word = match[1];
    if (!excluded.has(word) && !seen.has(word)) {
      seen.add(word);
      results.push(word);
    }
  }

  return results;
}

export const SyntaxFlashcardSession: React.FC<SyntaxFlashcardSessionProps> = ({
  cards,
  title,
  orderMode: initialOrderMode = "random",
  onClose,
}) => {
  const { logSyntaxPractice } = useSyntaxProgress();

  const totalUniqueCards = cards.length;
  const [orderMode, setOrderMode] =
    useState<SessionOrderMode>(initialOrderMode);
  const [queue, setQueue] = useState<SyntaxCard[]>(() =>
    orderSessionCards(cards, initialOrderMode),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [phase, setPhase] = useState<Phase>("active");
  const [results, setResults] = useState<SessionResult[]>([]);
  const [sessionRatings, setSessionRatings] = useState<Record<string, Rating>>(
    {},
  );
  const [maxVisitedIndex, setMaxVisitedIndex] = useState(0);
  const [activeTitle, setActiveTitle] = useState(title);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [hasLeftHelp, setHasLeftHelp] = useState(false);

  const currentCard = queue[currentIndex];
  const currentRating = currentCard
    ? sessionRatings[currentCard.id]
    : undefined;
  const currentExplanation = currentCard?.explanation.trim() ?? "";
  const hasExplanation = currentExplanation.length > 0;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < queue.length - 1;
  const againCount = results.filter((r) => r.rating === 1).length;
  const knowCount = results.filter((r) => r.rating === 3).length;

  // Timer
  useEffect(() => {
    if (phase === "summary") return;
    const interval = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [startTime, phase]);

  useEffect(() => {
    setShowExplanation(false);
  }, [currentIndex, currentCard?.id]);

  useEffect(() => {
    setOrderMode(initialOrderMode);
  }, [initialOrderMode]);

  useEffect(() => {
    try {
      preferenceStorage.setItem("syntax-session-order", orderMode);
    } catch {
      /* ignore */
    }
  }, [orderMode]);

  const handleFlip = useCallback(() => {
    if (phase !== "active" || !currentCard) return;
    setIsFlipped((flipped) => !flipped);
  }, [phase, currentCard]);

  const goPrevious = useCallback(() => {
    if (currentIndex === 0) return;
    setCurrentIndex((index) => Math.max(index - 1, 0));
    setIsFlipped(false);
    setShowExplanation(false);
  }, [currentIndex]);

  const applyRatingAndAdvance = useCallback(
    async (rating: Rating) => {
      if (!currentCard || phase !== "active") return;

      const previousRating = sessionRatings[currentCard.id];
      await logSyntaxPractice(currentCard.id, rating);
      setSessionRatings((prev) => ({ ...prev, [currentCard.id]: rating }));
      setResults((prev) => {
        const without = prev.filter((r) => r.cardId !== currentCard.id);
        return [...without, { cardId: currentCard.id, rating }];
      });

      let nextQueue = queue;
      if (rating === 1) {
        const alreadyQueuedAhead = queue
          .slice(currentIndex + 1)
          .some((c) => c.id === currentCard.id);
        if (!alreadyQueuedAhead && previousRating !== 1) {
          nextQueue = [...queue, currentCard];
          setQueue(nextQueue);
        }
      }

      if (currentIndex >= nextQueue.length - 1) {
        setPhase("summary");
        setIsFlipped(false);
        setShowExplanation(false);
      } else {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setMaxVisitedIndex((prev) => Math.max(prev, nextIndex));
        setIsFlipped(false);
        setShowExplanation(false);
      }
    },
    [
      currentCard,
      currentIndex,
      logSyntaxPractice,
      phase,
      queue,
      sessionRatings,
    ],
  );

  const goNext = useCallback(async () => {
    if (!currentCard || currentIndex >= queue.length - 1) return;

    if (!sessionRatings[currentCard.id]) {
      await applyRatingAndAdvance(1);
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setMaxVisitedIndex((prev) => Math.max(prev, nextIndex));
    setIsFlipped(false);
    setShowExplanation(false);
  }, [
    currentCard,
    currentIndex,
    queue.length,
    sessionRatings,
    applyRatingAndAdvance,
  ]);

  const handleBinaryChoice = useCallback(
    async (choice: 1 | 2) => {
      if (!currentCard || phase !== "active") return;
      const srsRating = choice === 1 ? 1 : 3;
      await applyRatingAndAdvance(srsRating);
    },
    [currentCard, phase, applyRatingAndAdvance],
  );

  const restartSession = useCallback(
    (nextCards: SyntaxCard[], nextTitle: string) => {
      setQueue(orderSessionCards(nextCards, orderMode));
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionRatings({});
      setResults([]);
      setMaxVisitedIndex(0);
      setPhase("active");
      setActiveTitle(nextTitle);
      setElapsed(0);
      setStartTime(Date.now());
      setShowHelp(false);
      setShowExitConfirm(false);
      setShowExplanation(false);
      setHasLeftHelp(true);
    },
    [orderMode],
  );

  const handleCloseHelp = useCallback(() => {
    if (!hasLeftHelp) {
      setQueue(orderSessionCards(cards, orderMode));
      setHasLeftHelp(true);
    }
    setShowHelp(false);
  }, [cards, hasLeftHelp, orderMode]);

  const struggledCards = cards.filter((card) => sessionRatings[card.id] === 1);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showExitConfirm) {
        if (e.key === "Escape") setShowExitConfirm(false);
        return;
      }

      if (showHelp) {
        if (e.key === "Escape") setShowHelp(false);
        return;
      }

      if (isTypingTarget(e.target)) return;

      if (phase === "active") {
        if (e.key === "Escape") {
          if (showExplanation) {
            setShowExplanation(false);
            return;
          }
          setShowExitConfirm(true);
          return;
        }
        if (
          isFlipped &&
          hasExplanation &&
          (e.key.toLowerCase() === "e" || e.key === "?")
        ) {
          e.preventDefault();
          setShowExplanation((value) => !value);
          return;
        }
        if (e.key === " ") {
          e.preventDefault();
          handleFlip();
          return;
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goPrevious();
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          void goNext();
          return;
        }
        if (e.key === "1") {
          e.preventDefault();
          void handleBinaryChoice(1);
          return;
        }
        if (e.key === "2") {
          e.preventDefault();
          void handleBinaryChoice(2);
        }
      } else if (phase === "summary") {
        if (e.key === "Escape" || e.key === "Enter") onClose();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    phase,
    handleFlip,
    goPrevious,
    goNext,
    handleBinaryChoice,
    showExitConfirm,
    showHelp,
    showExplanation,
    isFlipped,
    hasExplanation,
    onClose,
  ]);

  // Keep the underlying workspace out of the full-screen session's focus order.
  useLayoutEffect(() => {
    const workspace = document.getElementById("root");
    const previousInert = workspace?.inert ?? false;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    if (workspace) workspace.inert = true;
    document.body.style.overflow = "hidden";
    return () => {
      if (workspace) workspace.inert = previousInert;
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const sessionMessage = () => {
    const total = results.filter(
      (r, i, a) => a.findIndex((x) => x.cardId === r.cardId) === i,
    ).length;
    if (total === 0) return "No cards rated in this session.";
    return `${total} unique cards rated. These are self-reported recall results.`;
  };

  const progressPct =
    queue.length > 0 ? Math.round((currentIndex / queue.length) * 100) : 100;

  if (!currentCard && phase !== "summary") return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activeTitle}
      inert={showHelp || showExitConfirm}
      className="fixed inset-0 z-[60] bg-canvas flex flex-col"
    >
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-8 py-3 sm:py-4 border-b border-line bg-surface">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <span className="text-sm sm:text-lg font-semibold text-foreground truncate">
            {activeTitle}
          </span>
          {phase !== "summary" && (
            <span className="text-xs sm:text-sm text-subtle font-mono tabular-nums whitespace-nowrap">
              {currentIndex + 1} / {queue.length}
              {queue.length > totalUniqueCards && (
                <span className="text-warning/70 ml-2">
                  (+{queue.length - totalUniqueCards} again)
                </span>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          <ThemeSwitcher compact />
          {phase !== "summary" && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-subtle font-mono tabular-nums">
              <Clock size={18} />
              {formatTime(elapsed)}
            </div>
          )}

          {phase !== "summary" && (
            <button
              onClick={() => setShowHelp(true)}
              aria-label="How the syntax session works"
              className="p-2.5 rounded-xl text-subtle hover:text-body hover:bg-muted-surface transition-colors"
              title="How it works"
            >
              <HelpCircle size={22} />
            </button>
          )}

          <button
            aria-label="Exit session"
            onClick={() => {
              if (phase === "summary" || results.length === 0) onClose();
              else setShowExitConfirm(true);
            }}
            className="p-2.5 rounded-xl text-subtle hover:text-body hover:bg-muted-surface transition-colors"
            title="Exit (Esc)"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {phase !== "summary" && (
        <div className="h-1 bg-muted-surface flex-shrink-0">
          <div
            className="h-full bg-accent transition-all duration-200 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Exit session?"
        size="sm"
      >
        <p className="text-sm text-muted mb-6">
          Progress so far is saved, but the session will end.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowExitConfirm(false)}
            className="brand-button-secondary flex-1 py-2.5 rounded-md text-sm"
          >
            Keep going
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-md bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 text-sm"
          >
            Exit
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showHelp}
        onClose={handleCloseHelp}
        title="Syntax practice"
        description="Recall first. Reveal the answer, then record how it went."
        size="lg"
        className="syntax-help-dialog"
      >
        <div className="space-y-6">
          {/* The 3-step flow */}
          <div>
            <div className="text-xs sm:text-sm font-semibold text-subtle uppercase tracking-widest mb-4">
              The Flow
            </div>
            <div className="space-y-3">
              {[
                {
                  step: "1",
                  label: "Read the front",
                  desc: "Use the description, use case, and variable hints to recall the syntax.",
                },
                {
                  step: "2",
                  label: "Flip the card",
                  desc: "Press Space or tap the card to reveal the answer.",
                },
                {
                  step: "3",
                  label: "Mark know or not",
                  desc: "Press 1 if you did not know it, 2 if you did. You can also click the buttons below the card.",
                },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex gap-4 items-start">
                  <TraceIndex>{step.padStart(2, "0")}</TraceIndex>
                  <div>
                    <div className="text-base sm:text-lg font-semibold text-body">
                      {label}
                    </div>
                    <div className="text-sm text-subtle leading-relaxed mt-0.5">
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ratings explained */}
          <div>
            <div className="text-xs sm:text-sm font-semibold text-subtle uppercase tracking-widest mb-4">
              The two options
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border-t border-line pt-4">
                <div className="text-sm font-semibold text-body mb-1.5 flex items-center gap-2">
                  <X size={20} />
                  <span>1 · Don't know</span>
                </div>
                <div className="text-sm text-subtle leading-relaxed">
                  You blanked or got it wrong. Card re-queues at the end of this
                  session.
                </div>
              </div>
              <div className="border-t border-line pt-4">
                <div className="text-sm font-semibold text-body mb-1.5 flex items-center gap-2">
                  <Check size={20} />
                  <span>2 · Know it</span>
                </div>
                <div className="text-sm text-subtle leading-relaxed">
                  You knew the syntax. Normal spaced repetition interval
                  applied.
                </div>
              </div>
            </div>
          </div>

          {/* Card order */}
          <div>
            <div className="text-xs sm:text-sm font-semibold text-subtle uppercase tracking-widest mb-4">
              Card order
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setOrderMode("random")}
                className={clsx(
                  "flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold transition-colors",
                  orderMode === "random"
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-line bg-canvas/60 text-muted hover:border-line-strong hover:text-body",
                )}
              >
                <Shuffle size={16} />
                Random
              </button>
              <button
                type="button"
                onClick={() => setOrderMode("category")}
                className={clsx(
                  "flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold transition-colors",
                  orderMode === "category"
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-line bg-canvas/60 text-muted hover:border-line-strong hover:text-body",
                )}
              >
                <Layers size={16} />
                By category
              </button>
            </div>
            <p className="mt-3 text-sm text-subtle leading-relaxed">
              {orderMode === "random"
                ? "Cards are shuffled for mixed practice across topics."
                : "Cards stay grouped by category in reference order, with each category kept together."}
            </p>
          </div>

          {/* Keyboard shortcuts */}
          <div className="flex items-center gap-2.5 flex-wrap text-xs sm:text-sm text-subtle pt-1 border-t border-line">
            <Keyboard size={16} className="text-body" />
            <span>
              <kbd className="font-mono bg-muted-surface px-2 py-1 rounded text-muted">
                ←
              </kbd>{" "}
              <kbd className="font-mono bg-muted-surface px-2 py-1 rounded text-muted">
                →
              </kbd>{" "}
              navigate
            </span>
            <span className="text-foreground">·</span>
            <span>
              <kbd className="font-mono bg-muted-surface px-2 py-1 rounded text-muted">
                Space
              </kbd>{" "}
              flip
            </span>
            <span className="text-foreground">·</span>
            <span>
              <kbd className="font-mono bg-muted-surface px-2 py-1 rounded text-muted">
                1
              </kbd>{" "}
              don't know
            </span>
            <span className="text-foreground">·</span>
            <span>
              <kbd className="font-mono bg-muted-surface px-2 py-1 rounded text-muted">
                2
              </kbd>{" "}
              know it
            </span>
            <span className="text-foreground">·</span>
            <span>
              <kbd className="font-mono bg-muted-surface px-2 py-1 rounded text-muted">
                E
              </kbd>{" "}
              explain
            </span>
            <span className="text-foreground">·</span>
            <span>
              <kbd className="font-mono bg-muted-surface px-2 py-1 rounded text-muted">
                Esc
              </kbd>{" "}
              exit
            </span>
          </div>
        </div>
        <div className="syntax-help-footer border-t border-line pt-4 mt-5">
          <button
            onClick={handleCloseHelp}
            className="brand-button-primary w-full py-3 rounded-md text-sm font-medium flex items-center justify-center gap-3"
          >
            {hasLeftHelp ? "Continue" : "Start Session"}
            <ArrowRight size={16} />
          </button>
        </div>
      </Modal>

      {/* Body */}
      <div
        className={clsx(
          "flex-1 min-h-0 overflow-y-auto flex justify-center p-4 sm:p-6",
          phase === "summary" ? "items-center" : "items-stretch",
        )}
      >
        {phase === "summary" ? (
          /* ── Summary screen ── */
          <div className="max-w-md w-full text-left py-8">
            <div className="flex items-center gap-3 mb-4">
              <TraceIndex active>03</TraceIndex>
              <span className="font-mono text-xs text-subtle">
                Session record
              </span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
              Session Complete
            </h2>
            <p className="text-muted text-sm mb-8 leading-relaxed">
              {sessionMessage()}
            </p>

            <div className="grid grid-cols-2 divide-x divide-line border-y border-line py-5 mb-6">
              <div className="pr-5">
                <div className="text-3xl font-mono text-foreground">
                  {againCount}
                </div>
                <div className="text-xs text-subtle mt-2">Don't know</div>
              </div>
              <div className="pl-5">
                <div className="text-3xl font-mono text-foreground">
                  {knowCount}
                </div>
                <div className="text-xs text-subtle mt-2">Know it</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 text-xs text-subtle mb-8">
              <span className="flex items-center gap-1.5">
                <Clock size={11} />
                {formatTime(elapsed)}
              </span>
              <span className="text-foreground">·</span>
              <span>{totalUniqueCards} unique cards</span>
              {results.length > totalUniqueCards && (
                <>
                  <span className="text-foreground">·</span>
                  <span className="flex items-center gap-1 text-warning/60">
                    <RotateCcw size={10} />
                    {results.length - totalUniqueCards} re-queued
                  </span>
                </>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => restartSession(cards, title)}
                className="w-full py-3 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Retry all
              </button>
              <button
                onClick={() =>
                  restartSession(struggledCards, `${title} · struggled`)
                }
                disabled={struggledCards.length === 0}
                className={clsx(
                  "w-full py-3 rounded-xl border font-medium transition-colors flex items-center justify-center gap-2",
                  struggledCards.length > 0
                    ? "bg-warning/10 hover:bg-warning/20 border-warning/20 text-warning"
                    : "bg-muted-surface/50 border-line-strong/50 text-subtle cursor-not-allowed",
                )}
              >
                <RotateCcw size={16} />
                Review struggled
                {struggledCards.length > 0 && (
                  <span className="rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold">
                    {struggledCards.length}
                  </span>
                )}
              </button>
              {struggledCards.length === 0 && (
                <p className="text-[11px] text-subtle">
                  No cards marked as don't know in this session.
                </p>
              )}
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-muted-surface hover:bg-hover-surface border border-line-strong text-body font-medium transition-colors"
              >
                Back to Reference
              </button>
            </div>
          </div>
        ) : (
          /* ── Active card + controls as one unit ── */
          <div className="w-full max-w-5xl flex flex-col flex-1 min-h-0 my-auto">
            <div className="flex flex-col flex-1 min-h-[min(100%,calc(100vh-11rem))] bg-surface border border-line rounded-lg overflow-hidden">
              <div className="flex-1 min-h-[52vh] sm:min-h-[58vh] relative [perspective:1600px]">
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="syntax-session-flip absolute inset-0 [transform-style:preserve-3d]"
                >
                  <div
                    inert={isFlipped}
                    className="absolute inset-0 bg-surface overflow-hidden [backface-visibility:hidden]"
                  >
                    <button
                      type="button"
                      onClick={handleFlip}
                      aria-pressed={isFlipped}
                      className="flex h-full w-full flex-col justify-between p-5 sm:p-10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
                          <div className="flex items-center gap-2 flex-wrap">
                            <TraceIndex active>
                              {String(currentIndex + 1).padStart(2, "0")}
                            </TraceIndex>
                            <span className="text-muted text-xs font-medium">
                              {currentCard.category}
                            </span>
                            <span className="text-subtle text-xs font-mono ml-2">
                              {currentCard.timeComplexity}
                            </span>
                          </div>
                          {currentRating && (
                            <span
                              className={clsx(
                                "px-3 py-1 rounded-md border text-xs font-medium",
                                currentRating === 1 &&
                                  "bg-danger/10 border-danger/20 text-danger",
                                currentRating === 3 &&
                                  "bg-accent/10 border-accent/20 text-accent",
                              )}
                            >
                              {ratingLabel(currentRating)}
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground leading-tight mb-5 max-w-5xl">
                          {currentCard.description}
                        </h2>
                        <p className="text-muted text-base sm:text-lg lg:text-xl leading-relaxed mb-8 max-w-4xl">
                          {currentCard.useCase}
                        </p>
                        {(() => {
                          const hints = extractVarHints(
                            currentCard.syntax,
                            currentCard.language,
                          );
                          if (hints.length === 0) return null;
                          return (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-subtle uppercase tracking-widest font-medium flex-shrink-0">
                                Variables:
                              </span>
                              {hints.map((v) => (
                                <code
                                  key={v}
                                  className="px-2.5 py-1 rounded-md bg-muted-surface/80 border border-line-strong/50 text-sm font-mono text-body"
                                >
                                  {v}
                                </code>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-accent pt-6">
                        <span>
                          {isFlipped
                            ? "Tap or press Space to hide"
                            : "See answer"}
                        </span>
                      </div>
                    </button>
                  </div>

                  <div
                    inert={!isFlipped}
                    className="absolute inset-0 bg-surface overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  >
                    <div className="flex h-full w-full flex-col p-5 sm:p-8 text-left">
                      <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-accent font-semibold tracking-widest uppercase">
                            Syntax
                          </div>
                          {hasExplanation && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowExplanation((value) => !value);
                              }}
                              aria-expanded={showExplanation}
                              className={clsx(
                                "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                                showExplanation
                                  ? "border-accent/30 bg-accent/10 text-accent"
                                  : "border-line-strong bg-muted-surface/80 text-body hover:border-accent/30 hover:text-accent",
                              )}
                            >
                              <BookOpen size={15} />
                              Explain
                            </button>
                          )}
                        </div>
                        <span className="text-xs text-subtle">
                          Tap or Space to hide
                        </span>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={handleFlip}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFlip();
                          }
                        }}
                        aria-label="Hide answer"
                        className="flex-1 flex items-stretch justify-center min-h-0 overflow-auto rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <div className="w-full min-h-[12rem] rounded-md border border-line bg-canvas px-2 py-4 sm:px-4 sm:py-6">
                          <SyntaxHighlightedCode
                            code={currentCard.syntax}
                            language={currentCard.language}
                            size="xl"
                            className="pointer-events-none"
                          />
                        </div>
                      </div>
                      {showExplanation && hasExplanation && (
                        <div className="mt-4 rounded-lg border border-line bg-muted-surface p-4 sm:p-5">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
                              <BookOpen size={14} />
                              Explanation
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowExplanation(false);
                              }}
                              aria-label="Close explanation"
                              className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-muted-surface hover:text-body"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <p className="max-h-36 overflow-y-auto pr-1 text-sm sm:text-base leading-relaxed text-body">
                            {currentExplanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="flex-shrink-0 border-t border-line/80 bg-canvas/90 px-4 sm:px-6 py-5 sm:py-6">
                <p className="hidden sm:block text-center text-sm text-subtle mb-5">
                  Press <span className="text-muted">Space</span> to flip ·{" "}
                  <span className="text-muted">E</span> to explain ·{" "}
                  <span className="text-muted">← / →</span> to navigate ·{" "}
                  <span className="text-muted">1 / 2</span> to rate
                </p>
                <p className="sm:hidden text-center text-xs text-muted mb-4">
                  See the answer, then rate your recall.
                </p>
                <div className="flex items-center justify-center gap-3 sm:gap-4 max-w-xl mx-auto">
                  <button
                    type="button"
                    onClick={goPrevious}
                    disabled={!canGoPrevious}
                    aria-label="Previous card"
                    className={clsx(
                      "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg border transition-colors",
                      canGoPrevious
                        ? "border-line-strong bg-muted-surface/80 text-body hover:bg-hover-surface"
                        : "border-line bg-surface/50 text-body cursor-not-allowed",
                    )}
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void handleBinaryChoice(1);
                    }}
                    aria-label="Don't know · practice again"
                    className="flex flex-1 min-h-12 items-center justify-center gap-2 sm:gap-3 rounded-lg border border-line-strong bg-surface px-3 sm:px-6 py-3 sm:py-4 hover:bg-muted-surface transition-colors group text-body"
                  >
                    <X size={18} className="hidden sm:block" />
                    <span className="hidden sm:inline text-lg font-mono tabular-nums">
                      {againCount}
                    </span>
                    <span className="text-xs sm:text-sm whitespace-nowrap">
                      Don't know
                    </span>
                    <kbd className="hidden sm:inline font-mono text-[10px] text-subtle bg-muted-surface px-1.5 py-0.5 rounded">
                      1
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void handleBinaryChoice(2);
                    }}
                    aria-label="Know it · continue"
                    className="flex flex-1 min-h-12 items-center justify-center gap-2 sm:gap-3 rounded-lg border border-line-strong bg-surface px-3 sm:px-6 py-3 sm:py-4 hover:bg-muted-surface transition-colors group text-body"
                  >
                    <span className="hidden sm:inline text-lg font-mono tabular-nums">
                      {knowCount}
                    </span>
                    <Check size={18} className="hidden sm:block" />
                    <span className="text-xs sm:text-sm whitespace-nowrap">
                      Know it
                    </span>
                    <kbd className="hidden sm:inline font-mono text-[10px] text-subtle bg-muted-surface px-1.5 py-0.5 rounded">
                      2
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void goNext();
                    }}
                    disabled={!canGoNext}
                    aria-label="Next card"
                    className={clsx(
                      "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg border transition-colors",
                      canGoNext
                        ? "border-line-strong bg-muted-surface/80 text-body hover:bg-hover-surface"
                        : "border-line bg-surface/50 text-body cursor-not-allowed",
                    )}
                    title={
                      currentRating
                        ? "Next card"
                        : "Next — counts as don't know"
                    }
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
