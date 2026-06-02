## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-10-24 - Cache lowercased strings outside of render loop
**Learning:** Performing string manipulation (`toLowerCase()`) on thousands of objects during a filter array cycle triggered by frequent state changes (e.g., search input) is slow.
**Action:** Pre-compute and cache derived string representations in O(1) maps alongside the data source to avoid repeatedly allocating strings during render cycles.
