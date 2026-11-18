import { expect, test, type Page } from "@playwright/test";

test.skip(!!process.env.PLAYWRIGHT_BASE_URL, "Study chat uses the local fixture provider and account");

async function fixture(page: Page, call = { name: "practice_options", arguments: "{}" }) {
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
        weekdayMinutes: 30, weekendMinutes: 30, restDay: -1, blackoutDates: [],
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
  return { saves, calls: () => calls };
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
