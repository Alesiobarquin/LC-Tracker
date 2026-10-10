import { expect, test } from '@playwright/test';

test.describe('Challenger 1 - Milestone 1 Stress Verification', () => {

  test.describe('1. Dynamic Theme Transitions & Contrast Stress', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('T1.1: Rapid dynamic theme switching does not deadlock or desynchronize styles', async ({ page }) => {
      const themeSelect = page.locator('select[aria-label="Color theme"]').first();
      await expect(themeSelect).toBeVisible();

      // Cycle rapidly between light, dark, system, dark, light, dark, light
      const sequence = ['light', 'dark', 'system', 'dark', 'light', 'dark', 'light'];
      for (const targetTheme of sequence) {
        await themeSelect.selectOption(targetTheme);
        if (targetTheme === 'system') {
          await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'system');
        } else {
          await expect(page.locator('html')).toHaveAttribute('data-theme', targetTheme);
        }
      }

      // Verify that light theme displays light canvas background
      await themeSelect.selectOption('light');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      const lightMetrics = await page.evaluate(() => {
        const header = document.querySelector('header');
        const style = window.getComputedStyle(header!);
        const rootStyle = window.getComputedStyle(document.documentElement);
        return {
          headerBg: style.backgroundColor,
          paletteCanvas: rootStyle.getPropertyValue('--palette-canvas').trim(),
          colorScheme: rootStyle.colorScheme,
        };
      });

      // Verify dark theme displays distinct dark styling
      await themeSelect.selectOption('dark');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await page.waitForTimeout(300); // allow transition-colors to finish
      const darkMetrics = await page.evaluate(() => {
        const header = document.querySelector('header');
        const style = window.getComputedStyle(header!);
        const rootStyle = window.getComputedStyle(document.documentElement);
        return {
          headerBg: style.backgroundColor,
          paletteCanvas: rootStyle.getPropertyValue('--palette-canvas').trim(),
          colorScheme: rootStyle.colorScheme,
        };
      });

      console.log('Theme Metrics:', { lightMetrics, darkMetrics });
      expect(darkMetrics.paletteCanvas).toBe('#191b19');
      expect(lightMetrics.paletteCanvas).toBe('#f5f3ee');
      expect(darkMetrics.headerBg).not.toBe(lightMetrics.headerBg);

      // Verify critical typography remains legible and visible in dark mode
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
      const headingColor = await heading.evaluate((el) => window.getComputedStyle(el).color);
      expect(headingColor).toBeTruthy();

      // Verify hero badge pill and glass chassis adapt styles
      const badge = page.locator('.hero-badge-pill').first();
      await expect(badge).toBeVisible();
      const card = page.locator('figure[aria-labelledby="practice-loop-title"]');
      await expect(card).toBeVisible();
    });

    test('T1.2: Theme persistence across reloads and system preference emulation', async ({ page }) => {
      const themeSelect = page.locator('select[aria-label="Color theme"]').first();

      // Set dark theme and reload
      await themeSelect.selectOption('dark');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

      // Set system theme with dark OS emulation
      await page.emulateMedia({ colorScheme: 'dark' });
      await themeSelect.selectOption('system');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

      // Switch OS emulation to light
      await page.emulateMedia({ colorScheme: 'light' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    });
  });

  test.describe('2. Extreme Viewport Responsiveness & Layout Overflow', () => {
    const testWidths = [320, 375, 390, 768, 1440];

    for (const width of testWidths) {
      test(`T2: Viewport width ${width}px exhibits zero horizontal scroll overflow`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto('/');

        // Wait for hero to render
        await expect(page.locator('h1')).toBeVisible();

        // Check horizontal overflow on documentElement and body
        const overflowMetrics = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;
          return {
            docScrollWidth: doc.scrollWidth,
            bodyScrollWidth: body.scrollWidth,
            winWidth: window.innerWidth,
          };
        });

        expect(
          overflowMetrics.docScrollWidth,
          `Document scrollWidth (${overflowMetrics.docScrollWidth}px) exceeds viewport width (${width}px)`
        ).toBeLessThanOrEqual(width);

        expect(
          overflowMetrics.bodyScrollWidth,
          `Body scrollWidth (${overflowMetrics.bodyScrollWidth}px) exceeds viewport width (${width}px)`
        ).toBeLessThanOrEqual(width);

        // Verify PublicHeader is within viewport boundary
        const headerBox = await page.locator('header').boundingBox();
        expect(headerBox).toBeTruthy();
        expect(headerBox!.x + headerBox!.width).toBeLessThanOrEqual(width + 1);

        // At standard mobile (375px+), tablet, and desktop, verify AnimatedPracticeLoop fits without clipping
        if (width >= 375) {
          const practiceLoopBox = await page.locator('figure[aria-labelledby="practice-loop-title"]').boundingBox();
          expect(practiceLoopBox).toBeTruthy();
          expect(practiceLoopBox!.x + practiceLoopBox!.width).toBeLessThanOrEqual(width + 1);
        }
      });
    }

    test('T2.6: Inspection of Hero copy and badge bounding boxes at 320px', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto('/');

      await expect(page.locator('h1')).toBeVisible();

      // Measure bounding boxes of hero elements
      const badgeBox = await page.locator('.hero-badge-pill').first().boundingBox();
      const h1Box = await page.locator('h1').boundingBox();
      const heroCopyBox = await page.locator('.landing-introduction-copy').boundingBox();

      console.log('320px Bounding Boxes:', {
        badgeBox,
        h1Box,
        heroCopyBox,
      });

      // Assert badge is visible and clickable
      await expect(page.locator('.hero-badge-pill').first()).toBeVisible();
      // Assert H1 is visible
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('3. AnimatedPracticeLoop Rapid Interaction & Keyboard Stress', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('T3.1: Rapid hammering click transitions do not corrupt state or beam indicator', async ({ page }) => {
      const practiceLoop = page.locator('figure[aria-labelledby="practice-loop-title"]');
      await expect(practiceLoop).toBeVisible();

      const tab1 = practiceLoop.locator('#practice-loop-tab-01');
      const tab2 = practiceLoop.locator('#practice-loop-tab-02');
      const tab3 = practiceLoop.locator('#practice-loop-tab-03');

      await expect(tab1).toBeVisible();
      await expect(tab2).toBeVisible();
      await expect(tab3).toBeVisible();

      // Stress test: rapid random/oscillating clicks
      const clickOrder = [tab2, tab3, tab1, tab3, tab2, tab1, tab2, tab3, tab1, tab2];
      for (const tab of clickOrder) {
        await tab.click();
      }

      // After hammering, final clicked was tab2
      await expect(tab2).toHaveAttribute('aria-selected', 'true');
      await expect(tab1).toHaveAttribute('aria-selected', 'false');
      await expect(tab3).toHaveAttribute('aria-selected', 'false');

      // Verify that exactly ONE active beam indicator exists
      const beams = practiceLoop.locator('.luxury-step-beam');
      await expect(beams).toHaveCount(1);

      // Verify that card 2 contains protocol text
      await expect(tab2).toContainText('approach → code → test cases');

      // Verify that panel for tab2 is visible and contains detail points
      const panel2 = practiceLoop.locator('#practice-loop-panel-02');
      await expect(panel2).toBeVisible();
      await expect(panel2).toContainText('Write clean code under a timed block with zero assistance');

      // Verify panels 1 and 3 are not active/visible
      const panel1 = practiceLoop.locator('#practice-loop-panel-01');
      const panel3 = practiceLoop.locator('#practice-loop-panel-03');
      await expect(panel1).toHaveCount(0);
      await expect(panel3).toHaveCount(0);
    });

    test('T3.2: Keyboard navigation via Enter, Space, and Tab sequence', async ({ page }) => {
      const practiceLoop = page.locator('figure[aria-labelledby="practice-loop-title"]');
      await expect(practiceLoop).toBeVisible();

      const tab1 = practiceLoop.locator('#practice-loop-tab-01');
      const tab2 = practiceLoop.locator('#practice-loop-tab-02');
      const tab3 = practiceLoop.locator('#practice-loop-tab-03');

      // Focus tab3 and activate with Enter
      await tab3.focus();
      await page.keyboard.press('Enter');
      await expect(tab3).toHaveAttribute('aria-selected', 'true');
      await expect(practiceLoop.locator('#practice-loop-panel-03')).toBeVisible();

      // Focus tab1 and activate with Space
      await tab1.focus();
      await page.keyboard.press('Space');
      await expect(tab1).toHaveAttribute('aria-selected', 'true');
      await expect(practiceLoop.locator('#practice-loop-panel-01')).toBeVisible();

      // Focus tab2 and activate with Enter
      await tab2.focus();
      await page.keyboard.press('Enter');
      await expect(tab2).toHaveAttribute('aria-selected', 'true');
      await expect(practiceLoop.locator('#practice-loop-panel-02')).toBeVisible();
    });

    test('T3.3: AnimatedPracticeLoop at narrow 320px viewport with active expanded panels', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto('/');

      const practiceLoop = page.locator('figure[aria-labelledby="practice-loop-title"]');
      await expect(practiceLoop).toBeVisible();

      // Check step 1 expanded
      await practiceLoop.locator('#practice-loop-tab-01').click();
      let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(320);

      // Check step 2 expanded
      await practiceLoop.locator('#practice-loop-tab-02').click();
      scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(320);

      // Check step 3 expanded
      await practiceLoop.locator('#practice-loop-tab-03').click();
      scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(320);
    });
  });
});
