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
| `npm run test:api` | PostgreSQL plus PostgREST 14.5 HTTP conflicts, pool recovery, JWT RLS, and retry receipts |
| `npm run verify:backup -- <archive-path>` | Private PostgreSQL archive restore and migration preservation in an isolated local cluster |
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

## Free Study Chat and personal keys

**Rollout status on November 18, 2026.** Production supports built-in shortcuts
and personal OpenRouter keys. The hosted allowance and direct Gemini and Claude
connections passed local fixture checks. Production activation requires the
migration, server configuration, and staged verification. The project owner
still needs to supply the shared prepaid key and the separate owner key.
`.env.example` leaves both key values blank. Local previews use scripted replies.

Apply `20261118000000_coach_turns.sql` before enabling server-side chat. The
private ledger holds turn metadata, reservations and charges for 35 days. It
tracks usage by UTC day and month, outside learner backups.

1. In the linked Vercel project, set the server-only `COACH_ALLOWED_ORIGINS`
   to the exact allowed app origins, separated by commas. Use a separate list
   and isolated Supabase and Clerk instances for testing. Set
   `COACH_SUPABASE_SECRET_KEY` to a dedicated Supabase server secret.
2. For free access, set `COACH_OPENROUTER_API_KEY` to a dedicated key on prepaid
   OpenRouter with auto-top-up off. This one server key funds the free allowance
   for every eligible signed-in account. Set an OpenRouter key limit as a second
   spending control. Set `COACH_MONTHLY_BUDGET_MICROS=5000000` for a $5 monthly
   inference cap. The shared daily cap is the lesser of $1 or the configured
   monthly cap. Each signed-in account gets two questions per UTC day. OpenRouter
   credit purchase fees are separate from this inference cap.
3. For the owner, set `COACH_OWNER_USER_ID` to the verified Clerk user ID. Set
   `COACH_OWNER_OPENROUTER_API_KEY` to a different key with separate funding.
   The server compares the verified Clerk subject against `COACH_OWNER_USER_ID`.
   Once this ID is set, hosted access for that account requires its separate key.
   The owner uses the provider's limits without an app-funded allowance. Keep
   the balances separate so owner usage cannot drain public credits.
4. Keep these credentials in Vercel server environment variables. Use
   `COACH_HOSTED_ENABLED=true` and redeploy after the ledger and keys are
   ready. Confirm a signed-in test user can use both free questions, sees the
   next reset, and can still use the built-in shortcuts. Confirm the owner label
   and billing in OpenRouter Activity. Run a staged `/api/health` and
   `/api/leetcode-ac` smoke check before promotion.

