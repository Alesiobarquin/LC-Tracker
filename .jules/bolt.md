## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-18 - Replacing Array .find() with O(1) Map Lookups in Render Methods
**Learning:** Found several places in `src/components/Dashboard.tsx` where `.find()` was being executed over large arrays (`allProblems` and `allSyntaxCards`) inside render functions and loop iterations. This causes O(N) or O(N^2) complexity where it shouldn't exist.
**Action:** When mapping IDs to their corresponding data objects inside React components or render loops, always use O(1) hash maps (like `problemMap` and `syntaxCardMap`) instead of array `.find()` to avoid redundant array traversals and improve performance.
