## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-06-06 - Replace O(N) array lookups with O(1) map lookups
**Learning:** Found O(N) array lookups inside mapping functions (`.map()`, `.forEach()`) in `src/components/Dashboard.tsx` for datasets like `effectiveReviewProblems`. This creates hidden O(N^2) complexity.
**Action:** Always pre-compute and use O(1) Maps/Records (like `problemMap`, `syntaxCardMap`) for fast dictionary lookups instead of `.find()` inside loops. Do not wrap these dictionary lookups in `useMemo`.
