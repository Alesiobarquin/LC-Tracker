import { expect, test } from '@playwright/test';

test.describe('Tier 1: Feature Coverage (Isolation & Component Unit Integrations)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('F1 & F3: Hero section typography, luxury badge, and interactive practice loop', async ({ page }) => {
    // Verify H1 preserves key contractual text for interview preparation
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('A workspace for');
    await expect(heading).toContainText(/LeetCode/i);

    // Verify bespoke protocol badge
    const heroBadge = page.locator('.hero-badge-pill').first();
    await expect(heroBadge).toBeVisible();
    await expect(heroBadge).toContainText('Protocol');
    await expect(heroBadge).toContainText('Cognitive spaced retrieval for LeetCode');

    // Verify primary hero CTAs
    const startStudyingCta = page.getByRole('link', { name: 'Start studying' });
    await expect(startStudyingCta).toBeVisible();
    await expect(startStudyingCta).toHaveAttribute('href', '/login');

    const watchWalkthroughCta = page.locator('a, button').filter({ hasText: 'Watch Walkthrough' }).first();
    await expect(watchWalkthroughCta).toBeVisible();

    const exploreLibraryCta = page.getByRole('link', { name: 'Explore library' });
    await expect(exploreLibraryCta).toBeVisible();
    await expect(exploreLibraryCta).toHaveAttribute('href', '/library');

    // Verify trust markers
    await expect(page.getByText('150+ problems', { exact: true })).toBeVisible();
    await expect(page.getByText('Dual-check', { exact: true })).toBeVisible();
    await expect(page.getByText('100% exportable', { exact: true })).toBeVisible();

    // Verify Animated Practice Loop (F3) interactive step selection
    const practiceLoop = page.locator('figure[aria-labelledby="practice-loop-title"]');
    await expect(practiceLoop).toBeVisible();
    await expect(practiceLoop.locator('#practice-loop-title')).toHaveText('The Deliberate Practice Loop');

    // Step 01 (Recall) is active by default
    await expect(practiceLoop.getByText('Recall the approach')).toBeVisible();

    // Click Step 02 (Implement independently) to activate and expand protocol details
    const step2Card = practiceLoop.getByText('Implement independently');
    await step2Card.click();
    await expect(practiceLoop.getByText('approach → code → test cases')).toBeVisible();
    await expect(practiceLoop.getByText('Write clean code under a timed block with zero assistance.')).toBeVisible();

    // Click Step 03 (Try an unseen variation)
    const step3Card = practiceLoop.getByText('Try an unseen variation');
    await step3Card.click();
    await expect(practiceLoop.getByText('Tag-blind practice: problems presented without category tags')).toBeVisible();
  });

  test('F2: Public navigation bar, wordmark, route links, and accessible theme switcher', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Site' });
    await expect(nav).toBeVisible();

    // Brand wordmark
    const wordmark = nav.locator('a.workspace-wordmark');
    await expect(wordmark).toBeVisible();
    await expect(wordmark).toContainText('LC Tracker');
    await expect(wordmark).toHaveAttribute('href', '/');

    // Navigation links
    await expect(nav.getByRole('link', { name: 'Library' })).toHaveAttribute('href', '/library');
    await expect(nav.getByRole('link', { name: 'Patterns' })).toHaveAttribute('href', '/patterns');
    await expect(nav.getByRole('link', { name: 'Syntax' })).toHaveAttribute('href', '/syntax');
    await expect(nav.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');

    // Theme selector
    const themeSelector = nav.locator('select[aria-label="Color theme"]');
    await expect(themeSelector).toBeVisible();
    const options = themeSelector.locator('option');
    await expect(options).toHaveCount(3);
    await expect(themeSelector.locator('option[value="system"]')).toHaveText('System');
    await expect(themeSelector.locator('option[value="light"]')).toHaveText('Light');
    await expect(themeSelector.locator('option[value="dark"]')).toHaveText('Dark');
  });

  test('F4: Walkthrough Scene 1 - Daily Study Planner & Budget Presets', async ({ page }) => {
    const theater = page.locator('#walkthrough-theater');
    await expect(theater).toBeVisible();

    // Step 1 tab should be present
    const tab1 = theater.getByRole('button', { name: /01 · Daily Plan/i });
    await tab1.click();

    // Verify Scene 1 header and contents
    await expect(theater.getByText('Today’s study plan')).toBeVisible();
    await expect(theater.getByRole('heading', { name: 'Today’s sequence', exact: true })).toBeVisible();
    await expect(theater.getByText('146. LRU Cache')).toBeVisible();
    await expect(theater.getByText('Recall warm-up · up next')).toBeVisible();

    // Test budget preset switching
    const preset30 = theater.getByRole('button', { name: '30m budget' });
    const preset60 = theater.getByRole('button', { name: '60m budget' });

    await preset60.click();
    await expect(theater.getByText('60 min planned')).toBeVisible();
    await expect(theater.locator('.register-value').filter({ hasText: '60' })).toBeVisible();

    await preset30.click();
    await expect(theater.getByText('30 min planned')).toBeVisible();
    await expect(theater.locator('.register-value').filter({ hasText: '30' })).toBeVisible();
  });

  test('F5: Walkthrough Scene 2 - Active Recall Protocol & Reference Verification', async ({ page }) => {
    const theater = page.locator('#walkthrough-theater');
    const tab2 = theater.getByRole('button', { name: /02 · Retrieval/i });
    await tab2.click();

    // Verify Scene 2 problem details
    await expect(theater.getByText('01 / Recall before looking')).toBeVisible();
    await expect(theater.getByText('Search in Rotated Sorted Array')).toBeVisible();
    await expect(theater.getByText('Check your reasoning')).toBeVisible();

    // Verify interactive attempt notebook
    const textarea = theater.locator('textarea#recall-answer-sim');
    await expect(textarea).toBeVisible();
    await textarea.fill('Binary search partition invariant: check if nums[left] <= nums[mid].');

    // Click "Compare with a reference" to reveal invariant
    const compareBtn = theater.getByRole('button', { name: 'Compare with a reference' });
    await expect(compareBtn).toBeVisible();
    await compareBtn.click();

    // Reference invariant should be visible
    await expect(theater.getByText('Verified Invariant')).toBeVisible();
    await expect(theater.locator('p').filter({ hasText: 'guarantees the left half is sorted' })).toBeVisible();

    // Memory rating buttons
    const recalledBtn = theater.getByRole('button', { name: 'Recalled without reference' });
    const hintsBtn = theater.getByRole('button', { name: 'Needed hints' });
    const forgotBtn = theater.getByRole('button', { name: 'Did not recall' });

    await expect(recalledBtn).toBeVisible();
    await expect(hintsBtn).toBeVisible();
    await expect(forgotBtn).toBeVisible();

    // Click recall rating and verify feedback message
    await recalledBtn.click();
    await expect(theater.getByText('Approach recorded. Your independent coding verification remains separate.')).toBeVisible();
  });

  test('F6: Walkthrough Scene 3 - Coding Arena, Language Tabs & Test Runner', async ({ page }) => {
    const theater = page.locator('#walkthrough-theater');
    const tab3 = theater.getByRole('button', { name: /03 · Practice/i });
    await tab3.click();

    // Verify Scene 3 problem
    await expect(theater.getByText('Trapping Rain Water')).toBeVisible();
    await expect(theater.getByText('LeetCode 42')).toBeVisible();
    await expect(theater.locator('.timer-display')).toContainText('22');

    // Language switcher tabs
    const pyTab = theater.getByRole('button', { name: 'python', exact: true });
    const cppTab = theater.getByRole('button', { name: 'cpp', exact: true });
    const tsTab = theater.getByRole('button', { name: 'ts', exact: true });

    await expect(pyTab).toBeVisible();
    await cppTab.click();
    await expect(theater.locator('pre')).toContainText('int trap(vector<int>& h)');

    await tsTab.click();
    await expect(theater.locator('pre')).toContainText('function trap(height: number[])');

    await pyTab.click();
    await expect(theater.locator('pre')).toContainText('def trap(self, height: list[int])');

    // Test execution runner
    const runTestsBtn = theater.getByRole('button', { name: 'Run Test Suite' });
    await runTestsBtn.click();
    // After execution finishes, it should show 48 passed
    await expect(theater.getByText('All 48 Tests Passed')).toBeVisible({ timeout: 5000 });

    // Outcome recording phase
    const doneBtn = theater.getByRole('button', { name: /I’m Done · Record Outcome/i });
    await doneBtn.click();

    await expect(theater.getByText('02 / Record the outcome')).toBeVisible();
    await expect(theater.getByText('How did Trapping Rain Water go?')).toBeVisible();

    // 4 Outcome options
    await expect(theater.getByText('Solved independently')).toBeVisible();
    await expect(theater.getByText('Passed with help or gaps')).toBeVisible();
    await expect(theater.getByText('Not finished')).toBeVisible();
    await expect(theater.getByText('Tests failed')).toBeVisible();

    // Click independent outcome
    await theater.getByRole('button', { name: /Solved independently/i }).click();
  });

  test('F7: Walkthrough Scene 4 - Learning Evidence Telemetry & Retention Triad', async ({ page }) => {
    const theater = page.locator('#walkthrough-theater');
    const tab4 = theater.getByRole('button', { name: /04 · Evidence/i });
    await tab4.click();

    // Verify telemetry headers and minutes
    await expect(theater.getByText('Learning evidence')).toBeVisible();
    await expect(theater.getByText('Last 14 days · Verified Telemetry')).toBeVisible();
    await expect(theater.locator('.evidence-time-value')).toContainText('385');

    // 14-day study minutes chart
    const chartBars = theater.locator('.study-chart > div');
    await expect(chartBars).toHaveCount(14);

    // R/C/V evidence triad
    await expect(theater.getByText('Recall checks')).toBeVisible();
    await expect(theater.getByText('88%')).toBeVisible();

    await expect(theater.getByText('Delayed coding')).toBeVisible();
    await expect(theater.getByText('81%')).toBeVisible();

    await expect(theater.getByText('Unseen variations')).toBeVisible();
    await expect(theater.getByText('76%')).toBeVisible();
  });

  test('F8: Walkthrough Playback Controls & Dual-Mode Sandbox', async ({ page }) => {
    const theater = page.locator('#walkthrough-theater');

    // Play/Pause button
    const playPauseBtn = theater.locator('button[aria-label="Pause walkthrough"], button[aria-label="Play walkthrough"]');
    await expect(playPauseBtn).toBeVisible();
    const initialLabel = await playPauseBtn.getAttribute('aria-label');

    await playPauseBtn.click();
    const updatedLabel = await playPauseBtn.getAttribute('aria-label');
    expect(updatedLabel).not.toBe(initialLabel);

    // Tour restart button
    const restartBtn = theater.locator('button[aria-label="Restart tour"]');
    await expect(restartBtn).toBeVisible();
    await restartBtn.click();
    // After restart, active route shows dashboard
    await expect(theater.getByText('app.lctracker.dev/dashboard')).toBeVisible();

    // Audio mute button
    const audioBtn = theater.locator('button[aria-label="Audio commentary is muted"], button[aria-label="Audio enabled"]');
    await expect(audioBtn).toBeVisible();
    await audioBtn.click();

    // Sandbox active toggle
    const sandboxBtn = theater.getByRole('button', { name: /Interactive Mode|Sandbox Active/i });
    if (await sandboxBtn.isVisible()) {
      await sandboxBtn.click();
    }
  });

  test('F9: Interactive Study Budget Simulator calculates velocity dynamically', async ({ page }) => {
    const simulator = page.locator('text=Calculate Your Deliberate Practice Sequence').locator('xpath=ancestor::div[contains(@class, "rounded-card")]').first();
    await expect(simulator).toBeVisible();

    const dailySlider = simulator.locator('input#daily-budget-range');
    const weeksSlider = simulator.locator('input#weeks-runway-range');

    await expect(dailySlider).toBeVisible();
    await expect(weeksSlider).toBeVisible();

    // Test preset buttons
    const leanBtn = simulator.getByRole('button', { name: '30m Lean' });
    const standardBtn = simulator.getByRole('button', { name: '45m Standard' });
    const intensiveBtn = simulator.getByRole('button', { name: '60m Intensive' });

    await leanBtn.click();
    await expect(simulator.getByText('30 min / day')).toBeVisible();

    await intensiveBtn.click();
    await expect(simulator.getByText('60 min / day')).toBeVisible();

    await standardBtn.click();
    await expect(simulator.getByText('45 min / day')).toBeVisible();

    // Adjust daily slider to 60
    await dailySlider.fill('60');
    await dailySlider.dispatchEvent('change');
    await expect(simulator.getByText('60 min / day')).toBeVisible();

    // Adjust weeks slider to 10
    await weeksSlider.fill('10');
    await weeksSlider.dispatchEvent('change');
    await expect(simulator.getByText('10 weeks')).toBeVisible();

    // Verify calculated outputs:
    // With 60m daily, 10 weeks: totalDays = 60, totalHours = Math.round((60 * 60) / 60) = 60 hrs
    await expect(simulator.getByText('60 hrs')).toBeVisible();

    // CTA link inside simulator
    const startPlanLink = simulator.getByRole('link', { name: /Start This Plan/i });
    await expect(startPlanLink).toBeVisible();
    await expect(startPlanLink).toHaveAttribute('href', '/login');
  });

  test('F10: Luxury Feature Grid & Methodology Comparison Matrix', async ({ page }) => {
    // Feature Grid
    await expect(page.getByText('Built for Engineers Who Reject Rote Memorization')).toBeVisible();

    const expectedFeatures = [
      'Cognitive Spaced Retrieval',
      'Bounded Daily Sequences',
      'Dual-Evidence Protocol',
      'Syntax Vault & Pattern Foundations',
      '100% Exportable & Private',
      'Rest-Day & Blackout Awareness',
    ];

    for (const title of expectedFeatures) {
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    }

    // Verify link to Syntax Vault
    const syntaxLink = page.getByRole('link', { name: /Explore Syntax Vault/i });
    await expect(syntaxLink).toBeVisible();
    await expect(syntaxLink).toHaveAttribute('href', '/syntax');

    // Comparison Matrix
    await expect(page.getByText('Why 300 Random Solves Still Fail Interviews')).toBeVisible();

    const dimensions = [
      'Retention Verification',
      'Assistance Accountability',
      'Time Allocation',
      'Pattern Generalization',
      'Data Ownership',
    ];

    for (const dim of dimensions) {
      await expect(page.getByRole('cell', { name: dim })).toBeVisible();
    }
  });

  test('F11: Interactive FAQ Accordion and Closing CTAs', async ({ page }) => {
    await expect(page.getByText('Frequently Answered Questions')).toBeVisible();

    // First FAQ item is open by default
    const q1 = page.getByRole('button', { name: /Why does LC-Tracker strictly decouple recall/i });
    await expect(q1).toBeVisible();
    await expect(q1).toHaveAttribute('aria-expanded', 'true');

    // Click first FAQ item to collapse it
    await q1.click();
    await expect(q1).toHaveAttribute('aria-expanded', 'false');

    // Second FAQ item is initially closed
    const q2 = page.getByRole('button', { name: /How does the daily time budget prevent study burnout/i });
    await expect(q2).toBeVisible();
    await expect(q2).toHaveAttribute('aria-expanded', 'false');

    // Click second FAQ item to expand
    await q2.click();
    await expect(q2).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Instead of forcing you to clear an endless backlog of overdue problems')).toBeVisible();

    // Click second FAQ item again to collapse
    await q2.click();
    await expect(q2).toHaveAttribute('aria-expanded', 'false');

    // Closing CTA
    await expect(page.getByText('Ready for deliberate, permanent recall?')).toBeVisible();
    const launchWorkspaceCta = page.getByRole('link', { name: 'Launch Workspace' });
    await expect(launchWorkspaceCta).toBeVisible();
    await expect(launchWorkspaceCta).toHaveAttribute('href', '/login');

    // Footer
    const footer = page.locator('footer.landing-footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    await expect(footer.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  });
});

test.describe('Tier 2: Boundary & Corner Cases', () => {
  test('F12: Mobile viewport (390px) exhibits zero horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Wait for main content to render
    await expect(page.locator('h1')).toBeVisible();

    // Verify document does not exceed 390px scrollWidth
    const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);

    expect(docScrollWidth).toBeLessThanOrEqual(390);
    expect(bodyScrollWidth).toBeLessThanOrEqual(390);

    // Verify key sections are accessible without clipping
    await expect(page.locator('#walkthrough-theater')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start studying' })).toBeVisible();
  });

  test('F1: Prefers-reduced-motion media query preserves accessibility & stability', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#walkthrough-theater')).toBeVisible();

    // Interact with walkthrough tabs under reduced motion
    const theater = page.locator('#walkthrough-theater');
    await theater.getByRole('button', { name: /02 · Retrieval/i }).click();
    await expect(theater.getByText('Search in Rotated Sorted Array')).toBeVisible();

    await theater.getByRole('button', { name: /03 · Practice/i }).click();
    await expect(theater.getByText('Trapping Rain Water')).toBeVisible();
  });

  test('F9: Extreme Study Budget Simulator slider bounds handle edge cases without NaN or broken layouts', async ({ page }) => {
    await page.goto('/');

    const simulator = page.locator('text=Calculate Your Deliberate Practice Sequence').locator('xpath=ancestor::div[contains(@class, "rounded-card")]').first();
    const dailySlider = simulator.locator('input#daily-budget-range');
    const weeksSlider = simulator.locator('input#weeks-runway-range');

    // Test minimum bounds: 20 min daily, 2 weeks runway
    await dailySlider.fill('20');
    await dailySlider.dispatchEvent('change');
    await weeksSlider.fill('2');
    await weeksSlider.dispatchEvent('change');

    await expect(simulator.getByText('20 min / day')).toBeVisible();
    await expect(simulator.getByText('2 weeks', { exact: true })).toBeVisible();

    // Calculations at min bounds:
    // recall = round(20 * 0.3) = 6 min, coding = 14 min
    // totalDays = 2 * 6 = 12, totalHours = round((20 * 12) / 60) = 4 hrs
    await expect(simulator.getByText('4 hrs')).toBeVisible();
    await expect(simulator.getByText('Recall Warm-up: 6 min')).toBeVisible();
    await expect(simulator.getByText('Independent Code: 14 min')).toBeVisible();

    // Test maximum bounds: 90 min daily, 16 weeks runway
    await dailySlider.fill('90');
    await dailySlider.dispatchEvent('change');
    await weeksSlider.fill('16');
    await weeksSlider.dispatchEvent('change');

    await expect(simulator.getByText('90 min / day')).toBeVisible();
    await expect(simulator.getByText('16 weeks', { exact: true })).toBeVisible();

    // Calculations at max bounds:
    // recall = round(90 * 0.3) = 27 min, coding = 63 min
    // totalDays = 16 * 6 = 96, totalHours = round((90 * 96) / 60) = 144 hrs
    await expect(simulator.getByText('144 hrs')).toBeVisible();
    await expect(simulator.getByText('Recall Warm-up: 27 min')).toBeVisible();
    await expect(simulator.getByText('Independent Code: 63 min')).toBeVisible();
  });

  test('F8: Rapid walkthrough scene switching does not crash or corrupt state', async ({ page }) => {
    await page.goto('/');
    const theater = page.locator('#walkthrough-theater');

    const tab1 = theater.getByRole('button', { name: /01 · Daily Plan/i });
    const tab2 = theater.getByRole('button', { name: /02 · Retrieval/i });
    const tab3 = theater.getByRole('button', { name: /03 · Practice/i });
    const tab4 = theater.getByRole('button', { name: /04 · Evidence/i });

    // Rapid sequential and non-sequential clicks
    await tab2.click();
    await tab3.click();
    await tab4.click();
    await tab1.click();
    await tab3.click();
    await tab2.click();

    // Verify final state is consistently Scene 2
    await expect(theater.getByText('Search in Rotated Sorted Array')).toBeVisible();
    await expect(theater.locator('textarea#recall-answer-sim')).toBeVisible();
  });
});

