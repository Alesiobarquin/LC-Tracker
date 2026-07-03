## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-06-29 - O(1) Map Lookups Replacing Array .find()
**Learning:** The `allProblems` and `allSyntaxCards` arrays were being mapped over using `O(N)` `.find()` methods inside components like Dashboard and FloatingSessionIndicator, creating potential UI freezing when mapping multiple elements against ~3800 problems.
**Action:** Pre-compute maps (`problemMap`, `syntaxCardMap`) for fast `O(1)` ID lookups to eliminate inner O(N) array search overhead within mapping functions or loop iterations.

## 2026-07-03 - O(1) Pre-computed Maps for String Searches
**Learning:** In `src/components/PatternFoundations.tsx`, finding problems by title with `allProblems.find(ap => ap.title.toLowerCase() === lowerTitle)` introduced hidden O(N) overhead inside mapping loops.
**Action:** Pre-compute maps like `problemTitleMap` in data files for O(1) string-based lookups to avoid re-evaluating `.toLowerCase()` and full array scans during render cycles.
