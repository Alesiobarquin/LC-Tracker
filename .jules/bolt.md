## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-04-07 - O(1) Map Lookups Over Array Finds
**Learning:** Found an inefficient pattern where `.find()` was used inside array `.map()` loops or during render to look up problems and syntax cards, introducing hidden O(N) bottlenecks on large datasets.
**Action:** Always replace array `.find()` calls on large static datasets with pre-computed O(1) Maps (like `problemMap` or `syntaxCardMap`) to prevent unnecessary performance degradation during render loops.
