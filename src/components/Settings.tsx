import React, { useState, useEffect } from 'react';
import { PHASE_1_CATEGORIES, PHASE_2_CATEGORIES, TARGET_CURRICULUM_LABELS } from '../data/problems';
import { getPhase } from '../utils/dateUtils';
import { Settings as SettingsIcon, Clock, Target, Briefcase, Zap, Code2, Calendar, Plus, X, RefreshCw, CheckCircle, Download, Swords, Shuffle, Info, Lock, FileCode2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useActivityLog, useProblemProgress, useSessionTimings, useSprintState, useUserSettings } from '../hooks/useUserData';

function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
}

/** Study sliders use min 15 / max 120; 60 min is not the numeric midpoint, so tick labels must match linear track position. */
const STUDY_MINUTES_RANGE = { min: 15, max: 120 } as const;
const ONE_HOUR_TICK_LEFT_PCT =
    ((60 - STUDY_MINUTES_RANGE.min) / (STUDY_MINUTES_RANGE.max - STUDY_MINUTES_RANGE.min)) * 100;

export const Settings: React.FC = () => {
    const {
        data: userSettings,
        settings,
        updateSettings,
        targetEvents,
        addTargetEvent,
        removeTargetEvent,
        leetcodeUsername,
        setLeetCodeUsername,
        syncLeetCode,
        lastSync,
        lastSyncCount,
        syncError,
    } = useUserSettings();
    const { sprintState, sprintHistory, setSprintCategory } = useSprintState();
    const { progress } = useProblemProgress();
    const { data: activityLog } = useActivityLog();
    const { sessionTimings } = useSessionTimings();

    const [tempUsername, setTempUsername] = useState(leetcodeUsername || '');
    const [isSyncing, setIsSyncing] = useState(false);
    const [newBlackoutStart, setNewBlackoutStart] = useState('');
    const [newBlackoutEnd, setNewBlackoutEnd] = useState('');

    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventType, setNewEventType] = useState('Phone Screen');
    const [newEventDate, setNewEventDate] = useState('');
    const [sprintHowOpen, setSprintHowOpen] = useState(false);
    const calendarPhase = getPhase();

    useEffect(() => {
        setTempUsername(leetcodeUsername || '');
    }, [leetcodeUsername]);

    const handleManualSync = async () => {
        if (tempUsername !== leetcodeUsername) {
            setLeetCodeUsername(tempUsername);
        }
        setIsSyncing(true);
        await syncLeetCode();
        setIsSyncing(false);
    };

    const handleAddBlackoutDate = () => {
        if (newBlackoutStart && newBlackoutEnd) {
            const newDates = [...settings.studySchedule.blackoutDates, { start: newBlackoutStart, end: newBlackoutEnd }];
            updateSettings({ studySchedule: { ...settings.studySchedule, blackoutDates: newDates } });
            setNewBlackoutStart('');
            setNewBlackoutEnd('');
        }
    };

    const handleAddEvent = () => {
        if (newEventTitle && newEventDate) {
            addTargetEvent({ title: newEventTitle, type: newEventType, date: newEventDate });
            setNewEventTitle('');
            setNewEventDate('');
        }
    };

    const handleRemoveBlackoutDate = (index: number) => {
        const newDates = settings.studySchedule.blackoutDates.filter((_, i) => i !== index);
        updateSettings({ studySchedule: { ...settings.studySchedule, blackoutDates: newDates } });
    };

    const handleExportData = () => {
        const blob = new Blob([JSON.stringify({
            userSettings,
            progress,
            activityLog,
            sessionTimings,
            sprintState,
            sprintHistory,
        }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateTag = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `lc-tracker-backup-${dateTag}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderTierBar = () => {
        let ratios = [20, 60, 20]; // Default Mixed roughly
        if (settings.targetCompanyTier === 'FAANG') ratios = [20, 60, 20];
        if (settings.targetCompanyTier === 'FINTECH') ratios = [30, 60, 10];
        if (settings.targetCompanyTier === 'GENERAL') ratios = [50, 45, 5];
        if (settings.targetCompanyTier === 'MIXED') ratios = [33, 34, 33];

        return (
            <div className="mt-4">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>{ratios[0]}% Easy</span>
                    <span>{ratios[1]}% Medium</span>
                    <span>{ratios[2]}% Hard</span>
                </div>
                <div className="h-2 flex w-full rounded-full overflow-hidden">
                    <div style={{ width: `${ratios[0]}%` }} className="bg-emerald-500"></div>
                    <div style={{ width: `${ratios[1]}%` }} className="bg-amber-500"></div>
                    <div style={{ width: `${ratios[2]}%` }} className="bg-red-500"></div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-4xl xl:max-w-5xl mx-auto">
            <header className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-50 flex items-center gap-3">
                    <SettingsIcon className="text-emerald-400" size={32} />
                    Plan Customization
                </h1>
            </header>

            <div className="space-y-8">

                    {/* LeetCode — first for visibility */}
                    <section className="premium-card p-6 border-emerald-500/20">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-4">
                            <RefreshCw className="text-emerald-400" size={20} />
                            LeetCode Integration
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">LeetCode Username</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={tempUsername}
                                        onChange={(e) => setTempUsername(e.target.value)}
                                        placeholder="e.g., neetcode"
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-amber-500/50 transition-colors"
                                    />
                                    <button aria-label="Sync LeetCode data"
                                        onClick={handleManualSync}
                                        disabled={isSyncing || !tempUsername}
                                        className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-xl text-zinc-300 transition-colors flex items-center justify-center shrink-0"
                                    >
                                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                                {syncError && <p className="text-red-400 text-xs mt-2">{syncError}</p>}
                                {lastSync && !syncError && (
                                    <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                                        <CheckCircle size={12} /> Last synced: {new Date(lastSync).toLocaleString()}
                                        {lastSyncCount !== null && ` (${lastSyncCount} new added)`}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Learning Strategy */}
                    <section className="premium-card p-6 border-emerald-500/20">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-2">
                            <Swords className="text-emerald-400" size={20} />
                            Learning Strategy
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Target problem list</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(
                                        [
                                            { value: 'NEET_75' as const, sub: 'Core patterns first' },
                                            { value: 'NEET_150' as const, sub: 'Broader coverage' },
                                            { value: 'NEET_250' as const, sub: 'Full NeetCode list' },
                                            { value: 'EXTENDED' as const, sub: '250 + extra catalog problems' },
                                        ] as const
                                    ).map(({ value, sub }) => {
                                        const active = (settings.targetCurriculum ?? 'NEET_75') === value;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => updateSettings({ targetCurriculum: value })}
                                                className={clsx(
                                                    'text-left rounded-xl border px-4 py-3 transition-all duration-200 focus:outline-none',
                                                    active
                                                        ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                                                        : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50'
                                                )}
                                            >
                                                <p className={clsx('text-sm font-semibold', active ? 'text-amber-300' : 'text-zinc-300')}>
                                                    {TARGET_CURRICULUM_LABELS[value]}
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Mode picker — radio cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {([ 
                                    { value: 'EXPLORE', icon: Shuffle, label: 'Explore', desc: 'Mix problems from all categories randomly.' },
                                    { value: 'CURRICULUM', icon: Swords, label: 'Curriculum', desc: 'Focus intensely on one sequence pattern.' },
                                    { value: 'PATTERNS', icon: FileCode2, label: 'Pattern Mastery', desc: 'Guided progression on core algorithms.' },
                                ] as const).map(({ value, icon: Icon, label, desc }) => {
                                    const active = settings.learningMode === value;
                                    return (
                                        <button
                                            key={value}
                                            onClick={() => updateSettings({ learningMode: value })}
                                            className={clsx(
                                                'group text-left rounded-xl border p-4 transition-all duration-200 focus:outline-none',
                                                active
                                                    ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                                                    : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50'
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <Icon
                                                    size={18}
                                                    className={active ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-400'}
                                                />
                                                <span className={clsx(
                                                    'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                                                    active ? 'border-amber-500 bg-amber-500' : 'border-zinc-600'
                                                )}>
                                                    {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </span>
                                            </div>
                                            <p className={clsx('text-sm font-semibold mb-1', active ? 'text-amber-300' : 'text-zinc-300')}>{label}</p>
                                            <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="rounded-xl border border-amber-500/20 bg-zinc-950/40 p-4">
                                    <h3 className="text-zinc-100 font-semibold flex gap-2 items-center mb-1">
                                        <Briefcase className="text-emerald-400" size={18} />
                                        Interview type
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {([
                                            { value: 'INTERNSHIP' as const, label: 'Internship', sub: 'Prefer easier problems when available' },
                                            { value: 'FULL_TIME' as const, label: 'Full time', sub: 'Balanced difficulty mix from your company tier' },
                                        ] as const).map(({ value, label, sub }) => {
                                            const active = settings.interviewType === value;
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => updateSettings({ interviewType: value })}
                                                    className={clsx(
                                                        'text-left rounded-xl border px-4 py-3 transition-all duration-200 focus:outline-none',
                                                        active
                                                            ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                                                            : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50'
                                                    )}
                                                >
                                                    <p className={clsx('text-sm font-semibold', active ? 'text-amber-300' : 'text-zinc-300')}>{label}</p>
                                                    <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-emerald-500/20 bg-zinc-950/40 p-4">
                                    <h3 className="text-zinc-100 font-semibold flex gap-2 items-center mb-1">
                                        <Zap className="text-emerald-400" size={18} />
                                        Spaced repetition
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {([
                                            { value: 'RELAXED' as const, label: 'Relaxed', sub: 'Longest gaps between reviews' },
                                            { value: 'BALANCED' as const, label: 'Balanced', sub: 'Default spacing between Relaxed and Aggressive' },
                                            { value: 'AGGRESSIVE' as const, label: 'Aggressive', sub: 'Most frequent reviews' },
                                        ] as const).map(({ value, label, sub }) => {
                                            const active = settings.srAggressiveness === value;
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => updateSettings({ srAggressiveness: value })}
                                                    className={clsx(
                                                        'text-left rounded-xl border px-4 py-3 transition-all duration-200 focus:outline-none',
                                                        active
                                                            ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                                                            : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50'
                                                    )}
                                                >
                                                    <p className={clsx('text-sm font-semibold', active ? 'text-amber-300' : 'text-zinc-300')}>{label}</p>
                                                    <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className={clsx('space-y-4 transition-opacity duration-200', settings.learningMode !== 'CURRICULUM' && 'opacity-40 pointer-events-none')}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">Sprint setup</label>
                                    <button
                                        type="button"
                                        onClick={() => setSprintHowOpen(true)}
                                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 transition-colors"
                                    >
                                        <Info size={14} className="text-emerald-400" />
                                        How sprint works
                                    </button>
                                </div>
                                <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-200">Align sprint pool with target list</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            When on, your target list tier (e.g. NeetCode 150) changes which NeetCode tier is tried first in sprint. Off = classic 75 → 150 → 250 → extended.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={settings.sprintSettings?.alignPoolToTargetCurriculum ?? false}
                                        onClick={() =>
                                            updateSettings({
                                                sprintSettings: {
                                                    ...settings.sprintSettings,
                                                    alignPoolToTargetCurriculum: !(settings.sprintSettings?.alignPoolToTargetCurriculum ?? false),
                                                },
                                            })
                                        }
                                        className={clsx(
                                            'relative w-11 h-6 rounded-full transition-colors shrink-0',
                                            settings.sprintSettings?.alignPoolToTargetCurriculum ? 'bg-amber-500' : 'bg-zinc-700'
                                        )}
                                    >
                                        <span
                                            className={clsx(
                                                'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
                                                settings.sprintSettings?.alignPoolToTargetCurriculum && 'translate-x-5'
                                            )}
                                        />
                                    </button>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-zinc-300">Target Sprint Length</label>
                                            <span className="text-amber-400 font-medium">{settings.sprintSettings?.targetDays ?? 7} Days</span>
                                    </div>
                                    <input
                                        type="range" min="3" max="14" step="1"
                                        value={settings.sprintSettings?.targetDays ?? 7}
                                        onChange={(e) => updateSettings({
                                            sprintSettings: {
                                                ...settings.sprintSettings,
                                                targetDays: parseInt(e.target.value)
                                            }
                                        })}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                        <span>3 Days (Fast)</span>
                                        <span>7 Days (Balanced)</span>
                                        <span>14 Days (Deep)</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-zinc-800/50">
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Jump to Sprint Category</label>
                                    <select
                                        value={sprintState?.currentCategory || ''}
                                        onChange={(e) => setSprintCategory(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500/50"
                                    >
                                        <optgroup label="Phase 1">
                                            {PHASE_1_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Phase 2">
                                            {PHASE_2_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            <div className="rounded-xl border border-amber-500/20 bg-zinc-950/40 p-4">
                                <h3 className="text-zinc-100 font-semibold flex gap-2 items-center mb-1">
                                    <Lock className="text-emerald-400" size={16} />
                                    LeetCode Premium assignment policy
                                </h3>
                                <p className="text-xs text-zinc-500 mb-3">
                                    This controls automatic assignment and review eligibility only. It does not affect list visibility and is unrelated to any LC-Tracker subscription.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ includePremiumInAssignments: true })}
                                        className={clsx(
                                            'text-left rounded-xl border px-4 py-3 transition-all duration-200 focus:outline-none',
                                            settings.includePremiumInAssignments
                                                ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                                                : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50'
                                        )}
                                    >
                                        <p className={clsx('text-sm font-semibold', settings.includePremiumInAssignments ? 'text-amber-300' : 'text-zinc-300')}>
                                            Include LC Premium
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Dashboard recommendations and review queue may include paid-only LeetCode problems.</p>
                                        {settings.includePremiumInAssignments && (
                                            <p className="text-[11px] font-semibold text-amber-300 mt-2 flex items-center gap-1">
                                                <CheckCircle size={12} /> Active
                                            </p>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ includePremiumInAssignments: false })}
                                        className={clsx(
                                            'text-left rounded-xl border px-4 py-3 transition-all duration-200 focus:outline-none',
                                            !settings.includePremiumInAssignments
                                                ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                                                : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50'
                                        )}
                                    >
                                        <p className={clsx('text-sm font-semibold', !settings.includePremiumInAssignments ? 'text-amber-300' : 'text-zinc-300')}>
                                            Exclude LC Premium
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Dashboard recommendations and review queue use free-access LeetCode problems only.</p>
                                        {!settings.includePremiumInAssignments && (
                                            <p className="text-[11px] font-semibold text-amber-300 mt-2 flex items-center gap-1">
                                                <CheckCircle size={12} /> Active
                                            </p>
                                        )}
                                    </button>
                                </div>

                                <p className="text-[11px] text-zinc-500 mt-3">
                                    Current policy: <span className="font-semibold text-zinc-300">{settings.includePremiumInAssignments ? 'Include LC Premium' : 'Exclude LC Premium'}</span>
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Study Schedule */}
                    <section className="premium-card p-6">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-4">
                            <Clock className="text-emerald-400" size={20} />
                            Study Schedule
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-zinc-300">Weekday Daily Target</label>
                                    <span className="text-emerald-400 font-medium">{formatMinutes(settings.studySchedule.weekdayMinutes)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={STUDY_MINUTES_RANGE.min}
                                    max={STUDY_MINUTES_RANGE.max}
                                    step="15"
                                    value={settings.studySchedule.weekdayMinutes}
                                    onChange={(e) => updateSettings({ studySchedule: { ...settings.studySchedule, weekdayMinutes: parseInt(e.target.value) } })}
                                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                                <div className="relative w-full text-xs text-zinc-600 mt-1 h-4">
                                    <span className="absolute left-0 top-0">15 min</span>
                                    <span
                                        className="absolute top-0 -translate-x-1/2"
                                        style={{ left: `${ONE_HOUR_TICK_LEFT_PCT}%` }}
                                    >
                                        1 hr
                                    </span>
                                    <span className="absolute right-0 top-0">2 hr</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-zinc-300">Weekend Daily Target</label>
                                    <span className="text-emerald-400 font-medium">{formatMinutes(settings.studySchedule.weekendMinutes)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={STUDY_MINUTES_RANGE.min}
                                    max={STUDY_MINUTES_RANGE.max}
                                    step="15"
                                    value={settings.studySchedule.weekendMinutes}
                                    onChange={(e) => updateSettings({ studySchedule: { ...settings.studySchedule, weekendMinutes: parseInt(e.target.value) } })}
                                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                                <div className="relative w-full text-xs text-zinc-600 mt-1 h-4">
                                    <span className="absolute left-0 top-0">15 min</span>
                                    <span
                                        className="absolute top-0 -translate-x-1/2"
                                        style={{ left: `${ONE_HOUR_TICK_LEFT_PCT}%` }}
                                    >
                                        1 hr
                                    </span>
                                    <span className="absolute right-0 top-0">2 hr</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Weekly Rest Day</label>
                                <select
                                    value={settings.studySchedule.restDay}
                                    onChange={(e) => updateSettings({ studySchedule: { ...settings.studySchedule, restDay: parseInt(e.target.value) } })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500/50"
                                >
                                    <option value={-1}>None — study every day</option>
                                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                                        <option key={idx} value={idx}>{day}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-zinc-500 mt-2">No new problems will be assigned on the rest day, only due reviews.</p>
                            </div>

                            <div className="pt-4 border-t border-zinc-800/50">
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Blackout Dates (e.g. Finals)</label>
                                <div className="flex gap-2 mb-3">
                                    <input type="date" value={newBlackoutStart} onChange={(e) => setNewBlackoutStart(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 text-sm focus:outline-none" />
                                    <input type="date" value={newBlackoutEnd} onChange={(e) => setNewBlackoutEnd(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 text-sm focus:outline-none" />
                                    <button aria-label="Add blackout date" onClick={handleAddBlackoutDate} disabled={!newBlackoutStart || !newBlackoutEnd} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded-xl transition-colors shrink-0">
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {settings.studySchedule.blackoutDates.map((date, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-zinc-900 border border-zinc-800/50 p-2 rounded-lg text-sm text-zinc-300">
                                            <span>{new Date(date.start).toLocaleDateString()} - {new Date(date.end).toLocaleDateString()}</span>
                                            <button aria-label="Remove blackout date" onClick={() => handleRemoveBlackoutDate(idx)} className="text-red-400 hover:bg-red-500/10 p-1 rounded-md transition-colors"><X size={14} /></button>
                                        </div>
                                    ))}
                                    {settings.studySchedule.blackoutDates.length === 0 && (
                                        <p className="text-xs text-zinc-500 italic">No blackout dates set.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Target Events */}
                    <section className="premium-card p-6 border-emerald-500/20">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-4">
                            <Calendar className="text-emerald-400" size={20} />
                            Interview Timeline
                        </h2>

                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder="Company / Event"
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 text-sm focus:outline-none"
                                />
                                <select
                                    value={newEventType}
                                    onChange={(e) => setNewEventType(e.target.value)}
                                    className="w-32 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-zinc-100 text-sm focus:outline-none"
                                >
                                    <option>OA</option>
                                    <option>Phone Screen</option>
                                    <option>Onsite</option>
                                    <option>Other</option>
                                </select>
                                <input
                                    type="date"
                                    value={newEventDate}
                                    onChange={(e) => setNewEventDate(e.target.value)}
                                    className="w-36 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 text-sm focus:outline-none"
                                />
                                <button aria-label="Add target event" type="button" onClick={handleAddEvent} disabled={!newEventTitle || !newEventDate} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded-xl transition-colors shrink-0 flex justify-center items-center">
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="space-y-2 mt-4">
                                {targetEvents.map((event) => (
                                    <div key={event.id} className="flex justify-between items-center bg-zinc-900 border border-zinc-800/50 p-3 rounded-lg">
                                        <div>
                                            <div className="text-sm font-medium text-zinc-200">{event.title}</div>
                                            <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
                                                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{event.type}</span>
                                                {new Date(event.date + 'T00:00:00').toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button aria-label="Remove target event" onClick={() => removeTargetEvent(event.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><X size={16} /></button>
                                    </div>
                                ))}
                                {targetEvents.length === 0 && (
                                    <p className="text-sm text-zinc-500 italic text-center py-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50 border-dashed">No upcoming events. Add your interview dates.</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Target Company Tier */}
                    <section className="premium-card p-6">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-2">
                            <Target className="text-emerald-400" size={20} />
                            Target Company Tier
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {([
                                { value: 'FAANG',   label: 'FAANG',   sub: 'Big Tech' },
                                { value: 'FINTECH', label: 'Fintech',  sub: 'Amex, Stripe…' },
                                { value: 'GENERAL', label: 'General',  sub: 'SWE roles' },
                                { value: 'MIXED',   label: 'Mixed',    sub: 'Balanced' },
                            ] as const).map(({ value, label, sub }) => {
                                const active = settings.targetCompanyTier === value;
                                return (
                                    <button
                                        key={value}
                                        onClick={() => updateSettings({ targetCompanyTier: value })}
                                        className={clsx(
                                            'text-left rounded-xl border px-4 py-3 transition-all duration-200 focus:outline-none',
                                            active
                                                ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                                                : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50'
                                        )}
                                    >
                                        <p className={clsx('text-sm font-semibold', active ? 'text-amber-300' : 'text-zinc-300')}>{label}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
                                    </button>
                                );
                            })}
                        </div>
                        {renderTierBar()}
                    </section>

                    {/* Programming Language */}
                    <section className="premium-card p-6">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-4">
                            <Code2 className="text-emerald-400" size={20} />
                            Programming Language
                        </h2>
                        <select
                            value={settings.language}
                            onChange={(e) => updateSettings({ language: e.target.value as any })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-amber-500/50"
                        >
                            <option value="Python">Python</option>
                            <option value="Java">Java</option>
                            <option value="JavaScript">JavaScript</option>
                        </select>
                    </section>

                    {/* Export Backup */}
                    <section className="premium-card p-6 border-emerald-500/20">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-4">
                            <Download className="text-emerald-400" size={20} />
                            Export Backup
                        </h2>
                        <button
                            type="button"
                            onClick={handleExportData}
                            className="flex items-center gap-2 px-5 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl transition-all duration-200 text-sm font-medium"
                        >
                            <Download size={16} />
                            Export Data
                        </button>
                    </section>

                    {sprintHowOpen && (
                        <div
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="sprint-how-title"
                        >
                            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-4">
                                <h3 id="sprint-how-title" className="text-lg font-semibold text-zinc-50">
                                    How sprint mode works
                                </h3>
                                <ul className="text-sm text-zinc-300 space-y-2 list-disc pl-5">
                                    <li>
                                        Sprint scheduling runs only when <strong className="text-zinc-200">Learning mode</strong> is Sprint{' '}
                                        <strong className="text-zinc-200">and</strong> the calendar is in phase 1 (before May 2026 in the app’s season clock). You are currently in phase {calendarPhase}.
                                    </li>
                                    <li>
                                        Each day, the next <strong className="text-zinc-200">new</strong> problem comes from your <strong className="text-zinc-200">current sprint category</strong>. Within that category, the app walks NeetCode tiers in order. <strong className="text-zinc-200">Default:</strong> NeetCode 75 → problems only in 150 → only in 250 → extended catalog. If <strong className="text-zinc-200">Align sprint pool with target list</strong> is on, the first tier tried matches your target list (e.g. NeetCode 150 starts with 150-only additions, then 250, then core 75, then extended).
                                    </li>
                                    <li>
                                        Sprint length uses your <strong className="text-zinc-200">target days</strong> and skill multipliers. When the window ends (or the category pool is exhausted), you get a <strong className="text-zinc-200">sprint check</strong> (retrospective) on a representative problem before advancing.
                                    </li>
                                    <li>
                                        <strong className="text-zinc-200">Easy / Hard days</strong> and <strong className="text-zinc-200">stabilizer easies</strong> still apply on top of this when you’re struggling in a category.
                                    </li>
                                    <li>
                                        Your <strong className="text-zinc-200">target problem list</strong> setting always controls Random mode and analytics. With alignment off, sprint uses the default waterfall; with alignment on, sprint tier order follows your target list as described above.
                                    </li>
                                </ul>
                                <button
                                    type="button"
                                    onClick={() => setSprintHowOpen(false)}
                                    className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
};
