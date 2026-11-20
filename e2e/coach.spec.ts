import { expect, test, type Page } from "@playwright/test";

test.skip(!!process.env.PLAYWRIGHT_BASE_URL, "Study chat uses the local fixture provider and account");

async function fixture(page: Page, call = { name: "practice_options", arguments: "{}" }, weekdayMinutes = 30) {
  const userId = "user_study_chat_fixture";
  const progress: Record<string, unknown>[] = [];
  const timings: Record<string, unknown>[] = [];
  const saves: { p_operation_id: string; p_payload: { progress: Record<string, unknown>[]; timings: Record<string, unknown>[] } }[] = [];
  let calls = 0;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.clock.install({ time: new Date("2026-11-16T12:00:00") });
  await page.addInitScript(userId => {
    localStorage.setItem("lc-e2e-user", userId);
    localStorage.setItem("lc-tracker-features-modal-version", "1");
  }, userId);
  await page.route("https://test.supabase.co/**", async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? 500);
    let data: unknown = [];
    if (path.endsWith("/user_settings")) data = {
      version: 1, onboarding_complete: true, leetcode_username: null, target_interview_date: "",
      settings_json: { settings: { learningMode: "EXPLORE", studySchedule: {
        weekdayMinutes, weekendMinutes: weekdayMinutes, restDay: -1, blackoutDates: [],
      } } },
    };
    else if (path.endsWith("/problem_progress")) data = progress.slice(offset, offset + limit);
    else if (path.endsWith("/session_timings")) data = timings.slice(offset, offset + limit);
    else if (path.endsWith("/sprint_state")) data = null;
    else if (path.endsWith("/commit_user_change")) {
      const payload = route.request().postDataJSON() as typeof saves[number];
      saves.push(payload);
      progress.push(...payload.p_payload.progress.map(row => ({ ...row, version: 1 })));
      timings.push(...payload.p_payload.timings);
      data = { duplicate: false };
    }
    await route.fulfill({ json: data });
  });
  await page.route("**/__coach_fixture", route => {
    calls++;
    const answer = route.request().postDataJSON().response_format.json_schema.name === "answer";
    const payload = answer ? { suggestion: "Pick one of the eligible blocks." } :
      { calls: [call], clarification: "" };
    return route.fulfill({ json: { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(payload) } }] } });
  });
  return { progress, saves, calls: () => calls };
}

const chat = (page: Page) => page.getByRole("complementary", { name: "Study chat", exact: true });
const live = (page: Page) => chat(page).getByRole("region", { name: "Live study plan" });
const next = (page: Page) => page.getByRole("region", { name: "Your next action" });
const activeDraft = (page: Page) => page.evaluate(() =>
  JSON.parse(sessionStorage.getItem("lc-tracker-active-session") ?? "{}").state?.activeSession);
async function message(page: Page, text: string) {
  await chat(page).getByLabel("Message", { exact: true }).fill(text);
  await chat(page).getByRole("button", { name: "Send", exact: true }).click();
}

