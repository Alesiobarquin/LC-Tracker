---
name: lc-tracker-study
description: Change or review LC Tracker learning strategy, recall flow, scheduling, or learning evidence without conflating confidence, recall, and independent coding. Use for study behavior changes, not ordinary styling.
---

# LC Tracker study behavior

Read [study strategy](../../../docs/study-strategy.md) for the current evidence,
product defaults, preservation rules, and evaluation method. The canonical
planner and evidence helpers are in `src/utils/study.ts`; persistence is in
`src/services/userData.ts`.

When changing this behavior:

- Keep one allocator responsible for all assigned minutes. Subtract recorded
  study time and already used recall capacity. Deduplicate problems across task
  kinds. Exercise a large imported backlog, tiny/zero budgets, rest days, breaks,
  completed assignments, and unfinished coding before changing priorities.
- Keep recall and coding evidence separate. A successful explanation must not
  append a coding pass or defer an implementation check. Retained implementation
  needs delayed independent passes; daily rehearsal and legacy retirement flags
  do not establish that evidence. Check lapse recovery as well as success.
- Preserve historical meanings. New imports have unknown current confidence,
  not an assumed strong pass. Read paths must not rewrite old dates or ratings.
  Distinguish encounter/coverage from measured coding outcomes in UI and analytics.
- Reveal references after retrieval. Label general pattern guidance and user notes
  accurately. If adding an AI tutor, separate assistance from an independent
  attempt and check generated claims; do not make chat a prerequisite for review.
- Distinguish research-supported principles from app-specific numeric defaults.
  Use primary research for new scientific claims and identify extrapolation to
  coding. Validate defaults with observed outcomes rather than claiming neural
  mechanisms prove a particular interval or interview readiness score.
- Audit onboarding, pattern lessons, brand text, and the product tour after a
  behavior change. Keep their descriptions consistent with the planner and label
  illustrative results clearly; a public preview is not a measured outcome.
- Keep drafts, frozen completions, ownership, operation IDs, and retry receipts
  through reloads and lost responses. Include new metadata in validated backups.
  Use the existing reliability workflow for persistence or migration changes.

Run the relevant scheduler and flow regressions. Add tests for demonstrated
behavioral failures, not snapshots of wording or an algorithm's implementation.
