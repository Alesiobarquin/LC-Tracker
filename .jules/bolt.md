## 2024-05-24 - O(1) Map Lookups Over O(N) Array.find

**Learning:** `Array.find()` inside React loops or map functions creates an N+1 problem, causing O(N^2) complexity. This gets especially bad as the size of the array increases, causing performance bottlenecks during React renders.
**Action:** When a known array is searched frequently by a unique ID, reduce it to a Record map (`problemMap`) for O(1) lookups instead.
