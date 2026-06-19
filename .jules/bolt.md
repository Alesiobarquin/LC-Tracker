## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-04-07 - Replace Array Lookups with Map Lookups in Renders
**Learning:** Using `array.find()` inside mapped lists or frequently re-rendered components like `Dashboard.tsx` causes hidden O(N^2) bottlenecks when the underlying dataset is large.
**Action:** Pre-compute O(1) dictionary lookups (`problemMap`, `syntaxCardMap`) in the data layer and use them directly for ID resolution inside render cycles. Do not wrap simple map lookups in `useMemo`.
