# Solution expansion

The target is up to three useful solution approaches per problem, with new
examples in Python. Include a brute-force baseline when it explains an
improvement; do not claim an unsupported popularity ranking. Every option needs
matching reasoning, steps, complexity, code, attribution, and behavioral checks.
Keep existing defaults and C++ examples available.

## Part 1: NeetCode 250

This change adds the selector to library explanations and revealed recall
comparisons, plus 445 Python alternatives for all 250 core problems. There are
195 problems with three options and 55 with two, for 695 selectable approaches.
The same records serve the overlapping NeetCode 75/150 and Pareto curricula.

The content is split into reproducible topic batches in the reviewed manifest:

| Batch | Topics | Problems |
| --- | --- | ---: |
| `foundations` | Arrays/hashing, two pointers, sliding window, stack, binary search | 72 |
| `structures` | Linked lists, trees, tries, heaps | 53 |
| `graphs` | Backtracking, graphs, advanced graphs | 48 |
| `dynamic` | 1-D/2-D dynamic programming, greedy | 47 |
| `remaining` | Intervals, math/geometry, bit manipulation | 30 |

All batches are included in this change. New code is Python only, while the
default's language selector retains C++. The original solution is selected on
entry. Choosing another approach does not change study results or personal notes.
Source records, authored exceptions, generation commands, and verification limits
are documented in [problem references](problem-references.md#alternate-approaches).

Review the browser preview before committing or publishing, following AGENTS.md.

## Part 2: Existing extended references

Expand the 586 extended-catalog problems that already have a built-in reference.
Keep each record's existing source and license. Prioritize common easy/medium
interview problems in topic batches, with a reviewed manifest and behavior checks
for each added approach. Keep options limited to meaningful differences.

## Part 3: Remaining catalog coverage

Add problem-specific references to currently uncovered catalog problems before
expanding their alternatives. Prioritize useful interview practice and reliable,
licensed sources. Keep the missing-coverage message until a real explanation and
tested code are available. General pattern guidance remains a separate resource.
