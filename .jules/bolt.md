## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-05-18 - Replace array `.find()` with O(1) Map lookups inside loops
**Learning:** Found a performance bottleneck in `src/components/PatternFoundations.tsx` where an array `.find()` with string lowercasing was executed inside a `.map()` loop during render, causing O(N^2) complexity.
**Action:** Always replace array lookups (like `.find()`) inside mapping loops with pre-computed O(1) Map lookups (e.g., using `problemTitleMap.get()`) to prevent hidden performance penalties on large datasets.
