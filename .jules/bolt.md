## 2024-04-13 - O(N) Array Lookup inside React Iteration Cycles

**Learning:**
The application frequently iterates over `allProblems.find(p => p.id === id)` or `allProblems.find(p => p.title === title)` within loops (like `reduce`, `map` and `forEach`) or component render cycles. Given the extensive list of algorithm problems, these O(N) searches quickly multiply and become major performance bottlenecks causing latency and unnecessary heavy CPU rendering cycles.

**Action:**
Always build and use dictionary mappings (like `problemMap` for IDs and `problemTitleMap` for titles) to enable O(1) lookups. When rendering loops or data transformations occur in `src/components`, immediately check if there's an `O(N)` find over large datasets that could be converted to O(1) by pulling from the map.
