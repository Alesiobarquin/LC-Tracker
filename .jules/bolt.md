## 2025-05-05 - O(n*m) Array Lookup in useMemo
**Learning:** Found an O(n*m) performance bottleneck in `src/components/PatternFoundations.tsx` because an inner loop was doing `allProblems.find(p => p.title.toLowerCase() === lowerTitle)` which resulted in an expensive nested scan.
**Action:** Use precomputed O(1) hash maps (like `problemTitleToProblemMap`) instead of array lookups when resolving large datasets on the frontend to prevent UI thread blockage.
