import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "./ui";

const rules = [
  {
    title: "Time budget and recall allocation",
    items: [
      "Start with your weekday or weekend budget, rounded down to whole minutes. Subtract today's recorded study time plus unsaved active time, rounded up to whole minutes.",
      "Recall allowance = floor(daily budget × 30%) − ceil(recall minutes already used), with a minimum of zero. An unfamiliar check first reserves up to 35 minutes from the remaining daily budget.",
      "Each recall check is allocated three minutes. Due recall checks first mix different patterns, then fill any remaining recall capacity. The selected coding problem is excluded from recall.",
      "Coding gets the smaller of its full-attempt estimate and the time left after allocated recall. A new coding block needs at least five minutes. One due syntax card can use three leftover minutes.",
      "Saving recalculates the plan using actual elapsed time, so it can offer another coding block. The daily allowance limits recall time, rather than the number of coding blocks.",
    ],
  },
  {
    title: "Which coding block comes first?",
    ordered: true,
    items: [
      "Weekly unfamiliar check: if no first unseen attempt was recorded in the previous seven calendar days and an eligible related question exists, select it first.",
      "Maintenance day: select the highest-priority available due coding check. This is the day before your rest day, or Saturday if no rest day is set.",
      "Continuation: select an eligible unfinished attempt, unless it is temporarily rotating out.",
      "Repair: on other days, rebuild a due coding gap if fewer than half of at least four measured coding outcomes in the last 14 days were independent passes, or the next topic has at least two current gaps. Unchecked and unfinished results are excluded from that rate.",
      "New learning: Sunday, Monday, Wednesday and Friday allow an unseen target-list problem, except maintenance days and the 30 days leading up to an interview. A missing or past interview date does not disable new learning.",
      "Other coding days: prioritize a recorded gap, then an independent pass at least seven days old that still lacks delayed retention evidence, then another due coding check. If none is available, choose an unseen problem.",
    ],
  },
  {
    title: "Eligibility and queue order",
    items: [
      "Rest days, inclusive scheduled breaks, an exhausted budget, or a saved active session stop new assignments. Continue or record the active session first.",
      "Premium questions are included only when enabled in your settings. Problems completed today, currently excluded or swapped, or already selected for the main block cannot also be assigned for recall. Swaps affect the current view only.",
      "A check is due when its due date is today or earlier in your local calendar. Priority is days overdue plus 14 for relearning; problem ID breaks ties. This priority orders both recall and due coding queues.",
      "New target-list questions favor fewer unmet prerequisites in guided mode, then fewer encountered representatives (coverage counts stop distinguishing after two), then guided category order, then easier difficulty and problem ID. Mixed mode omits prerequisite and category ordering.",
      "Guided category order: Arrays & Hashing → Two Pointers → Sliding Window → Stack → Binary Search → Linked List → Trees → Tries → Heap / Priority Queue → Backtracking → Graphs → Advanced Graphs → 1-D DP → 2-D DP → Greedy → Intervals → Math & Geometry → Bit Manipulation.",
    ],
  },
  {
    title: "Unfamiliar checks and unfinished attempts",
    items: [
      "An unfamiliar question must be unseen, accessible, and related to at least two encountered representatives in its pattern (or category when no pattern is mapped). Guided mode requires prerequisite exposure; a hard check requires two currently independent representatives. Exposure alone does not prove proficiency.",
      "Prefer eligible NeetCode 250 questions; use related extended-catalog questions when those run out. Rotate toward categories checked least recently. Prefer medium difficulty, or easier questions during repair, then target-list membership and problem ID.",
      "An unseen question also runs as unfamiliar practice if it is outside the target list or its pattern already has two currently independent representatives. Topic and difficulty cues stay hidden for these checks.",
      "After three consecutive unfinished blocks, or twice the estimated full-attempt time, a continuation rotates out until three calendar days have passed since its latest unfinished block. Your saved work is preserved.",
      "A full-attempt estimate averages at least three recorded non-recall attempts of the same category and difficulty, each lasting at least a minute, excluding known unfinished sessions. Otherwise estimates are 12 minutes for easy, 22 for medium and 38 for hard, with a five-minute minimum. Unfamiliar checks use 35 minutes.",
    ],
  },
  {
    title: "How outcomes move the next check",
    items: [
      "Recall and coding have separate due dates. An independent coding pass means passed tests, no assistance and a clear explanation. A recall success never counts as a coding pass or postpones a coding check.",
      "Successful recall grows its interval by 1.8× only after at least half the previous recall interval has elapsed (minimum one day); otherwise it stays unchanged. A growing recall interval has a four-day minimum and a 90-day cap. Partial recall sets two days; forgotten recall sets one day. Partial or forgotten recall also brings coding forward to at most three or one days away, respectively.",
      "Independent coding starts at seven days. A prior independent pass at least half the coding interval old (minimum one day) grows the interval by 1.8×; an earlier repeat keeps it. Your intensity multiplier is applied (relaxed 1.0×, balanced 0.85×, aggressive 0.7×), with a seven-day minimum and 120-day cap. Unfinished coding sets one day; other measured non-independent results set two days. Legacy positive ratings without measured outcomes retain a seven-day coding interval.",
      "Independent coding keeps or grows the recall interval by 1.6× after that delay, with a three-day minimum and 60-day cap. Legacy positive ratings without measured coding outcomes set recall to three days; other results set one day.",
      "Intervals of at least seven days receive deterministic spreading of about ±15%, based on problem, date and check type. Repeating the same save yields the same dates. Dates use your local calendar; recall intervals never exceed 90 days and coding intervals never exceed 120 days.",
      "Delayed retention requires two independent passes separated by at least seven calendar days since the preceding coding attempt. A later coding or recall lapse invalidates that evidence. Current independent coverage requires the latest coding pass to be newer than any recall lapse. Imported acceptances and old confidence ratings do not establish independent coding evidence.",
    ],
  },
];

export function StudyPlanGuide() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <Link to="/dashboard" className="quiet-action"><ArrowLeft size={15} /> Back to your plan</Link>
      <PageHeader title="How the planner works" description="The rules behind your daily recommendations. Your plan updates after each saved attempt." />
      <div className="border-l-2 border-accent pl-4 text-base text-body leading-relaxed">
        <strong className="text-foreground">One daily budget.</strong> Recall and coding share the time left. These numbers are app defaults; outcomes are self-reported.
      </div>
      <div className="space-y-3">
        {rules.map(({ title, items, ordered }) => (
          <details key={title} className="group rounded-md border border-line bg-surface">
            <summary className="cursor-pointer px-5 py-4 text-lg font-semibold text-foreground focus-visible:outline-accent">{title}</summary>
            {ordered ? (
              <ol className="list-decimal space-y-4 px-5 pb-5 pl-10 text-base text-body leading-relaxed">{items.map(item => <li key={item}>{item}</li>)}</ol>
            ) : (
              <div className="space-y-4 px-5 pb-5 text-base text-body leading-relaxed">{items.map(item => <p key={item}>{item}</p>)}</div>
            )}
          </details>
        ))}
      </div>
      <Link to="/settings#section-schedule" className="quiet-action text-accent">Adjust your daily budget in settings</Link>
    </div>
  );
}
