# LC Tracker

## Architecture

Vite/React runs in the browser and is hosted on Vercel. Clerk owns authentication;
Supabase PostgreSQL/RLS owns user data. Vercel's LeetCode proxy is read-only.
Review planning runs in the browser; this repository has no scheduled tutor or
reminder delivery service. Read `docs/reliability-review.md` for the service map
and `docs/operations.md` for migration, verification, and rollback instructions.

## Data changes

- Keep user-data reads and writes in `src/services/userData.ts`; hooks in
  `src/hooks/useUserData.ts` orchestrate queries and mutations.
- Related session writes go through `commit_user_change`, with a persisted
  operation UUID. Preserve the same ID and completion payload on retries and
  reloads. Never split timing, progress, activity, and sprint updates into
  independent writes.
- Use confirmed source reads and revision checks before editing records. Retry
  only application conflict `PT409` with refreshed inputs. A network timeout does not prove
  a write failed; do not replay a non-idempotent operation with a new ID.
- Settings sliders need local drafts and an explicit save action. Keep the
  edit-start settings as the conflict base across refetches, and retain selections
  after failed saves. Do not bind every slider movement to a database mutation.
- Derive ownership from the Clerk JWT subject in SQL. Browser admin flags only
  affect navigation; database RLS and `admin_users` enforce permissions.
- Feedback Storage uses the Clerk subject as the first path folder. Upload/delete
  policies must target `authenticated`; `auth.uid()` assumes UUIDs and cannot own
  these images. Cover ownership and anonymous denial in `supabase/tests/storage.sql`.
- Production feedback inserts invoke an external notification webhook. Validate
  with isolated fixtures and disable provider webhooks during local recovery;
  do not send synthetic live feedback without explicit permission to send messages.
- Reads must not rewrite settings or infer new meanings for historical ratings.
  Keep review scheduling changes separate from reliability repairs.
- Paginate with deterministic ordering and handle a server row cap smaller than
  the requested page. Session history cursors include timestamp and ID.
- Backup export must include all timings and use a consistent database snapshot.
  Validate the complete import before an atomic restore. Ignore imported user IDs
  and database revisions.
- Add forward migrations in `supabase/migrations`; do not modify historical
  migrations to repair an already deployed database. Apply required migrations
  before releasing dependent browser code.

## Learning behavior

- `src/utils/study.ts` owns the shared daily budget, mixed recall queue, coding
  blocks, interval updates, and evidence labels. Read `docs/study-strategy.md`
  before changing learning semantics. The repo skill at
  `.agents/skills/lc-tracker-study/SKILL.md` covers this repeatable workflow.
- Recall and implementation are distinct. Recall success never counts as a
  coding pass or postpones the coding check. Same-day/daily rehearsal cannot
  establish delayed retention; outcomes include correctness, assistance, and
  explanation rather than confidence alone.
- New imports have unknown current confidence. Preserve legacy ratings and
  retirement flags as historical data; do not rewrite their meanings during
  reads. Maintenance remains eligible for practice.
- Deduplicate all task kinds and subtract today's recorded and active time and used recall
  allocation. Respect rest days and inclusive blackout ranges. Long coding
  attempts may span time-bounded blocks; support unfinished continuation.
- Preserve a pending session when another problem is opened. Session starts must
  not replace coding or recall drafts; redirect to the active session instead.
- Keep numeric study defaults distinct from scientific evidence. Never describe
  a self-reported rating as a calibrated probability or interview prediction.
- Keep onboarding, pattern lessons, landing descriptions, and the product tour
  aligned with the planner. Do not claim exact forgetting predictions or automatic
  grading. Label illustrative records and measurements as examples.
- The study-state migration must precede the dependent client release. Extend
  `supabase/tests/study.sql`, service/backup checks, and `e2e/study.spec.ts` when
  changing recall persistence or the completion flow.

## Interface and themes

- Use the semantic palette in `src/index.css` for backgrounds, borders, text,
  status colors, charts, and syntax highlighting. Both light and dark themes
  must stay readable; do not introduce fixed dark panels or pale text colors.
- `ThemeProvider` owns the browser preference (`light`, `dark`, or `system`).
  Keep `public/theme-init.js` aligned with it so the correct theme appears before
  React loads. Theme changes are local preferences and never write user data.
- Keep one prominent next action on the daily plan. Use flatter panels, small
  corner radii, and quiet secondary controls. Preserve session drafts, time
  accounting, queue selection, and rest-day behavior during visual changes.
- Check desktop and narrow mobile layouts in both themes, including code,
  dialogs, keyboard focus, and navigation. Run the theme and study browser
  checks after shared shell changes. Pure styling changes need no database
  migration or production backup.

## Verification

Run `npm run lint`, `npm test`, and `npm run build` for application changes.
Use Node.js 24, matching CI and the pinned Vercel runtime.
Use explicit `.js` extensions for local imports in Vercel function entry points;
Vercel emits JavaScript modules and native Node ESM rejects extensionless imports.
The native function runtime regression test runs with the unit suite. Check both
`/api/health` and `/api/leetcode-ac` on a staged deployment before promotion.
For persistence changes also run `npm run test:db` (PostgreSQL binaries on PATH)
and `npm run test:api` (PostgREST 14.5 also on PATH), plus `npm run test:e2e`.
Never raise `40001` for application revision conflicts: the production PostgREST
version retries it internally without refreshing inputs and can exhaust the pool.
Use `PT409` and keep the forward conflict-status migration in the release.
Database tests create and remove an isolated local cluster;
they never load production credentials. The repository skill at
`.agents/skills/lc-tracker-reliability/SKILL.md` documents this repeatable workflow.
For a private PostgreSQL archive, run `npm run verify:backup -- <archive-path>`
with PostgreSQL 17+ binaries. Its local restore disables provider webhooks and
skips platform ownership/grants; it does not recover stored image bytes.

Playwright's local server uses Vite's `e2e` mode with simulated Clerk/Supabase
responses. Production builds reject that mode. Passing those tests does not
verify production OAuth settings or the deployed Clerk/Supabase integration.
Use `PLAYWRIGHT_BASE_URL` only for public smoke checks against a deployment.
Keep `.env*`, tokens, screenshots containing personal data, and database exports
out of commits. Optional Sentry reporting strips messages, requests, and user
information; preserve that behavior when extending telemetry.

For a release, confirm the linked Vercel project is `lc-tracker`. Stage with
`vercel deploy --prod --skip-domain --yes` and check the protected deployment
with `vercel curl`. Keep the release PR unmerged until required migrations are
verified; merging `main` triggers production deployment. The GitHub Actions
`verify` check is required by branch protection.

## Personal project presentation

When writing, designing, or reviewing public presentations of this personal
software project, use the `project-writeup` skill in
`~/.agents/skills/project-writeup` (or its installed catalog location if that path
has moved). This applies to portfolio sites, READMEs, case studies, and resume
descriptions. Prefer plain facts, concrete experiments, inspectable code and
tests, honest attribution, and stated limits. Keep measurements with their method
and scope. Explicit task-specific style instructions take precedence. This
preference concerns presentation, not architecture or unrelated writing.
