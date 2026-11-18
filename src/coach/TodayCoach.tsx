import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/ui/Button";
import { problemMap } from "../data/problems";
import { patterns } from "../data/patterns";
import { activePracticePath, useTodayPlan } from "../hooks/useTodayPlan";
import { useStore } from "../store/useStore";
import { getPatternForProblem } from "../utils/patternMapping";
import { codingElapsedSeconds, recallElapsedSeconds } from "../utils/sessionTime";
import { estimateCodingMinutes, getLearningStatus, getStudyEvaluation, getStudyState, isIndependentPass, type StudyTask } from "../utils/study";
import { useRegisterCoachTools, type CoachToolResult } from "./commands";

const handleInput = z.strictObject({ handle: z.string().max(260).optional() });
const choiceInput = z.strictObject({ handle: z.string().max(260) });
const optionsInput = z.strictObject({
  topic: z.string().trim().max(80).optional(),
  avoidTopic: z.string().trim().max(80).optional(),
  minutes: z.number().int().min(1).max(1_440).optional(),
});
const noArgs = z.strictObject({});
const taskTitle = (task: StudyTask) => task.kind === "variant" ? "Unfamiliar check" : problemMap[task.problemId]?.title ?? task.problemId;
const same = (a?: string, b?: string) => a?.toLowerCase() === b?.toLowerCase();

function matchesTopic(id: string, topic: string) {
  const problem = problemMap[id];
  if (!problem) return false;
  const pattern = getPatternForProblem(problem);
  return [problem.category, pattern, patterns.find(item => item.id === pattern)?.name]
    .some(label => same(label, topic));
}

