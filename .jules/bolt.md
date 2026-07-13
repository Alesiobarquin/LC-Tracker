## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-06-29 - O(1) Map Lookups Replacing Array .find()
**Learning:** The `allProblems` and `allSyntaxCards` arrays were being mapped over using `O(N)` `.find()` methods inside components like Dashboard and FloatingSessionIndicator, creating potential UI freezing when mapping multiple elements against ~3800 problems.
**Action:** Pre-compute maps (`problemMap`, `syntaxCardMap`) for fast `O(1)` ID lookups to eliminate inner O(N) array search overhead within mapping functions or loop iterations.

## 2026-07-13 - O(N) Lookups inside Mapping Loops
**Learning:** Using array lookups like `.find()` with inline string transformations (`.toLowerCase()`) inside `.map()` loops introduces hidden O(N*M) bottlenecks and continuous string allocation overhead on large datasets.
**Action:** Pre-compute O(1) Map lookups (e.g., `problemTitleMap[lowerTitle]`) outside the render cycle or loop boundary to prevent redundant O(N) calculations.
