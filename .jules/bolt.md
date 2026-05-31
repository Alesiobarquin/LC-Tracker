## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2025-02-18 - Avoid O(N) array lookups in map loops
**Learning:** Performing `Array.find()` inside loop bodies or `Array.map()` operations creates hidden O(N^2) performance bottlenecks, especially when resolving large arrays of IDs (like `allProblems` which contains ~3800 items).
**Action:** Always use pre-computed O(1) hash maps (like `problemMap` and `syntaxCardMap`) to resolve arrays of IDs into data objects inside React components.
