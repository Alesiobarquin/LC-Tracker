import { expect, test } from '@playwright/test';

async function waitForAppShell(page: import('@playwright/test').Page) {
  // Clerk auth bootstrap shows a temporary “LC Tracker” splash; wait until it leaves.
  await page.waitForFunction(() => {
    const splash = document.querySelector('h1');
    const bodyText = document.body?.innerText ?? '';
    const onlySplash =
      splash?.textContent?.trim() === 'LC Tracker' &&
      !bodyText.includes('Problem Library') &&
      !bodyText.includes('Privacy') &&
      !bodyText.includes('Continue with Google') &&
      !bodyText.includes('Train With Structure') &&
      !bodyText.includes('Syntax Reference') &&
      !bodyText.includes('Pattern');
    return !onlySplash;
  }, undefined, { timeout: 45_000 });
}

test.describe('public smoke', () => {
  test('landing shows brand and plan loop', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText(/Plan/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Privacy/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Terms/i })).toBeVisible();
  });

  test('library loads and exposes search', async ({ page }) => {
    await page.goto('/library');
    await waitForAppShell(page);
    await expect(page.getByRole('heading', { name: /Problem Library/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search problems/i)).toBeVisible();
  });

  test('patterns roadmap loads', async ({ page }) => {
    await page.goto('/patterns');
    await waitForAppShell(page);
    await expect(page.getByText(/Pattern/i).first()).toBeVisible();
  });

  test('syntax defaults to due study mode', async ({ page }) => {
    await page.goto('/syntax');
    await waitForAppShell(page);
    await expect(page.getByText(/Syntax/i).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /Due now/i })).toBeVisible();
  });

  test('privacy and terms pages render', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: /Terms of Service/i })).toBeVisible();
  });

  test('login shows recoverable google CTA', async ({ page }) => {
    await page.goto('/login');
    await waitForAppShell(page);
    await expect(page.getByText(/Continue with Google|Google/i).first()).toBeVisible();
  });
});
