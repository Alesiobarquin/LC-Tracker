# Operating LC Tracker

## Local setup and checks

Use Node.js 22.12+ (24 is also supported), `npm ci`, and a local `.env` copied from
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
JWKS endpoint. It returns provider status flags, never credentials or user rows.
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

## Production access at the time of this change

The local Vercel credential was invalid. Only browser Supabase keys were available;
no database administrator credential was configured. No production migrations,
deployments, provider alert settings, or branch-protection changes were performed.
This commit is prepared for release; the service-dependent steps above still need
working account access. Do not describe local or mocked tests as production checks.
