## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-24 - O(1) Problem Lookups Avoid O(N) Array Iteration
**Learning:** React components (like `Dashboard` or `PatternFoundations`) looping through a large list and doing an `allProblems.find()` within the loop forces a nested O(N^2) or O(M*N) complexity. With thousands of problems, this dramatically affects render time.
**Action:** Use pre-computed Maps (like `problemMap` for IDs and `problemTitleMap` for titles) for O(1) lookups during React renders, avoiding `.find()` operations inside loops or reactive dependencies.
