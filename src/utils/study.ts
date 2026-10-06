import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  startOfDay,
} from "date-fns";
import {
  allProblems,
  problemMap,
  problemsPoolForTargetCurriculum,
  isProblemPremium,
  type Problem,
} from "../data/problems";
import { patterns } from "../data/patterns";
import { getPatternLessonMeta } from "../data/patternLessonMeta";
import { getPatternForProblem } from "./patternMapping";
import { getSrIntervalMultiplier } from "./dateUtils";
import type {
  AppSettings,
  CodingOutcome,
  PracticeKind,
  ProblemProgress,
  RecallAttempt,
  SessionTiming,
  StudyState,
  SyntaxProgress,
} from "../types";

export const isIndependentPass = (outcome?: CodingOutcome) =>
  outcome?.correctness === "passed" &&
  outcome.assistance === "none" &&
  outcome.explanation === "clear";

export function getStudyState(progress: ProblemProgress): StudyState {
  if (progress.studyState) return progress.studyState;
  // A read never rewrites old ratings or retirement flags. Legacy evidence stays
  // visible, while the new planner asks for an assessment and samples maintenance.
  return {
    version: 1,
    source: "legacy",
    recallIntervalDays: 3,
    codingIntervalDays: 14,
    lapses: 0,
    nextRecallAt: progress.retired
      ? addDays(new Date(progress.lastReviewedAt), 45).toISOString()
      : progress.nextReviewAt,
    nextCodingAt: addDays(
      new Date(progress.lastReviewedAt),
      progress.retired ? 45 : 14,
    ).toISOString(),
    recallHistory: [],
  };
}

export function hasDelayedIndependentPass(progress?: ProblemProgress): boolean {
  if (!progress) return false;
  const latest = progress.history.at(-1);
  if (!isIndependentPass(latest?.codingOutcome)) return false;
  const recallFailures = (progress.studyState?.recallHistory ?? []).filter(
    (r) => r.outcome !== "recalled",
  );
  const lastRecallFailure = recallFailures.at(-1)?.date;
  let lastCodingFailure = -1;
  progress.history.forEach((h, index) => {
    if (h.codingOutcome && !isIndependentPass(h.codingOutcome))
      lastCodingFailure = index;
  });
  const current = progress.history
    .slice(lastCodingFailure + 1)
    .filter(
      (h) =>
        !lastRecallFailure ||
        Date.parse(h.date) > Date.parse(lastRecallFailure),
    );
  // Require a delayed test since the preceding coding attempt. Daily rehearsal
  // for a week must not masquerade as one week of retained implementation.
  return current.some(
    (entry, index) =>
      index > 0 &&
      isIndependentPass(entry.codingOutcome) &&
      isIndependentPass(current[index - 1].codingOutcome) &&
      differenceInCalendarDays(
        new Date(entry.date),
        new Date(current[index - 1].date),
      ) >= 7,
  );
}

export function getLearningStatus(
  progress?: ProblemProgress,
):
  | "unseen"
  | "needs_assessment"
  | "relearning"
  | "developing"
  | "approach_recalled"
  | "maintenance" {
  if (!progress) return "unseen";
  if (hasDelayedIndependentPass(progress)) return "maintenance";
  const coding = progress.history.at(-1);
  const recall = progress.studyState?.recallHistory.at(-1);
  if (
    recall &&
    (!coding || Date.parse(recall.date) > Date.parse(coding.date))
  ) {
    return recall.outcome === "recalled" ? "approach_recalled" : "relearning";
  }
  if (coding?.codingOutcome)
    return isIndependentPass(coding.codingOutcome)
      ? "developing"
      : "relearning";
  return coding && coding.rating <= 2 ? "relearning" : "needs_assessment";
}

export const LEARNING_STATUS_LABELS = {
  unseen: "Not started",
  needs_assessment: "Needs assessment",
  relearning: "Needs practice",
  developing: "Developing",
  approach_recalled: "Approach recalled",
  maintenance: "Maintenance",
};

