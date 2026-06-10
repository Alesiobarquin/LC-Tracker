## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-06-10 - O(1) Maps vs O(N) `.find()` for Large Datasets
**Learning:** Found an inefficient pattern where `.find()` was used inside `.map()` loops or render cycles to look up items from `allProblems` (~3800 items) and `allSyntaxCards`. This creates an O(N^2) bottleneck.
**Action:** Pre-compute O(1) maps (e.g., `problemMap`, `syntaxCardMap`, `problemTitleMap`) and use dictionary/map lookups instead of `.find()` to avoid performance bottlenecks, especially in arrays mapped during renders.
