# Search indexing

LC Tracker serves static public HTML alongside its interactive Vite/React app.
The build renders the home page, library, explanation index, pattern index and
lessons, syntax reference, privacy policy, and terms. Problem explanation pages
are included only when the catalog has a checked-in reference. Private notes,
progress, sessions, and settings never enter this render.

`src/seo/metadata.ts` owns titles, descriptions, the production canonical origin,
social metadata, and JSON-LD. Browser navigation uses the same definitions as the
build. `src/seo/prerender.tsx` reads the existing public content and renders it for
every visitor, including visitors without JavaScript. The interactive app replaces
that initial document; the public fallback remains visible during startup.
The render does not connect to Clerk or Supabase. It keeps source/license
attribution beside code examples. These are public references, not automatic
grading or claims about interview performance.

`public/public-page-init.js` runs synchronously before the body paints. When the
current tab holds an unrevealed recall draft for the requested explanation, it
hides the static reference and offers a resume link until the interactive recall
guard takes over. It only reads the existing draft; it never modifies it.

`npm run build` runs Vite, prerenders the public pages, and verifies the output.
At this revision that produces 872 canonical public pages: seven main pages,
29 pattern lessons, and 836 explanations. These counts are build output, not
observed indexed-page counts. The generated sitemap index at `/sitemap.xml`
links to `sitemap-pages.xml`, `sitemap-patterns.xml`, and
`sitemap-explanations.xml`. Do not maintain a separate sitemap in `public/`.
New references and lessons enter the next build automatically. No artificial
modification dates, ratings, or review counts are added.

The explanation index at `/library/explanations` links to every included
explanation. The library, landing footer, and explanation pages link to the
index. The public pattern index links to all lessons. JSON-LD includes WebSite,
WebApplication, WebPage/CollectionPage, and BreadcrumbList data where applicable.
There is no invented organization, aggregate rating, or sitelinks search action.

## Routing and exclusions

Vercel `cleanUrls` serves each generated `.html` file at its extensionless
canonical URL. The only SPA rewrites are for known authentication and private
workspace routes. These receive `X-Robots-Tag: noindex, follow` and a noindex
initial document. Browser metadata also marks private and missing routes noindex.
Unknown public URLs serve `404.html` with HTTP 404 rather than the homepage with
HTTP 200. `/api/` remains separate and is excluded in robots.txt.
The legacy brand-preview page also carries noindex so design experiments do not
compete with the public study pages.

Public content, JavaScript, styles, icons, and images remain crawlable. Private
workspace routes are not blocked in robots.txt: a crawler needs to fetch their
noindex directive. These directives are search controls; Clerk and database RLS
continue to enforce authentication and data access.

`public/favicon.svg` is the icon source. Run `npm run build:brand` after changing
it or `public/og-image.svg`. This generates 16/32/48px ICO entries, 48/96/192px PNG
favicons, the Apple touch icon, 512px app and maskable icons, and a 1200×630 PNG
sharing card. The manifest references the app icons. Preserve these stable URLs
so search engines can refresh the existing icon.

## Verification and release

Run the application checks from `AGENTS.md`, including the interface, theme,
study, landing, and SEO browser checks. `npm run verify:seo` checks every generated
public page for a unique title, correct canonical, indexability, actual content,
structured data, linked destinations, image sizes, and sitemap inclusion. The
browser SEO suite checks client navigation, missing-page metadata, the explanation
index, and desktop/mobile layouts in both themes. These local browser checks use
simulated authentication, not production sign-in.

After building, run `npm run test:seo:built`. It serves the built artifacts in an
isolated browser, verifies references without JavaScript, then delays application
chunks to confirm that an unrevealed recall cannot flash a solution before React
loads. The required CI check also runs this regression test.

Follow `docs/operations.md` for a protected production-configured staging deploy.
Check `/api/health` and `/api/leetcode-ac`, then use `vercel curl` to check:

- `/`, `/library`, `/library/explanations`, `/patterns`, `/patterns/two-pointers`,
  `/library/two-sum/explanation`, and an extended explanation: HTTP 200, distinct
  initial content and canonical URLs, with no dependence on Clerk rendering.
- `/sitemap.xml` and its three children: XML, correct production URLs, HTTP 200.
- `/favicon.ico`, `/favicon-96x96.png`, `/og-image.png`, and `/site.webmanifest`:
  correct image/manifest responses rather than SPA HTML.
- `/googlea6d61fd7250302f6.html`: verification text still accessible when following
  the clean-URL redirect.
- A made-up public URL: HTTP 404; a private workspace URL: noindex response.

Show the preview and wait for feedback before committing, pushing, merging, or
promoting, as required by `AGENTS.md`. This change needs no data migration.

After the approved release is live on `https://lc-tracker.app/`, resubmit
`https://lc-tracker.app/sitemap.xml` in the verified
[Search Console property](https://search.google.com/search-console?resource_id=https%3A%2F%2Flc-tracker.app%2F).
Inspect the home page and main public pages, run a live URL test, and request
indexing where appropriate. Check that Google can fetch each child sitemap and
sees the intended user-declared canonical. Monitor Page Indexing for duplicate
canonicals, fetch errors, or crawled-but-not-indexed pages. Review clicks,
impressions, and queries over subsequent weeks; a successful deploy does not
establish a ranking improvement.

Search Console inspected on October 19, 2026 showed one indexed page. The
previous `/sitemap.xml` submission had seven discovered URLs, status Success,
and a last-read date of April 25, 2026. These are the pre-release baseline,
not results of the new implementation.

The `/library` inspection said “URL is unknown to Google.” A live test on the
same date said the page was available to Google and could be indexed. Discovery
and indexing still need to be checked after the new release.

The initial production-configured staging deployment
`lc-tracker-9pp7xq2ko-alesios-projects-aec1d394.vercel.app` passed the HTTP checks
above on October 19, 2026. The directory exposed all 836 explanation links in
its initial HTML; the missing-page request returned 404; both API checks
returned 200. The existing ownership-verification file returned its original
token after following the clean-URL redirect. Vercel adds a noindex header on
this staging hostname. Check that the public custom domain remains indexable
after promotion. The homepage example was also exercised in the staging browser.

The final pre-push review fixed a reference flash during unrevealed recall and
added the built-page regression check. The refreshed staging deployment is
`lc-tracker-d3wyvf0m4-alesios-projects-aec1d394.vercel.app`. Its public references,
bootstrap script, explanation index, sitemap, private noindex response, missing
page, and both APIs passed HTTP checks. The full local browser suite passed 148
tests, alongside 176 unit tests, lint, build, built-page checks, and a clean
dependency audit.

Google chooses sitelinks automatically from page relevance and link structure;
neither a sitemap nor structured data can force a particular layout. The goal
is to make the public sections eligible and easy to discover. Crawling and
favicon refreshes can take days to weeks after release.

Primary guidance: [Google sitelinks](https://developers.google.com/search/docs/appearance/sitelinks),
[JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics),
[site names](https://developers.google.com/search/docs/appearance/site-names),
[favicons](https://developers.google.com/search/docs/appearance/favicon-in-search),
and [Vercel static routing](https://vercel.com/docs/project-configuration/vercel-json).
