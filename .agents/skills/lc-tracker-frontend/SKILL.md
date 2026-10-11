---
name: lc-tracker-frontend
description: Extend or review LC Tracker frontend layouts, styling, and components in its established study-register design. Use for UI work and visual consistency, including new screens; scheduling and persistence changes have separate workflows.
---

# LC Tracker frontend

Carry the established design into the requested change. The current interface
was refined through deliberate design sessions and desktop/mobile visual review;
its composition is part of the product, not incidental styling. Explicit user
requests can change the direction. Otherwise, extend the nearest existing
surface rather than inventing a new visual language.

Paths below are relative to the repository root. From this skill directory,
the repository root is `../../..`.

## Start with the existing design

Read `docs/interface-design.md` for the rationale and refinement history, then
inspect the affected component and its selectors in `src/index.css`. Read the
shared primitive you intend to use in `src/components/ui`. For a new screen,
choose the closest composition from the reference table below.

Before editing, identify the main task, the strongest action, the secondary
information, and their mobile reading order. When a runnable preview is available,
inspect the existing screen before changing it. Code alone does not establish
the rendered hierarchy: later CSS rules and page-specific selectors can flatten
or restyle a shared component.

## Visual language

The workspace is a **study register**: warm paper in light mode, graphite in dark
mode, precise typography, indexed checkpoints, ruled records, and generous space
around the work. Copper identifies the next action and current location.

- Give the current task the strongest visual weight. On Today, show the focal
  task once in the connected sequence; keep later tasks and the evidence rail
  quieter. Other screens should have an equally clear task hierarchy.
- Group with whitespace, alignment, and fine rules. Use open sections, rows,
  margins, and rails where the existing surface uses them. Bordered cards remain
  useful for contained controls or messages; their availability is not a reason
  to wrap every section in one.
- Indexed checkpoints express actual sequence or position. Ruled registers
  express recorded outcomes and values. Segmented meters express allocated time.
  Add these details when the information warrants them, not as decoration.
- Keep secondary actions compact and quiet. Use restrained Lucide icons for
  navigation or meaning, not repeated oversized icon tiles.
- Preserve the flat surfaces and small corners. Avoid introducing decorative
  gradients, glow, large shadows, pill-shaped section containers, equal-weight
  KPI grids, or repeated feature-card grids into the established compositions.
  Existing gradients that draw meter segments serve a specific information role.

## Tokens and primitives

`src/index.css` is the source of truth. It uses Tailwind v4 `@theme` and
`@theme inline`; check the current values there instead of adding a second token
system or copying palette hex values into components.

| Role | Existing convention |
| --- | --- |
| Page / contained / inset backgrounds | `bg-canvas`, `bg-surface`, `bg-muted-surface`; `bg-hover-surface` for interaction |
| Rules and boundaries | `border-line`; `border-line-strong` when a stronger boundary is needed |
| Text hierarchy | `text-foreground`, `text-body`, `text-muted`, `text-subtle` |
| Primary action / selected location | `accent`, `accent-strong`, `on-accent` |
| Outcomes and alerts | `success`, `warning`, `danger`, `info`; keep their meaning separate from copper |
| Typography | Geist for reading; JetBrains Mono for indices, technical metadata, time, and recorded values |
| Rhythm | Four-pixel spacing unit; follow the neighboring surface's gaps and padding |
| Corners and depth | Tokenized small radii; dialog shadow for overlay depth |
| Motion | `--duration-fast` (140ms), `--duration-state` (200ms), existing short entrance animations and reduced-motion rules |

Use Tailwind semantic utilities in JSX and `var(--palette-…)` in CSS. Use theme
tokens for charts and code too; a code block must remain readable in either theme.
`ThemeProvider.tsx` and `public/theme-init.js` own the saved preference and initial
canvas. Keep them aligned if changing those values.

Use `PageHeader` for ordinary page headings; existing focused workspaces may have
their own heading composition. Typical page headings are 28–32px with tight
tracking and moderate weight. The focal task, recorded minutes, and timer have
deliberately larger type. Do not enlarge every heading to match them.

`register-label` is small uppercase mono metadata; `register-value` uses mono and
tabular numerals. Keep reading instructions in normal sans-serif body text.
Follow existing prose widths and line heights for lessons and explanations.

Reuse these implementations when their role fits:

- `ui/Button.tsx`: primary, secondary, ghost, outline, and danger actions. The
  default is secondary; choose primary deliberately for the current next step.
- `ui/Field.tsx`: `Input`, `TextArea`, and `Select`, including semantic colors and
  focus states. Keep visible labels and relevant help beside the controls.
- `ui/Badge.tsx`: quiet mono status text rather than filled status pills.
- `ui/StudyTrace.tsx`: `TraceIndex`, `SectionHeading`, and `BudgetMeter`.
  `TraceIndex` is decorative (`aria-hidden`); put meaningful stage names in text.
- `ui/Modal.tsx`: dialog sizing, bounded scrolling, Escape dismissal, focus
  handling, and restoration. Reuse it rather than building another dialog shell.
- `ui/Card.tsx`: contained surfaces where appropriate. Inspect contextual CSS:
  `.settings-page .premium-card`, for example, becomes an open ruled section.
