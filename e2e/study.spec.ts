import { expect, test, type Page } from "@playwright/test";

test.skip(
  !!process.env.PLAYWRIGHT_BASE_URL,
  "Authenticated simulations use only the local fixture server",
);
const userId = "user_study_e2e";
const originalHistory = [{ date: "2025-12-01T12:00:00Z", rating: 4 }];
function progressRow(id = "two-sum") {
  return {
    problem_id: id,
    version: 1,
    first_solved_at: "2025-12-01T12:00:00Z",
    last_reviewed_at: "2025-12-01T12:00:00Z",
    next_review_at: "2025-12-05T12:00:00Z",
    review_count: 0,
    consecutive_threes: 1,
    consecutive_successes: 1,
    retired: false,
    notes: "Saved reference: keep the seen values in a hash map.",
    history: originalHistory,
    study_state: null,
  };
}
async function fixture(page: Page, rows = [progressRow()]) {
  await page.addInitScript(
    ({ userId }) => {
      localStorage.setItem("lc-e2e-user", userId);
      localStorage.setItem("lc-tracker-features-modal-version", "1");
    },
    { userId },
  );
  const stored = {
    progress: rows,
    timings: [] as any[],
    settings: {
      version: 1,
      onboarding_complete: true,
      target_interview_date: "",
      leetcode_username: null,
      settings_json: {
        settings: {
          learningMode: "EXPLORE",
          studySchedule: {
            weekdayMinutes: 30,
            weekendMinutes: 30,
            restDay: -1,
            blackoutDates: [],
          },
        },
      },
    },
  };
  await page.route("https://test.supabase.co/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? 500);
    const data = path.endsWith("/user_settings")
      ? stored.settings
      : path.endsWith("/problem_progress")
        ? stored.progress.slice(offset, offset + limit)
        : path.endsWith("/session_timings")
          ? stored.timings.slice(offset, offset + limit)
          : path.endsWith("/sprint_state")
            ? null
            : [];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  return stored;
}

test("recall conceals references, preserves a draft, and retries a lost response exactly once", async ({
  page,
}, testInfo) => {
  const stored = await fixture(page);
  const saves: any[] = [];
  await page.route(
    "https://test.supabase.co/rest/v1/rpc/commit_user_change",
    async (route) => {
      const request = route.request().postDataJSON();
      saves.push(request);
      if (saves.length === 1) {
        stored.progress = request.p_payload.progress.map((row: any) => ({
          ...row,
          version: 2,
        }));
        stored.timings = request.p_payload.timings;
      }
      await route.fulfill({
        status: saves.length === 1 ? 503 : 200,
        contentType: "application/json",
        body: JSON.stringify(
          saves.length === 1
            ? { code: "XX000", message: "Lost response after commit" }
            : { duplicate: true },
        ),
      });
    },
  );
  await page.goto("/recall/two-sum");
  await expect(
    page.getByRole("heading", { name: "Recall check", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Saved reference:", { exact: false }),
  ).not.toBeVisible();
  const answer = page.getByLabel("Your attempt · explanation or pseudocode");
  await answer.fill(
    "Use a hash map of seen values; check the complement before insertion. O(n) time and space.",
  );
  await page.reload();
  await expect(answer).toHaveText(/Use a hash map/);
  await expect(
    page.getByRole("button", { name: "Resume check" }),
  ).toBeVisible();
  await page.goto("/timer/valid-anagram");
  await expect(page).toHaveURL(/\/recall\/two-sum/);
  await expect(answer).toHaveText(/Use a hash map/);
  await page.getByRole("button", { name: "Resume check" }).click();
  await page.getByRole("button", { name: "Compare with a reference" }).click();
  await expect(page.getByRole('heading', { name: 'Hash Map (One Pass)' })).toBeVisible();
  await page.getByLabel('Reference used').selectOption('notes');
  await expect(page.getByLabel("Personal explanation")).toHaveValue(/Saved reference:/);
  await expect(answer).toBeEditable();
  await answer.fill("Corrected: check the complement before inserting, and return both indices.");
  await page.screenshot({
    path: testInfo.outputPath("recall-reference.png"),
    fullPage: true,
    animations: "disabled",
  });
  await expect(page.getByRole("button", { name: /^Recalled/ })).toHaveCount(0);
  await page.getByRole("button", { name: "I’ve compared my answer — continue" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Record what you recalled" })).toBeVisible();
  await expect(answer).toBeEditable();
  await page.getByRole("button", { name: /^Recalled/ }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Your answer and attempt are preserved" }),
  ).toBeVisible();
  await page.reload();
  await expect(answer).toHaveText(/Corrected:/);
  await expect(answer).toHaveAttribute('aria-readonly', 'true');
  await expect(answer).not.toBeEditable();
  await answer.press('x');
  await expect(answer).toHaveText('Corrected: check the complement before inserting, and return both indices.');
  await page.getByRole("button", { name: /^Retry: Recalled/ }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  expect(saves).toHaveLength(2);
  expect(saves[0].p_kind).toBe("recall");
  expect(saves[0].p_operation_id).toBe(saves[1].p_operation_id);
  expect(saves[0].p_payload.timings).toEqual(saves[1].p_payload.timings);
  expect(stored.progress[0].history).toEqual(originalHistory);
  expect(stored.progress[0].review_count).toBe(0);
  expect(stored.progress[0].study_state.recallHistory).toHaveLength(1);
  expect(stored.progress[0].study_state.recallHistory[0].answer).toMatch(/^Use a hash map/);
  expect(stored.progress[0].study_state.recallHistory[0].revisedAnswer).toMatch(/^Corrected:/);
  expect(saves[0].p_payload.progress[0].study_state.recallHistory).toEqual(saves[1].p_payload.progress[0].study_state.recallHistory);
  expect(stored.timings).toHaveLength(1);
  expect(stored.timings[0].session_type).toBe("recall");
  await page.goto('/analytics');
  await page.locator('.session-history-row').first().click();
  const detail = page.getByRole('dialog');
  await expect(detail.getByRole('heading', { name: 'Original answer from memory' })).toBeVisible();
  await expect(detail.getByRole('heading', { name: 'Correction after comparison' })).toBeVisible();
  await expect(detail).toContainText('Corrected: check the complement before inserting');
});

test('recall editor supports IDE keys and keeps code mixed with plain English through reload', async ({ page }) => {
  await fixture(page);
  await page.goto('/recall/two-sum');
  const answer = page.getByLabel('Your attempt · explanation or pseudocode');
  const savedAnswer = () => page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('lc-tracker-active-session')!).state.activeRecall.answer as string,
  );
  await answer.fill('def compress(chars):');
  const keyword = answer.locator('span').filter({ hasText: /^def$/ });
  await expect(keyword).toBeVisible();
  expect(await keyword.evaluate(element => getComputedStyle(element).color)).toBe(
    await page.locator('html').evaluate(element => getComputedStyle(element).getPropertyValue('--palette-code-keyword').trim())
      .then(hex => hex.match(/\w\w/g)!.map(channel => parseInt(channel, 16)))
      .then(rgb => `rgb(${rgb.join(', ')})`),
  );
  await answer.press('ControlOrMeta+a');
  await answer.press('ArrowRight');
  await answer.press('Enter');
  await expect.poll(savedAnswer).toBe('def compress(chars):\n    ');
  await answer.press('Tab');
  await expect.poll(savedAnswer).toBe('def compress(chars):\n        ');
  await answer.press('Shift+Tab');
  await expect.poll(savedAnswer).toBe('def compress(chars):\n    ');
  await page.keyboard.insertText('count this run in plain English');
  const mixedAnswer = 'def compress(chars):\n    count this run in plain English';
  await expect.poll(savedAnswer).toBe(mixedAnswer);
  await expect(page.locator('.cm-tooltip-autocomplete')).toHaveCount(0);
  // Move the caret to finish the typing group before testing comment undo.
  await answer.press('ArrowLeft');
  await answer.press('ArrowRight');
  await answer.press('ControlOrMeta+/');
  await expect.poll(savedAnswer).toBe('def compress(chars):\n    # count this run in plain English');
  await answer.press('ControlOrMeta+z');
  await expect.poll(savedAnswer).toBe(mixedAnswer);
  await answer.press('ControlOrMeta+Shift+Z');
  await expect.poll(savedAnswer).toContain('# count');
  await answer.press('ControlOrMeta+z');
  await answer.press('Alt+ArrowUp');
  await expect.poll(savedAnswer).toBe('    count this run in plain English\ndef compress(chars):');
  await answer.press('Alt+ArrowDown');
  await expect.poll(savedAnswer).toBe(mixedAnswer);
  await answer.press('ControlOrMeta+f');
  await expect(page.locator('.recall-editor .cm-search')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.recall-editor .cm-search')).toHaveCount(0);
  await answer.press('Escape');
  await page.keyboard.press('Tab');
  await expect(page.locator('.recall-editor-shortcuts summary')).toBeFocused();
  await page.getByLabel('Answer highlighting').selectOption('javascript');
  await expect.poll(savedAnswer).toBe(mixedAnswer);
  await page.reload();
  await expect(page.getByLabel('Answer highlighting')).toHaveValue('javascript');
  await expect.poll(savedAnswer).toBe(mixedAnswer);
  await expect(answer).toContainText('count this run in plain English');
});

test('recall editor supports both Windows redo shortcuts', async ({ page }) => {
  await fixture(page);
  await page.addInitScript(() => Object.defineProperty(navigator, 'platform', { value: 'Win32' }));
  await page.goto('/recall/two-sum');
  const answer = page.getByLabel('Your attempt · explanation or pseudocode');
  await answer.fill('Keep the original draft.');
  await answer.press('Control+a');
  await page.keyboard.insertText('Revised draft.');
  await expect(answer).toHaveText('Revised draft.');
  await answer.press('Control+z');
  await expect(answer).toHaveText('Keep the original draft.');
  await answer.press('Control+Shift+Z');
  await expect(answer).toHaveText('Revised draft.');
  await answer.press('Control+z');
  await expect(answer).toHaveText('Keep the original draft.');
  await answer.press('Control+y');
  await expect(answer).toHaveText('Revised draft.');
});

test('recall editor switches highlighting without rewriting the answer and enforces its length limit', async ({ page }) => {
  await fixture(page);
  await page.goto('/recall/two-sum');
  const answer = page.getByLabel('Your attempt · explanation or pseudocode');
  const highlighting = page.getByLabel('Answer highlighting');
  for (const [language, code, keyword] of [
    ['python', 'return 1', 'return'],
    ['javascript', 'const count = 1;', 'const'],
    ['cpp', 'int count = 1;', 'int'],
  ]) {
    await highlighting.selectOption(language);
    await answer.fill(code);
    await expect(answer.locator('span').filter({ hasText: new RegExp(`^${keyword}$`) })).toBeVisible();
    await highlighting.selectOption('text');
    await expect(answer).toHaveText(code);
    await expect(answer.locator('span')).toHaveCount(0);
  }
  const fullAnswer = 'x'.repeat(20000);
  await answer.fill(fullAnswer);
  await expect(page.locator('.recall-editor-status')).toContainText('20,000 / 20,000');
  await answer.press('ControlOrMeta+a');
  await answer.press('ArrowRight');
  await page.keyboard.insertText('overflow');
  await expect.poll(() => page.evaluate(() => {
    const answer = JSON.parse(sessionStorage.getItem('lc-tracker-active-session')!).state.activeRecall.answer as string;
    return answer.length === 20000 && !answer.includes('overflow');
  })).toBe(true);
  await answer.press('Backspace');
  await expect(page.locator('.recall-editor-status')).toContainText('19,999 / 20,000');
});

test("43 eligible items produce a bounded desktop and mobile plan", async ({
  page,
}, testInfo) => {
  const ids = [
    "contains-duplicate",
    "valid-anagram",
    "two-sum",
    "group-anagrams",
    "top-k-frequent-elements",
    "valid-sudoku",
    "product-of-array-except-self",
    "longest-consecutive-sequence",
    "valid-palindrome",
    "two-sum-ii-input-array-is-sorted",
    "3sum",
    "container-with-most-water",
    "best-time-to-buy-and-sell-stock",
    "longest-substring-without-repeating-characters",
    "longest-repeating-character-replacement",
    "valid-parentheses",
    "min-stack",
    "daily-temperatures",
    "binary-search",
    "find-minimum-in-rotated-sorted-array",
    "search-in-rotated-sorted-array",
    "reverse-linked-list",
    "merge-two-sorted-lists",
    "reorder-list",
    "remove-nth-node-from-end-of-list",
    "linked-list-cycle",
    "lru-cache",
    "invert-binary-tree",
    "maximum-depth-of-binary-tree",
    "diameter-of-binary-tree",
    "balanced-binary-tree",
    "same-tree",
    "subtree-of-another-tree",
    "lowest-common-ancestor-of-a-binary-search-tree",
    "binary-tree-level-order-traversal",
    "binary-tree-right-side-view",
    "count-good-nodes-in-binary-tree",
    "validate-binary-search-tree",
    "kth-smallest-element-in-a-bst",
    "kth-largest-element-in-a-stream",
    "last-stone-weight",
    "kth-largest-element-in-an-array",
    "number-of-islands",
  ];
  const rows = ids.map((id) => progressRow(id));
  const stored = await fixture(page, rows);
  stored.progress[0].history = [{ date: new Date().toISOString(), rating: 4,
    ...{ codingOutcome: { correctness: "passed", assistance: "none", explanation: "clear" }, practiceKind: "variant" } }];
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Today’s study plan" }),
  ).toBeVisible();
  await expect(
    page.getByText("43 eligible in your queue.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Start recall check/ }),
  ).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Start practice block" }),
  ).toHaveCount(1);
  await expect(page.getByText("No upcoming interview")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("dashboard-desktop.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Main practice block" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("dashboard-mobile.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("ends the daily plan when only three minutes remain after planned work", async ({
  page,
}) => {
  const ids = [
    "contains-duplicate",
    "valid-anagram",
    "two-sum",
    "group-anagrams",
    "top-k-frequent-elements",
    "valid-sudoku",
    "product-of-array-except-self",
  ];
  const stored = await fixture(page, ids.map((id) => progressRow(id)));
  stored.settings.settings_json.settings.studySchedule = {
    weekdayMinutes: 60,
    weekendMinutes: 60,
    restDay: -1,
    blackoutDates: [],
  };
  const recordedAt = new Date().toISOString();
  stored.timings = [
    ...ids.slice(0, 6).map((problemId, index) => ({
      id: `recall-${index}`,
      problem_id: problemId,
      category: "Arrays & Hashing",
      recorded_at: recordedAt,
      elapsed_seconds: 180,
      session_type: "recall",
      rating: 4,
    })),
    {
      id: "coding-block",
      problem_id: ids[6],
      category: "Arrays & Hashing",
      recorded_at: recordedAt,
      elapsed_seconds: 39 * 60,
      session_type: "review",
      rating: 4,
    },
  ];

  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Today’s plan is complete" }),
  ).toBeVisible();
  await expect(page.getByText("57 min used", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Main practice block" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start practice block" }),
  ).toHaveCount(0);
});

test("does not offer another assignment while a saved coding session is active", async ({
  page,
}) => {
  const stored = await fixture(page, [progressRow("two-sum")]);
  stored.settings.settings_json.settings.studySchedule = {
    weekdayMinutes: 60,
    weekendMinutes: 60,
    restDay: -1,
    blackoutDates: [],
  };
  await page.addInitScript(({ userId }) => {
    sessionStorage.setItem(
      "lc-tracker-active-session",
      JSON.stringify({
        state: {
          activeSession: {
            id: "00000000-0000-4000-8000-000000000001",
            userId,
            problemId: "two-sum",
            startTimestamp: Date.now() - 57 * 60 * 1000,
            isReview: true,
            isColdSolve: false,
            finishedElapsed: 57 * 60,
          },
          sessionReturnTo: "/dashboard",
        },
        version: 0,
      }),
    );
  }, { userId });
  await page.goto("/dashboard");

  await expect(
    page.getByText("Session ended · outcome ready to save", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Record outcome" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Main practice block" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start practice block" }),
  ).toHaveCount(0);
});

test("independent coding saves in two taps without notes or confidence", async ({ page }) => {
  const stored = await fixture(page, []);
  let saved: any;
  await page.route("https://test.supabase.co/rest/v1/rpc/commit_user_change", async route => {
    saved = route.request().postDataJSON();
    stored.progress = saved.p_payload.progress;
    stored.timings = saved.p_payload.timings;
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"duplicate":false}' });
  });
  await page.goto("/timer/two-sum");
  await page.getByRole("button", { name: "I'm Done", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save & continue" })).toBeDisabled();
  await expect(page.getByLabel("Confidence (optional)")).not.toBeVisible();
  await expect(page.getByLabel("Key insight or corrected explanation")).not.toBeVisible();
  await page.getByRole("button", { name: /^Solved independently/ }).click();
  await expect(page.getByLabel("Assistance used")).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /^Solved independently/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Save & continue" }).click();
  await expect(page).toHaveURL(/\/library/);
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("lc-tracker-active-session")!).state.activeSession,
  )).toBeNull();
  const history = saved.p_payload.progress[0].history.at(-1);
  expect(history.codingOutcome).toEqual({ correctness: "passed", assistance: "none", explanation: "clear" });
  expect(history.confidenceReported).toBe(false);
  expect(saved.p_payload.progress[0].study_state.codingIntervalDays).toBe(7);
  await page.goto("/analytics");
  await page.locator(".session-history-row").first().click();
  await expect(page.getByRole("dialog")).toContainText("Confidence: not recorded");
});

for (const [result, correctness, assistance, explanation, interval] of [
  ["Passed with help or gaps", "passed", "hint", "clear", 2],
  ["Passed with help or gaps", "passed", "none", "partial", 2],
  ["Not finished", "unfinished", "none", "partial", 1],
  ["Tests failed", "failed", "solution", "not_yet", 2],
  ["Not tested", "unchecked", "none", "clear", 2],
] as const) {
  test(`coding ${correctness}/${assistance}/${explanation} preserves explicit evidence`, async ({ page }) => {
    await fixture(page, []);
    let saved: any;
    await page.route("https://test.supabase.co/rest/v1/rpc/commit_user_change", async route => {
      saved = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: '{}' });
    });
    await page.goto("/timer/two-sum");
    await page.getByRole("button", { name: "I'm Done", exact: true }).click();
    await page.getByRole("button", { name: new RegExp(`^${result}`) }).click();
    await expect(page.getByLabel("Assistance used")).toHaveValue("");
    await expect(page.getByRole("button", { name: "Save & continue" })).toBeDisabled();
    await page.getByLabel("Assistance used").selectOption(assistance);
    await page.reload();
    await expect(page.getByLabel("Assistance used")).toHaveValue(assistance);
    await expect(page.getByLabel("Can you explain why it works?")).toHaveValue("");
    await page.getByLabel("Can you explain why it works?").selectOption(explanation);
    await page.getByRole("button", { name: "Save & continue" }).click();
    await expect(page).toHaveURL(/\/library/);
    expect(saved.p_payload.progress[0].history.at(-1).codingOutcome).toEqual({ correctness, assistance, explanation });
    expect(saved.p_payload.progress[0].study_state.codingIntervalDays).toBe(interval);
  });
}

test("quick completion freezes optional details and retries the same operation after reload", async ({ page }) => {
  await fixture(page, []);
  const saves: any[] = [];
  await page.route("https://test.supabase.co/rest/v1/rpc/commit_user_change", async route => {
    saves.push(route.request().postDataJSON());
    await route.fulfill({ status: saves.length === 1 ? 503 : 200, contentType: "application/json",
      body: saves.length === 1 ? '{"code":"XX000","message":"Lost response"}' : '{"duplicate":true}' });
  });
  await page.goto("/timer/two-sum");
  await page.getByRole("button", { name: "I'm Done", exact: true }).click();
  await page.getByRole("button", { name: /^Solved independently/ }).click();
  await page.getByText("Notes & confidence (optional)", { exact: true }).click();
  await page.getByLabel("Key insight or corrected explanation").fill("Check the complement before insertion.");
  await page.getByLabel("Confidence (optional)").selectOption("4");
  await page.reload();
  await expect(page.getByLabel("Confidence (optional)")).toHaveValue("4");
  // Number keys no longer submit a confidence rating or bypass the save button.
  await page.getByRole("heading", { name: "Session Complete" }).click();
  await page.keyboard.press("4");
  expect(saves).toHaveLength(0);
  await page.getByRole("button", { name: "Save & continue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Your session is preserved" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Key insight or corrected explanation")).toHaveValue("Check the complement before insertion.");
  await expect(page.getByLabel("Confidence (optional)")).toBeDisabled();
  await expect(page.getByRole("button", { name: /^Not finished/ })).toBeDisabled();
  await page.getByRole("button", { name: "Retry save" }).click();
  await expect(page).toHaveURL(/\/library/);
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("lc-tracker-active-session")!).state.activeSession,
  )).toBeNull();
  expect(saves).toHaveLength(2);
  expect(saves[0].p_operation_id).toBe(saves[1].p_operation_id);
  expect(saves[0].p_payload.timings).toEqual(saves[1].p_payload.timings);
  expect(saves[0].p_payload.progress[0].history).toEqual(saves[1].p_payload.progress[0].history);
  expect(saves[0].p_payload.progress[0].notes).toEqual(saves[1].p_payload.progress[0].notes);
  expect(saves[0].p_payload.progress[0].study_state).toEqual(saves[1].p_payload.progress[0].study_state);
  expect(saves[0].p_payload.progress[0].history.at(-1).confidenceReported).toBe(true);
});

