## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-06-28 - O(N) lookup inside React render cycle loop
**Learning:** Found an `allProblems.find(...)` lookup executing inside a `.map()` block inside `useMemo` in `PatternFoundations.tsx`, leading to `O(M * N)` complexity on large arrays during renders.
**Action:** Always pre-compute and export O(1) hash maps in data files (like `problemTitleMap`) and utilize them for lookups rather than recalculating `.find()` sequentially on arrays.
