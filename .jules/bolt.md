## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-06-29 - O(1) Map Lookups Replacing Array .find()
**Learning:** The `allProblems` and `allSyntaxCards` arrays were being mapped over using `O(N)` `.find()` methods inside components like Dashboard and FloatingSessionIndicator, creating potential UI freezing when mapping multiple elements against ~3800 problems.
**Action:** Pre-compute maps (`problemMap`, `syntaxCardMap`) for fast `O(1)` ID lookups to eliminate inner O(N) array search overhead within mapping functions or loop iterations.

## 2026-07-15 - Replace O(N) lookup in mapping loops with O(1) Title Map
**Learning:** Using `allProblems.find(...)` inside loops mapping educative problems in `PatternFoundations.tsx` caused continuous string allocation and an O(N) lookup per element, causing unnecessary overhead for the ~3800 problem dataset.
**Action:** Pre-compute maps (`problemTitleMap` in this case using lowercase title keys) when looking up items inside mapping operations to convert inner loops to O(1) dictionary lookups.