for (const theme of ["light", "dark"]) {
  for (const width of [1280, 390]) {
    test(`completed coding stays closed and tomorrow gets reviews and a new cold solve at ${width}px in ${theme}`, async ({ page }) => {
      await page.clock.install({ time: new Date("2026-10-07T12:00:00") });
      await page.setViewportSize({ width, height: 900 });
      const stored = await fixture(page, [
        "min-cost-climbing-stairs", "contains-duplicate", "valid-anagram",
        "two-sum", "group-anagrams", "binary-search",
        "find-minimum-in-rotated-sorted-array", "reverse-linked-list",
        "merge-two-sorted-lists",
      ].map(id => progressRow(id)));
      stored.settings.settings_json.settings.studySchedule.weekdayMinutes = 60;
      await page.addInitScript(({ userId, theme }) => {
        localStorage.setItem("lc-tracker-theme", theme);
        if (!sessionStorage.getItem("lc-tracker-active-session")) {
          sessionStorage.setItem("lc-tracker-active-session", JSON.stringify({ state: {
            activeSession: {
              id: "00000000-0000-4000-8000-000000000010",
              userId, problemId: "min-cost-climbing-stairs",
              startTimestamp: Date.now() - 60 * 60 * 1000,
              isReview: true, isColdSolve: false, practiceKind: "coding_review",
              finishedElapsed: 60 * 60,
            },
            sessionReturnTo: "/dashboard",
          }, version: 0 }));
        }
      }, { userId, theme });
      const saves: any[] = [];
      await page.route("https://test.supabase.co/rest/v1/rpc/commit_user_change", async route => {
        const request = route.request().postDataJSON();
        saves.push(request);
        for (const row of request.p_payload.progress) {
          const index = stored.progress.findIndex(p => p.problem_id === row.problem_id);
          stored.progress[index] = { ...row, version: stored.progress[index].version + 1 };
        }
        stored.timings.push(...request.p_payload.timings);
        await route.fulfill({ status: 200, contentType: "application/json", body: '{"duplicate":false}' });
      });
      await page.goto("/dashboard");
      await page.getByRole("link", { name: "Record outcome", exact: true }).click();
      await page.getByRole("button", { name: /^Solved independently/ }).click();
      await page.getByRole("button", { name: "Save & continue" }).click();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByRole("heading", { name: "Your time target is complete" })).toBeVisible();
      await expect.poll(() => page.evaluate(() =>
        JSON.parse(sessionStorage.getItem("lc-tracker-active-session")!).state.activeSession,
      )).toBeNull();
      expect(saves).toHaveLength(1);
      expect(stored.timings).toHaveLength(1);
      await page.reload();
      await expect(page.getByRole("heading", { name: "Your time target is complete" })).toBeVisible();
      await page.clock.fastForward(24 * 60 * 60 * 1000 + 60_000);
      await expect(page.locator(".time-budget .register-value")).toHaveText("60");
      await expect(page.getByRole("link", { name: "Resume session", exact: true })).toHaveCount(0);
      await expect(page.getByLabel("Your next action").getByRole("button", { name: "Start recall check", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Main practice block" })).toBeVisible();
      await expect(page.locator(".plan-track")).not.toContainText("Min Cost Climbing Stairs");
      await page.getByRole("button", { name: "Start practice block", exact: true }).click();
      await expect(page.getByText("Unfamiliar check · topic hidden", { exact: true })).toBeVisible();
      const next = await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem("lc-tracker-active-session")!).state.activeSession,
      );
      expect(next.problemId).not.toBe("min-cost-climbing-stairs");
      expect(next.id).not.toBe(saves[0].p_operation_id);
      expect(next.isColdSolve).toBe(true);
    });
  }
}

