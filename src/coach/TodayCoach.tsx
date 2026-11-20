import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/ui/Button";
import { problemMap } from "../data/problems";
import { activePracticePath, useTodayPlan } from "../hooks/useTodayPlan";
import { useStore } from "../store/useStore";
import { codingElapsedSeconds, recallElapsedSeconds } from "../utils/sessionTime";
import { estimateCodingMinutes, getLearningStatus, getStudyEvaluation, getStudyState, isIndependentPass,
  MIN_CODING_BLOCK_MINUTES, orderedStudyTasks, type StudyPlan, type StudyPlanChoice, type StudyTask } from "../utils/study";
import { useRegisterCoachTools, type CoachToolResult } from "./commands";
import { codingEvidence, findStudyTopic, lastProblemPractice, topicReviewEvidence } from "./studyEvidence";

const handleInput = z.strictObject({ handle: z.string().max(260).optional() });
const choiceInput = z.strictObject({ handle: z.string().max(260) });
const optionsInput = z.strictObject({
  topic: z.string().trim().max(80).optional(),
  avoidTopic: z.string().trim().max(80).optional(),
  minutes: z.number().int().min(1).max(1_440).optional(),
});
const nextTaskOptionsInput = optionsInput.extend({ problem: z.string().trim().min(1).max(120).optional() });
const pickKinds = ["recall", "coding_review", "learning"] as const;
const planPickInput = z.strictObject({
  pick: z.string().regex(/^[1-6]$/), revision: z.string(), problemId: z.string().min(1).max(200),
  kind: z.enum(pickKinds), minutes: z.number().int().min(1).max(1_440),
});
const topicInput = z.strictObject({ topic: z.string().trim().min(1).max(80).optional() });
const noArgs = z.strictObject({});
const taskTitle = (task: StudyTask) => task.kind === "variant" ? "Unfamiliar check" : problemMap[task.problemId]?.title ?? task.problemId;
const same = (a?: string, b?: string) => a?.toLowerCase() === b?.toLowerCase();

