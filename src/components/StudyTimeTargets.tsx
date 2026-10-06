import { useState } from 'react';
import type { AppSettings } from '../types';

const MINUTES = { min: 15, max: 120, step: 15 };
const TARGETS = [
    { key: 'weekdayMinutes', label: 'Weekday Daily Target' },
    { key: 'weekendMinutes', label: 'Weekend Daily Target' },
] as const;

function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}

type Draft = { base: AppSettings; weekdayMinutes: number; weekendMinutes: number };
type Props = {
    settings: AppSettings;
    ready: boolean;
    onSave: (patch: Partial<AppSettings>, base: AppSettings) => Promise<unknown>;
};

export function StudyTimeTargets({ settings, ready, onSave }: Props) {
    const [draft, setDraft] = useState<Draft | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const values = draft ?? settings.studySchedule;
    const changed = draft !== null && TARGETS.some(({ key }) => draft[key] !== draft.base.studySchedule[key]);

    function edit(key: typeof TARGETS[number]['key'], value: number) {
        setDraft((current) => ({
            ...(current ?? { base: settings, weekdayMinutes: settings.studySchedule.weekdayMinutes,
                weekendMinutes: settings.studySchedule.weekendMinutes }),
            [key]: value,
        }));
        setSaved(false);
        setError('');
    }

    async function save() {
        if (!draft || !changed || saving || !ready) return;
        setSaving(true);
        setError('');
        try {
            await onSave({ studySchedule: { ...draft.base.studySchedule,
                weekdayMinutes: draft.weekdayMinutes, weekendMinutes: draft.weekendMinutes } }, draft.base);
            setDraft(null);
            setSaved(true);
        } catch (failure) {
            setError((failure as { code?: string })?.code === 'PT409'
                ? 'Your study time targets changed on another device. Select Use saved targets before editing again.'
                : 'Could not save your study time targets. Your selections are still here; check your connection and retry.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <p className="text-xs text-zinc-500">Adjust your weekday and weekend study time, then save your targets.</p>
            {TARGETS.map(({ key, label }) => (
                <div key={key}>
                    <div className="flex justify-between mb-2">
                        <label htmlFor={key} className="text-sm font-medium text-zinc-300">{label}</label>
                        <span className="text-emerald-400 font-medium">{formatMinutes(values[key])}</span>
                    </div>
                    <input
                        id={key}
                        type="range"
                        min={MINUTES.min}
                        max={MINUTES.max}
                        step={MINUTES.step}
                        value={values[key]}
                        onChange={(event) => edit(key, Number(event.target.value))}
                        disabled={!ready || saving}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
                    />
                    <div className="relative w-full text-xs text-zinc-600 mt-1 h-4">
                        <span className="absolute left-0 top-0">15 min</span>
                        <span className="absolute top-0 -translate-x-1/2" style={{ left: `${((60 - MINUTES.min) / (MINUTES.max - MINUTES.min)) * 100}%` }}>1 hr</span>
                        <span className="absolute right-0 top-0">2 hr</span>
                    </div>
                </div>
            ))}
            <div className="space-y-2">
                <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => void save()} disabled={!changed || !ready || saving}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50">
                        {saving ? 'Saving study time targets…' : 'Save study time targets'}
                    </button>
                    {draft && <button type="button" disabled={saving} onClick={() => { setDraft(null); setError(''); setSaved(false); }}
                        className="text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50">Use saved targets</button>}
                </div>
                {saved && <p role="status" className="text-sm text-emerald-400">Study time targets saved.</p>}
                {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            </div>
        </div>
    );
}
