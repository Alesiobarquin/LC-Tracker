## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-18 - Pre-compute properties for UI Filtering
**Learning:** Performing expensive string manipulations like `.toLowerCase()` on lists during every user input keystroke causes performance degradation. Array lookups inside mapping loops (`.find()`) also introduce hidden O(N^2) bottlenecks on large datasets.
**Action:** Extract and pre-compute UI search values (like concatenated lowercased text or map lookups) into `useMemo` blocks to keep filtering operations lightweight and fast.
