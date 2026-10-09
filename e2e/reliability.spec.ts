import { expect, test, type Page } from '@playwright/test';

// Local signed-in simulations supplement (not replace) PostgreSQL/RLS tests.
test.skip(!!process.env.PLAYWRIGHT_BASE_URL, 'Auth mocks exist only in the local e2e server');
const userId = 'user_e2e';
const operationId = '00000000-0000-4000-8000-000000000001';
const timing = { id: operationId, problemId: 'two-sum', category: 'Arrays & Hashing',
  date: '2026-10-06T12:00:00Z', elapsedSeconds: 120, sessionType: 'new', rating: 3 };

async function signIn(page: Page) {
  await page.addInitScript(({ userId }) => { localStorage.setItem('lc-e2e-user', userId); }, { userId });
  await page.route('https://test.supabase.co/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith('/user_settings')
      ? { version: 1, onboarding_complete: true, leetcode_username: null, target_interview_date: '2027-01-01', settings_json: { settings: { learningMode: 'EXPLORE' } } }
      : path.endsWith('/sprint_state') ? null : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
}

test('failed timer saves preserve the operation across reload and retry', async ({ page }) => {
  await signIn(page);
  await page.addInitScript(({ userId, timing }) => {
    if (!sessionStorage.getItem('lc-tracker-active-session')) {
      sessionStorage.setItem('lc-tracker-active-session', JSON.stringify({ state: {
        activeSession: { id: timing.id, userId, problemId: 'two-sum', startTimestamp: Date.now() - 120000,
          isReview: false, isColdSolve: false, completion: { timing, rating: 3, notes: 'Preserved notes' } },
        sessionReturnTo: '/library',
      }, version: 0 }));
    }
  }, { userId, timing });
  const saves: any[] = [];
  await page.route('https://test.supabase.co/rest/v1/rpc/commit_user_change', async (route) => {
    saves.push(route.request().postDataJSON());
    await route.fulfill({ status: saves.length === 1 ? 503 : 200, contentType: 'application/json',
      body: JSON.stringify(saves.length === 1 ? { code: 'XX000', message: 'Simulated lost response' } : { duplicate: true, imported: 0 }) });
  });
  await page.goto('/timer/two-sum');
  await expect(page.getByRole('heading', { name: 'Session Complete' })).toBeVisible();
  await page.getByRole('button', { name: 'Retry save' }).click();
  await expect(page.getByText('Could not confirm your save.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Session Complete' })).toBeVisible();
  await expect(page.getByPlaceholder(/Jot down/)).toHaveValue('Preserved notes');
  await page.getByRole('button', { name: 'Retry save' }).click();
  await expect(page).toHaveURL(/\/library/);
  expect(saves).toHaveLength(2);
  expect(saves[0].p_operation_id).toBe(operationId);
  expect(saves[1].p_operation_id).toBe(operationId);
  expect(saves[0].p_payload.timings).toEqual(saves[1].p_payload.timings);
});

test('failed settings reads cannot send an initialized sprint write', async ({ page }) => {
  await signIn(page);
  let writes = 0;
  await page.route('https://test.supabase.co/rest/v1/user_settings*', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Unavailable' }) }));
  await page.route('https://test.supabase.co/rest/v1/rpc/commit_user_change', async (route) => {
    writes++;
    await route.fulfill({ status: 200, body: '{}' });
  });
  await page.goto('/dashboard');
  await expect(page.getByRole('alert').first()).toBeVisible();
  expect(writes).toBe(0);
  await expect(page).not.toHaveURL(/onboarding/);
});

test('study time targets remain editable during latency and survive a failed save', async ({ page }) => {
  await signIn(page);
  const stored = { version: 1, onboarding_complete: true, leetcode_username: null,
    target_interview_date: '2027-01-01', settings_json: { settings: { learningMode: 'EXPLORE',
      studySchedule: { weekdayMinutes: 60, weekendMinutes: 120, restDay: 0, blackoutDates: [] } } } };
  await page.route('https://test.supabase.co/rest/v1/user_settings*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stored) }));
  const saves: any[] = [];
  let releaseFirstSave!: () => void;
  const firstSave = new Promise<void>((resolve) => { releaseFirstSave = resolve; });
  await page.route('https://test.supabase.co/rest/v1/rpc/commit_user_change', async (route) => {
    const payload = route.request().postDataJSON();
    saves.push(payload);
    if (saves.length === 1) {
      await firstSave;
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 'XX000' }) });
      return;
    }
    stored.settings_json = payload.p_payload.settings.settings_json;
    stored.version++;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ duplicate: false }) });
  });
  await page.goto('/settings');
  const weekday = page.locator('#section-schedule input[type="range"]').nth(0);
  const weekend = page.locator('#section-schedule input[type="range"]').nth(1);
  await expect(weekday).toHaveValue('60');
  await weekday.focus();
  await weekday.press('ArrowRight');
  await weekday.press('ArrowRight');
  await expect(weekday).toHaveValue('90', { timeout: 1000 });
  await weekend.focus();
  await weekend.press('ArrowLeft');
  await weekend.press('ArrowLeft');
  await weekend.press('ArrowLeft');
  await expect(weekend).toHaveValue('75');
  expect(saves).toHaveLength(0);
  await page.getByRole('button', { name: 'Save study time targets' }).click();
  await expect(page.getByRole('button', { name: 'Saving study time targets…' })).toBeDisabled();
  await expect(weekday).toBeDisabled();
  releaseFirstSave();
  await expect(page.getByRole('alert').filter({ hasText: 'Could not save your study time targets' })).toBeVisible();
  await expect(weekday).toHaveValue('90');
  await expect(weekend).toHaveValue('75');
  await page.getByRole('button', { name: 'Save study time targets' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Study time targets saved' })).toBeVisible();
  expect(saves).toHaveLength(2);
  expect(saves[1].p_payload.settings.settings_json.settings.studySchedule).toMatchObject({ weekdayMinutes: 90, weekendMinutes: 75 });
  await page.reload();
  await expect(weekday).toHaveValue('90');
  await expect(weekend).toHaveValue('75');
});