for (const [theme, width] of [["light", 390], ["dark", 390], ["light", 1440], ["dark", 1440]] as const) {
  test(`chat shortcut, composer and message roles at ${width}px in ${theme}`, async ({ page }, testInfo) => {
    await fixture(page);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/dashboard");
    const launcher = page.getByRole("button", { name: "Open study chat", exact: true });
    await expect(launcher).toHaveAttribute("aria-keyshortcuts", "Alt+Shift+C");
    await launcher.focus();
    await page.keyboard.press("Alt+Shift+KeyC");
    const composer = chat(page).getByRole("textbox", { name: "Message" });
    await expect(composer).toBeFocused();
    await expect(chat(page).getByText("Scripted provider", { exact: true })).toHaveCount(0);
    const log = chat(page).getByRole("log");

    await composer.fill("What should I practice next?");
    await composer.press("Shift+Enter");
    await expect(composer).toHaveValue("What should I practice next?\n");
    await composer.dispatchEvent("keydown", { key: "Enter", code: "Enter", isComposing: true });
    await expect(log.getByRole("article")).toHaveCount(0);
    await composer.press("Enter");
    await expect(composer).toHaveValue("");

    const userMessage = log.getByRole("article", { name: "You", exact: true });
    const reply = log.getByRole("article", { name: "Study chat", exact: true });
    await expect(userMessage).toHaveText(/What should I practice next\?/);
    await expect(reply).toContainText("is next");
    expect((await userMessage.boundingBox())!.x).toBeGreaterThan((await reply.boundingBox())!.x);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(chat(page).getByRole("button", { name: "Send", exact: true })).toBeInViewport();
    await chat(page).screenshot({ path: testInfo.outputPath("chat.png"), animations: "disabled" });

    await page.keyboard.press("Alt+Shift+KeyC");
    await expect(chat(page)).toBeHidden();
    await expect(launcher).toBeFocused();
    await page.keyboard.press("Alt+Shift+KeyC");
    await expect(userMessage).toBeVisible();
    await chat(page).getByRole("link", { name: "Open full chat" }).click();
    await expect(page).toHaveURL(/\/coach$/);
    await expect(chat(page).getByRole("heading", { level: 1, name: "Study chat" })).toBeVisible();
    await page.keyboard.press("Alt+Shift+KeyC");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(chat(page)).toBeHidden();
  });
}

