import { describe, expect, it } from "vitest";
import { codingElapsedSeconds, parseTimeSpent, recallElapsedSeconds, timeSpentDraft } from "./sessionTime";
import type { ActiveSession, RecallDraft } from "../types";

describe("corrected session time", () => {
  it("keeps seconds exact and supports zero and hour-long sessions", () => {
    for (const seconds of [0, 59, 177, 750, 3_600, 2_147_483_647])
      expect(parseTimeSpent(timeSpentDraft(seconds))).toBe(seconds);
  });

  it.each([
    { minutes: "", seconds: "0" },
    { minutes: "1", seconds: "" },
    { minutes: "-1", seconds: "0" },
    { minutes: "1.5", seconds: "0" },
    { minutes: "1e2", seconds: "0" },
    { minutes: "1", seconds: "60" },
    { minutes: "35791394", seconds: "8" },
  ])("rejects incomplete or invalid edits: %j", (draft) => {
    expect(parseTimeSpent(draft)).toBeNull();
  });

  it("uses corrected time for the active budget and gives a frozen completion priority", () => {
    const session: ActiveSession = {
      id: "session", problemId: "two-sum", startTimestamp: 0,
      isReview: true, isColdSolve: false, finishedElapsed: 5_400,
      timeSpentDraft: { minutes: "12", seconds: "30" },
    };
    expect(codingElapsedSeconds(session, 9_000_000)).toBe(750);
    session.completion = { rating: 3, timing: {
      id: "session", problemId: "two-sum", category: "Arrays & Hashing",
      date: "2026-10-09T12:00:00Z", elapsedSeconds: 600, sessionType: "review", rating: 3,
    } };
    expect(codingElapsedSeconds(session, 9_000_000)).toBe(600);

    const recall: RecallDraft = {
      id: "recall", problemId: "two-sum", startedAt: 0, answer: "An answer",
      revealed: true, checkedAgainst: "solution", pausedSeconds: 60, pausedAt: 120_000,
    };
    expect(recallElapsedSeconds(recall, 9_000_000)).toBe(60);
    recall.timeSpentDraft = { minutes: "2", seconds: "57" };
    expect(recallElapsedSeconds(recall, 9_000_000)).toBe(177);
    recall.completion = { attempt: {
      id: "recall", date: "2026-10-09T12:00:00Z", elapsedSeconds: 120,
      outcome: "partial", answer: "An answer", checkedAgainst: "solution",
    } };
    expect(recallElapsedSeconds(recall, 9_000_000)).toBe(120);
  });
});
