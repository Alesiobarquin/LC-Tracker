import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import type { StudyTask } from "../utils/study";
import { getNumberedProblemTitle, problemMap } from "../data/problems";
import { Modal } from "./ui";
import { BudgetMeter } from "./ui/StudyTrace";

export function RecommendationDialog({ task, onClose }: {
  task: StudyTask | null;
  onClose: () => void;
}) {
  const details = task?.explanation;
  const recallUsed = details && details.recallAllowance > 0 && details.recallUsed >= details.recallAllowance;
  const recallReserved = details?.unfamiliarReservation &&
    details.recallMinutesAvailable < details.recallAllowance - details.recallUsed;
  const recallTooSmall = details && details.recallMinutesAvailable < 3;
  const nextCoding = task?.kind === "learning" ? "a new coding question"
    : task?.kind === "variant" ? "an unfamiliar coding check"
    : "a coding review";
  const recallTitle = recallUsed ? "Recall done for today"
    : recallReserved ? "Coding time protected"
    : recallTooSmall ? "No room for another recall"
    : details?.recallEligibleCount === 0 ? "No other recall checks due"
    : "Room for recall, too";
  const recallDetail = recallUsed ? (
    <>You’ve spent <strong className="font-semibold text-foreground">{details.recallUsed} min on recall today</strong>, using your {details.recallAllowance} min allowance. Next: {nextCoding}.</>
  )
    : recallReserved ? "Up to 35 min reserved before recall."
    : recallTooSmall ? "Recall checks need at least 3 min."
    : details?.recallEligibleCount === 0 ? "Completed and swapped questions are excluded."
    : `${details?.recallMinutesAvailable} min available for due recall checks.`;

  return (
    <Modal isOpen={!!task} onClose={onClose} title="Why this recommendation?"
      description={task ? getNumberedProblemTitle(problemMap[task.problemId]) : undefined}>
      {task && details && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight text-accent">{details.title}</h3>
            <p className="text-base leading-relaxed text-body">{details.summary}</p>
          </div>
          <dl className="grid grid-cols-2 gap-4 border-y border-line py-4">
            <div>
              <dd className="text-3xl font-semibold tabular-nums text-foreground">{task.minutes}<span className="ml-1 text-base font-normal text-muted">min</span></dd>
              <dt className="mt-1 text-sm text-muted">{task.kind === "recall" ? "Recall check" : "Coding block"}</dt>
            </div>
            <div>
              <dd className="text-3xl font-semibold tabular-nums text-foreground">{details.remainingMinutes}<span className="ml-1 text-base font-normal text-muted">min</span></dd>
              <dt className="mt-1 text-sm text-muted">Left today</dt>
            </div>
          </dl>
          <div className="space-y-2">
            <BudgetMeter spent={details.spentMinutes} total={details.dailyMinutes} />
            <p className="flex justify-between gap-3 text-sm text-muted"><span><strong className="text-foreground">{details.spentMinutes} min</strong> used</span><span>{details.dailyMinutes} min daily budget</span></p>
          </div>
          <div className="flex gap-3 rounded-md border border-line bg-muted-surface p-4">
            {recallUsed ? <CheckCircle2 size={20} className="shrink-0 text-success mt-0.5" aria-hidden="true" /> : <Clock3 size={20} className="shrink-0 text-info mt-0.5" aria-hidden="true" />}
            <div className="min-w-0 space-y-1">
              <h4 className="text-base font-semibold text-foreground">{recallTitle}</h4>
              <p className="text-base leading-relaxed text-body">{recallDetail}</p>
            </div>
          </div>
          <Link to="/study-plan" onClick={onClose} className="quiet-action text-accent text-sm">
            How the planner works <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      )}
    </Modal>
  );
}
