# Operating LC Tracker

## Local setup and checks

Use Node.js 24, `npm ci`, and a local `.env` copied from
`.env.example`. Clerk and Supabase browser values are public configuration, but
service-role keys and database passwords must never have a `VITE_` prefix.
Start the app with `npm run dev`.

| Command | What it checks |
| --- | --- |
| `npm run lint` | TypeScript across the client, server, scripts, and tests |
| `npm test` | Scheduling helpers, validated reads/writes, token handling, configuration, and API behavior |
| `npm run test:db` | Actual migrations, transaction rollback, duplicate retries, revision conflicts, concurrent connections, and RLS |
| `npm run test:e2e` | Public routes and simulated authenticated failure/reload/retry flows |
| `npm run build` | The production bundle, without mock authentication |
| `npm audit` | The installed dependency advisories; the lockfile fixes versions |

The database harness needs `initdb`, `pg_ctl`, and `psql` on PATH. It starts a
local cluster listening only on its temporary Unix socket, then stops and removes
that cluster. It does not read `.env` or accept a production database URL. On
Ubuntu CI the installed PostgreSQL binary directory is added to PATH.

Playwright uses a local Vite server in `e2e` mode with fake Clerk credentials and
intercepted Supabase requests. Real database behavior is tested separately. To
check a deployed site's public routes without starting a local server:

```sh
PLAYWRIGHT_BASE_URL=https://lc-tracker.app npm run test:e2e -- e2e/smoke.spec.ts
```

These public checks do not perform a real sign-in or authenticated database write.

## Release order

1. Export the current Supabase database using the provider's database backup/export
   mechanism. Store it privately and confirm that it can be restored in a separate
   project. The in-app JSON export covers the signed-in user's study data, not
   authentication, feedback storage, database policies, or other users.
2. Confirm the deployed migration history. Apply any missing prerequisite schema,
   Clerk-ID/RLS, and session-rating migrations, then apply
   `supabase/migrations/20261006000000_reliable_user_writes.sql` with the authenticated
   database administration tool for the correct project. Do not run the historical
   migrations blindly on an unknown production schema.
3. Confirm `version` exists on settings, progress, and sprint state; the
   `commit_user_change` and `export_user_data` RPCs exist; authenticated table grants
   are present; and the five user tables are in the Realtime publication. The new
   migration sets these up. Its functions are SECURITY INVOKER and retain RLS.
