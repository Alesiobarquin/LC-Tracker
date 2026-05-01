## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-05-01 - O(N) Array methods in render paths
**Learning:** `allProblems.find` and `allSyntaxCards.find` were being called repeatedly inside mapping loops (e.g., `effectiveReviewProblems.map(id => allProblems.find(...))`) within component bodies like `Dashboard.tsx` and `PatternFoundations.tsx`, leading to unnecessary O(N) overhead during renders.
**Action:** Created dedicated O(1) mappings (`problemMap`, `problemTitleToProblemMap`, `syntaxCardMap`) in data modules and used bracket notation for lookups.
