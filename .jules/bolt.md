## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-05-11 - Optimizing O(N) Array Lookups to O(1) Maps
**Learning:** React components (`Dashboard.tsx`, `PatternFoundations.tsx`, `FloatingSessionIndicator.tsx`) were using `Array.prototype.find()` on `allProblems` (1500+ items) and `allSyntaxCards` inside map functions and loops. This causes unnecessary O(N) search operations that can lead to performance bottlenecks, especially since UI components recalculate on state changes.
**Action:** Used existing pre-computed O(1) dictionary maps (`problemMap`, `syntaxCardMap`) and generated a new map (`problemTitleToProblemMap`) to replace `.find()` array methods with direct object property lookups `map[id]`.
