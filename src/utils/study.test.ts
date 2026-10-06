import { describe, expect, it } from "vitest";
import { addDays, startOfDay } from "date-fns";
import {
  allProblems,
  problemMap,
  isProblemPremium,
  problemsPoolForTargetCurriculum,
} from "../data/problems";
import {
  DEFAULT_SETTINGS,
  type CodingOutcome,
  type ProblemProgress,
  type RecallAttempt,
  type SessionTiming,
} from "../types";
import {
  applyRecall,
  buildStudyPlan,
  getLearningStatus,
  getPatternEvidence,
  getStudyState,
  hasDelayedIndependentPass,
  scheduleCoding,
} from "./study";
import { getPatternForProblem } from "./patternMapping";
import {
  applyLeetCodeSubmissions,
  computeNewProblemProgress,
} from "./progressHelpers";
import { validateBackup } from "./backup";

const now = new Date("2026-10-06T12:00:00");
const old = "2026-01-01T12:00:00Z";
const passed: CodingOutcome = {
  correctness: "passed",
  assistance: "none",
  explanation: "clear",
};
const base = (): ProblemProgress => ({
  firstSolvedAt: old,
  lastReviewedAt: old,
  nextReviewAt: old,
  reviewCount: 0,
  history: [{ date: old, rating: 4 }],
  retired: false,
  consecutiveThrees: 1,
  consecutiveSuccesses: 1,
});
const settings = (minutes = 30) => ({
  ...DEFAULT_SETTINGS,
  studySchedule: {
    ...DEFAULT_SETTINGS.studySchedule,
    weekdayMinutes: minutes,
    weekendMinutes: minutes,
    restDay: -1,
  },
});
const recall = (
  outcome: RecallAttempt["outcome"] = "recalled",
): RecallAttempt => ({
  id: "00000000-0000-4000-8000-000000000099",
  date: now.toISOString(),
  elapsedSeconds: 180,
  outcome,
  answer: "A closed-notes attempt with an invariant and complexity.",
  checkedAgainst: "external",
});

