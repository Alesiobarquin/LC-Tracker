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
  await expect(answer).toHaveValue(/Use a hash map/);
  await expect(
    page.getByRole("button", { name: "Resume check" }),
  ).toBeVisible();
  await page.goto("/timer/valid-anagram");
  await expect(page).toHaveURL(/\/recall\/two-sum/);
  await expect(answer).toHaveValue(/Use a hash map/);
  await page.getByRole("button", { name: "Resume check" }).click();
  await page.getByRole("button", { name: "Compare with a reference" }).click();
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
  await expect(answer).toHaveValue(/Corrected:/);
  await expect(answer).toBeDisabled();
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

test("coding requires explicit outcomes and preserves them across refresh", async ({
  page,
}) => {
  await fixture(page, []);
  let saved: any;
  await page.route(
    "https://test.supabase.co/rest/v1/rpc/commit_user_change",
    async (route) => {
      saved = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: '{"duplicate":false}',
      });
    },
  );
  await page.goto("/timer/two-sum");
  await page.getByRole("button", { name: /Done/ }).last().click();
  await page.getByRole("button", { name: /4 — Strong/ }).click();
  await expect(
    page.getByText("Record correctness, assistance, and explanation", {
      exact: false,
    }),
  ).toBeVisible();
  expect(saved).toBeUndefined();
  await page.getByLabel("Correctness", { exact: true }).selectOption("passed");
  await page.getByLabel("Assistance used").selectOption("none");
  await page.getByLabel("Can you explain why it works?").selectOption("clear");
  await page.reload();
  await expect(page.getByLabel("Correctness", { exact: true })).toHaveValue(
    "passed",
  );
  await expect(page.getByLabel("Assistance used")).toHaveValue("none");
  await page.getByRole("button", { name: /4 — Strong/ }).click();
  await expect(page).toHaveURL(/\/library/);
  expect(saved.p_payload.progress[0].history.at(-1).codingOutcome).toEqual({
    correctness: "passed",
    assistance: "none",
    explanation: "clear",
  });
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
      await answer.fill('Use a map to look up the complement.');
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
      await expect(answer).toHaveValue('Still editable in the recording step.');
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
  await expect(page.getByLabel('Your attempt · explanation or pseudocode')).toHaveValue('Draft stays here.');
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
      await page
        .getByLabel("Correctness", { exact: true })
        .selectOption("unfinished");
      await page.getByLabel("Assistance used").selectOption("none");
      await page
        .getByLabel("Can you explain why it works?")
        .selectOption("partial");
      await page.reload();
      await expect(page.getByLabel("Correctness", { exact: true })).toHaveValue(
        "unfinished",
      );
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
