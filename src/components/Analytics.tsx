import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { Link } from "react-router-dom";
import { differenceInCalendarDays, format, isSameDay, subDays } from "date-fns";
import { BarChart3, Clock, X } from "lucide-react";
import {
  useProblemProgress,
  useSessionTimings,
  useUserSettings,
  fetchSessionTimingsBefore,
  getSessionTimingsWindowStartIso,
} from "../hooks/useUserData";
import {
  problemMap,
  problemsPoolForTargetCurriculum,
  ensureExtendedCatalogLoaded,
} from "../data/problems";
import { patterns } from "../data/patterns";
import { getPatternForProblem } from "../utils/patternMapping";
import {
  getPatternEvidence,
  hasDelayedIndependentPass,
  isIndependentPass,
} from "../utils/study";
import type { SessionTiming } from "../types";
import { PageHeader, QueryErrorBanner } from "./ui";
import { AnalyticsSkeleton } from "./loadingSkeletons";

const percent = (passes: number, total: number) =>
  total ? `${Math.round((passes / total) * 100)}%` : "No data yet";
export function Analytics() {
  const { user } = useUser();
  const progressQuery = useProblemProgress();
  const timingQuery = useSessionTimings();
  const settingsQuery = useUserSettings();
  const { progress } = progressQuery;
  const [older, setOlder] = useState<SessionTiming[]>([]);
  const [cursor, setCursor] = useState<{ date: string; id?: string } | null>(
    null,
  );
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [viewing, setViewing] = useState<SessionTiming | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);
  const owner = useRef(user?.id);
  owner.current = user?.id;
  useEffect(() => {
    void ensureExtendedCatalogLoaded()
      .then(() => setCatalogReady(true))
      .catch(() => setCatalogError(true));
  }, []);
  useEffect(() => {
    setOlder([]);
    setCursor(null);
    setHasMore(true);
    setLoadingOlder(false);
    setHistoryError("");
    setViewing(null);
  }, [user?.id]);
  const history = useMemo(
    () =>
      [
        ...new Map(
          [...timingQuery.sessionTimings, ...older].map((t) => [t.id, t]),
        ).values(),
      ].sort(
        (a, b) =>
          Date.parse(b.date) - Date.parse(a.date) || b.id.localeCompare(a.id),
      ),
    [timingQuery.sessionTimings, older],
  );
  const loadOlder = useCallback(async () => {
    if (!user?.id || loadingOlder || !hasMore) return;
    const userId = user.id;
    setLoadingOlder(true);
    setHistoryError("");
    try {
      const rows = await fetchSessionTimingsBefore(
        userId,
        cursor ?? { date: getSessionTimingsWindowStartIso() },
        50,
      );
      if (owner.current !== userId) return;
      setOlder((previous) => [...previous, ...rows]);
      setHasMore(rows.length === 50);
      if (rows.length)
        setCursor({ date: rows.at(-1)!.date, id: rows.at(-1)!.id });
    } catch {
      if (owner.current === userId)
        setHistoryError("Could not load older sessions. Retry when connected.");
    } finally {
      if (owner.current === userId) setLoadingOlder(false);
    }
  }, [user?.id, cursor, loadingOlder, hasMore]);
  const now = new Date();
  const recent = (date: string) =>
    differenceInCalendarDays(now, new Date(date)) >= 0 &&
    differenceInCalendarDays(now, new Date(date)) < 14;
  const recallAttempts = Object.values(progress)
    .flatMap((p) => p.studyState?.recallHistory ?? [])
    .filter((a) => recent(a.date));
  const codingAttempts = Object.values(progress)
    .flatMap((p) => p.history)
    .filter((h) => h.codingOutcome && recent(h.date));
  const delayedAttempts = Object.values(progress).flatMap((p) =>
    p.history.filter(
      (h, index) =>
        h.codingOutcome &&
        recent(h.date) &&
        index > 0 &&
        differenceInCalendarDays(
          new Date(h.date),
          new Date(p.history[index - 1].date),
        ) >= 7,
    ),
  );
  const variants = codingAttempts.filter((h) => h.practiceKind === "variant");
  const coveredPool = problemsPoolForTargetCurriculum(
    settingsQuery.settings.targetCurriculum,
  );
  const evidence = patterns
    .map((pattern) => {
      const ids = coveredPool
        .filter((p) => getPatternForProblem(p) === pattern.id)
        .map((p) => p.id);
      return {
        pattern,
        ids,
        seen: ids.filter((id) => progress[id]).length,
        ...getPatternEvidence(ids, progress, pattern.id),
      };
    })
    .filter((p) => p.ids.length > 0);
  const days = Array.from({ length: 14 }, (_, i) => subDays(now, 13 - i));
  const minuteData = days.map((day) => ({
    day,
    minutes: Math.round(
      timingQuery.sessionTimings
        .filter((t) => isSameDay(new Date(t.date), day))
        .reduce((sum, t) => sum + t.elapsedSeconds, 0) / 60,
    ),
  }));
  const maxMinutes = Math.max(1, ...minuteData.map((d) => d.minutes));
  const viewedProgress = viewing ? progress[viewing.problemId] : undefined;
  const viewedRecall = viewedProgress?.studyState?.recallHistory.find(
    (r) => r.id === viewing?.id,
  );
  const viewedCoding = viewedProgress?.history.find(
    (h) => h.sessionId === viewing?.id || h.date === viewing?.date,
  );
  if (
    catalogError ||
    progressQuery.error ||
    timingQuery.error ||
    settingsQuery.error
  )
    return <QueryErrorBanner onRetry={() => window.location.reload()} />;
  if (progressQuery.isLoading || timingQuery.isLoading || !catalogReady)
    return <AnalyticsSkeleton />;
  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-12">
      <PageHeader
        title="Learning evidence"
        icon={<BarChart3 />}
        description="Track delayed implementation, recall, transfer to new problems, and sustainable study time."
      />
      <p className="text-sm text-zinc-400">
        Outcomes are self-reported. A confidence rating, imported acceptance, or
        repeated same-day solve is not an interview readiness score.
      </p>
      <section
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        aria-label="Last 14 days"
      >
        {[
          [
            "Recall checks",
            percent(
              recallAttempts.filter((a) => a.outcome === "recalled").length,
              recallAttempts.length,
            ),
            `${recallAttempts.filter((a) => a.outcome === "recalled").length}/${recallAttempts.length} recalled in the last 14 days`,
          ],
          [
            "Delayed coding",
            percent(
              delayedAttempts.filter((h) => isIndependentPass(h.codingOutcome))
                .length,
              delayedAttempts.length,
            ),
            `${delayedAttempts.filter((h) => isIndependentPass(h.codingOutcome)).length}/${delayedAttempts.length} independent passes after a gap of at least 7 days`,
          ],
          [
            "Unseen variations",
            percent(
              variants.filter((h) => isIndependentPass(h.codingOutcome)).length,
              variants.length,
            ),
            `${variants.filter((h) => isIndependentPass(h.codingOutcome)).length}/${variants.length} independent variant passes in the last 14 days`,
          ],
          [
            "Study time",
            `${minuteData.reduce((sum, d) => sum + d.minutes, 0)} min`,
            "Recorded across the last 14 days",
          ],
        ].map(([label, value, detail]) => (
          <div key={label} className="premium-card p-5">
            <h2 className="text-sm text-zinc-400">{label}</h2>
            <p className="text-2xl font-semibold text-zinc-100 my-2">{value}</p>
            <p className="text-xs text-zinc-500">{detail}</p>
          </div>
        ))}
      </section>
      <section className="premium-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100 flex gap-2 items-center">
          <Clock size={20} /> Daily study time
        </h2>
        <div
          className="flex gap-2 items-end h-36"
          role="img"
          aria-label="Recorded study minutes in the last fourteen days"
        >
          {minuteData.map(({ day, minutes }) => (
            <div
              key={day.toISOString()}
              className="flex-1 h-full flex flex-col justify-end items-center gap-2"
              title={`${format(day, "MMM d")}: ${minutes} min`}
            >
              <div
                className="bg-emerald-500/70 rounded-t w-full min-h-1"
                style={{ height: `${(minutes / maxMinutes) * 100}px` }}
              />
              <span className="text-[10px] text-zinc-500">
                {format(day, "d")}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          {Object.values(progress).filter(hasDelayedIndependentPass).length}{" "}
          problems have independent passes at least 7 days apart. They remain
          eligible for maintenance.
        </p>
      </section>
      <section className="premium-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100">
          Pattern coverage and depth
        </h2>
        <p className="text-sm text-zinc-400">
          Encountered means present in your history. Dependable means
          independent passes on separate days at least a week apart. Established
          requires two dependable representatives (or all available if fewer)
          plus an independent pass on an unseen variation.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-3">Pattern</th>
                <th>Encountered</th>
                <th>Dependable</th>
                <th>Variant pass</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((row) => (
                <tr
                  key={row.pattern.id}
                  className="border-t border-zinc-800 text-zinc-300"
                >
                  <td className="py-3 pr-4">
                    <Link
                      to={`/patterns/${row.pattern.id}`}
                      className="text-emerald-400"
                    >
                      {row.pattern.name}
                    </Link>
                  </td>
                  <td>
                    {row.seen}/{row.ids.length}
                  </td>
                  <td>{row.dependable}</td>
                  <td>{row.variantPassed ? "Recorded" : "Not yet"}</td>
                  <td>
                    {row.established
                      ? "Established"
                      : row.seen
                        ? "Developing"
                        : "Not started"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="premium-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100">Session history</h2>
        {history.length ? (
          <div className="space-y-2">
            {history.map((t) => (
              <button
                key={t.id}
                className="w-full rounded-xl border border-zinc-800 px-4 py-3 text-left hover:border-emerald-500/40 flex flex-wrap justify-between gap-3"
                onClick={() => setViewing(t)}
              >
                <span className="text-sm text-zinc-100">
                  {problemMap[t.problemId]?.title ?? t.problemId}
                  <span className="block text-xs text-zinc-500 mt-1">
                    {format(new Date(t.date), "MMM d, yyyy · HH:mm")}
                  </span>
                </span>
                <span className="text-xs text-zinc-400">
                  {t.sessionType === "recall"
                    ? "Recall check"
                    : t.sessionType.replace("_", " ")}{" "}
                  · {Math.ceil(t.elapsedSeconds / 60)} min
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            Your first recorded recall or coding session will appear here.
          </p>
        )}
        {historyError && (
          <p role="alert" className="text-red-300">
            {historyError}
          </p>
        )}
        {hasMore && (
          <button
            className="text-sm text-emerald-400"
            disabled={loadingOlder}
            onClick={() => void loadOlder()}
          >
            {loadingOlder ? "Loading…" : "Load older sessions"}
          </button>
        )}
      </section>
      {viewing && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setViewing(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Session detail"
            className="premium-card max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between gap-4">
              <h2 className="text-xl text-zinc-100">
                {problemMap[viewing.problemId]?.title ?? viewing.problemId}
              </h2>
              <button
                aria-label="Close session detail"
                onClick={() => setViewing(null)}
              >
                <X />
              </button>
            </div>
            {viewedRecall ? (
              <>
                <p className="text-sm text-emerald-400">
                  Recall: {viewedRecall.outcome} · checked against{" "}
                  {viewedRecall.checkedAgainst}
                </p>
                <pre className="whitespace-pre-wrap text-sm text-zinc-300">
                  {viewedRecall.answer || "No approach recalled."}
                </pre>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-400">
                  Confidence: {viewing.rating}/5 (self-rating)
                </p>
                {viewedCoding?.codingOutcome ? (
                  <p className="text-sm text-zinc-300">
                    Tests: {viewedCoding.codingOutcome.correctness} ·
                    Assistance: {viewedCoding.codingOutcome.assistance} ·
                    Explanation: {viewedCoding.codingOutcome.explanation}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-400">
                    This older session has no recorded correctness or assistance
                    assessment.
                  </p>
                )}
              </>
            )}
            {viewedProgress?.notes && (
              <div>
                <h3 className="text-sm text-zinc-500">Latest problem notes</h3>
                <p className="whitespace-pre-wrap text-sm text-zinc-300 mt-2">
                  {viewedProgress.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