describe("capacity and backlog planning", () => {
  const backlog = Object.fromEntries(
    allProblems
      .filter((p) => !isProblemPremium(p))
      .slice(0, 43)
      .map((p) => [p.id, base()]),
  );
  it("turns 43 eligible reviews into a small budgeted plan with one distinct coding block", () => {
    const plan = buildStudyPlan({
      progress: backlog,
      settings: settings(),
      now,
    });
    expect(plan.eligibleRecallCount).toBe(43);
    expect(plan.recallTasks).toHaveLength(3);
    expect(plan.mainTask).not.toBeNull();
    const ids = [
      ...plan.recallTasks.map((t) => t.problemId),
      plan.mainTask!.problemId,
    ];
    expect(new Set(ids).size).toBe(ids.length);
    expect(plan.plannedMinutes).toBeLessThanOrEqual(30);
  });
  it("honors every tested daily budget, already recorded time, and premium exclusion", () => {
    for (const minutes of [0, 1, 5, 15, 30, 45, 60, 120])
      for (const spent of [0, 180, 900, 3600, 10800]) {
        const timings: SessionTiming[] = [
          {
            id: "spent",
            problemId: "not-in-pool",
            category: "Other",
            date: now.toISOString(),
            elapsedSeconds: spent,
            sessionType: "recall",
            rating: 4,
          },
        ];
        const plan = buildStudyPlan({
          progress: backlog,
          settings: settings(minutes),
          timings,
          now,
        });
        const allocated =
          plan.recallTasks.reduce((s, t) => s + t.minutes, 0) +
          (plan.mainTask?.minutes ?? 0) +
          plan.syntaxCards.length * 3;
        expect(allocated).toBe(plan.plannedMinutes);
        expect(allocated).toBeLessThanOrEqual(
          Math.max(0, minutes - Math.ceil(spent / 60)),
        );
        expect(
          plan.recallTasks.every(
            (t) => !isProblemPremium(problemMap[t.problemId]),
          ),
        ).toBe(true);
      }
  });
  it("protects a new learning block on learning days despite a full legacy queue", () => {
    const plan = buildStudyPlan({
      progress: backlog,
      settings: settings(),
      now: new Date("2026-10-07T12:00:00"),
    });
    expect(plan.mainTask).not.toBeNull();
    expect(backlog[plan.mainTask!.problemId]).toBeUndefined();
  });
  it("starts guided coverage with foundations when there is no prior exposure", () => {
    const plan = buildStudyPlan({
      progress: {},
      settings: { ...settings(), learningMode: "CURRICULUM" },
      now,
    });
    expect(problemMap[plan.mainTask!.problemId].category).toBe(
      "Arrays & Hashing",
    );
    expect(plan.mainTask?.kind).toBe("learning");
  });
  it("subtracts in-progress work and recall quota before allocating more time", () => {
    const plan = buildStudyPlan({
      progress: backlog,
      settings: settings(),
      activeSeconds: 20 * 60,
      activeRecallSeconds: 9 * 60,
      now,
    });
    expect(plan.spentMinutes).toBe(20);
    expect(plan.recallTasks).toHaveLength(0);
    expect(plan.plannedMinutes).toBeLessThanOrEqual(10);
    expect(
      buildStudyPlan({
        progress: backlog,
        settings: settings(),
        activeSeconds: 31 * 60,
        now,
      }).plannedMinutes,
    ).toBe(0);
  });
  it("keeps assigning unseen transfer problems when the core list has been covered", () => {
    const core = problemsPoolForTargetCurriculum("NEET_75").filter(
      (p) => !isProblemPremium(p),
    );
    const covered = Object.fromEntries(core.map((p) => [p.id, base()]));
    const plan = buildStudyPlan({
      progress: covered,
      settings: settings(),
      now: new Date("2026-10-07T12:00:00"),
    });
    expect(plan.mainTask?.kind).toBe("variant");
    expect(covered[plan.mainTask!.problemId]).toBeUndefined();
    expect(problemMap[plan.mainTask!.problemId].isNeetCode250).toBe(true);
    expect(isProblemPremium(problemMap[plan.mainTask!.problemId])).toBe(false);
  });
  it("does not refill recall quota or repeat completed assignments after refresh", () => {
    const first = buildStudyPlan({
      progress: backlog,
      settings: settings(),
      now,
    });
    const timings: SessionTiming[] = first.recallTasks.map((task, i) => ({
      id: String(i),
      problemId: task.problemId,
      category: problemMap[task.problemId].category,
      date: now.toISOString(),
      elapsedSeconds: 180,
      sessionType: "recall",
      rating: 4,
    }));
    const next = buildStudyPlan({
      progress: backlog,
      settings: settings(),
      timings,
      now,
    });
    expect(next.recallTasks).toHaveLength(0);
    expect(
      next.mainTask &&
        timings.some((t) => t.problemId === next.mainTask!.problemId),
    ).toBe(false);
  });
  it("assigns no work on rest days or inclusive scheduled breaks", () => {
    const rest = settings();
    rest.studySchedule.restDay = now.getDay();
    expect(
      buildStudyPlan({ progress: backlog, settings: rest, now }).plannedMinutes,
    ).toBe(0);
    const blackout = settings();
    blackout.studySchedule.blackoutDates = [
      { start: "2026-10-06", end: "2026-10-08" },
    ];
    expect(
      buildStudyPlan({ progress: backlog, settings: blackout, now })
        .plannedMinutes,
    ).toBe(0);
  });
  it("samples legacy retired problems instead of permanently excluding them", () => {
    const plan = buildStudyPlan({
      progress: { "two-sum": { ...base(), retired: true } },
      settings: settings(),
      now,
    });
    expect(plan.eligibleRecallCount).toBe(1);
    expect(plan.eligibleCodingCount).toBe(1);
  });
  it("offers a continuation block for unfinished coding without duplicating its recall", () => {
    const progress = {
      "two-sum": {
        ...base(),
        history: [
          {
            date: old,
            rating: 3 as const,
            codingOutcome: { ...passed, correctness: "unfinished" as const },
          },
        ],
      },
    };
    const plan = buildStudyPlan({ progress, settings: settings(), now });
    expect(plan.mainTask?.problemId).toBe("two-sum");
    expect(plan.recallTasks.some((t) => t.problemId === "two-sum")).toBe(false);
  });
});