test.describe('Tier 3: Cross-Feature Combinations', () => {
  test('F12 & F8: Theme switching (light/dark/system) during active walkthrough interaction', async ({ page }) => {
    await page.goto('/');
    const themeSelect = page.locator('select[aria-label="Color theme"]').first();
    const theater = page.locator('#walkthrough-theater');

    // Switch walkthrough to Scene 2
    await theater.getByRole('button', { name: /02 · Retrieval/i }).click();
    await theater.locator('textarea#recall-answer-sim').fill('Preserved state under theme switches');

    // Switch theme to light
    await themeSelect.selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    // Verify walkthrough state is intact
    await expect(theater.locator('textarea#recall-answer-sim')).toHaveValue('Preserved state under theme switches');

    // Switch theme to dark
    await themeSelect.selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // Verify walkthrough state is intact
    await expect(theater.locator('textarea#recall-answer-sim')).toHaveValue('Preserved state under theme switches');

    // Switch theme to system
    await themeSelect.selectOption('system');
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'system');
  });

  test('F9 & F4: Concurrency between Simulator sliders and Walkthrough planner', async ({ page }) => {
    await page.goto('/');

    const simulator = page.locator('text=Calculate Your Deliberate Practice Sequence').locator('xpath=ancestor::div[contains(@class, "rounded-card")]').first();
    const dailySlider = simulator.locator('input#daily-budget-range');

    // Adjust simulator slider to 60m
    await dailySlider.fill('60');
    await dailySlider.dispatchEvent('change');
    await expect(simulator.getByText('60 min / day')).toBeVisible();

    // Interact with Walkthrough Scene 1 budget presets
    const theater = page.locator('#walkthrough-theater');
    await theater.getByRole('button', { name: /01 · Daily Plan/i }).click();
    await theater.getByRole('button', { name: '30m budget' }).click();

    // Verify Walkthrough shows 30m planned
    await expect(theater.getByText('30 min planned')).toBeVisible();

    // Verify Simulator independently retains its 60 min / day setting
    await expect(simulator.getByText('60 min / day')).toBeVisible();
  });
});

