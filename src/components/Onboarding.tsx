import React, { useState, useEffect, useCallback } from 'react';
import { fetchLeetCodeProfile } from '../services/leetcode';
import {
    BookOpen, CheckCircle, ChevronRight, ChevronLeft, RefreshCw,
    AlertTriangle, Rocket, Shuffle, Swords,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUserSettings } from '../hooks/useUserData';
import type { AppSettings } from '../types';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface OnboardingState {
    leetcodeUsername: string;
    learningMode: AppSettings['learningMode'];
}

interface Props {
    onComplete: () => void;
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const TOTAL_STEPS = 3;

// ─────────────────────────────────────────────────────────
// Step Indicator
// ─────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => (
    <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: total }, (_, i) => {
            const completed = i < current - 1;
            const active = i === current - 1;
            return (
                <React.Fragment key={i}>
                    <div
                        className={clsx(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2',
                            completed && 'bg-emerald-500 border-emerald-500 text-black',
                            active && 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/30 ring-offset-1 ring-offset-black',
                            !completed && !active && 'bg-zinc-900 border-zinc-700 text-zinc-500',
                        )}
                    >
                        {completed ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    {i < total - 1 && (
                        <div
                            className={clsx(
                                'flex-1 h-0.5 transition-all duration-500 max-w-[32px]',
                                i < current - 1 ? 'bg-emerald-500' : 'bg-zinc-800',
                            )}
                        />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// ─────────────────────────────────────────────────────────
// Step 1: Welcome + LeetCode (optional)
// ─────────────────────────────────────────────────────────

const StepLeetCode: React.FC<{
    username: string;
    onChange: (v: string) => void;
    onSkip: () => void;
    onSuccess: (username: string) => void;
}> = ({ username, onChange, onSkip, onSuccess }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [syncCount, setSyncCount] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');

    const handleConnect = async () => {
        if (!username.trim()) return;
        setStatus('loading');
        setErrorMsg('');
        try {
            const subs = await fetchLeetCodeProfile(username.trim());
            setSyncCount(subs.length);
            setStatus('success');
            onSuccess(username.trim());
        } catch {
            setStatus('error');
            setErrorMsg("Couldn't reach LeetCode's API. It may be rate-limited or temporarily unavailable.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-3 pb-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
                    <BookOpen className="text-emerald-400" size={32} />
                </div>
                <h1 className="text-3xl font-bold text-zinc-50 tracking-tight">Welcome to LC Tracker</h1>
                                <p className="text-zinc-400 text-lg">Set your baseline in under a minute. You can adjust everything later in Settings.</p>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    Beta: behavior may change. LeetCode sync uses their public API and only sees recent submissions.
                </p>
            </div>

            <div>
                <h2 className="text-xl font-bold text-zinc-50 mb-1">LeetCode username (optional)</h2>
                <p className="text-zinc-400 text-sm mb-4">Connect to auto-mark recent solves. Skip and add this anytime in Settings.</p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-3 text-sm text-zinc-300 leading-relaxed">
                <p>
                    We match your username against LeetCode&apos;s public API to detect problems you have already solved.
                </p>
                <p className="flex gap-2 items-start text-amber-300">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>
                        The API typically exposes only your <span className="font-semibold">most recent accepted submissions</span>.
                        Older solves may need to be marked manually in the Problem Library.
                    </span>
                </p>
            </div>

            <div className="space-y-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                            onChange(e.target.value);
                            if (status !== 'idle') setStatus('idle');
                        }}
                        placeholder="Your LeetCode username"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                    <button
                        onClick={handleConnect}
                        disabled={status === 'loading' || !username.trim()}
                        className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-colors flex items-center gap-2 shrink-0"
                    >
                        {status === 'loading' ? (
                            <RefreshCw size={16} className="animate-spin" />
                        ) : (
                            <CheckCircle size={16} />
                        )}
                        {status === 'loading' ? 'Connecting…' : 'Connect'}
                    </button>
                </div>

                {status === 'success' && (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                        <CheckCircle size={16} />
                        <span>
                            Connected! Found <span className="font-bold">{syncCount}</span> recent accepted submission{syncCount !== 1 ? 's' : ''}.
                            {syncCount > 0 && ' Matching problems have been auto-marked in your library.'}
                        </span>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 space-y-1">
                        <p className="text-red-400 font-medium flex items-center gap-2">
                            <AlertTriangle size={14} /> Connection failed
                        </p>
                        <p className="text-zinc-400">{errorMsg} You can skip for now and connect later from Settings.</p>
                    </div>
                )}
            </div>

            <button
                onClick={onSkip}
                className="text-zinc-500 hover:text-zinc-300 text-sm underline underline-offset-4 transition-colors"
            >
                Skip for now — I&apos;ll add this in Settings
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// Step 2: Learning mode
// ─────────────────────────────────────────────────────────

const StepLearningMode: React.FC<{
    learningMode: AppSettings['learningMode'];
    onChange: (v: AppSettings['learningMode']) => void;
}> = ({ learningMode, onChange }) => (
    <div className="space-y-6 animate-in fade-in duration-300">
        <div>
            <h2 className="text-2xl font-bold text-zinc-50 mb-1">How do you want to study?</h2>
            <p className="text-zinc-400 text-sm">Pick one — you can switch anytime in Settings under Learning Strategy.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
                type="button"
                onClick={() => onChange('SPRINT')}
                className={clsx(
                    'rounded-2xl border p-5 text-left transition-all duration-200',
                    learningMode === 'SPRINT'
                        ? 'border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-zinc-950'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600',
                )}
            >
                <div className="flex items-center gap-2 mb-2">
                    <Swords className="text-emerald-400" size={22} />
                    <span className="text-lg font-semibold text-zinc-100">Sprint</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                    Focus on one pattern at a time before moving on — structured progression through Phase 1.
                </p>
            </button>

            <button
                type="button"
                onClick={() => onChange('RANDOM')}
                className={clsx(
                    'rounded-2xl border p-5 text-left transition-all duration-200',
                    learningMode === 'RANDOM'
                        ? 'border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-zinc-950'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600',
                )}
            >
                <div className="flex items-center gap-2 mb-2">
                    <Shuffle className="text-emerald-400" size={22} />
                    <span className="text-lg font-semibold text-zinc-100">Random</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                    Mix problems across categories for broader practice — less lock-in to a single sprint.
                </p>
            </button>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────
// Step 3: Launch
// ─────────────────────────────────────────────────────────

const StepLaunch: React.FC<{
    state: OnboardingState;
    onLaunch: () => void;
}> = ({ state, onLaunch }) => {
    const tips = [
        {
            icon: <CheckCircle size={16} className="text-emerald-400" />,
            text: 'Your streak counts when you complete at least one problem or review session per day, with one grace day per week.',
        },
        {
            icon: <RefreshCw size={16} className="text-emerald-400" />,
            text: 'LeetCode sync may only reflect recent submissions — use the Problem Library to mark older solves if needed.',
        },
        {
            icon: <Rocket size={16} className="text-amber-400" />,
            text: 'Export a JSON backup from Settings anytime for portability or an extra offline copy.',
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
                    <Rocket className="text-emerald-400" size={30} />
                </div>
                <h2 className="text-2xl font-bold text-zinc-50">You&apos;re ready</h2>
                <p className="text-zinc-400 text-sm mt-1">
                    Schedule, skill ratings, company tier, and more use sensible defaults — tune them in Plan Customization when you like.
                </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3 text-sm">
                <div className="flex items-start gap-2">
                    <span className="text-zinc-500 mt-0.5 shrink-0">
                        {state.learningMode === 'SPRINT' ? <Swords size={14} /> : <Shuffle size={14} />}
                    </span>
                    <span className="text-zinc-500 w-36 shrink-0">Learning mode</span>
                    <span className="text-zinc-100 font-medium">
                        {state.learningMode === 'SPRINT' ? 'Sprint' : 'Random'}
                    </span>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-zinc-500 mt-0.5 shrink-0"><RefreshCw size={14} /></span>
                    <span className="text-zinc-500 w-36 shrink-0">LeetCode</span>
                    <span className="text-zinc-100 font-medium">
                        {state.leetcodeUsername ? `@${state.leetcodeUsername}` : 'Not connected yet'}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Quick tips</p>
                {tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-3.5">
                        <div className="shrink-0 mt-0.5">{tip.icon}</div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{tip.text}</p>
                    </div>
                ))}
            </div>

            <button
                onClick={onLaunch}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
                <Rocket size={18} />
                Launch
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// Main Onboarding Component
// ─────────────────────────────────────────────────────────

export const Onboarding: React.FC<Props> = ({ onComplete }) => {
    const { setLeetCodeUsername, updateSettings, setOnboardingComplete } = useUserSettings();

    const [step, setStep] = useState(1);

    const [obState, setObState] = useState<OnboardingState>({
        leetcodeUsername: '',
        learningMode: 'SPRINT',
    });

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') e.preventDefault();
        };
        window.addEventListener('keydown', handleKey, true);
        return () => window.removeEventListener('keydown', handleKey, true);
    }, []);

    const update = useCallback(<K extends keyof OnboardingState>(key: K, val: OnboardingState[K]) => {
        setObState((prev) => ({ ...prev, [key]: val }));
    }, []);

    const commitSettingsAndLaunch = async () => {
        if (obState.leetcodeUsername) {
            await setLeetCodeUsername(obState.leetcodeUsername);
        }

        await updateSettings({
            learningMode: obState.learningMode,
        });

        await setOnboardingComplete();
        onComplete();
    };

    const handleSkipStep1 = () => setStep(2);

    const handleStep1Success = (username: string) => {
        update('leetcodeUsername', username);
        setTimeout(() => setStep(2), 1200);
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-zinc-950 border border-zinc-800/60 rounded-3xl shadow-2xl overflow-hidden">
                <div className="px-8 pt-8 pb-0 shrink-0">
                    <StepIndicator current={step} total={TOTAL_STEPS} />
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-4">
                    {step === 1 && (
                        <StepLeetCode
                            username={obState.leetcodeUsername}
                            onChange={(v) => update('leetcodeUsername', v)}
                            onSkip={handleSkipStep1}
                            onSuccess={handleStep1Success}
                        />
                    )}
                    {step === 2 && (
                        <StepLearningMode
                            learningMode={obState.learningMode}
                            onChange={(v) => update('learningMode', v)}
                        />
                    )}
                    {step === 3 && (
                        <StepLaunch
                            state={obState}
                            onLaunch={commitSettingsAndLaunch}
                        />
                    )}
                </div>

                {step !== 3 && (
                    <div className="px-8 py-6 border-t border-zinc-800/50 flex justify-between items-center shrink-0">
                        <button
                            onClick={() => setStep((s) => Math.max(1, s - 1))}
                            disabled={step === 1}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 text-sm"
                        >
                            <ChevronLeft size={16} /> Back
                        </button>

                        {step !== 1 ? (
                            <button
                                onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-all duration-200 text-sm"
                            >
                                Continue <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={() => setStep(2)}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition-all duration-200 text-sm"
                            >
                                Continue without connecting <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