describe("recall and coding evidence", () => {
  it("recall success cannot alter coding history, last coding date, or implementation due date", () => {
    const original = base();
    const codingDue = getStudyState(original).nextCodingAt;
    const next = applyRecall(original, "two-sum", recall());
    expect(next.history).toEqual(original.history);
    expect(next.lastReviewedAt).toBe(original.lastReviewedAt);
    expect(next.studyState!.nextCodingAt).toBe(codingDue);
    expect(getLearningStatus(next)).toBe("approach_recalled");
    expect(hasDelayedIndependentPass(next)).toBe(false);
    expect(original.studyState).toBeUndefined();
  });
  it("a failed recall brings future coding closer and same-operation replay does not append twice", () => {
    const future = {
      ...base(),
      studyState: {
        ...getStudyState(base()),
        nextCodingAt: addDays(now, 30).toISOString(),
      },
    };
    const attempt = recall("forgot");
    const next = applyRecall(future, "two-sum", attempt);
    expect(Date.parse(next.studyState!.nextCodingAt)).toBeLessThan(
      Date.parse(future.studyState.nextCodingAt),
    );
    expect(
      applyRecall(next, "two-sum", attempt).studyState!.recallHistory,
    ).toHaveLength(1);
    expect(getLearningStatus(next)).toBe("relearning");
  });
  it("does not grow intervals or claim retention from repeated same-day or daily rehearsal", () => {
    const histories = Array.from({ length: 8 }, (_, i) => ({
      date: addDays(now, i).toISOString(),
      rating: 5 as const,
      codingOutcome: passed,
    }));
    expect(hasDelayedIndependentPass({ ...base(), history: histories })).toBe(
      false,
    );
    const practiced = {
      ...base(),
      lastReviewedAt: now.toISOString(),
      studyState: { ...getStudyState(base()), recallIntervalDays: 7 },
    };
    expect(
      applyRecall(practiced, "two-sum", recall()).studyState!
        .recallIntervalDays,
    ).toBe(7);
  });
  it("requires genuinely delayed independent passes and invalidates evidence after a lapse", () => {
    const spaced = {
      ...base(),
      history: [
        { date: old, rating: 4 as const, codingOutcome: passed },
        {
          date: addDays(new Date(old), 7).toISOString(),
          rating: 4 as const,
          codingOutcome: passed,
        },
      ],
    };
    expect(hasDelayedIndependentPass(spaced)).toBe(true);
    expect(
      hasDelayedIndependentPass({
        ...spaced,
        history: [
          ...spaced.history,
          {
            date: now.toISOString(),
            rating: 5,
            codingOutcome: { ...passed, assistance: "hint" },
          },
        ],
      }),
    ).toBe(false);
    expect(
      hasDelayedIndependentPass(
        applyRecall(spaced, "two-sum", recall("forgot")),
      ),
    ).toBe(false);
  });
  it("keeps legacy self-ratings intact and does not equate retirement with retained coding", () => {
    const legacy = { ...base(), retired: true, consecutiveSuccesses: 99 };
    expect(getLearningStatus(legacy)).toBe("needs_assessment");
    expect(hasDelayedIndependentPass(legacy)).toBe(false);
    expect(legacy.history[0].rating).toBe(4);
  });
  it("imports unknown current confidence without fabricated history and preserves existing progress", () => {
    const existing = base();
    const input = [
      { titleSlug: "two-sum", timestamp: "1600000000" },
      { titleSlug: "group-anagrams", timestamp: "1600000000" },
    ];
    const imported = applyLeetCodeSubmissions({ "two-sum": existing }, input);
    expect(imported.progress["two-sum"]).toBe(existing);
    expect(imported.progress["group-anagrams"].history).toEqual([]);
    expect(imported.progress["group-anagrams"].consecutiveSuccesses).toBe(0);
    expect(imported.progress["group-anagrams"].studyState!.source).toBe(
      "leetcode_import",
    );
  });
  it("records actual coding evidence without permanently retiring a problem", () => {
    const next = computeNewProblemProgress(
      base(),
      "two-sum",
      5,
      false,
      undefined,
      { date: now.toISOString(), codingOutcome: passed, sessionType: "review" },
      "RELAXED",
    );
    expect(next.retired).toBe(false);
    expect(next.history.at(-1)?.codingOutcome).toEqual(passed);
    expect(next.lastReviewedAt).toBe(now.toISOString());
  });
  it("caps the final scheduled dates after spreading long intervals", () => {
    const established = {
      ...base(),
      studyState: {
        ...getStudyState(base()),
        recallIntervalDays: 90,
        codingIntervalDays: 120,
      },
      history: [
        { date: old, rating: 5 as const, codingOutcome: passed },
        { date: now.toISOString(), rating: 5 as const, codingOutcome: passed },
      ],
    };
    for (const problem of allProblems.slice(0, 50)) {
      const coding = scheduleCoding(
        established,
        problem.id,
        passed,
        5,
        "RELAXED",
        now,
      );
      const checked = applyRecall(established, problem.id, recall());
      expect(
        Date.parse(coding.nextCodingAt) - startOfDay(now).getTime(),
      ).toBeLessThanOrEqual(120 * 86400000 + 3600000);
      expect(
        Date.parse(checked.studyState!.nextRecallAt) -
          startOfDay(now).getTime(),
      ).toBeLessThanOrEqual(90 * 86400000 + 3600000);
    }
  });
  it("counts an outside-list variant for its pattern, but invalidates that pass after a lapse", () => {
    const representative = "binary-search";
    const variant = allProblems.find(
      (p) =>
        !p.isNeetCode75 &&
        getPatternForProblem(p) ===
          getPatternForProblem(problemMap[representative]),
    )!;
    const progress = {
      [variant.id]: {
        ...base(),
        history: [
          {
            date: old,
            rating: 4 as const,
            codingOutcome: passed,
            practiceKind: "variant" as const,
          },
        ],
      },
    };
    expect(
      getPatternEvidence(
        [representative],
        progress,
        getPatternForProblem(variant)!,
      ).variantPassed,
    ).toBe(true);
    progress[variant.id] = applyRecall(
      progress[variant.id],
      variant.id,
      recall("forgot"),
    ) as (typeof progress)[string];
    expect(
      getPatternEvidence(
        [representative],
        progress,
        getPatternForProblem(variant)!,
      ).variantPassed,
    ).toBe(false);
  });
  it("round-trips recall and coding metadata in backups and rejects invalid recall outcomes", () => {
    const next = applyRecall(base(), "two-sum", recall());
    const payload = { formatVersion: 2, progress: { "two-sum": next } };
    expect(
      validateBackup(JSON.parse(JSON.stringify(payload))).progress!["two-sum"]
        .studyState!.recallHistory,
    ).toEqual([recall()]);
    const bad = JSON.parse(JSON.stringify(payload));
    bad.progress["two-sum"].studyState.recallHistory[0].outcome = "perfect";
    expect(() => validateBackup(bad)).toThrow("Invalid backup");
  });
});
