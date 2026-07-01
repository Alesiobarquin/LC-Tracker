## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-04-07 - O(1) Map Lookups Replacing Array .find()
**Learning:** Found instances where arrays were mapped inside renders, using `.find()` to look up objects (like `allProblems.find(...)`). This causes a hidden O(N^2) bottleneck for large arrays.
**Action:** Use pre-computed O(1) hash maps (like `problemMap`, `problemTitleMap`, `syntaxCardMap`) to replace `.find()` inside mapping loops and render cycles.
