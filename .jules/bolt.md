## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-06-23 - Map Lookups over Array Finds
**Learning:** Using `.find()` inside a `.map()` loop creates an O(N^2) bottleneck, which is particularly severe when checking large arrays like `allProblems` (3800 items).
**Action:** Always pre-compute O(1) hash maps (like `problemMap`, `problemTitleMap`, `syntaxCardMap`) for repetitive lookups to avoid severe CPU spikes during render cycles.
