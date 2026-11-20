# LC Tracker study chat

Implementation plan · Started November 18, 2026

The site-wide planner tools and personal OpenRouter flow are in production.
Hosted funding and direct Gemini and Claude connections are implemented
locally. Production activation needs the migration, credentials and staged
checks. Study Chat can now compare today's assignments with recent practice
and recall and coding due dates for a topic. The rest of ticket 5 remains planned.
[Current rollout status](operations.md#free-study-chat-and-personal-keys)

## What to build first

Give a signed-in learner a private chat where they can ask **“What should I spend my next 20 minutes on, and which of my attempts led you there?”** The answer should show how much time is available, point to actual records, distinguish successful recall from independent coding, and offer one action the learner can take. A learner with only imported submissions should get a different answer from someone who recently passed a delayed coding check. Both should be able to inspect the reason.

Build chat as a second way to operate LC Tracker. **Starting a recommended problem from chat must immediately put Today into its active-session state. Starting it from Today, the library or a lesson must immediately put the chat card into that same state.** Completing it from either surface records one outcome and changes the next recommendation on both. This round trip is the first working feature and a release requirement.

Build the shared actions and live plan first. Then extend tool coverage across the product, connect a user-funded model, and evaluate recommendations. The six tickets below describe the full implementation. The first ticket is a review checkpoint. Owner funding has its own launch decision.

## One plan, two ways to operate it

| User action | What Today shows | What chat shows or does |
| --- | --- | --- |
| Ask for a recommendation | Current plan stays visible while the learner considers options. | Show an eligible problem with a reason and **Start**. “Make it my next problem” accepts an eligible alternative for that slot without starting the clock. |
| Accept an alternative from either surface | That slot shows the selected problem, task kind and allocated minutes. The rest of the sequence still fits the budget. | The same problem is marked **Selected for Today**. Replacing or skipping it in Today updates the card. “Start it” works from either surface. |
| Start from chat, Today, Library or Patterns | The active problem replaces the next assignment and the usual Resume control appears. | The actionable card switches to **In progress** for that session ID. A second start resumes it. Other suggestions lose their Start controls while the draft exists. |
| Pause, correct elapsed time or switch to Reviews only | Timer state, mode and remaining budget follow the ordinary app rules. | Read those exact values the next time the user asks. Update visible controls locally without sending a message to the model. |
| Finish and report an outcome on either surface | While saving, keep the frozen completion. Once confirmed, deduct the recorded time once and calculate the next eligible task. | Show **Saving**, **Save unconfirmed**, or **Recorded** from the actual operation. After confirmation, show the same next task as Today and link to the saved evidence. |
| Change the plan while a recommendation is on screen | Today's latest selection or active session wins. | Keep the old answer dated. Update the live action beneath it. A late model response cannot reselect its old problem or re-enable a stale action. |

**Where shared state belongs.** Extract Dashboard's plan assembly into a hook used by Today, chat and the post-save “Next review” flow where their inputs overlap. Keep `buildStudyPlan` as the allocator. Read owner-scoped React Query data for settings, progress, activity and timings, plus the existing Zustand session state, corrected active seconds, mode, catalog readiness and local date. Keep skip IDs and an accepted slot choice in one small owner/day-scoped piece of workspace state. This extends today's view-only skips across navigation between Today and chat. Keep them in the current tab, clear them on a new day or account, and revalidate a selection whenever eligibility changes. An action card subscribes to these inputs while chat is visible. Opening chat on another page uses the same state immediately. A conversation transcript never acts as a queue or starts a timer on render.

**How to start safely.** Factor the existing start/resume logic into a shared action for `Dashboard.tsx`, `ProblemLibrary.tsx`, `PatternFoundations.tsx`, timer/recall route entry and chat. Create a new active draft with its ID, owner, problem, practice kind, allocation and return destination in one guarded transition. Dashboard currently calls `startSession` and then patches the active session; a rejected second start must never patch somebody else's existing draft. Honor direct library practice and its premium prompt. When the launched problem matches a selected plan task, carry its task metadata through the eligible entry points. Starting a different problem manually makes that actual session visible everywhere. Browsing a problem or explanation alone does not start it.

**What sync means.** Inside the same signed-in app/tab, start, pause, skip, selection and mode changes must render from shared state on the next UI update, including when a view remounts. Confirmed persistent changes refresh the current user's shared queries through `useUserData.ts`. Other signed-in tabs/devices receive saved changes through `useRealtimeSync.ts`, with the existing reconnect/focus/polling recovery. Current timer and recall drafts use tab session storage. A suspended second device can see the confirmed outcome after refetch; it cannot take over a running local timer under today's storage model. No periodic model requests are needed for any of this.

## The conversations worth building

All numbers and dialogue in these examples are illustrative.

| Learner's question | What the answer should do | What the learner can do next |
| --- | --- | --- |
| “I solved a lot this month. Am I getting better?” | Separate imported coverage, recent independent coding, delayed re-solves and first unfamiliar attempts. Say which evidence is missing. If the requested month exceeds the implemented window, offer the exact window available. | Inspect the attempts behind one count or take today's next check. |
| “I keep recognizing sliding window. Can I actually implement it?” | Put recalled approaches beside independent coding outcomes for the same pattern. Show when the same problems were last tried and how much assistance was reported. | Revisit a due representative, or take an eligible blind check without giving away its topic. |
| “I gave this a 5. What happened the next time?” | Pair an explicitly reported post-session rating with the next recorded coding attempt on that problem. Show elapsed days, outcome and help used. Include examples that went well too. | Open the pair and compare the learner's own explanations if they choose to share them. |
| “I have 20 minutes, no premium, and want something besides trees.” | Interpret time and topic as preferences within today's available slot. Show the allocated block, full-attempt estimate, and why an eligible option fits. If a protected check or an active draft takes priority, explain the choice available today. | Start or resume through the ordinary study flow. A change to today's preference expires with the conversation. |
| “Why am I seeing this again if I already solved it?” | Trace import, original attempt, last recall, last independent coding result and due dates for this problem. Use the reason Today already displays. | Open the relevant record or resume the due review. |
| “What do my failed graph attempts have in common?” | Start with observable outcomes. With permission, compare selected notes from two or three sessions and quote the learner's words. Label a suspected recurring mistake as a hypothesis and propose one test case to check it. | Open a cited attempt, edit a draft reflection, or try a pattern lesson. |
| “Help me recover after two weeks away.” | Show time available, pending work, and the first feasible practice block. Explain how the due queue is spread over study days. | Preview Reviews only or resume an unfinished block. |
| “My interview is getting close. What's missing?” | Summarize categories encountered, delayed passes and first unfamiliar checks against the selected curriculum. Pick a gap the record can actually resolve. | Review a proposed practice focus and open Today. |

**Example of a good first answer.** “In the last 14 days you recalled the approach on 4 of 5 recorded graph reviews. You completed 3 measured graph coding attempts and reported solving 1 independently. Your last Number of Islands attempt passed with a hint. Today has an 18-minute coding review available. I'd use it to try the implementation again.” The reply has an expandable list of the contributing records and a single **Start coding review** action, provided the live plan still permits it. If the learner asks “Which part needed the hint?”, the correct answer may be “You recorded that you used a hint. You didn't record what it covered.”

**Cold start.** An empty account gets help choosing and recording its first attempt. An imports-only account can see coverage and take the first assessment. A missed data fetch gets a retry control. An empty history, an unavailable history and a genuine zero need distinct UI states.

## What the current app can establish

| Existing source | Use in chat | Important boundary |
| --- | --- | --- |
| `src/utils/study.ts` · `buildStudyPlan`, `StudyTask.explanation` | Tasks, allocation, reason, weekly unfamiliar slot, deferrals and remaining minutes | Today also supplies live drafts, corrected seconds, local date, Reviews only, skips and catalog readiness. A second call with defaults can give a different answer. |
| `getStudyEvaluation`, `getPatternEvidence`, `getCategoryEvidence`, `getLearningStatus`, `isIndependentPass` | Two-week evaluation, separate recall/coding evidence, delayed checks, first-attempt transfer and curriculum coverage | Keep the existing denominators, including handling of unchecked and unfinished attempts. Preserve the distinction between a problem's latest status and a period's measured outcomes. |
| `src/types/index.ts`, `src/services/userData.ts`, `src/hooks/useUserData.ts` | Owner-scoped progress, session history, timings, settings, study-state source and review dates | Imports establish an encounter. Ratings describe confidence **after** a session. Ignore compatibility ratings marked `confidenceReported: false`. Legacy data without measured outcomes has unknown independence. |
| `src/components/Analytics.tsx` | Study minutes and history drill-down | Recent timings have a bounded fetch window. Older pages use a timestamp/ID cursor. Never describe loaded pages as lifetime totals. Join timing IDs once. Retain unmatched records with an unknown value. |
| `src/data/problems.ts`, `src/utils/patternMapping.ts`, `src/data/problemReferences.ts` | Known problem IDs, accessibility, related patterns and attributed references | Wait for the extended catalog when required. Reference coverage varies. Use the local attribution and distinguish general guidance from a problem-specific solution. |
| `src/store/useStore.ts`, `src/utils/sessionTime.ts`, `Dashboard.tsx`, `RecallPage.tsx`, `TimerPage.tsx` | Active work, frozen saves, corrected time, recall stage and resume behavior | Local drafts can change while an answer is in flight. Read the current owner and session again before displaying sensitive content or starting an action. |

There is no judge result feed for each coding session, reliable record of why a test failed, per-line hint log, or history of predictions made *before* each attempt. The coach can identify a question to investigate from available evidence. Exact diagnoses need the learner's account or a shared artifact. See [study strategy](study-strategy.md), [reference provenance](problem-references.md) and [the service map](reliability-review.md).

## What goes on the screen

- Give the signed-in shell a quiet **Study chat** control that opens beside the current screen (a sheet on mobile), plus a full-page `/coach` view of the same conversation. The in-page control keeps the timer, recall editor, flashcards, settings draft or library filters mounted while the user acts. On Today, add a follow-up inside “Why this recommendation?” On Evidence, add “Ask about these results.” Mount the same chat host on authorized onboarding/admin surfaces that render outside Layout, exposing only their permitted context. Keep prompts and study data out of URLs.
- The first screen has a labeled composer and three real questions based on available records. Show the selected funding source, an understandable data preview, and the connection control. Opening the screen, prefilling a question and viewing evidence cards cost zero model calls. The learner presses Send.
- Render short paragraphs, an evidence block with scope and observation date, and at most one prominent action. The evidence block expands **locally** to show recorded dates, titles, assistance and outcomes. Reuse existing study labels. Add a focused session-detail view or extract Analytics' existing detail modal where necessary. An unresolved historical ID can still show its stored date and outcome.
- Keep one in-memory conversation for the signed-in account across internal navigation. Refresh starts fresh. Include New chat, Stop, Disconnect, and explicit retry. Preserve a failed message in the composer. A stale recommendation shows “Plan changed” and the current action. An invalid key offers reconnect, an exhausted allowance shows its reset time, and an unavailable provider leaves local evidence and Today usable.
- Use `PageHeader`, `TextArea`, `Button`, `Modal` and the existing theme tokens. At phone width, put evidence beneath the answer and keep the composer above the keyboard and navigation. Use a labeled message log, a short live status announcement, visible focus, and a way to insert a newline. Receiving a reply must preserve the reader's focus and scroll position.

## Tools and turn contract

Run site tools in the signed-in app. The model can request named reads and propose or invoke named commands appropriate to the user's current request. The app resolves the current object, validates arguments and permissions, and executes the same handler as the corresponding control. Only bounded projections go to the provider. The following evidence tools complement the site commands in the coverage table below. Names are proposed implementation names.

| Tool and bounded arguments | Result | Stage |
| --- | --- | --- |
| `progress_summary(scope)` · all, one known category or one known pattern | Last 14 local calendar days, measured passes/attempts, recall outcomes, delayed and unfamiliar evidence, recorded minutes, missing observations and evidence handles | First release |
| `problem_timeline(problemId)` · one resolved catalog or owned historical ID | Encounter source, due dates, latest status, up to five dated attempts with outcome/assistance and optional reported rating. Include a truncation flag. | First release |
| `today_plan()` | Current assignment or resume action, task reason, allocation and time remaining, or the actual blocking state. Protected tasks get opaque handles. | First release |
| `review_schedule(topic?)` · category or tracked pattern | Latest recorded coding and recall, imported acceptance when recorded, and due dates by review type. Current Today assignments include their queue positions. With no topic, check the next visible task's category. | Coaching |
| `next_task_options(topic?, avoidTopic?, problem?, minutes?)` | A bounded set of eligible first-task choices across due recall, due coding and fresh practice. The learner can apply one choice or delegate it by pressing **Let AI choose next task**. | Coaching |
| `practice_options(minutes?, topic?, avoidTopic?)` | Up to three eligible **substitutes for one slot**, each with planned minutes, estimate, evidence and reason. Returns a blocked result if no substitute qualifies. | First release |
| `compare_periods(scope)`, `confidence_followups(scope)` | Two adjacent complete windows, or matched rating/follow-up pairs; include denominators, unknowns and contributing records | Investigations |
| `read_attachment(handle)`, `reference_excerpt(problemId, approachId?)` | Only the exact text the user selected for this turn, or a short attributed excerpt when the study stage permits it | Debrief |

**Routing.** For a question, use up to two relevant read tools and one synthesis call after intent selection. For “start it”, “pause my timer” or “skip this one”, resolve the current object and invoke the named command directly on clear user intent. For a question such as “should I skip this?”, return advice and a Skip control. A command result can be rendered locally with zero further model calls. Multiple dependent steps run sequentially and only as requested. Stop at missing information, failed preconditions or a native confirmation. If a request exceeds one turn's call budget, preserve the completed steps and show the next one. Use domain-scoped tool schemas by screen and intent so broad coverage fits the same token budget. Resolve ambiguous problem names locally. Revalidate owner, local date, target and practice stage on each call.

### Whole-site tool coverage

Each row is required for the full feature. During implementation keep a checklist against the current routes, menus, dialogs and page actions. For each workflow, identify its UI caller, backing read or mutation, allowed role, handling of sensitive input, resulting state and one way to verify the effect. A navigation tool fulfills a task such as “open my library”; a request such as “change my weekday target” requires a working change and a confirmed result.

A user can initiate a workflow from any chat entry point. Run shared actions directly when their inputs are available. When a workflow needs a mounted screen, file picker or unsaved form, open the specific surface with the resolved target, keep chat available and continue there after it is ready. Scope page-local handles to that mount so “rate this card” cannot accidentally rate the next card. Accepting an alternative requires a corresponding choice control on Today as well as in chat.

| Surface | Tool capabilities | Execution and visible result |
| --- | --- | --- |
| Today and plan guide | Read the plan, explain any slot, list alternatives, select/reset a choice, start/resume, skip, switch Full/Reviews only, explain a rest or blackout day. | Both surfaces use the same candidate handles, allocator and owner/day choices. Publish the actual new slot or pause reason as soon as an action completes. |
| Library, explanations and patterns | Search, filter and sort by supported fields; inspect coverage, compare approaches, open an attributed reference, copy a chosen template/list, launch recall/coding, record an explicitly reported previous solve or remove an existing progress record. | Reuse library filters, existing study/solve flows and lesson data. Preserve a manually reported solve's meaning and premium/active-session checks. Show the affected record before destructive removal. Library rows, evidence and Today refresh together. |
| Coding and recall | Start/resume, pause/continue, correct time or use measured time, edit the user's supplied draft, reveal/compare at the allowed stage, report an outcome, save, retry a frozen save, continue to next review or abandon. | Bind controls to the active owner and session ID. Ask for missing outcome fields. Reuse the native review/save or discard control where appropriate, accessible from chat. Show a saved record only after the session transaction is confirmed. |
| Evidence and history | Query summaries, list earlier sessions, compare windows or topics, inspect a record, find evidence behind a recommendation, and start the resulting eligible practice. | Reuse evidence helpers and cursor paging. A save through Timer, Recall or chat is reflected by the same query refresh. |
| Syntax and flashcards | Search by supported language/category, find due cards, start a deck, flip, advance, record the learner's rating, revisit a card and retry struggled cards. | Reuse the active deck's handlers, including queue and advancement logic in `SyntaxFlashcardSession.tsx`. A rating entered in chat advances the visible deck exactly once and changes due state. A rating in the deck changes chat's current-card target. |
| Study settings, appearance and onboarding | Inspect and change settings offered by the UI, including time budgets, curriculum, learning order, language, premium preference, future intervals, rest day, blackout ranges, interview date and target events. Set theme or complete onboarding steps from the user's choices. | Use the same edit-start settings base, validation and explicit Save for time targets. Preserve unsaved drafts and show conflicts. Theme uses `ThemeProvider`; schedule/settings changes refetch under the same owner and recompute Today. |
| LeetCode sync and backups | Connect/change username, request the existing accepted-submission import and report the imported count, export the current account, preview and apply a selected backup. | Run the established import, snapshot export and validated atomic restore. Keep keys, backup bytes and file contents out of model context. File pickers, downloads and restore confirmation use the normal browser flow. Restored/imported records become available to the planner and the conversation. |
| Navigation, account, tour and feedback | Navigate to registered screens, open the tour, open Clerk's account controls, compose feedback, attach a user-selected file, and submit on the user's explicit Send. | Hand authentication to Clerk and file selection to the browser. Feedback submission invokes the existing production notification webhook; the Send control shows the text and attachments. Exercise delivery paths with isolated fixtures. |
| Administrative feedback workspace | For a verified admin, list/filter tickets, inspect a selected ticket locally, mark viewed and change its status. | Include these tools only in the authorized admin context. Use the same database-enforced permissions and handlers as `AdminDashboard.tsx`. Show status and counts from confirmed data. Keep other users' ticket bodies and uploads in the local admin UI; commands can refer to opaque ticket handles. |

**Command contract.** Have the intent response choose a discriminated, allowlisted command such as `start_practice(taskHandle)`, `set_review_mode(mode)`, `set_timer_paused(sessionHandle, paused)` or `prepare_settings_change(fields)`. State-setting operations use the desired value so an identical retry cannot flip it back. Accept commands only for an explicit user request or a user-operated action control. A note, a retrieved reference or a generated suggestion cannot authorize a mutation. The app binds each action to the signed-in owner and relevant task/session/record or edit-start revision. Return a typed local result such as applied, awaiting input, confirmation required, stale, forbidden or unconfirmed, plus current handles. Distinguish “opened the form” from “saved the change.”

**Confirmation and retries.** A clear “start”, “pause”, “skip” or “apply Reviews only” takes effect in one interaction. Explicit Save accepts the learner's reported assessment or settings edit. Use concrete previews for restore, record removal, draft abandonment and outbound feedback. Render existing controls inline or open the exact native dialog with draft data, then observe its confirmed result. Multiple clicks, rerendered tool messages and a repeated network response must have one effect. For operations with duplicate-sensitive writes, create the operation ID before dispatch, retain its exact inputs through an ambiguous response, and consult the existing receipt or confirmed state before retry. Extend a service/hook that currently generates a fresh ID per invocation where necessary. Keep RLS, database revision checks and existing external side effects intact. These are product commands; the provider receives neither database credentials nor arbitrary SQL, URL-fetch or DOM-execution capabilities.

**Contract.** Use the installed Zod for closed schemas. A tool result carries `asOf`, local date/window, scope, completeness, fact IDs, allowed action IDs and bounded display data. Keep the contributing record list on the client for expansion. A reply can select fact IDs, a coaching suggestion and one action ID. Render numeric claims, problem names, dates, links and buttons from the validated facts and handles. Put interpretation in a separate short text field. Reject unsupported personal claims, unknown handles, unsolicited links and malformed responses. Fall back to the fact cards on a validation failure. Schema conformance alone cannot check a plausible coaching claim, so include human review in the evaluation below.

**Worked exchange.** For “What changed on graphs?”, the model can request `progress_summary(graphs)` and, once available, `compare_periods(graphs)`. The app may return a fact with handle `g1`, scope “graphs,” numerator 1, denominator 3, and three local record handles. The reply can refer to `g1` and suggest trying a delayed check. The renderer supplies “1 of 3 independent coding attempts” and the real history rows. A proposed “start” handle is valid only if Today or the candidate tool issued it. A source label with no matching fact suppresses the generated claim.

A minimal final reply from the model could look like this. Both IDs are opaque, local to the current turn, and checked against its tool results. For a question the tools cannot answer, allow a short clarification with empty references and a null action.

```json
{
  "factIds": ["g1"],
  "suggestion": "Try explaining your stopping condition before you code the next review.",
  "actionId": "a1"
}
```

Represent each evidence fact as a typed metric with a trusted label, value or numerator/denominator, window and contributing local record IDs. Keep titles and handle resolution in the renderer. Let the schema select explicit variants for a metric, timeline event, plan slot or unavailable result. This makes an answer inspectable even when synthesis fails. Give the model a bounded set of known topic labels and conversation references for routing. If it requests a timeline by title, resolve the title in the browser before issuing the ID-based tool.

**Input limits.** Starting settings for evaluation are 2,000 characters per user message, four recent conversation messages, two tools per turn, five displayed records per tool, 6,000 input tokens and 500 output tokens **per model call**, including tool definitions, conversation and reasoning allowance where applicable. Bound bytes before parsing and bound encoded tokens for the model. Replace oversized context with deterministic aggregates and a visible date range. Treat every user string, note, citation and tool result as data. Free text cannot change the available tools, recipient, billing mode or action permissions.

### Recommendations that go beyond Today's first pick

1. Read the same live plan on every surface. Accepting an alternative updates the shared slot choice before the session starts. Clear or revalidate that choice after skip, mode change, budget change, relevant saved outcome, account switch or local-date rollover. A candidate list shown in an old conversation is historical until validated against current state.
2. For a time request, cap the practice block at the lesser of the requested time and real remaining time. Account for time already used exactly once. Feed the proposed cap into the allocator as remaining availability, preserving existing reservations and recall usage. A full-attempt estimate may exceed the available block. Preview only until the learner acts.
3. For alternatives, expose the first few candidates **from the same selection branch and priority level** in `study.ts`. Reuse deduplication, premium, curriculum, prerequisites, rest/break rules, remediation, rotation and the unfamiliar reservation. Do not generate alternatives by repeatedly skipping the top item until the planner switches kinds. If a protected slot has no legitimate substitute, return its ordinary action. Topic and time preferences break ties among feasible choices.
4. Let the model rank the feasible shortlist against the learner's words and say why. A deterministic tie-breaker reproduces Today's default when preferences are absent. A start click recomputes eligibility with fresh reads and current drafts, preserves task kind and allocated minutes, and enters the existing Dashboard start/resume path. If the pick expired, present the fresh choice for confirmation. Exploration outside plan eligibility can link to the library with a clear label.
5. Blind checks need an opaque local handle and generic label. Keep the problem ID, title-derived slug, category, difficulty, related records, explanation links and revealing choice rationale out of the model context for that check. A topic-constrained request cannot turn a hinted choice into a first blind transfer check. The simplest launch behavior is a local “Start unfamiliar check” action with a scheduling explanation.

### Investigations and coaching after the first release

- **Confidence and follow-up.** Match each explicitly rated coding entry with the immediately following coding attempt on that problem in recorded time order. Report the gap, assistance and result. An unchecked or unfinished next attempt stays labeled as such; count missing pairs. Keep same-day retries separate from delayed attempts. Current-session confidence is retrospective. Present matched observations and their sample size without turning the rating scale into probabilities.
- **Compare two periods.** Start with adjacent 14-day windows ending yesterday in the learner's timezone, with exact inclusive dates on screen. Compare measured independent passes, hint use, delayed checks, initial unfamiliar attempts, recalls and minutes. Apply existing helper definitions to the whole problem history before windowing when the measure needs earlier evidence. Let the learner see whether the second window contains a different mix of problems. Reuse older timing pagination if expanding beyond loaded coverage.
- **Post-session debrief.** After a confirmed save, let the learner select the original recall answer, subsequent correction, a note or a bundled reference. Preview the individual excerpts before sending. Ask for one discrepancy, one counterexample or boundary case, and one question to answer from memory. Cite the exact selection or attributed approach. Generated code/examples are proposed material with no implied execution or verdict. The learner can edit a reflection in the normal notes flow.
- **Pattern discrimination.** Offer a short on-demand exercise contrasting two easily confused approaches using existing pattern lessons. Let the learner give an invariant or counterexample before revealing guidance. Label generated drills as exercises. Only a real eligible catalog problem can contribute a first unfamiliar coding result.
- **What-if planning.** Preview a 15-minute day, Reviews only, or a different weekday budget using copied settings and the allocator. Show what fits or moves, with today's remaining time visible. A multi-day sketch is conditional on unknown future outcomes. Applying a settings change opens Settings with proposed fields, original values and the existing explicit Save.
- **On-demand fortnightly review.** Summarize one improvement, one unresolved question and one feasible next experiment. At the next review, show whether the learner actually got another opportunity and what happened. Start with local comparisons. Add an opt-in saved goal only if people return to it; specify owner isolation, expiry, export, deletion and restore before adding persistence.

**Learning integrity.** Keep chat controls available during practice. “Pause”, “I spent 12 minutes”, “save my reported result” and “what is my remaining budget?” work on the active session. During closed-notes recall or a blind check, serve operational requests using bounded facts and local status messages. Withhold solution-bearing tools and earlier spoiler-rich replies until the corresponding reveal or debrief stage; discard an in-flight answer that crosses the boundary. Use a deterministic card for the upcoming unfamiliar assignment. Learner reports still determine what happened elsewhere.

Later, allow debriefs after reveal or completion and optional hints during ordinary coding. Before displaying an in-session hint or solution, persist the assistance floor in the existing owner-scoped session draft. Enforce it on every completion path, including the compact independent result, resume and reload. Freeze it with the completion and preserve the operation ID through retry. A pending save cannot accept a hint. Keep the original pre-reveal answer intact. Ship this assistance tracking in the same milestone as hints, with backup and save-path checks. Chat never supplies the correctness or explanation grade.

## Funding, privacy and operations

### Personal-key setup and data boundaries

Settings and onboarding share a masked key field and disclose the selected
provider, billing source, and data sent. Keep keys and conversations in
account-scoped tab memory. Clear personal credentials on refresh, disconnect,
sign-out, or account switch. Reject late responses from the prior connection.
Revocation happens in the provider account. A dedicated key with a spending
limit reduces exposure if a script running in the tab can read it.
[Provider setup](../src/coach/CoachSetup.tsx)

The model receives the question, bounded recent context, and selected
`modelData` facts. Keep account identifiers, session tokens, credentials,
backup contents, raw history, notes, code, and solutions out of automatic
projections. The learner's typed text is sent as part of an AI question.
Reviewed excerpts or attachments belong to the planned coaching work.
[Provider protocol](../src/coach/protocol.ts)

Pin a model and route with structured output for each provider. Present provider
failures in chat and leave local evidence accessible. Render replies as plain
text and app-owned blocks. Keep prompts and replies out of logs and exports.
[Provider routing and privacy](reliability-review.md#service-map)

### Hosted allowance and personal keys

The authenticated `/api/coach` route serves the prepaid OpenRouter allowance
and the direct Gemini and Claude personal-key adapters. Personal OpenRouter
requests still go directly from the tab to the pinned Azure route. The project
owner configures the shared key and funding separately from their own account.
See the [runbook](operations.md#free-study-chat-and-personal-keys) for current
limits, credential names, rollout status, and verification.

A hosted question creates a turn UUID and reserves both potential inference
calls before sending the intent request. The server builds the model payload
from bounded input and checks Clerk identity and allowed origin. A validated
read intent can be followed by one synthesis call under the same UUID. A
model-proposed action returns to the UI for confirmation. The private ledger
binds both steps to the same account, question and funding choice. It claims
each step once and accounts against the original UTC buckets. A retry after
an unconfirmed response uses the original UUID. Unknown costs keep their
reservation.

When changing providers or token limits, recompute the maximum cost of each
request from input and output limits, rates, any per-request charges, and
rounding. The configured route caps model pricing, and the ledger reserves
cost in integer microdollars. Keep a provider-level spend limit and prepaid
balance as independent controls. See [the pricing and reservation code](../server/coachProvider.ts)
and [the ledger migration](../supabase/migrations/20261118000000_coach_turns.sql).

Before raising allowances, measure observed cost and latency per usable answer
in staging with synthetic study data. Check that every dispatched step is
accounted for and that the off switch works. Compare recommendations against
Today's default on the same fixture to see whether the model honored the
learner's preference. A subsequent recorded attempt supplies the learning
evidence.

## Implementation tickets

| Order | Work and integration points | Completion check |
| --- | --- | --- |
| 1 · Prove the round trip | Share Dashboard's live inputs and plan choices, implement constrained alternatives and unify task start/resume across entry points. Add the first typed command and a chat control beside Today using a scripted recommendation. Cover the allocator with the existing study/simulation fixtures. | Recommend B in place of A. Select B in chat and start it in Today. Repeat with the start in chat. In both directions the same session ID, kind, duration and resume state appear. Finish once and verify both show the same next task. |
| 2 · Session commands and evidence | Add the live chat host, protected deep link, progress/timeline reads and command routing. Connect coding and recall, including time corrections, learner-reported outcomes, pending saves and retry. Update `App.tsx`, `Layout.tsx`, private-route checks, SEO metadata and Vercel rewrites/noindex. Use account-scoped fixtures and the actual React Query/store lifecycles. | Chat can operate a mounted session and observe UI actions without a page reload or model refresh. It can cite the resulting record. Blind-task restrictions, draft recovery and sign-out cleanup pass. |
| 3 · Finish whole-site tooling | Implement and verify all remaining rows in the coverage table: library/patterns, syntax, settings/onboarding, sync, backups, shell/account, feedback and authorized admin operations. Share UI handlers, register page-local commands only while their target is active, and retain the resulting status when a native workflow takes over. | For every workflow, a chat command produces the real UI effect and the reverse UI action updates chat's current state. A normal user cannot discover or run admin tools. Check destructive, external and file-based paths with isolated fixtures. |
| 4 · Connect user-funded chat | Implement the fixed provider adapter, in-memory user key, scope and cost preview, model selection, cancellation, safe errors, attribution and Privacy Policy updates. Document the real service map. Use a fake provider in CI. | Run the same bidirectional journeys through the model adapter. No paid call occurs for a state refresh, displayed receipt or direct action button. On account switch or a late response, previous credentials, commands and personal results cannot take effect. |
| 5 · Improve the coaching | Add confidence/follow-up pairs, period comparisons, selected excerpts, post-save debriefs, what-if previews, and ordinary coding hints with persisted assistance. Extend session/backup checks for hint tracking. | On a synthetic history, the user can trace a recommendation back to measured evidence, run it from chat, share a correction after reveal and inspect the saved outcome. A hinted attempt cannot save as independent after a reload. |
| 6 · Hosted pilot | Implement Clerk-authenticated `api/coach.ts` with explicit local `.js` server imports, a restricted budget ledger, server configuration, operations notes and kill switch. Use separate development and production credentials. Cover Vite development via the existing `vite-plugins` pattern as needed. | Parallel requests at the final cent, replay under a different account, ambiguous timeout, ledger outage, stale price, duplicate settle and budget rollover all leave spend within bounds. Owner-funded calls cease when disabled, including the second step of an in-flight turn. |

Tickets 1–4 describe the released site-wide assistant. Ticket 5 extends the
learning features. Ticket 6 describes hosted funding through implementation
and staged release. Re-run the relevant coverage-table journeys when changing
a workspace tool.

## How to verify usefulness and correctness

Use synthetic histories with known answers. Compare the coach with the existing Today explanation and Analytics screen on the **same** history. Ask a reviewer to find a concrete example and choose the next action in each version. Record whether the answer is correct, whether the learner can inspect its source, whether the recommended action is eligible, and whether chat saved any lookup work. A fluent restatement of the existing card adds little. A claim about improved retention would require separate follow-up evidence.

**Release-blocking browser journeys.** Run these against the real app/store and a scripted provider. For live updates, keep Today or the relevant page mounted with the chat panel open; assert before navigation or a manual refresh.

1. Begin with two ordinary eligible coding candidates. Ask for B, select it, and assert Today changes from A to B before the timer starts. Start B through chat; assert Today offers Resume B, chat reports the same session ID, and a repeated Start creates no second draft. Save a 12-minute, learner-reported result in the native form. Assert one timing, one outcome, 12 fewer available minutes on the fixture and the same next assignment in chat and Today.
2. Start B on Today after chat recommends it. Ask chat for the active time, pause and correct it in chat, resume in Timer and save through chat's outcome control. Assert the timer, evidence, and Today agree. Repeat with a Library/Patterns start for a different problem, and with recall plus Next review. Count provider calls; these reactive UI updates add zero.
3. Keep a suggestion card open; skip its task in Today, switch Reviews only or save a budget change in Settings. Assert the stale Start is replaced on that same card, both surfaces show the new eligible plan, and a late response cannot restore the old one. Repeat across midnight and account switch.
4. Interrupt a completion response after commit and recover from the other surface. Assert one receipt, unchanged operation ID and frozen payload, one recorded result and no replacement draft while the save is unconfirmed. In a separate tab, refresh saved queries and verify the saved outcome; keep local running drafts scoped to their tab.
5. Run the remaining tool coverage by domain in both directions. Examples include changing weekday minutes from chat while Settings is open, rating a card from chat while Syntax advances exactly once, importing a fixture submission from Settings while chat shows its new coverage, and an admin-only status change while the ordinary learner has no access. Assert the underlying state or persisted record, beyond checking the assistant's text.

| Fixture or failure | Expected observation |
| --- | --- |
| 43 imports, zero measured attempts; legacy rating; placeholder 3 | Coverage visible, independent coding and current confidence unknown, no manufactured pass or failure. |
| Recall successes, coding with hints, same-day repeats, later lapse | Exact denominators agree with app helpers. Recall cannot earn a coding pass. Daily rehearsal cannot establish delayed retention. |
| High reported rating followed by an assisted attempt; another high rating with no follow-up | The first case links two dated records; the second remains unmatched. No calibrated risk score. |
| Active corrected timer, saved timing with same ID, failed frozen completion | Remaining time matches Today. Resume preserves duration, draft and original operation ID. |
| Reviews only, inclusive blackout, rest day, five-minute boundary, exhausted budget, premium off, rotated continuation | Every displayed action respects the relevant mode and budget. A shorter block is labeled as a block. |
| Protected unfamiliar check; request for tags in a follow-up; reply returns after a practice session starts | No revealing data in the request, response display, citations or accessible labels. The current practice stage wins. |
| Date rollover, DST, equal timestamps, partial history, older timing page failure | Show local dates, deduplicate timings, and mark incomplete coverage. No assumption that a failed page is the end. |
| Unknown tool, invented ID, instruction embedded in a note, HTML/image URL, overly large tool result | No arbitrary call or remote resource. Show validated local evidence or a recoverable error. |
| Offline, invalid key, insufficient credits, provider 429/timeout, Cancel, account switch | Clear recovery text, no automatic paid replay, no switch of payer and no late cross-account content. |
| Concurrent sponsored requests with allowance or money for only one; repeated turn/step; crash after dispatch | Atomic reservation admits only the affordable call. The second request receives a stable status. Unknown spend stays covered. |

For provider selection, maintain a small versioned set of prompts and expected facts/actions across these fixtures, including ambiguous questions and requests the app cannot answer. Run deterministic contract tests in CI. Separately compare candidate models on at least 20 synthetic prompts with repeated runs for spoiler/privacy and billing-sensitive cases. Proposed release criteria: **all** identity, billing, eligibility, spoiler and evidence-integrity cases pass, and at least 18 of 20 answers are judged accurate, sourced and actionable or correctly acknowledge missing data. Record dollars per evaluated turn and p50/p95 time to a complete usable answer. Use these results to pick the model and decide whether streaming is worth its extra failure modes.

Run Node 24, `npm run lint`, `npm test` and `npm run build` for application changes. Add a focused coach browser suite and run the interface, theme and study suites for shell changes. Inspect at 390px and 1440px in both themes, with keyboard and long replies. For persistence or hosted accounting changes, add SQL ownership/concurrency tests and run `npm run test:db`, `npm run test:api` and `npm run test:e2e`. Include a compiled native-function test for the hosted route. Local auth and provider fixtures cannot establish real OAuth, current model behavior or actual billing. Verify those separately in a protected staging deployment with synthetic study data and a deliberately small, authorized test allowance. Follow the repository's preview, migration and release order. [Operations](operations.md)

## Handoff

For practice or tool changes, reproduce the affected Today ↔ chat journey and
verify the saved result through the existing app and study hooks. The
[chat browser suite](../e2e/coach.spec.ts) covers both directions. For funding
or provider work, start with the [runbook](operations.md#free-study-chat-and-personal-keys)
and the [allowance browser test](../e2e/coach-access.spec.ts). Use its fixtures
for local verification. Live provider and cost checks need a staged environment
and funded test credentials.
