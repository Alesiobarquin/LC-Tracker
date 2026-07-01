## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-11-20 - O(N^2) Bottleneck in Mapping Loops
**Learning:** Inside `src/components/Dashboard.tsx` and `FloatingSessionIndicator.tsx`, using `.find()` inside a `.map()` or `.forEach()` created a hidden O(N^2) bottleneck over the large `allProblems` array.
**Action:** When resolving arrays of IDs into data objects, use pre-computed O(1) maps (e.g., `problemMap` or `syntaxCardMap`) for dictionary lookups to prevent redundant O(N) array searches.
