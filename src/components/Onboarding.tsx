import React, { useState, useEffect, useCallback } from 'react';
import { fetchLeetCodeProfile } from '../services/leetcode';
import {
    BookOpen, CheckCircle, ChevronRight, ChevronLeft, RefreshCw,
    AlertTriangle, Rocket, Shuffle
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUserSettings } from '../hooks/useUserData';
import type { AppSettings } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface OnboardingState {
    leetcodeUsername: string;
    learningMode: AppSettings['learningMode'];
    targetInterviewDate: string;
    targetCurriculum: AppSettings['targetCurriculum'];
    weekdayMinutes: number;
}

interface Props {
    onComplete: () => void;
}

const TOTAL_STEPS = 4;
const ONBOARDING_DRAFT_KEY = 'lc-tracker-onboarding-draft';

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
                            completed && 'bg-accent border-accent text-on-accent',
                            active && 'bg-accent/20 border-accent text-accent ring-2 ring-accent/30 ring-offset-1 ring-offset-canvas',
                            !completed && !active && 'bg-surface border-line-strong text-subtle',
                        )}
                    >
                        {completed ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    {i < total - 1 && (
                        <div
                            className={clsx(
                                'flex-1 h-0.5 transition-all duration-500 max-w-[32px]',
                                i < current - 1 ? 'bg-accent' : 'bg-muted-surface',
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
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 mb-2">
                    <BookOpen className="text-accent" size={22} />
                </div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">Welcome to LC Tracker</h1>
                                <p className="text-muted text-sm">Set your baseline in under a minute. You can adjust everything later in Settings.</p>
                <p className="text-xs text-subtle max-w-md mx-auto">
                    Beta: behavior may change. LeetCode sync uses their public API and only sees recent submissions.
                </p>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">LeetCode username (optional)</h2>
                <p className="text-muted text-sm mb-4">Connect to auto-mark recent solves. Skip and add this anytime in Settings.</p>
            </div>

            <div className="bg-surface/60 border border-line rounded-2xl p-5 space-y-3 text-sm text-body leading-relaxed">
                <p>
                    We match your username against LeetCode&apos;s public API to detect problems you have already solved.
                </p>
                <p className="flex gap-2 items-start text-warning">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>
                        The API typically exposes only your <span className="font-semibold">most recent accepted submissions</span>.
                        Older solves may need to be marked manually in the Problem Library.
                    </span>
                </p>
            </div>

            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                            onChange(e.target.value);
                            if (status !== 'idle') setStatus('idle');
                        }}
                        placeholder="Your LeetCode username"
                        className="min-w-0 flex-1 bg-canvas border border-line rounded-xl px-4 py-3 text-foreground placeholder-subtle focus:outline-none focus:border-accent/50 transition-colors"
                    />
                    <button
                        onClick={handleConnect}
                        disabled={status === 'loading' || !username.trim()}
                        className="px-5 py-3 bg-accent hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed text-on-accent font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0"
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
                    <div className="flex items-center gap-2 text-accent text-sm bg-accent/10 border border-accent/20 rounded-xl px-4 py-3">
                        <CheckCircle size={16} />
                        <span>
                            Connected! Found <span className="font-bold">{syncCount}</span> recent accepted submission{syncCount !== 1 ? 's' : ''}.
                            {syncCount > 0 && ' Matching problems have been auto-marked in your library.'}
                        </span>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-sm bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 space-y-1">
                        <p className="text-danger font-medium flex items-center gap-2">
                            <AlertTriangle size={14} /> Connection failed
                        </p>
                        <p className="text-muted">{errorMsg} You can skip for now and connect later from Settings.</p>
                    </div>
                )}
            </div>

            <button
                onClick={onSkip}
                className="text-subtle hover:text-body text-sm underline underline-offset-4 transition-colors"
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
            <h2 className="text-2xl font-bold text-foreground mb-1">How do you want to study?</h2>
            <p className="text-muted text-sm">Pick one — you can switch anytime in Settings under Learning Strategy.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
                type="button"
                onClick={() => onChange('EXPLORE')}
                className={clsx(
                    'rounded-2xl border p-5 text-left transition-all duration-200',
                    learningMode === 'EXPLORE'
                        ? 'border-accent bg-accent/10 ring-2 ring-accent/30 ring-offset-2 ring-offset-canvas'
                        : 'border-line bg-surface/40 hover:border-line-strong',
                )}
            >
                <div className="flex items-center gap-2 mb-2">
                    <Shuffle className="text-accent" size={22} />
                    <span className="text-lg font-semibold text-foreground">Mixed</span>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                    Mix problems across categories for broader practice — less lock-in to a single pattern.
                </p>
            </button>

            <button
                type="button"
                onClick={() => onChange('CURRICULUM')}
                className={clsx(
                    'rounded-2xl border p-5 text-left transition-all duration-200',
                    learningMode !== 'EXPLORE'
                        ? 'border-accent bg-accent/10 ring-2 ring-accent/30 ring-offset-2 ring-offset-canvas'
                        : 'border-line bg-surface/40 hover:border-line-strong',
                )}
            >
                <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="text-accent" size={22} />
                    <span className="text-lg font-semibold text-foreground">Guided</span>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                    Start with foundations and build representative coverage across patterns. Brief recall and coding checks share your daily budget.
                </p>
            </button>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────
// Step 3: Launch
// ─────────────────────────────────────────────────────────

const StepPlan: React.FC<{
    state: OnboardingState;
    onChangeDate: (v: string) => void;
    onChangeCurriculum: (v: AppSettings['targetCurriculum']) => void;
    onChangeMinutes: (v: number) => void;
}> = ({ state, onChangeDate, onChangeCurriculum, onChangeMinutes }) => (
    <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Set your plan targets</h2>
            <p className="text-sm text-muted">These drive pacing, recommendations, and the sidebar countdown.</p>
        </div>
        <div className="space-y-4">
            <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-subtle">Interview date (optional)</span>
                <input
                    type="date"
                    value={state.targetInterviewDate}
                    onChange={(e) => onChangeDate(e.target.value)}
                    className="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent/50"
                />
            </label>
            <p className="text-xs text-subtle">Leave the date blank if no interview is scheduled. You can add it later.</p>
            <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-subtle">Target curriculum</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {([
                        ['NEET_75', 'NeetCode 75'],
                        ['NEET_150', 'NeetCode 150'],
                        ['NEET_250', 'NeetCode 250'],
                        ['EXTENDED', 'Extended catalog'],
                    ] as const).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => onChangeCurriculum(value)}
                            className={clsx(
                                'text-left rounded-xl border px-4 py-3 text-sm font-semibold transition-colors',
                                state.targetCurriculum === value
                                    ? 'bg-accent/10 border-accent/40 text-accent'
                                    : 'bg-canvas border-line text-body hover:border-line-strong'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-subtle">
                    Weekday study minutes ({state.weekdayMinutes})
                </span>
                <input
                    type="range"
                    min={15}
                    max={120}
                    step={5}
                    value={state.weekdayMinutes}
                    onChange={(e) => onChangeMinutes(Number(e.target.value))}
                    className="w-full"
                />
            </label>
        </div>
    </div>
);

const StepLaunch: React.FC<{
    state: OnboardingState;
    onLaunch: () => void;
    isLaunching: boolean;
    launchError: string | null;
}> = ({ state, onLaunch, isLaunching, launchError }) => {
    const tips = [
        {
            icon: <CheckCircle size={16} className="text-accent" />,
            text: 'Your streak counts when you complete at least one problem or review session per day, with one grace day per week.',
        },
        {
            icon: <RefreshCw size={16} className="text-accent" />,
            text: 'LeetCode sync may only reflect recent submissions — use the Problem Library to mark older solves if needed.',
        },
        {
            icon: <Rocket size={16} className="text-warning" />,
            text: 'Export a JSON backup from Settings anytime for portability or an extra offline copy.',
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 mb-3">
                    <Rocket className="text-accent" size={30} />
                </div>
                <h2 className="text-2xl font-bold text-foreground">You&apos;re ready</h2>
                <p className="text-muted text-sm mt-1">
                    First-week focus: {state.targetCurriculum.replaceAll('_', ' ')} with about {state.weekdayMinutes} weekday minutes, {state.targetInterviewDate ? `with an interview target of ${state.targetInterviewDate}` : 'with no interview scheduled'}.
                </p>
            </div>

            <div className="bg-surface/50 border border-line rounded-2xl p-5 space-y-3 text-sm">
                <div className="flex items-start gap-2">
                    <span className="text-subtle mt-0.5 shrink-0">
                        {state.learningMode === 'EXPLORE' ? <Shuffle size={14} /> : <BookOpen size={14} />}
                    </span>
                    <span className="text-subtle w-36 shrink-0">Learning mode</span>
                    <span className="text-foreground font-medium">
                        {state.learningMode === 'EXPLORE' ? 'Mixed' : 'Guided'}
                    </span>
                </div>
                <div className="flex items-start gap-2">
                    <span className="text-subtle mt-0.5 shrink-0"><RefreshCw size={14} /></span>
                    <span className="text-subtle w-36 shrink-0">LeetCode</span>
                    <span className="text-foreground font-medium">
                        {state.leetcodeUsername ? `@${state.leetcodeUsername}` : 'Not connected yet'}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-semibold text-subtle uppercase tracking-wider">Quick tips</p>
                {tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 bg-surface/40 border border-line/60 rounded-xl p-3.5">
                        <div className="shrink-0 mt-0.5">{tip.icon}</div>
                        <p className="text-xs text-muted leading-relaxed">{tip.text}</p>
                    </div>
                ))}
            </div>

            {launchError ? (
                <p role="alert" className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
                    {launchError}
                </p>
            ) : null}

            <button
                onClick={onLaunch}
                disabled={isLaunching}
                className="w-full py-4 rounded-2xl bg-accent hover:bg-accent disabled:opacity-60 text-on-accent font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 "
            >
                <Rocket size={18} />
                {isLaunching ? 'Launching…' : 'Launch'}
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// Main Onboarding Component
// ─────────────────────────────────────────────────────────

export const Onboarding: React.FC<Props> = ({ onComplete }) => {
    const { setLeetCodeUsername, updateSettings, setOnboardingComplete, setTargetInterviewDate } = useUserSettings();

    const [step, setStep] = useState(1);
    const [isLaunching, setIsLaunching] = useState(false);
    const [launchError, setLaunchError] = useState<string | null>(null);


    const [obState, setObState] = useState<OnboardingState>(() => {
        const defaults: OnboardingState = {
            leetcodeUsername: '',
            learningMode: 'CURRICULUM',
            targetInterviewDate: '',
            targetCurriculum: 'NEET_75',
            weekdayMinutes: 60,
        };
        try {
            const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
            if (!raw) return defaults;
            const parsed = JSON.parse(raw) as Partial<OnboardingState>;
            return { ...defaults, ...parsed };
        } catch {
            return defaults;
        }
    });

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') e.preventDefault();
        };
        window.addEventListener('keydown', handleKey, true);
        return () => window.removeEventListener('keydown', handleKey, true);
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(obState));
        } catch { /* ignore */ }
    }, [obState]);

    const update = useCallback(<K extends keyof OnboardingState>(key: K, val: OnboardingState[K]) => {
        setObState((prev) => ({ ...prev, [key]: val }));
    }, []);

    const commitSettingsAndLaunch = async () => {
        setIsLaunching(true);
        setLaunchError(null);
        try {
            if (obState.leetcodeUsername) {
                await setLeetCodeUsername(obState.leetcodeUsername);
            }

            await updateSettings({
                learningMode: obState.learningMode,
                targetCurriculum: obState.targetCurriculum,
                studySchedule: {
                    weekdayMinutes: obState.weekdayMinutes,
                } as AppSettings['studySchedule'],
            });
            await setTargetInterviewDate(obState.targetInterviewDate);

            await setOnboardingComplete();
            localStorage.removeItem(ONBOARDING_DRAFT_KEY);
            onComplete();
        } catch {
            setLaunchError('Could not save your setup. Check your connection and try again.');
            setIsLaunching(false);
        }
    };

    const handleSkipStep1 = () => setStep(2);

    const handleStep1Success = (username: string) => {
        update('leetcodeUsername', username);
        setTimeout(() => setStep(2), 1200);
    };

    return (
        <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-surface border border-line rounded-3xl  overflow-hidden">
                <div className="px-5 sm:px-8 pt-5 pb-0 shrink-0">
                    <div className="flex justify-between items-center mb-6"><span className="text-sm font-medium text-muted">Set up your study plan</span><ThemeSwitcher /></div>
                    <StepIndicator current={step} total={TOTAL_STEPS} />
                </div>

                <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-4">
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
                        <StepPlan
                            state={obState}
                            onChangeDate={(v) => update('targetInterviewDate', v)}
                            onChangeCurriculum={(v) => update('targetCurriculum', v)}
                            onChangeMinutes={(v) => update('weekdayMinutes', v)}
                        />
                    )}
                    {step === 4 && (
                        <StepLaunch
                            state={obState}
                            onLaunch={commitSettingsAndLaunch}
                            isLaunching={isLaunching}
                            launchError={launchError}
                        />
                    )}
                </div>

                {step !== 4 && (
                    <div className="px-5 sm:px-8 py-6 border-t border-line/50 flex gap-3 justify-between items-center shrink-0">
                        <button
                            onClick={() => setStep((s) => Math.max(1, s - 1))}
                            disabled={step === 1}
                            className={clsx("flex items-center gap-2 px-4 py-2.5 rounded-lg border border-line text-muted hover:text-body hover:border-line-strong transition-colors text-sm", step === 1 && "hidden")}
                        >
                            <ChevronLeft size={16} /> Back
                        </button>

                        {step !== 1 ? (
                            <button
                                onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent text-on-accent font-semibold transition-all duration-200 text-sm"
                            >
                                Continue <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={() => setStep(2)}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-muted-surface hover:bg-hover-surface text-body font-semibold transition-all duration-200 text-sm"
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
