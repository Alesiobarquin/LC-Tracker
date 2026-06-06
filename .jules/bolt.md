## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-05-10 - Replace O(N) array finds with O(1) hash map lookups
**Learning:** Found multiple instances where UI components (`Dashboard.tsx`, `FloatingSessionIndicator.tsx`, `PatternFoundations.tsx`) relied on `Array.prototype.find()` over a large data set (`allProblems` containing 1500+ items). Since `problemMap` existed, it was more performant to do O(1) lookups instead. Created similar pre-computed O(1) maps like `problemTitleToProblemMap` and `syntaxCardMap` to replace the array `.find()` lookups.
**Action:** Always verify if a fast O(1) object map is available (like `problemMap` or `syntaxCardMap`) before filtering or searching an array like `allProblems` or `allSyntaxCards` within React components.