function spreadDays(days: number, problemId: string, now: Date, kind: string) {
  if (days < 7) return days;
  const key = `${problemId}:${format(now, "yyyy-MM-dd")}:${kind}`;
  const hash = [...key].reduce(
    (h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0,
    0,
  );
  const spread = Math.max(1, Math.round(days * 0.15));
  return Math.min(
    kind === "coding" ? 120 : 90,
    Math.max(1, days + (hash % (2 * spread + 1)) - spread),
  );
}

export function scheduleCoding(
  progress: ProblemProgress,
  problemId: string,
  outcome: CodingOutcome | undefined,
  rating: number,
  settings: AppSettings["srAggressiveness"],
  now: Date,
): StudyState {
  const previous = getStudyState(progress);
  const priorAttempt = progress.history.at(-2);
  const delayed =
    isIndependentPass(priorAttempt?.codingOutcome) &&
    priorAttempt &&
    differenceInCalendarDays(now, new Date(priorAttempt.date)) >=
      Math.max(1, previous.codingIntervalDays / 2);
  const independent = isIndependentPass(outcome);
  const goodRecall = independent || (!outcome && rating >= 3);
  const codingIntervalDays = independent
    ? Math.min(
        120,
        Math.max(
          7,
          Math.round(
            (delayed
              ? previous.codingIntervalDays * 1.8
              : isIndependentPass(priorAttempt?.codingOutcome)
                ? previous.codingIntervalDays
                : 7) * getSrIntervalMultiplier(settings),
          ),
        ),
      )
    : outcome?.correctness === "unfinished"
      ? 1
      : goodRecall
        ? 7
        : 2;
  const recallIntervalDays = independent
    ? Math.min(
        60,
        Math.max(
          3,
          Math.round(previous.recallIntervalDays * (delayed ? 1.6 : 1)),
        ),
      )
    : goodRecall
      ? 3
      : 1;
  return {
    ...previous,
    source: "practice",
    codingIntervalDays,
    recallIntervalDays,
    lapses: previous.lapses + (goodRecall ? 0 : 1),
    nextRecallAt: addDays(
      startOfDay(now),
      spreadDays(recallIntervalDays, problemId, now, "recall"),
    ).toISOString(),
    nextCodingAt: addDays(
      startOfDay(now),
      spreadDays(codingIntervalDays, problemId, now, "coding"),
    ).toISOString(),
  };
}

export function applyRecall(
  progress: ProblemProgress,
  problemId: string,
  attempt: RecallAttempt,
  notes?: string,
): ProblemProgress {
  if (
    getStudyState(progress).recallHistory.some(
      (entry) => entry.id === attempt.id,
    )
  )
    return progress;
  const previous = getStudyState(progress);
  const now = new Date(attempt.date);
  const lastPractice =
    previous.recallHistory.at(-1)?.date ?? progress.lastReviewedAt;
  const delayed =
    differenceInCalendarDays(now, new Date(lastPractice)) >=
    Math.max(1, previous.recallIntervalDays / 2);
  const recallIntervalDays =
    attempt.outcome === "recalled"
      ? delayed
        ? Math.min(
            90,
            Math.max(4, Math.round(previous.recallIntervalDays * 1.8)),
          )
        : previous.recallIntervalDays
      : attempt.outcome === "partial"
        ? 2
        : 1;
  // Recall success extends only recall. Coding remains a separate assessment.
  const nextCodingAt =
    attempt.outcome === "recalled"
      ? previous.nextCodingAt
      : new Date(
          Math.min(
            Date.parse(previous.nextCodingAt),
            addDays(
              startOfDay(now),
              attempt.outcome === "forgot" ? 1 : 3,
            ).getTime(),
          ),
        ).toISOString();
  const studyState: StudyState = {
    ...previous,
    recallIntervalDays,
    nextCodingAt,
    nextRecallAt: addDays(
      startOfDay(now),
      spreadDays(recallIntervalDays, problemId, now, "recall"),
    ).toISOString(),
    lapses: previous.lapses + (attempt.outcome === "forgot" ? 1 : 0),
    recallHistory: [...previous.recallHistory, attempt],
  };
  return {
    ...progress,
    studyState,
    retired: false,
    notes: notes ?? progress.notes,
    nextReviewAt: new Date(
      Math.min(Date.parse(studyState.nextRecallAt), Date.parse(nextCodingAt)),
    ).toISOString(),
  };
}

export function estimateCodingMinutes(
  problem: Problem,
  timings: SessionTiming[] = [],
) {
  const samples = timings.filter(
    (t) =>
      t.category === problem.category &&
      t.sessionType !== "recall" &&
      t.elapsedSeconds >= 60,
  );
  if (samples.length >= 3)
    return Math.max(
      5,
      Math.round(
        samples.reduce((sum, t) => sum + t.elapsedSeconds, 0) /
          samples.length /
          60,
      ),
    );
  return problem.difficulty === "Easy"
    ? 12
    : problem.difficulty === "Hard"
      ? 38
      : 22;
}

export interface StudyTask {
  problemId: string;
  kind: "recall" | PracticeKind;
  minutes: number;
  estimatedMinutes: number;
  reason: string;
}
export interface StudyPlan {
  dailyMinutes: number;
  spentMinutes: number;
  remainingMinutes: number;
  plannedMinutes: number;
  recallTasks: StudyTask[];
  mainTask: StudyTask | null;
  syntaxCards: string[];
  eligibleRecallCount: number;
  eligibleCodingCount: number;
  isRestDay: boolean;
  isBlackout: boolean;
  learningDay: boolean;
}

/** One planner owns every minute and assignment. Eligibility is a queue, not debt. */
export function buildStudyPlan(params: {
  progress: Record<string, ProblemProgress>;
  settings: AppSettings;
  timings?: SessionTiming[];
  syntaxProgress?: Record<string, SyntaxProgress>;
  targetInterviewDate?: string;
  excludedIds?: string[];
  activeSeconds?: number;
  activeRecallSeconds?: number;
  now?: Date;
}): StudyPlan {
  const {
    progress,
    settings,
    timings = [],
    syntaxProgress = {},
    excludedIds = [],
    targetInterviewDate,
    activeSeconds = 0,
    activeRecallSeconds = 0,
    now = new Date(),
  } = params;
  const day = now.getDay();
  const dailyMinutes = Math.max(
    0,
    Math.floor(
      day === 0 || day === 6
        ? settings.studySchedule.weekendMinutes
        : settings.studySchedule.weekdayMinutes,
    ),
  );
  const todayTimings = timings.filter((t) => isSameDay(new Date(t.date), now));
  const spentMinutes = Math.ceil(
    (todayTimings.reduce((sum, t) => sum + t.elapsedSeconds, 0) +
      Math.max(0, activeSeconds)) /
      60,
  );
  const remainingMinutes = Math.max(0, dailyMinutes - spentMinutes);
  const dateKey = format(now, "yyyy-MM-dd");
  const isBlackout = settings.studySchedule.blackoutDates.some(
    (range) =>
      dateKey >= range.start.slice(0, 10) && dateKey <= range.end.slice(0, 10),
  );
  const isRestDay = settings.studySchedule.restDay === day;
  const touched = new Set([
    ...excludedIds,
    ...todayTimings.map((t) => t.problemId),
  ]);
  for (const [id, entry] of Object.entries(progress)) {
    if (
      entry.studyState?.recallHistory.some((r) =>
        isSameDay(new Date(r.date), now),
      ) ||
      entry.history.some(
        (h) => h.codingOutcome && isSameDay(new Date(h.date), now),
      )
    )
      touched.add(id);
  }
  const allowed = (p?: Problem): p is Problem =>
    !!p && (settings.includePremiumInAssignments || !isProblemPremium(p));
  const isDue = (date: string) =>
    startOfDay(new Date(date)).getTime() <= startOfDay(now).getTime();
  const eligible = Object.keys(progress).filter((id) =>
    allowed(problemMap[id]),
  );
  const priority = (id: string, coding: boolean) => {
    const state = getStudyState(progress[id]);
    const due = coding ? state.nextCodingAt : state.nextRecallAt;
    const age = Math.max(0, differenceInCalendarDays(now, new Date(due)));
    // Age grows without a cap so repeatedly deferred items eventually get a turn.
    return age + (getLearningStatus(progress[id]) === "relearning" ? 14 : 0);
  };
  const dueRecall = eligible
    .filter((id) => isDue(getStudyState(progress[id]).nextRecallAt))
    .sort(
      (a, b) => priority(b, false) - priority(a, false) || a.localeCompare(b),
    );
  const dueCoding = eligible
    .filter((id) => isDue(getStudyState(progress[id]).nextCodingAt))
    .sort(
      (a, b) => priority(b, true) - priority(a, true) || a.localeCompare(b),
    );
  const daysToInterview = targetInterviewDate
    ? differenceInCalendarDays(
        new Date(`${targetInterviewDate.slice(0, 10)}T12:00:00`),
        now,
      )
    : Infinity;
  const interviewSoon = daysToInterview >= 0 && daysToInterview <= 30;
  const maintenanceDay =
    (settings.studySchedule.restDay >= 0
      ? settings.studySchedule.restDay + 6
      : 6) % 7;
  const learningDay =
    !interviewSoon && day !== maintenanceDay && [0, 1, 3, 5].includes(day);
  const plan: StudyPlan = {
    dailyMinutes,
    spentMinutes,
    remainingMinutes,
    plannedMinutes: 0,
    recallTasks: [],
    mainTask: null,
    syntaxCards: [],
    eligibleRecallCount: dueRecall.length,
    eligibleCodingCount: dueCoding.length,
    isRestDay,
    isBlackout,
    learningDay,
  };
  if (isRestDay || isBlackout || remainingMinutes === 0) return plan;

  const recallSpent =
    todayTimings
      .filter((t) => t.sessionType === "recall")
      .reduce((s, t) => s + t.elapsedSeconds / 60, 0) +
    Math.max(0, activeRecallSeconds) / 60;
  const recallAllowance = Math.max(
    0,
    Math.floor(dailyMinutes * 0.3) - Math.ceil(recallSpent),
  );
  let recallBudget = Math.min(recallAllowance, remainingMinutes);
  const unfinished = eligible.find(
    (id) =>
      !touched.has(id) &&
      progress[id].history.at(-1)?.codingOutcome?.correctness === "unfinished",
  );
  const availableCoding = dueCoding.filter((id) => !touched.has(id));
  const reservedCoding =
    unfinished ??
    (!learningDay
      ? day === maintenanceDay
        ? availableCoding[0]
        : (availableCoding.find(
            (id) => getLearningStatus(progress[id]) === "relearning",
          ) ?? availableCoding[0])
      : undefined);
  const recallCandidates = dueRecall.filter(
    (id) => !touched.has(id) && id !== reservedCoding,
  );
  const usedPatterns = new Set<string>();
  const selected = new Set<string>();
  // Mix patterns, then fill remaining capacity without duplicating an item.
  for (const diversify of [true, false])
    for (const id of recallCandidates) {
      if (recallBudget < 3 || selected.has(id)) continue;
      const key =
        getPatternForProblem(problemMap[id]) ?? problemMap[id].category;
      if (diversify && usedPatterns.has(key)) continue;
      selected.add(id);
      usedPatterns.add(key);
      recallBudget -= 3;
      plan.recallTasks.push({
        problemId: id,
        kind: "recall",
        minutes: 3,
        estimatedMinutes: 3,
        reason:
          getLearningStatus(progress[id]) === "needs_assessment"
            ? "Assess what you remember before choosing a full re-solve."
            : "Retrieve the approach before looking at your notes.",
      });
    }
  let capacity = remainingMinutes - plan.recallTasks.length * 3;
  const pool = problemsPoolForTargetCurriculum(
    settings.targetCurriculum,
  ).filter(allowed);
  const seen = new Set(Object.keys(progress));
  const patternKeys = new Map<string, string>();
  const patternKey = (p: Problem) => {
    if (!patternKeys.has(p.id))
      patternKeys.set(p.id, getPatternForProblem(p) ?? p.category);
    return patternKeys.get(p.id)!;
  };
  const coverage = new Map<string, number>();
  const independent = new Map<string, number>();
  for (const id of eligible) {
    const key = patternKey(problemMap[id]);
    coverage.set(key, (coverage.get(key) ?? 0) + 1);
    if (progress[id].history.some((h) => isIndependentPass(h.codingOutcome)))
      independent.set(key, (independent.get(key) ?? 0) + 1);
  }
  const patternCoverage = (p: Problem) => coverage.get(patternKey(p)) ?? 0;
  const independentCoverage = (p: Problem) =>
    independent.get(patternKey(p)) ?? 0;
  // The eight named pattern lessons do not cover every category. Give the
  // remaining categories a real foundation order rather than an index of -1.
  const categoryOrder = [
    "Arrays & Hashing",
    "Two Pointers",
    "Sliding Window",
    "Stack",
    "Binary Search",
    "Linked List",
    "Trees",
    "Tries",
    "Heap / Priority Queue",
    "Backtracking",
    "Graphs",
    "Advanced Graphs",
    "1-D Dynamic Programming",
    "2-D Dynamic Programming",
    "Greedy",
    "Intervals",
    "Math & Geometry",
    "Bit Manipulation",
  ];
  const patternOrder = (p: Problem) => {
    const index = categoryOrder.indexOf(p.category);
    return index < 0 ? categoryOrder.length : index;
  };
  const newCandidates = pool.filter(
    (p) => !seen.has(p.id) && !touched.has(p.id),
  );
  const coveredPatterns = new Set(
    eligible.map((id) => getPatternForProblem(problemMap[id])),
  );
  const unmetPrerequisites = (p: Problem) => {
    const pattern = patterns.find(
      (item) => item.id === getPatternForProblem(p),
    );
    return pattern
      ? getPatternLessonMeta(pattern.id, pattern.isCore).prerequisites.filter(
          (id) => !coveredPatterns.has(id),
        ).length
      : 0;
  };
  newCandidates.sort((a, b) => {
    if (settings.learningMode !== "EXPLORE") {
      const prerequisites = unmetPrerequisites(a) - unmetPrerequisites(b);
      if (prerequisites) return prerequisites;
    }
    // Learn representative problems across patterns before exhausting one topic.
    const breadth =
      Math.min(patternCoverage(a), 2) - Math.min(patternCoverage(b), 2);
    if (breadth) return breadth;
    if (settings.learningMode !== "EXPLORE") {
      const order = patternOrder(a) - patternOrder(b);
      if (order) return order;
    }
    const difficulty = { Easy: 0, Medium: 1, Hard: 2 };
    return (
      difficulty[a.difficulty] - difficulty[b.difficulty] ||
      a.id.localeCompare(b.id)
    );
  });
  const codingOptions = dueCoding.filter(
    (id) => !touched.has(id) && !selected.has(id),
  );
  // Reserve one day per week for the oldest waiting implementation check; on
  // other implementation days, address a demonstrated gap first.
  const codingCandidate =
    day === maintenanceDay
      ? codingOptions[0]
      : (codingOptions.find(
          (id) => getLearningStatus(progress[id]) === "relearning",
        ) ?? codingOptions[0]);
  // A completed target list must not eliminate transfer practice. Related
  // unseen variations come from the larger curated catalog, with paid access
  // still respected. Prior encounter is exposure, not proof of mastery.
  const relatedVariants = newCandidates.length
    ? []
    : allProblems.filter(
        (p) =>
          p.isNeetCode250 &&
          allowed(p) &&
          !seen.has(p.id) &&
          !touched.has(p.id) &&
          patternCoverage(p) >= 2,
      );
  relatedVariants.sort(
    (a, b) =>
      independentCoverage(b) - independentCoverage(a) ||
      (a.difficulty === "Hard" ? 1 : 0) - (b.difficulty === "Hard" ? 1 : 0) ||
      a.id.localeCompare(b.id),
  );
  const newCandidate = newCandidates[0] ?? relatedVariants[0];
  const relatedVariant = newCandidates.length === 0 && !!newCandidate;
  const mainId =
    unfinished ??
    (learningDay && newCandidate
      ? newCandidate.id
      : (codingCandidate ?? newCandidate?.id));
  if (mainId && capacity > 0) {
    const problem = problemMap[mainId];
    const isNew = !progress[mainId];
    const kind: PracticeKind = isNew
      ? relatedVariant || independentCoverage(problem) >= 2
        ? "variant"
        : "learning"
      : "coding_review";
    const estimatedMinutes = estimateCodingMinutes(problem, timings);
    plan.mainTask = {
      problemId: mainId,
      kind,
      estimatedMinutes,
      minutes: Math.min(estimatedMinutes, capacity),
      reason:
        unfinished === mainId
          ? "Continue the attempt you paused for time."
          : kind === "variant"
            ? "Test a familiar pattern on an unseen problem, without hints first."
            : kind === "learning"
              ? "Build coverage with a representative problem from your target list."
              : "Check implementation independently; recall alone cannot verify it.",
    };
    capacity -= plan.mainTask.minutes;
  }
  const syntaxDue = Object.entries(syntaxProgress).filter(([, value]) =>
    isDue(value.nextReviewAt),
  );
  if (capacity >= 3 && syntaxDue.length) {
    plan.syntaxCards = [syntaxDue[0][0]];
    capacity -= 3;
  }
  plan.plannedMinutes = remainingMinutes - capacity;
  return plan;
}

export function getPatternEvidence(
  problemIds: string[],
  progress: Record<string, ProblemProgress>,
  patternId?: string,
) {
  const dependable = problemIds.filter((id) =>
    hasDelayedIndependentPass(progress[id]),
  );
  const variantIds = patternId
    ? [
        ...new Set([
          ...problemIds,
          ...Object.keys(progress).filter(
            (id) =>
              problemMap[id] &&
              getPatternForProblem(problemMap[id]) === patternId,
          ),
        ]),
      ]
    : problemIds;
  const variantPassed = variantIds.some((id) => {
    const entry = progress[id];
    return (
      entry &&
      getLearningStatus(entry) !== "relearning" &&
      isIndependentPass(entry.history.at(-1)?.codingOutcome) &&
      entry.history.some(
        (h) =>
          h.practiceKind === "variant" && isIndependentPass(h.codingOutcome),
      )
    );
  });
  return {
    dependable: dependable.length,
    variantPassed,
    established:
      dependable.length >= Math.min(2, problemIds.length) &&
      problemIds.length > 0 &&
      variantPassed,
  };
}
