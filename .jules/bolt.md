## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-05-22 - Inefficient N+1 Lookups in Array Rendering
**Learning:** Found an O(N^2) bottleneck in `src/components/Dashboard.tsx` where `.find()` operations on large arrays (`allProblems`, `allSyntaxCards`) were used inside `.map()` loops or conditional logic directly within the component body. This causes unnecessary recalculations on every render.
**Action:** Always use pre-computed O(1) hash maps (like `problemMap` and `syntaxCardMap`) and wrap the derived values in `useMemo` hooks with proper dependencies to ensure efficient rendering and prevent redundant computation.
