## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-04-27 - Replaced O(N) Array.find with O(1) Map Lookups in Dashboard
**Learning:** Found multiple instances in `src/components/Dashboard.tsx` where `allProblems.find(p => p.id === id)` and `allSyntaxCards.find(c => c.id === id)` were called inside map loops to retrieve items by ID. This resulted in unnecessary O(N) operations inside rendering paths.
**Action:** Replaced these `Array.find()` calls with `problemMap[id]` and created a new `syntaxCardMap` in `src/data/syntaxCards.ts` for O(1) map lookups, significantly improving performance for dashboard data loading.
