import { expect, test } from '@playwright/test';

test.skip(!!process.env.PLAYWRIGHT_BASE_URL, 'Library simulations use only the local fixture server');

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 390]) {
    test(`manual solve dialog preserves the library position · ${theme} · ${width}`, async ({ page }, testInfo) => {
      const height = 844;
      await page.setViewportSize({ width, height });
      await page.addInitScript(({ theme }) => {
        localStorage.setItem('lc-e2e-user', 'user_library_e2e');
        localStorage.setItem('lc-tracker-features-modal-version', '1');
        localStorage.setItem('lc-tracker-theme', theme);
      }, { theme });

      let progress: Record<string, unknown>[] = [];
      const saves: any[] = [];
      await page.route('https://test.supabase.co/**', async route => {
        const url = new URL(route.request().url());
        const path = url.pathname;
        let data: unknown = [];
        if (path.endsWith('/rpc/commit_user_change')) {
          const request = route.request().postDataJSON();
          saves.push(request);
          progress = request.p_payload.progress.map((row: Record<string, unknown>) => ({ ...row, version: 1 }));
          data = { duplicate: false };
        } else if (path.endsWith('/user_settings')) {
          data = {
            version: 1,
            onboarding_complete: true,
            target_interview_date: '',
            leetcode_username: null,
            settings_json: { settings: { learningMode: 'EXPLORE' } },
          };
        } else if (path.endsWith('/problem_progress')) {
          const offset = Number(url.searchParams.get('offset') ?? 0);
          const limit = Number(url.searchParams.get('limit') ?? 500);
          data = progress.slice(offset, offset + limit);
        } else if (path.endsWith('/sprint_state')) {
          data = null;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
      });

      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('/library?tab=neetcode-75');
      const row = page.locator('tbody tr').last();
      const trigger = row.getByRole('button', { name: 'Mark as solved', exact: true });
      const problemTitle = await row.getByRole('button', { name: /^Start practice timer for / }).getAttribute('aria-label');
      const title = problemTitle!.replace('Start practice timer for ', '');
      const leetcodeUrl = await row.getByRole('link', { name: /^Open .* on LeetCode$/ }).getAttribute('href');
      const problemId = new URL(leetcodeUrl!).pathname.split('/').filter(Boolean).at(-1);
      await page.evaluate(() => document.fonts.ready);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.focus();
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(1000);

      const dialog = page.getByRole('dialog', { name: 'Mark as previously solved?' });
      await trigger.click();
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleDescription(title);
      await expect(dialog.getByRole('button', { name: 'Close dialog', exact: true })).toBeFocused();
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
      await page.screenshot({ path: testInfo.outputPath('manual-solve-dialog.png'), animations: 'disabled' });

      await page.keyboard.press('Shift+Tab');
      await expect(dialog.getByRole('button', { name: 'Strong (4)', exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(dialog.getByRole('button', { name: 'Close dialog', exact: true })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
      expect(saves).toHaveLength(0);

      await trigger.click();
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      expect(saves).toHaveLength(0);

      await trigger.click();
      await page.getByRole('button', { name: 'Close dialog backdrop', exact: true }).click({ position: { x: 5, y: 5 } });
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      expect(saves).toHaveLength(0);

      await trigger.click();
      const rating = width === 1440 ? 3 : 4;
      await dialog.getByRole('button', { name: rating === 3 ? 'Acceptable (3)' : 'Strong (4)', exact: true }).click();
      await expect(dialog).not.toBeVisible();
      await expect(row.getByRole('button', { name: /mark as unsolved/ })).toBeVisible();
      expect(saves).toHaveLength(1);
      expect(saves[0].p_payload.problemId).toBe(problemId);
      expect(saves[0].p_payload.progress[0].history.at(-1).rating).toBe(rating);
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
      await page.reload();
      await expect(row.getByRole('button', { name: /mark as unsolved/ })).toBeAttached();
      expect(errors).toEqual([]);
    });
  }
}
