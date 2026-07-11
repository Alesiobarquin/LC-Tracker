## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-06-29 - O(1) Map Lookups Replacing Array .find()
**Learning:** The `allProblems` and `allSyntaxCards` arrays were being mapped over using `O(N)` `.find()` methods inside components like Dashboard and FloatingSessionIndicator, creating potential UI freezing when mapping multiple elements against ~3800 problems.
**Action:** Pre-compute maps (`problemMap`, `syntaxCardMap`) for fast `O(1)` ID lookups to eliminate inner O(N) array search overhead within mapping functions or loop iterations.

## 2024-07-11 - O(1) Title Map Lookups Replacing Array .find()
**Learning:** Found an O(N) array search inside a `.map()` loop in `PatternFoundations.tsx` when matching problems by title. Searching through `allProblems` (~3800 items) multiple times caused noticeable UI latency.
**Action:** Pre-computed `problemTitleMap` to enable fast O(1) title lookups, eliminating inner O(N) search overhead.
