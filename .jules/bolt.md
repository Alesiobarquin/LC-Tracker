## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-05-18 - Array Lookups in React Render Loop

**Learning:** Array `.find()` methods within loops and React render cycles (like in Dashboard.tsx or PatternFoundations.tsx) can become performance bottlenecks as the problem catalog grows, resulting in O(N) operations scaling with the catalog size per lookup.

**Action:** Replace `allProblems.find(...)` and `allSyntaxCards.find(...)` with pre-computed O(1) hash maps (e.g. `problemMap` by id, `problemTitleMap` by lowercase title, `syntaxCardMap` by id) initialized once at the module level.
