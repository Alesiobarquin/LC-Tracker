import { expect, test } from "@playwright/test";

test.skip(!!process.env.PLAYWRIGHT_BASE_URL, "Uses the local authenticated fixture");

test("chat shares the current flashcard and retries its rating once", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lc-e2e-user", "user_syntax_chat");
    localStorage.setItem("lc-tracker-features-modal-version", "1");
  });
  const settings = { onboarding_complete: true, version: 1, settings_json: {} };
  const saves: { p_operation_id: string }[] = [];
  await page.route("https://test.supabase.co/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/commit_user_change")) {
      const input = route.request().postDataJSON();
      saves.push(input);
      if (saves.length === 1) {
        Object.assign(settings, input.p_payload.settings, { version: 2 });
        await route.fulfill({ status: 503, json: { message: "Lost response" } });
      } else {
        await route.fulfill({ json: { duplicate: true } });
      }
      return;
    }
    await route.fulfill({ json: path.endsWith("/user_settings") ? settings : [] });
  });

  await page.goto("/syntax");
  await page.getByRole("button", { name: /^Practice Due/ }).click();
  await page.getByRole("button", { name: /start session/i }).click();
  const deck = page.getByRole("dialog", { name: /Due Now/i });
  await deck.getByRole("button", { name: "Study chat" }).click();
  const chat = page.getByRole("complementary", { name: "Study chat" });
  await expect(chat.getByText(/^Card 1 of /)).toBeVisible();
  await chat.getByRole("button", { name: "Know it", exact: true }).click();
  await expect(chat.getByText(/rating is unconfirmed/)).toBeVisible();
  await expect(deck.getByRole("alert")).toContainText("Could not confirm the rating");
  await deck.getByRole("button", { name: "Retry rating", exact: true }).click();
  await expect(chat.getByText(/^Card 2 of /)).toBeVisible();
  await expect(deck.getByRole("alert")).toHaveCount(0);
  expect(saves).toHaveLength(2);
  expect(saves[1].p_operation_id).toBe(saves[0].p_operation_id);
});

test("a chat recall draft, native comparison and chat save share one attempt", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lc-e2e-user", "user_recall_chat");
    localStorage.setItem("lc-tracker-features-modal-version", "1");
  });
  const originalDate = "2025-12-01T12:00:00Z";
  let row = {
    problem_id: "two-sum",
    version: 1,
    first_solved_at: originalDate,
    last_reviewed_at: originalDate,
    next_review_at: originalDate,
    review_count: 0,
    consecutive_threes: 0,
    retired: false,
    notes: "",
    history: [{ date: originalDate, rating: 4 }],
    study_state: null,
  };
  const saves: { p_operation_id: string; p_payload: {
    progress: { study_state: { recallHistory: unknown[] } }[];
  } }[] = [];
  const timings: Record<string, unknown>[] = [];
  await page.route("https://test.supabase.co/**", async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.endsWith("/commit_user_change")) {
      const input = route.request().postDataJSON();
      saves.push(input);
      row = { ...input.p_payload.progress[0], version: 2 };
      timings.push(...input.p_payload.timings);
      await route.fulfill({ json: { duplicate: false } });
      return;
    }
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? 500);
    await route.fulfill({ json: path.endsWith("/user_settings") ? {
      onboarding_complete: true, version: 1, settings_json: {},
    } : path.endsWith("/problem_progress") ? [row].slice(offset, offset + limit)
      : path.endsWith("/session_timings") ? timings.slice(offset, offset + limit) : [] });
  });

  await page.goto("/recall/two-sum");
  const editor = page.getByLabel("Your attempt · explanation or pseudocode");
  await expect(editor).toBeEditable();
  await page.getByRole("button", { name: "Open study chat" }).click();
  const chat = page.getByRole("complementary", { name: "Study chat" });
  async function send(message: string) {
    await chat.getByLabel("Message", { exact: true }).fill(message);
    await chat.getByRole("button", { name: "Send", exact: true }).click();
  }
  const answer = "Keep a map of values already seen.";
  await send(`Answer: ${answer}`);
  await expect(editor).toHaveText(answer);
  await page.getByRole("button", { name: "Compare with a reference", exact: true }).click();
  await page.getByRole("button", { name: "I’ve compared my answer — continue" }).click();
  await send("I spent 5 minutes");
  await expect(page.getByRole("spinbutton", { name: "Minutes spent" })).toHaveValue("5");
  await send("Save partial recall");
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(saves).toHaveLength(1);
  expect(saves[0].p_payload.progress[0].study_state.recallHistory).toEqual([
    expect.objectContaining({ outcome: "partial", answer, elapsedSeconds: 300, id: saves[0].p_operation_id }),
  ]);
  expect(timings).toHaveLength(1);
});
