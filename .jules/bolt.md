## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-06-29 - O(1) Map Lookups Replacing Array .find()
**Learning:** The `allProblems` and `allSyntaxCards` arrays were being mapped over using `O(N)` `.find()` methods inside components like Dashboard and FloatingSessionIndicator, creating potential UI freezing when mapping multiple elements against ~3800 problems.
**Action:** Pre-compute maps (`problemMap`, `syntaxCardMap`) for fast `O(1)` ID lookups to eliminate inner O(N) array search overhead within mapping functions or loop iterations.

## 2024-07-04 - O(1) Title Map Lookups Replacing Array .find() inside Mapping loops
**Learning:** Found an `allProblems.find(ap => ap.title.toLowerCase() === lowerTitle)` nested inside an array mapping iteration within `useMemo` in `src/components/PatternFoundations.tsx`, leading to O(N^2) complexity with ~3800 problems.
**Action:** Created `problemTitleMap` to pre-compute lowercase problem titles mapping to `Problem` objects for rapid `O(1)` string lookups, avoiding repetitive lowercasing and array searching on every render calculation.
