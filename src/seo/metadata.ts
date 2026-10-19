import { BRAND } from '../constants/brand';
import { patterns } from '../data/patterns';
import { allProblems, ensureExtendedCatalogLoaded, problemMap } from '../data/problems';
import { hasProblemReference } from '../data/problemReferences';

export const SITE_URL = 'https://lc-tracker.app';
export const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
export const NOINDEX_ROBOTS = 'noindex,follow';
export const SITE_DESCRIPTION = 'Plan LeetCode practice with spaced repetition, recall checks, and coding sessions. Browse problem explanations, algorithm patterns, and Python or C++ syntax.';
export const SHARE_IMAGE = `${SITE_URL}/og-image.png`;
export const SHARE_IMAGE_ALT = 'LC Tracker: a LeetCode study plan shaped by your goal and recorded practice.';

const pages = {
  '/': { title: 'LC Tracker | LeetCode Practice & Spaced Repetition', description: SITE_DESCRIPTION, name: 'LC Tracker' },
  '/library': { title: 'LeetCode Problem Library | LC Tracker', description: 'Browse LeetCode problems by topic, difficulty, and curated lists including Blind 75 and NeetCode 250. Open explanations and Python or C++ reference code.', name: 'Problem Library' },
  '/library/explanations': { title: 'LeetCode Problem Explanations | LC Tracker', description: 'Find LeetCode problem explanations with approach walkthroughs, time and space complexity, common mistakes, and Python or C++ code examples.', name: 'Problem Explanations' },
  '/patterns': { title: 'Algorithm Patterns for Coding Interviews | LC Tracker', description: 'Study algorithm patterns with recognition cues, invariants, worked examples, Python and JavaScript templates, and related LeetCode practice problems.', name: 'Algorithm Patterns' },
  '/syntax': { title: 'Python & C++ Interview Syntax Reference | LC Tracker', description: 'Review Python and C++ syntax for coding interviews: strings, collections, heaps, sorting, and more, with examples, use cases, and recall practice.', name: 'Syntax Reference' },
  '/privacy': { title: 'Privacy Policy | LC Tracker', description: 'Learn what LC Tracker stores, how authentication and study data are handled, and how to export or delete your information.', name: 'Privacy Policy' },
  '/terms': { title: 'Terms of Service | LC Tracker', description: 'Read the terms for using LC Tracker, including account responsibilities, acceptable use, and the limits of this independent LeetCode practice tool.', name: 'Terms of Service' },
} as const;

const privatePages: Record<string, string> = {
  '/login': 'Sign In', '/sso-callback': 'Signing In', '/dashboard': 'Today’s Study Plan',
  '/study-plan': 'Your Study Plan', '/analytics': 'Learning Evidence', '/settings': 'Settings',
  '/onboarding': 'Set Up Your Study Plan', '/admin': 'Admin', '/timer': 'Coding Session',
};

export interface PageMetadata {
  path: string;
  title: string;
  description: string;
  name: string;
  canonical: string;
  robots: string;
  indexable: boolean;
  breadcrumbs: { name: string; path: string }[];
  structuredData: Record<string, unknown>;
}

