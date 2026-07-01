1. Add `syntaxCardMap` to `src/data/syntaxCards.ts`.
2. Add `problemTitleMap` to `src/data/problems.ts`.
3. Update `src/components/Dashboard.tsx` to use `problemMap` instead of `allProblems.find(p => p.id === ...)`. Also use `syntaxCardMap` instead of `allSyntaxCards.find(c => c.id === ...)`.
4. Update `src/components/FloatingSessionIndicator.tsx` to use `problemMap`.
5. Update `src/components/PatternFoundations.tsx` to use `problemTitleMap`.
6. Run `pnpm lint` and `pnpm test`.
7. Verify functionality by checking if the performance changes work as expected.
