## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-18 - Avoid Hidden O(N) Array Methods in Rendering Cycles
**Learning:** Using `array.find(item => item.id === id)` repeatedly inside render cycles or `map` functions creates hidden O(N^2) bottlenecks when resolving arrays of IDs into data objects.
**Action:** Always pre-compute O(1) hash maps (like `problemMap` and `syntaxCardMap`) for rapid ID lookups during rendering to maintain O(N) overall complexity instead of O(N^2).
