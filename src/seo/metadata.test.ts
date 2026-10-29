import { describe, expect, it } from 'vitest';
import { getPageMetadata, getPublicPaths, normalizePath, renderMetadata, serializeJsonLd } from './metadata';
import { problems } from '../data/problems';

describe('search metadata', () => {
  it('uses distinct metadata and the production origin on public deep links', async () => {
    const meta = await getPageMetadata('/patterns/two-pointers/?utm_source=test');
    expect(meta.canonical).toBe('https://lc-tracker.app/patterns/two-pointers');
    expect(meta.title).toContain('Two Pointers');
    expect(meta.indexable).toBe(true);
    expect(meta.breadcrumbs.map(crumb => crumb.path)).toEqual(['/', '/patterns', '/patterns/two-pointers']);
    expect(renderMetadata(meta)).toContain('og-image.png');
  });

  it('resolves extended problem names without inventing pages for missing references', async () => {
    const paths = await getPublicPaths();
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain('/library/explanations');
    expect(paths.length).toBeGreaterThan(300);
    const meta = await getPageMetadata('/library/two-sum/explanation');
    expect(meta.title).toContain('Two Sum Explained');
    expect(meta.indexable).toBe(true);
    expect(meta.canonical).toBe('https://lc-tracker.app/library/two-sum/explanation');
    const corePaths = new Set(problems.map(problem => `/library/${problem.id}/explanation`));
    const extendedPath = paths.find(path => path.endsWith('/explanation') && !corePaths.has(path));
    expect(extendedPath).toBeDefined();
    const extendedMeta = await getPageMetadata(extendedPath!);
    expect(extendedMeta.indexable).toBe(true);
    expect(extendedMeta.title).not.toContain('Page Not Found');
  });

  it('never indexes private screens, unknown URLs, or invented lessons', async () => {
    for (const route of ['/dashboard', '/analytics', '/settings', '/login', '/onboarding', '/study-plan', '/admin', '/sso-callback', '/timer/two-sum', '/recall/two-sum', '/missing', '/patterns/missing', '/library/missing/explanation']) {
      const meta = await getPageMetadata(route);
      expect(meta.indexable, route).toBe(false);
      expect(meta.robots, route).toBe('noindex,follow');
      expect(meta.structuredData['@graph'], route).toEqual([]);
      expect(meta.canonical, route).toBe(`https://lc-tracker.app${route}`);
    }
  });

  it('escapes structured data and attribute content safely', () => {
    expect(serializeJsonLd({ name: '</script><img src=x>&' })).not.toContain('<');
    expect(JSON.parse(serializeJsonLd({ name: '</script><img src=x>&' })).name).toBe('</script><img src=x>&');
    expect(normalizePath('/library/?q=two-sum#results')).toBe('/library');
  });
});