test.describe('Tier 4: Real-World Application Scenarios', () => {
  test('Guest Visitor Full Conversion Funnel: Discovery to Login CTA', async ({ page }) => {
    // 1. Unauthenticated guest visits home page
    await page.goto('/');

    // 2. Discover hero message & value proposition
    await expect(page.locator('h1')).toContainText('A workspace for');

    // 3. Click "Watch Walkthrough" to scroll to walkthrough theater
    const watchWalkthroughBtn = page.locator('a, button').filter({ hasText: 'Watch Walkthrough' }).first();
    await watchWalkthroughBtn.click();
    const theater = page.locator('#walkthrough-theater');
    await expect(theater).toBeVisible();

    // 4. Explore Scene 1 (Daily Planner) and select 60m budget
    await theater.getByRole('button', { name: /01 · Daily Plan/i }).click();
    await theater.getByRole('button', { name: '60m budget' }).click();
    await expect(theater.getByText('60 min planned')).toBeVisible();

    // Click "Start recall check" in next action card -> navigates to Scene 2
    await theater.getByRole('button', { name: /Start recall check/i }).click();
    await expect(theater.getByText('Search in Rotated Sorted Array')).toBeVisible();

    // 5. Explore Scene 2 (Active Recall)
    await theater.locator('textarea#recall-answer-sim').fill('Explain invariant before viewing reference');
    await theater.getByRole('button', { name: 'Compare with a reference' }).click();
    await expect(theater.getByText('Verified Invariant')).toBeVisible();
    await theater.getByRole('button', { name: 'Recalled without reference' }).click();

    // 6. Explore Scene 3 (Coding Arena)
    await theater.getByRole('button', { name: /03 · Practice/i }).click();
    await theater.getByRole('button', { name: 'ts', exact: true }).click();
    await expect(theater.locator('pre')).toContainText('function trap(height: number[])');
    await theater.getByRole('button', { name: 'Run Test Suite' }).click();
    await expect(theater.getByText('All 48 Tests Passed')).toBeVisible({ timeout: 5000 });
    await theater.getByRole('button', { name: /I’m Done · Record Outcome/i }).click();
    await theater.getByRole('button', { name: /Solved independently/i }).click();

    // 7. Explore Scene 4 (Telemetry)
    await theater.getByRole('button', { name: /04 · Evidence/i }).click();
    await expect(theater.getByText('Learning evidence')).toBeVisible();
    await expect(theater.getByText('Recall checks')).toBeVisible();

    // 8. Test Study Budget Simulator
    const simulator = page.locator('text=Calculate Your Deliberate Practice Sequence').locator('xpath=ancestor::div[contains(@class, "rounded-card")]').first();
    await simulator.getByRole('button', { name: '45m Standard' }).click();
    await expect(simulator.getByText('45 min / day')).toBeVisible();

    // 9. Inspect FAQ disclosure
    const q3 = page.getByRole('button', { name: /Does the app automatically grade code or predict interview success/i });
    await q3.click();
    await expect(page.getByText('No. We reject fake predictive claims.')).toBeVisible();

    // 10. Click conversion CTA to /login
    const launchWorkspaceCta = page.getByRole('link', { name: 'Launch Workspace' });
    await launchWorkspaceCta.click();

    // Confirm navigation destination
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Sign in to LC Tracker' })).toBeVisible();
  });
});
