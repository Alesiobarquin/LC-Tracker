## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-04-08 - O(N) `.find()` inside rendering arrays
**Learning:** Using `.find()` inside mapping loops (like `effectiveReviewProblems.map(id => allProblems.find(p => p.id === id))`) creates hidden O(N^2) bottlenecks when resolving arrays of IDs into data objects during React render cycles.
**Action:** Always pre-compute and export O(1) dictionary maps (like `problemMap` and `syntaxCardMap`) and use them instead of `.find()` to retrieve objects by ID.