The hosted route reserves $0.004 per question for intent selection and optional
synthesis. The reservation is based on the pinned model's price ceilings,
bounded text and output, and zero per-request fees. The ledger settles reported
costs upward to the next microdollar. When cost is unavailable, it keeps the
per-call ceiling. A lost settlement keeps the original hold. An unexpected charge
above the per-call ceiling blocks further free reservations in the current
month. Inspect `coach_private.turns` and OpenRouter Activity for reconciliation.
Never log request bodies, headers, provider keys or chat content.
[OpenRouter usage and spend controls](https://openrouter.ai/blog/tutorials/team-spend-controls-setup/)

Set `COACH_HOSTED_ENABLED=false` and redeploy to stop hosted access. Disable the
dedicated OpenRouter keys for an immediate stop across all deployments. The
ledger prunes expired rows on new admissions. If the route is left inactive,
the database owner can delete rows older than 35 days. If hosted accounting is
lost during recovery, keep hosted access off until the current billing period's
usage is reconciled.

The same authenticated route supports personal Gemini and Claude keys once the
server-only origins and ledger secret are set, independent of the hosted flag.
They use Gemini 3.1 Flash-Lite and Claude Haiku 4.5 and retain provider rate and
spending limits. Use a billing-enabled Gemini project or a Claude Console key
scoped to a workspace. Personal OpenRouter keys go directly from the tab to
OpenRouter and use GPT-4.1 Nano on Azure. Direct OpenAI key entry is pending a
supported connection flow.

`npm run test:e2e -- e2e/coach*.spec.ts` uses scripted replies and fixture
credentials. The local Vite fixture exercises the chat UI without a live model
call. `npm run test:db` checks the private ledger, and `npm run test:api` races
authenticated requests against an isolated PostgREST instance at the budget
boundary. Check live provider replies and billed usage separately with synthetic
study data on a protected deployment.

## Email and password sign-in

In the existing LC Tracker Clerk instance, go to **User & authentication**.
Under **Email**, enable **Sign-up with email**, **Require email address**,
**Verify at sign-up** with an email verification code, and **Sign-in with
email**. Under **Password**, enable **Sign-up with password**. Keep the
passwordless sign-in methods under **Sign-in with email** off so Clerk asks for
a password after the user enters their email address. Password recovery still
uses an emailed verification code.
Keep the existing Google connection enabled. The Clerk forms at `/login` and
`/sign-up` reflect the instance settings. See
[Clerk's sign-up and sign-in options](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options).

Before promoting the release, use dedicated test accounts to verify email
sign-up, verification, onboarding, password sign-in, and password reset. Use a
Google test account that already completed onboarding to confirm its Clerk user
ID, saved plan, and history survive signing out and back in. Compare the Clerk
user ID with the same account before the change. A separate Clerk instance has
different user IDs and cannot verify continuity for existing production accounts.

When email and password are enabled, Clerk shows **Forgot password?** in the
password sign-in flow. Confirm that a test user can receive the emailed reset
code, set a new password, and sign in to the same workspace. [Clerk password reset flow](https://clerk.com/docs/guides/development/custom-flows/authentication/forgot-password)

## Adding another sign-in provider

Once deployed, the Clerk widgets on `/login` and `/sign-up` show the providers
configured on their Clerk instance. To try GitHub in development, go to
**SSO connections** in the Clerk Dashboard, select **Add connection** →
**For all users** → **GitHub**, and use Clerk's shared credentials.

### GitHub in production

1. Select the existing LC Tracker production instance. In **SSO connections**,
   add **GitHub** for all users. Enable it for sign-up and sign-in, choose
   **Use custom credentials**, and select **GitHub App**. Copy the
   callback URL Clerk provides.
2. In GitHub, use a **GitHub App** with `https://lc-tracker.app` as its homepage
   and the exact Clerk callback as its redirect URI. Allow **Any account**,
   keep user token expiration on, turn off webhooks and authorization during
   installation, and grant **Read-only** access to **Account permissions →
   Email addresses**. Generate a client secret under **Credentials → Client
   secrets**.
3. Enter the GitHub Client ID and Client Secret in the Clerk connection and
   save it. Keep the secret in Clerk and keep Google enabled.
4. In a signed-out browser, try GitHub on `/login` with a test account. Verify
   that an existing test user with the same verified email on GitHub and Clerk
   reaches the same workspace. Also check that Google still opens that user's
   saved plan and history.

For other providers, follow the matching Clerk guide for credentials and
callback setup. [GitHub setup](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/github) · [Social connections](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/overview) · [Account linking](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/account-linking)

## Release order

1. Export the current Supabase database using the provider's database backup/export
   mechanism. Store it privately and confirm that it can be restored in a separate
   project. The in-app JSON export covers the signed-in user's study data, not
   authentication, feedback storage, database policies, or other users.
2. Confirm the deployed migration history. Apply any missing prerequisite schema,
   Clerk-ID/RLS, and session-rating migrations, then apply
   `supabase/migrations/20261006000000_reliable_user_writes.sql` and
   `supabase/migrations/20261006000001_clerk_feedback_storage.sql`, followed by
   `supabase/migrations/20261006000002_postgrest_conflict_status.sql`, then
   `supabase/migrations/20261006000003_study_evidence.sql`, with the
   authenticated database administration tool for the correct project. Do not run
   the historical migrations blindly on an unknown production schema.
3. Confirm `version` exists on settings, progress, and sprint state; the
   `commit_user_change` and `export_user_data` RPCs exist; authenticated table grants
   are present; and the five user tables are in the Realtime publication. The new
   reliability migration sets these up. Its functions are SECURITY INVOKER and
   retain RLS. Feedback image upload/delete policies must use the Clerk subject
   for the first path folder and apply only to the authenticated role.
   The study migration adds nullable `problem_progress.study_state` and recall
   operations. Confirm that an older payload omitting this column preserves it.
   Run the study SQL suite in a rolled-back transaction before the client release.
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

The local test harness bootstraps the Supabase auth/role and Storage metadata
surfaces needed to exercise persistence and ownership policies. It does not
reproduce hosted Clerk token verification, image storage, or all Supabase platform
settings.

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

For a PostgreSQL custom-format archive, `npm run verify:backup -- <archive-path>`
creates an isolated local cluster using PostgreSQL binaries on PATH (17+ for the
current hosted database). It restores `auth`, `storage`, and `public`, compares
application row counts and checksums before/after the reliability and study migrations,
and runs both persistence suites inside a rolled-back transaction. The recovery
cluster creates the Realtime publication before restoring table attachments.
It never connects
to production. Platform ownership/grants are skipped and the Supabase outbound
webhook function is disabled. This checks application recovery; it does not restore
the Supabase platform, test notification delivery, or include stored image bytes.

On macOS with the installed PostgreSQL 17 tools:

```sh
PATH=/opt/homebrew/opt/postgresql@17/bin:$PATH npm run verify:backup -- /private/path/database.dump
```

If Docker is unavailable, the CLI's `db dump --dry-run` emits a native `pg_dump`
script. Capture it privately: it contains temporary database credentials. Use a
dump client at least as new as the hosted PostgreSQL major version. A full custom
archive can be taken with `pg_dump --format=custom --role=postgres`; protect the
result and never print connection settings or commit the archive.

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
vercel curl '/api/leetcode-ac?username=<test-username>&limit=1' --deployment <deployment-url>
```

`vercel curl` handles protected deployment access. Staging a deployment does not
apply migrations or authorize promotion past missing schema. Apply the migration
and verify it first, then use `vercel promote <deployment-url>` to switch domains.
Public browser checks should run against the custom domain after promotion.
The LeetCode function must load under native Node ESM, not only Vite's resolver.
Use `.js` extensions in its relative imports; the unit suite compiles the function
and loads it in a separate Node process to catch missing-module startup failures.

On October 6, 2026, the custom domain was live on the August 11 deployment of
`c08b6cc`, and all six public browser smoke checks passed. The required revision
columns were absent and `/api/health` returned 404. Vercel and GitHub CLI access
worked; Supabase administrator login was still required. These public checks do
not establish authenticated saves or database recovery.

The release audit obtained a private full PostgreSQL archive and restored auth,
storage metadata, and all nine application tables into isolated PostgreSQL 17.
All 290 existing application rows were preserved by the missing rating migration
and the reliability migration. Both migrations were then applied transactionally
to production and recorded in `supabase_migrations.schema_migrations`. Earlier
manual migrations were not blindly replayed or marked applied. The deployed schema
now has ratings 1–5, revision columns, SECURITY INVOKER RPCs, receipt RLS, and all
five study tables in the Realtime publication. Hosted transaction/RLS checks passed
with synthetic accounts inside a rolled-back transaction.

Supabase reported no available physical backups and PITR disabled at this audit.
The private pre-release archive is outside the repository under the local
`Library/Application Support/LC-Tracker/backups` directory. A logical database
archive does not include Storage object bytes. Scheduled off-device backups and
PITR are separate operational work; this release does not claim either is enabled.

The reliability release was promoted to `lc-tracker.app` after the database checks.
The live readiness endpoint reports both providers healthy, the LeetCode proxy
returns HTTP 200 JSON, and all six live public browser checks pass. GitHub's full
reliability workflow passed on `d851959` and the release was merged through PR #262.
The Supabase Management API confirms a custom OIDC integration trusting
`https://clerk.lc-tracker.app`. The CLI config template's disabled Clerk section
does not represent that hosted custom integration; verify the integrations API
before changing authentication configuration.
Branch protection requires the GitHub Actions `verify` check, including for
administrators, and prevents force pushes and branch deletion. Keep the release
PR unmerged until the database prerequisites are satisfied: merging `main`
triggers Vercel production deployment. The runtime is pinned to Node.js 24 so
Vercel will not silently select a future major release.

The final Storage audit found the old UUID policies still deployed for feedback
images. Forward migration `20261006000001_clerk_feedback_storage.sql` was applied
transactionally and recorded in production migration history. It switches
upload/delete ownership to the Clerk subject and rejects anonymous writes. Its
PostgreSQL checks cover owned uploads/deletes, cross-account denial, and unrelated
buckets. The historical migration was not replayed. The site owner confirmed a
real Google sign-in, one completed/rated study session, and its persistence after
refresh on the released site. Actual feedback delivery and image bytes were not
tested through the live Storage API.

The owner's study-time slider report was reproduced with a delayed save. The
weekday and weekend targets now edit locally and save together with the
`Save study time targets` button. Failed saves retain the draft; a same-field
conflict requires `Use saved targets` before editing again. Browser checks cover
both cases and persistence after refresh. Backups also accept the `None` weekly
rest-day value (`-1`).

The final readiness check exposed an API pool exhausted by stale saves: the
deployed PostgREST 14.5 retries SQLSTATE `40001` internally without new RPC inputs.
The revision checks introduced in the reliability migration used that code.
Forward migration `20261006000002_postgrest_conflict_status.sql` was applied and
recorded in production; it changes only those errors to `PT409` (HTTP 409), leaving
the transaction, RLS, and receipts intact. The pool recovered and readiness
returned HTTP 200. A targeted termination query for the observed looping RPC
sessions found no remaining matches after the function replacement; no project
restart or user-data restore was needed.

`npm run test:api` now uses the production PostgREST version against a disposable
cluster with local fixture JWTs. It sends more stale writes than pool slots,
requires prompt HTTP 409 responses, confirms reads remain available, and tests
fresh writes, lost-response receipts, and account isolation. CI downloads the
official 14.5 binary and verifies its archive digest. The same HTTP regression
timed out with the old conflict function and passed with the forward repair.
Do not generate `40001` for
application conflicts. See the [Supabase explanation and recovery procedure](https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b).
