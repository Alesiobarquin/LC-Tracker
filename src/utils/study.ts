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
  type Category,
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
  ProblemHistoryEntry,
} from "../types";

// Product defaults, not calibrated retention probabilities or interview scores.
export const UNSEEN_CHECK_DAYS = 7;
export const UNSEEN_CHECK_MINUTES = 35;
export const MIN_CODING_BLOCK_MINUTES = 5;
export const STUDY_CATEGORIES: Category[] = [
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

const studyKey = (problem: Problem) =>
  getPatternForProblem(problem) ?? problem.category;

/** A continuation or a later re-solve is never another unseen assessment. */
export function getUnseenAttempts(progress: Record<string, ProblemProgress>) {
  return Object.values(progress).flatMap((entry) => {
    const first = entry.history[0];
    return first?.codingOutcome && first.practiceKind === "variant"
      ? [first]
      : [];
  });
}

export function getStudyEvaluation(
  progress: Record<string, ProblemProgress>,
  now = new Date(),
) {
  const recent = (h: ProblemHistoryEntry) => {
    const age = differenceInCalendarDays(now, new Date(h.date));
    return age >= 0 && age < 14;
  };
  const coding = Object.values(progress)
    .flatMap((p) => p.history)
    .filter(
      (h) =>
        recent(h) &&
        h.codingOutcome &&
        !["unchecked", "unfinished"].includes(h.codingOutcome.correctness),
    );
  const delayed = Object.values(progress).flatMap((p) =>
    p.history.filter(
      (h, index) =>
        recent(h) &&
        h.codingOutcome &&
        !["unchecked", "unfinished"].includes(h.codingOutcome.correctness) &&
        index > 0 &&
        differenceInCalendarDays(
          new Date(h.date),
          new Date(p.history[index - 1].date),
        ) >= 7,
    ),
  );
  const unseen = getUnseenAttempts(progress).filter(
    (h) => recent(h) && h.codingOutcome?.correctness !== "unchecked",
  );
  const timed = unseen.filter(
    (h) =>
      h.elapsedSeconds !== undefined &&
      h.elapsedSeconds > 0 &&
      (h.codingOutcome?.correctness !== "unfinished" ||
        h.elapsedSeconds >= UNSEEN_CHECK_MINUTES * 60),
  );
  const timedPasses = timed.filter(
    (h) =>
      isIndependentPass(h.codingOutcome) &&
      h.elapsedSeconds! <= UNSEEN_CHECK_MINUTES * 60,
  ).length;
  const needsRemediation =
    coding.length >= 4 &&
    coding.filter((h) => isIndependentPass(h.codingOutcome)).length /
      coding.length <
      0.5;
  const advice = needsRemediation
    ? "Recent independent coding is below half of recorded outcomes. The plan prioritizes repair; use references after an unaided attempt and explain the correction."
    : unseen.length === 0
      ? "An unfamiliar check is needed. The plan protects one when a related unseen problem is available."
      : timed.length === 0
        ? "No completed timed unfamiliar checks yet. Finish a check or record its result at the time limit."
        : timedPasses < timed.length / 2
          ? "Unfamiliar checks need work. Review the failed approach, test edge cases, and try another related problem independently."
          : delayed.length === 0
            ? "Delayed coding evidence is still missing. Keep the scheduled independent re-solves after at least a week."
            : "Keep following the plan and compare delayed coding and unfamiliar checks every two weeks. These samples describe practice, not an interview pass prediction.";
  return {
    coding,
    delayed,
    unseen,
    timed,
    timedPasses,
    needsRemediation,
    advice,
  };
}

/** Every major category stays visible, including categories absent from the target list. */
export function getCategoryEvidence(
  pool: Problem[],
  progress: Record<string, ProblemProgress>,
) {
  return STUDY_CATEGORIES.map((category) => {
    const ids = pool.filter((p) => p.category === category).map((p) => p.id);
    const categoryProgress = Object.fromEntries(
      Object.entries(progress).filter(
        ([id]) => problemMap[id]?.category === category,
      ),
    );
    const variantIds = [...new Set([...ids, ...Object.keys(categoryProgress)])];
    return {
      category,
      ids,
      seen: ids.filter((id) => progress[id]).length,
      ...getPatternEvidence(ids, progress),
      variantPassed: getPatternEvidence(variantIds, categoryProgress)
        .variantPassed,
    };
  }).map((row) => ({
    ...row,
    established:
      row.ids.length > 0 &&
      row.dependable >= Math.min(2, row.ids.length) &&
      row.variantPassed,
  }));
}

export const isIndependentPass = (outcome?: CodingOutcome) =>
  outcome?.correctness === "passed" &&
  outcome.assistance === "none" &&
  outcome.explanation === "clear";

export function hasCurrentIndependentPass(progress?: ProblemProgress) {
  const latest = progress?.history.at(-1);
  if (!isIndependentPass(latest?.codingOutcome)) return false;
  const lapse = progress?.studyState?.recallHistory
    .filter((h) => h.outcome !== "recalled")
    .at(-1);
  return !lapse || Date.parse(latest!.date) > Date.parse(lapse.date);
}

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
  progress: Record<string, ProblemProgress> = {},
) {
  const unfinishedSessions = new Set(
    Object.values(progress)
      .flatMap((p) => p.history)
      .filter((h) => h.codingOutcome?.correctness === "unfinished")
      .map((h) => h.sessionId)
      .filter(Boolean),
  );
  const samples = timings.filter(
    (t) =>
      t.category === problem.category &&
      problemMap[t.problemId]?.difficulty === problem.difficulty &&
      !unfinishedSessions.has(t.id) &&
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
  explanation: {
    title: string;
    summary: string;
    dailyMinutes: number;
    spentMinutes: number;
    remainingMinutes: number;
    recallAllowance: number;
    recallUsed: number;
    recallMinutesAvailable: number;
    recallEligibleCount: number;
    unfamiliarReservation: boolean;
  };
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
  hasActiveSession?: boolean;
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
    hasActiveSession = false,
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
  if (
    isRestDay ||
    isBlackout ||
    remainingMinutes === 0 ||
    hasActiveSession
  )
    return plan;

  const pool = problemsPoolForTargetCurriculum(
    settings.targetCurriculum,
  ).filter(allowed);
  const seen = new Set(Object.keys(progress));
  const coverage = new Map<string, number>();
  const independent = new Map<string, number>();
  for (const id of eligible) {
    const key = studyKey(problemMap[id]);
    coverage.set(key, (coverage.get(key) ?? 0) + 1);
    // Historical success followed by a lapse is not current proficiency.
    if (hasCurrentIndependentPass(progress[id]))
      independent.set(key, (independent.get(key) ?? 0) + 1);
  }
  const patternCoverage = (p: Problem) => coverage.get(studyKey(p)) ?? 0;
  const independentCoverage = (p: Problem) => independent.get(studyKey(p)) ?? 0;
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
  const difficulty = { Easy: 0, Medium: 1, Hard: 2 };
  const newCandidates = pool.filter(
    (p) => !seen.has(p.id) && !touched.has(p.id),
  );
  const newCandidateIds = new Set(newCandidates.map((p) => p.id));
  newCandidates.sort((a, b) => {
    if (settings.learningMode !== "EXPLORE") {
      const prerequisites = unmetPrerequisites(a) - unmetPrerequisites(b);
      if (prerequisites) return prerequisites;
    }
    const breadth =
      Math.min(patternCoverage(a), 2) - Math.min(patternCoverage(b), 2);
    if (breadth) return breadth;
    if (settings.learningMode !== "EXPLORE") {
      const order =
        STUDY_CATEGORIES.indexOf(a.category) -
        STUDY_CATEGORIES.indexOf(b.category);
      if (order) return order;
    }
    return (
      difficulty[a.difficulty] - difficulty[b.difficulty] ||
      a.id.localeCompare(b.id)
    );
  });
  const evaluation = getStudyEvaluation(progress, now);
  const unseenHistory = getUnseenAttempts(progress);
  const unseenDue = !unseenHistory.some((h) => {
    const age = differenceInCalendarDays(now, new Date(h.date));
    return age >= 0 && age < UNSEEN_CHECK_DAYS;
  });
  // A large imported backlog and an approaching interview cannot consume this slot.
  // Exposure makes a related check eligible; its outcome must still be measured.
  const relatedUnseen = allProblems.filter(
    (p) =>
      allowed(p) &&
      !seen.has(p.id) &&
      !touched.has(p.id) &&
      patternCoverage(p) >= 2 &&
      (settings.learningMode === "EXPLORE" || unmetPrerequisites(p) === 0) &&
      (p.difficulty !== "Hard" || independentCoverage(p) >= 2),
  );
  const curatedUnseen = relatedUnseen.filter((p) => p.isNeetCode250);
  const variationPool = curatedUnseen.length ? curatedUnseen : relatedUnseen;
  const lastUnseenByCategory = new Map<string, number>();
  for (const [id, entry] of Object.entries(progress)) {
    const first = entry.history[0];
    if (first?.practiceKind !== "variant" || !problemMap[id]) continue;
    const category = problemMap[id].category;
    lastUnseenByCategory.set(
      category,
      Math.max(lastUnseenByCategory.get(category) ?? 0, Date.parse(first.date)),
    );
  }
  variationPool.sort((a, b) => {
    const age =
      (lastUnseenByCategory.get(a.category) ?? 0) -
      (lastUnseenByCategory.get(b.category) ?? 0);
    if (age) return age;
    const preferred = (p: Problem) =>
      evaluation.needsRemediation
        ? difficulty[p.difficulty]
        : p.difficulty === "Medium"
          ? 0
          : p.difficulty === "Easy"
            ? 1
            : 2;
    return (
      preferred(a) - preferred(b) ||
      Number(!newCandidateIds.has(a.id)) - Number(!newCandidateIds.has(b.id)) ||
      a.id.localeCompare(b.id)
    );
  });
  const variantCandidate = variationPool[0];

  const continuation = new Map<string, { deferred: boolean; blocks: number }>();
  for (const id of eligible) {
    const entry = progress[id];
    if (entry.history.at(-1)?.codingOutcome?.correctness !== "unfinished")
      continue;
    const blocks: ProblemHistoryEntry[] = [];
    for (const h of [...entry.history].reverse()) {
      if (h.codingOutcome?.correctness !== "unfinished") break;
      blocks.push(h);
    }
    const seconds = blocks.reduce(
      (sum, h) =>
        sum +
        (h.elapsedSeconds ??
          timings.find((t) => t.id === h.sessionId)?.elapsedSeconds ??
          0),
      0,
    );
    const longAttempt =
      blocks.length >= 3 ||
      seconds >= estimateCodingMinutes(problemMap[id], timings, progress) * 120;
    continuation.set(id, {
      blocks: blocks.length,
      deferred:
        longAttempt &&
        differenceInCalendarDays(now, new Date(blocks[0].date)) < 3,
    });
  }
  const availableCoding = dueCoding.filter(
    (id) => !touched.has(id) && !continuation.get(id)?.deferred,
  );
  const unfinished = availableCoding.find((id) => continuation.has(id));
  const demonstratedGap = (id: string) => {
    const outcome = progress[id].history.at(-1)?.codingOutcome;
    return (
      getLearningStatus(progress[id]) === "relearning" &&
      outcome?.correctness !== "unfinished"
    );
  };
  const repair = availableCoding.find(demonstratedGap);
  const delayedCheck = availableCoding.find(
    (id) =>
      isIndependentPass(progress[id].history.at(-1)?.codingOutcome) &&
      !hasDelayedIndependentPass(progress[id]) &&
      differenceInCalendarDays(
        now,
        new Date(progress[id].history.at(-1)!.date),
      ) >= 7,
  );
  const codingCandidate =
    day === maintenanceDay
      ? availableCoding[0]
      : (repair ?? delayedCheck ?? availableCoding[0]);
  const newCandidate = newCandidates[0] ?? variantCandidate;
  const repeatedTopicGaps =
    newCandidate &&
    eligible.filter(
      (id) =>
        studyKey(problemMap[id]) === studyKey(newCandidate) &&
        demonstratedGap(id),
    ).length >= 2;
  const remediation =
    day !== maintenanceDay &&
    repair &&
    (evaluation.needsRemediation || repeatedTopicGaps);
  const protectedVariant = unseenDue && variantCandidate;
  const mainId = protectedVariant
    ? protectedVariant.id
    : day === maintenanceDay && codingCandidate
      ? codingCandidate
      : (unfinished ??
        (remediation
          ? repair
          : learningDay && newCandidate
            ? newCandidate.id
            : (codingCandidate ?? newCandidate?.id)));

  const recallSpent =
    todayTimings
      .filter((t) => t.sessionType === "recall")
      .reduce((s, t) => s + t.elapsedSeconds / 60, 0) +
    Math.max(0, activeRecallSeconds) / 60;
  const unfamiliarMain =
    mainId &&
    !progress[mainId] &&
    (protectedVariant ||
      !newCandidateIds.has(mainId) ||
      independentCoverage(problemMap[mainId]) >= 2);
  // On check days a small budget goes to the check, instead of a recall warm-up
  // making a feasible independent attempt unnecessarily short.
  let recallBudget = Math.min(
    unfamiliarMain
      ? Math.max(0, remainingMinutes - UNSEEN_CHECK_MINUTES)
      : remainingMinutes,
    Math.max(0, Math.floor(dailyMinutes * 0.3) - Math.ceil(recallSpent)),
  );
  const recallAllowance = Math.floor(dailyMinutes * 0.3);
  const recallCandidates = dueRecall.filter(
    (id) => !touched.has(id) && id !== mainId,
  );
  const allocationExplanation = {
    dailyMinutes,
    spentMinutes,
    remainingMinutes,
    recallAllowance,
    recallUsed: Math.ceil(recallSpent),
    recallMinutesAvailable: recallBudget,
    recallEligibleCount: recallCandidates.length,
    unfamiliarReservation: !!unfamiliarMain,
  };
  const selectionExplanation = protectedVariant
    ? { title: "Weekly unfamiliar check", summary: "Your weekly check is due. Try an unseen question without hints." }
    : day === maintenanceDay && codingCandidate
      ? { title: "Maintenance day", summary: "Revisit a due problem to keep your coding skills fresh." }
      : unfinished
        ? { title: "Continue your attempt", summary: "Pick up an unfinished problem before starting another." }
        : remediation
          ? { title: "Rebuild a weak spot", summary: "Recent attempts show a gap. Practice it before adding new material." }
          : learningDay && newCandidate
            ? { title: "New learning", summary: "This question builds coverage in your target list." }
            : codingCandidate
              ? codingCandidate === repair
                ? { title: "Rebuild a weak spot", summary: "A recorded coding gap puts this problem first." }
                : codingCandidate === delayedCheck
                  ? { title: "Check it after a week", summary: "You solved it independently. Now check whether that skill has stuck." }
                  : { title: "Coding review is due", summary: "This problem is ready for another independent attempt." }
              : { title: "New learning", summary: "No coding reviews are available. Practice a new problem instead." };
  const usedPatterns = new Set<string>();
  const selected = new Set<string>();
  for (const diversify of [true, false])
    for (const id of recallCandidates) {
      if (recallBudget < 3 || selected.has(id)) continue;
      const key = studyKey(problemMap[id]);
      if (diversify && usedPatterns.has(key)) continue;
      selected.add(id);
      usedPatterns.add(key);
      recallBudget -= 3;
      plan.recallTasks.push({
        problemId: id,
        kind: "recall",
        minutes: 3,
        estimatedMinutes: 3,
        explanation: {
          ...allocationExplanation,
          title: "Recall is due",
          summary: "Check what you remember before reopening the solution.",
        },
        reason:
          getLearningStatus(progress[id]) === "needs_assessment"
            ? "Assess what you remember before choosing a full re-solve."
            : "Retrieve the approach before looking at your notes.",
      });
    }
  let capacity = remainingMinutes - plan.recallTasks.length * 3;
  if (mainId && capacity >= MIN_CODING_BLOCK_MINUTES) {
    const problem = problemMap[mainId];
    const isNew = !progress[mainId];
    const kind: PracticeKind = isNew
      ? protectedVariant ||
        !newCandidateIds.has(mainId) ||
        independentCoverage(problem) >= 2
        ? "variant"
        : "learning"
      : "coding_review";
    const estimatedMinutes =
      kind === "variant"
        ? UNSEEN_CHECK_MINUTES
        : estimateCodingMinutes(problem, timings, progress);
    plan.mainTask = {
      problemId: mainId,
      kind,
      estimatedMinutes,
      minutes: Math.min(estimatedMinutes, capacity),
      explanation: {
        ...allocationExplanation,
        ...selectionExplanation,
        ...(kind === "variant" && !protectedVariant ? {
          title: "Unfamiliar practice",
          summary: "Practice choosing an approach without hints.",
        } : {}),
      },
      reason:
        kind === "variant"
          ? `${protectedVariant ? "Protected unfamiliar check" : "Unfamiliar check"}: choose the approach yourself, code without hints, then test and explain.`
          : unfinished === mainId
            ? "Continue your unfinished attempt. Long attempts rotate with other practice."
            : remediation && mainId === repair
              ? "Recent attempts show a gap. Rebuild the approach, then code and test it independently."
              : kind === "learning"
                ? "Build coverage with a representative problem from your target list."
                : delayedCheck === mainId
                  ? "Test retained implementation after at least a week."
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
      hasCurrentIndependentPass(entry) &&
      entry.history[0]?.practiceKind === "variant" &&
      isIndependentPass(entry.history[0].codingOutcome)
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
