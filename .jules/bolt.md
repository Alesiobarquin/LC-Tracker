## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2025-02-12 - Replacing O(N^2) Array Find within Map with O(1) Map Lookup
**Learning:** Found an inefficient pattern in `src/components/Dashboard.tsx` where `.find` array searches were happening inside `.map` loops, creating an O(N^2) bottleneck for rendering lists, despite O(1) maps like `problemMap` existing.
**Action:** Replace `allProblems.find(p => p.id === id)` and `allSyntaxCards.find(c => c.id === id)` with `problemMap[id]` and `syntaxCardMap[id]` when performing lookups inside map functions or anywhere IDs are available.
