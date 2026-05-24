## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-18 - Unnecessary Render Cycle O(N^2) Bottlenecks
**Learning:** Arrays of IDs being resolved to their corresponding objects using `.find()` inside a `.map()` block during the render cycle introduces hidden O(N^2) bottlenecks, especially with large datasets like `allProblems` (1500+ items).
**Action:** Always pre-compute hash maps for static data sets and use those Maps for O(1) lookups during UI rendering cycles.
