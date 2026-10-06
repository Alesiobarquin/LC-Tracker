# Interface design

## Audit

The previous interface repeated the same bordered panel across unrelated tasks.
The sidebar, breadcrumb header, and large page heading competed for space. The
library had three separate filter treatments; its row actions required sideways
scrolling on a phone. The roadmap gave every pattern a card and several badges.
The public introduction occupied almost a full screen before explaining the
workflow, followed by repeated three-column feature and preview grids.

The five primary surfaces are the daily plan, problem library, study sessions,
pattern/reference material, and learning evidence. Onboarding, settings, the
public page, and dialogs use the same visual rules.

[Default](https://www.default.com/), [Linear](https://linear.app/), and
[Railway](https://railway.com/) informed the use of restrained neutrals, precise
hierarchy, compact technical metadata, and visual details tied to a product's
work. Their layouts and branding are not reproduced.

## Direction

The workspace is a study register. Warm paper and graphite surfaces, Geist
sans-serif, and selective JetBrains Mono distinguish instructions, technical
metadata, and recorded values. Copper marks the next action and current location.
Success, warning, and error colors remain separate semantic signals.

Two details recur:

- Indexed checkpoints connect the daily sequence, pattern roadmap, recall and
  coding stages, onboarding, and public explanation of the practice loop.
- Ruled evidence registers align outcomes and time values. A segmented meter
  shows the daily budget, while history and coverage use compact rows.

The daily plan gives one next action the strongest treatment. Its evidence and
budget sit in a secondary rail. The library and roadmap use rows. Lesson content
uses open sections beside a practice rail. A coding session uses a timer beside
its protocol; the outcome form keeps confidence separate from correctness,
assistance, and explanation.

Settings pair section explanations with compact controls on desktop and use the
same reading order on mobile. Syntax practice uses the indexed checkpoint and
ruled session record, with focus-managed help and exit dialogs.

## Implementation

Semantic colors, type roles, radii, the four-pixel spacing unit, motion durations,
and dialog depth live in `src/index.css`. Shared buttons, fields, headings,
dialogs, checkpoints, and budget meters live in `src/components/ui`. The initial
theme script and React theme controller use the same canvas colors. The SVG mark
and favicon variants share a source; `node scripts/render-brand-assets.mjs`
renders the raster variants with Playwright.

At 1024px, navigation changes from a horizontal workspace bar to a menu and
primary destination dock. Below 768px, the daily budget moves above the primary
work, the evidence rail follows the sequence, and library difficulty moves below
problem titles so practice actions remain visible. Coverage tables retain
horizontal scrolling. Syntax uses a category margin and open definition/code rows on desktop, with
a horizontal index and stacked definitions on mobile. Keyboard focus, reduced motion, and saved theme preferences remain
available.

## Verification scope

`e2e/interface.spec.ts` exercises twelve surfaces at 1440px and 390px in both
light and dark themes. It checks viewport overflow, page errors, library search,
menu dismissal, dialog focus handling, recall comparison, coding assessment, and
onboarding steps. Syntax checks cover keyboard reveal/hide and focus restoration
when leaving the full-screen session. Screenshots are generated in ignored `test-results` folders for
visual review. These use isolated Clerk/Supabase fixtures, not production user
records. The existing study, theme, reliability, and public smoke suites cover
behavior separately. No scheduling, persistence, or database migration changed.

## Visual review and refinement

The first implementation was coherent but still relied on a boxed next-action
panel, equal-weight metrics, repeated pattern rows, and syntax cards. The next
audit opened the existing desktop and mobile screenshots before changing code.
Those renders were preserved for comparison.

The refinement changes composition rather than the palette:

- Today has one connected sequence. The focal task appears once, with later
  tasks attached to the same spine. Remaining time is prominent; the daily
  target is secondary.
- Recall uses a ruled writing sheet and a reasoning margin. Retrieve, compare,
  and record form a visible progression. Phones keep prompts available through
  a disclosure so the answer and comparison action fit in the first screen.
  Outcome choices are quiet rows, not three repeated cards.
- Evidence gives recorded minutes the strongest typographic weight. Actual
  session records sit beside coverage on wide screens and precede it on phones
  and tablets. Unknown evidence stays unknown. Definitions remain available in
  a disclosure; historical ratings are not presented as coding passes.
- Patterns use chapter margins, recognition cues, and a larger continuing
  lesson. Syntax uses an indexed reference margin, open definitions, and inset
  code. Library rows show accumulated history records without inferring mastery.
- Coding uses a minutes/seconds weight contrast, an elapsed-time ruler that
  extends for longer attempts, and a connected implementation protocol.
  Setup, sign-in, and the public explanation use the same progression language.

Two full screenshot review rounds followed implementation. The first identified
mobile instruction overhead, empty-metric weight, doubled field focus outlines,
and misaligned markers. The second confirmed the improved compositions and
caught remaining outcome-card chrome and setup duplication. A final live review
covered the five main pages at 1440, 1024, 768, and 390 pixels, including
unfiltered library rows, mobile filters, and timer backdating/pause/resume.
Tablet coverage/history columns were then given full width. Loading layouts and
empty searches were inspected as well. The default syntax queue no longer
reserves an absent reference margin, and an empty pattern search keeps its
mobile heading and offers a clear-filter action. Browser checks cover both
regressions.

The before/after gallery and screenshots are local review artifacts under
`test-results/art-review`, which is ignored by Git. They contain isolated
example data. The gallery supports side-by-side and overlay comparison for all
twelve surfaces in both themes, at the same desktop and phone dimensions.
