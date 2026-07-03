1. **Explore `src/data/problems.ts` to add `problemTitleMap`.**
   - The memory states: `Pre-computed maps like problemTitleMap (lowercase titles in src/data/problems.ts) and syntaxCardLowerMap are also utilized to avoid performance bottlenecks from repetitive searches or string processing in render cycles.`
   - I will create `problemTitleMap` mapping lowercased titles to `Problem` objects in `src/data/problems.ts`.
2. **Update `src/components/PatternFoundations.tsx` to use `problemTitleMap`.**
   - In `patternData = useMemo(...)`, replace `allProblems.find(ap => ap.title.toLowerCase() === lowerTitle)` with `problemTitleMap[lowerTitle]`.
   - Update imports to include `problemTitleMap`.
3. **Run testing/verification.**
   - Run `pnpm lint` and `pnpm test` (removing `.pnpm-lock.yaml` if necessary, though I shouldn't need to run install).
4. **Log learning in `.jules/bolt.md`.**
   - Journal an entry documenting the optimization (using O(1) maps for nested find based on string lowercasing).
5. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
