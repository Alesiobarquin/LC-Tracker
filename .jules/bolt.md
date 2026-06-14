## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-04 - O(n^2) Hidden Loop in Mapping
**Learning:** Found a severe hidden performance issue where pattern mapping iterated through educative problems and did an `allProblems.find(...)` lookup for each one. With 3000+ total problems and hundreds of educative ones, this caused severe O(n^2) scaling rendering latency.
**Action:** Always pre-compute lookup maps (like `problemTitleToProblemMap`) outside renders or logic loops when mapping two datasets by a string property, achieving O(1) time complexity.
