import { useId } from "react";
import type { TimeSpentDraft } from "../types";
import { parseTimeSpent, timeSpentDraft } from "../utils/sessionTime";

interface Props {
  timerSeconds: number;
  draft?: TimeSpentDraft;
  disabled: boolean;
  onChange: (draft: TimeSpentDraft | undefined) => void;
}

export function TimeSpentInput({ timerSeconds, draft, disabled, onChange }: Props) {
  const id = useId();
  const value = draft ?? timeSpentDraft(timerSeconds);
  const invalid = !!draft && parseTimeSpent(draft) === null;
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="text-sm text-body mb-2">Time spent</legend>
      <div className="flex flex-wrap items-end gap-3">
        {(["minutes", "seconds"] as const).map((unit) => (
          <label key={unit} className="block text-xs text-muted">
            {unit === "minutes" ? "Minutes" : "Seconds"}
            <input
              type="number"
              aria-label={`${unit === "minutes" ? "Minutes" : "Seconds"} spent`}
              aria-describedby={`${id}-hint`}
              aria-invalid={invalid}
              min={0}
              max={unit === "seconds" ? 59 : 35_791_394}
              step={1}
              value={value[unit]}
              onChange={(event) => onChange({ ...value, [unit]: event.target.value })}
              className="mt-1 block w-24 rounded-md border border-line-strong bg-canvas p-2 text-foreground font-mono text-sm focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            />
          </label>
        ))}
        {draft && !disabled && (
          <button type="button" className="quiet-action mb-2" onClick={() => onChange(undefined)}>
            Use timer
          </button>
        )}
      </div>
      <p id={`${id}-hint`} className={`text-xs ${invalid ? "text-danger" : "text-subtle"}`}>
        {invalid
          ? "Enter whole minutes (0 or more) and seconds (0–59)."
          : disabled
            ? "Time is fixed while saving or retrying."
            : "Adjust if you forgot to stop the timer."}
      </p>
    </fieldset>
  );
}
