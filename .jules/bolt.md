## 2025-03-05 - O(N) Array lookups

**Learning:** The `allProblems` array contains over 3000 problems, causing `.find()` lookups to be slow when done in loops (O(N^2) behavior).

**Action:** Whenever repeatedly looking up problems by ID, use the O(1) `allProblemsById` Map instead.