test("cancelling a leftover coding draft clears it and allows another problem", async ({ page }) => {
  await fixture(page, []);
  let writes = 0;
  await page.route("https://test.supabase.co/rest/v1/rpc/commit_user_change", async route => {
    writes++;
    await route.fulfill({ status: 200, contentType: "application/json", body: '{}' });
  });
  await page.goto("/timer/min-cost-climbing-stairs");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Yes, Cancel", exact: true }).click();
  await expect(page).toHaveURL(/\/library/);
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("lc-tracker-active-session")!).state.activeSession,
  )).toBeNull();
  expect(writes).toBe(0);
  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: "Start practice block", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start practice block", exact: true }).click();
  await expect(page).toHaveURL(/\/timer\/(?!min-cost-climbing-stairs)/);
});

test("a scheduled break suppresses all automatic assignments", async ({
  page,
}) => {
  const stored = await fixture(page);
  stored.settings.settings_json.settings.studySchedule.blackoutDates = [
    { start: "2000-01-01", end: "2099-12-31" },
  ];
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Scheduled break" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start practice block" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Start recall check/ }),
  ).toHaveCount(0);
});

for (const theme of ['light', 'dark']) {
  for (const width of [1280, 390]) {
    test(`built-in recall explanation stays editable and readable at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      const row = { ...progressRow(), notes: '' };
      await fixture(page, [row]);
      await page.addInitScript(theme => localStorage.setItem('lc-tracker-theme', theme), theme);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/recall/two-sum');
      await expect(page.locator('.problem-explanation')).toHaveCount(0);
      await expect(page.getByRole('link', { name: /Watch NeetCode/ })).toHaveCount(0);
      const answer = page.getByLabel('Your attempt · explanation or pseudocode');
      await answer.fill('Try each pair.');
      await page.getByRole('button', { name: 'Compare with a reference' }).click();
      await expect(page.getByRole('heading', { name: 'Hash Map (One Pass)' })).toBeVisible();
      await expect(page.locator('.reference-code .cm-lineNumbers')).toBeVisible();
      await expect(page.locator('.reference-code .cm-content')).toContainText('twoSum');
      await expect(page.getByRole('link', { name: /Watch NeetCode/ })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=KLlXCFG5TnA');
      await expect(answer).toBeEditable();
      await answer.fill('def two_sum(nums, target):\n    seen = {}\n    return ...\n\nLook up the complement before insertion.');
      await page.getByText('View original answer from memory', { exact: true }).click();
      await expect(page.getByText('Try each pair.', { exact: true })).toBeVisible();
      await page.getByLabel('Example language').selectOption('cpp');
      await expect(page.locator('.reference-code .cm-content')).toContainText('vector<int>');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`reference-${theme}-${width}.png`), fullPage: true });
      await page.getByRole('button', { name: 'I’ve compared my answer — continue' }).click();
      await expect(answer).toBeEditable();
      await answer.fill('Still editable in the recording step.');
      await page.reload();
      await expect(answer).toHaveText('Still editable in the recording step.');
      await expect(page.getByRole('heading', { name: 'Record what you recalled' })).toBeVisible();
    });
  }
}

test('a personal explanation and code survive reload, save, and switching back to the built-in reference', async ({ page }) => {
  const stored = await fixture(page, [{ ...progressRow(), notes: '' }]);
  await page.route('https://test.supabase.co/rest/v1/rpc/commit_user_change', async route => {
    const request = route.request().postDataJSON();
    stored.progress = request.p_payload.progress.map((row: any) => ({ ...row, version: 2 }));
    stored.timings = request.p_payload.timings;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"duplicate":false}' });
  });
  await page.goto('/recall/two-sum');
  await page.getByLabel('Your attempt · explanation or pseudocode').fill('Use a complement map.');
  await page.getByRole('button', { name: 'Compare with a reference' }).click();
  await page.getByLabel('Reference used').selectOption('notes');
  await page.getByLabel('Personal explanation').fill('My logic: check the map before adding the current value.');
  await page.getByLabel('Personal code language').selectOption('cpp');
  await expect(page.getByLabel('Personal code language')).toHaveValue('cpp');
  await page.getByRole('textbox', { name: 'Personal code example' }).fill('int solve() { return 1; }');
  await page.reload();
  await expect(page.getByLabel('Personal explanation')).toHaveValue(/^My logic:/);
  await expect(page.getByLabel('Personal code language')).toHaveValue('cpp');
  await expect(page.getByRole('textbox', { name: 'Personal code example' })).toContainText('int solve');
  await page.getByRole('button', { name: 'Use built-in explanation', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hash Map (One Pass)' })).toBeVisible();
  await page.getByLabel('Reference used').selectOption('notes');
  await expect(page.getByLabel('Personal explanation')).toHaveValue(/^My logic:/);
  await page.getByRole('button', { name: 'I’ve compared my answer — continue' }).click();
  await page.getByRole('button', { name: /^Partial recall/ }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  expect(stored.progress[0].notes).toContain('```cpp\nint solve');
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('lc-tracker-active-session')!).state.activeRecall)).toBeNull();
  await page.goto('/library/two-sum/explanation');
  await expect(page.getByRole('heading', { name: 'Your saved explanation' })).toBeVisible();
  await expect(page.locator('.reference-code .cm-content')).toContainText('int solve');
  await page.getByRole('button', { name: 'Built-in explanation', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hash Map (One Pass)' })).toBeVisible();
});

