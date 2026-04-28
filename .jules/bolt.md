## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-18 - Repeated O(N) lowercasing inside filters
**Learning:** Found multiple instances where large arrays (like coding problems and syntax cards) were being filtered based on a search query using `.toLowerCase()` on string properties during every loop iteration. This causes significant performance degradation as string lowercasing is relatively expensive when run thousands of times per keystroke or render.
**Action:** Precompute `.toLowerCase()` strings into an exported Map or Record lookup at the data source level to ensure O(1) lowercased string retrieval inside filter functions.
