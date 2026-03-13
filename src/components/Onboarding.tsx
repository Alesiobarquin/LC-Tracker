import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { fetchLeetCodeProfile } from '../services/leetcode';
import { PHASE_1_CATEGORIES } from '../data/problems';
import { problems } from '../data/problems';
import { addDays, format, differenceInWeeks } from 'date-fns';
import {
    BookOpen, CheckCircle, ChevronRight, ChevronLeft, RefreshCw,
    AlertTriangle, Zap, Target, Briefcase, Code2, Calendar,
    Rocket, Star, Database, Clock, Brain
} from 'lucide-react';
import { clsx } from 'clsx';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type SkillLevel = 'not_familiar' | 'some_exposure' | 'comfortable';

interface OnboardingState {
    // Step 1
    disclaimerChecked: boolean;
    // Step 2
    leetcodeUsername: string;
    // Step 3
    targetDate: string;
    weekdayMinutes: number;
    weekendMinutes: number;
    restDay: number;
    // Step 4
    skillLevels: Record<string, SkillLevel>;
    // Step 5
    targetTier: 'FAANG' | 'FINTECH' | 'GENERAL' | 'MIXED';
    interviewType: 'INTERNSHIP' | 'FULL_TIME';
    language: 'Python' | 'Java' | 'JavaScript';
    srAggressiveness: 'RELAXED' | 'AGGRESSIVE';
}

