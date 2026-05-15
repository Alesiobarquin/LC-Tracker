## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.
## 2024-05-18 - Replacing O(N) Array.find with O(1) Map Lookups in Render
**Learning:** Found multiple instances of `allProblems.find(p => p.id === id)` inside render functions and `.map()` iterations in `Dashboard.tsx`. For arrays with ~1500+ items (`allProblems`), this causes massive overhead and slower re-renders.
**Action:** Replaced `Array.find` loops with `O(1)` object map lookups using existing `problemMap` and created a new `syntaxCardMap` for syntax cards. Always prefer O(1) pre-computed maps for ID-based data resolution in React renders.
