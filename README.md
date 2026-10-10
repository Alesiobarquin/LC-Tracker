# LC Tracker

A personal LeetCode practice app that helps choose what to work on next and when
to revisit a problem. It builds a daily plan from a time budget and recorded
practice, with separate checks for recalling an approach and implementing it.

[Live app](https://lc-tracker.app/) · [Browse the library](https://lc-tracker.app/library) · [Study strategy](docs/study-strategy.md)

I started this for my own interview preparation as a student. I wanted a more
structured alternative to a spreadsheet for choosing problems and keeping review
history. The first version stored data in the browser; it later gained accounts
and database persistence when a friend wanted to use it too.

## What a session looks like

1. Set weekday and weekend study time, rest days, and a problem list. The planner
   mixes due reviews, new learning, unfinished work, and unfamiliar variations
   within the available time.
2. For a recall check, write the approach from memory before revealing a reference.
   Compare it with a built-in explanation or personal notes, then record what was
   recalled. The original answer and later corrections are stored separately.
3. For a coding block, work on LeetCode and record the test result, help used, and
   whether you can explain the solution. Pause the timer or correct the minutes
   and seconds before saving. Recorded time reduces the remaining daily budget.

The library, pattern lessons, and Python syntax cards are available without
signing in. An account is needed to save study settings and history. Analytics
shows recorded practice and outcomes; a successful recall check remains separate
from a coding pass.

## Implementation

| Part | Responsibility | Code |
| --- | --- | --- |
| React, TypeScript, Vite | Browser interface and daily planning | [planner](src/utils/study.ts), [dashboard](src/components/Dashboard.tsx) |
| Zustand and TanStack Query | Session drafts in sessionStorage; fetching and refreshing saved data | [session store](src/store/useStore.ts), [data hooks](src/hooks/useUserData.ts) |
| Clerk and Supabase PostgreSQL | Authentication, account ownership through row-level security, and transactional saves | [client setup](src/lib/supabase.ts), [user-data service](src/services/userData.ts), [migrations](supabase/migrations) |
| Vercel | Static hosting and a read-only proxy for recent accepted LeetCode submissions | [proxy](api/leetcode-ac.ts), [readiness endpoint](api/health.ts) |

Planning runs in the browser. Related session records—progress, timing, activity,
and applicable sprint state—save in one database transaction. The browser freezes
the completion and persists its operation ID before sending, so a lost response
can be retried without counting the session twice. Database revision checks catch
stale edits from another device. See the [service map and reliability notes](docs/reliability-review.md).

## A bug in session saving

An earlier version used PostgreSQL error `40001` for application revision
conflicts. PostgREST 14.5 retried those requests with the same stale inputs, which
could occupy the connection pool. A [forward migration](supabase/migrations/20261006000002_postgrest_conflict_status.sql)
changed that error to `PT409` (HTTP 409); the client retries with fresh reads.

The [HTTP regression harness](scripts/test-postgrest.mjs) starts PostgREST against
an isolated database with a pool limited to two connections, sends four stale saves, checks
that they return 409, then checks that reads, a fresh save, and a duplicate retry
still work. This exercises the API middleware as well as the SQL. The
[operations notes](docs/operations.md) record the incident and release checks.

## Validation and limits

[CI](.github/workflows/ci.yml) runs TypeScript checks, unit tests, PostgreSQL and
PostgREST checks, Playwright browser tests, solution-example checks, a production
build, and a dependency audit. The [browser tests](e2e/study.spec.ts) cover drafts,
corrected timings, failed saves, reloads, and retries in desktop and mobile layouts
and both themes. Authenticated browser tests use simulated Clerk and Supabase
responses; they do not verify the hosted sign-in integration.

The [planner simulations](src/utils/studySimulation.test.ts) exercise multiweek
budgets, imported backlogs, unfinished attempts, and unfamiliar checks using
synthetic outcomes. They check scheduling behavior, not learning improvement.
Results and explanations are self-reported: the app does not execute submissions
or grade answers. Scheduling intervals are product defaults, and the project has
not established improved retention or interview performance. It has no scheduled
tutor or reminder delivery service.

## Run locally

Use Node.js 24 and a separate Clerk/Supabase development setup. Follow
[operations.md](docs/operations.md) for database prerequisites and authentication
configuration before testing saved data.

```sh
npm ci
cp .env.example .env.local
# Fill in the Clerk and Supabase browser configuration.
npm run dev
```

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Database checks additionally need PostgreSQL binaries on PATH, and the API checks
need PostgREST 14.5:

```sh
npm run test:db
npm run test:api
```

Those checks create and remove a local database cluster without loading production
credentials. Setup, migration order, backups, and rollback are documented in
[operations.md](docs/operations.md).

## Attribution

Development uses AI coding assistance, including implementation, tests, and
documentation. Built-in explanations and solution code include adaptations from
NeetCode and Peng-Yu Chen's walkccc/LeetCode project; they are credited alongside
the references. [Reference provenance](docs/problem-references.md) documents
pinned sources, adaptations, and the scope of the example checks. Problem metadata
comes from LeetCode; this is an independent project.

LC Tracker is [MIT licensed](LICENSE). Bundled references retain their
[NeetCode](public/neetcode-license.txt) and [walkccc](public/walkccc-license.txt)
license notices.
