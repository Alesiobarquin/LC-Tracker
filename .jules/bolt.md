## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-18 - Nested Lookup inside Pattern Foundations useMemo
**Learning:** The `PatternFoundations.tsx` map was executing `allProblems.find(...)` repeatedly, causing an O(N) lookup on an inner loop over hundreds of items. This causes massive slowdowns on re-renders, identical to the pattern in `ProblemLibrary.tsx`.
**Action:** Replaced `allProblems.find()` with an O(1) property lookup dictionary (`problemTitleToProblemMap`) precomputed dynamically in `problems.ts`.
