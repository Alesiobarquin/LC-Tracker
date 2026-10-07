import { expect, test, type Page } from '@playwright/test';

test.skip(!!process.env.PLAYWRIGHT_BASE_URL, 'Theme simulations use only the local fixture server');

const themeControl = (page: Page) => page.locator('select[aria-label="Color theme"]:visible').first();
const themeRoot = (page: Page) => page.locator('html');

async function authenticatedFixture(page: Page, progressRows: Record<string, unknown>[] = []) {
  await page.addInitScript(() => {
    localStorage.setItem('lc-e2e-user', 'user_theme_e2e');
    localStorage.setItem('lc-tracker-features-modal-version', '1');
  });
  await page.route('https://test.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 500);
    const data = path.endsWith('/user_settings') ? {
      version: 1,
      onboarding_complete: true,
      target_interview_date: '',
      leetcode_username: null,
      settings_json: {
        settings: {
          learningMode: 'EXPLORE',
          studySchedule: { weekdayMinutes: 30, weekendMinutes: 30, restDay: -1, blackoutDates: [] },
        },
      },
    } : path.endsWith('/problem_progress') ? progressRows.slice(offset, offset + limit)
      : path.endsWith('/sprint_state') ? null : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
}

test('saved appearance is applied before the React entry point runs', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('lc-tracker-theme', 'light'));
  await page.route('**/src/main.tsx', route => route.abort());
  await page.goto('/');
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'light');
  await expect(themeRoot(page)).toHaveAttribute('data-theme-preference', 'light');
  expect(await themeRoot(page).evaluate(root => getComputedStyle(root).colorScheme)).toBe('light');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f5f3ee');
});

test('theme changes preserve an active recall answer and comparison stage without saving a session', async ({ page }) => {
  await authenticatedFixture(page, [{
    problem_id: 'two-sum',
    version: 1,
    first_solved_at: '2025-12-01T12:00:00Z',
    last_reviewed_at: '2025-12-01T12:00:00Z',
    next_review_at: '2025-12-05T12:00:00Z',
    review_count: 0,
    consecutive_threes: 1,
    consecutive_successes: 1,
    retired: false,
    notes: 'Saved reference: check each complement before adding the value to a hash map.',
    history: [{ date: '2025-12-01T12:00:00Z', rating: 4 }],
    study_state: null,
  }]);
  const writes: string[] = [];
  page.on('request', request => {
    if (request.url().includes('test.supabase.co') && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method())) {
      writes.push(request.url());
    }
  });
  await page.goto('/recall/two-sum');
  const answer = page.getByLabel('Your attempt · explanation or pseudocode');
  const draftText = 'Track previously seen values in a hash map. Look up the complement before insertion; O(n) time and space.';
  await answer.fill(draftText);
  const pauseButton = page.getByRole('button', { name: 'Pause check', exact: true });
  await expect(pauseButton).toBeVisible();
  const pauseBounds = await pauseButton.boundingBox();
  const headingColor = await page.locator('.attempt-problem-title').evaluate(el => getComputedStyle(el).color);
  const problemNumberColor = await page.locator('.attempt-problem-title span').evaluate(el => getComputedStyle(el).color);
  expect(problemNumberColor).toBe(headingColor);
  await pauseButton.click();
  const resumeButton = page.getByRole('button', { name: 'Resume check', exact: true });
  await expect(resumeButton).toBeVisible();
  await expect(page.getByText('Timer paused', { exact: true })).toHaveCount(0);
  expect(await resumeButton.boundingBox()).toEqual(pauseBounds);
  await resumeButton.click();
  await expect(pauseButton).toBeVisible();
  expect(await pauseButton.boundingBox()).toEqual(pauseBounds);
  await themeControl(page).selectOption('dark');
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'dark');
  await expect(answer).toHaveValue(draftText);
  await expect(answer).toBeEditable();
  await expect(page.getByRole('button', { name: 'Pause check', exact: true })).toBeVisible();
  await expect(page.getByText('Saved reference:', { exact: false })).not.toBeVisible();
  await page.getByRole('button', { name: 'Compare with a reference' }).click();
  await page.getByRole('button', { name: 'I’ve compared my answer — continue' }).click();
  await themeControl(page).selectOption('light');
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'light');
  await expect(answer).toHaveValue(draftText);
  await expect(answer).toBeEditable();
  await expect(page.getByRole('heading', { name: 'Record what you recalled' })).toBeVisible();
  await expect(page.getByLabel('Personal explanation')).toHaveValue(/Saved reference:/);
  await page.reload();
  await expect(themeControl(page)).toHaveValue('light');
  await expect(answer).toHaveValue(draftText);
  await expect(answer).toBeEditable();
  await expect(page.getByLabel('Personal explanation')).toHaveValue(/Saved reference:/);
  await expect(page.getByRole('button', { name: 'Resume check', exact: true })).toBeVisible();
  expect(writes).toEqual([]);
});

test('system preference tracks the OS and explicit choices survive reload and synchronize across tabs', async ({ page, context }) => {
  await authenticatedFixture(page);
  const writes: string[] = [];
  const trackWrites = (tab: Page) => tab.on('request', request => {
    if (request.url().includes('test.supabase.co') && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method())) {
      writes.push(request.url());
    }
  });
  trackWrites(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/dashboard');
  await expect(themeControl(page)).toHaveValue('system');
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'light');
  await themeControl(page).selectOption('dark');
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(themeControl(page)).toHaveValue('dark');
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'dark');
  await page.goto('/library');
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'dark');
  await expect(themeControl(page)).toHaveValue('dark');

  const otherTab = await context.newPage();
  trackWrites(otherTab);
  await authenticatedFixture(otherTab);
  await otherTab.goto('/library');
  await expect(themeControl(otherTab)).toHaveValue('dark');
  await themeControl(otherTab).selectOption('light');
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'light');
  await expect(themeControl(page)).toHaveValue('light');
  await themeControl(page).selectOption('system');
  await expect(themeControl(otherTab)).toHaveValue('system');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'dark');
  expect(writes).toEqual([]);
});

test('mobile and public controls remain usable when theme storage is unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'lc-tracker-theme') throw new DOMException('Preference storage unavailable', 'SecurityError');
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === 'lc-tracker-theme') throw new DOMException('Preference storage unavailable', 'SecurityError');
      return set.call(this, key, value);
    };
  });
  await page.goto('/');
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'dark');
  await themeControl(page).selectOption('light');
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'light');
  await page.goto('/library');
  await expect(themeControl(page)).toBeVisible();
  await themeControl(page).selectOption('light');
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'light');
  const bounds = await themeControl(page).boundingBox();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.reload();
  await expect(themeControl(page)).toHaveValue('system');
  await expect(themeRoot(page)).toHaveAttribute('data-theme', 'dark');
});
