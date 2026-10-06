import { useEffect, useRef, useState } from "react";
import {
  Settings as SettingsIcon,
  RefreshCw,
  Download,
  Upload,
  X,
} from "lucide-react";
import { useUserSettings } from "../hooks/useUserData";
import { TARGET_CURRICULUM_LABELS } from "../data/problems";
import { PageHeader, QueryErrorBanner } from "./ui";
import { StudyTimeTargets } from "./StudyTimeTargets";
import { ThemeSwitcher } from "./ThemeSwitcher";
import type { AppSettings } from "../types";

const input =
  "w-full rounded-xl border border-line-strong bg-canvas p-3 text-foreground";
const button =
  "rounded-xl border border-line-strong px-4 py-2 text-sm text-body hover:border-accent disabled:opacity-40";
export function Settings() {
  const query = useUserSettings();
  const {
    settings,
    updateSettings,
    targetEvents,
    targetInterviewDate,
    setTargetInterviewDate,
  } = query;
  const [username, setUsername] = useState(query.leetcodeUsername ?? "");
  const [interviewDraft, setInterviewDraft] = useState<string | null>(null);
  const [blackoutStart, setBlackoutStart] = useState("");
  const [blackoutEnd, setBlackoutEnd] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const importInput = useRef<HTMLInputElement>(null);
  useEffect(
    () => setUsername(query.leetcodeUsername ?? ""),
    [query.leetcodeUsername],
  );
  async function run(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not confirm this change. Your draft is preserved; retry when connected.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function exportData() {
    const backup = await query.exportBackup();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `lc-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (query.error)
    return <QueryErrorBanner onRetry={() => void query.refetch()} />;
  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-12">
      <PageHeader
        title="Study settings"
        icon={<SettingsIcon />}
        description="Set a sustainable daily budget and choose the material you want to learn."
      />
      <nav
        className="flex flex-wrap gap-4 text-sm text-accent"
        aria-label="Settings sections"
      >
        {["appearance", "strategy", "schedule", "targets", "leetcode", "backup"].map((id) => (
          <a key={id} href={`#section-${id}`}>
            {id[0].toUpperCase() + id.slice(1)}
          </a>
        ))}
      </nav>
      {error && (
        <p role="alert" className="rounded-xl bg-danger/10 p-4 text-danger">
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl bg-accent/10 p-4 text-accent"
        >
          {message}
        </p>
      )}
      <section id="section-appearance" className="premium-card p-5 sm:p-6 scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
            <p className="mt-1 text-sm text-muted">System follows your device. Your choice is remembered in this browser.</p>
          </div>
          <ThemeSwitcher />
        </div>
      </section>
      <fieldset
        disabled={!query.isSuccess || busy}
        className="space-y-7 disabled:opacity-60"
      >
        <section
          id="section-strategy"
          className="premium-card p-5 sm:p-6 space-y-5 scroll-mt-24"
        >
          <h2 className="text-lg font-semibold text-foreground">
            Learning strategy
          </h2>
          <p className="text-sm text-muted">
            All modes protect new learning, mix recall checks across patterns,
            and keep coding checks separate. Progress depends on recorded
            outcomes instead of completing every problem in one pattern. When
            your target list is covered, related unseen variations may come from
            the larger curated library.
          </p>
          <label className="block text-sm text-body">
            Target problem list
            <select
              className={`${input} mt-2`}
              value={settings.targetCurriculum}
              onChange={(e) =>
                void run(
                  () =>
                    updateSettings({
                      targetCurriculum: e.target
                        .value as AppSettings["targetCurriculum"],
                    }),
                  "Target list saved.",
                )
              }
            >
              {Object.entries(TARGET_CURRICULUM_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="block text-sm text-body">
            Learning order
            <select
              className={`${input} mt-2`}
              value={
                settings.learningMode === "EXPLORE" ? "EXPLORE" : "CURRICULUM"
              }
              onChange={(e) =>
                void run(
                  () =>
                    updateSettings({
                      learningMode: e.target
                        .value as AppSettings["learningMode"],
                    }),
                  "Learning order saved.",
                )
              }
            >
              <option value="CURRICULUM">
                Guided — build representative coverage in pattern order
              </option>
              <option value="EXPLORE">
                Mixed — build coverage across topics
              </option>
            </select>
          </label>
          <label className="block text-sm text-body">
            Practice language
            <select
              className={`${input} mt-2`}
              value={settings.language}
              onChange={(e) =>
                void run(
                  () =>
                    updateSettings({
                      language: e.target.value as AppSettings["language"],
                    }),
                  "Language saved.",
                )
              }
            >
              <option>Python</option>
              <option>Java</option>
              <option>JavaScript</option>
            </select>
          </label>
          <label className="block text-sm text-body">
            Future coding intervals
            <select
              className={`${input} mt-2`}
              value={settings.srAggressiveness}
              onChange={(e) =>
                void run(
                  () =>
                    updateSettings({
                      srAggressiveness: e.target
                        .value as AppSettings["srAggressiveness"],
                    }),
                  "Future interval preference saved.",
                )
              }
            >
              <option value="RELAXED">Standard spacing</option>
              <option value="BALANCED">Somewhat shorter spacing</option>
              <option value="AGGRESSIVE">Shorter spacing</option>
            </select>
          </label>
          <p className="text-xs text-subtle">
            Changes apply to future attempts. They do not rewrite previous
            results or create a batch of new due dates.
          </p>
          <label className="flex items-start gap-3 text-sm text-body">
            <input
              type="checkbox"
              checked={settings.includePremiumInAssignments}
              onChange={(e) =>
                void run(
                  () =>
                    updateSettings({
                      includePremiumInAssignments: e.target.checked,
                    }),
                  "Premium preference saved.",
                )
              }
            />{" "}
            Include paid LeetCode problems in assignments
          </label>
        </section>
        <section
          id="section-schedule"
          className="premium-card p-5 sm:p-6 space-y-5 scroll-mt-24"
        >
          <h2 className="text-lg font-semibold text-foreground">
            Daily schedule
          </h2>
          <StudyTimeTargets
            settings={settings}
            ready={query.isSuccess}
            onSave={updateSettings}
          />
          <p className="text-sm text-muted">
            About 30% of your budget is reserved for brief recall. The main
            block alternates learning with implementation checks. Recorded study
            time reduces the remaining budget.
          </p>
          <label className="block text-sm text-body">
            Weekly rest day
            <select
              aria-label="Weekly rest day"
              className={`${input} mt-2`}
              value={settings.studySchedule.restDay}
              onChange={(e) =>
                void run(
                  () =>
                    updateSettings({
                      studySchedule: {
                        ...settings.studySchedule,
                        restDay: Number(e.target.value),
                      },
                    }),
                  "Rest day saved.",
                )
              }
            >
              <option value={-1}>None</option>
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-body">
              Scheduled breaks
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="text-sm text-muted">
                Start
                <input
                  aria-label="Break start"
                  type="date"
                  className={`${input} mt-1`}
                  value={blackoutStart}
                  onChange={(e) => setBlackoutStart(e.target.value)}
                />
              </label>
              <label className="text-sm text-muted">
                End
                <input
                  aria-label="Break end"
                  type="date"
                  className={`${input} mt-1`}
                  value={blackoutEnd}
                  onChange={(e) => setBlackoutEnd(e.target.value)}
                />
              </label>
              <button
                className={`${button} self-end`}
                disabled={
                  !blackoutStart || !blackoutEnd || blackoutEnd < blackoutStart
                }
                onClick={() =>
                  void run(async () => {
                    await updateSettings({
                      studySchedule: {
                        ...settings.studySchedule,
                        blackoutDates: [
                          ...settings.studySchedule.blackoutDates,
                          { start: blackoutStart, end: blackoutEnd },
                        ],
                      },
                    });
                    setBlackoutStart("");
                    setBlackoutEnd("");
                  }, "Break saved.")
                }
              >
                Add break
              </button>
            </div>
            {settings.studySchedule.blackoutDates.map((range, index) => (
              <div
                key={`${range.start}:${index}`}
                className="flex gap-3 justify-between text-sm text-muted"
              >
                <span>
                  {range.start} – {range.end}
                </span>
                <button
                  aria-label={`Remove break ${range.start}`}
                  onClick={() =>
                    void run(
                      () =>
                        updateSettings({
                          studySchedule: {
                            ...settings.studySchedule,
                            blackoutDates:
                              settings.studySchedule.blackoutDates.filter(
                                (_, i) => i !== index,
                              ),
                          },
                        }),
                      "Break removed.",
                    )
                  }
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
        <section
          id="section-targets"
          className="premium-card p-5 sm:p-6 space-y-5 scroll-mt-24"
        >
          <h2 className="text-lg font-semibold text-foreground">
            Interview timeline
          </h2>
          <p className="text-sm text-muted">
            An interview date is optional. Without one, the plan keeps building
            coverage. Within 30 days of an upcoming interview, main blocks
            prioritize independent implementation.
          </p>
          <label className="block text-sm text-body">
            Next interview (optional)
            <input
              aria-label="Next interview"
              type="date"
              value={(interviewDraft ?? targetInterviewDate).slice(0, 10)}
              onChange={(e) => setInterviewDraft(e.target.value)}
              className={`${input} mt-2`}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              className={button}
              disabled={interviewDraft === null}
              onClick={() =>
                void run(async () => {
                  await setTargetInterviewDate(interviewDraft!);
                  setInterviewDraft(null);
                }, "Interview date saved.")
              }
            >
              Save interview date
            </button>
            <button
              className={button}
              onClick={() =>
                void run(async () => {
                  await setTargetInterviewDate("");
                  setInterviewDraft(null);
                }, "No interview scheduled. Coverage mode is active.")
              }
            >
              No interview scheduled
            </button>
          </div>
          <details>
            <summary className="text-sm text-accent cursor-pointer">
              Other recruiting dates
            </summary>
            <div className="space-y-3 mt-4">
              <input
                aria-label="Event title"
                placeholder="Recruiting event"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className={input}
              />
              <input
                aria-label="Event date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={input}
              />
              <button
                className={button}
                disabled={!eventTitle.trim() || !eventDate}
                onClick={() =>
                  void run(async () => {
                    await query.addTargetEvent({
                      title: eventTitle.trim(),
                      type: "Recruiting",
                      date: eventDate,
                    });
                    setEventTitle("");
                    setEventDate("");
                  }, "Recruiting date saved.")
                }
              >
                Add date
              </button>
              {targetEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex justify-between text-sm text-muted"
                >
                  <span>
                    {event.title} · {event.date}
                  </span>
                  <button
                    aria-label={`Remove ${event.title}`}
                    onClick={() =>
                      void run(
                        () => query.removeTargetEvent(event.id),
                        "Date removed.",
                      )
                    }
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </details>
        </section>
        <section
          id="section-leetcode"
          className="premium-card p-5 sm:p-6 space-y-4 scroll-mt-24"
        >
          <h2 className="text-lg font-semibold text-foreground">
            LeetCode integration
          </h2>
          <label className="block text-sm text-body">
            LeetCode username
            <input
              aria-label="LeetCode username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`${input} mt-2`}
            />
          </label>
          <button
            className={button}
            disabled={!username.trim()}
            onClick={() =>
              void run(async () => {
                await query.setLeetCodeUsername(username);
                await query.syncLeetCode(username);
              }, "Recent accepted submissions imported. New imports await recall assessment.")
            }
          >
            <RefreshCw size={15} className="inline mr-2" /> Save and sync
          </button>
          <p className="text-xs text-subtle">
            Imports preserve the original solve date and leave current
            confidence unknown. Existing study history is retained.
          </p>
        </section>
        <section
          id="section-backup"
          className="premium-card p-5 sm:p-6 space-y-4 scroll-mt-24"
        >
          <h2 className="text-lg font-semibold text-foreground">
            Backup and restore
          </h2>
          <p className="text-sm text-muted">
            Export includes your settings, coding history, recall answers,
            schedules, activity, and all recorded session times. Older backup
            files remain supported.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className={button}
              onClick={() => void run(exportData, "Backup exported.")}
            >
              <Download size={15} className="inline mr-2" /> Export backup
            </button>
            <button
              className={button}
              onClick={() => importInput.current?.click()}
            >
              <Upload size={15} className="inline mr-2" /> Restore backup
            </button>
          </div>
          <input
            ref={importInput}
            className="hidden"
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void run(async () => {
                if (file.size > 20 * 1024 * 1024)
                  throw new Error("Backup files must be smaller than 20 MB.");
                await query.restoreBackup(JSON.parse(await file.text()));
                if (importInput.current) importInput.current.value = "";
              }, "Backup restored.");
            }}
          />
        </section>
      </fieldset>
    </div>
  );
}
