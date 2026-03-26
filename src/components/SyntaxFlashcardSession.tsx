import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SyntaxCard } from '../data/syntaxCards';
import { X, Clock, Keyboard, Trophy, RotateCcw, HelpCircle, ArrowRight, Type, Brain, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useSyntaxProgress } from '../hooks/useUserData';

interface SyntaxFlashcardSessionProps {
    cards: SyntaxCard[];
    title: string;
    onClose: () => void;
}

type Phase = 'prompt' | 'reveal' | 'summary';
type PracticeMode = 'type' | 'self-grade';

interface SessionResult {
    cardId: string;
    rating: 1 | 2 | 3;
}

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
    const [userInput, setUserInput] = useState('');
    const [phase, setPhase] = useState<Phase>('prompt');
    const [practiceMode, setPracticeMode] = useState<PracticeMode>('type');
    const [results, setResults] = useState<SessionResult[]>([]);
    const [startTime] = useState(Date.now());
    const [elapsed, setElapsed] = useState(0);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showHelp, setShowHelp] = useState(true);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const currentCard = queue[currentIndex];
    const isLastCard = currentIndex >= queue.length - 1;
    const againCount = results.filter(r => r.rating === 1).length;
    const hardCount = results.filter(r => r.rating === 2).length;
    const goodCount = results.filter(r => r.rating === 3).length;

    // Timer
    useEffect(() => {
        if (phase === 'summary') return;
        const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
        return () => clearInterval(interval);
    }, [startTime, phase]);

    // Focus input on prompt phase in type mode
    useEffect(() => {
        if (phase === 'prompt' && practiceMode === 'type' && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [phase, practiceMode, currentIndex]);

    const handleSubmit = useCallback(() => {
        if (phase !== 'prompt') return;
        if (practiceMode === 'type' && userInput.trim().length === 0) return;
        setPhase('reveal');
    }, [phase, practiceMode, userInput]);

    const handleRate = useCallback(async (rating: 1 | 2 | 3) => {
        if (!currentCard) return;

        await logSyntaxPractice(currentCard.id, rating);
        const newResults = [...results, { cardId: currentCard.id, rating }];
        setResults(newResults);

        if (rating === 1) {
            setQueue(prev => [...prev, currentCard]);
        }

        if (isLastCard) {
            setPhase('summary');
        } else {
            setCurrentIndex(i => i + 1);
            setUserInput('');
            setPhase('prompt');
        }
    }, [currentCard, logSyntaxPractice, results, isLastCard]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            const isInTextarea = tag === 'TEXTAREA' || tag === 'INPUT';

            if (showExitConfirm) {
                if (e.key === 'Escape') setShowExitConfirm(false);
                return;
            }

            if (phase === 'prompt') {
                if (e.key === 'Escape') { setShowExitConfirm(true); return; }
                if (practiceMode === 'self-grade') {
                    if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit();
                    }
                }
            } else if (phase === 'reveal') {
                if (e.key === 'Escape') { setShowExitConfirm(true); return; }
                if (!isInTextarea) {
                    if (e.key === '1') handleRate(1);
                    if (e.key === '2') handleRate(2);
                    if (e.key === '3') handleRate(3);
                }
            } else if (phase === 'summary') {
                if (e.key === 'Escape' || e.key === 'Enter') onClose();
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [phase, practiceMode, handleSubmit, handleRate, showExitConfirm, onClose]);

    // Prevent body scroll while session is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const renderDiff = () => {
        const code = currentCard?.syntax || '';
        return code.split('').map((char, i) => {
            const userChar = userInput[i];
            const isMissing = userChar === undefined;
            const isCorrect = userChar === char;

            const className = isMissing
                ? 'text-zinc-600 font-mono'
                : isCorrect
                    ? 'text-emerald-400 font-mono'
                    : 'text-red-400 bg-red-400/20 font-mono underline decoration-red-400 underline-offset-4';

            return (
                <span key={i} className={className}>
                    {char === ' ' ? '\u00A0' : char}
                </span>
            );
        });
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
    };

    const sessionMessage = () => {
        const total = results.filter((r, i, a) => a.findIndex(x => x.cardId === r.cardId) === i).length;
        if (goodCount === total) return "Flawless. Every card nailed cold.";
        if (goodCount / total >= 0.8) return "Strong session. The weak spots will come back around.";
        if (goodCount / total >= 0.5) return "Solid effort. Repetition is what makes it stick.";
        return "Tough session — that's the point. They'll stick much better next time.";
    };

    const progressPct = queue.length > 0 ? Math.round((currentIndex / queue.length) * 100) : 100;

    if (!currentCard && phase !== 'summary') return null;

    return (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
            {/* Top bar */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/60 bg-zinc-900/40">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-semibold text-zinc-300 truncate">{title}</span>
                    {phase !== 'summary' && (
                        <span className="text-xs text-zinc-600 font-mono tabular-nums whitespace-nowrap">
                            {currentIndex + 1} / {queue.length}
                            {queue.length > totalUniqueCards && (
                                <span className="text-amber-500/60 ml-1.5">
                                    (+{queue.length - totalUniqueCards} again)
                                </span>
                            )}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    {phase !== 'summary' && (
                        <>
                            {/* Mode toggle */}
                            <div className="flex items-center bg-zinc-800 border border-zinc-700/50 rounded-lg p-0.5" title="Switch between typing from memory or mentally recalling then rating yourself">
                                <button
                                    onClick={() => setPracticeMode('type')}
                                    className={clsx(
                                        'px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
                                        practiceMode === 'type'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                    )}
                                    title="Type the syntax from memory — get a character-level diff"
                                >
                                    <Type size={11} />
                                    Type it
                                </button>
                                <button
                                    onClick={() => setPracticeMode('self-grade')}
                                    className={clsx(
                                        'px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
                                        practiceMode === 'self-grade'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                    )}
                                    title="Mentally recall the answer, reveal it, then rate yourself"
                                >
                                    <Brain size={11} />
                                    Self-grade
                                </button>
                            </div>

                            {/* Elapsed */}
                            <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-mono tabular-nums">
                                <Clock size={11} />
                                {formatTime(elapsed)}
                            </div>
                        </>
                    )}

                    {phase !== 'summary' && (
                        <button
                            onClick={() => setShowHelp(true)}
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                            title="How it works"
                        >
                            <HelpCircle size={16} />
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (phase === 'summary' || results.length === 0) onClose();
                            else setShowExitConfirm(true);
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                        title="Exit (Esc)"
                    >
                        <X size={17} />
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            {phase !== 'summary' && (
                <div className="h-0.5 bg-zinc-800 flex-shrink-0">
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
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
                            <div>
                                <h3 className="text-base font-bold text-zinc-100">How Practice Sessions Work</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">You can re-open this anytime with the <span className="font-mono">?</span> button</p>
                            </div>
                            <button
                                onClick={() => setShowHelp(false)}
                                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            {/* The 3-step flow */}
                            <div>
                                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">The Flow</div>
                                <div className="space-y-2.5">
                                    {[
                                        { step: '1', label: 'Read the prompt', desc: 'You see the description and use case — no code.' },
                                        { step: '2', label: 'Recall & attempt', desc: 'Type the syntax from memory, or mentally recall it (self-grade mode).' },
                                        { step: '3', label: 'Rate yourself honestly', desc: 'Your rating sets when this card appears next. Be honest — it only helps you.' },
                                    ].map(({ step, label, desc }) => (
                                        <div key={step} className="flex gap-3 items-start">
                                            <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400 flex-shrink-0 mt-0.5">
                                                {step}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-zinc-200">{label}</div>
                                                <div className="text-xs text-zinc-500 leading-relaxed">{desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Ratings explained */}
                            <div>
                                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">What the ratings mean</div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                                        <div className="text-sm font-bold text-red-400 mb-1">Again</div>
                                        <div className="text-[11px] text-zinc-500 leading-snug">Blanked or got it wrong. Card re-queues at the end of this session.</div>
                                    </div>
                                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                                        <div className="text-sm font-bold text-amber-400 mb-1">Hard</div>
                                        <div className="text-[11px] text-zinc-500 leading-snug">Recalled it but had to strain. Next review comes back sooner.</div>
                                    </div>
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                                        <div className="text-sm font-bold text-emerald-400 mb-1">Good</div>
                                        <div className="text-[11px] text-zinc-500 leading-snug">Got it clean. Normal spaced repetition interval applied.</div>
                                    </div>
                                </div>
                            </div>

                            {/* Modes explained */}
                            <div>
                                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Practice modes</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex gap-3 items-start bg-zinc-800/40 rounded-xl p-3 border border-zinc-800">
                                        <Type size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-zinc-200 mb-0.5">Type it</div>
                                            <div className="text-[11px] text-zinc-500 leading-snug">Type the syntax from memory. You get a character-level diff showing exactly what you got right or wrong.</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start bg-zinc-800/40 rounded-xl p-3 border border-zinc-800">
                                        <Brain size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-zinc-200 mb-0.5">Self-grade</div>
                                            <div className="text-[11px] text-zinc-500 leading-snug">Mentally recall the answer, then reveal it. Rate how well you knew it. Faster for longer patterns.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Keyboard shortcuts */}
                            <div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-600 pt-1 border-t border-zinc-800">
                                <Keyboard size={11} className="text-zinc-700" />
                                <span><kbd className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">Enter</kbd> submit</span>
                                <span className="text-zinc-800">·</span>
                                <span><kbd className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">1</kbd> <kbd className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">2</kbd> <kbd className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">3</kbd> rate</span>
                                <span className="text-zinc-800">·</span>
                                <span><kbd className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">Space</kbd> reveal <span className="text-zinc-700">(self-grade)</span></span>
                                <span className="text-zinc-800">·</span>
                                <span><kbd className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">Esc</kbd> exit</span>
                            </div>
                        </div>

                        <div className="px-6 pb-6">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="w-full py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                Start Session
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto flex items-start md:items-center justify-center p-5 md:p-8">
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

                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                                <div className="text-2xl font-bold text-red-400">{againCount}</div>
                                <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">Again</div>
                            </div>
                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
                                <div className="text-2xl font-bold text-amber-400">{hardCount}</div>
                                <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">Hard</div>
                            </div>
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                                <div className="text-2xl font-bold text-emerald-400">{goodCount}</div>
                                <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">Good</div>
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

                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-medium transition-colors"
                        >
                            Back to Reference
                        </button>
                    </div>
                ) : (
                    /* ── Active card ── */
                    <div className="max-w-2xl w-full flex flex-col gap-5">
                        {/* Card */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                            {/* Prompt */}
                            <div className="px-7 pt-7 pb-6 border-b border-zinc-800/60">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-medium uppercase tracking-widest">
                                        {currentCard.category}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-zinc-800/50 text-zinc-600 text-[10px] font-mono">
                                        {currentCard.timeComplexity}
                                    </span>
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-zinc-50 leading-snug mb-3">
                                    {currentCard.description}
                                </h2>
                                <p className="text-zinc-500 text-sm leading-relaxed mb-4">
                                    {currentCard.useCase}
                                </p>
                                {/* Variable name hints */}
                                {(() => {
                                    const hints = extractVarHints(currentCard.syntax, currentCard.language);
                                    if (hints.length === 0) return null;
                                    return (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium flex-shrink-0">
                                                Variables:
                                            </span>
                                            {hints.map(v => (
                                                <code
                                                    key={v}
                                                    className="px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/50 text-[11px] font-mono text-zinc-300"
                                                >
                                                    {v}
                                                </code>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Input / Reveal area */}
                            <div className="px-7 py-6">
                                {practiceMode === 'type' ? (
                                    phase === 'prompt' ? (
                                        /* Typing input */
                                        <div>
                                            <div className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase mb-2.5">
                                                Type the syntax
                                            </div>
                                            <div className="rounded-xl border border-zinc-700 bg-zinc-950 overflow-hidden focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
                                                <textarea
                                                    ref={inputRef}
                                                    value={userInput}
                                                    onChange={(e) => {
                                                        if (!e.target.value.includes('\n')) setUserInput(e.target.value);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            if (userInput.trim().length > 0) handleSubmit();
                                                        }
                                                    }}
                                                    className="w-full bg-transparent px-4 py-3.5 text-base text-zinc-100 font-mono placeholder:text-zinc-700 focus:outline-none resize-none border-0"
                                                    placeholder="Type from memory…"
                                                    spellCheck={false}
                                                    autoComplete="off"
                                                    autoCorrect="off"
                                                    autoCapitalize="off"
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-zinc-700">
                                                <Keyboard size={10} />
                                                <span>Enter to submit</span>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Typing reveal */
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase mb-2">
                                                    Your attempt
                                                </div>
                                                <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-sm min-h-[42px] flex flex-wrap break-all items-start content-start gap-0">
                                                    {userInput.length > 0
                                                        ? renderDiff()
                                                        : <span className="text-zinc-600 italic text-xs">No input</span>
                                                    }
                                                </div>
                                            </div>
                                            {userInput.trim() !== currentCard.syntax.trim() && (
                                                <div>
                                                    <div className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase mb-2">
                                                        Correct syntax
                                                    </div>
                                                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed">
                                                        {currentCard.syntax}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                ) : (
                                    /* Self-grade mode */
                                    phase === 'prompt' ? (
                                        <div className="py-2">
                                            <div className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase mb-3">Step 2 of 3 — Recall</div>
                                            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3.5 mb-4 space-y-1.5">
                                                <div className="flex items-start gap-2 text-xs text-zinc-400">
                                                    <CheckCircle2 size={13} className="text-emerald-500/60 flex-shrink-0 mt-0.5" />
                                                    <span>Read the description and use case above.</span>
                                                </div>
                                                <div className="flex items-start gap-2 text-xs text-zinc-400">
                                                    <CheckCircle2 size={13} className="text-emerald-500/60 flex-shrink-0 mt-0.5" />
                                                    <span>Try to recall the exact syntax in your head.</span>
                                                </div>
                                                <div className="flex items-start gap-2 text-xs text-zinc-400">
                                                    <CheckCircle2 size={13} className="text-zinc-700 flex-shrink-0 mt-0.5" />
                                                    <span className="text-zinc-600">When ready, reveal the answer and rate yourself.</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleSubmit}
                                                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                Show Answer
                                                <kbd className="text-[10px] text-zinc-500 font-mono bg-zinc-700 px-1.5 py-0.5 rounded">Space</kbd>
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase mb-2.5">
                                                Syntax
                                            </div>
                                            <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 font-mono text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed">
                                                {currentCard.syntax}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Rating row */}
                        {phase === 'reveal' && (
                            <div>
                                <div className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase mb-3 text-center">
                                    How well did you know it?
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {(
                                        [
                                            { rating: 1, label: 'Again', key: '1', color: 'red', sub: "Blanked — re-queues at end" },
                                            { rating: 2, label: 'Hard', key: '2', color: 'amber', sub: "Struggled — review sooner" },
                                            { rating: 3, label: 'Good', key: '3', color: 'emerald', sub: "Got it — normal interval" },
                                        ] as const
                                    ).map(({ rating, label, key, color, sub }) => (
                                        <button
                                            key={rating}
                                            onClick={() => handleRate(rating)}
                                            className={clsx(
                                                'py-3 px-2 rounded-xl border font-medium transition-colors flex flex-col items-center gap-1',
                                                color === 'red' && 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20',
                                                color === 'amber' && 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20',
                                                color === 'emerald' && 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
                                            )}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-semibold">{label}</span>
                                                <span className={clsx(
                                                    'font-mono text-[10px] opacity-50',
                                                )}>{key}</span>
                                            </div>
                                            <span className={clsx(
                                                'text-[10px] leading-tight text-center font-normal',
                                                color === 'red' && 'text-red-400/60',
                                                color === 'amber' && 'text-amber-400/60',
                                                color === 'emerald' && 'text-emerald-400/60',
                                            )}>{sub}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-zinc-700">
                                    <Keyboard size={10} />
                                    <span>Press 1, 2, or 3 to rate</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