export function TodayCoach({ visible }: { visible: boolean }) {
  const navigate = useNavigate();
  const current = useTodayPlan();
  const { plan, date, progress, sessionTimings, now, loading, error, activeSession, activeRecall } = current;
  const waiting = { message: error ? "Study data is unavailable. Try refreshing Today." : "Study data is still loading. Try again when Today is ready." };
  const invalid = { message: "That action does not match the current plan." };
  const unavailable = error || loading;
  const tasks = orderedStudyTasks(plan);
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
  const describeTask = (task: StudyTask, position: number) => {
    const details = { position, title: taskTitle(task), kind: task.kind, minutes: task.minutes, reason: task.explanation.summary };
    if (task.kind === "variant") return details;
    const entry = progress[task.problemId];
    return { ...details, category: problemMap[task.problemId]?.category, estimatedMinutes: task.estimatedMinutes,
      ...(entry && lastProblemPractice(entry, now)) };
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
      !plan.remainingMinutes ? "Today's study budget is used." : "No recall or coding block is queued for today.";
    const message = next
      ? includeReason
        ? `${taskTitle(next)} is next, with ${next.minutes} min planned. ${next.explanation.summary}`
        : `${taskTitle(next)} · ${next.minutes} min · ${plan.remainingMinutes} min left today.`
      : summary;
    if (!includeReason) return { message };
    const codingPosition = plan.mainTask ? tasks.indexOf(plan.mainTask) + 1 : 0;
    const data = { date, mode: current.reviewsOnly ? "reviews" : "full", remainingMinutes: plan.remainingMinutes, spentMinutes: plan.spentMinutes,
      recallBlocksPlanned: plan.recallTasks.length, next: next && describeTask(next, 1),
      second: tasks[1] && describeTask(tasks[1], 2),
      laterCodingBlock: plan.mainTask && codingPosition > 2 ? describeTask(plan.mainTask, codingPosition) : undefined,
      noTasksReason: next ? undefined : summary };
    return { message,
      data, modelData: data, actions: next ? [{ name: "start_practice", label: "Start next task", args: { handle: handle(next) } }] : undefined };
  };

  function options(args: z.infer<typeof optionsInput>, source = plan) {
    const main = source.mainTask;
    if (!main || main.kind === "variant") return [];
    const topic = args.topic ? findStudyTopic(args.topic) : undefined;
    const avoid = args.avoidTopic ? findStudyTopic(args.avoidTopic) : undefined;
    if ((args.topic && !topic) || (args.avoidTopic && !avoid)) return [];
    return (source.mainAlternatives ?? []).filter(id =>
      (!topic || topic.includes(id)) && !avoid?.includes(id))
      .slice(0, 3).map(problemId => {
        const estimatedMinutes = estimateCodingMinutes(problemMap[problemId], sessionTimings, progress);
        const capacity = source.remainingMinutes - source.recallTasks.length * 3;
        return { ...main, problemId, estimatedMinutes, minutes: Math.min(estimatedMinutes, capacity, args.minutes ?? Infinity) };
      }).filter(task => task.minutes >= 5);
  }
  const upcomingProtected = plan.mainTask?.kind === "variant";
  const planRevision = (source: StudyPlan) => [date, current.reviewsOnly, source.remainingMinutes,
    source.coachTask && handle(source.coachTask), ...orderedStudyTasks(source).map(handle)].join("|");
  const pickRevision = planRevision(plan);
  const revision = [pickRevision, unavailable, ...(plan.mainAlternatives ?? [])].join("|");
  const canPlan = () => !unavailable && !activePracticePath() && tasks.some(task => task.kind !== "variant");
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
    today_plan: { kind: "read", duringPractice: true, description: "Read today's queue, task reasons, recent attempts on those problems, and budget. No arguments.", run: args => noArgs.safeParse(args).success ? today(true) : invalid },
    resume_practice: { duringPractice: true, description: "Open the current running or pending coding or recall session. No arguments.", run: args => noArgs.safeParse(args).success ? resume() : invalid },
    next_task_options: { kind: "read", revision: pickRevision, available: canPlan, description: "Compare eligible picks for Today’s first task across recall, coding review and new practice. Optional topic, avoidTopic, problem (exact title or slug), minutes.", run: raw => {
      const parsed = nextTaskOptionsInput.safeParse(raw);
      if (!parsed.success || !canPlan() || date !== format(new Date(), "yyyy-MM-dd")) return invalid;
      const { topic, avoidTopic, problem, minutes = Infinity } = parsed.data;
      const focus = topic ? findStudyTopic(topic) : undefined;
      const avoid = avoidTopic ? findStudyTopic(avoidTopic) : undefined;
      if ((topic && !focus) || (avoidTopic && !avoid)) return { message: "Which study category or tracked pattern should I use?" };
      const baseline = current.freshPlan({ choice: null, includeCoachCandidates: true });
      const candidates = pickKinds.flatMap(kind => {
        const minimum = kind === "recall" ? 3 : MIN_CODING_BLOCK_MINUTES;
        if (minutes < minimum) return [];
        const ids = baseline.coachCandidates?.[kind].filter(id => (!focus || focus.includes(id)) && !avoid?.includes(id) &&
          (!problem || same(id, problem) || same(problemMap[id].title, problem))) ?? [];
        const [first, second] = ids;
        if (!first) return [];
        const other = ids.find(id => problemMap[id].category !== problemMap[first].category) ?? second;
        return (other ? [first, other] : [first]).map(problemId => ({ problemId, kind,
          minutes: kind === "recall" ? 3 : Math.min(minutes, baseline.remainingMinutes, estimateCodingMinutes(problemMap[problemId], sessionTimings, progress)),
        }));
      });
      const options = candidates.map(({ problemId, kind, minutes }, index) => {
        const p = problemMap[problemId];
        const entry = progress[problemId];
        return { pick: String(index + 1), title: p.title, category: p.category, kind, minutes,
          ...(entry && lastProblemPractice(entry, now)) };
      });
      const data = { date, remainingMinutes: baseline.remainingMinutes, currentNext: next && describeTask(next, 1),
        unfamiliarCheckPlanned: upcomingProtected, options };
      return { message: options.length ? "Compared eligible tasks for the front of today’s plan." : "No alternative matches those preferences today.",
        data, modelData: data, actions: candidates.map((candidate, index) => ({
          name: "apply_plan_pick", label: `Put ${options[index].title} first`,
          args: { ...candidate, pick: options[index].pick, revision: pickRevision },
        })) };
    } },
    apply_plan_pick: { revision: pickRevision, description: "Apply the learner’s chosen Study Chat recommendation.",
      available: raw => canPlan() && raw.revision === pickRevision,
      run: raw => {
        const input = planPickInput.safeParse(raw);
        const store = useStore.getState();
        if (!input.success || !canPlan() || date !== format(new Date(), "yyyy-MM-dd") ||
          (store.reviewOnlyDate === date) !== current.reviewsOnly || input.data.revision !== planRevision(current.freshPlan())) return invalid;
        const { problemId, kind, minutes } = input.data;
        const choice: StudyPlanChoice = { problemId, kind, minutes, source: "coach" };
        const task = current.freshPlan({ choice }).coachTask;
        if (!task || task.problemId !== problemId || task.kind !== kind || task.minutes !== minutes) return invalid;
        store.choosePlanTask(date, choice);
        return { message: `${taskTitle(task)} is now first on Today, with ${task.minutes} min planned.` };
      },
    },
    practice_options: { kind: "read", description: "Find eligible alternate coding blocks for today. Optional topic, avoidTopic, and minutes (integer).", run: raw => {
      const parsed = optionsInput.safeParse(raw);
      if (!parsed.success) return invalid;
      if (unavailable) return waiting;
      const candidates = options(parsed.data);
      const data = candidates.map(task => ({ title: taskTitle(task), minutes: task.minutes, estimatedMinutes: task.estimatedMinutes, reason: task.reason }));
      return { message: candidates.length ? "Eligible choices for today's coding block." : "No alternative coding block fits those preferences today.",
        data, modelData: data.map((item, index) => ({ title: item.title, minutes: item.minutes,
          handle: handle(candidates[index]), estimatedMinutes: item.estimatedMinutes })),
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
      const selectedTask = plan.coachTask ?? (dayPlan?.date === date && plan.mainTask?.problemId === dayPlan.choice?.problemId ? plan.mainTask : undefined);
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
    reset_practice_choice: { description: "Restore today's standard assignment after an alternate or Study Chat pick. No arguments.", run: args => {
      if (!noArgs.safeParse(args).success || date !== format(new Date(), "yyyy-MM-dd")) return invalid;
      useStore.getState().choosePlanTask(date);
      return { message: "Restored the planner's pick for Today." };
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
      const topic = scope ? findStudyTopic(scope) : undefined;
      if (scope && !topic) return { message: `I couldn't match ${scope} to a study category or tracked pattern.` };
      const scoped = topic ? Object.fromEntries(Object.entries(progress).filter(([id]) => topic.includes(id))) : progress;
      const evaluation = getStudyEvaluation(scoped, now);
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 13);
      startDate.setHours(0, 0, 0, 0);
      const within = (value: string) => new Date(value) >= startDate && new Date(value) <= now;
      const recalls = Object.values(scoped).flatMap(item => item.studyState?.recallHistory ?? []).filter(item => within(item.date));
      const data = {
        scope: topic?.name ?? "All topics", start: format(startDate, "yyyy-MM-dd"), end: date,
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
    review_schedule: { kind: "read", description: "Get the latest saved coding and recall, due dates, and Today's queue positions for {topic?: category or pattern}. Omit topic to check the next visible task's category.", run: raw => {
      const parsed = topicInput.safeParse(raw);
      if (!parsed.success || activePracticePath()) return invalid;
      if (unavailable) return waiting;
      const firstVisible = tasks.find(task => task.kind !== "variant");
      const label = parsed.data.topic ?? (firstVisible && problemMap[firstVisible.problemId]?.category);
      const topic = label && findStudyTopic(label);
      if (!topic) return { message: label ? `I couldn't match ${label} to a study category or tracked pattern.` : "Which study topic should I check?" };
      const assignments = tasks.flatMap((task, index) => task.kind !== "variant" && topic.includes(task.problemId)
        ? [{ position: index + 1, title: taskTitle(task), kind: task.kind }] : []);
      const data = { ...topicReviewEvidence(topic, progress, now, current.settings.includePremiumInAssignments),
        todayAssignedCount: assignments.length, todayAssignments: assignments.slice(0, 3) };
      return { message: `Recent practice and review dates for ${topic.name}.`, data, modelData: data };
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
        attempts: entry.history.slice(-5).reverse().map(row => ({ ...codingEvidence(row),
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
