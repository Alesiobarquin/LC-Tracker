## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-06-25 - Inefficient Array Lookups inside React mapping functions
**Learning:** Found an inefficient pattern in `src/components/Dashboard.tsx` where arrays of IDs were resolved into objects using `array.find(item => item.id === id)` inside mapping operations (e.g. `.map()`). This introduces hidden O(N^2) bottlenecks on large datasets.
**Action:** When resolving arrays of IDs into data objects within React components, always use `useMemo` to perform the lookup via pre-computed O(1) maps like `problemMap` or `syntaxCardMap` to prevent redundant O(N) calculations and improve render cycle efficiency.
