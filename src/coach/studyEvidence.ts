import { format } from "date-fns";
import { allProblems, isProblemPremium, problemMap } from "../data/problems";
import { patterns } from "../data/patterns";
import type { ProblemHistoryEntry, ProblemProgress } from "../types";
import { getPatternForProblem } from "../utils/patternMapping";
import { getStudyState, STUDY_CATEGORIES } from "../utils/study";

const topicKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const localDate = (value: string) => format(new Date(value), "yyyy-MM-dd");

export function findStudyTopic(value: string) {
  const key = topicKey(value);
  if (!key) return undefined;
  const matches = (label: string) => {
    const normalized = topicKey(label);
    return normalized === key || normalized === `${key}s`;
  };
  const category = STUDY_CATEGORIES.find(label => matches(label) || label.split(/ & | \/ /).some(matches));
  if (category) return { name: category, includes: (id: string) => problemMap[id]?.category === category };
  const pattern = patterns.find(item => matches(item.id) || matches(item.name));
  if (pattern && allProblems.some(problem => getPatternForProblem(problem) === pattern.id)) {
    return { name: pattern.name, includes: (id: string) => !!problemMap[id] && getPatternForProblem(problemMap[id]) === pattern.id };
  }
}

function latest<T extends { date: string }>(rows: T[], now: Date) {
  return rows.reduce<T | undefined>((newest, row) => {
    const time = Date.parse(row.date);
    return time <= now.getTime() && (!newest || time >= Date.parse(newest.date)) ? row : newest;
  }, undefined);
}

export function codingEvidence(row: ProblemHistoryEntry) {
  const outcome = row.codingOutcome;
  return {
    date: localDate(row.date),
    correctness: outcome?.correctness ?? "unrecorded",
    assistance: outcome?.assistance,
    explanation: outcome?.explanation,
  };
}

export function lastProblemPractice(entry: ProblemProgress, now: Date) {
  const coding = latest(entry.history, now);
  const recall = latest(entry.studyState?.recallHistory ?? [], now);
  return {
    lastCoding: coding && codingEvidence(coding),
    lastRecall: recall && { date: localDate(recall.date), outcome: recall.outcome },
    importedAcceptance: entry.studyState?.source === "leetcode_import" ? localDate(entry.firstSolvedAt) : undefined,
  };
}

export function topicReviewEvidence(
  topic: NonNullable<ReturnType<typeof findStudyTopic>>,
  progress: Record<string, ProblemProgress>,
  now: Date,
  includePremium: boolean,
) {
  const date = format(now, "yyyy-MM-dd");
  const tracked = Object.entries(progress).filter(([id]) => topic.includes(id)).map(([id, entry]) => ({
    problem: problemMap[id], entry, study: getStudyState(entry),
  }));
  const coding = latest(tracked.flatMap(({ problem, entry }) => {
    const row = latest(entry.history, now);
    return row ? [{ title: problem.title, date: row.date, row }] : [];
  }), now);
  const recall = latest(tracked.flatMap(({ problem, study }) => {
    const row = latest(study.recallHistory, now);
    return row ? [{ title: problem.title, date: row.date, outcome: row.outcome }] : [];
  }), now);
  const imported = latest(tracked.filter(({ study }) => study.source === "leetcode_import")
    .map(({ problem, entry }) => ({ title: problem.title, date: entry.firstSolvedAt })), now);
  const scheduled = tracked.filter(({ problem }) => includePremium || !isProblemPremium(problem));
  const reviewDates = (field: "nextRecallAt" | "nextCodingAt") => {
    const dates = scheduled.map(({ problem, study }) => ({ title: problem.title, date: localDate(study[field]) }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    const due = dates.filter(item => item.date <= date);
    return { dueCount: due.length, oldestDue: due[0], nextFutureDue: dates[due.length] };
  };
  return {
    topic: topic.name,
    date,
    trackedProblems: tracked.length,
    lastCoding: coding ? { title: coding.title, ...codingEvidence(coding.row) } : null,
    lastRecall: recall ? { ...recall, date: localDate(recall.date) } : null,
    lastImportedAcceptance: imported ? { ...imported, date: localDate(imported.date) } : null,
    recallDueDates: reviewDates("nextRecallAt"),
    codingDueDates: reviewDates("nextCodingAt"),
  };
}
