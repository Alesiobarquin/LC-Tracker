import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { BookOpen, Braces, CalendarDays, GitBranch, History, LayoutDashboard } from "lucide-react";
import { DEFAULT_SETTINGS, type ProblemProgress } from "../types";
import { buildStudyPlan, orderedStudyTasks, type StudyTask } from "../utils/study";
import { getNumberedProblemTitle, problemMap } from "../data/problems";
import { TraceIndex } from "./ui/StudyTrace";
import { Logo } from "./Logo";

const EXAMPLE_NOW = new Date(2026, 9, 12, 12);
const previousAttempt = addDays(EXAMPLE_NOW, -8).toISOString();
const due = addDays(EXAMPLE_NOW, -1).toISOString();
const SAMPLE_PROGRESS: Record<string, ProblemProgress> = {
  "two-sum": {
    firstSolvedAt: previousAttempt,
    lastReviewedAt: previousAttempt,
    nextReviewAt: due,
    reviewCount: 1,
    history: [{
      date: previousAttempt,
      rating: 3,
      confidenceReported: false,
      elapsedSeconds: 1100,
      sessionType: "review",
      codingOutcome: { correctness: "failed", assistance: "none", explanation: "partial" },
      practiceKind: "coding_review",
    }],
    retired: false,
    consecutiveThrees: 0,
    studyState: {
      version: 1,
      source: "practice",
      recallIntervalDays: 1,
      codingIntervalDays: 2,
      nextRecallAt: due,
      nextCodingAt: due,
      lapses: 1,
      recallHistory: [],
    },
  },
};

const SAMPLE_SETTINGS = {
  ...DEFAULT_SETTINGS,
  studySchedule: {
    ...DEFAULT_SETTINGS.studySchedule,
    weekdayMinutes: 45,
    weekendMinutes: 45,
    restDay: 0,
  },
};

const taskLabels: Record<StudyTask["kind"], string> = {
  recall: "Recall check",
  learning: "New coding problem",
  coding_review: "Independent coding",
  variant: "Unseen variation",
};
const timelines = [[21, "3 weeks"], [60, "2 months"]] as const;

export function LandingPlanPreview() {
  const [horizon, setHorizon] = useState(60);
  const plan = useMemo(() => buildStudyPlan({
    progress: SAMPLE_PROGRESS,
    settings: SAMPLE_SETTINGS,
    targetInterviewDate: format(addDays(EXAMPLE_NOW, horizon), "yyyy-MM-dd"),
    now: EXAMPLE_NOW,
  }), [horizon]);
  const tasks = orderedStudyTasks(plan);

  return (
    <section className="landing-plan-figure" id="plan-preview" tabIndex={-1} aria-labelledby="landing-plan-title">
      <div className="landing-plan-frame">
        <div className="landing-plan-topbar">
          <span><Logo size={18} className="text-accent" /> LC Tracker</span>
          <span>Interactive sample</span>
        </div>

        <div className="landing-plan-workspace">
          <nav className="landing-plan-nav" aria-label="Sample workspace">
            <span aria-current="page"><LayoutDashboard size={15} aria-hidden="true" /> Today</span>
            <a href="/library"><BookOpen size={15} aria-hidden="true" /> Library</a>
            <a href="/patterns"><GitBranch size={15} aria-hidden="true" /> Patterns</a>
            <a href="/syntax"><Braces size={15} aria-hidden="true" /> Syntax</a>
          </nav>

          <div className="landing-plan-main">
            <header className="landing-plan-header">
              <div>
                <p className="landing-kicker"><CalendarDays size={13} aria-hidden="true" /> {format(EXAMPLE_NOW, "EEEE, MMMM d")}</p>
                <h2 id="landing-plan-title">Today’s plan</h2>
              </div>
              <fieldset className="landing-plan-controls">
                <legend className="sr-only">Example interview timeline</legend>
                <span aria-hidden="true">Interview in</span>
                <div className="landing-plan-toggle">
                  {timelines.map(([days, label]) => (
                    <label key={days}>
                      <input
                        className="sr-only"
                        type="radio"
                        name="example-interview"
                        value={days}
                        aria-label={`In ${label}`}
                        checked={horizon === days}
                        onChange={() => setHorizon(days)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </header>

            <div className="landing-plan-content" aria-live="polite" aria-atomic="true">
              <div className="landing-plan-result">
                <h3 className="landing-kicker">Practice queue</h3>
                <ol className="landing-plan-tasks">
                  {tasks.map((task, index) => (
                    <li key={task.problemId} className={`landing-plan-task landing-plan-task--${task.kind === "recall" ? "recall" : "main"}`}>
                      <TraceIndex active={index === 0}>{String(index + 1).padStart(2, "0")}</TraceIndex>
                      <div>
                        <p className="landing-plan-task-label">{taskLabels[task.kind]}</p>
                        <h4>{getNumberedProblemTitle(problemMap[task.problemId])}</h4>
                        <p>{task.kind === "coding_review" ? "The last attempt failed tests. A coding check is due." : task.reason}</p>
                      </div>
                      <span className="landing-plan-duration">{task.minutes} min</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="landing-plan-evidence">
                <div className="landing-plan-budget">
                  <h3 className="landing-kicker">Daily budget</h3>
                  <p><strong>{plan.plannedMinutes}</strong> / {plan.dailyMinutes} min</p>
                  <div
                    className="landing-plan-progress"
                    role="progressbar"
                    aria-label="Time allocated"
                    aria-valuemax={plan.dailyMinutes}
                    aria-valuenow={plan.plannedMinutes}
                    aria-valuetext={`${plan.plannedMinutes} of ${plan.dailyMinutes} minutes planned`}
                  >
                    {tasks.map(task => (
                      <span key={task.problemId} data-kind={task.kind} style={{ width: `${task.minutes / plan.dailyMinutes * 100}%` }} />
                    ))}
                  </div>
                </div>

                <div className="landing-plan-history">
                  <h3 className="landing-kicker"><History size={14} aria-hidden="true" /> Example practice history</h3>
                  <p>Two Sum <span>8 days ago</span></p>
                  <p>Tests failed <span>No hints</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
