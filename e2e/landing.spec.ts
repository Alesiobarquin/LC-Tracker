import { expect, test } from '@playwright/test';

test('landing explains the planner and updates its sample from the goal', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Know what to practice next.' })).toBeVisible();
  await expect(page).toHaveTitle('LC Tracker | LeetCode Practice & Spaced Repetition');
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    await expect(page.locator(selector)).toHaveAttribute('content', 'Plan LeetCode practice with spaced repetition, recall checks, and coding sessions. Browse problem explanations, algorithm patterns, and Python or C++ syntax.');
  }
  await expect(page.getByRole('heading', { name: 'How the planner works' })).toBeVisible();
  await expect(page.getByText(/Example practice history/)).toBeVisible();
  await expect(page.locator('.landing-plan-task--recall')).toContainText('Two Sum');
  await expect(page.locator('.landing-plan-task--main')).toContainText('Top K Frequent Elements');
  const budget = page.getByRole('progressbar', { name: 'Time allocated' });
  await expect(budget).toHaveAttribute('aria-valuetext', '25 of 45 minutes planned');

  const timeline = page.getByRole('group', { name: 'Example interview timeline' });
  const shortTimeline = timeline.getByRole('radio', { name: 'In 3 weeks' });
  const longTimeline = timeline.getByRole('radio', { name: 'In 2 months' });
  await longTimeline.press('ArrowLeft');
  await expect(shortTimeline).toBeChecked();
  await expect(page.locator('.landing-plan-task--main')).toContainText('Two Sum');
  await expect(page.locator('.landing-plan-task--main')).toContainText('failed tests');
  await expect(budget).toHaveAttribute('aria-valuetext', '12 of 45 minutes planned');

  await shortTimeline.press('ArrowRight');
  await expect(longTimeline).toBeChecked();
  await expect(page.locator('.landing-plan-task--recall')).toContainText('Two Sum');
  await expect(page.locator('.landing-plan-task--main')).toContainText('Top K Frequent Elements');
  const exampleLink = page.getByRole('link', { name: 'Try the sample' });
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
  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(page.getByRole('heading', { name: 'Create your LC Tracker account' })).toBeVisible();
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in to LC Tracker' })).toBeVisible();
});

test('shared header takes utility pages to the landing story section', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1240 });
  for (const route of ['/login', '/privacy', '/terms']) {
    await page.goto(route);
    await expect(page.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '/#how-it-works');
  }

  await page.getByRole('link', { name: 'How it works' }).click();
  await expect(page).toHaveURL(/\/#how-it-works$/);
  await expect(page.getByRole('heading', { name: 'How the planner works' })).toBeInViewport();
  const method = page.locator('#how-it-works');
  await expect(method).toHaveCSS('opacity', '1');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(method).toHaveCSS('opacity', '0');
});

test('landing details fade in on scroll and fade out at the top', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1240 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  const method = page.getByRole('region', { name: 'How the planner works' });
  const references = page.getByRole('region', { name: 'Study without an account' });
  await expect(method).toHaveCSS('opacity', '0');
  await expect(references).toHaveCSS('opacity', '0');

  for (const section of [method, references]) {
    await section.evaluate(node => node.scrollIntoView({ block: 'center' }));
    await expect(section).toHaveCSS('opacity', '1');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(section).toHaveCSS('opacity', '0');
  }
});

test('the planner glow moves across the preview', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('#plan-preview')).toBeVisible();

  const distance = await page.evaluate(() => {
    const glow = document.querySelector('#plan-preview')!;
    const drift = document.getAnimations().find(animation =>
      animation instanceof CSSAnimation && animation.animationName === 'landing-glow-drift');
    if (!drift) return 0;
    drift.pause();
    drift.currentTime = 0;
    const start = new DOMMatrixReadOnly(getComputedStyle(glow, '::before').transform).m41;
    drift.currentTime = drift.effect!.getComputedTiming().duration as number;
    const end = new DOMMatrixReadOnly(getComputedStyle(glow, '::before').transform).m41;
    return end - start;
  });
  expect(distance).toBeGreaterThan(100);
});

test('landing controls remain usable on mobile in both themes and with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/');

  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme', 'dark');
  const previewAnimations = await page.locator('#plan-preview').evaluate(node =>
    ['::before', '::after'].map(pseudo => getComputedStyle(node, pseudo).animationName));
  expect(previewAnimations).toEqual(['none', 'none']);
  await expect(page.locator('#how-it-works')).toHaveCSS('opacity', '0');
  const darkSurface = await page.locator('.landing-plan-frame').evaluate(element => getComputedStyle(element).backgroundColor);

  const themeControl = page.getByRole('combobox', { name: 'Color theme' });
  await themeControl.selectOption('light');
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.landing-plan-frame')).not.toHaveCSS('background-color', darkSurface);

  const startLink = page.getByRole('link', { name: 'Build my study plan' }).first();
  const startBounds = await startLink.boundingBox();
  expect(startBounds?.height).toBeGreaterThanOrEqual(44);
  await expect(page.getByRole('group', { name: 'Example interview timeline' })).toBeInViewport();
  await page.getByText('3 weeks', { exact: true }).click();
  await expect(page.locator('.landing-plan-task--main')).toContainText('Two Sum');
  for (const width of [1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const layout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll('body *')].filter(node => node.getBoundingClientRect().right > window.innerWidth)
        .map(node => [node.tagName, node.getAttribute('class'), node.getBoundingClientRect().right]).slice(0, 12),
    }));
    expect(layout.width, JSON.stringify(layout.overflow)).toBeLessThanOrEqual(width);
  }

  const mobileMenu = page.getByRole('button', { name: 'Browse site' });
  await mobileMenu.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'How it works' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(mobileMenu).toBeFocused();
  await mobileMenu.click();
  await page.getByRole('menuitem', { name: 'How it works' }).click();
  await expect(page.getByRole('heading', { name: 'How the planner works' })).toBeInViewport();
  await expect(page.locator('#how-it-works')).toHaveCSS('opacity', '1');
  await mobileMenu.click();
  await page.getByRole('menuitem', { name: 'Library' }).click();
  await expect(page).toHaveURL(/\/library$/);
});
