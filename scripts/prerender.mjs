import { createServer } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const template = await readFile(path.join(dist, 'index.html'), 'utf8');
if (!template.includes('<!--seo-body-->') || !template.includes('<!--seo-head-start-->')) {
  throw new Error('The public HTML template is missing its SEO insertion points.');
}

// Use Vite's native TS/JSX and import.meta.glob transforms without bundling a
// second copy of the application or requiring a browser in a production build.
const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
  ssr: { resolve: { externalConditions: ['node', 'module-sync'] } },
});

try {
  const { getPublicPaths, renderPublicPage } = await vite.ssrLoadModule('/src/seo/prerender.tsx');
  const paths = [...new Set(await getPublicPaths())];
  async function writePage(route, filename) {
    const { head, body } = await renderPublicPage(route);
    const html = template.replace(/<!--seo-head-start-->[\s\S]*?<!--seo-head-end-->/, () => `<!--seo-head-start-->\n${head}\n<!--seo-head-end-->`)
      .replace('<!--seo-body-->', () => body);
    const target = path.join(dist, filename);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html);
  }
  for (const route of paths) {
    await writePage(route, route === '/' ? 'index.html' : `${route.slice(1)}.html`);
  }
  await writePage('/login', 'app.html');
  await writePage('/404', '404.html');

  const groups = {
    pages: paths.filter(route => !route.startsWith('/patterns/') && !/^\/library\/[^/]+\/explanation$/.test(route)),
    patterns: paths.filter(route => route.startsWith('/patterns/')),
    explanations: paths.filter(route => /^\/library\/[^/]+\/explanation$/.test(route)),
  };
  // No invented lastmod dates or ignored priority/changefreq hints. Every URL
  // here has substantive public content and a matching canonical HTML page.
  for (const [name, routes] of Object.entries(groups)) {
    await writeFile(path.join(dist, `sitemap-${name}.xml`), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route => `  <url><loc>https://lc-tracker.app${route}</loc></url>`).join('\n')}\n</urlset>\n`);
  }
  await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.keys(groups).map(name => `  <sitemap><loc>https://lc-tracker.app/sitemap-${name}.xml</loc></sitemap>`).join('\n')}\n</sitemapindex>\n`);
  console.log(`Prerendered ${paths.length} public pages (${groups.patterns.length} patterns, ${groups.explanations.length} explanations).`);
} finally {
  await vite.close();
}
