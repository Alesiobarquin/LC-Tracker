import { useMemo, useState } from "react";
import { addDays } from "date-fns";
import { ArrowRight, CalendarDays, Clock3, Sparkles } from "lucide-react";
import { DEFAULT_SETTINGS, type ProblemProgress } from "../types";
import {
  buildStudyPlan,
  type StudyTask,
} from "../utils/study";
import { getNumberedProblemTitle, problemMap } from "../data/problems";
import { Logo } from "./Logo";

type GoalHorizon = "soon" | "later";

// This fixed Monday and its practice history are synthetic, private-free demo inputs.
const EXAMPLE_NOW = new Date(2026, 9, 12, 12);
const exampleDate = (days: number) => addDays(EXAMPLE_NOW, days).toISOString();
const SAMPLE_PROGRESS: Record<string, ProblemProgress> = {
  "two-sum": {
    firstSolvedAt: exampleDate(-8),
    lastReviewedAt: exampleDate(-8),
    nextReviewAt: exampleDate(-1),
    reviewCount: 1,
    history: [
      {
        date: exampleDate(-8),
        rating: 3,
        confidenceReported: false,
        elapsedSeconds: 1100,
        sessionType: "review",
        codingOutcome: {
          correctness: "failed",
          assistance: "none",
          explanation: "partial",
        },
        practiceKind: "coding_review",
      },
    ],
    retired: false,
    consecutiveThrees: 0,
    studyState: {
      version: 1,
      source: "practice",
      recallIntervalDays: 1,
      codingIntervalDays: 2,
      nextRecallAt: exampleDate(-1),
      nextCodingAt: exampleDate(-1),
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
  learning: "New problem",
  coding_review: "Independent coding",
  variant: "Unseen variation",
};

function taskTitle(task: StudyTask) {
  const problem = problemMap[task.problemId];
  return problem ? getNumberedProblemTitle(problem) : "Next problem";
}

function taskReason(task: StudyTask, horizon: GoalHorizon) {
  if (task.problemId === "two-sum" && horizon === "soon") {
    return "A prior coding attempt failed tests, and its independent coding check is due.";
  }
  return task.reason;
}

export function LandingPlanPreview() {
  const [horizon, setHorizon] = useState<GoalHorizon>("soon");
  const targetInterviewDate = useMemo(
    () =>
      addDays(EXAMPLE_NOW, horizon === "soon" ? 21 : 60)
        .toISOString()
        .slice(0, 10),
    [horizon],
  );
  const plan = useMemo(
    () =>
      buildStudyPlan({
        progress: SAMPLE_PROGRESS,
        settings: SAMPLE_SETTINGS,
        targetInterviewDate,
        now: EXAMPLE_NOW,
      }),
    [targetInterviewDate],
  );
  const plannedPercent = plan.dailyMinutes
    ? Math.round((plan.plannedMinutes / plan.dailyMinutes) * 100)
    : 0;
  const mainTask = plan.mainTask;
  const mainProblem = mainTask ? problemMap[mainTask.problemId] : undefined;
  const exampleGoal = horizon === "soon" ? "Interview in 3 weeks" : "Interview in 2 months";

  return (
    <figure className="landing-plan-figure" id="plan-preview" tabIndex={-1} aria-labelledby="landing-plan-title">
      <div className="landing-plan-frame">
        <div className="landing-plan-topbar">
          <div className="landing-plan-brand">
            <span className="landing-plan-mark"><Logo size={15} /></span>
            <span>LC Tracker</span>
          </div>
          <span className="landing-plan-window-label">DAILY PLAN</span>
          <span className="landing-plan-status"><span aria-hidden="true" /> Example</span>
        </div>

        <div className="landing-plan-content">
          <div className="landing-plan-heading">
            <div>
              <p className="landing-plan-kicker">MONDAY · SAMPLE WORKSPACE</p>
              <h2 id="landing-plan-title">Today’s plan</h2>
            </div>
            <span className="landing-plan-calendar" aria-hidden="true"><CalendarDays size={17} /></span>
          </div>

          <div className="landing-plan-context">
            <div>
              <span>INTERVIEW TARGET</span>
              <strong>{exampleGoal}</strong>
            </div>
            <div>
              <span>TIME AVAILABLE</span>
              <strong>{plan.dailyMinutes} min / day</strong>
            </div>
          </div>

          <div className="landing-plan-budget">
            <div className="landing-plan-budget-copy">
              <span>Planned for today</span>
              <strong>{plan.plannedMinutes}<small> / {plan.dailyMinutes} min</small></strong>
            </div>
            <div
              className="landing-plan-progress"
              role="progressbar"
              aria-label="Minutes assigned in the sample daily plan"
              aria-valuemin={0}
              aria-valuemax={plan.dailyMinutes}
              aria-valuenow={plan.plannedMinutes}
            >
              <span style={{ width: plannedPercent + "%" }} />
            </div>
          </div>

          <div className="landing-plan-tasks" aria-live="polite">
            {plan.recallTasks.map((task, index) => (
              <div className="landing-plan-task landing-plan-task--recall" key={task.problemId}>
                <span className="landing-plan-step">{String(index + 1).padStart(2, "0")}</span>
                <div className="landing-plan-task-copy">
                  <div className="landing-plan-task-meta">
                    <span>{taskLabels[task.kind]}</span>
                    <span>{task.minutes} min</span>
                  </div>
                  <strong>{taskTitle(task)}</strong>
                  <p>{task.reason}</p>
                </div>
              </div>
            ))}

            {mainTask && (
              <div className="landing-plan-task landing-plan-task--main">
                <span className="landing-plan-step">{String(plan.recallTasks.length + 1).padStart(2, "0")}</span>
                <div className="landing-plan-task-copy">
                  <div className="landing-plan-task-meta">
                    <span>{taskLabels[mainTask.kind]}</span>
                    <span><Clock3 size={12} /> {mainTask.minutes} min</span>
                  </div>
                  <strong>{mainProblem ? getNumberedProblemTitle(mainProblem) : "Next problem"}</strong>
                  <p>{taskReason(mainTask, horizon)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="landing-plan-history">
            <span className="landing-plan-history-icon" aria-hidden="true"><Sparkles size={14} /></span>
            <p><strong>From your history</strong><span>Two Sum · tests failed · no hints · 8 days ago</span></p>
          </div>

          <div className="landing-plan-footnote">
            <span>One plan, shaped by the goal and what you’ve recorded.</span>
            <span aria-hidden="true"><ArrowRight size={14} /></span>
          </div>
        </div>
      </div>

      <div className="landing-plan-controls">
        <div className="landing-plan-control-copy">
          <span>TRY THE EXAMPLE</span>
          <p>Change the interview timeline.</p>
        </div>
        <div className="landing-plan-toggle" role="group" aria-label="Example interview timeline">
          <button type="button" aria-pressed={horizon === "soon"} onClick={() => setHorizon("soon")}>
            In 3 weeks
          </button>
          <button type="button" aria-pressed={horizon === "later"} onClick={() => setHorizon("later")}>
            In 2 months
          </button>
        </div>
      </div>
      <figcaption className="landing-plan-caption">
        Example practice history. Change the goal to see what changes in today’s plan.
      </figcaption>
    </figure>
  );
}
