## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-05-18 - Avoid O(N) Array Lookups in Render Cycles
**Learning:** Found O(N) lookups `allProblems.find(p => p.id === id)` repeatedly used inside components (`Dashboard.tsx`, `FloatingSessionIndicator.tsx`), degrading performance during render. The codebase uses `allProblems` which contains ~1500 elements.
**Action:** Always prefer utilizing the pre-computed `problemMap` dictionary to perform O(1) ID lookups instead of iterating over the `allProblems` array.
