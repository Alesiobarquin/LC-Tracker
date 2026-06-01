## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-04-23 - O(N) Lookups in React Render Cycles
**Learning:** Found multiple instances where `Array.prototype.find()` was used to lookup items from the `allProblems` array inside React render functions. Since the array contains 250+ items, this creates O(N) operations on every render, adding up to poor performance, especially for lists.
**Action:** Use pre-computed hash maps (e.g. `problemMap`, `problemTitleMap`, `syntaxCardMap`) for O(1) lookups whenever fetching entities by ID or Title during render cycles.
