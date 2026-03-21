export interface ProblemHistoryEntry {
  date: string;
  rating: 1 | 2 | 3;
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
  rating: 1 | 2 | 3;
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
  srAggressiveness: 'RELAXED' | 'AGGRESSIVE';
  language: 'Python' | 'Java' | 'JavaScript';
  learningMode: 'SPRINT' | 'RANDOM';
  sprintSettings: {
    strictMode: boolean;
    lengthMultiplier: number;
    targetDays: number;
  };
}

export interface UserSettingsData {
  onboardingComplete: boolean;
  leetcodeUsername: string | null;
  targetInterviewDate: string;
  settings: AppSettings;
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
  learningMode: 'SPRINT',
  sprintSettings: {
    strictMode: true,
    lengthMultiplier: 1.0,
    targetDays: 7,
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
