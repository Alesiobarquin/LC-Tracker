## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-04-10 - O(N^2) Bottleneck in Nested Mapping Lookups
**Learning:** Discovered an O(N^2) performance bottleneck caused by repeatedly calling `.find()` on a large array (`allProblems`) inside a `.map()` iteration during component rendering/memoization in `PatternFoundations.tsx`.
**Action:** Always pre-compute an O(1) hash map (e.g., `problemTitleMap`) outside of loops or in static modules to replace O(N) array searches during mapped iterations over large datasets.
