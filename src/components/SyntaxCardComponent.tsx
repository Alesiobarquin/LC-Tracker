import React, { useState, useEffect, useRef } from 'react';
import { SyntaxCard } from '../data/syntaxCards';
import { Clock, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useSyntaxProgress } from '../hooks/useUserData';
import { useUser } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { SyntaxHighlightedCode } from './SyntaxHighlightedCode';

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

            let className = "text-subtle font-mono"; // Default / Missing
            if (!isMissing) {
                className = isCorrect ? "text-accent font-mono" : "text-danger bg-danger/20 font-mono underline decoration-danger underline-offset-4";
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

    const highlightCode = (code: string) => (
        <SyntaxHighlightedCode code={code} language={card.language} size="sm" />
    );

    return (
        <div className={clsx(
            "premium-card flex flex-col bg-surface border border-line/80 overflow-hidden group transition-all duration-300",
            isPracticeMode ? "ring-1 ring-accent/30" : "hover:border-line-strong "
        )}>
            {/* Header */}
            <div className="flex justify-between items-start p-4 border-b border-line/50 bg-canvas/30">
                <div className="pr-4">
                    <h3 className="text-sm font-semibold text-foreground mb-1 leading-snug">{card.description}</h3>
                    <p className="text-xs text-subtle line-clamp-2 leading-relaxed">{card.useCase}</p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted-surface/50 border border-line-strong/50 text-xs text-muted">
                        <Clock size={12} />
                        <span>{card.timeComplexity}</span>
                    </div>
                    {progress && (
                        <div className="flex items-center gap-1 text-[10px] text-subtle font-medium tracking-wide">
                            {progress.confidenceRating === 3 && <CheckCircle2 size={12} className="text-accent" />}
                            {progress.confidenceRating === 2 && <span className="w-3 h-3 rounded-full bg-warning" />}
                            {progress.confidenceRating === 1 && <span className="w-3 h-3 rounded-full bg-danger" />}
                            PRACTICED {progress.reviewCount}X
                        </div>
                    )}
                    <button
                        onClick={handlePracticeToggle}
                        aria-pressed={isPracticeMode}
                        className={clsx(
                            "px-3 py-2 min-h-10 text-xs font-medium rounded-md border transition-colors",
                            isPracticeMode
                                ? "bg-accent/10 text-accent border-accent/30 hover:bg-accent/20"
                                : "bg-surface text-body border-line-strong hover:bg-muted-surface"
                        )}
                    >
                        {isPracticeMode ? "Close Practice" : "Practice"}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 relative">
                {/* Read Mode */}
                <div className={clsx(
                    "p-4 bg-canvas/80 transition-all duration-300 h-full",
                    isPracticeMode ? "hidden" : "block"
                )}>
                    {highlightCode(card.syntax)}
                </div>

                {/* Practice Mode */}
                <div className={clsx(
                    "p-4 flex flex-col gap-4 bg-surface transition-all duration-300 h-full",
                    isPracticeMode ? "block" : "hidden"
                )}>
                    <div>
                        <div className="text-sm font-medium text-body mb-2">Type the syntax from memory</div>

                        <div className="rounded-lg border border-line-strong bg-surface overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-colors">
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
                                className="w-full min-h-[5.5rem] bg-transparent px-3 py-3 text-sm text-foreground font-mono placeholder:text-subtle focus:outline-none resize-none border-0"
                                placeholder="Type the syntax from memory…"
                                spellCheck={false}
                                autoComplete="off"
                                rows={3}
                            />
                            {userInput.length > 0 && (
                                <div className="border-t border-line/80 px-3 py-2.5 text-sm flex flex-wrap break-all items-center bg-canvas/50">
                                    {renderDiff()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={clsx(
                        "pt-3 border-t border-accent/20 transition-all",
                        hasSubmitted && userInput.length > 0 ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}>
                        <div className="text-xs text-muted mb-2">How well did you know this?</div>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => handleRating(1)} className="py-1.5 px-2 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 rounded-md text-xs font-medium transition-colors">
                                Again
                            </button>
                            <button onClick={() => handleRating(2)} className="py-1.5 px-2 bg-warning/10 hover:bg-warning/20 text-warning border border-warning/20 rounded-md text-xs font-medium transition-colors">
                                Hard
                            </button>
                            <button onClick={() => handleRating(3)} className="py-1.5 px-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 rounded-md text-xs font-medium transition-colors">
                                Good
                            </button>
                        </div>
                        {userInput !== card.syntax && (
                            <div className="mt-3 p-2 bg-canvas rounded-md border border-line">
                                <div className="text-[10px] text-subtle mb-1 uppercase tracking-wider">Actual Syntax</div>
                                {highlightCode(card.syntax)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
