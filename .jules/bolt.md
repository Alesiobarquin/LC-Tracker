## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-18 - Avoid array .find() in React loops
**Learning:** Using array lookups like `.find()` inside rendering cycles or mapping loops (e.g., resolving arrays of IDs) introduces hidden O(N) or O(N^2) bottlenecks on large datasets.
**Action:** Always pre-compute O(1) maps (like `problemMap` or `syntaxCardMap`) and use them for direct property access instead of `.find()`.
