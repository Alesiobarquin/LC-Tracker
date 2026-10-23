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

The article batch adds 743 Python alternatives to 429 extended-catalog problems
using the same pinned NeetCode articles and the existing selector. There are
314 extended problems with three options and 115 with two. Combined with the
core set, this batch brought multiple-approach coverage to 679 problems. It
left 157 existing references with one option. The further batch below expands
127 of those references. Complete source alternatives and useful teaching
comparisons determine inclusion; a third option is not added just for a count.

The original explanation, Python/C++ examples, video, source, and license are
preserved for every expanded problem. The manifest records a hash of that
entire default as well as the pinned article hash. No interface, learning
behavior, or user-data changes are involved.

| Batch | Extended problems |
| --- | ---: |
| `foundations` | 183 |
| `structures` | 43 |
| `graphs` | 88 |
| `dynamic` | 78 |
| `remaining` | 37 |

Rebuild with the separate extended manifest:

```sh
python3 scripts/build-approach-references.py /path/to/neetcode-gh/leetcode \
  --manifest scripts/extended-approach-reference-manifest.json
npm run verify:approaches
```

The extended verifier executes 1,922 independent example/boundary checks across
all 743 new snippets, including in-place changes, structural results, stateful
API traces, multiple valid outputs, and fixed random-selection boundaries.
The same command still checks all 445 original core alternatives. These are
finite content checks, not exhaustive proofs or maximum-input benchmarks.
Source adaptations and Python-specific complexity notes are documented in
[problem references](problem-references.md#extended-catalog-alternatives).

## Part 3: Further existing references

The next batch adds 127 Python alternatives across 127 more problems: 90
walkccc-backed references and 37 NeetCode-backed references. Each gains a
second option, bringing multiple-approach coverage to 806 of the 836 bundled
references. The other 30 keep their current single option. No interface,
learning behavior, or user-data changes are involved.

Ten examples are adapted from separately pinned and hashed walkccc files.
The other 117 examples and all new explanations were written for LC Tracker
with AI assistance. Their attribution distinguishes authored code from the
related licensed reference. Source code, reasoning, steps, complexity, limits,
and behavioral fixtures remain together in the reviewed content module and
manifest. Every original default and all earlier alternatives are preserved.

```sh
python3 scripts/build-more-approach-references.py /path/to/walkccc/LeetCode
npm run verify:approaches
```

The source directory must contain the pinned revision documented in
[problem references](problem-references.md#further-alternatives). The builder
checks file, license, and complete-default hashes before writing records.
The additional-default importer also preserves these alternatives and rejects
an unreviewed default change.

The further verifier runs 393 independent example/boundary checks across all
127 examples. Cases include signed bit-state masks, exact rational division,
complete-tree structure, node-preserving flattening, snake movement into its
old tail, timed hit queries, duplicate island insertions, maze stopping rules,
and lexicographical ties. Together the three alternative batches run 3,160
finite checks. Slow or extra-space teaching baselines state their limits;
these checks are not exhaustive proofs or full-size performance measurements.

## Part 4: New catalog references with two approaches

The next batch adds 120 previously uncovered catalog problems: 87 medium and
33 easy. Each gains a Python/C++ default plus a second Python approach in the
existing selector. This brings the library to 956 built-in references, with
926 offering multiple approaches and 2,391 selectable solutions in total.
All 836 earlier complete reference records are preserved.

Examples include bucket versus sorted Maximum Gap, virtual-index versus sorted
Wiggle Sort II, memoized game states versus Grundy numbers for Flip Game II,
2D Fenwick versus per-row prefixes for mutable rectangle sums, trie versus map
prefix sums, and full-table versus one-row repeated-subarray DP.

Default code and 12 alternatives are adapted from the pinned walkccc source;
108 alternatives and all explanations were authored for LC Tracker with AI
assistance. The manifest hashes both default-language files and every adapted
alternative. The content module keeps reasoning, steps, complexity, teaching
limits, and authored snippets together. Source corrections are explicit in a
separate adaptation module. No interface, learning behavior, or user-data changes
are involved.

```sh
python3 scripts/build-catalog-approach-references.py /path/to/walkccc/LeetCode
npm run verify:approaches
```

The new verifier executes both Python options for all 120 problems, with
1,708 finite example, boundary, API-trace, structural, and small exhaustive-search
checks. It also syntax-checks all 120 C++ defaults and compiles/runs 17 native
boundary programs. Together the four approach batches run 4,868 Python checks.
The browser checks cover authored and adapted options on desktop and narrow
mobile screens in both themes, including language fallback and source credits.

## Part 5: Remaining catalog coverage

For future batches, add problem-specific references to currently uncovered catalog problems before
expanding their alternatives. Prioritize useful interview practice and reliable,
licensed sources. Keep the missing-coverage message until a real explanation and
tested code are available. General pattern guidance remains a separate resource.
