import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

// Exercise actual generated HTML, styles, and synchronous public scripts.
// Vite's e2e server has no prerendered body and cannot catch an answer flashing
// before the application restores a persisted recall check.
const dist = path.resolve('dist');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/vnd.microsoft.icon', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const filename = pathname === '/' ? 'index.html' : pathname.slice(1) + (path.extname(pathname) ? '' : '.html');
    const target = path.resolve(dist, filename);
    if (!target.startsWith(`${dist}${path.sep}`)) throw new Error('Invalid path');
    const data = await readFile(target);
    response.writeHead(200, { 'Content-Type': `${mime[path.extname(target)] ?? 'application/octet-stream'}; charset=utf-8` });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch();
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noScript.newPage();
  await staticPage.goto(`${origin}/library/two-sum/explanation`);
  assert(await staticPage.locator('.problem-explanation').isVisible(), 'Public explanations need to be readable without JavaScript');
  assert((await staticPage.locator('.public-reference-code').first().textContent()).includes('twoSum'));
  assert(!(await staticPage.getByRole('link', { name: 'Resume recall check' }).isVisible()));
  await staticPage.goto(`${origin}/library/explanations`);
  const sitemap = await readFile(path.join(dist, 'sitemap-explanations.xml'), 'utf8');
  assert.equal(await staticPage.locator('a[href$="/explanation"]').count(), [...sitemap.matchAll(/<url>/g)].length);
  await noScript.close();

  for (const [name, draft, hidden] of [
    ['unrevealed matching recall', { problemId: 'two-sum', revealed: false }, true],
    ['already revealed recall', { problemId: 'two-sum', revealed: true }, false],
    ['another problem’s recall', { problemId: 'valid-anagram', revealed: false }, false],
    ['invalid draft storage', 'malformed-json', false],
  ]) {
    const context = await browser.newContext();
    await context.addInitScript(value => {
      sessionStorage.setItem('lc-tracker-active-session', typeof value === 'string' ? value : JSON.stringify({ state: { activeRecall: value }, version: 0 }));
    }, draft);
    const page = await context.newPage();
    // Keep app chunks delayed indefinitely while allowing the real head guard
    // and stylesheet to run, just as on a slow network before React boots.
    await page.route('**/assets/*.js', route => route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/library/two-sum/explanation`);
    assert.equal(await page.locator('.problem-explanation').isVisible(), !hidden, name);
    assert.equal(await page.getByRole('link', { name: 'Resume recall check' }).isVisible(), hidden, name);
    assert.deepEqual(errors, [], name);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('lc-tracker-active-session')), typeof draft === 'string' ? draft : JSON.stringify({ state: { activeRecall: draft }, version: 0 }), `${name}: the presentation guard must not change the draft`);
    await context.close();
  }
  console.log('Built-page browser checks passed: no-JavaScript references, complete explanation links, and no answer flash during unrevealed recall.');
} finally {
  if (browser) await browser.close();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
