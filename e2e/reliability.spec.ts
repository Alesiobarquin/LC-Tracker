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
  await page.getByRole('button', { name: /3 — Acceptable/ }).click();
  await expect(page.getByText('Could not confirm your save.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Session Complete' })).toBeVisible();
  await expect(page.getByPlaceholder(/Jot down/)).toHaveValue('Preserved notes');
  await page.getByRole('button', { name: /3 — Acceptable/ }).click();
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
  await expect(page.getByText('02:00', { exact: true })).toBeVisible();
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
