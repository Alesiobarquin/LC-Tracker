import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "@clerk/react";
import { z } from "zod";
import {
  Settings as SettingsIcon,
  RefreshCw,
  Download,
  Upload,
  X,
} from "lucide-react";
import { useUserSettings } from "../hooks/useUserData";
import { TARGET_CURRICULUM_LABELS } from "../data/problems";
import { Button, Modal, PageHeader, QueryErrorBanner } from "./ui";
import { StudyTimeTargets } from "./StudyTimeTargets";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useTheme } from "./ThemeProvider";
import type { AppSettings } from "../types";
import { useRegisterCoachTools } from "../coach/commands";
import { CoachSetup } from "../coach/CoachSetup";
import { COACH_SETUP_SECTION } from "../coach/connection";
import { validateBackup } from "../utils/backup";
import { safeUUID } from "../utils/uuid";

const input =
  "w-full rounded-xl border border-line-strong bg-canvas p-3 text-foreground";
const button =
  "rounded-xl border border-line-strong px-4 py-2 text-sm text-body hover:border-accent disabled:opacity-40";
const editSettings = z.strictObject({
  targetCurriculum: z.enum(["NEET_75", "NEET_150", "NEET_250", "EXTENDED"]).optional(),
  learningMode: z.enum(["CURRICULUM", "EXPLORE"]).optional(),
  language: z.enum(["Python", "Java", "JavaScript"]).optional(),
  srAggressiveness: z.enum(["RELAXED", "BALANCED", "AGGRESSIVE"]).optional(),
  includePremiumInAssignments: z.boolean().optional(),
  restDay: z.number().int().min(-1).max(6).optional(),
}).refine((value) => Object.keys(value).length > 0);
const breakRange = z.strictObject({ start: z.iso.date(), end: z.iso.date() })
  .refine(({ start, end }) => start <= end);

