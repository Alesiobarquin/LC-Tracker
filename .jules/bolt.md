## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2026-06-29 - O(1) Map Lookups Replacing Array .find()
**Learning:** The `allProblems` and `allSyntaxCards` arrays were being mapped over using `O(N)` `.find()` methods inside components like Dashboard and FloatingSessionIndicator, creating potential UI freezing when mapping multiple elements against ~3800 problems.
**Action:** Pre-compute maps (`problemMap`, `syntaxCardMap`) for fast `O(1)` ID lookups to eliminate inner O(N) array search overhead within mapping functions or loop iterations.

## 2026-07-14 - Replace O(N*M) String Allocation with O(1) Title Map
**Learning:** Inside `PatternFoundations.tsx`, `allProblems.find(ap => ap.title.toLowerCase() === lowerTitle)` iterated over the full ~3800 element catalog inside a `.map` loop, repeating string allocations and O(N) searches.
**Action:** Pre-compute mappings on app load for string-matched attributes like `.title.toLowerCase()` into a hash map (`problemTitleMap`), bringing lookup overhead inside UI mapping cycles from O(N) string processing to O(1) constant time map retrieval.
