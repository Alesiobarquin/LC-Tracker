## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-05-16 - O(N) lookup inside React useMemo loops
**Learning:** In PatternFoundations.tsx, the codebase was performing an O(N) lookup (via `allProblems.find`) inside a `.map` operation that recalculates derived pattern data on every render (or when dependencies change). This can bottleneck performance as datasets grow.
**Action:** Use pre-computed hash maps (e.g. `problemTitleMap`) for O(1) lookups whenever performing large dataset cross-referencing inside a React component's `useMemo`.
