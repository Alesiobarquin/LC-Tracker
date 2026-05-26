1. **Add Lookups for Problems and Syntax Cards**
   - Add `problemTitleMap` to `src/data/problems.ts` to allow O(1) title lookup (useful in `PatternFoundations.tsx`).
   - Add `syntaxCardMap` to `src/data/syntaxCards.ts` to allow O(1) id lookup (useful in `Dashboard.tsx`).

2. **Optimize `src/components/Dashboard.tsx`**
   - Import `problemMap` from `src/data/problems.ts` and `syntaxCardMap` from `src/data/syntaxCards.ts`.
   - Replace O(N) calls to `allProblems.find(p => p.id === ...)` with O(1) lookups `problemMap[...]`.
   - Replace O(N) calls to `allSyntaxCards.find(c => c.id === ...)` with O(1) lookups `syntaxCardMap[...]`.

3. **Optimize `src/components/FloatingSessionIndicator.tsx`**
   - Import `problemMap` from `src/data/problems.ts`.
   - Replace `allProblems.find(p => p.id === activeSession.problemId)` with `problemMap[activeSession.problemId]`.

4. **Optimize `src/components/PatternFoundations.tsx`**
   - Import `problemTitleMap` from `src/data/problems.ts`.
   - Replace O(N) `allProblems.find(ap => ap.title.toLowerCase() === lowerTitle)` with `problemTitleMap[lowerTitle]`.

5. **Run tests & pre-commit steps**
   - `npm run lint` & `npm run test`
   - Pre-commit checklist
