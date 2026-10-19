import { expect, test } from '@playwright/test';

test('public deep links have unique production canonicals, previews, and breadcrumbs', async ({ page }) => {
  const titles = new Set<string>();
  for (const [route, title] of [
    ['/library', 'LeetCode Problem Library'],
    ['/library/explanations', 'LeetCode Problem Explanations'],
    ['/patterns/two-pointers', 'Two Pointers (Converging)'],
    ['/library/two-sum/explanation', 'Two Sum Explained'],
    ['/syntax', 'Python & C++ Interview Syntax Reference'],
  ]) {
    await page.goto(`${route}?utm_source=seo-check`);
    await expect(page).toHaveTitle(new RegExp(title.replace(/[()*+?]/g, '\\$&')));
    const canonical = `https://lc-tracker.app${route}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index,follow/);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://lc-tracker.app/og-image.png');
    const data = JSON.parse(await page.locator('#page-structured-data').textContent() ?? '{}');
    expect(data['@graph'].some((node: Record<string, unknown>) => node['@type'] === 'BreadcrumbList')).toBe(true);
    const currentTitle = await page.title();
    expect(titles.has(currentTitle)).toBe(false);
    titles.add(currentTitle);
  }
});

test('the explanation index exposes deep links and updates metadata during navigation', async ({ page }) => {
  await page.goto('/library');
  await page.getByRole('link', { name: 'Browse all problem explanations' }).click();
  await expect(page).toHaveURL(/\/library\/explanations$/);
  const search = page.getByRole('searchbox', { name: 'Find an explanation' });
  await search.fill('two sum');
  const link = page.getByRole('link', { name: 'Two Sum', exact: true });
  await expect(link).toHaveAttribute('href', '/library/two-sum/explanation');
  await link.click();
  await expect(page).toHaveTitle(/Two Sum Explained/);
  await expect(page.getByRole('heading', { name: 'Two Sum', exact: true })).toBeVisible();
  await expect(page.locator('#page-structured-data')).toHaveCount(1);
  await page.getByRole('link', { name: 'Browse all problem explanations' }).click();
  await expect(page).toHaveTitle(/LeetCode Problem Explanations/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://lc-tracker.app/library/explanations');
});

test('sign-in and missing pages do not inherit indexable homepage metadata', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://lc-tracker.app/this-page-does-not-exist');
});

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 390]) {
    test(`explanation index is readable at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/library/explanations');
      await expect(page.getByRole('heading', { name: 'Problem explanations', exact: true })).toBeVisible();
      const search = page.getByRole('searchbox', { name: 'Find an explanation' });
      await search.fill('binary tree');
      await expect(page.locator('.explanation-directory-list a').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: testInfo.outputPath('explanation-index.png'), fullPage: true });
    });
  }
}