export function TodayCoach({ visible }: { visible: boolean }) {
  const navigate = useNavigate();
  const current = useTodayPlan();
  const { plan, date, progress, sessionTimings, now, loading, error, activeSession, activeRecall } = current;
  const waiting = { message: "Study data is still loading. Try again when Today is ready." };
  const invalid = { message: "That action does not match the current plan." };
  const unavailable = error || loading;
  const tasks = [...plan.recallTasks, ...(plan.mainTask ? [plan.mainTask] : [])];
  const next = tasks[0];
  const active = activeSession ?? activeRecall;
  const handle = (task: StudyTask) =>
    `${date}/${task.kind}/${task.kind === "variant" ? "unfamiliar" : task.problemId}/${task.minutes}`;
  const start = (task: StudyTask) => {
    const path = current.startTask(task);
    if (!path) return invalid;
    navigate(path, { state: { returnTo: "/dashboard" } });
    return { message: `${taskTitle(task)} is in progress.` };
  };
  const resume = () => {
    const path = activePracticePath();
    if (!path) return { message: "There is no active practice session." };
    if (window.location.pathname !== path) navigate(path);
    return { message: "Opened the active session." };
  };
  const today = (includeReason = false): CoachToolResult => {
    if (unavailable) return waiting;
    if (active) {
      const hidden = activeSession?.practiceKind === "variant";
      const title = hidden ? "Unfamiliar check" : problemMap[active.problemId]?.title ?? "Practice session";
      const status = active.completion ? "Save pending" : active.pausedAt ? "Paused" : "In progress";
      const elapsed = activeSession ? codingElapsedSeconds(activeSession, now.getTime()) : recallElapsedSeconds(activeRecall!, now.getTime());
      const data = { status, elapsedSeconds: elapsed, remainingMinutes: plan.remainingMinutes };
      return { message: `${title} · ${status} · ${plan.remainingMinutes} min left today.`, data,
        modelData: data, actions: [{ name: "resume_practice", label: "Resume session" }] };
    }
    const summary = plan.isBlackout ? "Today falls in a scheduled break." : plan.isRestDay ? "Today is a rest day." :
      !plan.remainingMinutes ? "Today's study budget is used." : "No additional practice block fits.";
    const data = { date, mode: current.reviewsOnly ? "reviews" : "full", remainingMinutes: plan.remainingMinutes, spentMinutes: plan.spentMinutes,
      next: next && { title: taskTitle(next), kind: next.kind, minutes: next.minutes, reason: next.explanation.summary } };
    const message = next
      ? includeReason
        ? `${taskTitle(next)} is next, with ${next.minutes} min planned. ${next.explanation.summary}`
        : `${taskTitle(next)} · ${next.minutes} min · ${plan.remainingMinutes} min left today.`
      : summary;
    return { message,
      data, modelData: data, actions: next ? [{ name: "start_practice", label: "Start next task", args: { handle: handle(next) } }] : undefined };
  };

  function options(args: z.infer<typeof optionsInput>, source = plan) {
    const main = source.mainTask;
    if (!main || main.kind === "variant") return [];
    return (source.mainAlternatives ?? []).filter(id =>
      (!args.topic || matchesTopic(id, args.topic)) && (!args.avoidTopic || !matchesTopic(id, args.avoidTopic)))
      .slice(0, 3).map(problemId => {
        const estimatedMinutes = estimateCodingMinutes(problemMap[problemId], sessionTimings, progress);
        const capacity = source.remainingMinutes - source.recallTasks.length * 3;
        return { ...main, problemId, estimatedMinutes, minutes: Math.min(estimatedMinutes, capacity, args.minutes ?? Infinity) };
      }).filter(task => task.minutes >= 5);
  }
  const upcomingProtected = plan.mainTask?.kind === "variant";
  const revision = [date, current.reviewsOnly, unavailable, plan.remainingMinutes,
    ...tasks.map(handle), ...(plan.mainAlternatives ?? [])].join("|");
  const availableTask = (raw: Record<string, unknown>) =>
    !unavailable && !active && (raw.handle === undefined ? !!next : tasks.some(item => handle(item) === raw.handle));
  const availableOption = (raw: Record<string, unknown>) => {
    if (unavailable || !plan.mainTask || typeof raw.handle !== "string") return false;
    const [day, kind, id, duration] = raw.handle.split("/");
    return day === date && kind === plan.mainTask.kind && Number(duration) >= 5 &&
      Number(duration) <= plan.remainingMinutes - plan.recallTasks.length * 3 &&
      !!plan.mainAlternatives?.includes(id);
  };
  useRegisterCoachTools({
    today_plan: { kind: "read", duringPractice: true, description: "Read today's live plan, budget, and active session. No arguments.", run: args => noArgs.safeParse(args).success ? today(true) : invalid },
    resume_practice: { duringPractice: true, description: "Open the current running or pending coding or recall session. No arguments.", run: args => noArgs.safeParse(args).success ? resume() : invalid },
    practice_options: { kind: "read", description: "Find eligible alternate coding blocks for today. Optional topic, avoidTopic, and minutes (integer).", run: raw => {
      const parsed = optionsInput.safeParse(raw);
      if (!parsed.success) return invalid;
      if (unavailable) return waiting;
      const candidates = options(parsed.data);
      const data = candidates.map(task => ({ title: taskTitle(task), minutes: task.minutes, estimatedMinutes: task.estimatedMinutes, reason: task.reason }));
      return { message: candidates.length ? "Eligible choices for today's coding block." : "No alternative coding block fits those preferences today.",
        data, modelData: data.map((item, index) => ({ title: item.title, minutes: item.minutes, handle: handle(candidates[index]) })),
        actions: candidates.map(task => ({ name: "select_practice", label: `Select ${taskTitle(task)} · ${task.minutes} min`, args: { handle: handle(task) } })) };
    } },
    select_practice: { revision, available: availableOption, description: "Select an eligible alternative for today's coding slot. Use the exact handle offered by practice_options, matching the user's requested title or ordinal.", run: raw => {
      const input = choiceInput.safeParse(raw);
      if (!input.success || unavailable || date !== format(new Date(), "yyyy-MM-dd")) return invalid;
      const minutes = Number(input.data.handle.split("/").at(-1));
      const bounded = optionsInput.safeParse({ minutes });
      if (!bounded.success) return invalid;
      const fresh = current.freshPlan();
      const id = input.data.handle.split("/")[2];
      const task = options(bounded.data, { ...fresh, mainAlternatives: fresh.mainAlternatives?.filter(candidate => candidate === id) })
        .find(item => handle(item) === input.data.handle);
      if (!task) return invalid;
      useStore.getState().choosePlanTask(date, { problemId: task.problemId, kind: task.kind, minutes: task.minutes });
      return { message: `${taskTitle(task)} is selected for Today.`,
        actions: [{ name: "start_practice", label: "Start selected problem", args: { handle: handle(task) } }] };
    } },
    start_practice: { revision, available: availableTask, description: "Start the next task in today's live plan. Use handle for a specific slot or selected:true for the accepted coding choice.", run: raw => {
      const parsed = handleInput.extend({ selected: z.boolean().optional() }).safeParse(raw);
      if (!parsed.success || unavailable) return invalid;
      if (activePracticePath()) return resume();
      const dayPlan = useStore.getState().dayPlan;
      const selectedTask = dayPlan?.date === date && plan.mainTask?.problemId === dayPlan.choice?.problemId ? plan.mainTask : undefined;
      const task = parsed.data.handle ? tasks.find(item => handle(item) === parsed.data.handle) :
        parsed.data.selected ? selectedTask ?? next : next;
      return task ? start(task) : invalid;
    } },
    skip_practice: { revision, available: availableTask, description: "Skip the next task today, or the current slot with the given handle.", run: raw => {
      const parsed = handleInput.safeParse(raw);
      if (!parsed.success || unavailable || date !== format(new Date(), "yyyy-MM-dd")) return invalid;
      const task = parsed.data.handle ? tasks.find(item => handle(item) === parsed.data.handle) : next;
      const fresh = current.freshPlan();
      if (!task || ![...fresh.recallTasks, fresh.mainTask].some(item => item && handle(item) === handle(task))) return invalid;
      useStore.getState().skipPlanTask(date, task.problemId);
      return { message: `Skipped ${taskTitle(task)} for today.` };
    } },
    reset_practice_choice: { description: "Restore today's standard choice for the coding block. No arguments.", run: args => {
      if (!noArgs.safeParse(args).success || date !== format(new Date(), "yyyy-MM-dd")) return invalid;
      useStore.getState().choosePlanTask(date);
      return { message: "Today's coding choice was reset." };
    } },
    set_review_mode: { duringPractice: true, description: "Set today's study mode, mode 'full' or 'reviews'.", run: raw => {
      const parsed = z.strictObject({ mode: z.enum(["full", "reviews"]) }).safeParse(raw);
      if (!parsed.success) return invalid;
      current.setReviewsOnly(parsed.data.mode === "reviews");
      return { message: parsed.data.mode === "reviews" ? "Reviews only is on for today." : "The full study plan is on for today." };
    } },
    progress_summary: { kind: "read", description: "Get 14-day learning evidence, optionally limited by exact category or pattern name in scope.", run: raw => {
      const parsed = z.strictObject({ scope: z.string().trim().max(80).optional() }).safeParse(raw);
      if (!parsed.success || activePracticePath()) return invalid;
      if (unavailable) return waiting;
      const { scope } = parsed.data;
      const scoped = Object.fromEntries(Object.entries(progress).filter(([id]) => !scope || matchesTopic(id, scope)));
      const evaluation = getStudyEvaluation(scoped, now);
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 13);
      startDate.setHours(0, 0, 0, 0);
      const within = (value: string) => new Date(value) >= startDate && new Date(value) <= now;
      const recalls = Object.values(scoped).flatMap(item => item.studyState?.recallHistory ?? []).filter(item => within(item.date));
      const data = {
        scope: scope ?? "All topics", start: format(startDate, "yyyy-MM-dd"), end: date,
        encountered: Object.keys(scoped).length,
        independentCoding: { passed: evaluation.coding.filter(item => isIndependentPass(item.codingOutcome)).length, attempts: evaluation.coding.length },
        recalled: { passed: recalls.filter(item => item.outcome === "recalled").length, attempts: recalls.length },
        delayedIndependent: evaluation.delayed.filter(item => isIndependentPass(item.codingOutcome)).length,
        firstUnfamiliar: evaluation.unseen.length,
        minutesRecorded: Math.round(sessionTimings.filter(item => (!scope || item.problemId in scoped) && within(item.date))
          .reduce((sum, item) => sum + item.elapsedSeconds, 0) / 60),
      };
      return { message: `Learning evidence for ${data.scope}, ${data.start} through ${data.end}.`, data, modelData: data };
    } },
    problem_timeline: { kind: "read", description: "Find a tracked problem by exact title or slug (problem). Return five recent recorded attempts and due dates.", run: raw => {
      const parsed = z.strictObject({ problem: z.string().trim().min(1).max(120) }).safeParse(raw);
      if (!parsed.success || activePracticePath() || upcomingProtected) return invalid;
      if (unavailable) return waiting;
      const ids = Object.keys(progress).filter(id => same(id, parsed.data.problem) || same(problemMap[id]?.title, parsed.data.problem));
      if (ids.length !== 1) return { message: ids.length ? "More than one problem matches. Use the library to choose it." : "No recorded problem matches that title." };
      const id = ids[0];
      const entry = progress[id];
      const study = getStudyState(entry);
      const data = { title: problemMap[id]?.title ?? id, source: study.source, nextRecall: study.nextRecallAt, nextCoding: study.nextCodingAt,
        status: getLearningStatus(entry),
        attempts: entry.history.slice(-5).reverse().map(row => ({ date: row.date, coding: row.codingOutcome,
          confidence: row.confidenceReported === true ? row.rating : undefined })),
        recalls: study.recallHistory.slice(-5).reverse().map(row => ({ date: row.date, outcome: row.outcome })),
      };
      return { message: `Recorded history for ${data.title}.`, data, modelData: data,
        actions: [{ label: "Open learning evidence", name: "open_screen", args: { screen: "evidence" } }] };
    } },
  });
  if (!visible) return null;
  const result = today();
  return (
    <section aria-label="Live study plan" className="flex items-center gap-3 border-b border-line pb-3">
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="register-label">Live study plan</h3>
        <p role="status" className="break-words text-xs leading-relaxed text-body">{result.message}</p>
      </div>
      {active && <Button size="sm" className="shrink-0" onClick={resume}>Resume session</Button>}
      {!active && next && !unavailable && <Button size="sm" className="shrink-0" onClick={() => start(next)}>Start next task</Button>}
    </section>
  );
}
