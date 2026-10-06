---
name: lc-tracker-reliability
description: Verify LC Tracker persistence migrations, retry handling, backup recovery, and deployment readiness when changing user data or fixing reliability regressions. Ordinary styling changes do not need the database workflow.
---

# LC Tracker reliability

Use this repo's actual PostgreSQL and browser checks to validate persistence
changes. Read [operations](../../../docs/operations.md) for release work and
[architecture](../../../docs/reliability-review.md) when tracing a failure across
Vercel, Clerk, Supabase, and the browser.

The client computes scheduling from confirmed reads; `commit_user_change` checks
revisions and atomically commits related rows with a retry receipt. A timer's
operation UUID and exact completion are stored in sessionStorage before sending.
Keep that ID through timeouts, reloads, and explicit retries. Only confirmed
`40001` conflicts may be retried automatically, with fresh source data.

For persistence changes:

- Inspect the action in `src/services/userData.ts`, its hook, its UI caller, and
  the corresponding forward migration together. Check fresh-read failures,
  conflicting devices, and lost responses after a successful commit.
- Put cross-record atomicity, duplicate handling, and account isolation checks in
  `supabase/tests/reliability.sql`. `npm run test:db` uses the actual migrations in
  a disposable local PostgreSQL cluster and tests concurrent connections.
- For feedback Storage policies, use the Clerk JWT subject for folder ownership
  and test owned, cross-account, bucket, and anonymous behavior in
  `supabase/tests/storage.sql`. Avoid live feedback inserts: production sends an
  external notification. Local recovery must keep that webhook disabled.
- Put browser retry/reload behavior in `e2e/reliability.spec.ts`. `npm run test:e2e`
  uses the `e2e` Vite mode and mock auth fixture. Do not treat that as live OAuth
  verification. Production builds reject the fixture mode.
- Run types, unit tests, database tests, browser tests, and the production build
  for changes spanning the save path. Add a test for the demonstrated failure,
  rather than assertions that only mirror the implementation.
- For a release, check that required migrations precede the client deployment,
  read `/api/health`, invoke `/api/leetcode-ac`, and report which provider configurations or recovery steps
  could not be verified. Provider readiness does not establish authenticated RLS
  behavior or a tested database backup restore.
- For a private PostgreSQL archive, use `npm run verify:backup -- <archive-path>`
  with PostgreSQL 17+ binaries on PATH. It restores auth, storage metadata, and
  public tables into an isolated local cluster, verifies migration data preservation,
  and runs the persistence checks in a rolled-back transaction. It disables the
  Supabase outbound webhook function and skips platform ownership/grants. This
  validates application recovery, not hosted service restoration or stored image
  bytes. Keep the archive outside the repository.

Export uses `export_user_data` under the same lock as writes; restore validates
all records and commits them together. Preserve all session timings, including
ones outside the usual 90-day analytics window. Ignore imported ownership and
revision metadata. Do not infer ratings or rewrite user data during reads.
