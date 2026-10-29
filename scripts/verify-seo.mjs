import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const read = name => readFile(path.join(dist, name), 'utf8');
const origin = 'https://lc-tracker.app';
const index = await read('sitemap.xml');
assert.match(index, /<sitemapindex\b/);
const locs = xml => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const sitemaps = locs(index);
assert.equal(sitemaps.length, 3);
const routes = [];
for (const sitemap of sitemaps) {
  assert(sitemap.startsWith(`${origin}/sitemap-`));
  const xml = await read(new URL(sitemap).pathname.slice(1));
  assert.match(xml, /<urlset\b/);
  routes.push(...locs(xml).map(url => { assert(url.startsWith(`${origin}/`)); return new URL(url).pathname; }));
}
assert.equal(new Set(routes).size, routes.length, 'Duplicate sitemap URLs');
const knownRoutes = new Set(routes);
const privatePath = /^\/(login|dashboard|study-plan|settings|analytics|timer|recall|onboarding|admin|sso-callback)(\/|$)/;
const titles = new Set();
let codePages = 0;
for (const route of routes) {
  assert(!privatePath.test(route), `Private page in sitemap: ${route}`);
  const html = await read(route === '/' ? 'index.html' : `${route.slice(1)}.html`);
  const titlesFound = [...html.matchAll(/<title\b[^>]*>([^<]+)<\/title>/g)];
  assert.equal(titlesFound.length, 1, `${route}: expected one title`);
  assert(!titles.has(titlesFound[0][1]), `${route}: duplicate title`);
  titles.add(titlesFound[0][1]);
  assert.equal([...html.matchAll(/rel="canonical"/g)].length, 1, `${route}: duplicate canonical`);
  assert(html.includes(`href="${origin}${route}"`), `${route}: incorrect canonical`);
  assert.match(html, /name="robots" content="index,follow/);
  assert(!html.includes('content="noindex'), `${route}: unexpectedly noindex`);
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${route}: expected one main heading`);
  assert.match(html, /data-public-page/);
  assert.match(html, /<script src="\/public-page-init.js"><\/script>/);
  assert.match(html, /property="og:image" content="https:\/\/lc-tracker.app\/og-image.png"/);
  assert.match(html, /property="og:image:alt"/);
  assert(!html.includes('seo-footer'), `${route}: hidden crawler-only footer`);
  const json = html.match(/<script[^>]+id="page-structured-data"[^>]*>([\s\S]*?)<\/script>/);
  assert(json, `${route}: missing structured data`);
  const graph = JSON.parse(json[1])['@graph'];
  assert(graph.some(node => node.url === `${origin}${route}`), `${route}: structured data URL mismatch`);
  if (route !== '/') assert(graph.some(node => node['@type'] === 'BreadcrumbList'), `${route}: missing breadcrumbs`);
  if (/^\/library\/[^/]+\/explanation$/.test(route)) {
    assert.match(html, /<pre\b[\s\S]*?<code\b[\s\S]*?class /);
    assert.match(html, /Source and license/);
    assert.match(html, /data-public-reference/);
    assert.match(html, /Resume recall check/);
    codePages++;
  }
  // Public deep pages must be reachable by normal HTML links, including when
  // JavaScript is unavailable; verify the destinations as well as the sitemap.
  for (const match of html.matchAll(/<a\b[^>]*href="(\/[^"]*)"/g)) {
    const href = match[1].split(/[?#]/, 1)[0] || '/';
    if (knownRoutes.has(href) || privatePath.test(href)) continue;
    assert(!href.includes('..'), `${route}: unsafe local link`);
    await access(path.join(dist, href.slice(1))).catch(() => { throw new Error(`${route}: broken public link ${href}`); });
  }
}
assert(codePages > 250, 'The extended explanation pages are missing');
const directory = await read('library/explanations.html');
for (const route of routes.filter(route => /^\/library\/[^/]+\/explanation$/.test(route))) {
  assert(directory.includes(`href="${route}"`), `${route}: absent from the public explanation directory`);
}
const patternIndex = await read('patterns.html');
for (const route of routes.filter(route => route.startsWith('/patterns/'))) assert(patternIndex.includes(`href="${route}"`));
for (const name of ['app.html', '404.html']) assert.match(await read(name), /name="robots" content="noindex,follow"/);
assert.match(await read('brand-previews/index.html'), /name="robots" content="noindex,follow"/);
assert.match(await read('404.html'), /Page not found/);
const robots = await read('robots.txt');
assert(robots.includes(`${origin}/sitemap.xml`));
assert(!/Disallow: \/(?:library|patterns|syntax|assets|favicon)/.test(robots));
const images = { 'favicon-48x48.png': [48, 48], 'favicon-96x96.png': [96, 96], 'favicon-192x192.png': [192, 192], 'apple-touch-icon.png': [180, 180], 'icon-512x512.png': [512, 512], 'icon-maskable-512x512.png': [512, 512], 'og-image.png': [1200, 630] };
for (const [name, dimensions] of Object.entries(images)) {
  const data = await readFile(path.join(dist, name));
  assert.equal(data.subarray(1, 4).toString(), 'PNG');
  assert.deepEqual([data.readUInt32BE(16), data.readUInt32BE(20)], dimensions, `${name}: wrong dimensions`);
}
const ico = await readFile(path.join(dist, 'favicon.ico'));
assert.equal(ico.readUInt16LE(4), 3, 'ICO should include 16, 32, and 48px images');
const manifest = JSON.parse(await read('site.webmanifest'));
for (const icon of manifest.icons) await access(path.join(dist, icon.src.slice(1)));
await access(path.join(dist, 'googlea6d61fd7250302f6.html'));
await access(path.join(dist, 'public-page-init.js'));
console.log(`SEO verified: ${routes.length} unique public pages, ${codePages} linked explanations, breadcrumbs, sitemaps, private-page exclusions, and all image assets.`);
