## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2025-02-18 - Replacing O(N) Arrays lookups with Hash Map Lookups in Render Loops
**Learning:** React render loops performing `.find()` operations on large arrays (like `allProblems` which has 250+ elements or `allSyntaxCards`) can introduce hidden O(N) performance bottlenecks in large datasets. These operations compound significantly when mapped or nested.
**Action:** Always utilize pre-computed hash maps (e.g., `problemMap`, `syntaxCardMap`) for O(1) dictionary lookups instead of `.find()`, particularly inside `.map()` iterations within render cycles.
