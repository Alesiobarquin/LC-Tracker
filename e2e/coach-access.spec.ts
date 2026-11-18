import { expect, test } from '@playwright/test';
import type { CoachInput } from '../src/coach/protocol';

test.skip(!!process.env.PLAYWRIGHT_BASE_URL, 'Study Chat allowance uses isolated account and provider fixtures');

test('free questions share one turn across both calls, then a personal key resumes custom chat', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('lc-e2e-user', 'user_coach_allowance');
    localStorage.setItem('lc-tracker-features-modal-version', '1');
  });
  await page.route('https://test.supabase.co/**', route => route.fulfill({
    json: route.request().url().includes('/user_settings') ? {
      version: 1, onboarding_complete: true, settings_json: { settings: { learningMode: 'EXPLORE' } },
    } : [],
  }));
  const resetAt = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString();
  const requests: { provider: string; key?: string; turnId: string; input: CoachInput }[] = [];
  let interrupted = false;
  await page.route('**/api/coach', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { hosted: 'free', nativeKeys: true } });
    const request = route.request().postDataJSON() as typeof requests[number];
    requests.push(request);
    if (request.provider === 'gemini') return route.fulfill({ json: { data: { calls: [], clarification: 'Gemini is ready to help.' } } });
    if (request.input.step === 'answer') return route.fulfill({ json: { data: { suggestion: 'Try one independent coding block.' } } });
    if (request.input.question === 'Should I review arrays tomorrow?' && !interrupted) {
      interrupted = true;
      return route.abort();
    }
    const questions = new Set(requests.filter(item => item.input.step === 'intent').map(item => item.turnId)).size;
    const allowance = { remaining: Math.max(0, 2 - questions), resetAt };
    if (questions > 2) return route.fulfill({ status: 429, json: { code: 'daily_limit', resetAt, allowance } });
    return route.fulfill({ json: {
      data: { calls: [{ name: 'progress_summary', arguments: '{}' }], clarification: '' }, allowance,
    } });
  });

  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Open study chat', exact: true }).click();
  const chat = page.getByRole('complementary', { name: 'Study chat' });
  const composer = chat.getByRole('textbox', { name: 'Message', exact: true });
  const send = async (message: string) => { await composer.fill(message); await composer.press('Enter'); };
  await expect(chat.getByText('Free AI · 2 questions per day')).toBeVisible();
  await send('What do my latest attempts tell you?');
  await expect(chat.getByText('Try one independent coding block.')).toBeVisible();
  expect(requests.map(item => item.input.step)).toEqual(['intent', 'answer']);
  expect(requests[0].turnId).toBe(requests[1].turnId);
  expect(requests.every(item => item.key === undefined)).toBe(true);
  await expect(chat.getByText('Free AI · 1 of 2 left today')).toBeVisible();

  await send('How should I use my next coding block?');
  await expect(chat.getByText('Try one independent coding block.')).toHaveCount(2);
  await expect(chat.getByText('Free AI · 0 of 2 left today')).toBeVisible();
  await send('Should I review arrays tomorrow?');
  await expect(chat.getByRole('alert')).toHaveText(/Could not confirm the reply/);
  await expect(composer).toHaveValue('Should I review arrays tomorrow?');
  await composer.press('Enter');
  await expect(chat.getByRole('alert')).toHaveText('You’ve used your free AI questions for today.');
  expect(requests[4].turnId).toBe(requests[5].turnId);
  await expect(chat.getByText(/^Resets .+ Study shortcuts are available\.$/)).toBeVisible();
  await expect(composer).toHaveValue('Should I review arrays tomorrow?');

  await send('Show my recent progress');
  await expect(chat.getByText(/Learning evidence for All topics/)).toHaveCount(3);
  expect(requests).toHaveLength(6);
  await chat.getByRole('link', { name: 'Use your own API key' }).click();
  await expect(page).toHaveURL(/\/settings#section-study-chat$/);
  const settings = page.getByRole('region', { name: 'Study chat', exact: true });
  await settings.getByLabel('Provider').selectOption('gemini');
  const key = 'AIza_fixture_gemini_key_for_e2e_123';
  await settings.getByLabel('Gemini API key').fill(key);
  await settings.getByRole('checkbox').check();
  await settings.getByRole('button', { name: 'Connect Gemini' }).click();
  await expect(settings.getByRole('status')).toHaveText('Gemini key added for this tab');
  await page.getByRole('button', { name: 'Open study chat', exact: true }).click();
  await expect(chat.getByText('Gemini · Your key')).toBeVisible();
  await expect(chat.getByText(/Learning evidence for All topics/)).toHaveCount(0);
  await send('Can we work on arrays next?');
  await expect(chat.getByText('Gemini is ready to help.')).toBeVisible();
  expect(requests.at(-1)).toMatchObject({ provider: 'gemini', key, input: { context: '' } });
  expect(await page.evaluate(secret =>
    !JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]).includes(secret), key)).toBe(true);
});
