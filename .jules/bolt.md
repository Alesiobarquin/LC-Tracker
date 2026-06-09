## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-10-27 - O(N) Array Lookups in Render Cycle
**Learning:** In `src/components/Dashboard.tsx`, arrays of IDs were mapped over using `.find()` on the 3800+ item `allProblems` array (e.g., `effectiveReviewProblems.map(id => allProblems.find(p => p.id === id))`). This resulted in O(N * M) time complexity during renders, causing performance degradation when generating dynamic problem lists.
**Action:** Always replace `.find()` lookups on large datasets with pre-computed O(1) hash maps (e.g., `problemMap`, `syntaxCardMap`) when resolving IDs inside React components to ensure O(M) rendering performance. Do not wrap these simple dictionary lookups in `useMemo`.
