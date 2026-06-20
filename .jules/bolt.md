## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-04-08 - Use Pre-computed Maps for Dataset Rendering
**Learning:** O(N^2) `.find()` lookups inside `.map()` render functions across large arrays can cause heavy performance bottlenecks.
**Action:** Replace `.find()` mapping inside lists with pre-computed O(1) hash maps (like `syntaxCardMap` and `problemMap`) to eliminate hidden bottlenecks in React components.
