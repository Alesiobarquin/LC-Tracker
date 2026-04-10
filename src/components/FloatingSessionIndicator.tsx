import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { allProblems } from '../data/problems';
import { ArrowRight, X, Timer } from 'lucide-react';

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
            setElapsed(Math.floor((Date.now() - activeSession.startTimestamp) / 1000));
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [activeSession]);

    // Hide if no active session OR if currently on the timer page
    if (!activeSession || location.pathname.startsWith('/timer')) return null;

    const prob = allProblems.find(p => p.id === activeSession.problemId);
    const probName = prob?.title ?? 'Problem';
    const truncated = probName.length > 22 ? probName.slice(0, 22) + '…' : probName;

    return (
        <div className="fixed bottom-5 right-5 z-50 select-none">
            <div className="relative">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-emerald-500/25 blur-lg opacity-60 animate-[pulse_2.5s_ease-in-out_infinite]" />

                <div
                    className="relative bg-zinc-900 border border-emerald-500/40 rounded-2xl px-4 py-3 flex flex-col gap-2 min-w-[220px] max-w-[280px] shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
                >
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <Timer size={14} className="text-emerald-400 shrink-0" />
                        <span className="text-zinc-100 text-sm font-semibold truncate" title={probName}>
                            {truncated}
                        </span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold text-sm shrink-0">
                        {fmtTime(elapsed)}
                    </span>
                </div>

                {/* Session type badge */}
                <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${activeSession.isColdSolve
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : activeSession.isReview
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                        {activeSession.isColdSolve ? 'Cold Solve' : activeSession.isReview ? 'Review' : 'New Problem'}
                    </span>
                    <span className="text-zinc-600 text-[10px]">in progress</span>
                </div>

                {/* Buttons */}
                {!confirmAbandon ? (
                    <div className="flex gap-2 mt-1">
                        <button
                            onClick={() => navigate('/timer')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-lg text-xs font-semibold transition-colors border border-emerald-500/20"
                        >
                            <ArrowRight size={12} />
                            Return
                        </button>
                        <button
                            onClick={() => setConfirmAbandon(true)}
                            className="flex items-center justify-center w-8 h-8 bg-zinc-800/70 hover:bg-red-500/15 text-zinc-500 hover:text-red-400 rounded-lg transition-colors border border-zinc-700/50"
                            title="Abandon session"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1.5 mt-1">
                        <p className="text-[11px] text-red-400 text-center font-medium">Abandon? No data will be saved.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { abandonSession(); setConfirmAbandon(false); }}
                                className="flex-1 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition-colors border border-red-500/30"
                            >
                                Yes, abandon
                            </button>
                            <button
                                onClick={() => setConfirmAbandon(false)}
                                className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors border border-zinc-700"
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
