## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-17 - O(N) Array Methods in UI Render Cycles
**Learning:** React components (`Dashboard`, `PatternFoundations`, `FloatingSessionIndicator`) were repeatedly using O(N) `Array.prototype.find` on `allProblems` (~250+ elements) and `allSyntaxCards` on every render.
**Action:** Always export O(1) maps like `problemMap` and `syntaxCardMap` from the data files alongside arrays and use them to resolve IDs in React renders instead of `find`.
