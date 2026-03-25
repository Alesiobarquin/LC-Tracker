import React, { useState, useMemo } from 'react';
import { allSyntaxCards } from '../data/syntaxCards';
import { SyntaxCardComponent } from './SyntaxCardComponent';
import { Search, ChevronDown, ChevronRight, BookOpen, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { useSyntaxProgress } from '../hooks/useUserData';

export const SyntaxReference: React.FC = () => {
    const { syntaxProgress } = useSyntaxProgress();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'java' | 'javascript' | 'cpp'>('python');
    const [showOnlyWeak, setShowOnlyWeak] = useState(false);

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
        return allSyntaxCards.filter(card => {
            if (card.language !== selectedLanguage) return false;

            const query = searchQuery.toLowerCase();
            if (query) {
                if (!card.description.toLowerCase().includes(query) &&
                    !card.syntax.toLowerCase().includes(query) &&
                    !card.category.toLowerCase().includes(query) &&
                    !card.useCase.toLowerCase().includes(query)) {
                    return false;
                }
            }

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

    // Overall stats
    const totalCardsForLang = allSyntaxCards.filter(c => c.language === selectedLanguage).length;
    const practicedCards = Object.values(syntaxProgress).length;
    const confidentCards = Object.values(syntaxProgress).filter(p => p.confidenceRating === 3).length;

    return (
        <div className="space-y-8 animate-in w-full pb-20">
            <header className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 flex items-center gap-3">
                            <BookOpen className="text-emerald-400" size={32} />
                            Syntax Reference
                        </h1>
                        <p className="text-zinc-400 mt-1">Drill syntax patterns until they become muscle memory.</p>
                    </div>

                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-1">
                        <div className="px-4 py-2 flex flex-col items-center justify-center border-r border-zinc-800/50 min-w-[120px]">
                            <span className="text-sm font-semibold text-zinc-100">{practicedCards} / {totalCardsForLang}</span>
                            <span className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Practiced</span>
                        </div>
                        <div className="px-4 py-2 flex flex-col items-center justify-center min-w-[120px]">
                            <span className="text-sm font-semibold text-emerald-400">{confidentCards}</span>
                            <span className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Confident</span>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search syntax, descriptions, or use cases..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>

                    <div className="flex gap-4">
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value as any)}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none min-w-[140px]"
                        >
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="java" disabled>Java (Coming Soon)</option>
                            <option value="javascript" disabled>JavaScript (Coming Soon)</option>
                        </select>

                        <button
                            onClick={() => setShowOnlyWeak(!showOnlyWeak)}
                            className={clsx(
                                "px-4 py-3 rounded-xl border flex items-center gap-2 transition-colors font-medium text-sm whitespace-nowrap",
                                showOnlyWeak
                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            )}
                        >
                            <AlertCircle size={16} />
                            Weak Areas
                        </button>
                    </div>
                </div>

                {/* Category Jump Anchor Links */}
                <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 gap-2 scrollbar-hide">
                    {categories.map(([category]) => (
                        <a
                            key={category}
                            href={`#cat-${category.replace(/[^a-zA-Z]/g, '')}`}
                            className="px-3 py-1.5 whitespace-nowrap bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-700/50 transition-colors"
                        >
                            {category}
                        </a>
                    ))}
                </div>
            </header>

            <div className="space-y-6 relative">
                {categories.length === 0 ? (
                    <div className="py-20 text-center">
                        <BookOpen size={48} className="mx-auto text-zinc-700 mb-4" />
                        <h3 className="text-xl font-medium text-zinc-400">No syntax cards found</h3>
                        <p className="text-zinc-500 mt-2">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    categories.map(([category, cards]) => {
                        const isCollapsed = collapsedCategories.has(category);
                        const anchorId = `cat-${category.replace(/[^a-zA-Z]/g, '')}`;

                        return (
                            <section key={category} id={anchorId} className="scroll-mt-6">
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="w-full flex items-center justify-between py-3 mb-4 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1 rounded-md bg-zinc-800/80 text-zinc-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                                            {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                        <h2 className="text-xl font-bold text-zinc-100">{category} <span className="text-sm font-normal text-zinc-500 ml-2">({cards.length})</span></h2>
                                    </div>
                                    <div className="h-px bg-zinc-800/80 flex-1 ml-6 group-hover:bg-emerald-500/20 transition-colors" />
                                </button>

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
        </div >
    );
};
