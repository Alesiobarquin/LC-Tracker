## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-05-24 - O(N) Lookups in Renders
**Learning:** Using `.find()` to map IDs to objects during render cycles creates hidden O(N) bottlenecks, especially with lists of >1000 items.
**Action:** Always pre-compute and export O(1) dictionary maps (e.g., `problemMap`, `syntaxCardMap`) to replace `.find()` logic in component renders.