for (const fromChat of [true, false]) {
  test(`chat recommendation starts and saves in the ${fromChat ? "chat → Today" : "Today → chat"} direction`, async ({ page }) => {
    const stored = await fixture(page);
    await page.goto("/dashboard");
    const initial = await next(page).getByRole("heading").innerText();
    await page.getByRole("button", { name: "Ask study chat" }).click();
    await message(page, "Can you find another eligible problem for the coding block?");
    const alternatives = chat(page).getByRole("button", { name: /^Select .+ · \d+ min$/ });
    await expect(alternatives).toHaveCount(3);
    const selectedLabel = (await alternatives.nth(1).innerText()).match(/^Select (.+) · (\d+) min$/)!;
    const [, selected, allocated] = selectedLabel;
    expect(initial).not.toContain(selected);
    await alternatives.nth(1).click();
    await expect(next(page).getByRole("heading")).toContainText(selected);
    await expect(live(page)).toContainText(selected);
    if (fromChat) {
      await chat(page).getByRole("button", { name: "Start selected problem", exact: true }).click();
    } else {
      await next(page).getByRole("button", { name: "Start practice block", exact: true }).click();
    }
    await expect(page).toHaveURL(/\/timer\//);
    await expect(live(page)).toContainText("In progress");
    const draft = await activeDraft(page);
    expect(draft.plannedMinutes).toBe(Number(allocated));
    expect(draft.practiceKind).toBe("learning");
    await expect(page.getByRole("region", { name: "Coding timer" })).toBeVisible();
    const routeKey = await page.evaluate(() => history.state?.key);
    await live(page).getByRole("button", { name: "Resume session", exact: true }).click();
    expect(await page.evaluate(() => history.state?.key)).toBe(routeKey);
    expect((await activeDraft(page)).id).toBe(draft.id);
    if (fromChat) {
      await chat(page).getByRole("button", { name: "Close study chat" }).press("Enter");
      await expect(chat(page)).toBeHidden();
      await page.getByRole("button", { name: "I'm Done", exact: true }).click();
      await page.getByRole("button", { name: /^Solved independently/ }).click();
      await page.getByRole("spinbutton", { name: "Minutes spent" }).fill("12");
      await page.getByRole("spinbutton", { name: "Seconds spent" }).fill("0");
      await page.getByRole("button", { name: "Save & continue", exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard/);
      await page.getByRole("button", { name: "Ask study chat" }).click();
    } else {
      await message(page, "Finish coding");
      await expect(page.getByRole("button", { name: /^Solved independently/ })).toBeVisible();
      await message(page, "Record passed with none and clear");
      await expect(page.getByRole("button", { name: "Save & continue", exact: true })).toBeEnabled();
      await message(page, "I spent 12 minutes");
      await expect(page.getByRole("spinbutton", { name: "Minutes spent" })).toHaveValue("12");
      await message(page, "Save my result");
    }
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(live(page)).toContainText("18 min left today");
    const newTask = (await next(page).getByRole("heading").innerText()).replace(/^\d+\.\s*/, "");
    await expect(live(page)).toContainText(newTask);
    expect(stored.calls()).toBe(2);
    expect(stored.saves).toHaveLength(1);
    expect(stored.saves[0].p_operation_id).toBe(draft.id);
    expect(stored.saves[0].p_payload.timings[0].elapsed_seconds).toBe(720);
  });
}

test("a scripted model can propose a change which applies only when the learner confirms", async ({ page }) => {
  const stored = await fixture(page, { name: "set_review_mode", arguments: '{"mode":"reviews"}' });
  await page.goto("/dashboard");
  const mode = page.getByRole("button", { name: "Reviews only", exact: true });
  await expect(mode).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Ask study chat" }).click();
  await message(page, "Could you change the plan to a review-only day?");
  const confirmation = chat(page).getByRole("button", { name: "Apply set review mode" });
  await expect(confirmation).toBeVisible();
  await expect(chat(page).getByText("reviews", { exact: true })).toBeVisible();
  await expect(mode).toHaveAttribute("aria-pressed", "false");
  await expect(live(page).getByRole("button", { name: "Start next task" })).toBeVisible();

  await confirmation.click();
  await expect(mode).toHaveAttribute("aria-pressed", "true");
  await expect(chat(page).getByText("Reviews only is on for today.")).toBeVisible();
  await expect(live(page).getByRole("button", { name: "Start next task" })).toHaveCount(0);
  await mode.click();
  await expect(live(page).getByRole("button", { name: "Start next task" })).toBeVisible();
  expect(stored.calls()).toBe(1);
});

test("a Today mode change retires a previously offered coding action in open chat", async ({ page }) => {
  const stored = await fixture(page);
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Ask study chat" }).click();
  await message(page, "Show other options");
  await chat(page).getByRole("button", { name: /^Select .+ · \d+ min$/ }).nth(1).click();
  await expect(chat(page).getByRole("button", { name: "Start selected problem" })).toBeVisible();
  await page.getByRole("button", { name: "Reviews only", exact: true }).click();
  await expect(chat(page).getByRole("button", { name: "Start selected problem" })).toHaveCount(0);
  expect(stored.calls()).toBe(0);
});

test("Study Chat can put a due coding review first and respects a later manual plan change", async ({ page }, testInfo) => {
  const { progress, saves } = await fixture(page);
  const lastAttempt = "2026-11-10T12:00:00";
  progress.push({ problem_id: "number-of-islands", version: 1, first_solved_at: lastAttempt, last_reviewed_at: lastAttempt,
    next_review_at: "2026-11-16T08:00:00", history: [{ date: lastAttempt, rating: 2,
      codingOutcome: { correctness: "failed", assistance: "none", explanation: "partial" } }],
    study_state: { version: 1, source: "practice", recallIntervalDays: 8, codingIntervalDays: 6, lapses: 1,
      nextRecallAt: "2026-11-18T12:00:00", nextCodingAt: "2026-11-16T08:00:00", recallHistory: [] } });
  const intentTools: string[] = [];
  let answers = 0;
  let delay: Promise<void> | undefined;
  const explanation = "I'd put Number of Islands first. The last implementation failed its tests, and a 20-minute coding review fits today.";
  await page.route("**/__coach_fixture", async route => {
    const { response_format, messages } = route.request().postDataJSON();
    const isAnswer = response_format.json_schema.name === "answer";
    let data;
    if (isAnswer) {
      const wait = delay;
      delay = undefined;
      answers++;
      const input = JSON.parse(messages[1].content);
      const pick = input.evidence[0].facts.options.find((option: { kind: string }) => option.kind === "coding_review")?.pick;
      data = { suggestion: explanation, pick: pick ?? "keep" };
      if (wait) await wait;
    } else {
      intentTools.push(messages[1].content);
      data = { calls: [{ name: "next_task_options", arguments: '{"topic":"Graphs","minutes":20}' }], clarification: "" };
    }
    return route.fulfill({ json: { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(data) } }] } });
  });

  await page.goto("/dashboard");
  const heading = next(page).getByRole("heading");
  const original = await heading.innerText();
  expect(original).not.toContain("Number of Islands");
  await page.getByRole("button", { name: "Ask study chat" }).click();
  await message(page, "Would focusing on graphs today make more sense?");
  const proposed = chat(page).getByRole("button", { name: "Put Number of Islands first" });
  await expect(proposed).toBeVisible();
  await expect(heading).toHaveText(original);
  await proposed.click();
  await expect(heading).toContainText("Number of Islands");
  await next(page).getByRole("button", { name: "Restore planner’s pick" }).click();
  await expect(heading).toHaveText(original);

  let releaseAnswer!: () => void;
  delay = new Promise<void>(resolve => { releaseAnswer = resolve; });
  const delegate = chat(page).getByRole("button", { name: "Let AI choose next task" });
  await delegate.click();
  await expect.poll(() => answers).toBe(2);
  const reviewMode = page.getByRole("button", { name: "Reviews only", exact: true });
  await reviewMode.click();
  releaseAnswer();
  await expect(chat(page).getByRole("alert")).toContainText("Today changed");
  await expect(reviewMode).toHaveAttribute("aria-pressed", "true");
  await reviewMode.click();
  await expect(heading).toHaveText(original);

  await chat(page).getByRole("button", { name: "New chat" }).click();
  await chat(page).getByRole("textbox", { name: "Message" }).fill("Focus on graphs. I have 20 minutes.");
  await delegate.click();
  await expect(heading).toContainText("Number of Islands");
  await expect(next(page)).toContainText("Study Chat pick");
  await expect(live(page)).toContainText("Number of Islands · 20 min");
  await expect(chat(page).getByText("Number of Islands is now first on Today, with 20 min planned.")).toBeVisible();
  expect(intentTools.every(input => !input.includes("apply_plan_pick"))).toBe(true);
  expect(intentTools.slice(1).every(input => !input.includes("start_practice"))).toBe(true);
  expect(await activeDraft(page)).toBeFalsy();
  await page.screenshot({ path: testInfo.outputPath("study-chat-pick.png"), animations: "disabled" });

  await next(page).getByRole("button", { name: "Start practice block" }).click();
  await expect(page).toHaveURL(/\/timer\/number-of-islands$/);
  expect(await activeDraft(page)).toMatchObject({ problemId: "number-of-islands", practiceKind: "coding_review", plannedMinutes: 20 });
  expect(saves).toHaveLength(0);
  expect(answers).toBe(3);
});

