## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-05-18 - Replacing O(N) Array finds with O(1) Map lookups in rendering loops
**Learning:** React component rendering loops often do arrays `.find` on large collections (like `allProblems`) multiple times which leads to O(N) lookups in render cycles affecting performance.
**Action:** Use pre-computed dictionary O(1) maps like `problemMap` and `syntaxCardMap` instead of `allProblems.find(p => p.id === id)`. This reduces lookup time dramatically on large dataset UI renders.
