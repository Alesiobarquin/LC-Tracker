## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-04-08 - O(n) lookups replacing O(n) array searches
**Learning:** Avoid `allProblems.find()` for O(N) lookup. Use `problemMap` for O(1) id lookups, and `problemTitleMap` for title-based lookups to improve performance, particularly inside loops or React renders.
**Action:** Replace `allProblems.find(p => p.id === id)` with `problemMap[id]`.
