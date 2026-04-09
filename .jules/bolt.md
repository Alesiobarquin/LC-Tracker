## 2024-04-09 - Avoid O(N) Lookups in React Render Cycles
**Learning:** Found multiple instances of `allProblems.find(p => p.id === id)` inside render functions and data processing loops. In a codebase where `allProblems` could be large, this causes O(N) operations that scale poorly and block the main thread unnecessarily.
**Action:** Created a pre-computed `problemMap: Record<string, Problem>` to turn O(N) lookups into O(1) property access. When you have a static or semi-static list of items identified by ID, always create a map/dictionary for lookups instead of using `.find()` repeatedly.
