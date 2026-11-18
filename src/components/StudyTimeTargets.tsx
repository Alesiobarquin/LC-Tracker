import { useRef, useState } from 'react';
import { z } from 'zod';
import type { AppSettings } from '../types';
import { useRegisterCoachTools } from '../coach/commands';

const MINUTES = { min: 15, max: 120, step: 15 };
const targetMinutes = z.number().int().min(MINUTES.min).max(MINUTES.max).multipleOf(MINUTES.step);
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
    const savingRef = useRef(false);
    const values = draft ?? settings.studySchedule;
    const changed = draft !== null && TARGETS.some(({ key }) => draft[key] !== draft.base.studySchedule[key]);

    function edit(fields: Partial<Pick<Draft, 'weekdayMinutes' | 'weekendMinutes'>>) {
        setDraft((current) => ({
            ...(current ?? { base: settings, weekdayMinutes: settings.studySchedule.weekdayMinutes,
                weekendMinutes: settings.studySchedule.weekendMinutes }),
            ...fields,
        }));
        setSaved(false);
        setError('');
    }

    async function save() {
        if (!draft || !changed || savingRef.current || !ready) {
            return { message: 'There are no changes ready to save.' };
        }
        savingRef.current = true;
        setSaving(true);
        setError('');
        try {
            await onSave({ studySchedule: { ...draft.base.studySchedule,
                weekdayMinutes: draft.weekdayMinutes, weekendMinutes: draft.weekendMinutes } }, draft.base);
            setDraft(null);
            setSaved(true);
            return { message: 'Study time targets saved.' };
        } catch (failure) {
            setError((failure as { code?: string })?.code === 'PT409'
                ? 'Your study time targets changed on another device. Select Use saved targets before editing again.'
                : 'Could not save your study time targets. Your selections are still here; check your connection and retry.');
            return { message: 'The save was not confirmed. Review the targets in Settings.' };
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    }

    useRegisterCoachTools(ready ? {
        settings_read_time_targets: {
            kind: 'read',
            description: 'Read current study target sliders and whether a draft is pending. No arguments.',
            run: () => ({
                message: draft && changed ? 'Study time target changes are awaiting Save.' : 'Current study time targets.',
                data: { weekdayMinutes: values.weekdayMinutes, weekendMinutes: values.weekendMinutes, saving, saved, conflictOrError: Boolean(error) },
            }),
        },
        settings_prepare_time_targets: {
            description: 'Edit the actual study time target draft. Optional weekdayMinutes and weekendMinutes, 15 to 120 in multiples of 15.',
            run: (args) => {
                const parsed = z.strictObject({ weekdayMinutes: targetMinutes.optional(), weekendMinutes: targetMinutes.optional() }).safeParse(args);
                if (!parsed.success || !Object.keys(parsed.data).length || savingRef.current) {
                    return { message: 'Choose a weekday or weekend target from 15 to 120 minutes, in 15-minute steps.' };
                }
                edit(parsed.data);
                return { message: 'Study time target draft updated. Use Save study time targets to apply it.' };
            },
        },
        settings_save_time_targets: {
            description: 'Save the current study time target draft after the user explicitly requests Save. No arguments.',
            run: (args) => Object.keys(args).length ? { message: 'Save takes no arguments.' } : save(),
        },
    } : {});

    return (
        <div className="space-y-6">
            <p className="text-xs text-subtle">Adjust your weekday and weekend study time, then save your targets.</p>
            {TARGETS.map(({ key, label }) => (
                <div key={key}>
                    <div className="flex justify-between mb-2">
                        <label htmlFor={key} className="text-sm font-medium text-body">{label}</label>
                        <span className="text-accent font-medium">{formatMinutes(values[key])}</span>
                    </div>
                    <input
                        id={key}
                        type="range"
                        min={MINUTES.min}
                        max={MINUTES.max}
                        step={MINUTES.step}
                        value={values[key]}
                        onChange={(event) => edit({ [key]: Number(event.target.value) })}
                        disabled={!ready || saving}
                        className="w-full h-2 bg-muted-surface rounded-lg appearance-none cursor-pointer accent-warning disabled:opacity-50"
                    />
                    <div className="relative w-full text-xs text-subtle mt-1 h-4">
                        <span className="absolute left-0 top-0">15 min</span>
                        <span className="absolute top-0 -translate-x-1/2" style={{ left: `${((60 - MINUTES.min) / (MINUTES.max - MINUTES.min)) * 100}%` }}>1 hr</span>
                        <span className="absolute right-0 top-0">2 hr</span>
                    </div>
                </div>
            ))}
            <div className="space-y-2">
                <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => void save()} disabled={!changed || !ready || saving}
                        className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent disabled:opacity-50">
                        {saving ? 'Saving study time targets…' : 'Save study time targets'}
                    </button>
                    {draft && <button type="button" disabled={saving} onClick={() => { setDraft(null); setError(''); setSaved(false); }}
                        className="text-sm text-muted hover:text-body disabled:opacity-50">Use saved targets</button>}
                </div>
                {saved && <p role="status" className="text-sm text-accent">Study time targets saved.</p>}
                {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            </div>
        </div>
    );
}
