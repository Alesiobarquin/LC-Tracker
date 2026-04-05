## 2025-04-05 - O(N²) Loop Bottlenecks on Render

**Learning:** Component-level `useMemo` blocks accessing static data arrays inside loops (like iterating user progress and calling `allProblems.find()`) create severe O(N*M) bottlenecks during React rendering, particularly when data sets grow (like tracking hundreds of solved problems).
**Action:** When working with large static reference arrays, initialize an O(1) Hash Map (e.g., `Map` or Record) at the module level (outside the component) to eliminate array lookups inside iteration loops.