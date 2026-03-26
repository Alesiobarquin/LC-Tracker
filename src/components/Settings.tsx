import React, { useState, useEffect } from 'react';
import { PHASE_1_CATEGORIES, PHASE_2_CATEGORIES } from '../data/problems';
import { Settings as SettingsIcon, Clock, Target, Briefcase, Zap, Code2, Calendar, Plus, X, RefreshCw, CheckCircle, Download, Swords, Lock, Unlock, Shuffle } from 'lucide-react';
import { clsx } from 'clsx';
import { useActivityLog, useProblemProgress, useSessionTimings, useSprintState, useUserSettings } from '../hooks/useUserData';

function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
}

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
                <p className="text-zinc-400">Configure your study plan and preferences. Changes save automatically to your account.</p>
            </header>

            <div className="space-y-8">

                    {/* LeetCode — first for visibility */}
                    <section className="premium-card p-6 border-indigo-500/20">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-4">
                            <RefreshCw className="text-indigo-400" size={20} />
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
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                    />
                                    <button
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
                    <section className="premium-card p-6 border-indigo-500/20">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-2">
                            <Swords className="text-indigo-400" size={20} />
                            Learning Strategy
                        </h2>
                        <p className="text-sm text-zinc-400 mb-5">Choose how you want to progress through the problem sets.</p>

                        <div className="space-y-6">
                            {/* Mode picker — radio cards */}
                            <div className="grid grid-cols-2 gap-3">
                                {([ 
                                    { value: 'SPRINT', icon: Swords, label: 'Sprint Mode', desc: 'Focus intensively on one pattern before advancing.' },
                                    { value: 'RANDOM', icon: Shuffle, label: 'Random Mode', desc: 'Mix problems from all categories for broad coverage.' },
                                ] as const).map(({ value, icon: Icon, label, desc }) => {
                                    const active = settings.learningMode === value;
                                    return (
                                        <button
                                            key={value}
                                            onClick={() => updateSettings({ learningMode: value })}
                                            className={clsx(
                                                'group text-left rounded-xl border p-4 transition-all duration-200 focus:outline-none',
                                                active
                                                    ? 'bg-indigo-500/10 border-indigo-500/60 ring-1 ring-indigo-500/40'
                                                    : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50'
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <Icon
                                                    size={18}
                                                    className={active ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'}
                                                />
                                                <span className={clsx(
                                                    'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                                                    active ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600'
                                                )}>
                                                    {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </span>
                                            </div>
                                            <p className={clsx('text-sm font-semibold mb-1', active ? 'text-indigo-300' : 'text-zinc-300')}>{label}</p>
                                            <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Strict / Flexible picker — only relevant when Sprint is active */}
                            <div className={clsx('space-y-4 transition-opacity duration-200', settings.learningMode !== 'SPRINT' && 'opacity-40 pointer-events-none')}>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Sprint Discipline</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {([
                                            { strict: true,  icon: Lock,   label: 'Strict',   desc: 'Problems locked to the current sprint category.' },
                                            { strict: false, icon: Unlock, label: 'Flexible', desc: 'One free-pick per week from any category.' },
                                        ] as const).map(({ strict, icon: Icon, label, desc }) => {
                                            const active = (settings.sprintSettings?.strictMode ?? true) === strict;
                                            return (
                                                <button
                                                    key={label}
                                                    onClick={() => updateSettings({
                                                        sprintSettings: {
                                                            ...(settings.sprintSettings ?? { strictMode: true, lengthMultiplier: 1.0, targetDays: 7 }),
                                                            strictMode: strict,
                                                        }
                                                    })}
                                                    className={clsx(
                                                        'group text-left rounded-xl border p-4 transition-all duration-200 focus:outline-none',
                                                        active
                                                            ? 'bg-indigo-500/10 border-indigo-500/60 ring-1 ring-indigo-500/40'
                                                            : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50'
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Icon
                                                            size={16}
                                                            className={active ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'}
                                                        />
                                                        <span className={clsx(
                                                            'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                                                            active ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600'
                                                        )}>
                                                            {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </span>
                                                    </div>
                                                    <p className={clsx('text-sm font-semibold mb-1', active ? 'text-indigo-300' : 'text-zinc-300')}>{label}</p>
                                                    <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-zinc-300">Target Sprint Length</label>
                                        <span className="text-indigo-400 font-medium">{settings.sprintSettings?.targetDays ?? 7} Days</span>
                                    </div>
                                    <input
                                        type="range" min="3" max="14" step="1"
                                        value={settings.sprintSettings?.targetDays ?? 7}
                                        onChange={(e) => updateSettings({
                                            sprintSettings: {
                                                ...(settings.sprintSettings ?? { strictMode: true, lengthMultiplier: 1.0, targetDays: 7 }),
                                                targetDays: parseInt(e.target.value)
                                            }
                                        })}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
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
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500/50"
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
                                    <p className="text-xs text-zinc-500 mt-2">Forces the sprint to the selected category and resets progress within it.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Study Schedule */}
                    <section className="premium-card p-6">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-4">
                            <Clock className="text-blue-400" size={20} />
                            Study Schedule
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-zinc-300">Weekday Daily Target</label>
                                    <span className="text-emerald-400 font-medium">{formatMinutes(settings.studySchedule.weekdayMinutes)}</span>
                                </div>
                                <input
                                    type="range" min="15" max="120" step="15"
                                    value={settings.studySchedule.weekdayMinutes}
                                    onChange={(e) => updateSettings({ studySchedule: { ...settings.studySchedule, weekdayMinutes: parseInt(e.target.value) } })}
                                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                    <span>15 min</span>
                                    <span>1 hr</span>
                                    <span>2 hr</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-zinc-300">Weekend Daily Target</label>
                                    <span className="text-emerald-400 font-medium">{formatMinutes(settings.studySchedule.weekendMinutes)}</span>
                                </div>
                                <input
                                    type="range" min="15" max="120" step="15"
                                    value={settings.studySchedule.weekendMinutes}
                                    onChange={(e) => updateSettings({ studySchedule: { ...settings.studySchedule, weekendMinutes: parseInt(e.target.value) } })}
                                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                    <span>15 min</span>
                                    <span>1 hr</span>
                                    <span>2 hr</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Weekly Rest Day</label>
                                <select
                                    value={settings.studySchedule.restDay}
                                    onChange={(e) => updateSettings({ studySchedule: { ...settings.studySchedule, restDay: parseInt(e.target.value) } })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500/50"
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
                                    <button onClick={handleAddBlackoutDate} disabled={!newBlackoutStart || !newBlackoutEnd} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded-xl transition-colors shrink-0">
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {settings.studySchedule.blackoutDates.map((date, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-zinc-900 border border-zinc-800/50 p-2 rounded-lg text-sm text-zinc-300">
                                            <span>{new Date(date.start).toLocaleDateString()} - {new Date(date.end).toLocaleDateString()}</span>
                                            <button onClick={() => handleRemoveBlackoutDate(idx)} className="text-red-400 hover:bg-red-500/10 p-1 rounded-md transition-colors"><X size={14} /></button>
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
                                <button onClick={handleAddEvent} disabled={!newEventTitle || !newEventDate} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded-xl transition-colors shrink-0 flex justify-center items-center">
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
                                        <button onClick={() => removeTargetEvent(event.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><X size={16} /></button>
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
                            <Target className="text-red-400" size={20} />
                            Target Company Tier
                        </h2>
                        <p className="text-sm text-zinc-400 mb-5">Adjusts the Easy / Medium / Hard problem ratio assigned to you.</p>
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
                                                ? 'bg-red-500/10 border-red-500/50 ring-1 ring-red-500/30'
                                                : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50'
                                        )}
                                    >
                                        <p className={clsx('text-sm font-semibold', active ? 'text-red-300' : 'text-zinc-300')}>{label}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
                                    </button>
                                );
                            })}
                        </div>
                        {renderTierBar()}
                    </section>

                    {/* Interview Type & Spaced Repetition */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <section className="premium-card p-6 border-amber-500/20">
                            <h2 className="text-zinc-100 font-semibold flex gap-2 items-center mb-1">
                                <Briefcase className="text-amber-400" size={18} />
                                Interview Type
                            </h2>
                            <p className="text-xs text-zinc-500 mb-4">Calibrates problem difficulty expectations.</p>
                            <div className="flex flex-col gap-2">
                                {([
                                    { value: 'INTERNSHIP', label: 'Internship', sub: 'Easier warmup problems' },
                                    { value: 'FULL_TIME',  label: 'Full Time',  sub: 'Full difficulty range' },
                                ] as const).map(({ value, label, sub }) => {
                                    const active = settings.interviewType === value;
                                    return (
                                        <button
                                            key={value}
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
                        </section>

                        <section className="premium-card p-6 border-purple-500/20">
                            <h2 className="text-zinc-100 font-semibold flex gap-2 items-center mb-1">
                                <Zap className="text-purple-400" size={18} />
                                Spaced Repetition
                            </h2>
                            <p className="text-xs text-zinc-500 mb-4">Controls how soon solved problems resurface for review.</p>
                            <div className="flex flex-col gap-2">
                                {([
                                    { value: 'RELAXED',    label: 'Relaxed',    sub: 'Longer review intervals' },
                                    { value: 'AGGRESSIVE', label: 'Aggressive', sub: 'Frequent re-testing' },
                                ] as const).map(({ value, label, sub }) => {
                                    const active = settings.srAggressiveness === value;
                                    return (
                                        <button
                                            key={value}
                                            onClick={() => updateSettings({ srAggressiveness: value })}
                                            className={clsx(
                                                'text-left rounded-xl border px-4 py-3 transition-all duration-200 focus:outline-none',
                                                active
                                                    ? 'bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/30'
                                                    : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50'
                                            )}
                                        >
                                            <p className={clsx('text-sm font-semibold', active ? 'text-purple-300' : 'text-zinc-300')}>{label}</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* Programming Language */}
                    <section className="premium-card p-6">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-4">
                            <Code2 className="text-indigo-400" size={20} />
                            Programming Language
                        </h2>
                        <select
                            value={settings.language}
                            onChange={(e) => updateSettings({ language: e.target.value as any })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                        >
                            <option value="Python">Python</option>
                            <option value="Java">Java</option>
                            <option value="JavaScript">JavaScript</option>
                        </select>
                        <p className="text-xs text-zinc-500 mt-2">Sets the default language everywhere, including Mock Interview IDE.</p>
                    </section>

                    {/* Export Backup */}
                    <section className="premium-card p-6 border-emerald-500/20">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-4">
                            <Download className="text-emerald-400" size={20} />
                            Export Backup
                        </h2>
                        <p className="text-sm text-zinc-400 mb-5">
                            Progress and settings are saved to your account. Download JSON anytime for an extra offline copy or to move your data between environments.
                        </p>
                        <button
                            type="button"
                            onClick={handleExportData}
                            className="flex items-center gap-2 px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl transition-all duration-200 text-sm font-medium"
                        >
                            <Download size={16} />
                            Export Data
                        </button>
                        <p className="text-xs text-zinc-500 mt-3">Includes progress, settings, activity, and sprint state in one file.</p>
                    </section>
            </div>
        </div>
    );
};