- `SyntaxHighlightedCode.tsx`, `RecallEditor.tsx`, and `ReferenceCode.tsx`:
  theme-aware code presentation and editing. Reuse the relevant role.
- `src/utils/cn.ts`: merge class overrides using the established helper.

Keep reusable rules and page compositions in their existing CSS sections. Prefer
editing the owning selector over accumulating later competing overrides. A new
shared primitive or token should serve a recurring need, not one local detail.

## Composition references

| Surface | Read | Preserve when extending |
| --- | --- | --- |
| Today | `Dashboard.tsx`; `.study-layout`, `.plan-track`, `.study-next`, `.study-step` | One connected sequence, one focal task/action, remaining time prominent, secondary evidence/budget rail |
| Problem library | `ProblemLibrary.tsx` and its library selectors | Search and coherent filters above compact rows; title/history and practice actions stay legible on phones |
| Recall | `RecallPage.tsx`, `RecallEditor.tsx`; `.recall-writing-layout`, `.attempt-stages`, `.recall-outcome-row` | Retrieve → compare → record; ruled writing sheet with reasoning margin; quiet outcome rows; mobile prompts in a disclosure |
| Coding | `TimerPage.tsx`, `Timer.tsx`; `.timer-console`, `.timer-display`, `.timer-ruler` | Timer beside the connected implementation protocol; minutes/seconds weight contrast; assessment keeps outcome dimensions separate |
| Learning evidence | `Analytics.tsx`; `.evidence-overview`, `.evidence-ledgers`, `.session-history-row` | Recorded minutes strongest; actual session records beside coverage on wide screens and before coverage on smaller screens; definitions in a disclosure |
| Patterns / lessons | `PatternFoundations.tsx`, `ProblemExplanation.tsx`; `.pattern-chapter`, `.pattern-row`, `.lesson-section-title` | Chapter margin, recognition cues, larger continuing lesson, open instructional sections and practice rail |
| Syntax | `SyntaxReference.tsx`, `SyntaxCardComponent.tsx`; `.syntax-book`, `.syntax-index`, `.syntax-definition` | Category margin and open definition/code rows; horizontal index on mobile; due-only and empty views reclaim the absent margin |
| Settings | `Settings.tsx`; `.settings-section`, `.settings-section-intro`, `.settings-section-fields` | Explanations beside compact controls on desktop, same reading order stacked on mobile, explicit saving |
| Shell / public / setup | `Layout.tsx`, `PublicHeader.tsx`, `LandingPage.tsx`, `Login.tsx`, `Onboarding.tsx` | Quiet navigation and the same progression language; public examples clearly labeled; setup keeps the immediate action visible |

Component paths in this table are under `src/components`. Use the current source
as the implementation reference; `docs/interface-design.md` explains why it looks
that way. Ignored `test-results/art-review` screenshots may exist locally, but
agents on a fresh checkout should generate their own fixture screenshots.

## Responsive behavior and interaction

Preserve the intended reading order, not just the desktop layout squeezed smaller.
Navigation switches at 1024px to a menu and primary destination dock. Below
768px, Today puts its budget above the work and evidence after the sequence;
library difficulty moves below titles so practice remains visible. Coverage
tables may scroll within their container; the page itself should not overflow.
Evidence/history uses one column through tablet widths rather than cramped rails.

Use `minmax(0, 1fr)` / `min-w-0` for flexible content and wrap long titles. Account
for fixed navigation and safe areas so actions stay reachable. Hover-only actions
must also appear on keyboard focus and remain available on touch screens.

Keep keyboard focus visible without doubled outlines; preserve skip navigation,
labels, selected/current state, dialog focus restoration, and reduced motion.
Inspect loading, empty, filtered-empty, error, disabled, and long-content states
as relevant. Empty reference views should not reserve a blank index column.

Visual changes must preserve drafts, session redirection, time corrections,
queue selection, rest days, and explicit settings saves. Do not recalculate or
reinterpret evidence to make a chart or label look better. When the request
changes learning behavior or persistence, use the respective repo workflow in
addition to this design guidance.

## Verify the rendered result

For application changes, follow the checks and publishing requirements in
`AGENTS.md` using Node.js 24: `npm run lint`, `npm test`, and `npm run build`.
Run the interface suite for layout changes:

```sh
npm run test:e2e -- e2e/interface.spec.ts
```

It exercises twelve surfaces at 1440px and 390px in both themes and writes
`interface.png` / `viewport.png` under ignored `test-results`. For shared shell
changes also run the theme and study suites:

```sh
npm run test:e2e -- e2e/theme.spec.ts e2e/study.spec.ts
```

Open the relevant screenshots and review hierarchy, spacing, text/code contrast,
marker alignment, wrapping, and first-screen access to the task. Passing overflow
and interaction assertions does not establish visual quality. Check affected
layouts at 768px and 1024px as well when rails, navigation, tables, or breakpoint
rules change. Use local isolated fixtures; leave `PLAYWRIGHT_BASE_URL` unset for
these suites and keep private screenshots out of commits.

For a new surface, extend the relevant browser checks when they verify meaningful
behavior or a demonstrated layout regression. Pure documentation updates to this
guide need link/content validation, not an application deployment. Update this
skill and the rationale document when an intentional new convention is adopted,
so the next agent inherits the final decision.