4. Configure Vercel production and preview environment variables from `.env.example`.
   Clerk's publishable key, allowed origins, OAuth callbacks, and Supabase third-party
   integration must refer to the same Clerk instance. JWTs need the authenticated
   role claim. Check the [official Clerk/Supabase integration](https://supabase.com/docs/guides/auth/third-party/clerk).
5. Deploy the verified commit, then check `/api/health` and run public smoke tests.
   In a dedicated test account, complete a session and check progress, timing,
   activity, and sprint changes. Repeat with a second device and an interrupted
   response; verify one save per session ID. Export and restore that account's
   JSON data, including an old timing outside the default analytics window.

The new client deliberately fails safely if the RPC or version columns are
missing. It must not fall back to the old sequence of independent writes.

The local test harness bootstraps only the Supabase auth/role surfaces needed to
exercise the persistence migrations. It does not reproduce hosted Clerk token
verification, the storage service, or all Supabase platform settings.

## Recovery and rollback

Vercel can redeploy a previously verified deployment. Reverting only the client
leaves the additive reliability schema in place, but an old client can resume its
unsafe writes. Prefer a corrected release, or temporarily restrict signed-in
writes while investigating. Keep schema additions and receipts during rollback;
do not drop them while a client might retry a pending operation.

For a failed save, keep the session's original completion and operation ID. A
successful transaction's receipt is returned on replay before revision checks.
A failed transaction leaves no receipt or partial rows. Automatically retry only
confirmed revision conflicts. A timeout may mean the transaction already committed.

For a database restore, use a separate project to validate the snapshot first.
Confirm the target account/project, row counts, policy definitions, timings, and
storage references before replacing live data. An in-app restore merges records
and replaces matching progress/settings; it does not remove unrelated records or
replace existing timing IDs. Validation and all restore writes happen before one
transaction commits. Imported ownership and version metadata are ignored.

## Monitoring

`/api/health` makes bounded, read-only checks of Supabase REST and Clerk's public
JWKS endpoint. The database probe selects zero rows from `problem_progress`;
Supabase can deny API schema discovery to public keys even when table reads work.
It returns provider status flags, never credentials or user rows.
A healthy response does not prove authenticated RLS, applied migration versions,
Realtime publication, or database backups. Vercel functions have a 15-second budget;
individual external requests have shorter deadlines.

`.github/workflows/uptime.yml` checks the landing page and readiness endpoint hourly
and on manual dispatch. GitHub reports failed workflow runs; enable the account's
workflow notifications if alerts are desired. Scheduled runs depend on GitHub's
scheduler and repository settings. Enable them after the readiness endpoint is
actually deployed.

Set `VITE_SENTRY_DSN` to enable client error reporting and `VITE_APP_VERSION` for
release identification. No reporting is enabled without a DSN. Error reporting
strips messages, request data, user identity, extras, and breadcrumbs. No replay
or performance tracing is configured. Configure alerts in the chosen Sentry
project; adding the SDK does not create an account or alert destination.

Require the Reliability checks workflow in GitHub branch protection. CI runs unit,
PostgreSQL, browser, build, and audit checks. Dependabot opens weekly dependency
updates. Review major upgrades with sign-in, save/retry, and backup verification;
do not force updates past failed build or browser checks.

## CLI access and staging

The production project is Vercel `lc-tracker`, project ID
`prj_1wLEIfzof3VCsOGMZEAsgVLMBpOB`, serving `lc-tracker.app`. Confirm the linked
project with `vercel project inspect lc-tracker` before deploying. Check access
with `vercel whoami` and `gh auth status`. Pull production configuration to a
private temporary file, not to a tracked file:

```sh
vercel env pull /private/tmp/lc-tracker-production.env --environment=production --yes
```

For Supabase administration, run `npx --yes supabase@2.119.0 login --agent no`.
Complete its browser login and enter the verification code in that terminal.
The explicit agent flag allows the interactive login rather than machine output.
Do not paste access tokens into chat or commit them. A scoped personal access
token saved with `supabase login --token` is another option; grant only the
project permissions needed for database inspection, backup, and migration.
The production Supabase project reference is `blqlgtwmigajizcfldiv`; compare it
with the URL pulled from Vercel before any database mutation.

To build a production-configured deployment without switching the live domains:

```sh
vercel deploy --prod --skip-domain --yes
vercel curl /api/health --deployment <deployment-url>
```

`vercel curl` handles protected deployment access. Staging a deployment does not
apply migrations or authorize promotion past missing schema. Apply the migration
and verify it first, then use `vercel promote <deployment-url>` to switch domains.
Public browser checks should run against the custom domain after promotion.

On October 6, 2026, the custom domain was live on the August 11 deployment of
`c08b6cc`, and all six public browser smoke checks passed. The required revision
columns were absent and `/api/health` returned 404. Vercel and GitHub CLI access
worked; Supabase administrator login was still required. These public checks do
not establish authenticated saves or database recovery.

The reliability release is staged on Vercel with a healthy readiness response.
GitHub's complete reliability workflow passed on release commit `f7a19f8`.
Branch protection requires the GitHub Actions `verify` check, including for
administrators, and prevents force pushes and branch deletion. Keep the release
PR unmerged until the database prerequisites are satisfied: merging `main`
triggers Vercel production deployment. The runtime is pinned to Node.js 24 so
Vercel will not silently select a future major release.
