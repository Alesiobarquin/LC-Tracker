# Study strategy

LC Tracker combines short, closed-notes recall checks with independent coding,
new learning, and unseen variations. The target is durable problem-solving skill,
not permanent memorization of an exact list or a predicted interview pass rate.

## Evidence and limits

Spacing and retrieval practice have evidence across learning tasks:
[Carpenter, Pan, and Butler (2022)](https://www.nature.com/articles/s44159-022-00089-1).
[Rohrer, Dedrick, and Burgess (2014)](https://pubmed.ncbi.nlm.nih.gov/24578089/)
found benefits from interleaving mathematics practice, which requires selecting
an appropriate strategy. Applying this principle to mixed coding reviews is an
inference; that experiment did not test LeetCode.
[Pan and Rickard (2018)](https://pubmed.ncbi.nlm.nih.gov/29733621/) reviewed transfer
from retrieval practice and found that practice and assessment conditions matter.
The app therefore records unseen variation attempts separately from repeated
questions. [Smolen, Zhang, and Byrne (2016)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5126970/)
review biological mechanisms of spaced learning. Those mechanisms do not
establish specific calendar intervals for coding problems.

The app's 30% recall allocation, three-minute recall estimates, weekly rhythm,
interval multipliers, caps, and seven-day evidence threshold are product defaults.
They are not empirically optimized for coding or estimates of recall probability.
Correctness, assistance, explanations, and recall checks are self-reported;
there is no automatic judge or AI grader in this release.

## One plan and one budget

`src/utils/study.ts` owns task selection and allocation. Recorded timing and uncommitted active session time reduce
the daily budget without double counting a saved timing ID. Each problem appears at most once in a plan, across all task
kinds. The three-minute recall allocation is approximately 30% of the daily
budget minus recall time already recorded. Selection first mixes patterns, then
fills available recall capacity. Rest days and inclusive scheduled breaks have
no automatic assignments. Skipped assignments affect the current view only.

Sunday, Monday, Wednesday, and Friday are learning days, except a day reserved
for maintenance. Other main blocks prioritize implementation. The last day
before the weekly rest day (Saturday when no rest day is configured) samples the
oldest eligible coding check; other coding days first address a demonstrated gap.
An unfinished coding attempt receives a continuation block. A real upcoming
interview within 30 days shifts main blocks toward implementation. A past or
missing target does not impose an interview phase.

Guided order builds representative coverage across patterns before adding depth
in one topic. Mixed order also favors under-covered patterns. New problems in a
pattern with two independently passed representatives are recorded as unseen
variants. The selected curriculum defines core learning coverage; once it is covered,
related unseen variations can come from the larger NeetCode 250 catalog. The
premium preference constrains all assignments. Guided order respects recorded
prerequisite exposure.
A coding block can be shorter than the estimated full attempt: its UI explicitly
calls it a block and supports recording unfinished work for another day.

## Evidence and schedules

A recall attempt saves an answer, outcome, reference type, and elapsed time in
`problem_progress.study_state.recallHistory`. Notes and general pattern guidance
are hidden until the attempt is made. The comparison is a self-check against
saved notes, a pattern reference, or the external problem explanation; general
pattern guidance is not presented as an exact solution. Drafts and a frozen
completion survive reloads and retry with the same operation ID. Recall timers
support pause/resume and pause when leaving the page.

Recall does not append coding ratings, change the last coding date, or increment
the coding review counter. Recall success can lengthen only the recall interval.
A partial or forgotten answer brings a future coding check closer. Coding results
record tests passed/failed/unfinished/unchecked, assistance, explanation, practice
kind, actual timestamp, and timing ID. An independent pass requires passed tests,
no hints or solution, and a clear explanation.

Each item has separate recall and coding intervals. Delayed success extends an
interval; failures shorten it. Same-day rehearsal does not grow intervals.
Longer dates have deterministic spreading based on problem, date, and modality,
so retries do not introduce new randomness. Coding intervals are capped at 120
days and recall intervals at 90 days. Intensity affects future coding attempts;
changing settings never rewrites histories or batches new dates.

A problem enters maintenance after two independent passes with a gap of at least
seven calendar days since the preceding coding attempt. Daily rehearsal over a
week does not qualify. A subsequent coding or recall lapse invalidates that
retention evidence until re-established. A pattern is established after two
currently dependable representatives (or all available if fewer), plus an
independent unseen-variant pass. These labels describe recorded evidence, not a
promise of interview success. Maintenance remains eligible for future practice.

## Existing data and persistence

Existing ratings, dates, notes, histories, and legacy retirement flags are
preserved. Reads derive assessment needs without mutation. Legacy retirement is
not treated as proof of independent retained implementation. New LeetCode imports
keep the original accepted-submission date and an empty coding history; current
confidence remains unknown. Their recall assessment is eligible immediately and
the capacity allocator distributes it over study days. Old accepted submissions
are not invented failures or fabricated strong passes.

Forward migration `20261006000003_study_evidence.sql` adds nullable `study_state`
and extends the existing SECURITY INVOKER RPC. Recall state, timing, practice
activity, and its retry receipt commit together. Revisions still use PT409.
A still-open older client omitting the new column cannot erase recall evidence.
Version 2 JSON exports include recall and coding metadata; old exports and an
empty interview target are supported. Historical sprint records remain in
backups, but do not control the new daily planner.

## Evaluation

Evaluate a two-week study period using recall outcomes, independent delayed
coding attempts, hint use, unseen-variant outcomes, pattern coverage, and actual
minutes. Analytics exposes numerator/denominator context and the time window;
unknown outcomes are excluded. Do not optimize for raw solved count or average
confidence alone. Adjust the allocation or interval heuristics based on this
observed evidence, without relabeling old outcomes.

Regression coverage lives in `src/utils/study.test.ts`, user-data service tests,
`e2e/study.spec.ts`, `supabase/tests/study.sql`, and the real PostgREST harness.
The 43-item backlog is a synthetic test fixture. Browser auth is simulated locally;
passing these tests does not establish real Google OAuth or a learning outcome.