test("chat explains a topic's place in today's plan and follows up on its coding due date", async ({ page }) => {
  const { progress, saves } = await fixture(page, undefined, 45);
  const row = (problemId: string, first: string, recallDue: string, codingDue: string, source = "practice") => ({
    problem_id: problemId, version: 1, first_solved_at: first, last_reviewed_at: first, next_review_at: recallDue,
    history: [], notes: "fixture-private-note",
    study_state: { version: 1, source, recallIntervalDays: 3, codingIntervalDays: 7, lapses: 0,
      nextRecallAt: recallDue, nextCodingAt: codingDue, recallHistory: [] },
  });
  const islands = row("number-of-islands", "2026-10-29", "2026-11-18T12:00:00", "2026-11-21T12:00:00");
  progress.push(
    { ...islands, history: [{ date: "2026-10-29T12:00:00", rating: 4, rawCode: "fixture-private-code",
      codingOutcome: { correctness: "passed", assistance: "hint", explanation: "partial" } }],
    study_state: { ...islands.study_state, recallHistory: [{ id: "55878c4f-cdbb-4615-b449-61469bc46a1a",
      date: "2026-11-02T12:00:00", elapsedSeconds: 90, outcome: "recalled", checkedAgainst: "solution",
      answer: "fixture-private-recall" }] } },
    row("max-area-of-island", "2026-10-15T12:00:00", "2026-11-14T12:00:00", "2026-11-24T12:00:00", "leetcode_import"),
    row("two-sum", "2026-10-12T12:00:00", "2026-10-25T12:00:00", "2026-11-23T12:00:00"),
  );
  const first = "Do I need today's problems? I haven't practiced graphs in a while.";
  const followUp = "When is the coding one due?";
  const reply = "I'd keep today's plan. Max Area of Island is your second task today, a recall check. Your last saved graph coding attempt was Number of Islands on October 29 and you used a hint. Its coding check is due November 21, when you can try the implementation independently.";
  const requests: Array<{ step: string; messages: Array<{ content: string }> }> = [];
  await page.route("**/__coach_fixture", route => {
    const { response_format, messages } = route.request().postDataJSON();
    const step = response_format.json_schema.name;
    requests.push({ step, messages });
    const topic = { name: "review_schedule", arguments: '{"topic":"Graph"}' };
    const data = step === "answer"
      ? { suggestion: JSON.parse(messages[1].content).question === first ? reply : "Number of Islands is due for coding on November 21." }
      : { calls: messages.at(-1).content === first ? [{ name: "today_plan", arguments: "{}" }, topic] : [topic], clarification: "" };
    return route.fulfill({ json: { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(data) } }] } });
  });

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Ask study chat" }).click();
  await message(page, first);
  await expect(chat(page).getByText(reply, { exact: true })).toBeVisible();
  const log = chat(page).getByRole("log");
  await expect(log.getByRole("article", { name: "Study chat", exact: true }).first()).toContainText(reply);

  const initialAnswer = JSON.parse(requests[1].messages[1].content);
  expect(initialAnswer.evidence).toMatchObject([
    { tool: "today_plan", facts: { next: { title: "Two Sum", position: 1 }, second: { title: "Max Area of Island", position: 2 } } },
    { tool: "review_schedule", facts: {
      topic: "Graphs", trackedProblems: 2,
      lastCoding: { title: "Number of Islands", date: "2026-10-29", correctness: "passed", assistance: "hint" },
      lastRecall: { title: "Number of Islands", date: "2026-11-02", outcome: "recalled" },
      lastImportedAcceptance: { title: "Max Area of Island", date: "2026-10-15" },
      recallDueDates: { dueCount: 1, oldestDue: { title: "Max Area of Island", date: "2026-11-14" },
        nextFutureDue: { title: "Number of Islands", date: "2026-11-18" } },
      codingDueDates: { dueCount: 0, nextFutureDue: { title: "Number of Islands", date: "2026-11-21" } },
      todayAssignedCount: 1, todayAssignments: [{ position: 2, title: "Max Area of Island", kind: "recall" }],
    } },
  ]);
  expect(initialAnswer.evidence[0].facts.laterCodingBlock).toEqual({
    title: "Unfamiliar check", position: 3, kind: "variant", minutes: 35, reason: expect.any(String),
  });
  await message(page, followUp);
  await expect(chat(page).getByText("Number of Islands is due for coding on November 21.", { exact: true })).toBeVisible();
  expect(requests.map(request => request.step)).toEqual(["intent", "answer", "intent", "answer"]);
  expect(requests[2].messages[1].content).toContain("review_schedule (read)");
  expect(requests[2].messages[2].content).toContain(first);
  expect(requests[2].messages[2].content).toContain('"topic":"Graphs"');
  expect(JSON.parse(requests[3].messages[1].content).context).toContain(first);
  expect(JSON.stringify(requests)).not.toContain("fixture-private-");
  expect(saves).toHaveLength(0);
});