test('study time target conflicts keep the draft until saved values are explicitly reloaded', async ({ page }) => {
  await signIn(page);
  const stored = { version: 1, onboarding_complete: true, target_interview_date: '2027-01-01',
    settings_json: { settings: { learningMode: 'EXPLORE', studySchedule: {
      weekdayMinutes: 60, weekendMinutes: 120, restDay: 0, blackoutDates: [] } } } };
  await page.route('https://test.supabase.co/rest/v1/user_settings*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stored) }));
  const saves: any[] = [];
  await page.route('https://test.supabase.co/rest/v1/rpc/commit_user_change', async (route) => {
    const payload = route.request().postDataJSON();
    saves.push(payload);
    stored.settings_json = payload.p_payload.settings.settings_json;
    stored.version++;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/settings');
  const weekday = page.getByLabel('Weekday Daily Target');
  await expect(weekday).toHaveValue('60');
  await weekday.press('ArrowRight');
  await weekday.press('ArrowRight');
  stored.settings_json.settings.studySchedule.weekdayMinutes = 105;
  stored.settings_json.settings.studySchedule.restDay = 2;
  stored.version++;
  const save = page.getByRole('button', { name: 'Save study time targets' });
  await save.click();
  await expect(page.getByRole('alert').filter({ hasText: 'Select Use saved targets' })).toBeVisible();
  await expect(weekday).toHaveValue('90');
  await save.click();
  await expect(page.getByRole('alert').filter({ hasText: 'Select Use saved targets' })).toBeVisible();
  expect(saves).toHaveLength(0);
  await page.getByRole('button', { name: 'Use saved targets' }).click();
  await expect(weekday).toHaveValue('105');
  await weekday.press('ArrowRight');
  await save.click();
  await expect(page.getByRole('status').filter({ hasText: 'Study time targets saved' })).toBeVisible();
  expect(saves).toHaveLength(1);
  expect(stored.settings_json.settings.studySchedule).toMatchObject({ weekdayMinutes: 120, restDay: 2 });
});

test('Google sign-in failures show a recovery message', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByRole('alert')).toContainText('Google sign-in failed');
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
});

test('finished timers and draft notes survive reload before a rating is submitted', async ({ page }) => {
  await signIn(page);
  await page.addInitScript(({ userId, operationId }) => {
    if (!sessionStorage.getItem('lc-tracker-active-session')) {
      sessionStorage.setItem('lc-tracker-active-session', JSON.stringify({ state: {
        activeSession: { id: operationId, userId, problemId: 'two-sum', startTimestamp: Date.now() - 120000,
          isReview: false, isColdSolve: false, finishedElapsed: 120, draftNotes: 'My draft survives' },
        sessionReturnTo: '/library',
      }, version: 0 }));
    }
  }, { userId, operationId });
  await page.goto('/timer/two-sum');
  await expect(page.getByRole('heading', { name: 'Session Complete' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Session Complete' })).toBeVisible();
  await expect(page.getByPlaceholder(/Jot down/)).toHaveValue('My draft survives');
  await expect(page.getByRole('spinbutton', { name: 'Minutes spent' })).toHaveValue('2');
  await expect(page.getByRole('spinbutton', { name: 'Seconds spent' })).toHaveValue('0');
});

test('invalid configuration shows an unavailable page before app services load', async ({ page }) => {
  await page.route('**/src/lib/configuration.ts', (route) => route.fulfill({
    contentType: 'application/javascript', body: 'export function configurationErrors() { return ["missing configuration"]; }',
  }));
  let appRequests = 0;
  page.on('request', (request) => { if (request.url().includes('/src/App.tsx')) appRequests++; });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'LC Tracker is temporarily unavailable' })).toBeVisible();
  expect(appRequests).toBe(0);
});
