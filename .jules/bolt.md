## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-06-15 - O(N) Lookups in React Loops
**Learning:** Resolving arrays of IDs to objects using `.find()` inside `.map()` or component bodies causes hidden O(N) and O(N^2) bottlenecks on large datasets.
**Action:** Use pre-computed O(1) maps like `problemMap` and `syntaxCardMap` to avoid redundant loop processing.
