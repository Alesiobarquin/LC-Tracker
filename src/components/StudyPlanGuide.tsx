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

const priorities = [
  ["Weekly unfamiliar check", "Due after a week without a first unseen attempt."],
  ["Maintenance day", "Revisit a due coding problem."],
  ["Continue unfinished work", "Return to an attempt that can still be continued."],
  ["Repair a gap", "Recent outcomes call for rebuilding an approach."],
  ["Learn something new", "On learning days, add coverage to your target list."],
  ["Other coding practice", "Check a gap, delayed retention, or another due problem."],
];

const detailLabels = [
  ["Daily time", "Recall allowance", "Recall queue", "Coding and syntax", "After each save"],
  ["Weekly check", "Maintenance", "Continuation", "Repair", "Learning days", "Other days"],
  ["When assignments pause", "Which questions can appear", "Due-date priority", "New-question ranking", "Guided category order"],
  ["Unfamiliar eligibility", "Unfamiliar ranking", "Other unfamiliar practice", "Continuation rotation", "Time estimates"],
  ["Separate evidence", "Recall outcomes", "Coding outcomes", "Recall after coding", "Date spreading", "Retention evidence"],
];

export function StudyPlanGuide() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-12">
      <Link to="/dashboard" className="quiet-action"><ArrowLeft size={15} /> Back to your plan</Link>
      <PageHeader title="How the planner works" description="One daily budget. Recall and coding share the time left." />

      <section aria-labelledby="budget-guide-title" className="space-y-5">
        <h2 id="budget-guide-title" className="text-2xl font-semibold tracking-tight text-foreground">Why you get more coding</h2>
        <p className="text-lg leading-relaxed text-body">Recall uses up to <strong className="text-foreground">30% of your daily budget</strong>. Once that allowance is used, the time left goes to coding.</p>
        <figure className="rounded-md border border-line bg-surface p-5 sm:p-6 space-y-5">
          <figcaption className="text-sm font-semibold text-muted">Example · a 60-minute day</figcaption>
          <div className="grid grid-cols-2 gap-5">
            <div><p className="text-3xl font-semibold text-foreground">18 <span className="text-base font-normal text-muted">min</span></p><p className="mt-1 text-base text-body">Recall allowance</p></div>
            <div><p className="text-3xl font-semibold text-accent">20 <span className="text-base font-normal text-muted">min</span></p><p className="mt-1 text-base text-body">Recall already done</p></div>
          </div>
          <p className="border-l-2 border-success pl-3 text-base leading-relaxed text-body"><strong className="text-foreground">Recall is done for today.</strong> With 29 minutes left, the next block can be coding.</p>
          <div className="flex h-5 overflow-hidden rounded-sm" role="img" aria-label="Example daily budget: 31 minutes already used, 22 minutes for the next coding block, 7 minutes left afterward. Total 60 minutes.">
            <span className="bg-line-strong" style={{ width: `${31 / 60 * 100}%` }} />
            <span className="bg-accent" style={{ width: `${22 / 60 * 100}%` }} />
            <span className="bg-success" style={{ width: `${7 / 60 * 100}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><p className="font-semibold text-foreground">31 min</p><p className="mt-1 text-muted"><span className="inline-block h-2 w-2 bg-line-strong mr-1" aria-hidden="true" />Already used</p></div>
            <div><p className="font-semibold text-accent">22 min</p><p className="mt-1 text-muted"><span className="inline-block h-2 w-2 bg-accent mr-1" aria-hidden="true" />Next coding block</p></div>
            <div><p className="font-semibold text-success">7 min</p><p className="mt-1 text-muted"><span className="inline-block h-2 w-2 bg-success mr-1" aria-hidden="true" />Left afterward</p></div>
          </div>
          <p className="text-sm text-muted">Already used includes recall and coding. Actual elapsed time counts toward your budget.</p>
        </figure>
        <p className="text-base leading-relaxed text-body"><strong className="text-foreground">The plan updates after every save.</strong> More coding blocks can appear until your time runs out. An unfamiliar check can reserve coding time before recall.</p>
      </section>

      <section aria-labelledby="priority-guide-title" className="space-y-5">
        <h2 id="priority-guide-title" className="text-2xl font-semibold tracking-tight text-foreground">Why this question?</h2>
        <p className="text-base text-body leading-relaxed">For coding, the first rule that applies wins.</p>
        <ol className="divide-y divide-line border-y border-line">
          {priorities.map(([title, description], index) => (
            <li key={title} className="flex gap-4 py-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-muted-surface text-sm font-semibold text-accent" aria-hidden="true">{index + 1}</span>
              <div><h3 className="text-lg font-semibold text-foreground">{title}</h3><p className="mt-1 text-base leading-relaxed text-body">{description}</p></div>
            </li>
          ))}
        </ol>
        <p className="text-base text-body leading-relaxed">Learning days are usually <strong className="text-foreground">Sun, Mon, Wed and Fri</strong>. Near an interview, coding reviews get more priority.</p>
      </section>

      <section aria-labelledby="changes-guide-title" className="space-y-5">
        <h2 id="changes-guide-title" className="text-2xl font-semibold tracking-tight text-foreground">What changes the plan?</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="border-l-2 border-info pl-4"><h3 className="text-lg font-semibold text-foreground">Your schedule</h3><p className="mt-2 text-base leading-relaxed text-body">Rest days and breaks pause assignments. A saved session comes first.</p></div>
          <div className="border-l-2 border-accent pl-4"><h3 className="text-lg font-semibold text-foreground">Your outcomes</h3><p className="mt-2 text-base leading-relaxed text-body">Gaps bring practice forward. Delayed independent passes can increase the gap between checks.</p></div>
        </div>
        <p className="text-base text-body leading-relaxed"><strong className="text-foreground">Remembering an approach and coding it are separate checks.</strong> Successful recall doesn’t replace a coding review.</p>
      </section>

      <section aria-labelledby="exact-guide-title" className="space-y-4">
        <h2 id="exact-guide-title" className="text-2xl font-semibold tracking-tight text-foreground">Exact rules, when you need them</h2>
        <p className="text-base text-body">Open a section for formulas, ordering and exceptions.</p>
        <div className="space-y-3">
          {rules.map(({ title, items }, sectionIndex) => (
            <details key={title} className="rounded-md border border-line bg-surface">
              <summary className="cursor-pointer px-5 py-4 text-lg font-semibold text-foreground focus-visible:outline-accent">{title}</summary>
              <div className="divide-y divide-line px-5 pb-2">
                {items.map((item, index) => (
                  <div key={item} className="py-4 space-y-2">
                    <h3 className="text-base font-semibold text-foreground">{detailLabels[sectionIndex][index]}</h3>
                    <p className="text-base text-body leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
        <p className="text-sm text-muted">These numbers are app defaults. Outcomes are self-reported.</p>
      </section>
      <Link to="/settings#section-schedule" className="quiet-action text-accent">Adjust your daily budget in settings</Link>
    </div>
  );
}
