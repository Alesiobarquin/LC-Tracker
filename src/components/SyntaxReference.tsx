import { preferenceStorage } from '../lib/safeStorage';
import React, { useState, useMemo, useEffect } from 'react';
import { allSyntaxCards, SyntaxCard } from '../data/syntaxCards';
import { SyntaxCardComponent } from './SyntaxCardComponent';
import { SyntaxFlashcardSession, SessionOrderMode } from './SyntaxFlashcardSession';
import { Search, ChevronDown, ChevronRight, BookOpen, AlertCircle, Zap, Layers, Shuffle } from 'lucide-react';
import { useUser } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { useSyntaxProgress } from '../hooks/useUserData';

const SESSION_ORDER_KEY = 'syntax-session-order';

const readStoredOrderMode = (): SessionOrderMode => {
    if (typeof window === 'undefined') return 'random';
    return preferenceStorage.getItem(SESSION_ORDER_KEY) === 'category' ? 'category' : 'random';
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
        .join('\n')
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
    const [viewMode, setViewMode] = useState<'due' | 'browse'>('due');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'java' | 'javascript' | 'cpp'>('python');
    const [showOnlyWeak, setShowOnlyWeak] = useState(false);
    const [sessionCards, setSessionCards] = useState<SyntaxCard[] | null>(null);
    const [sessionTitle, setSessionTitle] = useState('');
    const [sessionOrderMode, setSessionOrderMode] = useState<SessionOrderMode>(readStoredOrderMode);

    useEffect(() => {
        preferenceStorage.setItem(SESSION_ORDER_KEY, sessionOrderMode);
    }, [sessionOrderMode]);

    // Search is for the full reference — jump out of Due-now when the user types.
    useEffect(() => {
        if (searchQuery.trim()) {
            setViewMode('browse');
        }
    }, [searchQuery]);

    // Collapse state for categories
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    const toggleCategory = (category: string) => {
        setCollapsedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) newSet.delete(category);
            else newSet.add(category);
            return newSet;
        });
    };

    // Filter cards
    const filteredCards = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return allSyntaxCards.filter(card => {
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
        filteredCards.forEach(card => {
            if (!map.has(card.category)) map.set(card.category, []);
            map.get(card.category)!.push(card);
        });
        return Array.from(map.entries());
    }, [filteredCards]);

    // Due cards: never practiced OR nextReviewAt <= now, for current language
    const dueCards = useMemo(() => {
        const now = new Date();
        const query = searchQuery.trim().toLowerCase();
        return allSyntaxCards.filter(card => {
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
            navigate('/login');
            return;
        }
        if (cards.length === 0) return;
        setSessionCards(cards);
        setSessionTitle(title);
    };

    // Overall stats for the selected language only
    const totalCardsForLang = allSyntaxCards.filter(c => c.language === selectedLanguage).length;
    const langCardIds = useMemo(
        () => new Set(allSyntaxCards.filter(c => c.language === selectedLanguage).map(c => c.id)),
        [selectedLanguage]
    );
    const practicedCards = Object.keys(syntaxProgress).filter(id => langCardIds.has(id)).length;
    const confidentCards = Object.entries(syntaxProgress).filter(
        ([id, p]) => langCardIds.has(id) && p.confidenceRating === 3
    ).length;

    return (
        <>
        {sessionCards && (
            <SyntaxFlashcardSession
                cards={sessionCards}
                title={sessionTitle}
                orderMode={sessionOrderMode}
                onClose={() => setSessionCards(null)}
            />
        )}
        <div className="space-y-8 animate-in w-full pb-20">
            <header className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                            <BookOpen className="text-muted" size={22} />
                            Syntax Reference
                        </h1>
                        <p className="text-sm text-muted mt-2">Recall the syntax you use, then compare it with the reference.</p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap justify-start md:justify-end w-full md:w-auto sticky top-0 z-10 py-2 bg-canvas/90 backdrop-blur-sm md:static md:bg-transparent md:backdrop-blur-none md:py-0">
                        <div className="flex items-center gap-1 bg-canvas border border-line p-1 rounded-xl mr-auto md:mr-0" role="tablist" aria-label="Syntax study mode">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={viewMode === 'due'}
                                onClick={() => setViewMode('due')}
                                className={clsx(
                                    'px-3 py-2 rounded-lg text-xs font-semibold min-h-11 transition-colors',
                                    viewMode === 'due' ? 'bg-accent/15 text-accent' : 'text-subtle hover:text-body'
                                )}
                            >
                                Due now ({dueCards.length})
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={viewMode === 'browse'}
                                onClick={() => setViewMode('browse')}
                                className={clsx(
                                    'px-3 py-2 rounded-lg text-xs font-semibold min-h-11 transition-colors',
                                    viewMode === 'browse' ? 'bg-accent/15 text-accent' : 'text-subtle hover:text-body'
                                )}
                            >
                                Browse all
                            </button>
                        </div>
                        {/* Practice session launchers — due first */}
                        <button
                            onClick={() => launchSession(dueCards, `Due Now · ${selectedLanguage}`)}
                            disabled={dueCards.length === 0}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors min-h-11",
                                dueCards.length > 0
                                    ? "bg-accent border-accent text-on-accent hover:bg-accent-strong"
                                    : "bg-muted-surface/50 border-line-strong/50 text-subtle cursor-not-allowed"
                            )}
                        >
                            <Zap size={15} />
                            Practice Due
                            <span className={clsx(
                                "px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums",
                                dueCards.length > 0 ? "text-on-accent" : "bg-hover-surface text-subtle"
                            )}>
                                {dueCards.length}
                            </span>
                        </button>

                        <button
                            onClick={() => launchSession(
                                allSyntaxCards.filter(c => c.language === selectedLanguage),
                                `All ${selectedLanguage} cards`
                            )}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line-strong bg-muted-surface/50 text-body hover:bg-hover-surface/70 text-sm font-medium transition-colors"
                        >
                            <Layers size={15} />
                            Practice All
                        </button>

                        {/* Stats panel */}
                        <p className="text-xs text-muted w-full md:w-auto py-1">
                            <span className="font-medium text-body">{practicedCards} / {totalCardsForLang}</span> practiced
                            {' · '}
                            <span className="font-medium text-body">{confidentCards}</span> confident
                        </p>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search syntax, descriptions, or use cases..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface border border-line rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-subtle focus:outline-none focus:border-accent/50 transition-colors"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <select
                            aria-label="Syntax language"
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value as any)}
                            className="bg-surface border border-line rounded-lg px-3 py-3 text-foreground focus:outline-none focus:border-accent/50 transition-colors w-[132px]"
                        >
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="java" disabled>Java (Coming Soon)</option>
                            <option value="javascript" disabled>JavaScript (Coming Soon)</option>
                        </select>

                        <button
                            onClick={() => setShowOnlyWeak(!showOnlyWeak)}
                            aria-pressed={showOnlyWeak}
                            className={clsx(
                                "px-4 py-3 rounded-xl border flex items-center gap-2 transition-colors font-medium text-sm whitespace-nowrap",
                                showOnlyWeak
                                    ? "bg-warning/10 border-warning/30 text-warning hover:bg-warning/20"
                                    : "bg-surface border-line text-body hover:bg-muted-surface"
                            )}
                        >
                            <AlertCircle size={16} />
                            Weak Areas
                        </button>

                        <div className="flex rounded-xl border border-line bg-surface p-1">
                            <button
                                type="button"
                                onClick={() => setSessionOrderMode('random')}
                                aria-pressed={sessionOrderMode === 'random'}
                                className={clsx(
                                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap",
                                    sessionOrderMode === 'random'
                                        ? "bg-accent/10 text-accent"
                                        : "text-muted hover:text-body"
                                )}
                            >
                                <Shuffle size={14} />
                                Random
                            </button>
                            <button
                                type="button"
                                onClick={() => setSessionOrderMode('category')}
                                aria-pressed={sessionOrderMode === 'category'}
                                className={clsx(
                                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap",
                                    sessionOrderMode === 'category'
                                        ? "bg-accent/10 text-accent"
                                        : "text-muted hover:text-body"
                                )}
                            >
                                <Layers size={14} />
                                By category
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Jump Anchor Links */}
                {viewMode === 'browse' && (
                <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 gap-2 scrollbar-hide">
                    {categories.map(([category]) => (
                        <a
                            key={category}
                            href={`#cat-${category.replace(/[^a-zA-Z]/g, '')}`}
                            className="px-3 py-1.5 whitespace-nowrap bg-muted-surface/50 hover:bg-hover-surface text-body text-xs font-medium rounded-lg border border-line-strong/50 transition-colors"
                        >
                            {category}
                        </a>
                    ))}
                </div>
                )}
            </header>

            <div className="space-y-6 relative">
                {viewMode === 'due' ? (
                    dueCards.length === 0 ? (
                        <div className="py-16 text-center premium-card border border-line">
                            <Zap size={40} className="mx-auto text-accent mb-4" />
                            <h3 className="text-xl font-medium text-foreground">Nothing due right now</h3>
                            <p className="text-subtle text-sm mt-2 max-w-md mx-auto">
                                Catch up later or switch to Browse all to study reference cards.
                            </p>
                            <button
                                type="button"
                                onClick={() => setViewMode('browse')}
                                className="mt-4 px-4 py-2 rounded-xl bg-muted-surface hover:bg-hover-surface text-body text-sm font-medium"
                            >
                                Browse all
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold text-foreground">Due now · {selectedLanguage}</h2>
                                <button
                                    type="button"
                                    onClick={() => launchSession(dueCards, `Due Now · ${selectedLanguage}`)}
                                    className="px-4 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm font-semibold"
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
                    <div className="py-20 text-center">
                        <BookOpen size={48} className="mx-auto text-body mb-4" />
                        <h3 className="text-xl font-medium text-muted">No syntax cards found</h3>
                        <p className="text-subtle mt-2">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    categories.map(([category, cards]) => {
                        const isCollapsed = collapsedCategories.has(category);
                        const anchorId = `cat-${category.replace(/[^a-zA-Z]/g, '')}`;

                        return (
                            <section key={category} id={anchorId} className="scroll-mt-6">
                                <div className="flex items-center gap-3 py-3 mb-4">
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className="flex items-center gap-3 group flex-1 min-w-0"
                                    >
                                        <div className="p-1 rounded-md bg-muted-surface/80 text-muted group-hover:text-accent group-hover:bg-accent/10 transition-colors flex-shrink-0">
                                            {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                        <h2 className="text-xl font-bold text-foreground whitespace-nowrap">{category} <span className="text-sm font-normal text-subtle ml-2">({cards.length})</span></h2>
                                        <div className="h-px bg-muted-surface/80 flex-1 ml-2 group-hover:bg-accent/20 transition-colors" />
                                    </button>
                                    <button
                                        onClick={() => launchSession(cards, category)}
                                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line-strong/60 bg-muted-surface/50 hover:bg-hover-surface/60 text-muted hover:text-accent text-xs font-medium transition-colors"
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
                                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                                                {cards.map(card => (
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
        </>
    );
};
