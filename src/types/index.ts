/**
 * Problem session self-rating: how confident you felt after **this session** (not a test score).
 * 1–2: unreliable · 3: acceptable but rough · 4: strong recall · 5: could solve cold / automatic.
 */
export type ProblemSessionRating = 1 | 2 | 3 | 4 | 5;

/** How aggressively the app schedules the next review (shorter gaps = more frequent). */
export type SrAggressiveness = 'RELAXED' | 'BALANCED' | 'AGGRESSIVE';

export interface ProblemHistoryEntry {
  date: string;
  rating: ProblemSessionRating;
  elapsedSeconds?: number;
  sessionType?: 'new' | 'review' | 'cold_solve' | 'mock';
  rawCode?: string;
  optimalSolution?: string;
  approachSimilarity?: number;
  usedInAppEditor?: boolean;
  mockTimeLimitSeconds?: number;
  mockActualSecondsUsed?: number;
}

export interface ProblemProgress {
  firstSolvedAt: string;
  lastReviewedAt: string;
  nextReviewAt: string;
  reviewCount: number;
  history: ProblemHistoryEntry[];
  retired: boolean;
  consecutiveThrees: number;
  consecutiveSuccesses?: number;
  notes?: string;
}

export interface SyntaxProgress {
  lastPracticedAt: string;
  nextReviewAt: string;
  confidenceRating: number;
  reviewCount: number;
  consecutiveSuccesses?: number;
}

export interface ActivityLogEntry {
  solved: number;
  reviewed: number;
}

export interface ActivityLog {
  [dateString: string]: ActivityLogEntry;
}

export interface SessionTiming {
  id: string;
  problemId: string;
  category: string;
  date: string;
  elapsedSeconds: number;
  sessionType: 'new' | 'review' | 'cold_solve' | 'mock';
  rating: ProblemSessionRating;
}

export interface SprintState {
  currentCategory: string;
  sprintStartDate: string;
  sprintLength: number;
  sprintStatus: 'active' | 'retrospective' | 'complete';
  sprintIndex: number;
  extensionDays: number;
  retroProblemId: string | null;
  retroAttempted: boolean;
}

export interface SprintHistoryEntry {
  category: string;
  startDate: string;
  endDate: string;
  passed: boolean;
  avgSolveSeconds: number;
  sprintLength: number;
}

export interface ActiveSession {
  problemId: string;
  startTimestamp: number;
  isReview: boolean;
  isColdSolve: boolean;
}

export interface StreakState {
  current: number;
  max: number;
  lastActiveDate: string | null;
}

export interface GraceDayState {
  usedThisWeek: boolean;
  lastResetDate: string | null;
}

export interface TargetEvent {
  id: string;
  title: string;
  type: string;
  date: string;
}

export interface DayModeState {
  type: 'NORMAL' | 'EASY' | 'HARD';
  dateSet: string | null;
}

export interface CatchUpPlanState {
  active: boolean;
  type: 'EXTEND' | 'CATCH_UP' | null;
  startedAt: string | null;
  durationDays: number;
}

export type PatternId = 
  | 'sliding-window'
  | 'binary-search'
  | 'topological-sort'
  | 'bfs'
  | 'top-k-elements'
  | 'two-pointers'
  | 'two-heaps'
  | 'fast-slow-pointers';

export interface PatternFoundation {
  id: PatternId;
  name: string;
  description: string;
  templateCodePython: string;
  templateCodeJs: string;
  relatedCategories: string[];
  relatedTags: string[];
  isCore?: boolean;
  educativeProblems?: {
    title: string;
    badges: string[];
  }[];
}

export interface PatternProgress {
  id: PatternId;
  problemsMasteredCount: number;
  totalProblemsInPattern: number;
  isMastered: boolean;
}

/** Which curated list drives recommendations and “target list” progress. */
export type TargetCurriculum = 'NEET_75' | 'NEET_150' | 'NEET_250' | 'EXTENDED';

export interface AppSettings {
  studySchedule: {
    weekdayMinutes: number;
    weekendMinutes: number;
    restDay: number;
    blackoutDates: { start: string; end: string }[];
  };
  skillLevels: Record<string, 'not_familiar' | 'some_exposure' | 'comfortable'>;
  targetCompanyTier: 'FAANG' | 'FINTECH' | 'GENERAL' | 'MIXED';
  interviewType: 'INTERNSHIP' | 'FULL_TIME';
  srAggressiveness: SrAggressiveness;
  language: 'Python' | 'Java' | 'JavaScript';
  /** When false, premium problems stay visible but are excluded from automatic assignment and reviews. */
  includePremiumInAssignments: boolean;
  learningMode: 'EXPLORE' | 'CURRICULUM' | 'PATTERNS';
  targetCurriculum: TargetCurriculum;
  sprintSettings: {
    lengthMultiplier: number;
    targetDays: number;
    /** When true, sprint new-problem tier order follows target list (see sprint help modal). */
    alignPoolToTargetCurriculum: boolean;
  };
}

export interface UserSettingsData {
  onboardingComplete: boolean;
  leetcodeUsername: string | null;
  targetInterviewDate: string;
  settings: AppSettings;
  /** Set to 1 after legacy 1–3 “mastered=3” history migration runs (see progressHelpers). */
  ratingHistoryMigrationVersion: number;
  targetEvents: TargetEvent[];
  dayMode: DayModeState;
  catchUpPlan: CatchUpPlanState;
  syntaxProgress: Record<string, SyntaxProgress>;
}

export const DEFAULT_SETTINGS: AppSettings = {
  studySchedule: {
    weekdayMinutes: 60,
    weekendMinutes: 120,
    restDay: 0,
    blackoutDates: [],
  },
  skillLevels: {},
  targetCompanyTier: 'MIXED',
  interviewType: 'INTERNSHIP',
  srAggressiveness: 'RELAXED',
  language: 'Python',
  includePremiumInAssignments: false,
  learningMode: 'CURRICULUM',
  targetCurriculum: 'NEET_75',
  sprintSettings: {
    lengthMultiplier: 1.0,
    targetDays: 7,
    alignPoolToTargetCurriculum: false,
  },
};

export const DEFAULT_DAY_MODE: DayModeState = {
  type: 'NORMAL',
  dateSet: null,
};

export const DEFAULT_CATCH_UP_PLAN: CatchUpPlanState = {
  active: false,
  type: null,
  startedAt: null,
  durationDays: 0,
};

export const DEFAULT_USER_SETTINGS: UserSettingsData = {
  onboardingComplete: false,
  leetcodeUsername: null,
  targetInterviewDate: '2026-09-15',
  settings: DEFAULT_SETTINGS,
  ratingHistoryMigrationVersion: 0,
  targetEvents: [],
  dayMode: DEFAULT_DAY_MODE,
  catchUpPlan: DEFAULT_CATCH_UP_PLAN,
  syntaxProgress: {},
};

export const DEFAULT_STREAK: StreakState = {
  current: 0,
  max: 0,
  lastActiveDate: null,
};

export const DEFAULT_GRACE_DAY: GraceDayState = {
  usedThisWeek: false,
  lastResetDate: null,
};