interface Props {
    onComplete: () => void;
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const TOTAL_STEPS = 6;

const CATEGORY_EXAMPLES: Record<string, string> = {
    'Arrays & Hashing': 'e.g. Two Sum',
    'Two Pointers': 'e.g. Valid Palindrome',
    'Sliding Window': 'e.g. Best Time to Buy & Sell Stock',
    'Stack': 'e.g. Valid Parentheses',
    'Binary Search': 'e.g. Binary Search',
    'Linked List': 'e.g. Reverse Linked List',
    'Trees': 'e.g. Maximum Depth of Binary Tree',
    'Heap / Priority Queue': 'e.g. Find Median from Data Stream',
};

const TIER_OPTIONS = [
    {
        value: 'FAANG' as const,
        label: 'FAANG',
        desc: 'Highest difficulty — graphs and DP heavy',
        color: 'from-red-500/20 to-red-500/5',
        border: 'border-red-500/40',
        dot: 'bg-red-400',
    },
    {
        value: 'FINTECH' as const,
        label: 'Fintech',
        desc: 'Amex, Bloomberg, Stripe — hash maps and arrays most common',
        color: 'from-blue-500/20 to-blue-500/5',
        border: 'border-blue-500/40',
        dot: 'bg-blue-400',
    },
    {
        value: 'GENERAL' as const,
        label: 'General SWE',
        desc: 'Balanced across all difficulties',
        color: 'from-emerald-500/20 to-emerald-500/5',
        border: 'border-emerald-500/40',
        dot: 'bg-emerald-400',
    },
    {
        value: 'MIXED' as const,
        label: 'Mixed / Broad',
        desc: 'Applying broadly — covers all bases',
        color: 'from-purple-500/20 to-purple-500/5',
        border: 'border-purple-500/40',
        dot: 'bg-purple-400',
    },
];

const SR_OPTIONS = [
    {
        value: 'RELAXED' as const,
        label: 'Relaxed',
        desc: 'Reviews: Day 3 → 7 → 14 → 30. Lower pressure, good for beginners.',
    },
    {
        value: 'AGGRESSIVE' as const,
        label: 'Aggressive',
        desc: 'Reviews: Day 1 → 3 → 7 → 14. Faster retention, higher daily load.',
    },
];

// ─────────────────────────────────────────────────────────
// Pacing helpers
// ─────────────────────────────────────────────────────────

function computePhase1Completion(
    weekdayMinutes: number,
    weekendMinutes: number,
    restDay: number,
    fromDate: Date,
): Date {
    // NeetCode 75 Phase 1 unsolved count
    const phase1Problems = problems.filter(
        (p) => p.isNeetCode75 && PHASE_1_CATEGORIES.includes(p.category as any),
    );
    const total = phase1Problems.length; // ~47

    // Approx problems per day: 1 problem ≈ 45 min avg
    // weekday vs weekend allocation
    const MINS_PER_PROBLEM = 45;
    const weekdayPPD = weekdayMinutes / MINS_PER_PROBLEM;
    const weekendPPD = weekendMinutes / MINS_PER_PROBLEM;

    let problemsDone = 0;
    let date = new Date(fromDate);
    let iter = 0;
    while (problemsDone < total && iter < 1000) {
        const dow = date.getDay();
        if (dow === restDay) {
            // rest day — no new problems
        } else {
            const isWeekend = dow === 0 || dow === 6;
            problemsDone += isWeekend ? weekendPPD : weekdayPPD;
        }
        if (problemsDone < total) {
            date = addDays(date, 1);
        }
        iter++;
    }
    return date;
}

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
// Step 1: Welcome & Beta Disclaimer
// ─────────────────────────────────────────────────────────

const Step1: React.FC<{
    checked: boolean;
    onChange: (v: boolean) => void;
}> = ({ checked, onChange }) => (
    <div className="space-y-6 animate-in fade-in duration-300">
        {/* Hero */}
        <div className="text-center space-y-3 pb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
                <BookOpen className="text-emerald-400" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-zinc-50 tracking-tight">LC Tracker</h1>
            <p className="text-zinc-400 text-lg">Your personalized LeetCode prep engine — built around your schedule.</p>
        </div>

        {/* Disclaimer */}
        <div className="relative rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <AlertTriangle size={16} />
                A few things to know before you start
            </div>

            <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
                <p>
                    <span className="font-medium text-zinc-100">This app is in beta</span> and is actively being developed.
                    New features and fixes ship regularly.
                </p>

                <p>
                    <span className="font-medium text-zinc-100">All your data lives in your browser's local storage</span> —
                    including solved problems, ratings, streaks, notes, and every preference you set. It never touches a server.
                </p>

                <div className="border-l-2 border-amber-500/40 pl-4 space-y-1.5 text-zinc-400">
                    <p>🧹 If you clear your browser cache or cookies, your data is <span className="text-amber-300 font-medium">permanently gone</span>.</p>
                    <p>💻 Your data won't carry over if you switch to a different browser or device.</p>
                    <p>🕵️ Private/incognito mode won't save data between sessions — it resets when you close the window.</p>
                    <p>☁️ There's no account system or cloud backup right now, but one is planned for a future version.</p>
                </div>

                <p>
                    To protect your data: <span className="text-zinc-100 font-medium">avoid clearing your browser cache</span> while using the app, and
                    periodically <span className="text-emerald-400 font-medium">export your data from Settings</span> as a manual backup.
                    The Settings page has an Export Data button that downloads everything as a JSON file.
                </p>
            </div>
        </div>

        {/* Checkbox gate */}
        <label className="flex items-start gap-3 cursor-pointer group select-none">
            <div className="mt-0.5 shrink-0">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only"
                />
                <div
                    className={clsx(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200',
                        checked
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-zinc-600 group-hover:border-emerald-500/60',
                    )}
                >
                    {checked && <CheckCircle size={12} className="text-black" />}
                </div>
            </div>
            <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                I understand my data is stored locally in this browser and I'm responsible for backing it up.
            </span>
        </label>
    </div>
);

// ─────────────────────────────────────────────────────────
// Step 2: LeetCode Account Connection
// ─────────────────────────────────────────────────────────

const Step2: React.FC<{
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
            <div>
                <h2 className="text-2xl font-bold text-zinc-50 mb-1">Connect Your LeetCode Account</h2>
                <p className="text-zinc-400 text-sm">Optional, but helpful. You can also do this later in Settings.</p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-3 text-sm text-zinc-300 leading-relaxed">
                <p>
                    Connecting your username lets us <span className="text-zinc-100 font-medium">automatically detect problems you've already solved</span> on LeetCode,
                    so you don't have to manually mark them one by one.
                </p>
                <p className="flex gap-2 items-start text-amber-300">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>
                        Due to LeetCode API limitations, the sync can only see your <span className="font-semibold">20 most recent accepted submissions</span>.
                        If you've solved more than 20 problems, older ones won't appear automatically — you'll need to mark those manually in the Problem Library.
                    </span>
                </p>
                <p className="text-zinc-400">
                    The sync runs automatically every time you open the app and can also be triggered manually from Settings.
                    Your username is stored only in your browser — it's never sent anywhere except LeetCode's public API.
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

                {/* Status feedback */}
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
                Skip for now — I'll connect later in Settings
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// Step 3: Study Schedule Setup
// ─────────────────────────────────────────────────────────

const Step3: React.FC<{
    targetDate: string;
    weekdayMinutes: number;
    weekendMinutes: number;
    restDay: number;
    onDateChange: (v: string) => void;
    onWeekdayChange: (v: number) => void;
    onWeekendChange: (v: number) => void;
    onRestDayChange: (v: number) => void;
}> = ({
    targetDate, weekdayMinutes, weekendMinutes, restDay,
    onDateChange, onWeekdayChange, onWeekendChange, onRestDayChange,
}) => {
        const today = new Date();
        const completion = computePhase1Completion(weekdayMinutes, weekendMinutes, restDay, today);
        const completionStr = format(completion, 'MMMM d, yyyy');
        const targetDateObj = new Date(targetDate + 'T00:00:00');
        const isBehind = completion > targetDateObj;
        const weeksLeft = differenceInWeeks(targetDateObj, completion);

        const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-50 mb-1">Set Up Your Study Schedule</h2>
                    <p className="text-zinc-400 text-sm">We'll build a personalised daily plan around your availability.</p>
                </div>

                <div className="space-y-5">
                    {/* Target date */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                            Recruiting target date
                        </label>
                        <p className="text-xs text-zinc-500 mb-2">
                            This is roughly when most companies open applications for full-time roles (Sept 15, 2026 by default).
                        </p>
                        <input
                            type="date"
                            value={targetDate}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>

                    {/* Weekday slider */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-zinc-300">Weekday daily study time</label>
                            <span className="text-emerald-400 font-bold text-lg">{weekdayMinutes} <span className="text-sm font-normal text-zinc-400">min</span></span>
                        </div>
                        <input
                            type="range" min="20" max="120" step="15"
                            value={weekdayMinutes}
                            onChange={(e) => onWeekdayChange(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-xs text-zinc-600 mt-1">
                            <span>20 min</span><span>120 min</span>
                        </div>
                    </div>

                    {/* Weekend slider */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-zinc-300">Weekend daily study time</label>
                            <span className="text-emerald-400 font-bold text-lg">{weekendMinutes} <span className="text-sm font-normal text-zinc-400">min</span></span>
                        </div>
                        <input
                            type="range" min="20" max="120" step="15"
                            value={weekendMinutes}
                            onChange={(e) => onWeekendChange(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-xs text-zinc-600 mt-1">
                            <span>20 min</span><span>120 min</span>
                        </div>
                    </div>

                    {/* Rest day */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Weekly rest day</label>
                        <select
                            value={restDay}
                            onChange={(e) => onRestDayChange(parseInt(e.target.value))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        >
                            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                        <p className="text-xs text-zinc-500 mt-1.5">No new problems are assigned on your rest day — only due reviews.</p>
                    </div>
                </div>

                {/* Live pacing summary */}
                <div className={clsx(
                    'rounded-2xl p-5 border transition-all duration-300',
                    isBehind
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-emerald-500/10 border-emerald-500/20',
                )}>
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar size={16} className={isBehind ? 'text-amber-400' : 'text-emerald-400'} />
                        <span className="text-sm font-semibold text-zinc-200">Live Pacing Preview</span>
                    </div>
                    <p className="text-sm text-zinc-300">
                        At your current schedule, you'll complete <span className="font-medium text-zinc-100">Phase 1</span> by approximately{' '}
                        <span className={clsx('font-bold', isBehind ? 'text-amber-300' : 'text-emerald-400')}>
                            {completionStr}
                        </span>.
                    </p>
                    {isBehind ? (
                        <p className="text-amber-300/80 text-xs mt-2">
                            ⚠️ That's after your recruiting target date. Consider increasing your daily study time, or start by focusing on categories you already know.
                        </p>
                    ) : (
                        <p className="text-emerald-400/70 text-xs mt-2">
                            ✓ You'll finish {Math.abs(weeksLeft)} week{Math.abs(weeksLeft) !== 1 ? 's' : ''} before recruiting season. You're on track!
                        </p>
                    )}
                </div>
            </div>
        );
    };

// ─────────────────────────────────────────────────────────
// Step 4: Skill Self Assessment
// ─────────────────────────────────────────────────────────

const SKILL_OPTIONS: { value: SkillLevel; label: string; desc: string }[] = [
    { value: 'not_familiar', label: 'Not Familiar', desc: "Haven't worked with this pattern" },
    { value: 'some_exposure', label: 'Some Exposure', desc: "Seen it before, need more practice" },
    { value: 'comfortable', label: 'Comfortable', desc: "Can solve most problems reliably" },
];

const CHIP_COLORS: Record<SkillLevel, string> = {
    not_familiar: 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300',
    some_exposure: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
    comfortable: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
};
const CHIP_ACTIVE: Record<SkillLevel, string> = {
    not_familiar: 'border-zinc-500 bg-zinc-800 text-zinc-100',
    some_exposure: 'border-amber-400 bg-amber-500/20 text-amber-200',
    comfortable: 'border-emerald-400 bg-emerald-500/20 text-emerald-100',
};

const Step4: React.FC<{
    skillLevels: Record<string, SkillLevel>;
    onChange: (category: string, level: SkillLevel) => void;
}> = ({ skillLevels, onChange }) => (
    <div className="space-y-5 animate-in fade-in duration-300">
        <div>
            <h2 className="text-2xl font-bold text-zinc-50 mb-1">Quick Skill Assessment</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
                Rate your familiarity with each Phase 1 topic. This helps us skip ahead in areas you already know so you don't waste time on problems that are too easy.
                Takes about 60 seconds and can be changed anytime in Settings.
            </p>
        </div>

        <div className="space-y-3">
            {PHASE_1_CATEGORIES.map((cat) => {
                const current = skillLevels[cat] ?? 'not_familiar';
                return (
                    <div key={cat} className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-zinc-200">{cat}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">{CATEGORY_EXAMPLES[cat]}</p>
                            </div>
                            <div className="flex gap-1.5 flex-wrap shrink-0">
                                {SKILL_OPTIONS.map((opt) => {
                                    const isActive = current === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => onChange(cat, opt.value)}
                                            className={clsx(
                                                'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150',
                                                isActive ? CHIP_ACTIVE[opt.value] : CHIP_COLORS[opt.value],
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {current === 'comfortable' && (
                            <p className="text-xs text-emerald-400/80 mt-2 flex items-center gap-1">
                                <Zap size={11} /> This category will be fast-tracked in your plan.
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────
// Step 5: Target & Preferences
// ─────────────────────────────────────────────────────────

const Step5: React.FC<{
    targetTier: OnboardingState['targetTier'];
    interviewType: OnboardingState['interviewType'];
    language: OnboardingState['language'];
    srAggressiveness: OnboardingState['srAggressiveness'];
    onTierChange: (v: OnboardingState['targetTier']) => void;
    onTypeChange: (v: OnboardingState['interviewType']) => void;
    onLangChange: (v: OnboardingState['language']) => void;
    onSRChange: (v: OnboardingState['srAggressiveness']) => void;
}> = ({ targetTier, interviewType, language, srAggressiveness, onTierChange, onTypeChange, onLangChange, onSRChange }) => (
    <div className="space-y-6 animate-in fade-in duration-300">
        <div>
            <h2 className="text-2xl font-bold text-zinc-50 mb-1">Your Target & Preferences</h2>
            <p className="text-sm text-zinc-400">Four quick choices that personalise your daily problem mix and plan.</p>
        </div>

        {/* Company Tier */}
        <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                <Target size={14} className="text-red-400" /> Target company tier
            </label>
            <div className="grid grid-cols-2 gap-2">
                {TIER_OPTIONS.map((t) => (
                    <button
                        key={t.value}
                        onClick={() => onTierChange(t.value)}
                        className={clsx(
                            'rounded-xl border p-4 text-left transition-all duration-200 bg-gradient-to-b',
                            t.color,
                            targetTier === t.value
                                ? `${t.border} ring-2 ring-offset-1 ring-offset-black ring-current opacity-100`
                                : 'border-zinc-800 opacity-70 hover:opacity-90',
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className={clsx('w-2 h-2 rounded-full', t.dot)} />
                            <span className="text-sm font-semibold text-zinc-100">{t.label}</span>
                        </div>
                        <p className="text-xs text-zinc-400">{t.desc}</p>
                    </button>
                ))}
            </div>
        </div>

        {/* Interview Type */}
        <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                <Briefcase size={14} className="text-amber-400" /> Interview type
            </label>
            <div className="flex gap-2">
                {(['INTERNSHIP', 'FULL_TIME'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => onTypeChange(t)}
                        className={clsx(
                            'flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-200',
                            interviewType === t
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600',
                        )}
                    >
                        {t === 'INTERNSHIP' ? 'Internship' : 'Full Time'}
                    </button>
                ))}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
                {interviewType === 'INTERNSHIP'
                    ? 'Intern interviews tend to be Easy–Medium. Problem mix skews accordingly.'
                    : 'Full-time interviews go deeper into Medium–Hard problems, including system design context.'}
            </p>
        </div>

        {/* Language */}
        <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                <Code2 size={14} className="text-indigo-400" /> Primary language
            </label>
            <div className="flex gap-2">
                {(['Python', 'Java', 'JavaScript'] as const).map((l) => (
                    <button
                        key={l}
                        onClick={() => onLangChange(l)}
                        className={clsx(
                            'flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-200',
                            language === l
                                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600',
                        )}
                    >
                        {l}
                    </button>
                ))}
            </div>
            <p className="text-xs text-zinc-500 mt-2">Sets the default in the Mock Interview editor and syntax reference.</p>
        </div>

        {/* SR Style */}
        <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                <Zap size={14} className="text-purple-400" /> Spaced repetition style
            </label>
            <div className="space-y-2">
                {SR_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onSRChange(opt.value)}
                        className={clsx(
                            'w-full px-4 py-3.5 rounded-xl border text-left transition-all duration-200',
                            srAggressiveness === opt.value
                                ? 'bg-purple-500/10 border-purple-500/40'
                                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600',
                        )}
                    >
                        <p className={clsx(
                            'text-sm font-semibold mb-0.5',
                            srAggressiveness === opt.value ? 'text-purple-300' : 'text-zinc-300',
                        )}>
                            {opt.label}
                        </p>
                        <p className="text-xs text-zinc-500">{opt.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────
// Step 6: You're All Set
// ─────────────────────────────────────────────────────────

const Step6: React.FC<{
    state: OnboardingState;
    onLaunch: () => void;
    onSkipSetup: () => void;
}> = ({ state, onLaunch, onSkipSetup }) => {
    const today = new Date();
    const completion = computePhase1Completion(
        state.weekdayMinutes, state.weekendMinutes, state.restDay, today,
    );
    const completionStr = format(completion, 'MMMM d, yyyy');
    const comfortableCats = PHASE_1_CATEGORIES.filter(
        (c) => state.skillLevels[c] === 'comfortable',
    );

    const TIER_LABEL: Record<string, string> = {
        FAANG: 'FAANG', FINTECH: 'Fintech', GENERAL: 'General SWE', MIXED: 'Mixed / Broad',
    };

    const tips = [
        {
            icon: <Star size={16} className="text-amber-400" />,
            text: 'Your streak only counts if you complete at least one problem or review session per day. You get one grace day per week that protects your streak if you miss.',
        },
        {
            icon: <Database size={16} className="text-blue-400" />,
            text: 'Your data lives in this browser only. Export it regularly from Settings → Export Data as a personal backup.',
        },
        {
            icon: <RefreshCw size={16} className="text-purple-400" />,
            text: 'The LeetCode sync only catches your 20 most recent solves. Visit the Problem Library to manually mark older problems as complete.',
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
                    <Rocket className="text-emerald-400" size={30} />
                </div>
                <h2 className="text-2xl font-bold text-zinc-50">You're all set!</h2>
                <p className="text-zinc-400 text-sm mt-1">Here's a summary of your personalised plan. You can change any of this anytime in Settings.</p>
            </div>

            {/* Summary */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3 text-sm">
                <SummaryRow icon={<Calendar size={14} />} label="Target date" value={new Date(state.targetDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
                <SummaryRow icon={<Clock size={14} />} label="Daily study" value={`${state.weekdayMinutes} min weekdays · ${state.weekendMinutes} min weekends`} />
                <SummaryRow icon={<CheckCircle size={14} />} label="Phase 1 projected finish" value={completionStr} />
                <SummaryRow icon={<Brain size={14} />} label="Comfortable categories" value={comfortableCats.length > 0 ? comfortableCats.join(', ') : 'None — starting from scratch'} />
                <SummaryRow icon={<Target size={14} />} label="Target tier" value={TIER_LABEL[state.targetTier]} />
                <SummaryRow icon={<Code2 size={14} />} label="Language" value={state.language} />
            </div>

            {/* Tips */}
            <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Quick tips</p>
                {tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-3.5">
                        <div className="shrink-0 mt-0.5">{tip.icon}</div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{tip.text}</p>
                    </div>
                ))}
            </div>

            {/* Launch */}
            <button
                onClick={onLaunch}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
                <Rocket size={18} />
                Launch My Plan
            </button>

            <div className="text-center">
                <button
                    onClick={onSkipSetup}
                    className="text-zinc-600 hover:text-zinc-400 text-xs underline underline-offset-4 transition-colors"
                >
                    Skip setup — launch with all defaults
                </button>
            </div>
        </div>
    );
};

const SummaryRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-2">
        <span className="text-zinc-500 mt-0.5 shrink-0">{icon}</span>
        <span className="text-zinc-500 w-44 shrink-0">{label}</span>
        <span className="text-zinc-100 font-medium">{value}</span>
    </div>
);

// ─────────────────────────────────────────────────────────
// Main Onboarding Component
// ─────────────────────────────────────────────────────────

export const Onboarding: React.FC<Props> = ({ onComplete }) => {
    const setLeetCodeUsername = useStore((s) => s.setLeetCodeUsername);
    const updateSettings = useStore((s) => s.updateSettings);
    const setTargetInterviewDate = useStore((s) => s.setTargetInterviewDate);
    const setOnboardingComplete = useStore((s) => s.setOnboardingComplete);

    const [step, setStep] = useState(1);

    const [obState, setObState] = useState<OnboardingState>({
        disclaimerChecked: false,
        leetcodeUsername: '',
        targetDate: '2026-09-15',
        weekdayMinutes: 60,
        weekendMinutes: 90,
        restDay: 0,
        skillLevels: {},
        targetTier: 'MIXED',
        interviewType: 'INTERNSHIP',
        language: 'Python',
        srAggressiveness: 'RELAXED',
    });

    // Prevent Escape from dismissing
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

    const canContinue = () => {
        if (step === 1) return obState.disclaimerChecked;
        return true;
    };

    const handleContinue = () => {
        if (step < TOTAL_STEPS) setStep((s) => s + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep((s) => s - 1);
    };

    const commitSettingsAndLaunch = () => {
        // Save all settings to store
        setTargetInterviewDate(obState.targetDate);

        if (obState.leetcodeUsername) {
            setLeetCodeUsername(obState.leetcodeUsername);
        }

        updateSettings({
            studySchedule: {
                weekdayMinutes: obState.weekdayMinutes,
                weekendMinutes: obState.weekendMinutes,
                restDay: obState.restDay,
                blackoutDates: [],
            },
            skillLevels: obState.skillLevels,
            targetCompanyTier: obState.targetTier,
            interviewType: obState.interviewType,
            language: obState.language,
            srAggressiveness: obState.srAggressiveness,
        });

        setOnboardingComplete();
        onComplete();
    };

    const handleSkipAll = () => {
        setOnboardingComplete();
        onComplete();
    };

    // Step 2 skip handler — advance without saving username
    const handleSkipStep2 = () => setStep(3);

    // Step 2 success — store username locally, advance
    const handleStep2Success = (username: string) => {
        update('leetcodeUsername', username);
        // auto-advance after brief success display
        setTimeout(() => setStep(3), 1200);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
            // Non-dismissible — swallow clicks on backdrop
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-zinc-950 border border-zinc-800/60 rounded-3xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 pt-8 pb-0 shrink-0">
                    <StepIndicator current={step} total={TOTAL_STEPS} />
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-8 py-4">
                    {step === 1 && (
                        <Step1
                            checked={obState.disclaimerChecked}
                            onChange={(v) => update('disclaimerChecked', v)}
                        />
                    )}
                    {step === 2 && (
                        <Step2
                            username={obState.leetcodeUsername}
                            onChange={(v) => update('leetcodeUsername', v)}
                            onSkip={handleSkipStep2}
                            onSuccess={handleStep2Success}
                        />
                    )}
                    {step === 3 && (
                        <Step3
                            targetDate={obState.targetDate}
                            weekdayMinutes={obState.weekdayMinutes}
                            weekendMinutes={obState.weekendMinutes}
                            restDay={obState.restDay}
                            onDateChange={(v) => update('targetDate', v)}
                            onWeekdayChange={(v) => update('weekdayMinutes', v)}
                            onWeekendChange={(v) => update('weekendMinutes', v)}
                            onRestDayChange={(v) => update('restDay', v)}
                        />
                    )}
                    {step === 4 && (
                        <Step4
                            skillLevels={obState.skillLevels}
                            onChange={(cat, level) =>
                                update('skillLevels', { ...obState.skillLevels, [cat]: level })
                            }
                        />
                    )}
                    {step === 5 && (
                        <Step5
                            targetTier={obState.targetTier}
                            interviewType={obState.interviewType}
                            language={obState.language}
                            srAggressiveness={obState.srAggressiveness}
                            onTierChange={(v) => update('targetTier', v)}
                            onTypeChange={(v) => update('interviewType', v)}
                            onLangChange={(v) => update('language', v)}
                            onSRChange={(v) => update('srAggressiveness', v)}
                        />
                    )}
                    {step === 6 && (
                        <Step6
                            state={obState}
                            onLaunch={commitSettingsAndLaunch}
                            onSkipSetup={handleSkipAll}
                        />
                    )}
                </div>

                {/* Footer nav — hidden on step 6 (it has its own CTA) and on step 2 skip is inline */}
                {step !== 6 && (
                    <div className="px-8 py-6 border-t border-zinc-800/50 flex justify-between items-center shrink-0">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 text-sm"
                        >
                            <ChevronLeft size={16} /> Back
                        </button>

                        {/* Step 2 has its own Continue (the Connect button is the CTA) */}
                        {step !== 2 ? (
                            <button
                                onClick={handleContinue}
                                disabled={!canContinue()}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-semibold transition-all duration-200 text-sm"
                            >
                                Continue <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={() => setStep(3)}
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
