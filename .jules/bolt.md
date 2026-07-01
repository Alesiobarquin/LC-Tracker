## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-06-27 - O(N^2) hidden in ID resolution loops
**Learning:** Arrays mapping `.find` logic to resolve IDs (e.g., `effectiveReviewProblems.map(id => allProblems.find(p => p.id === id))`) introduce hidden O(N^2) bottlenecks when operating on larger datasets (like the 3800+ item `allProblems` array).
**Action:** Always pre-compute and export O(1) dictionary maps (like `syntaxCardMap` via `.reduce`) alongside raw arrays, and utilize property lookups (`map[id]`) instead of array `.find` during render or data processing loops.
