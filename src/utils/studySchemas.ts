import { z } from "zod";
const date = z
  .string()
  .refine((s) => Number.isFinite(Date.parse(s)), "Invalid date");
export const codingOutcomeSchema = z.object({
  correctness: z.enum(["passed", "failed", "unfinished", "unchecked"]),
  assistance: z.enum(["none", "hint", "solution"]),
  explanation: z.enum(["clear", "partial", "not_yet"]),
});
export const practiceKindSchema = z.enum([
  "learning",
  "coding_review",
  "variant",
]);
export const recallAttemptSchema = z.object({
  id: z.uuid(),
  date,
  elapsedSeconds: z.number().int().nonnegative(),
  outcome: z.enum(["recalled", "partial", "forgot"]),
  answer: z.string().max(20000),
  checkedAgainst: z.enum(["notes", "reference", "external"]),
});
export const studyStateSchema = z.object({
  version: z.literal(1),
  source: z.enum(["practice", "leetcode_import", "legacy"]),
  recallIntervalDays: z.number().finite().positive().max(365),
  codingIntervalDays: z.number().finite().positive().max(365),
  nextRecallAt: date,
  nextCodingAt: date,
  lapses: z.number().int().nonnegative(),
  recallHistory: z.array(recallAttemptSchema),
});
