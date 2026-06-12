## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-18 - Avoid O(N) Lookups in React Loops
**Learning:** Found O(N) array `.find()` calls inside mappings (e.g. `effectiveReviewProblems.map`) when resolving arrays of IDs into data objects, which can cause severe performance bottlenecks on large datasets.
**Action:** When resolving arrays of IDs into data objects within React components, use pre-computed O(1) maps like `problemMap` or `syntaxCardMap` for lookups to prevent redundant O(N) `.find()` calculations.
