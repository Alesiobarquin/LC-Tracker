## 2024-05-14 - Optimize array lookups

**Learning:** `allProblems.find` is an O(N) operation and is frequently used across the codebase for exact ID or title lookups. This is highly inefficient in React renders.
**Action:** Replaced `allProblems.find(p => p.id === id)` with the existing `problemMap[id]` to convert O(N) searches into O(1) lookups. For title lookups, introduced `problemTitleToProblemMap` in `src/data/problems.ts` to also enable O(1) performance instead of searching an array with >1500 items on every render.