export function normalizePath(input: string) {
  const path = input.split(/[?#]/, 1)[0] || '/';
  return path === '/' ? path : path.replace(/\/+$/, '');
}

export async function getPublicPaths(): Promise<string[]> {
  await ensureExtendedCatalogLoaded();
  return [
    ...Object.keys(pages),
    ...patterns.map(pattern => `/patterns/${pattern.id}`),
    ...allProblems.filter(problem => hasProblemReference(problem.id))
      .map(problem => `/library/${problem.id}/explanation`),
  ];
}

export async function getPageMetadata(input: string): Promise<PageMetadata> {
  const path = normalizePath(input);
  let config: { title: string; description: string; name: string } = pages[path as keyof typeof pages];
  let indexable = Boolean(config);
  let parent: { name: string; path: string } | undefined;

  const pattern = patterns.find(pattern => path === `/patterns/${pattern.id}`);
  if (pattern) {
    config = { title: `${pattern.name} | Algorithm Patterns | LC Tracker`, description: `${pattern.description} Study recognition cues, a worked example, and Python or JavaScript templates.`, name: pattern.name };
    indexable = true;
    parent = { name: pages['/patterns'].name, path: '/patterns' };
  }

  const explanation = path.match(/^\/library\/([^/]+)\/explanation$/);
  if (explanation) {
    const id = explanation[1];
    if (!problemMap[id] && hasProblemReference(id)) await ensureExtendedCatalogLoaded();
    const problem = problemMap[id];
    if (problem) {
      config = { title: `${problem.title} Explained | Python & C++ | LC Tracker`, description: `Study ${problem.title}, a ${problem.difficulty.toLowerCase()} LeetCode problem in ${problem.category}. Review the approach, complexity, common mistakes, and Python or C++ code.`, name: problem.title };
      indexable = hasProblemReference(id);
      parent = { name: pages['/library'].name, path: '/library' };
    }
  }

  if (!config) {
    const name = privatePages[path] ?? (/^\/timer\/[^/]+$/.test(path) ? 'Coding Session' : /^\/recall\/[^/]+$/.test(path) ? 'Recall Check' : 'Page Not Found');
    config = { name, title: `${name} | LC Tracker`, description: name === 'Page Not Found' ? 'This page could not be found. Browse the LC Tracker problem library, algorithm patterns, and syntax reference.' : 'Sign in to LC Tracker to access your personal study workspace.' };
  }

  if (path === '/library/explanations') parent = { name: pages['/library'].name, path: '/library' };
  const canonical = `${SITE_URL}${path}`;
  const breadcrumbs = path === '/' ? [] : [
    { name: BRAND.name, path: '/' },
    ...(parent ? [parent] : []),
    { name: config.name, path },
  ];
  const graph: Record<string, unknown>[] = indexable ? [{
    '@type': path === '/library' || path === '/library/explanations' || path === '/patterns' ? 'CollectionPage' : 'WebPage',
    '@id': `${canonical}#webpage`, url: canonical, name: config.title, description: config.description,
    inLanguage: 'en', isPartOf: { '@id': `${SITE_URL}/#website` },
    ...(breadcrumbs.length ? { breadcrumb: { '@id': `${canonical}#breadcrumb` } } : {}),
  }] : [];
  if (indexable && breadcrumbs.length) graph.push({
    '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`,
    itemListElement: breadcrumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.name, item: `${SITE_URL}${crumb.path}` })),
  });
  if (path === '/') graph.push(
    { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: BRAND.name, alternateName: 'LC-Tracker', url: `${SITE_URL}/`, inLanguage: 'en', description: SITE_DESCRIPTION },
    { '@type': 'WebApplication', '@id': `${SITE_URL}/#app`, name: BRAND.name, url: `${SITE_URL}/`, description: SITE_DESCRIPTION, applicationCategory: 'EducationalApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript for study tracking.', image: SHARE_IMAGE, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, isAccessibleForFree: true },
  );
  return { ...config, path, canonical, indexable, robots: indexable ? INDEX_ROBOTS : NOINDEX_ROBOTS, breadcrumbs, structuredData: { '@context': 'https://schema.org', '@graph': graph } };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

export function renderMetadata(meta: PageMetadata) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  return `<title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="${meta.robots}" />
    <link rel="canonical" href="${escapeHtml(meta.canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="LC Tracker" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${escapeHtml(meta.canonical)}" />
    <meta property="og:image" content="${SHARE_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:alt" content="${SHARE_IMAGE_ALT}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${SHARE_IMAGE}" />
    <meta name="twitter:image:alt" content="${SHARE_IMAGE_ALT}" />
    <script id="page-structured-data" type="application/ld+json">${serializeJsonLd(meta.structuredData)}</script>`.replace(/<(title|meta|link|script)\b/g, '<$1 data-page-metadata');
}

export function applyMetadata(meta: PageMetadata) {
  // Replace the managed block as a unit so client navigation cannot leave stale
  // breadcrumbs, robots directives, or sharing URLs from the previous page.
  document.head.querySelectorAll('[data-page-metadata], #page-structured-data').forEach(tag => tag.remove());
  const template = document.createElement('template');
  template.innerHTML = renderMetadata(meta);
  for (const element of Array.from(template.content.children)) {
    element.setAttribute('data-page-metadata', '');
    document.head.appendChild(element);
  }
}
