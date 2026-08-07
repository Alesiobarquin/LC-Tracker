## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-06-29 - O(1) Map Lookups Replacing Array .find()
**Learning:** The `allProblems` and `allSyntaxCards` arrays were being mapped over using `O(N)` `.find()` methods inside components like Dashboard and FloatingSessionIndicator, creating potential UI freezing when mapping multiple elements against ~3800 problems.
**Action:** Pre-compute maps (`problemMap`, `syntaxCardMap`) for fast `O(1)` ID lookups to eliminate inner O(N) array search overhead within mapping functions or loop iterations.

## 2024-07-08 - O(1) Title Map Lookups Replacing Array .find()
**Learning:** Calling `Array.find` inside a loop (like `allProblems.find()`) over a large dataset (~3800 items) based on titles creates severe O(N^2) bottlenecks, as seen in `PatternFoundations.tsx`.
**Action:** Always pre-compute and use O(1) hash maps (e.g., `problemTitleMap`) for any attribute-based lookups within mapping functions.
