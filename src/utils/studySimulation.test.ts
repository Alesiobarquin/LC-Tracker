import { describe, expect, it } from "vitest";
import { addDays } from "date-fns";
import { buildStudyPlan, applyRecall, getUnseenAttempts } from "./study";
import { computeNewProblemProgress } from "./progressHelpers";
import {
  DEFAULT_SETTINGS,
  type ProblemProgress,
  type SessionTiming,
} from "../types";
import {
  isProblemPremium,
  problemMap,
  problemsPoolForTargetCurriculum,
} from "../data/problems";

const start = new Date("2026-10-06T12:00:00");
const old = "2026-01-01T12:00:00Z";
const passed = {
  correctness: "passed",
  assistance: "none",
  explanation: "clear",
} as const;

// Synthetic outcomes exercise selection over time. They do not measure learning.
function simulate(
  minutes: number,
  imported: boolean,
  failures: boolean,
  days = 28,
) {
  const pool = problemsPoolForTargetCurriculum("NEET_150").filter(
    (p) => !isProblemPremium(p),
  );
  const progress: Record<string, ProblemProgress> = imported
    ? Object.fromEntries(
        pool.map((p) => [
          p.id,
          {
            firstSolvedAt: old,
            lastReviewedAt: old,
            nextReviewAt: old,
            reviewCount: 0,
            history: [],
            retired: false,
            consecutiveThrees: 0,
          },
        ]),
      )
    : {};
  const timings: SessionTiming[] = [];
  const attemptMinutes = new Map<string, number>();
  const settings = {
    ...DEFAULT_SETTINGS,
    targetCurriculum: "NEET_150" as const,
    studySchedule: {
      ...DEFAULT_SETTINGS.studySchedule,
      weekdayMinutes: minutes,
      weekendMinutes: minutes,
    },
  };
  let coding = 0;
  let repairs = 0;
  for (let day = 0; day < days; day++) {
    const now = addDays(start, day);
    const completed = new Set<string>();
    for (let round = 0; round < 100; round++) {
      const plan = buildStudyPlan({
        progress,
        settings,
        timings,
        now,
        targetInterviewDate: "2026-11-03",
      });
      const tasks = [
        ...plan.recallTasks,
        ...(plan.mainTask ? [plan.mainTask] : []),
      ];
      expect(plan.plannedMinutes).toBeLessThanOrEqual(plan.remainingMinutes);
      expect(new Set(tasks.map((t) => t.problemId)).size).toBe(tasks.length);
      expect(
        tasks.every((t) => !isProblemPremium(problemMap[t.problemId])),
      ).toBe(true);
      if (plan.isRestDay) {
        expect(tasks).toHaveLength(0);
        break;
      }
      const task = plan.recallTasks[0] ?? plan.mainTask;
      if (!task) break;
      expect(completed.has(task.problemId)).toBe(false);
      completed.add(task.problemId);
      const id = task.problemId;
      const sessionId = `day-${day}-round-${round}`;
      if (task.kind === "recall") {
        progress[id] = applyRecall(progress[id], id, {
          id: sessionId,
          date: now.toISOString(),
          elapsedSeconds: task.minutes * 60,
          outcome: failures ? "forgot" : "recalled",
          answer: "Synthetic retrieval",
          checkedAgainst: "external",
        });
      } else {
        coding++;
        if (task.reason.includes("gap")) repairs++;
        const spent = (attemptMinutes.get(id) ?? 0) + task.minutes;
        const estimate = { Easy: 12, Medium: 22, Hard: 38 }[
          problemMap[id].difficulty
        ];
        const outcome =
          spent < estimate
            ? { ...passed, correctness: "unfinished" as const }
            : failures
              ? {
                  ...passed,
                  correctness: "failed" as const,
                  assistance: "hint" as const,
                }
              : passed;
        attemptMinutes.set(id, spent < estimate ? spent : 0);
        progress[id] = computeNewProblemProgress(
          progress[id],
          id,
          failures ? 2 : 4,
          !progress[id],
          undefined,
          {
            sessionId,
            date: now.toISOString(),
            elapsedSeconds: task.minutes * 60,
            codingOutcome: outcome,
            practiceKind: task.kind,
          },
          settings.srAggressiveness,
        );
      }
      timings.push({
        id: sessionId,
        problemId: id,
        category: problemMap[id].category,
        date: now.toISOString(),
        elapsedSeconds: task.minutes * 60,
        sessionType: task.kind === "recall" ? "recall" : "review",
        rating: failures ? 2 : 4,
      });
    }
  }
  return { progress, coding, repairs };
}

describe("multiweek preparation scenarios", () => {
  it.each([30, 60, 120])(
    "keeps unfamiliar practice in each week of a near-interview imported backlog at %i minutes",
    (minutes) => {
      const result = simulate(minutes, true, false);
      const unseen = getUnseenAttempts(result.progress);
      for (let week = 0; week < 4; week++) {
        expect(
          unseen.some(
            (h) =>
              Date.parse(h.date) >= addDays(start, week * 7).getTime() &&
              Date.parse(h.date) < addDays(start, (week + 1) * 7).getTime(),
          ),
        ).toBe(true);
      }
      expect(result.coding).toBeGreaterThan(unseen.length);
    },
  );
  it("gives failed attempts repair blocks while preserving unfamiliar checks", () => {
    const result = simulate(60, true, true);
    expect(result.repairs).toBeGreaterThan(0);
    expect(getUnseenAttempts(result.progress).length).toBeGreaterThanOrEqual(4);
  });
  it.each([0, 1, 5, 10, 30, 60])(
    "respects budgets and completed tasks from a fresh account at %i minutes for eight weeks",
    (minutes) => {
      simulate(minutes, false, false, 56);
    },
  );
});
