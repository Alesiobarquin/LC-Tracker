import { Modal } from "./ui/Modal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { Link } from "react-router-dom";
import { differenceInCalendarDays, format, isSameDay, subDays } from "date-fns";
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
import { SectionHeading } from "./ui/StudyTrace";
import { AnalyticsSkeleton } from "./loadingSkeletons";

const percent = (passes: number, total: number) =>
  total ? `${Math.round((passes / total) * 100)}%` : "—";
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
    <div className="evidence-page space-y-7 pb-12">
      <PageHeader
        title="Learning evidence"
        description="Track delayed implementation, recall, transfer to new problems, and sustainable study time."
      />
      <div className="evidence-overview">
        <div className="evidence-time">
          <p className="register-label">Recorded / last 14 days</p>
          <p className="evidence-time-value">
            <span className="register-value">
              {minuteData.reduce((sum, d) => sum + d.minutes, 0)}
            </span>
            <span>min</span>
          </p>
          <div
            className="study-chart flex gap-2 sm:gap-3 items-end h-32"
            role="img"
            aria-label={`Recorded study minutes in the last fourteen days: ${minuteData.map(({ day, minutes }) => `${format(day, "MMM d")}, ${minutes} minutes`).join("; ")}`}
          >
            {minuteData.map(({ day, minutes }) => (
              <div
                key={day.toISOString()}
                className="study-chart-day flex-1 h-full flex flex-col justify-end items-center gap-2"
                title={`${format(day, "MMM d")}: ${minutes} min`}
              >
                <div
                  className="study-chart-bar w-full"
                  style={{
                    height: minutes
                      ? `${(minutes / maxMinutes) * 88}px`
                      : "1px",
                  }}
                />
                <span className="font-mono text-[9px] text-subtle">
                  {format(day, "d")}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-subtle mt-4">
            {Object.values(progress).filter(hasDelayedIndependentPass).length}{" "}
            problems have independent passes at least 7 days apart.
          </p>
        </div>
        <section className="evidence-checks" aria-label="Last 14 days">
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
                delayedAttempts.filter((h) =>
                  isIndependentPass(h.codingOutcome),
                ).length,
                delayedAttempts.length,
              ),
              `${delayedAttempts.filter((h) => isIndependentPass(h.codingOutcome)).length}/${delayedAttempts.length} independent passes after a gap of at least 7 days`,
            ],
            [
              "Unseen variations",
              percent(
                variants.filter((h) => isIndependentPass(h.codingOutcome))
                  .length,
                variants.length,
              ),
              `${variants.filter((h) => isIndependentPass(h.codingOutcome)).length}/${variants.length} independent variant passes in the last 14 days`,
            ],
          ].map(([label, value, detail], index) => (
            <div key={label} className="evidence-check">
              <span className="evidence-kind" aria-hidden="true">
                {["R", "C", "V"][index]}
              </span>
              <div className="min-w-0">
                <h2 className="register-label">{label}</h2>
                <span className="evidence-sample font-mono text-subtle">
                  {detail.split(" ")[0]}
                </span>
                <p className="register-value text-foreground evidence-check-value">
                  {value}
                  {value === "—" && (
                    <span className="sr-only"> No data yet</span>
                  )}
                </p>
                <p className="evidence-check-detail text-[11px] text-subtle leading-relaxed">
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </section>
      </div>
      <details className="evidence-disclosure text-[11px] text-muted leading-relaxed">
        <summary>How to read the evidence</summary>
        <div className="evidence-definitions">
          <p>
            Outcomes are self-reported. A confidence rating, imported
            acceptance, or repeated same-day solve is not an interview readiness
            score.
          </p>
          <p>
            Recall checks record an approach retrieved from memory. Delayed
            coding records independent passes after a gap of at least 7 days.
            Unseen variations record independent passes on a new representative
            problem.
          </p>
          <p>
            Encountered means present in your history. Dependable means
            independent passes on separate days at least a week apart.
            Established requires two dependable representatives (or all
            available if fewer) plus an independent pass on an unseen variation.
          </p>
        </div>
      </details>
      <div className="evidence-ledgers">
        <section className="coverage-ledger register-section space-y-4">
          <SectionHeading index="02" title="Pattern coverage and depth" />
          <div className="overflow-x-auto">
            <table className="evidence-table w-full min-w-[560px] text-sm text-left">
              <thead className="text-subtle">
                <tr>
                  <th scope="col" className="py-3 pr-4">
                    Pattern
                  </th>
                  <th scope="col" className="pr-4">
                    Encountered
                  </th>
                  <th scope="col" className="pr-4">
                    Dependable
                  </th>
                  <th scope="col" className="pr-4">
                    Variant pass
                  </th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((row) => (
                  <tr
                    key={row.pattern.id}
                    className="border-t border-line text-body"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        to={`/patterns/${row.pattern.id}`}
                        className="text-foreground hover:text-accent"
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
        <section className="attempt-ledger register-section space-y-4">
          <SectionHeading
            index="01"
            title="Session history"
            detail={`${history.length} recorded`}
          />
          {history.length ? (
            <div className="space-y-0">
              {history.map((t) => (
                <button
                  key={t.id}
                  className="session-history-row"
                  onClick={() => setViewing(t)}
                >
                  <span className="attempt-date font-mono text-subtle">
                    <span>{format(new Date(t.date), "MMM d")}</span>
                    <span>{format(new Date(t.date), "HH:mm")}</span>
                  </span>
                  <span className="attempt-content">
                    <span className="text-sm text-foreground block">
                      {problemMap[t.problemId]?.title ?? t.problemId}
                    </span>
                    <span className="text-[10px] text-muted block mt-1">
                      {t.sessionType === "recall"
                        ? "Recall check"
                        : t.sessionType.replace("_", " ")}
                    </span>
                  </span>
                  <span className="attempt-minutes register-value">
                    {Math.ceil(t.elapsedSeconds / 60)}
                    <span>min</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Your first recorded recall or coding session will appear here.
            </p>
          )}
          {historyError && (
            <p role="alert" className="text-danger">
              {historyError}
            </p>
          )}
          {hasMore && (
            <button
              className="text-sm text-accent"
              disabled={loadingOlder}
              onClick={() => void loadOlder()}
            >
              {loadingOlder ? "Loading…" : "Load older sessions"}
            </button>
          )}
        </section>
      </div>
      {viewing && (
        <Modal
          isOpen
          onClose={() => setViewing(null)}
          title={problemMap[viewing.problemId]?.title ?? viewing.problemId}
          description="Session detail"
          size="lg"
        >
          <div className="space-y-4 max-h-[65vh] overflow-y-auto">
            {viewedRecall ? (
              <>
                <p className="text-sm text-accent">
                  Recall: {viewedRecall.outcome} · checked against{" "}
                  {
                    {
                      notes: "personal explanation",
                      reference: "general pattern guidance",
                      external: "external reference",
                      solution: "built-in problem explanation",
                    }[viewedRecall.checkedAgainst]
                  }
                </p>
                <h3 className="text-sm font-semibold text-foreground">
                  Original answer from memory
                </h3>
                <pre className="whitespace-pre-wrap text-sm text-body">
                  {viewedRecall.answer || "No approach recalled."}
                </pre>
                {viewedRecall.revisedAnswer !== undefined && (
                  <>
                    <h3 className="text-sm font-semibold text-foreground">
                      Correction after comparison
                    </h3>
                    <pre className="whitespace-pre-wrap text-sm text-body">
                      {viewedRecall.revisedAnswer ||
                        "The revised answer was cleared."}
                    </pre>
                  </>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-muted">
                  Confidence: {viewing.rating}/5 (self-rating)
                </p>
                {viewedCoding?.codingOutcome ? (
                  <p className="text-sm text-body">
                    Tests: {viewedCoding.codingOutcome.correctness} ·
                    Assistance: {viewedCoding.codingOutcome.assistance} ·
                    Explanation: {viewedCoding.codingOutcome.explanation}
                  </p>
                ) : (
                  <p className="text-sm text-muted">
                    This older session has no recorded correctness or assistance
                    assessment.
                  </p>
                )}
              </>
            )}
            {viewedProgress?.notes && (
              <div>
                <h3 className="text-sm text-subtle">Latest problem notes</h3>
                <p className="whitespace-pre-wrap text-sm text-body mt-2">
                  {viewedProgress.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
