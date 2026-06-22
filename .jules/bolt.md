## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-03 - O(N) Array Lookups in Rendering
**Learning:** Found multiple instances where `allProblems.find()` was used in React render loops and `useMemo` blocks, causing O(N) or O(N*M) time complexity during renders for data that should be O(1).
**Action:** Always pre-compute and use lookup maps (like `problemMap` or `problemTitleToProblemMap`) for ID or title-based property lookups to ensure O(1) access during UI renders.
