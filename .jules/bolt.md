## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-02 - O(n) lookups in React renders
**Learning:** Found several places where `Array.prototype.find()` was used inside React component bodies or `useMemo` hooks (e.g. `Dashboard`, `PatternFoundations`), which scales poorly for data lists.
**Action:** Implemented $O(1)$ Hash Maps (`problemTitleToProblemMap`, `syntaxCardMap`) to replace linear array lookups, a common frontend anti-pattern in the codebase.
