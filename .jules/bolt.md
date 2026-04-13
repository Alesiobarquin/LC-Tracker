## 2024-04-07 - Inefficient Filtering inside useMemo
**Learning:** Found an inefficient pattern in `src/components/ProblemLibrary.tsx` where string lowercasing and array unique calculations were done inside `filter`/`sort` loops on every keystroke.
**Action:** Always extract invariant computations outside loop boundaries within `useMemo` blocks to save CPU cycles on large dataset UI filtering.

## 2024-04-12 - Replacing O(N) Lookups with Maps and Reusing Test Promises
**Learning:** O(N) array scans (`allProblems.find()`) repeated inside React component loops scale poorly and degrade UI responsiveness. Additionally, calling a function multiple times sequentially inside `expect(...).rejects.toThrow(...)` causes unexpected failures when tests rely on `mockResolvedValueOnce`.
**Action:** Use pre-computed O(1) dictionaries (like `problemMap` and `problemTitleMap`) instead of `Array.find()` whenever looking up statically sized datasets inside renders. Ensure single-invocation assumptions in tests store the promise explicitly to be awaited by multiple assertions.