export function Settings() {
  const { user } = useUser();
  const { hash } = useLocation();
  const { preference, setPreference } = useTheme();
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
  const [backup, setBackup] = useState<{
    owner: string;
    name: string;
    data: ReturnType<typeof validateBackup>;
    operationId: string;
  } | null>(null);
  const operationInProgress = useRef(false);
  const importInput = useRef<HTMLInputElement>(null);
  useEffect(
    () => setUsername(query.leetcodeUsername ?? ""),
    [query.leetcodeUsername],
  );
  useEffect(() => setBackup(null), [user?.id]);
  useEffect(() => {
    if (hash === `#${COACH_SETUP_SECTION}`) document.getElementById(COACH_SETUP_SECTION)?.scrollIntoView();
  }, [hash]);
  async function run(action: () => Promise<unknown>, success: string | (() => string)) {
    if (operationInProgress.current || !query.isSuccess) {
      return { message: "Wait for the current Settings operation to finish." };
    }
    operationInProgress.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      const status = typeof success === "string" ? success : success();
      setMessage(status);
      return { message: status };
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not confirm this change. Your draft is preserved; retry when connected.",
      );
      return { message: "Could not confirm the change. Check the status in Settings." };
    } finally {
      operationInProgress.current = false;
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
  function saveAndSync(value: string) {
    let imported = 0;
    return run(async () => {
      await query.setLeetCodeUsername(value);
      imported = await query.syncLeetCode(value);
    }, () => `${imported} recent accepted submissions imported. New imports await recall assessment.`);
  }

  function editBreak(range: z.output<typeof breakRange>, include: boolean) {
    return run(() => query.updateUserData((current) => {
      const schedule = current.settings.studySchedule;
      const matches = (value: typeof range) => value.start === range.start && value.end === range.end;
      const blackoutDates = include
        ? schedule.blackoutDates.some(matches) ? schedule.blackoutDates : [...schedule.blackoutDates, range]
        : schedule.blackoutDates.filter((value) => !matches(value));
      return { ...current, settings: { ...current.settings, studySchedule: { ...schedule, blackoutDates } } };
    }), include ? "Break saved." : "Break removed.");
  }

  useRegisterCoachTools(user ? {
    settings_read: {
      kind: "read",
      description: "Read confirmed study settings, interview date, event handles, appearance, and local operation status.",
      run: () => {
        if (!query.isSuccess) return { message: "Study settings are loading or unavailable." };
        const { studySchedule, targetCurriculum, learningMode, language, srAggressiveness, includePremiumInAssignments } = settings;
        const data = {
          studySchedule: { ...studySchedule, blackoutDates: studySchedule.blackoutDates.slice(0, 8) },
          targetCurriculum, learningMode, language, srAggressiveness, includePremiumInAssignments,
          targetInterviewDate, targetEvents: targetEvents.slice(0, 8).map(({ id, date }) => ({ id, date })),
          theme: preference, leetcodeConnected: Boolean(query.leetcodeUsername), lastSyncCount: query.lastSyncCount,
          backupSelected: backup?.owner === user.id, operationFailed: Boolean(error),
        };
        return {
          message: busy ? "A Settings operation is in progress." : message || "Current study settings.",
          data,
          modelData: data,
        };
      },
    },
    settings_update: {
      description: "Save confirmed settings. Optional fields: targetCurriculum (NEET_75/NEET_150/NEET_250/EXTENDED), learningMode (CURRICULUM/EXPLORE), language (Python/Java/JavaScript), srAggressiveness (RELAXED/BALANCED/AGGRESSIVE), includePremiumInAssignments (boolean), restDay (-1 none, 0 Sunday, …6 Saturday).",
      run: (args) => {
        const parsed = editSettings.safeParse(args);
        if (!parsed.success) return { message: "Choose values supported in Study settings." };
        const { restDay, ...fields } = parsed.data;
        return run(() => updateSettings({
          ...fields, ...(restDay === undefined ? {} : { studySchedule: { ...settings.studySchedule, restDay } }),
        }, settings), "Study settings saved.");
      },
    },
    settings_set_break: {
      description: "Add or remove a break with range {start, end} (YYYY-MM-DD) and include (boolean).",
      run: (args) => {
        const parsed = z.strictObject({ range: breakRange, include: z.boolean() }).safeParse(args);
        if (!parsed.success) return { message: "Provide a valid date range and whether to include it." };
        return editBreak(parsed.data.range, parsed.data.include);
      },
    },
    settings_set_interview: {
      description: "Save the next interview date. Provide date (YYYY-MM-DD or empty string to clear).",
      run: (args) => {
        const parsed = z.strictObject({ date: z.union([z.iso.date(), z.literal("")]) }).safeParse(args);
        if (!parsed.success) return { message: "Use YYYY-MM-DD or an empty date." };
        return run(async () => {
          await setTargetInterviewDate(parsed.data.date);
          setInterviewDraft(null);
        }, "Interview date saved.");
      },
    },
    settings_add_event: {
      description: "Add a recruiting date using a user-supplied title and date (YYYY-MM-DD).",
      run: (args) => {
        const parsed = z.strictObject({ date: z.iso.date(), title: z.string().trim().min(1).max(160) }).safeParse(args);
        if (!parsed.success) return { message: "Provide an event title and date." };
        const { title, date } = parsed.data;
        const event = { id: safeUUID(), title, date, type: "Recruiting" };
        return run(() => query.updateUserData((current) => {
          const duplicate = current.targetEvents.some((entry) => entry.title === title && entry.date === date);
          return duplicate ? current : {
            ...current, targetEvents: [...current.targetEvents, event].sort((a, b) => a.date.localeCompare(b.date)),
          };
        }), "Recruiting date saved.");
      },
    },
    settings_remove_event: {
      description: "Remove a recruiting event using its id from settings_read.",
      run: (args) => {
        const parsed = z.strictObject({ id: z.string().max(100) }).safeParse(args);
        if (!parsed.success || !targetEvents.some(({ id }) => id === parsed.data.id)) {
          return { message: "Choose a current event from Study settings." };
        }
        return run(() => query.removeTargetEvent(parsed.data.id), "Recruiting date removed.");
      },
    },
    settings_theme: {
      description: "Change the browser color theme. Provide theme (light, dark, or system).",
      run: (args) => {
        const parsed = z.strictObject({ theme: z.enum(["light", "dark", "system"]) }).safeParse(args);
        if (!parsed.success) return { message: "Choose Light, Dark, or System." };
        setPreference(parsed.data.theme);
        return { message: "Browser theme updated." };
      },
    },
    settings_sync_leetcode: {
      description: "Import recent accepted submissions. Provide an optional user-supplied username, otherwise sync the saved account.",
      run: (args) => {
        const decoded = z.strictObject({ username: z.string().trim().regex(/^@?[\w-]{1,60}$/).optional() }).safeParse(args);
        if (!decoded.success) return { message: "Enter a valid LeetCode username." };
        const name = decoded.data.username ?? query.leetcodeUsername;
        if (!name) return { message: "Enter your LeetCode username in Settings first." };
        if (decoded.data.username) setUsername(name);
        return saveAndSync(name);
      },
    },
    settings_export_backup: {
      description: "Download a snapshot backup with the browser download control. Takes no arguments.",
      run: (args) => Object.keys(args).length ? { message: "Export takes no arguments." } : run(exportData, "Backup exported."),
    },
    settings_restore_backup: {
      description: "Open the local backup workflow. User chooses and confirms the file in Settings. Takes no arguments.",
      run: (args) => {
        if (Object.keys(args).length) return { message: "Restore takes no arguments." };
        if (busy || !query.isSuccess) return { message: "Wait for Settings to finish loading or saving." };
        document.getElementById("section-backup")?.scrollIntoView({ block: "start" });
        if (navigator.userActivation?.isActive) {
          importInput.current?.click();
          return { message: "Choose a backup in the file picker, then confirm its preview in Settings." };
        }
        return { message: "Choose Restore backup in Settings to pick a file, then confirm the preview there." };
      },
    },
  } : {});
  if (query.error)
    return <QueryErrorBanner onRetry={() => void query.refetch()} />;
  return (
    <div className="settings-page mx-auto space-y-6 pb-12">
      <PageHeader
        title="Study settings"
        icon={<SettingsIcon />}
        description="Set a sustainable daily budget and choose the material you want to learn."
      />
      <nav className="settings-sections" aria-label="Settings sections">
        {[
          "appearance",
          "strategy",
          "schedule",
          "targets",
          "leetcode",
          "study-chat",
          "backup",
        ].map((id) => (
          <a key={id} href={`#section-${id}`}>
            {id === "study-chat" ? "Study chat" : id[0].toUpperCase() + id.slice(1)}
          </a>
        ))}
      </nav>
      {error && (
        <p role="alert" className="rounded-xl bg-danger/10 p-4 text-danger">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-xl bg-accent/10 p-4 text-accent">
          {message}
        </p>
      )}
      <section
        id="section-appearance"
        className="premium-card p-5 sm:p-6 scroll-mt-24"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Appearance
            </h2>
            <p className="mt-1 text-sm text-muted">
              System follows your device. Your choice is remembered in this
              browser.
            </p>
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
          className="premium-card settings-section p-5 sm:p-6 scroll-mt-24"
        >
          <div className="settings-section-intro space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Learning strategy
            </h2>
            <details className="settings-policy">
              <summary>How the planner uses evidence</summary>
              <p className="text-xs text-muted leading-relaxed mt-3">
                The full plan mixes recall, independent coding, and new learning.
                Repeated measured failures shift ordinary blocks toward repair.
                A related unfamiliar check keeps a place every seven days when
                an accessible problem is available, including near an interview.
                Its topic stays hidden and it may come from the larger library.
                Long unfinished attempts rotate with other practice.
              </p>
            </details>
          </div>
          <div className="settings-section-fields space-y-5 settings-strategy-fields">
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
          </div>
        </section>
        <section
          id="section-schedule"
          className="premium-card settings-section p-5 sm:p-6 scroll-mt-24"
        >
          <div className="settings-section-intro space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Daily schedule
            </h2>
            <p className="text-sm text-muted">
              In the full plan, about 30% of your budget is reserved for brief
              recall. The main block alternates learning with implementation
              checks. Recorded study time reduces the remaining budget.
            </p>
            <p className="text-sm text-muted">
              Have a lighter day? Choose{" "}
              <Link to="/dashboard" className="text-accent underline">
                Reviews only on Today
              </Link>{" "}
              to use the time left for familiar problems. Your choice resets
              tomorrow; your schedule stays the same.
            </p>
          </div>
          <div className="settings-section-fields space-y-5">
            <StudyTimeTargets
              settings={settings}
              ready={query.isSuccess}
              onSave={updateSettings}
            />

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
                    !blackoutStart ||
                    !blackoutEnd ||
                    blackoutEnd < blackoutStart
                  }
                  onClick={async () => {
                    const result = await editBreak({ start: blackoutStart, end: blackoutEnd }, true);
                    if (result.message === "Break saved.") {
                      setBlackoutStart("");
                      setBlackoutEnd("");
                    }
                  }}
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
                    onClick={() => void editBreak(range, false)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section
          id="section-targets"
          className="premium-card settings-section p-5 sm:p-6 scroll-mt-24"
        >
          <div className="settings-section-intro space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Interview timeline
            </h2>
            <p className="text-sm text-muted">
              An interview date is optional. Without one, the plan keeps
              building coverage. Within 30 days of an upcoming interview, main
              blocks prioritize independent implementation while keeping the
              protected unfamiliar check.
            </p>
          </div>
          <div className="settings-section-fields space-y-5">
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
          </div>
        </section>
        <section
          id="section-leetcode"
          className="premium-card p-5 sm:p-6 space-y-4 scroll-mt-24"
        >
          <div className="settings-section-intro space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              LeetCode integration
            </h2>
          </div>
          <div className="settings-section-fields space-y-5">
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
              onClick={() => void saveAndSync(username)}
            >
              <RefreshCw size={15} className="inline mr-2" /> Save and sync
            </button>
            <p className="text-xs text-subtle">
              Imports preserve the original solve date and leave current
              confidence unknown. Existing study history is retained.
            </p>
          </div>
        </section>
        <section
          id={COACH_SETUP_SECTION}
          aria-labelledby="study-chat-settings-heading"
          className="premium-card settings-section p-5 sm:p-6 scroll-mt-24"
        >
          <div className="settings-section-intro space-y-3">
            <h2 id="study-chat-settings-heading" className="text-lg font-semibold text-foreground">Study chat</h2>
            <p className="text-sm text-muted">Use the study plan and progress shortcuts without a key. Connect OpenRouter to ask custom questions about your practice.</p>
          </div>
          <div className="settings-section-fields">
            <CoachSetup />
          </div>
        </section>
        <section
          id="section-backup"
          className="premium-card p-5 sm:p-6 space-y-4 scroll-mt-24"
        >
          <div className="settings-section-intro space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Backup and restore
            </h2>
            <p className="text-sm text-muted">
              Export includes your settings, coding history, recall answers,
              schedules, activity, and all recorded session times. Older backup
              files remain supported.
            </p>
          </div>
          <div className="settings-section-fields space-y-5">
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
                e.target.value = "";
                if (!file || !user) return;
                void run(async () => {
                  if (file.size > 20 * 1024 * 1024)
                    throw new Error("Backup files must be smaller than 20 MB.");
                  const data = validateBackup(JSON.parse(await file.text()));
                  setBackup({ owner: user.id, name: file.name, data, operationId: safeUUID() });
                }, "Backup verified. Review it before restoring.");
              }}
            />
          </div>
        </section>
      </fieldset>
      <Modal
        isOpen={Boolean(backup && backup.owner === user?.id)}
        onClose={() => { if (!operationInProgress.current) setBackup(null); }}
        title="Restore selected backup?"
        description="The restore can replace matching study records and settings in this account."
      >
        {backup?.owner === user?.id && backup && (
          <div className="space-y-4">
            <p className="break-words text-sm text-body">{backup.name}</p>
            <p className="text-sm text-muted">
              {Object.keys(backup.data.progress ?? {}).length} problem records · {backup.data.sessionTimings?.length ?? 0} session timings
              {backup.data.userSettings ? " · Study settings included" : ""}
            </p>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" disabled={busy} onClick={() => void run(async () => {
                await query.restoreBackup(backup.data, backup.operationId);
                setBackup(null);
              }, "Backup restored.")}>Confirm restore</Button>
              <Button disabled={busy} onClick={() => setBackup(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
