## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2026-05-30 - O(1) Title Mapping for Problems
**Learning:** Found an inefficient pattern in `src/components/PatternFoundations.tsx` where a `.find()` lookup on `allProblems` with a string lowercasing check was done inside a loop (`map()`).
**Action:** Always pre-compute hash maps for repetitive search operations using a key (like problem lowercased titles) to achieve O(1) performance instead of O(N^2).
