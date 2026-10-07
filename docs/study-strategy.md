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
interval multipliers, caps, seven-day evidence threshold, weekly unseen check,
35-minute unfamiliar check limit, remediation threshold, and continuation rotation
are product defaults. They are not empirically optimized for coding or estimates of recall probability.
Correctness, assistance, explanations, and recall checks are self-reported;
there is no automatic judge or AI grader in this release.

## One plan and one budget

`src/utils/study.ts` owns task selection and allocation. Recorded timing and uncommitted active session time reduce
the daily budget without double counting a saved timing ID. Each problem appears at most once in a plan, across all task
kinds. The three-minute recall allocation is approximately 30% of the daily
budget minus recall time already recorded. Selection first mixes patterns, then
fills available recall capacity. Rest days and inclusive scheduled breaks have
no automatic assignments. Skipped assignments affect the current view only.

Sunday, Monday, Wednesday, and Friday normally build new coverage, except the
maintenance day. Within 30 days of an upcoming interview, ordinary main blocks
prioritize implementation. A past or missing target does not impose this phase.
An ordinary maintenance block on the last day before the weekly rest day samples
the oldest eligible coding check; the protected unfamiliar slot can take priority.
Other coding blocks prioritize demonstrated gaps, then an independent pass that
is due for a delayed coding check. Imported backlog cannot crowd out that delayed
check on ordinary implementation days.

A related unfamiliar problem receives a protected block when no first unseen
attempt has been recorded in the previous seven calendar days. This applies near
an interview and takes priority over old imports and unfinished work. The slot
requires available, accessible unseen problems and exposure to at least two
representatives in the same pattern or fallback category. Exposure is not proof
of proficiency. Guided mode respects prerequisite exposure; hard checks require
two currently independent representatives. Checks rotate categories and prefer
curated NeetCode 250 problems, then related extended-catalog items when curated
choices are exhausted. No finite catalog can supply unfamiliar problems forever.

The unfamiliar block reserves up to 35 minutes before recall warm-ups, so a small
daily budget can go entirely to the check. Dashboard and timer hide its topic and difficulty cues. The user codes on LeetCode without
notes or hints, checks tests, and explains correctness, complexity, and edge cases.
The timer marks the end of the block; it never auto-grades or auto-saves. A shorter
block or a long attempt can end unfinished and continue as ordinary coding practice.
LeetCode's own page may expose tags; the app cannot hide those external hints.

Ordinary learning blocks switch to repair when fewer than half of at least four
completed, measured coding outcomes in the last 14 days are independent passes,
or two current gaps exist in the next topic. Unchecked, unfinished, legacy ratings,
and imported acceptances do not establish this failure rate. The protected unseen
slot remains a periodic check even during remediation. Current proficiency used
for selection requires the latest coding result to be independent and newer than
any recall lapse; a successful recall cannot restore independent coding evidence.

Unfinished attempts receive continuation blocks, but after three consecutive blocks
or twice an estimated full attempt's minutes, the item rotates out for three
calendar days. The stored attempt and active session draft remain intact. Later
blocks can return to it. Full-attempt estimates use recorded attempts of the same
category and difficulty and exclude known unfinished blocks.

Guided order builds representative coverage across patterns before adding depth.
Mixed order also favors under-covered patterns. The selected curriculum defines
core coverage; related checks can come from the larger catalog. The premium
preference constrains all assignments. A coding block may be shorter than the
estimated full attempt and supports unfinished continuation.

## Evidence and schedules

A recall attempt saves the original answer from memory, outcome, reference type,
and elapsed time in `problem_progress.study_state.recallHistory`. References stay
hidden until comparison. The 250 core library problems have attributed, bundled
NeetCode explanations with Python/C++ examples and problem-specific YouTube links.
Full-catalog items outside that union still use notes or external explanations;
general pattern guidance is never presented as an exact solution.

The answer remains editable during comparison and recording. A snapshot taken
before revealing the reference stays in `answer`; a later correction is optional
`revisedAnswer`, and the outcome concerns the original answer. An explicit
comparison button opens the outcome choices. Personal explanations and optional
fenced code examples use the existing notes field and save with the recall
outcome. Switching to the built-in view preserves personal notes. Removing those
notes is explicit. Drafts, comparison progress, and a frozen completion survive
reloads and retry with the same operation ID. A completion is fixed once saving
starts so a lost response cannot change its payload. Recall timers support
pause/resume and pause when leaving the page. See [reference provenance and
verification](problem-references.md).

Recall does not append coding ratings, change the last coding date, or increment
the coding review counter. Recall success can lengthen only the recall interval.
A partial or forgotten answer brings a future coding check closer. Coding results
record tests passed/failed/unfinished/unchecked, assistance, explanation, practice
kind, actual timestamp, and timing ID. An independent pass requires passed tests,
no hints or solution, and a clear explanation.

Coding completion starts with a compact result choice. `Solved independently`
explicitly reports all three facts together; other results ask only for assistance
and explanation. Notes and confidence are optional. New unrated attempts retain a
numeric `3` for compatibility with the existing database rating column and mark
`confidenceReported: false` in coding history. This placeholder is not displayed
as self-confidence or used in confidence-based legacy momentum. Coding outcomes
control review intervals and any remaining sprint check. Draft result selections,
optional confidence, and the frozen completion survive reloads and exact retries.

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
independent pass on the first unseen-variant attempt. A later re-solve or
continuation cannot replace that first-attempt transfer evidence. These labels
describe recorded evidence, not a promise of interview success. Maintenance remains eligible for future practice.

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
minutes. Analytics exposes numerator/denominator context and the time window. Its complete
category ledger includes all 18 major categories, both DP categories separately,
and explicit rows for topics outside the selected curriculum. The more specific
pattern ledger supplements that coverage. Encounter counts do not prove learning.
The two-week evaluation counts only the first measured coding attempt on an unseen
variation, not later re-solves or continuations. It reports independent unfamiliar
passes within 35 recorded minutes, unknown/zero timing and early unfinished blocks
separately, and advice based on measured failures, missing unseen checks, and delayed coding evidence.
Unchecked outcomes do not enter the completed-coding success rate. This is a
practice evaluation, not a readiness score or a calibrated pass prediction.
Do not optimize for raw solved count or average confidence alone. Adjust the allocation or interval heuristics based on this
observed evidence, without relabeling old outcomes.

Regression coverage lives in `src/utils/study.test.ts`, user-data service tests,
`e2e/study.spec.ts`, `supabase/tests/study.sql`, and the real PostgREST harness.
`src/utils/studySimulation.test.ts` runs four-week imported-backlog scenarios at
30/60/120 daily minutes, measured-failure scenarios, and eight-week fresh-account
budget scenarios. It exercises unfinished blocks, deduplication, premium exclusion,
rest days, and protected weekly unseen selection. All outcomes are synthetic.
The 43-item backlog is also a synthetic test fixture. Browser auth is simulated locally;
passing these tests does not establish real Google OAuth or a learning outcome.
