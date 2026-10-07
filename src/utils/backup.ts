import { z } from 'zod';
import { codingOutcomeSchema, practiceKindSchema, studyStateSchema } from './studySchemas';
import type { ActivityLog, ProblemProgress, SessionTiming, SprintHistoryEntry, SprintState, UserSettingsData } from '../types';

export interface UserBackup {
  formatVersion?: number;
  exportedAt?: string;
  userSettings?: UserSettingsData;
  progress?: Record<string, ProblemProgress>;
  activityLog?: ActivityLog;
  sessionTimings?: SessionTiming[];
  sprintState?: SprintState | null;
  sprintHistory?: SprintHistoryEntry[];
}

const date = z.string().refine((s) => Number.isFinite(Date.parse(s)), 'Invalid date');
const count = z.number().int().nonnegative();
const rating = z.number().int().min(1).max(5);
const sessionType = z.enum(['new', 'review', 'cold_solve', 'mock', 'recall']);
const historyEntry = z.object({
  sessionId: z.uuid().optional(),
  codingOutcome: codingOutcomeSchema.optional(), practiceKind: practiceKindSchema.optional(),
  date, rating, confidenceReported: z.boolean().optional(), elapsedSeconds: count.optional(), sessionType: sessionType.optional(),
  rawCode: z.string().optional(), optimalSolution: z.string().optional(),
  approachSimilarity: z.number().finite().optional(), usedInAppEditor: z.boolean().optional(),
  mockTimeLimitSeconds: count.optional(), mockActualSecondsUsed: count.optional(),
});
const progress = z.object({
  studyState: studyStateSchema.optional(),
  firstSolvedAt: date, lastReviewedAt: date, nextReviewAt: date,
  reviewCount: count, history: z.array(historyEntry), retired: z.boolean(),
  consecutiveThrees: count, consecutiveSuccesses: count.optional(), notes: z.string().optional(),
});
const timing = z.object({
  id: z.uuid(), problemId: z.string().min(1), category: z.string().min(1), date,
  elapsedSeconds: count, sessionType, rating,
});
const sprintState = z.object({
  currentCategory: z.string().min(1), sprintStartDate: date, sprintLength: z.number().int().positive(),
  sprintStatus: z.enum(['active', 'retrospective', 'complete']), sprintIndex: count,
  extensionDays: count, retroProblemId: z.string().nullable(), retroAttempted: z.boolean(),
});
const sprintHistory = z.array(z.object({
  category: z.string(), startDate: date, endDate: date, passed: z.boolean(),
  avgSolveSeconds: count, sprintLength: z.number().int().positive(),
}));
const settings = z.object({
  onboardingComplete: z.boolean(), leetcodeUsername: z.string().nullable(), targetInterviewDate: z.union([z.literal(''), date]),
  ratingHistoryMigrationVersion: count.default(1),
  settings: z.object({
    studySchedule: z.object({
      weekdayMinutes: z.number().finite().nonnegative(), weekendMinutes: z.number().finite().nonnegative(),
      restDay: z.number().int().min(-1).max(6), blackoutDates: z.array(z.object({ start: date, end: date })),
    }),
    skillLevels: z.record(z.string(), z.enum(['not_familiar', 'some_exposure', 'comfortable'])),
    targetCompanyTier: z.enum(['FAANG', 'FINTECH', 'GENERAL', 'MIXED']),
    interviewType: z.enum(['INTERNSHIP', 'FULL_TIME']), srAggressiveness: z.enum(['RELAXED', 'BALANCED', 'AGGRESSIVE']),
    language: z.enum(['Python', 'Java', 'JavaScript']), includePremiumInAssignments: z.boolean().default(false),
    learningMode: z.enum(['EXPLORE', 'CURRICULUM', 'PATTERNS']), targetCurriculum: z.enum(['NEET_75', 'NEET_150', 'NEET_250', 'EXTENDED']).default('NEET_75'),
    sprintSettings: z.object({ lengthMultiplier: z.number().finite().positive(), targetDays: z.number().int().positive(), alignPoolToTargetCurriculum: z.boolean().default(false) }),
  }),
  targetEvents: z.array(z.object({ id: z.string(), title: z.string(), type: z.string(), date })),
  dayMode: z.object({ type: z.enum(['NORMAL', 'EASY', 'HARD']), dateSet: date.nullable() }),
  catchUpPlan: z.object({ active: z.boolean(), type: z.enum(['EXTEND', 'CATCH_UP']).nullable(), startedAt: date.nullable(), durationDays: count, bannerDismissed: z.boolean().optional() }),
  syntaxProgress: z.record(z.string(), z.object({ lastPracticedAt: date, nextReviewAt: date, confidenceRating: z.number().int().min(1).max(3), reviewCount: count, consecutiveSuccesses: count.optional() })),
});
const backup = z.object({
  formatVersion: z.union([z.literal(1), z.literal(2)]).optional(), exportedAt: date.optional(), userSettings: settings.optional(),
  progress: z.record(z.string().min(1), progress).optional(),
  activityLog: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.object({ solved: count, reviewed: count })).optional(),
  sessionTimings: z.array(timing).optional(), sprintState: sprintState.nullable().optional(), sprintHistory: sprintHistory.optional(),
}).refine((b) => ['userSettings', 'progress', 'activityLog', 'sessionTimings', 'sprintState', 'sprintHistory'].some((k) => k in b), 'No backup data found');

export function validateBackup(value: unknown): UserBackup {
  const parsed = backup.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`Invalid backup at ${issue.path.join('.') || 'file'}: ${issue.message}`);
  }
  return parsed.data as UserBackup;
}