test('an empty original answer cannot become a recalled answer through editing after reveal', async ({ page }) => {
  await fixture(page, [{ ...progressRow(), notes: '' }]);
  await page.goto('/recall/two-sum');
  await page.getByRole('button', { name: 'I can’t recall it' }).click();
  await page.getByLabel('Your attempt · explanation or pseudocode').fill('Copied the answer after comparison.');
  await page.getByRole('button', { name: 'I’ve compared my answer — continue' }).click();
  await page.getByRole('button', { name: /^Recalled/ }).click();
  await expect(page.getByRole('alert')).toContainText('Your original attempt was empty');
});

test('library explanations cover each core list and do not reveal a pending recall answer', async ({ page }) => {
  await fixture(page, [{ ...progressRow(), notes: '' }]);
  for (const [tab, problem] of [['pareto', 'Contains Duplicate'], ['neetcode-75', 'Two Sum'], ['neetcode-150', 'LRU Cache'], ['neetcode-250', 'Text Justification']]) {
    await page.goto(`/library?tab=${tab}&q=${encodeURIComponent(problem)}`);
    await page.getByRole('button', { name: `Explanation for ${problem}`, exact: true }).click();
    await expect(page.locator('.problem-explanation')).toBeVisible();
    await expect(page.locator('.reference-code')).toBeVisible();
  }
  await page.goto('/recall/two-sum');
  await page.getByLabel('Your attempt · explanation or pseudocode').fill('Draft stays here.');
  await page.goto('/library/two-sum/explanation');
  await expect(page.locator('.problem-explanation')).toHaveCount(0);
  await page.getByRole('link', { name: 'Resume recall check' }).click();
  await expect(page.getByLabel('Your attempt · explanation or pseudocode')).toHaveText('Draft stays here.');
});

