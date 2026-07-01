import React, { useState, useEffect, useCallback } from 'react';
import { SyntaxCard } from '../data/syntaxCards';
import { X, Clock, Keyboard, Trophy, RotateCcw, HelpCircle, ArrowRight, ArrowLeft, Check, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { useSyntaxProgress } from '../hooks/useUserData';
import { motion } from 'motion/react';

interface SyntaxFlashcardSessionProps {
    cards: SyntaxCard[];
    title: string;
    onClose: () => void;
}

type Phase = 'active' | 'summary';
type Rating = 1 | 2 | 3;

interface SessionResult {
    cardId: string;
    rating: Rating;
}

const shuffleCards = (items: SyntaxCard[]) => [...items].sort(() => Math.random() - 0.5);

const ratingLabel = (rating: Rating) => {
    if (rating === 1) return "Don't know";
    if (rating === 3) return 'Know it';
    return 'Know it';
};

const isTypingTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT';
};

// Language-specific exclusion sets so Python variable names like `stack`, `count`
// aren't accidentally filtered because they clash with C++ STL names.
const PYTHON_EXCLUDED = new Set([
    // keywords
    'False','None','True','and','as','assert','async','await','break','class',
    'continue','def','del','elif','else','except','finally','for','from','global',
    'if','import','in','is','lambda','nonlocal','not','or','pass','raise','return',
    'try','while','with','yield',
    // builtins
    'abs','all','any','bin','bool','chr','dict','divmod','enumerate','filter',
    'float','format','frozenset','getattr','hasattr','hash','hex','id','input',
    'int','isinstance','iter','len','list','map','max','min','next','object',
    'oct','open','ord','pow','print','property','range','repr','reversed','round',
    'set','setattr','slice','sorted','staticmethod','str','sum','super','tuple',
    'type','vars','zip',
    // stdlib / third-party modules & classes used in syntax cards
    'heapq','collections','bisect','math','os','sys','re',
    'defaultdict','OrderedDict','Counter','deque','namedtuple',
    // throwaway
    '_',
]);

const CPP_EXCLUDED = new Set([
    // keywords
    'auto','bool','break','case','char','class','const','continue','default',
    'delete','do','double','else','enum','explicit','false','float','for','if',
    'inline','int','long','namespace','new','nullptr','operator','private',
    'protected','public','return','short','signed','sizeof','static','struct',
    'switch','template','this','throw','true','try','typedef','typename','union',
    'unsigned','using','virtual','void','volatile','while',
    // STL types
    'string','vector','pair','map','set','unordered_map','unordered_set',
    'stack','queue','deque','priority_queue','multimap','multiset',
    'list','array','bitset','tuple','optional','variant',
    // STL methods & free functions
    'begin','end','push_back','pop_back','push','pop','top','front','back',
    'size','empty','find','insert','erase','count','sort','lower_bound',
    'upper_bound','make_pair','emplace','emplace_back','reserve','resize',
    'clear','swap','at','contains',
    // std namespace helpers
    'std','cout','cin','endl',
    // throwaway
    '_',
]);

/**
 * Extracts likely user-defined variable names from a syntax string.
 * Skips keywords, builtins, method calls (after dot), string literals, and numbers.
 * Language-aware so Python vars like `stack` or `count` are not hidden.
 */
