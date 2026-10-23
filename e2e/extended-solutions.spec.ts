import { expect, test } from '@playwright/test';

test.skip(!!process.env.PLAYWRIGHT_BASE_URL, 'Content checks use the local fixture server');

const examples = [
  { id: 'count-primes', options: 2, original: 'Sieve of Eratosthenes', alternative: 'Brute Force', marker: 'for num in range(2, n)' },
  { id: 'design-browser-history', options: 3, original: 'Doubly Linked List', alternative: 'Two Stacks', marker: 'self.back_history = [homepage]' },
  { id: 'word-break-ii', options: 3, original: 'Dynamic Programming (Top-Down) Using Trie', alternative: 'Backtracking', marker: 'def backtrack(i)' },
  { id: 'closest-binary-search-tree-value', options: 2, original: 'Binary Search, O(H) time', alternative: 'Recursive Inorder + Linear search, O(N) time', marker: 'def inorder(r: TreeNode)' },
];
const furtherExamples = [
  { id: 'h-index', original: 'Citation Buckets', alternative: 'Sort and Find the Threshold', marker: 'citations.sort()', authored: false, license: '/walkccc-license.txt' },
  { id: '01-matrix', original: 'Multi-Source Breadth-First Search', alternative: 'Two-Pass Distance DP', marker: "distance = [[float('inf')]", authored: true, license: '/walkccc-license.txt' },
  { id: 'plus-one-linked-list', original: 'Sentinel Head + Textbook Addition', alternative: 'Reverse, Add, and Reverse Back', marker: 'def reverse(node)', authored: true, license: '/neetcode-license.txt' },
  { id: 'maximum-gap', original: 'Minimum-Gap Buckets', alternative: 'Sort and Compare Neighbors', marker: 'ordered = sorted(nums)', authored: true, license: '/walkccc-license.txt' },
  { id: 'maximum-length-of-repeated-subarray', original: 'Common-Suffix Table', alternative: 'One-Row Common-Run States', marker: 'for a in reversed(nums1)', authored: false, license: '/walkccc-license.txt' },
  { id: 'flip-game-ii', original: 'Memoized Game States', alternative: 'Independent Runs and Grundy Numbers', marker: 'grundy = [0]', authored: true, license: '/walkccc-license.txt' },
];

for (const theme of ['light', 'dark']) {
  for (const width of [1440, 390]) {
    test(`extended solution content switches together · ${theme} · ${width}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(theme => localStorage.setItem('lc-tracker-theme', theme), theme);
      const errors: string[] = [];
      const writes: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (request.url().includes('test.supabase.co') && ['POST','PATCH','DELETE'].includes(request.method())) {
          writes.push(request.url());
        }
      });
      for (const example of examples) {
        await page.goto(`/library/${example.id}/explanation`);
        const approaches = page.getByRole('group', { name: 'Solution approach', exact: true });
        const original = approaches.getByRole('button', { name: example.original, exact: true });
        const alternative = approaches.getByRole('button', { name: example.alternative, exact: true });
        await expect(approaches.getByRole('button')).toHaveCount(example.options);
        await expect(original).toHaveAttribute('aria-pressed', 'true');
        await page.getByLabel('Example language').selectOption('cpp');
        await expect(page.locator('.reference-code-toolbar')).toContainText('C++');
        await alternative.click();
        await expect(alternative).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByRole('heading', { name: example.alternative, exact: true })).toBeVisible();
        await expect(page.getByLabel('Example language')).toHaveValue('python');
        await expect(page.getByLabel('Example language')).toBeDisabled();
        await expect(page.locator('.reference-code .cm-content')).toContainText(example.marker);
        await expect(page.locator('.explanation-complexity')).not.toBeEmpty();
        await page.getByText('Source and license', { exact: true }).click();
        await expect(page.locator('.explanation-footnote a').first()).toHaveAttribute('href', /3186ede2ea4c4788e87be4b509bf2b66d5eba0e9/);
        await expect(page.locator('.explanation-footnote').getByRole('link', { name: 'MIT license', exact: true })).toHaveAttribute('href', '/neetcode-license.txt');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await alternative.focus();
        await page.keyboard.press('Enter');
        await expect(alternative).toBeFocused();
        if (example.id === 'closest-binary-search-tree-value') {
          await page.screenshot({ path: testInfo.outputPath('extended-approach.png'), fullPage: true, animations: 'disabled' });
        }
        await original.click();
        await expect(page.getByLabel('Example language')).toHaveValue('cpp');
        await expect(page.getByLabel('Example language')).toBeEnabled();
      }
      for (const example of furtherExamples) {
        await page.goto(`/library/${example.id}/explanation`);
        const approaches = page.getByRole('group', { name: 'Solution approach', exact: true });
        await expect(approaches.getByRole('button')).toHaveCount(2);
        await expect(approaches.getByRole('button', { name: example.original, exact: true })).toHaveAttribute('aria-pressed', 'true');
        await page.getByLabel('Example language').selectOption('cpp');
        await approaches.getByRole('button', { name: example.alternative, exact: true }).click();
        await expect(page.getByRole('heading', { name: example.alternative, exact: true })).toBeVisible();
        await expect(page.getByLabel('Example language')).toHaveValue('python');
        await expect(page.getByLabel('Example language')).toBeDisabled();
        await expect(page.locator('.reference-code .cm-content')).toContainText(example.marker);
        await page.getByText('Source and license', { exact: true }).click();
        const footnote = page.locator('.explanation-footnote');
        await expect(footnote).toContainText(example.authored ? 'Explanation and code by LC Tracker' : 'Code adapted from');
        await expect(footnote.getByRole('link').last()).toHaveAttribute('href', example.license);
        await expect(footnote.getByRole('link').last()).toHaveText(example.authored ? 'Related source’s MIT license' : 'MIT license');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (example.id === '01-matrix') {
          await page.screenshot({ path: testInfo.outputPath('further-approach.png'), fullPage: true, animations: 'disabled' });
        }
        if (example.id === 'maximum-gap') {
          await page.screenshot({ path: testInfo.outputPath('catalog-approach.png'), fullPage: true, animations: 'disabled' });
        }
      }
      await page.reload();
      await expect(page.getByRole('group', { name: 'Solution approach', exact: true }).getByRole('button').first()).toHaveAttribute('aria-pressed', 'true');
      expect(errors).toEqual([]);
      expect(writes).toEqual([]);
    });
  }
}