test('recall shows the built-in level-order solution when a problem has ordinary saved notes', async ({ page }) => {
  const id = 'binary-tree-level-order-traversal';
  const notes = 'Review the queue boundary next time.';
  await fixture(page, [{ ...progressRow(id), notes }]);
  await page.goto(`/recall/${id}`);
  const answer = page.getByLabel('Your attempt · explanation or pseudocode');
  await answer.fill('Use a queue and collect one level at a time.');
  await expect(page.locator('.problem-explanation')).toHaveCount(0);
  await page.getByRole('button', { name: 'Compare with a reference' }).click();
  await expect(page.getByLabel('Reference used').locator('option')).toHaveText([
    'Built-in problem explanation', 'My explanation · edit or replace',
  ]);
  await expect(page.getByRole('heading', { name: 'Breadth First Search', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Solution code' })).toContainText('def levelOrder');
  await page.getByLabel('Example language').selectOption('cpp');
  await expect(page.getByRole('textbox', { name: 'Solution code' })).toContainText('levelOrder(TreeNode* root)');
  await page.getByLabel('Reference used').selectOption('notes');
  await expect(page.getByLabel('Personal explanation')).toHaveValue(notes);
  await page.getByLabel('Personal explanation').fill('My revised queue explanation.');
  await page.getByRole('button', { name: 'Use built-in explanation', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Breadth First Search', exact: true })).toBeVisible();
  await expect(answer).toHaveText('Use a queue and collect one level at a time.');
  await page.getByLabel('Reference used').selectOption('notes');
  await expect(page.getByLabel('Personal explanation')).toHaveValue('My revised queue explanation.');
});

for (const theme of ['light', 'dark']) {
  for (const width of [1280, 390]) {
    test(`revealing the level-order solution brings comparison into view at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      const id = 'binary-tree-level-order-traversal';
      await fixture(page, [{ ...progressRow(id), notes: '' }]);
      await page.setViewportSize({ width, height: 720 });
      await page.addInitScript(theme => localStorage.setItem('lc-tracker-theme', theme), theme);
      await page.goto(`/recall/${id}`);
      await page.getByLabel('Your attempt · explanation or pseudocode').fill('Use a queue.\n'.repeat(25));
      await page.getByRole('button', { name: 'Compare with a reference' }).click();
      const comparison = page.getByRole('region', { name: 'Compare recall answer' });
      await expect(comparison).toBeFocused();
      await expect(page.getByRole('heading', { name: 'Compare and identify gaps' })).toBeInViewport();
      await expect(page.getByRole('heading', { name: 'Breadth First Search', exact: true })).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`level-order-${theme}-${width}.png`) });
    });
  }
}

for (const source of ['external', 'reference']) {
  for (const frozen of [false, true]) {
    test(`a resumed ${source} reference shows the solution and preserves ${frozen ? 'a frozen completion' : 'the original answer'}`, async ({ page }) => {
      const id = 'binary-tree-level-order-traversal';
      await fixture(page, [{ ...progressRow(id), notes: '' }]);
      await page.goto(`/recall/${id}`);
      await page.getByLabel('Your attempt · explanation or pseudocode').fill('Remember the queue boundary.');
      await page.getByRole('button', { name: 'Compare with a reference' }).click();
      const before = await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem('lc-tracker-active-session')!).state.activeRecall,
      );
      before.checkedAgainst = source;
      if (frozen) {
        before.compared = true;
        before.completion = {
          attempt: { id: before.id, date: new Date().toISOString(), elapsedSeconds: 5,
            outcome: 'partial', answer: before.retrievedAnswer, checkedAgainst: source },
          notes: before.notes,
        };
      }
      // Seed on the next load, after the current page's pause-on-unload save.
      await page.addInitScript(draft => {
        const key = 'lc-tracker-active-session';
        const saved = JSON.parse(sessionStorage.getItem(key)!);
        saved.state.activeRecall = draft;
        sessionStorage.setItem(key, JSON.stringify(saved));
      }, before);
      await page.reload();
      await expect(page.getByLabel('Reference used')).toHaveValue('solution');
      await expect(page.getByLabel('Reference used').locator('option')).toHaveCount(2);
      await expect(page.getByRole('heading', { name: 'Breadth First Search', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: /Check the explanation on LeetCode/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /Watch NeetCode/ })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=6ZnyEApgFYg');
      const after = await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem('lc-tracker-active-session')!).state.activeRecall,
      );
      expect(after.id).toBe(before.id);
      expect(after.retrievedAnswer).toBe(before.retrievedAnswer);
      expect(after.checkedAgainst).toBe(source);
      if (frozen) {
        expect(after.completion).toEqual(before.completion);
        await expect(page.getByLabel('Reference used')).toBeDisabled();
        await expect(page.getByRole('heading', { name: 'Record what you recalled' })).toBeInViewport();
      } else {
        await expect(page.getByRole('heading', { name: 'Compare and identify gaps' })).toBeInViewport();
        await page.getByRole('button', { name: 'I’ve compared my answer — continue' }).click();
        expect(await page.evaluate(() =>
          JSON.parse(sessionStorage.getItem('lc-tracker-active-session')!).state.activeRecall.checkedAgainst,
        )).toBe('solution');
      }
    });
  }
}

test('recall explains missing solution coverage and keeps external links available', async ({ page }) => {
  const id = 'count-commas-in-range';
  await fixture(page, [{ ...progressRow(id), notes: '' }]);
  await page.goto(`/recall/${id}`);
  await page.getByRole('button', { name: 'I can’t recall it' }).click();
  await expect(page.getByText('A built-in solution isn’t available for this problem yet.', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Reference used')).toHaveValue('notes');
  await expect(page.getByLabel('Reference used').locator('option')).toHaveText(['My explanation · edit or replace']);
  await expect(page.getByLabel('Personal explanation')).toBeEditable();
  await expect(page.getByRole('link', { name: /Check the explanation on LeetCode/ })).toHaveAttribute('href', 'https://leetcode.com/problems/count-commas-in-range/editorial/');
});

for (const theme of ["light", "dark"]) {
  for (const width of [1280, 390]) {
    test(`unfamiliar practice is protected and hides cues after reload at ${width}px in ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.clock.install({ time: new Date("2026-10-06T12:00:00") });
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (theme) => localStorage.setItem("lc-tracker-theme", theme),
        theme,
      );
      const rows = [
        "contains-duplicate",
        "valid-anagram",
        "two-sum",
        "group-anagrams",
        "binary-search",
        "find-minimum-in-rotated-sorted-array",
        "reverse-linked-list",
        "merge-two-sorted-lists",
      ].map((id) => ({ ...progressRow(id), history: [] }));
      const stored = await fixture(page, rows);
      stored.settings.target_interview_date = "2026-11-03";
      (stored.settings.settings_json.settings as any).targetCurriculum =
        "NEET_150";
      await page.goto("/dashboard");
      await expect(
        page.getByText("Protected unfamiliar check:", { exact: false }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Start practice block", exact: true })
        .click();
      await expect(
        page.getByText("Unfamiliar check · topic hidden", { exact: true }),
      ).toBeVisible();
      await expect(
        page.locator(".timer-workspace .page-heading"),
      ).not.toContainText("Medium");
      await expect(
        page.locator(".timer-workspace .page-heading"),
      ).not.toContainText("Arrays & Hashing");
      await page.reload();
      await expect(
        page.getByText("Unfamiliar check · topic hidden", { exact: true }),
      ).toBeVisible();
      await page.clock.fastForward(31 * 60 * 1000);
      await expect(
        page.getByText("Your check block has ended.", { exact: false }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath("unfamiliar-check.png"),
        fullPage: true,
      });
      await page.getByRole("button", { name: /Done/ }).last().click();
      await page.getByRole("button", { name: /^Not finished/ }).click();
      await page.getByLabel("Assistance used").selectOption("none");
      await page
        .getByLabel("Can you explain why it works?")
        .selectOption("partial");
      await page.reload();
      await expect(page.getByRole("button", { name: /^Not finished/ })).toHaveAttribute("aria-pressed", "true");
    });
    test(`complete topic evidence and evaluation stay readable at ${width}px in ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (theme) => localStorage.setItem("lc-tracker-theme", theme),
        theme,
      );
      await fixture(page, []);
      await page.goto("/analytics");
      const table = page.getByRole("table", { name: "All topic coverage" });
      await expect(table.getByRole("row")).toHaveCount(19);
      await expect(
        table.getByRole("rowheader", {
          name: "1-D Dynamic Programming",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        table.getByRole("rowheader", {
          name: "2-D Dynamic Programming",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        table.getByRole("row").filter({ hasText: "Advanced Graphs" }),
      ).toContainText("Outside target list");
      await expect(page.getByLabel("Two-week study evaluation")).toContainText(
        "0/0",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath("topic-evidence.png"),
        fullPage: true,
      });
    });
  }
}

for (const [id, method] of [
  ["string-compression", "compress"],
  ["reverse-words-in-a-string", "reverseWords"],
  ["reverse-words-in-a-string-ii", "reverseWords"],
  ["reverse-words-in-a-string-iii", "reverseWords"],
]) {
  test(`extended recall comparison loads Python and C++ for ${id}`, async ({ page }) => {
    await fixture(page, [{ ...progressRow(id), notes: "" }]);
    await page.goto(`/recall/${id}`);
    await expect(page.locator(".problem-explanation")).toHaveCount(0);
    const answer = page.getByLabel("Your attempt · explanation or pseudocode");
    await answer.fill("My original approach before comparison.");
    await page.getByRole("button", { name: "Compare with a reference" }).click();
    await expect(page.getByRole("heading", { name: "How it works", exact: true })).toBeVisible();
    await expect(page.locator(".reference-code .cm-content")).toContainText(method);
    await expect(answer).toHaveText("My original approach before comparison.");
    await page.getByLabel("Example language").selectOption("cpp");
    await expect(page.locator(".reference-code .cm-content")).toContainText(method);
    await page.getByText("Source and license", { exact: true }).click();
    await expect(page.getByRole("link", { name: "NeetCode’s source", exact: true })).toHaveAttribute("href", /github.com\/neetcode-gh\/leetcode\/blob\//);
  });
}

for (const theme of ["light", "dark"]) {
  for (const width of [1280, 390]) {
    test(`additional medium/easy comparisons and attribution at ${width}px in ${theme}`, async ({ page }) => {
      await fixture(page, []);
      await page.addInitScript(theme => localStorage.setItem('lc-tracker-theme', theme), theme);
      await page.setViewportSize({ width, height: 900 });
      for (const [id, method] of [["3sum-closest", "threeSumClosest"], ["add-strings", "addStrings"]]) {
        await page.goto(`/library/${id}/explanation`);
        await expect(page.getByRole("heading", { name: "How it works", exact: true })).toBeVisible();
        await expect(page.locator(".reference-code .cm-content")).toContainText(method);
        await page.getByLabel("Example language").selectOption("cpp");
        await expect(page.locator(".reference-code .cm-content")).toContainText(method);
        await page.getByText("Source and license", { exact: true }).click();
        await expect(page.getByRole("link", { name: "walkccc / Peng-Yu Chen", exact: true })).toHaveAttribute("href", /github.com\/walkccc\/LeetCode\/tree\/9b85aa15/);
        await expect(page.getByRole("link", { name: "MIT license", exact: true })).toHaveAttribute("href", "/walkccc-license.txt");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
      await page.goto('/library/valid-sudoku/explanation');
      await expect(page.getByRole('heading', { name: 'How it works', exact: true })).toBeVisible();
      await expect(page.locator('.reference-code .cm-content')).toContainText('collections.defaultdict(set)');
      await expect(page.getByText('Hash Set (One Pass)', { exact: true })).toBeVisible();
      await expect(page.getByText('Bitmask', { exact: true })).toHaveCount(0);
      await page.getByLabel('Example language').selectOption('cpp');
      await expect(page.locator('.reference-code .cm-content')).toContainText('unordered_set<char>');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
}
