import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { problemMap } from '../data/problems';
import { ArrowRight, X, Timer } from 'lucide-react';
import { codingElapsedSeconds } from '../utils/sessionTime';

interface FloatingSessionIndicatorProps {}

const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

export const FloatingSessionIndicator: React.FC<FloatingSessionIndicatorProps> = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const activeSession = useStore((state) => state.activeSession);
    const abandonSession = useStore((state) => state.abandonSession);

    const [elapsed, setElapsed] = useState(0);
    const [confirmAbandon, setConfirmAbandon] = useState(false);

    useEffect(() => {
        if (!activeSession) {
            setElapsed(0);
            setConfirmAbandon(false);
            return;
        }
        const tick = () => {
            setElapsed(codingElapsedSeconds(activeSession));
        };
        tick();
        // Keep ticking while paused so the display stays frozen (currentPause grows with wall clock
        // but is subtracted — net elapsed stays constant). Interval still needed for resume updates.
        const id = window.setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [activeSession]);

    // Hide if no active session, on the timer page, or on dashboard (Timer renders inline there)
    if (
        !activeSession ||
        location.pathname.startsWith('/timer') ||
        location.pathname === '/dashboard' ||
        location.pathname === '/'
    ) return null;

    // ⚡ Bolt Optimization: Using O(1) problemMap instead of O(N) allProblems.find()
    const prob = problemMap[activeSession.problemId];
    const probName = prob?.title ?? 'Problem';
    const truncated = probName.length > 22 ? probName.slice(0, 22) + '…' : probName;
    const isPaused = activeSession.pausedAt != null;

    return (
        <div className="fixed bottom-20 lg:bottom-5 right-4 lg:right-5 z-50 select-none">
            <div className="relative">
                <div
                    className="relative bg-surface border border-line-strong rounded-lg px-4 py-3 flex flex-col gap-2 min-w-[220px] max-w-[280px]"
                >
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <Timer size={14} className="text-accent shrink-0" />
                        <span className="text-foreground text-sm font-semibold truncate" title={probName}>
                            {truncated}
                        </span>
                    </div>
                    <span className="font-mono text-accent font-bold text-sm shrink-0">
                        {fmtTime(elapsed)}
                    </span>
                </div>

                {/* Session type badge */}
                <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono ${activeSession.isColdSolve
                            ? 'text-body'
                            : activeSession.isReview
                                ? 'text-body'
                                : 'text-body'
                        }`}>
                        {activeSession.isColdSolve ? 'Cold Solve' : activeSession.isReview ? 'Review' : 'New Problem'}
                    </span>
                    <span className="text-subtle text-[10px]">{isPaused ? 'paused' : 'in progress'}</span>
                </div>

                {/* Buttons */}
                {!confirmAbandon ? (
                    <div className="flex gap-2 mt-1">
                        <button
                            onClick={() => navigate('/timer')}
                            className="flex-1 flex items-center justify-center gap-1.5 min-h-10 py-1.5 px-3 bg-accent hover:bg-accent-strong text-on-accent rounded-lg text-xs font-semibold transition-colors"
                        >
                            <ArrowRight size={12} />
                            Return
                        </button>
                        <button
                            onClick={() => setConfirmAbandon(true)}
                            className="flex items-center justify-center w-10 h-10 bg-surface hover:bg-danger/10 text-muted hover:text-danger rounded-lg transition-colors border border-line"
                            aria-label="Abandon session"
                            title="Abandon session"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1.5 mt-1">
                        <p className="text-[11px] text-danger text-center font-medium">Clear the local session? A save already sent may have completed.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { abandonSession(); setConfirmAbandon(false); }}
                                className="flex-1 py-1.5 bg-danger/20 hover:bg-danger/30 text-danger rounded-lg text-xs font-semibold transition-colors border border-danger/30"
                            >
                                Yes, abandon
                            </button>
                            <button
                                onClick={() => setConfirmAbandon(false)}
                                className="flex-1 py-1.5 bg-muted-surface hover:bg-hover-surface text-body rounded-lg text-xs font-medium transition-colors border border-line-strong"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};
