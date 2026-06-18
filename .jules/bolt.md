## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-04-07 - Avoid Array.find() in render paths
**Learning:** Found instances where arrays of IDs were resolved into data objects by calling O(N) `.find()` on large datasets (~3800 items) directly in the component body (e.g. `Dashboard.tsx`, `FloatingSessionIndicator.tsx`). This acts as a hidden O(N^2) bottleneck when doing it for multiple IDs (like `.map(id => allProblems.find(...))`).
**Action:** Always pre-compute and export O(1) hash maps (e.g., `problemMap`, `syntaxCardMap`) and use dictionary lookups (`map[id]`) instead of `Array.find()` to resolve IDs in UI code.
