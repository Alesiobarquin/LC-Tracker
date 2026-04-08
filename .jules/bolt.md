## 2025-03-06 - O(N) array.find lookups vs O(1) map.get
**Learning:** Found multiple usages of `allProblems.find(p => p.id === id)` scattered across loops and component renders in `Dashboard.tsx`, `useUserData.ts`, etc. Given `allProblems` holds > 250 problems, repeatedly calling `.find` creates a hidden performance bottleneck causing O(N*M) time complexity during loops or react tree re-renders.
**Action:** Always create a `problemMap` (or similar ID-to-object Map) in data definition files when you expect frequent lookups by ID, and use `problemMap.get(id)` which guarantees O(1) lookups.
