## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-06-29 - O(1) Map Lookups Replacing Array .find()
**Learning:** The `allProblems` and `allSyntaxCards` arrays were being mapped over using `O(N)` `.find()` methods inside components like Dashboard and FloatingSessionIndicator, creating potential UI freezing when mapping multiple elements against ~3800 problems.
**Action:** Pre-compute maps (`problemMap`, `syntaxCardMap`) for fast `O(1)` ID lookups to eliminate inner O(N) array search overhead within mapping functions or loop iterations.

## 2024-07-02 - O(1) String Lookups for Mapping Unlinked Data
**Learning:** Using `.find()` to map text-based identifiers (like problem titles in `PatternFoundations.tsx`) against a large array (like `allProblems`) inside a `.map()` or `useMemo` block creates an `O(N^2)` bottleneck.
**Action:** When cross-referencing datasets using non-ID attributes, export a pre-computed lowercase text map (e.g., `problemTitleMap`) from the data source to ensure `O(1)` lookups.
