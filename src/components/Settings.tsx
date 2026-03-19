import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { PHASE_1_CATEGORIES, PHASE_2_CATEGORIES } from '../data/problems';
import { Settings as SettingsIcon, Clock, Brain, Target, Briefcase, Zap, Code2, Calendar, Plus, X, RefreshCw, CheckCircle, Download, Swords, Lock, Unlock } from 'lucide-react';
import { clsx } from 'clsx';

export const Settings: React.FC = () => {
    const settings = useStore((state) => state.settings);
    const updateSettings = useStore((state) => state.updateSettings);
    const targetEvents = useStore((state) => state.targetEvents);
    const addTargetEvent = useStore((state) => state.addTargetEvent);
    const removeTargetEvent = useStore((state) => state.removeTargetEvent);
    const sprintState = useStore((state) => state.sprintState);
    const setSprintCategory = useStore((state) => state.setSprintCategory);

    const leetcodeUsername = useStore((state) => state.leetcodeUsername);
    const setLeetCodeUsername = useStore((state) => state.setLeetCodeUsername);
    const syncLeetCode = useStore((state) => state.syncLeetCode);
    const lastSync = useStore((state) => state.lastSync);
    const lastSyncCount = useStore((state) => state.lastSyncCount);
    const syncError = useStore((state) => state.syncError);

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
        const raw = localStorage.getItem('leetcode-tracker-storage');
        if (!raw) return;
        const blob = new Blob([raw], { type: 'application/json' });
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
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-50 flex items-center gap-3">
                    <SettingsIcon className="text-emerald-400" size={32} />
                    Plan Customization
                </h1>
                <p className="text-zinc-400 mt-1">Configure your study plan and preferences. Changes save automatically.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left Column */}
                <div className="space-y-6">

                    {/* Study Schedule */}
                    <section className="premium-card p-6">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-6">
                            <Clock className="text-blue-400" size={20} />
                            Study Schedule
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-zinc-300">Weekday Daily Target</label>
                                    <span className="text-emerald-400 font-medium">{settings.studySchedule.weekdayMinutes} min</span>
                                </div>
                                <input
                                    type="range" min="20" max="120" step="15"
                                    value={settings.studySchedule.weekdayMinutes}
                                    onChange={(e) => updateSettings({ studySchedule: { ...settings.studySchedule, weekdayMinutes: parseInt(e.target.value) } })}
                                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-zinc-300">Weekend Daily Target</label>
                                    <span className="text-emerald-400 font-medium">{settings.studySchedule.weekendMinutes} min</span>
                                </div>
                                <input
                                    type="range" min="20" max="120" step="15"
                                    value={settings.studySchedule.weekendMinutes}
                                    onChange={(e) => updateSettings({ studySchedule: { ...settings.studySchedule, weekendMinutes: parseInt(e.target.value) } })}
                                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Weekly Rest Day</label>
                                <select
                                    value={settings.studySchedule.restDay}
                                    onChange={(e) => updateSettings({ studySchedule: { ...settings.studySchedule, restDay: parseInt(e.target.value) } })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                                >
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

                    {/* Programming Language */}
                    <section className="premium-card p-6">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-6">
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

                    {/* LeetCode Sync */}
                    <section className="premium-card p-6 border-indigo-500/20">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-6">
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

                </div>

                {/* Right Column */}
                <div className="space-y-6">

                    {/* Target Events */}
                    <section className="premium-card p-6 border-emerald-500/20">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-6">
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
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-6">
                            <Target className="text-red-400" size={20} />
                            Target Company Tier
                        </h2>
                        <select
                            value={settings.targetCompanyTier}
                            onChange={(e) => updateSettings({ targetCompanyTier: e.target.value as any })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                        >
                            <option value="FAANG">FAANG Level</option>
                            <option value="FINTECH">Fintech (Amex, Stripe, etc)</option>
                            <option value="GENERAL">General SWE</option>
                            <option value="MIXED">Mixed (Balanced)</option>
                        </select>
                        {renderTierBar()}
                    </section>

                    {/* Interview Type & Spaced Repetition */}
                    <div className="grid grid-cols-2 gap-4">
                        <section className="premium-card p-6 border-amber-500/20">
                            <h2 className="text-zinc-100 font-medium flex gap-2 items-center mb-4">
                                <Briefcase className="text-amber-400" size={18} />
                                Interview Type
                            </h2>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio" name="int-type" value="INTERNSHIP"
                                        checked={settings.interviewType === 'INTERNSHIP'}
                                        onChange={() => updateSettings({ interviewType: 'INTERNSHIP' })}
                                        className="accent-emerald-500 w-4 h-4"
                                    />
                                    <span className="text-sm text-zinc-300">Internship</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio" name="int-type" value="FULL_TIME"
                                        checked={settings.interviewType === 'FULL_TIME'}
                                        onChange={() => updateSettings({ interviewType: 'FULL_TIME' })}
                                        className="accent-emerald-500 w-4 h-4"
                                    />
                                    <span className="text-sm text-zinc-300">Full Time</span>
                                </label>
                            </div>
                        </section>

                        <section className="premium-card p-6 border-purple-500/20">
                            <h2 className="text-zinc-100 font-medium flex gap-2 items-center mb-4">
                                <Zap className="text-purple-400" size={18} />
                                Spaced Repetition
                            </h2>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio" name="sr-agg" value="RELAXED"
                                        checked={settings.srAggressiveness === 'RELAXED'}
                                        onChange={() => updateSettings({ srAggressiveness: 'RELAXED' })}
                                        className="accent-emerald-500 w-4 h-4"
                                    />
                                    <span className="text-sm text-zinc-300 group-hover:text-emerald-400">Relaxed</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio" name="sr-agg" value="AGGRESSIVE"
                                        checked={settings.srAggressiveness === 'AGGRESSIVE'}
                                        onChange={() => updateSettings({ srAggressiveness: 'AGGRESSIVE' })}
                                        className="accent-emerald-500 w-4 h-4"
                                    />
                                    <span className="text-sm text-zinc-300 group-hover:text-emerald-400">Aggressive</span>
                                </label>
                            </div>
                        </section>
                    </div>

                    {/* Skill Level */}
                    <section className="premium-card p-6">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-6">
                            <Brain className="text-pink-400" size={20} />
                            Skill Assessments
                        </h2>
                        <p className="text-sm text-zinc-400 mb-6">Rate your familiarity with Phase 1 topics to adjust pacing estimates and early-phase problem recommendations.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PHASE_1_CATEGORIES.map(category => (
                                <div key={category} className="bg-zinc-950/50 border border-zinc-800/50 p-3 rounded-xl">
                                    <label className="block text-xs font-semibold text-zinc-300 mb-2 truncate" title={category}>{category}</label>
                                    <select
                                        value={settings.skillLevels[category] || 'not_familiar'}
                                        onChange={(e) => updateSettings({ skillLevels: { ...settings.skillLevels, [category]: e.target.value as any } })}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                                    >
                                        <option value="not_familiar">Not familiar</option>
                                        <option value="some_exposure">Some exposure</option>
                                        <option value="comfortable">Comfortable</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Learning Strategy & Sprint Settings */}
                    <section className="premium-card p-6 border-indigo-500/20">
                        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-2">
                            <Swords className="text-indigo-400" size={20} />
                            Learning Strategy
                        </h2>
                        <p className="text-sm text-zinc-400 mb-6">Choose how you want to progress through the problem sets.</p>

                        <div className="space-y-6">
                            {/* Learning Mode */}
                            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-200">{settings.learningMode !== 'RANDOM' ? 'Sprint Mode' : 'Random Mode'}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {settings.learningMode !== 'RANDOM'
                                                ? 'Focus intensively on one pattern before advancing.'
                                                : 'Mix problems from all categories for comprehensive practice.'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => updateSettings({
                                            learningMode: settings.learningMode !== 'RANDOM' ? 'RANDOM' : 'SPRINT'
                                        })}
                                        className={clsx(
                                            'relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none border',
                                            settings.learningMode !== 'RANDOM'
                                                ? 'bg-indigo-500 border-indigo-400'
                                                : 'bg-zinc-700 border-zinc-600'
                                        )}
                                        title="Toggle learning mode"
                                    >
                                        <span className={clsx(
                                            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                                            settings.learningMode !== 'RANDOM' ? 'translate-x-6' : 'translate-x-0'
                                        )} />
                                    </button>
                                </div>
                            </div>
                            {/* Strict vs Flexible */}
                            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-200">{settings.sprintSettings?.strictMode ?? true ? 'Strict Sprint Mode' : 'Flexible Mode'}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {settings.sprintSettings?.strictMode ?? true
                                                ? 'New problems locked to the current sprint category.'
                                                : 'One free-pick per week from any category.'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => updateSettings({
                                            sprintSettings: {
                                                ...(settings.sprintSettings ?? { strictMode: true, lengthMultiplier: 1.0, targetDays: 7 }),
                                                strictMode: !(settings.sprintSettings?.strictMode ?? true)
                                            }
                                        })}
                                        className={clsx(
                                            'relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none border',
                                            (settings.sprintSettings?.strictMode ?? true)
                                                ? 'bg-indigo-500 border-indigo-400'
                                                : 'bg-zinc-700 border-zinc-600'
                                        )}
                                        title="Toggle sprint mode"
                                    >
                                        <span className={clsx(
                                            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                                            (settings.sprintSettings?.strictMode ?? true) ? 'translate-x-6' : 'translate-x-0'
                                        )} />
                                    </button>
                                </div>
                                {!(settings.sprintSettings?.strictMode ?? true) && (
                                    <p className="text-xs text-indigo-400">✓ Flexible mode active — you can deviate from sprint once/week via the skip button.</p>
                                )}
                            </div>

                            {/* Sprint Length Target */}
                            {settings.learningMode === 'SPRINT' && (
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
                                    <p className="text-xs text-zinc-500 mt-2">Explicitly sets the number of days you will spend drilling a single pattern.</p>
                                </div>
                            )}

                            {/* Manual Category Selection */}
                            {settings.learningMode !== 'RANDOM' && (
                                <div className="pt-4 border-t border-zinc-800/50">
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Jump to Sprint Category</label>
                                    <select
                                        value={sprintState?.currentCategory || ''}
                                        onChange={(e) => setSprintCategory(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500/50"
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
                                    <p className="text-xs text-zinc-500 mt-2">Forces the sprint to the selected category and resets progress within the category.</p>
                                </div>
                            )}
                        </div>
                    </section>

                </div>

                {/* Data Management */}
                <section className="premium-card p-6 border-emerald-500/20">
                    <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-4">
                        <Download className="text-emerald-400" size={20} />
                        Data Management
                    </h2>
                    <p className="text-sm text-zinc-400 mb-5">
                        All your data is stored only in this browser. Export a backup regularly — especially before clearing your cache.
                    </p>
                    <button
                        onClick={handleExportData}
                        className="flex items-center gap-2 px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl transition-all duration-200 text-sm font-medium"
                    >
                        <Download size={16} />
                        Export Data
                    </button>
                    <p className="text-xs text-zinc-500 mt-3">Downloads all your progress, settings, and history as a single JSON file.</p>
                </section>

            </div>
        </div>
    );
};
