import React, { useState, useEffect, useRef } from 'react';
import { SyntaxCard } from '../data/syntaxCards';
import { Clock, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useSyntaxProgress } from '../hooks/useUserData';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

interface SyntaxCardComponentProps {
    card: SyntaxCard;
}

export const SyntaxCardComponent: React.FC<SyntaxCardComponentProps> = ({ card }) => {
    const [isPracticeMode, setIsPracticeMode] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const { user } = useUser();
    const navigate = useNavigate();

    const { syntaxProgress, logSyntaxPractice } = useSyntaxProgress();

    const progress = syntaxProgress[card.id];
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isPracticeMode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isPracticeMode]);

    const handlePracticeToggle = () => {
        if (!user && !isPracticeMode) {
            navigate('/login');
            return;
        }
        setIsPracticeMode(!isPracticeMode);
        if (isPracticeMode) {
            // Reset state if leaving practice mode
            setUserInput('');
            setHasSubmitted(false);
        }
    };

    const codeString = card.syntax;

    const renderDiff = () => {
        return codeString.split('').map((char, index) => {
            const userChar = userInput[index];
            const isCorrect = userChar === char;
            const isMissing = userChar === undefined;

            let className = "text-zinc-600 font-mono"; // Default / Missing
            if (!isMissing) {
                className = isCorrect ? "text-emerald-400 font-mono" : "text-red-400 bg-red-400/20 font-mono underline decoration-red-400 underline-offset-4";
            }

            return (
                <span key={index} className={className}>
                    {char === ' ' ? '\u00A0' : char}
                </span>
            );
        });
    };

    const handleRating = (rating: 1 | 2 | 3) => {
        logSyntaxPractice(card.id, rating);
        setIsPracticeMode(false);
        setUserInput('');
        setHasSubmitted(false);
    };

    const highlightCode = (code: string) => {
        // Return raw code string due to innerHTML issues with React state rendering 
        // We'll rely on the uniform monospaced font for clean readability.
        return <span className="font-mono text-zinc-100 whitespace-pre-wrap leading-relaxed">{code}</span>;
    };

    return (
        <div className={clsx(
            "premium-card flex flex-col bg-zinc-900 border border-zinc-800/80 overflow-hidden group transition-all duration-300",
            isPracticeMode ? "ring-1 ring-emerald-500/30" : "hover:border-zinc-700 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        )}>
            {/* Header */}
            <div className="flex justify-between items-start p-4 border-b border-zinc-800/50 bg-zinc-950/30">
                <div className="pr-4">
                    <p className="text-sm font-medium text-emerald-400 mb-1 leading-snug">{card.description}</p>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{card.useCase}</p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-400">
                        <Clock size={12} />
                        <span>{card.timeComplexity}</span>
                    </div>
                    {progress && (
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium tracking-wide">
                            {progress.confidenceRating === 3 && <CheckCircle2 size={12} className="text-emerald-500" />}
                            {progress.confidenceRating === 2 && <span className="w-3 h-3 rounded-full bg-amber-500" />}
                            {progress.confidenceRating === 1 && <span className="w-3 h-3 rounded-full bg-red-500" />}
                            PRACTICED {progress.reviewCount}X
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 relative">
                {/* Toggle Button Container - Absolute positioned */}
                <div className="absolute right-3 -top-3.5 z-10 transition-transform duration-200">
                    <button
                        onClick={handlePracticeToggle}
                        className={clsx(
                            "px-3 py-1 text-xs font-semibold rounded-full shadow-lg border transition-colors flex items-center gap-1",
                            isPracticeMode
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                        )}
                    >
                        {isPracticeMode ? "Close Practice" : "Practice"}
                    </button>
                </div>

                {/* Read Mode */}
                <div className={clsx(
                    "p-4 bg-zinc-950/80 transition-all duration-300 h-full",
                    isPracticeMode ? "hidden" : "block"
                )}>
                    {highlightCode(card.syntax)}
                </div>

                {/* Practice Mode */}
                <div className={clsx(
                    "p-4 flex flex-col gap-4 bg-emerald-950/10 transition-all duration-300 h-full",
                    isPracticeMode ? "block" : "hidden"
                )}>
                    <div>
                        <div className="text-xs font-medium text-emerald-500 mb-2 tracking-wider">TYPE THE SYNTAX:</div>

                        <div className="rounded-lg border border-zinc-800 bg-zinc-950 shadow-inner overflow-hidden focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-colors">
                            <textarea
                                ref={inputRef}
                                value={userInput}
                                onChange={(e) => {
                                    if (e.target.value.includes('\n')) {
                                        setHasSubmitted(true);
                                        return;
                                    }
                                    setUserInput(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (userInput.length > 0) setHasSubmitted(true);
                                    }
                                }}
                                className="w-full min-h-[5.5rem] bg-transparent px-3 py-3 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none resize-none border-0"
                                placeholder="Type the syntax from memory…"
                                spellCheck={false}
                                autoComplete="off"
                                rows={3}
                            />
                            {userInput.length > 0 && (
                                <div className="border-t border-zinc-800/80 px-3 py-2.5 text-sm flex flex-wrap break-all items-center bg-zinc-950/50">
                                    {renderDiff()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={clsx(
                        "pt-3 border-t border-emerald-500/20 transition-all",
                        hasSubmitted && userInput.length > 0 ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}>
                        <div className="text-xs text-zinc-400 mb-2">How well did you know this?</div>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => handleRating(1)} className="py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-md text-xs font-medium transition-colors">
                                Again
                            </button>
                            <button onClick={() => handleRating(2)} className="py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-md text-xs font-medium transition-colors">
                                Hard
                            </button>
                            <button onClick={() => handleRating(3)} className="py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-medium transition-colors">
                                Good
                            </button>
                        </div>
                        {userInput !== card.syntax && (
                            <div className="mt-3 p-2 bg-zinc-950 rounded-md border border-zinc-800">
                                <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Actual Syntax</div>
                                {highlightCode(card.syntax)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
