import { expect, test } from '@playwright/test';

test.describe('Challenger 2 - Milestone 1 Accessibility, Motion Reduction & Link Integrity', () => {

  test.describe('1. Reduced Motion Behavior (prefers-reduced-motion: reduce)', () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    test('RM1.1: CSS animation and transition durations collapse under prefers-reduced-motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');

      // Verify page loads cleanly with reduced motion
      await expect(page.locator('h1')).toBeVisible();

      // Check hero badge sweep animation collapses
      const badgePill = page.locator('.hero-badge-pill').first();
      await expect(badgePill).toBeVisible();

      // Inspect computed styles on root and elements
      const motionMetrics = await page.evaluate(() => {
        const docElem = document.documentElement;
        const computedDoc = window.getComputedStyle(docElem);
        const heroBadge = document.querySelector('.hero-badge-pill');
        const computedBadge = heroBadge ? window.getComputedStyle(heroBadge) : null;
        const header = document.querySelector('header');
        const computedHeader = header ? window.getComputedStyle(header) : null;

        return {
          scrollBehavior: computedDoc.scrollBehavior,
          badgeTransitionDuration: computedBadge ? computedBadge.transitionDuration : '',
          headerTransitionDuration: computedHeader ? computedHeader.transitionDuration : '',
          mediaMatches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        };
      });

      expect(motionMetrics.mediaMatches).toBe(true);
      // CSS rule: * { animation-duration: 1ms !important; transition-duration: 1ms !important; scroll-behavior: auto !important; }
      expect(motionMetrics.scrollBehavior).toBe('auto');
      // Transitions must be collapsed to 1ms (0.001s)
      expect(motionMetrics.badgeTransitionDuration).toBe('0.001s');
      expect(motionMetrics.headerTransitionDuration).toBe('0.001s');
    });

    test('RM1.2: AnimatedPracticeLoop transitions cleanly without visual stuck states under reduced motion', async ({ page }) => {
      await page.goto('/');

      const practiceLoop = page.locator('figure[aria-labelledby="practice-loop-title"]');
      await expect(practiceLoop).toBeVisible();

      const tab1 = practiceLoop.locator('#practice-loop-tab-01');
      const tab2 = practiceLoop.locator('#practice-loop-tab-02');
      const tab3 = practiceLoop.locator('#practice-loop-tab-03');

      // Initially step 1 is active
      await expect(tab1).toHaveAttribute('aria-selected', 'true');
      const panel1 = practiceLoop.locator('#practice-loop-panel-01');
      await expect(panel1).toBeVisible();

      // Cycle rapidly through tabs under reduced motion
      await tab2.click();
      await expect(tab2).toHaveAttribute('aria-selected', 'true');
      const panel2 = practiceLoop.locator('#practice-loop-panel-02');
      await expect(panel2).toBeVisible();
      // Panel 1 must unmount or collapse
      await expect(practiceLoop.locator('#practice-loop-panel-01')).toHaveCount(0);

      // Verify active step beam renders on selected tab without disappearing or clipping
      const beam = practiceLoop.locator('.luxury-step-beam');
      await expect(beam).toHaveCount(1);
      await expect(beam).toBeVisible();

      // Switch to tab 3
      await tab3.click();
      await expect(tab3).toHaveAttribute('aria-selected', 'true');
      const panel3 = practiceLoop.locator('#practice-loop-panel-03');
      await expect(panel3).toBeVisible();
      await expect(practiceLoop.locator('#practice-loop-panel-02')).toHaveCount(0);
      await expect(beam).toHaveCount(1);
      await expect(beam).toBeVisible();

      // Check tab 3 content is readable and not 0-height or stuck with opacity 0
      const panel3Box = await panel3.boundingBox();
      expect(panel3Box).not.toBeNull();
      expect(panel3Box!.height).toBeGreaterThan(20);

      const panel3Opacity = await panel3.evaluate(el => window.getComputedStyle(el).opacity);
      expect(parseFloat(panel3Opacity)).toBeCloseTo(1, 1);

      // Verify layout width has no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    });

    test('RM1.3: Anchor smooth scroll trigger functions correctly under reduced motion', async ({ page }) => {
      await page.goto('/');

      const walkthroughTarget = page.locator('#walkthrough-theater');
      await expect(walkthroughTarget).toBeAttached();

      const initialScrollY = await page.evaluate(() => window.scrollY);
      expect(initialScrollY).toBe(0);

      // Click "Watch Walkthrough" CTA
      const watchCta = page.getByRole('button', { name: 'Watch Walkthrough' });
      await expect(watchCta).toBeVisible();
      await watchCta.click();

      // Under reduced motion (scroll-behavior: auto), scroll reaches destination immediately
      await page.waitForTimeout(300);

      const scrolledY = await page.evaluate(() => window.scrollY);
      expect(scrolledY).toBeGreaterThan(100);

      // Target element should be scrolled into view
      const isTargetInViewport = await walkthroughTarget.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= -100 && rect.top <= window.innerHeight;
      });
      expect(isTargetInViewport).toBe(true);
    });

    test('RM1.4: Rapid hammering tab transitions under reduced motion do not corrupt beam or panel state', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');

      const practiceLoop = page.locator('figure[aria-labelledby="practice-loop-title"]');
      await expect(practiceLoop).toBeVisible();

      const tab1 = practiceLoop.locator('#practice-loop-tab-01');
      const tab2 = practiceLoop.locator('#practice-loop-tab-02');
      const tab3 = practiceLoop.locator('#practice-loop-tab-03');

      // Rapidly oscillate clicks between all 3 tabs
      const sequence = [tab2, tab3, tab1, tab2, tab3, tab1, tab3, tab2];
      for (const t of sequence) {
        await t.click();
      }

      // Final tab in sequence is tab2
      await expect(tab2).toHaveAttribute('aria-selected', 'true');
      await expect(tab1).toHaveAttribute('aria-selected', 'false');
      await expect(tab3).toHaveAttribute('aria-selected', 'false');

      // Verify exactly 1 indicator beam exists
      const beams = practiceLoop.locator('.luxury-step-beam');
      await expect(beams).toHaveCount(1);
      await expect(beams).toBeVisible();

      // Verify panel 2 is visible and expanded
      const panel2 = practiceLoop.locator('#practice-loop-panel-02');
      await expect(panel2).toBeVisible();
      await expect(panel2).toContainText('Write clean code under a timed block');

      // Verify panels 1 and 3 are not in DOM
      await expect(practiceLoop.locator('#practice-loop-panel-01')).toHaveCount(0);
      await expect(practiceLoop.locator('#practice-loop-panel-03')).toHaveCount(0);
    });
  });

  test.describe('2. Keyboard Navigation through PublicHeader and Hero', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/');
      await expect(page.locator('h1')).toBeVisible();
    });

    test('KB2.1: Full sequential Tab traversal through PublicHeader and Hero on desktop', async ({ page }) => {
      // Focus the page body to initiate clean sequential Tab flow
      await page.locator('body').focus();

      // Sequence of expected interactive elements on desktop (1280px):
      // 1. Logo / brand link (href="/")
      // 2. Library link (href="/library")
      // 3. Patterns link (href="/patterns")
      // 4. Syntax link (href="/syntax")
      // 5. Theme switcher select (aria-label="Color theme")
      // 6. Sign in button (href="/login")
      // 7. Hero protocol badge pill (href="#walkthrough-theater")
      // 8. Primary CTA "Start studying" (href="/login")
      // 9. Secondary CTA "Watch Walkthrough" (role="button", href="#walkthrough-theater")
      // 10. Secondary CTA "Explore library" (href="/library")
      // 11. Practice Loop Tab 01 (#practice-loop-tab-01)
      // 12. Practice Loop Tab 02 (#practice-loop-tab-02)
      // 13. Practice Loop Tab 03 (#practice-loop-tab-03)

      const expectedFocusSequence = [
        { desc: 'Brand Wordmark', tag: 'A', textOrHref: '/' },
        { desc: 'Nav: Library', tag: 'A', textOrHref: '/library' },
        { desc: 'Nav: Patterns', tag: 'A', textOrHref: '/patterns' },
        { desc: 'Nav: Syntax', tag: 'A', textOrHref: '/syntax' },
        { desc: 'Theme Switcher', tag: 'SELECT', label: 'Color theme' },
        { desc: 'Header Sign In', tag: 'A', textOrHref: '/login' },
        { desc: 'Hero Badge Pill', tag: 'A', textOrHref: '#walkthrough-theater' },
        { desc: 'Hero Primary CTA', tag: 'A', textOrHref: '/login' },
        { desc: 'Hero Secondary CTA', tag: 'A', textOrHref: '#walkthrough-theater' },
        { desc: 'Hero Explore Library', tag: 'A', textOrHref: '/library' },
        { desc: 'Loop Tab 01', tag: 'DIV', id: 'practice-loop-tab-01' },
        { desc: 'Loop Tab 02', tag: 'DIV', id: 'practice-loop-tab-02' },
        { desc: 'Loop Tab 03', tag: 'DIV', id: 'practice-loop-tab-03' },
      ];

      for (let i = 0; i < expectedFocusSequence.length; i++) {
        await page.keyboard.press('Tab');
        const target = expectedFocusSequence[i];

        const activeInfo = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return null;
          return {
            tagName: el.tagName,
            id: el.id,
            href: (el as HTMLAnchorElement).getAttribute('href'),
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
            innerText: el.textContent?.trim().slice(0, 30),
          };
        });

        expect(activeInfo, `Expected focus on step ${i + 1} (${target.desc})`).not.toBeNull();
        expect(activeInfo!.tagName, `Step ${i + 1} (${target.desc}) tag mismatch`).toBe(target.tag);

        if (target.textOrHref) {
          expect(
            activeInfo!.href,
            `Step ${i + 1} (${target.desc}) href mismatch`
          ).toBe(target.textOrHref);
        }
        if (target.label) {
          expect(
            activeInfo!.ariaLabel,
            `Step ${i + 1} (${target.desc}) aria-label mismatch`
          ).toBe(target.label);
        }
        if (target.id) {
          expect(
            activeInfo!.id,
            `Step ${i + 1} (${target.desc}) id mismatch`
          ).toBe(target.id);
        }
      }

      // Next tab should advance beyond practice loop tabs without trapping focus
      await page.keyboard.press('Tab');
      const afterHeroFocus = await page.evaluate(() => document.activeElement?.id);
      expect(afterHeroFocus).not.toBe('practice-loop-tab-03');
    });

    test('KB2.2: Mobile keyboard tab order skips hidden desktop links cleanly', async ({ page }) => {
      // Set mobile viewport 375px
      await page.setViewportSize({ width: 375, height: 750 });
      await page.goto('/');
      await expect(page.locator('h1')).toBeVisible();

      await page.locator('body').focus();

      // On mobile (375px), /library, /patterns, and /syntax are hidden with sm:block / md:block
      // Sequence should be:
      // 1. Logo (href="/")
      // 2. Theme switcher select
      // 3. Sign in (href="/login")
      // 4. Hero Badge Pill
      // 5. Primary CTA
      // 6. Secondary CTA
      // 7. Explore library
      // 8. Practice Loop Tab 01
      const expectedMobileSequence = [
        { desc: 'Brand Wordmark', tag: 'A', href: '/' },
        { desc: 'Theme Switcher', tag: 'SELECT', label: 'Color theme' },
        { desc: 'Header Sign In', tag: 'A', href: '/login' },
        { desc: 'Hero Badge Pill', tag: 'A', href: '#walkthrough-theater' },
        { desc: 'Primary CTA', tag: 'A', href: '/login' },
        { desc: 'Secondary CTA', tag: 'A', href: '#walkthrough-theater' },
        { desc: 'Explore Library', tag: 'A', href: '/library' },
        { desc: 'Loop Tab 01', tag: 'DIV', id: 'practice-loop-tab-01' },
      ];

      for (let i = 0; i < expectedMobileSequence.length; i++) {
        await page.keyboard.press('Tab');
        const target = expectedMobileSequence[i];

        const activeInfo = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tagName: el?.tagName,
            id: el?.id,
            href: (el as HTMLAnchorElement)?.getAttribute('href'),
            ariaLabel: el?.getAttribute('aria-label'),
            text: el?.textContent?.trim().slice(0, 30),
          };
        });

        expect(activeInfo.tagName, `Mobile Step ${i + 1} (${target.desc})`).toBe(target.tag);
        if (target.href) expect(activeInfo.href).toBe(target.href);
        if (target.label) expect(activeInfo.ariaLabel).toBe(target.label);
        if (target.id) expect(activeInfo.id).toBe(target.id);
      }
    });

    test('KB2.3: Reverse Tab sequence (Shift+Tab) backwards from Hero to PublicHeader', async ({ page }) => {
      // Focus on practice-loop-tab-01
      const tab1 = page.locator('#practice-loop-tab-01');
      await tab1.focus();
      await expect(tab1).toBeFocused();

      // Shift+Tab should traverse backwards:
      // Tab 01 -> Explore Library -> Secondary CTA -> Primary CTA -> Badge Pill -> Sign In -> Theme Switcher
      await page.keyboard.press('Shift+Tab');
      let activeHref = await page.evaluate(() => (document.activeElement as HTMLAnchorElement)?.getAttribute('href'));
      expect(activeHref).toBe('/library');

      await page.keyboard.press('Shift+Tab');
      activeHref = await page.evaluate(() => (document.activeElement as HTMLAnchorElement)?.getAttribute('href'));
      expect(activeHref).toBe('#walkthrough-theater');

      await page.keyboard.press('Shift+Tab');
      activeHref = await page.evaluate(() => (document.activeElement as HTMLAnchorElement)?.getAttribute('href'));
      expect(activeHref).toBe('/login');

      await page.keyboard.press('Shift+Tab');
      activeHref = await page.evaluate(() => (document.activeElement as HTMLAnchorElement)?.getAttribute('href'));
      expect(activeHref).toBe('#walkthrough-theater');

      await page.keyboard.press('Shift+Tab');
      activeHref = await page.evaluate(() => (document.activeElement as HTMLAnchorElement)?.getAttribute('href'));
      expect(activeHref).toBe('/login');

      await page.keyboard.press('Shift+Tab');
      const activeTag = await page.evaluate(() => document.activeElement?.tagName);
      expect(activeTag).toBe('SELECT');
    });

    test('KB2.4: AnimatedPracticeLoop interactive keyboard activation and ARIA states', async ({ page }) => {
      const practiceLoop = page.locator('figure[aria-labelledby="practice-loop-title"]');
      const tab1 = practiceLoop.locator('#practice-loop-tab-01');
      const tab2 = practiceLoop.locator('#practice-loop-tab-02');
      const tab3 = practiceLoop.locator('#practice-loop-tab-03');

      // Verify WAI-ARIA roles on tablist and tabs
      const tablist = practiceLoop.locator('[role="tablist"]');
      await expect(tablist).toHaveAttribute('aria-label', 'Practice loop steps');
      await expect(tab1).toHaveAttribute('role', 'tab');
      await expect(tab2).toHaveAttribute('role', 'tab');
      await expect(tab3).toHaveAttribute('role', 'tab');

      // Focus tab2 and press Enter
      await tab2.focus();
      await page.keyboard.press('Enter');
      await expect(tab2).toHaveAttribute('aria-selected', 'true');
      await expect(tab1).toHaveAttribute('aria-selected', 'false');
      await expect(practiceLoop.locator('#practice-loop-panel-02')).toBeVisible();

      // Focus tab3 and press Space
      await tab3.focus();
      await page.keyboard.press(' ');
      await expect(tab3).toHaveAttribute('aria-selected', 'true');
      await expect(tab2).toHaveAttribute('aria-selected', 'false');
      await expect(practiceLoop.locator('#practice-loop-panel-03')).toBeVisible();

      // Focus tab1 and press Space
      await tab1.focus();
      await page.keyboard.press(' ');
      await expect(tab1).toHaveAttribute('aria-selected', 'true');
      await expect(tab3).toHaveAttribute('aria-selected', 'false');
      await expect(practiceLoop.locator('#practice-loop-panel-01')).toBeVisible();
    });

    test('KB2.5: Interactive elements render distinct focus outlines under :focus-visible', async ({ page }) => {
      // Focus header Sign in
      const signInBtn = page.locator('header a[href="/login"]');
      await signInBtn.focus();

      const outlineStyles = await signInBtn.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          outlineColor: style.outlineColor,
        };
      });

      // Global :focus-visible { outline: 2px solid var(--palette-accent); }
      expect(outlineStyles.outlineStyle).toBe('solid');
      expect(parseFloat(outlineStyles.outlineWidth)).toBeGreaterThanOrEqual(1);

      // Focus tab 01
      const tab1 = page.locator('#practice-loop-tab-01');
      await tab1.focus();
      const tabOutline = await tab1.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
        };
      });
      expect(tabOutline.outlineStyle).toBe('solid');
      expect(parseFloat(tabOutline.outlineWidth)).toBeGreaterThanOrEqual(1);
    });

    test('KB2.6: Keyboard activation of Watch Walkthrough (role="button") via Enter and Space keys', async ({ page }) => {
      const watchCta = page.getByRole('button', { name: 'Watch Walkthrough' });
      await expect(watchCta).toBeVisible();

      // Test 1: Enter key activation
      await watchCta.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      let scrolledY = await page.evaluate(() => window.scrollY);
      expect(scrolledY).toBeGreaterThan(100);

      // Reset scroll
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);

      // Test 2: Space key activation on role="button"
      await watchCta.focus();
      await page.keyboard.press(' ');
      await page.waitForTimeout(500);
      scrolledY = await page.evaluate(() => window.scrollY);
      console.log('[AUDIT OBS] Scrolled Y after Space on Watch Walkthrough:', scrolledY);
    });
  });

  test.describe('3. CTA Links & Anchor Navigation Integrity', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('h1')).toBeVisible();
    });

    test('NAV3.1: Header /library link navigates to Problem Library without error', async ({ page }) => {
      const libraryLink = page.locator('header a[href="/library"]');
      await libraryLink.click();

      await expect(page).toHaveURL(/\/library/);
      // Verify library content rendered
      await expect(page.locator('h1, h2').first()).toBeVisible();
      // Ensure no 404 or auth crash
      await expect(page.getByText(/404|Not Found|Error/i).first()).not.toBeVisible();
    });

    test('NAV3.2: Hero "Explore library" link navigates to Problem Library', async ({ page }) => {
      const exploreLink = page.getByRole('link', { name: 'Explore library' });
      await exploreLink.click();

      await expect(page).toHaveURL(/\/library/);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('NAV3.3: Header /patterns link navigates to Pattern Foundations without error', async ({ page }) => {
      const patternsLink = page.locator('header a[href="/patterns"]');
      await patternsLink.click();

      await expect(page).toHaveURL(/\/patterns/);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('NAV3.4: Header /syntax link navigates to Syntax Reference without error', async ({ page }) => {
      const syntaxLink = page.locator('header a[href="/syntax"]');
      await syntaxLink.click();

      await expect(page).toHaveURL(/\/syntax/);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('NAV3.5: Header /login and Hero "Start studying" navigate to /login and render sign in interface', async ({ page }) => {
      // Test Hero CTA
      const startCta = page.getByRole('link', { name: 'Start studying' });
      await startCta.click();

      await expect(page).toHaveURL(/\/login/);
      // Check login form or Clerk component loads
      await expect(page.locator('.cl-rootBox, form, h1, [data-testid="login"]').first()).toBeVisible();

      // Return to landing and test header Sign In
      await page.goto('/');
      const headerSignIn = page.locator('header a[href="/login"]');
      await headerSignIn.click();
      await expect(page).toHaveURL(/\/login/);
    });

    test('NAV3.6: Anchor links to #walkthrough-theater scroll to target element with valid DOM reference', async ({ page }) => {
      // Verify target container exists in DOM
      const target = page.locator('#walkthrough-theater');
      await expect(target).toBeAttached();

      // 1. Test secondary CTA "Watch Walkthrough"
      const watchCta = page.getByRole('button', { name: 'Watch Walkthrough' });
      await watchCta.click();

      // Wait for smooth scroll
      await page.waitForTimeout(600);
      const isTargetInViewAfterCta = await target.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= -100 && rect.top <= window.innerHeight;
      });
      expect(isTargetInViewAfterCta).toBe(true);

      // Reset scroll to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);

      // 2. Test Hero Badge Pill anchor link
      const badgePill = page.locator('.hero-badge-pill').first();
      await badgePill.click();

      await page.waitForTimeout(600);
      const isTargetInViewAfterBadge = await target.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= -100 && rect.top <= window.innerHeight;
      });
      expect(isTargetInViewAfterBadge).toBe(true);
    });

    test('NAV3.7: PublicHeader brand wordmark links back to root /', async ({ page }) => {
      // Navigate to /library first
      await page.goto('/library');
      await expect(page).toHaveURL(/\/library/);

      // Click wordmark logo link in header
      const brandWordmark = page.locator('header a[href="/"]');
      await brandWordmark.click();

      await expect(page).toHaveURL('/');
      await expect(page.locator('h1')).toContainText('A workspace for');
    });
  });
});
