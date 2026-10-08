import { expect, test } from '@playwright/test';

test('landing explains the planner and updates its sample from the goal', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Know what to solve next.' })).toBeVisible();
  await expect(page.getByText('Personalized LeetCode practice')).toBeVisible();
  await expect(page.getByText('Set your interview goal and study time. LC Tracker turns your recorded practice into a daily plan: what to review, what to solve, and why.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'A clear next step. A reason behind it.' })).toBeVisible();
  await expect(page.getByText(/Example practice history/)).toBeVisible();
  await expect(page.locator('.landing-plan-task--main')).toContainText('Two Sum');
  await expect(page.locator('.landing-plan-task--main')).toContainText('failed tests');

  await page.getByRole('button', { name: 'In 2 months' }).click();
  await expect(page.getByText('Interview in 2 months')).toBeVisible();
  await expect(page.locator('.landing-plan-task--recall')).toContainText('Two Sum');
  await expect(page.locator('.landing-plan-task--main')).toContainText('Top K Frequent Elements');

  await page.getByRole('button', { name: 'In 3 weeks' }).click();
  await expect(page.locator('.landing-plan-task--main')).toContainText('Two Sum');
  const exampleLink = page.getByRole('link', { name: 'See an example' });
  const planPreview = page.locator('#plan-preview');
  await expect(exampleLink).toHaveAttribute('href', '#plan-preview');
  await exampleLink.focus();
  await exampleLink.press('Enter');
  await expect(page).toHaveURL(/#plan-preview$/);
  await expect(planPreview).toBeFocused();
  const previewBounds = await planPreview.boundingBox();
  expect(previewBounds?.y).toBeGreaterThanOrEqual(64);
  expect(previewBounds?.y).toBeLessThan(140);
  const controlsBounds = await page.getByRole('group', { name: 'Example interview timeline' }).boundingBox();
  expect(controlsBounds?.y).toBeGreaterThanOrEqual(0);
  expect((controlsBounds?.y ?? Infinity) + (controlsBounds?.height ?? Infinity)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerHeight),
  );

  for (const href of ['/library', '/patterns', '/syntax', '/privacy', '/terms']) {
    await expect(page.locator(`a[href="${href}"]`).first()).toBeAttached();
  }

  await page.getByRole('link', { name: 'Build my study plan' }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText(/Continue with Google|Google/i).first()).toBeVisible();
});

test('landing controls remain usable on mobile in both themes and with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/');

  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect(root).not.toHaveAttribute('data-landing-motion', 'ready');
  const darkSurface = await page.locator('.landing-plan-frame').evaluate(element => getComputedStyle(element).backgroundColor);

  const themeControl = page.getByRole('combobox', { name: 'Color theme' });
  await themeControl.selectOption('light');
  await expect(root).toHaveAttribute('data-theme', 'light');
  const lightSurface = await page.locator('.landing-plan-frame').evaluate(element => getComputedStyle(element).backgroundColor);
  expect(lightSurface).not.toBe(darkSurface);

  const startLink = page.getByRole('link', { name: 'Build my study plan' }).first();
  const startBounds = await startLink.boundingBox();
  expect(startBounds?.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'In 2 months' }).click();
  await expect(page.locator('.landing-plan-task--main')).toContainText('Top K Frequent Elements');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});
