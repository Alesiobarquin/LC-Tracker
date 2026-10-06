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
  only SQLSTATE `40001` with refreshed inputs. A network timeout does not prove
  a write failed; do not replay a non-idempotent operation with a new ID.
- Derive ownership from the Clerk JWT subject in SQL. Browser admin flags only
  affect navigation; database RLS and `admin_users` enforce permissions.
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

## Verification

Run `npm run lint`, `npm test`, and `npm run build` for application changes.
Use Node.js 24, matching CI and the pinned Vercel runtime.
Use explicit `.js` extensions for local imports in Vercel function entry points;
Vercel emits JavaScript modules and native Node ESM rejects extensionless imports.
The native function runtime regression test runs with the unit suite. Check both
`/api/health` and `/api/leetcode-ac` on a staged deployment before promotion.
For persistence changes also run `npm run test:db` (PostgreSQL binaries on PATH)
and `npm run test:e2e`. Database tests create and remove an isolated local cluster;
they never load production credentials. The repository skill at
`.agents/skills/lc-tracker-reliability/SKILL.md` documents this repeatable workflow.

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
