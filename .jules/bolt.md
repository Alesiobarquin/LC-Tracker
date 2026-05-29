## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-05-29 - Replaced .find() with O(1) Map Lookups
**Learning:** Arrays of IDs mapping into full data objects using `.find()` inside of loops or component renders are a significant and hidden O(N^2) bottleneck, especially when scaling datasets like `allProblems` (~250+ entries).
**Action:** Always precompute O(1) hash maps (e.g. `problemMap`, `syntaxCardMap`) and substitute `.find()` with map index lookups for improved algorithmic efficiency on UI rendering.
