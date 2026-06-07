## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2025-02-27 - O(N^2) render loop bottlenecks via .find()
**Learning:** Found multiple instances where large arrays (~3800 items) like `allProblems` and `allSyntaxCards` were being searched using `.find()` inside React rendering loops (`.map()` or `forEach`), causing hidden O(N^2) performance overhead.
**Action:** Created pre-computed hash maps (`problemMap`, `problemTitleMap`, `syntaxCardMap`) in the data files and replaced `.find()` calls with O(1) dictionary lookups (`map[id]`) in the components to ensure constant time complexity during renders.
