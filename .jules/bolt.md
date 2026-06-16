## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2026-06-16 - Array find inside map for data lookup
**Learning:** Found multiple instances where `allProblems.find(p => p.id === id)` or `allSyntaxCards.find(c => c.id === id)` were used inside map or forEach loops on dashboard and indicator renders, creating hidden O(N*M) time complexity.
**Action:** Created and used `problemTitleMap`, `syntaxCardMap`, and utilized `problemMap` for O(1) dictionary lookups to eliminate expensive array scans during render cycles.