function extractVarHints(syntax: string, language: string): string[] {
    const excluded = language === 'cpp' ? CPP_EXCLUDED : PYTHON_EXCLUDED;

    const cleaned = syntax
        .replace(/'[^']*'/g, "''")
        .replace(/"[^"]*"/g, '""')
        .replace(/\/\/[^\n]*/g, '')
        .replace(/#[^\n]*/g, '');

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
    onClose,
}) => {
    const { logSyntaxPractice } = useSyntaxProgress();

    const totalUniqueCards = cards.length;
    const [queue, setQueue] = useState<SyntaxCard[]>([...cards]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [phase, setPhase] = useState<Phase>('active');
    const [results, setResults] = useState<SessionResult[]>([]);
    const [sessionRatings, setSessionRatings] = useState<Record<string, Rating>>({});
    const [maxVisitedIndex, setMaxVisitedIndex] = useState(0);
    const [activeTitle, setActiveTitle] = useState(title);
    const [startTime, setStartTime] = useState(Date.now());
    const [elapsed, setElapsed] = useState(0);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showHelp, setShowHelp] = useState(true);
    const [showExplanation, setShowExplanation] = useState(false);

    const currentCard = queue[currentIndex];
    const currentRating = currentCard ? sessionRatings[currentCard.id] : undefined;
    const currentExplanation = currentCard?.explanation.trim() ?? '';
    const hasExplanation = currentExplanation.length > 0;
    const canGoPrevious = currentIndex > 0;
    const canGoNext = currentIndex < queue.length - 1;
    const againCount = results.filter(r => r.rating === 1).length;
    const knowCount = results.filter(r => r.rating === 3).length;

    // Timer
    useEffect(() => {
        if (phase === 'summary') return;
        const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
        return () => clearInterval(interval);
    }, [startTime, phase]);

    useEffect(() => {
        setShowExplanation(false);
    }, [currentIndex, currentCard?.id]);

    const handleFlip = useCallback(() => {
        if (phase !== 'active' || !currentCard) return;
        setIsFlipped(flipped => !flipped);
    }, [phase, currentCard]);

    const goPrevious = useCallback(() => {
        if (currentIndex === 0) return;
        setCurrentIndex(index => Math.max(index - 1, 0));
        setIsFlipped(false);
        setShowExplanation(false);
    }, [currentIndex]);

    const applyRatingAndAdvance = useCallback(async (rating: Rating) => {
        if (!currentCard || phase !== 'active') return;

        await logSyntaxPractice(currentCard.id, rating);
        setSessionRatings(prev => ({ ...prev, [currentCard.id]: rating }));
        setResults(prev => [...prev, { cardId: currentCard.id, rating }]);

        const nextQueue = rating === 1 ? [...queue, currentCard] : queue;
        if (rating === 1) setQueue(nextQueue);

        if (currentIndex >= nextQueue.length - 1) {
            setPhase('summary');
            setIsFlipped(false);
            setShowExplanation(false);
        } else {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setMaxVisitedIndex(prev => Math.max(prev, nextIndex));
            setIsFlipped(false);
            setShowExplanation(false);
        }
    }, [currentCard, currentIndex, logSyntaxPractice, phase, queue]);

    const goNext = useCallback(async () => {
        if (!currentCard || currentIndex >= queue.length - 1) return;

        if (!sessionRatings[currentCard.id]) {
            await applyRatingAndAdvance(1);
            return;
        }

        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setMaxVisitedIndex(prev => Math.max(prev, nextIndex));
        setIsFlipped(false);
        setShowExplanation(false);
    }, [currentCard, currentIndex, queue.length, sessionRatings, applyRatingAndAdvance]);

    const handleBinaryChoice = useCallback(async (choice: 1 | 2) => {
        if (!currentCard || phase !== 'active') return;
        const srsRating = choice === 1 ? 1 : 3;
        await applyRatingAndAdvance(srsRating);
    }, [currentCard, phase, applyRatingAndAdvance]);

    const restartSession = useCallback((nextCards: SyntaxCard[], nextTitle: string) => {
        setQueue(shuffleCards(nextCards));
        setCurrentIndex(0);
        setIsFlipped(false);
        setSessionRatings({});
        setResults([]);
        setMaxVisitedIndex(0);
        setPhase('active');
        setActiveTitle(nextTitle);
        setElapsed(0);
        setStartTime(Date.now());
        setShowHelp(false);
        setShowExitConfirm(false);
        setShowExplanation(false);
    }, []);

    const struggledCards = cards.filter(card => sessionRatings[card.id] === 1);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (showExitConfirm) {
                if (e.key === 'Escape') setShowExitConfirm(false);
                return;
            }

            if (isTypingTarget(e.target)) return;

            if (phase === 'active') {
                if (e.key === 'Escape') {
                    if (showExplanation) {
                        setShowExplanation(false);
                        return;
                    }
                    setShowExitConfirm(true);
                    return;
                }
                if (isFlipped && hasExplanation && (e.key.toLowerCase() === 'e' || e.key === '?')) {
                    e.preventDefault();
                    setShowExplanation(value => !value);
                    return;
                }
                if (e.key === ' ') { e.preventDefault(); handleFlip(); return; }
                if (e.key === 'ArrowLeft') { e.preventDefault(); goPrevious(); return; }
                if (e.key === 'ArrowRight') { e.preventDefault(); void goNext(); return; }
                if (e.key === '1') { e.preventDefault(); void handleBinaryChoice(1); return; }
                if (e.key === '2') { e.preventDefault(); void handleBinaryChoice(2); }
            } else if (phase === 'summary') {
                if (e.key === 'Escape' || e.key === 'Enter') onClose();
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [phase, handleFlip, goPrevious, goNext, handleBinaryChoice, showExitConfirm, showExplanation, isFlipped, hasExplanation, onClose]);

    // Prevent body scroll while session is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
    };

    const sessionMessage = () => {
        const total = results.filter((r, i, a) => a.findIndex(x => x.cardId === r.cardId) === i).length;
        if (total === 0) return "No cards rated yet. Jump back in when you're ready.";
        if (knowCount === total) return "Flawless. Every card nailed cold.";
        if (knowCount / total >= 0.8) return "Strong session. The weak spots will come back around.";
        if (knowCount / total >= 0.5) return "Solid effort. Repetition is what makes it stick.";
        return "Tough session - that's the point. They'll stick much better next time.";
    };

    const progressPct = queue.length > 0 ? Math.round((currentIndex / queue.length) * 100) : 100;

    if (!currentCard && phase !== 'summary') return null;

    return (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
            {/* Top bar */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-zinc-800/60 bg-zinc-900/60">
                <div className="flex items-center gap-4 min-w-0">
                    <span className="text-lg sm:text-xl font-bold text-zinc-100 truncate">{activeTitle}</span>
                    {phase !== 'summary' && (
                        <span className="text-sm sm:text-base text-zinc-500 font-mono tabular-nums whitespace-nowrap">
                            {currentIndex + 1} / {queue.length}
                            {queue.length > totalUniqueCards && (
                                <span className="text-amber-500/70 ml-2">
                                    (+{queue.length - totalUniqueCards} again)
                                </span>
                            )}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                    {phase !== 'summary' && (
                        <div className="flex items-center gap-2 text-sm sm:text-base text-zinc-500 font-mono tabular-nums">
                            <Clock size={18} />
                            {formatTime(elapsed)}
                        </div>
                    )}

                    {phase !== 'summary' && (
                        <button
                            onClick={() => setShowHelp(true)}
                            className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                            title="How it works"
                        >
                            <HelpCircle size={22} />
                        </button>
                    )}

                    <button
                        aria-label="Exit session"
                        onClick={() => {
                            if (phase === 'summary' || results.length === 0) onClose();
                            else setShowExitConfirm(true);
                        }}
                        className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                        title="Exit (Esc)"
                    >
                        <X size={22} />
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            {phase !== 'summary' && (
                <div className="h-1 bg-zinc-800 flex-shrink-0">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            )}

            {/* Exit confirmation */}
            {showExitConfirm && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-7 max-w-sm w-full mx-4 text-center shadow-2xl">
                        <h3 className="text-lg font-bold text-zinc-100 mb-1.5">Exit session?</h3>
                        <p className="text-sm text-zinc-400 mb-6">
                            Progress so far is saved, but the session will end.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowExitConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-medium"
                            >
                                Keep going
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                            >
                                Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Help / intro overlay */}
            {showHelp && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm p-6 sm:p-10">
                    <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl w-full max-w-3xl lg:max-w-4xl shadow-2xl overflow-hidden max-h-[min(92vh,900px)] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 sm:px-10 pt-8 sm:pt-10 pb-6 border-b border-zinc-800">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-100">How Practice Sessions Work</h3>
                                <p className="text-sm sm:text-base text-zinc-500 mt-2">You can re-open this anytime with the <span className="font-mono">?</span> button</p>
                            </div>
                            <button
                                aria-label="Close help"
                                onClick={() => setShowHelp(false)}
                                className="p-2.5 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="px-8 sm:px-10 py-8 sm:py-10 space-y-8">
                            {/* The 3-step flow */}
                            <div>
                                <div className="text-xs sm:text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-5">The Flow</div>
                                <div className="space-y-4">
                                    {[
                                        { step: '1', label: 'Read the front', desc: 'Use the description, use case, and variable hints to recall the syntax.' },
                                        { step: '2', label: 'Flip the card', desc: 'Press Space or tap the card to reveal the answer.' },
                                        { step: '3', label: 'Mark know or not', desc: 'Press 1 if you did not know it, 2 if you did. You can also click the buttons below the card.' },
                                    ].map(({ step, label, desc }) => (
                                        <div key={step} className="flex gap-4 items-start">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-400 flex-shrink-0 mt-0.5">
                                                {step}
                                            </div>
                                            <div>
                                                <div className="text-lg sm:text-xl font-semibold text-zinc-200">{label}</div>
                                                <div className="text-sm sm:text-base text-zinc-500 leading-relaxed mt-1">{desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Ratings explained */}
                            <div>
                                <div className="text-xs sm:text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-5">The two options</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 sm:p-6">
                                        <div className="text-lg sm:text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
                                            <X size={20} />
                                            <span>1 · Don't know</span>
                                        </div>
                                        <div className="text-sm sm:text-base text-zinc-500 leading-relaxed">You blanked or got it wrong. Card re-queues at the end of this session.</div>
                                    </div>
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 sm:p-6">
                                        <div className="text-lg sm:text-xl font-bold text-emerald-400 mb-2 flex items-center gap-2">
                                            <Check size={20} />
                                            <span>2 · Know it</span>
                                        </div>
                                        <div className="text-sm sm:text-base text-zinc-500 leading-relaxed">You knew the syntax. Normal spaced repetition interval applied.</div>
                                    </div>
                                </div>
                            </div>

                            {/* Keyboard shortcuts */}
                            <div className="flex items-center gap-3 flex-wrap text-sm sm:text-base text-zinc-600 pt-2 border-t border-zinc-800">
                                <Keyboard size={16} className="text-zinc-700" />
                                <span><kbd className="font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-400">←</kbd> <kbd className="font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-400">→</kbd> navigate</span>
                                <span className="text-zinc-800">·</span>
                                <span><kbd className="font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-400">Space</kbd> flip</span>
                                <span className="text-zinc-800">·</span>
                                <span><kbd className="font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-400">1</kbd> don't know</span>
                                <span className="text-zinc-800">·</span>
                                <span><kbd className="font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-400">2</kbd> know it</span>
                                <span className="text-zinc-800">·</span>
                                <span><kbd className="font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-400">E</kbd> explain</span>
                                <span className="text-zinc-800">·</span>
                                <span><kbd className="font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-400">Esc</kbd> exit</span>
                            </div>
                        </div>

                        <div className="px-8 sm:px-10 pb-8 sm:pb-10">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="w-full py-4 sm:py-5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-lg font-semibold transition-colors flex items-center justify-center gap-3"
                            >
                                Start Session
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Body */}
            <div className={clsx(
                "flex-1 min-h-0 overflow-y-auto flex justify-center p-4 sm:p-6",
                phase === 'summary' ? 'items-center' : 'items-stretch'
            )}>
                {phase === 'summary' ? (
                    /* ── Summary screen ── */
                    <div className="max-w-md w-full text-center py-8">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                            <Trophy size={34} className="text-emerald-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-zinc-50 mb-2">Session Complete</h2>
                        <p className="text-zinc-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                            {sessionMessage()}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5">
                                <div className="text-3xl font-bold text-red-400">{againCount}</div>
                                <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-medium">Don't know</div>
                            </div>
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5">
                                <div className="text-3xl font-bold text-emerald-400">{knowCount}</div>
                                <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-medium">Know it</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-3 text-xs text-zinc-600 mb-8">
                            <span className="flex items-center gap-1.5">
                                <Clock size={11} />
                                {formatTime(elapsed)}
                            </span>
                            <span className="text-zinc-800">·</span>
                            <span>{totalUniqueCards} unique cards</span>
                            {results.length > totalUniqueCards && (
                                <>
                                    <span className="text-zinc-800">·</span>
                                    <span className="flex items-center gap-1 text-amber-500/60">
                                        <RotateCcw size={10} />
                                        {results.length - totalUniqueCards} re-queued
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => restartSession(cards, title)}
                                className="w-full py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={16} />
                                Retry all
                            </button>
                            <button
                                onClick={() => restartSession(struggledCards, `${title} · struggled`)}
                                disabled={struggledCards.length === 0}
                                className={clsx(
                                    "w-full py-3 rounded-xl border font-medium transition-colors flex items-center justify-center gap-2",
                                    struggledCards.length > 0
                                        ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-400"
                                        : "bg-zinc-800/50 border-zinc-700/50 text-zinc-600 cursor-not-allowed"
                                )}
                            >
                                <RotateCcw size={16} />
                                Review struggled
                                {struggledCards.length > 0 && (
                                    <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold">
                                        {struggledCards.length}
                                    </span>
                                )}
                            </button>
                            {struggledCards.length === 0 && (
                                <p className="text-[11px] text-zinc-600">No cards marked as don't know in this session.</p>
                            )}
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-medium transition-colors"
                            >
                                Back to Reference
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Active card + controls as one unit ── */
                    <div className="w-full max-w-7xl flex flex-col flex-1 min-h-0 my-auto">
                        <div className="flex flex-col flex-1 min-h-[min(100%,calc(100vh-11rem))] bg-zinc-900/60 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
                            <div className="flex-1 min-h-[52vh] sm:min-h-[58vh] relative [perspective:1600px]">
                                <motion.div
                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                                    className="absolute inset-0 [transform-style:preserve-3d]"
                                >
                                    <div className="absolute inset-0 bg-zinc-900 overflow-hidden [backface-visibility:hidden]">
                                        <button
                                            type="button"
                                            onClick={handleFlip}
                                            aria-pressed={isFlipped}
                                            className="flex h-full w-full flex-col justify-between p-5 sm:p-10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="px-3 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs font-medium uppercase tracking-widest">
                                                            {currentCard.category}
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-md bg-zinc-800/50 text-zinc-600 text-xs font-mono">
                                                            {currentCard.timeComplexity}
                                                        </span>
                                                    </div>
                                                    {currentRating && (
                                                        <span className={clsx(
                                                            "px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider",
                                                            currentRating === 1 && "bg-red-500/10 border-red-500/20 text-red-400",
                                                            currentRating === 3 && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                                                        )}>
                                                            {ratingLabel(currentRating)}
                                                        </span>
                                                    )}
                                                </div>
                                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-50 leading-tight mb-5 max-w-5xl">
                                                    {currentCard.description}
                                                </h2>
                                                <p className="text-zinc-400 text-base sm:text-lg lg:text-xl leading-relaxed mb-8 max-w-4xl">
                                                    {currentCard.useCase}
                                                </p>
                                                {(() => {
                                                    const hints = extractVarHints(currentCard.syntax, currentCard.language);
                                                    if (hints.length === 0) return null;
                                                    return (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs text-zinc-600 uppercase tracking-widest font-medium flex-shrink-0">
                                                                Variables:
                                                            </span>
                                                            {hints.map(v => (
                                                                <code
                                                                    key={v}
                                                                    className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/50 text-sm font-mono text-zinc-300"
                                                                >
                                                                    {v}
                                                                </code>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 pt-6">
                                                <span>{isFlipped ? 'Tap or press Space to hide' : 'See answer'}</span>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="absolute inset-0 bg-zinc-900 overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]">
                                        <div className="flex h-full w-full flex-col p-5 sm:p-8 text-left">
                                            <div className="flex items-center justify-between gap-3 mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-xs text-emerald-500 font-semibold tracking-widest uppercase">
                                                        Syntax
                                                    </div>
                                                    {hasExplanation && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowExplanation(value => !value);
                                                            }}
                                                            aria-expanded={showExplanation}
                                                            className={clsx(
                                                                "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                                                                showExplanation
                                                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                                                    : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-emerald-500/30 hover:text-emerald-300"
                                                            )}
                                                        >
                                                            <BookOpen size={15} />
                                                            Explain
                                                        </button>
                                                    )}
                                                </div>
                                                <span className="text-xs text-zinc-600">Tap or Space to hide</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleFlip}
                                                aria-label="Hide answer"
                                                className="flex-1 flex items-center justify-center min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-2xl"
                                            >
                                                <div className="w-full h-full min-h-[12rem] rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-8 font-mono text-xl sm:text-2xl lg:text-3xl text-zinc-100 whitespace-pre-wrap leading-relaxed overflow-auto flex items-center">
                                                    {currentCard.syntax}
                                                </div>
                                            </button>
                                            {showExplanation && hasExplanation && (
                                                <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 sm:p-5 shadow-inner">
                                                    <div className="mb-2 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
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
                                                            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                    <p className="max-h-36 overflow-y-auto pr-1 text-sm sm:text-base leading-relaxed text-zinc-300">
                                                        {currentExplanation}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="flex-shrink-0 border-t border-zinc-800/80 bg-zinc-950/90 px-4 sm:px-6 py-5 sm:py-6">
                                <p className="text-center text-sm text-zinc-500 mb-5">
                                    Press <span className="text-zinc-400">Space</span> to flip · <span className="text-zinc-400">E</span> to explain · <span className="text-zinc-400">← / →</span> to navigate · <span className="text-zinc-400">1 / 2</span> to rate
                                </p>
                                <div className="flex items-center justify-center gap-3 sm:gap-4 max-w-xl mx-auto">
                                    <button
                                        type="button"
                                        onClick={goPrevious}
                                        disabled={!canGoPrevious}
                                        aria-label="Previous card"
                                        className={clsx(
                                            "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border transition-colors",
                                            canGoPrevious
                                                ? "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
                                                : "border-zinc-800 bg-zinc-900/50 text-zinc-700 cursor-not-allowed"
                                        )}
                                    >
                                        <ArrowLeft size={20} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { void handleBinaryChoice(1); }}
                                        className="flex flex-1 items-center justify-center gap-2 sm:gap-3 rounded-full border border-zinc-700 bg-zinc-900/80 px-4 sm:px-6 py-3 sm:py-4 hover:bg-red-500/10 hover:border-red-500/30 transition-colors group"
                                    >
                                        <X size={18} className="text-red-400" />
                                        <span className="text-lg sm:text-xl font-bold text-red-400 tabular-nums">{againCount}</span>
                                        <span className="text-sm text-zinc-500 group-hover:text-red-300/80 hidden sm:inline">Don't know</span>
                                        <kbd className="font-mono text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">1</kbd>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { void handleBinaryChoice(2); }}
                                        className="flex flex-1 items-center justify-center gap-2 sm:gap-3 rounded-full border border-zinc-700 bg-zinc-900/80 px-4 sm:px-6 py-3 sm:py-4 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors group"
                                    >
                                        <span className="text-lg sm:text-xl font-bold text-emerald-400 tabular-nums">{knowCount}</span>
                                        <Check size={18} className="text-emerald-400" />
                                        <span className="text-sm text-zinc-500 group-hover:text-emerald-300/80 hidden sm:inline">Know it</span>
                                        <kbd className="font-mono text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">2</kbd>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { void goNext(); }}
                                        disabled={!canGoNext}
                                        aria-label="Next card"
                                        className={clsx(
                                            "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border transition-colors",
                                            canGoNext
                                                ? "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
                                                : "border-zinc-800 bg-zinc-900/50 text-zinc-700 cursor-not-allowed"
                                        )}
                                        title={currentRating ? 'Next card' : "Next — counts as don't know"}
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
