# Built-in problem references

The 250 core library problems share their references across Pareto, NeetCode
75, 150, and 250. Each core problem has two or three selectable approaches:
195 have three and 55 have two. The existing default remains first, with its
Python/C++ code preserved. The 445 additional examples are Python only.
Another 706 extended-catalog problems have built-in references,
for 956 total. Of these extended problems, 676 now have two or three selectable
approaches, adding 990 Python alternatives. There are 926 problems with multiple
approaches across the core and extended sets. This includes String Compression (#443) and Reverse Words in a
String (#151), II (#186), and III (#557). Remaining catalog problems use external
references or personal notes; no general pattern lesson is labeled as their
exact solution.

Articles, Python/C++ examples, and YouTube mappings are adapted from
[neetcode-gh/leetcode](https://github.com/neetcode-gh/leetcode), pinned to
`3186ede2ea4c4788e87be4b509bf2b66d5eba0e9`. The repository's MIT license is copied
to `public/neetcode-license.txt` and linked alongside every built-in reference.
Each record links to its source at that revision. Reverse Words in a String
has Python code but no article at this revision; its explanation and C++
translation were written for LC Tracker following that source example.
Videos are included only when the source publishes a valid mapping (420 total);
missing videos do not prevent comparison with the explanation and code.

The next batch adds 100 references (80 medium, 20 easy), prioritizing earlier
interview-style catalog problems across arrays, strings, linked lists, trees,
heaps, and dynamic programming. Their explanations, steps, complexity notes,
and pitfalls are written for LC Tracker. Code is adapted from
[walkccc/LeetCode](https://github.com/walkccc/LeetCode), pinned to
`9b85aa15e086d0b5dc1ead7184bca547942e6ff6`. Each entry links to its source folder,
credits Peng-Yu Chen, and links to `public/walkccc-license.txt` (MIT).
These entries do not invent NeetCode video mappings.

The reviewed source paths, hashes, difficulty mix, and authored notes are in
`scripts/additional-reference-manifest.json`. Rebuild them with:

```sh
python3 scripts/build-additional-problem-references.py --cache-dir /private/tmp/walkccc-source
python3 scripts/verify-additional-references.py --cpp
```

The generator downloads only the pinned source files and checks their SHA-256
hashes. Add `--offline` to require previously cached sources. The original
NeetCode importer and this generator can be run independently; neither replaces
entries attributed to the other source.

`scripts/reference-code-adaptations.py` keeps the reviewed translations and
repairs reproducible. It chooses matching iterative flatten and bit-mask
approaches, uses the complete-tree shortcut, replaces `SortedDict` with standard
Python binary search, materializes a range-update result, avoids expression
`eval`, and uses an iterative string reversal. It also widens ugly-number
intermediates, handles an unchanged mutation target, and compares BST node
identities so equal-valued distinct nodes are not mistaken for one node.
Python translations are supplied for five C++-only examples. Complexity notes
state language-specific workspace or algorithm differences where they exist.

All 100 new Python entries have behavioral checks, including in-place results,
list/tree structure, and a 10,000-character string. All 100 new C++ snippets are
syntax checked, and 15 boundary programs (including Valid Sudoku) compile
and run as part of the required GitHub verification check.
Valid Sudoku uses the requested one-pass row, column, and box sets, with Python
matching the supplied example and C++ following the same approach. Its rewritten
explanation covers box coordinates, checking before insertion, empty cells, and
the fixed 9×9 complexity. Both languages check empty, valid partial, valid complete,
and independent row, column, and box conflicts while preserving the board.
The broader snippet verifier checks syntax across all bundled C++ entries.
These checks are finite examples and boundaries, not exhaustive correctness proofs.

A subsequent catalog batch adds 120 previously uncovered problems (87 medium,
33 easy), each with a complete Python/C++ default and a second Python approach.
Default code and 12 alternatives are adapted from the same pinned walkccc
revision. The other 108 alternatives and all explanations were authored for
LC Tracker with AI assistance. Authored alternatives link a related reference
without attributing their code to that source.

The source paths, SHA-256 hashes, and approach names are recorded in
`scripts/catalog-approach-reference-manifest.json`; reasoning, steps, complexity,
limits, and inline alternatives are in
`scripts/catalog-approach-reference-content.py`. Rebuild and verify with:

```sh
python3 scripts/build-catalog-approach-references.py /path/to/walkccc/LeetCode
python3 scripts/verify-catalog-approaches.py --cpp
```

The builder checks the pinned files and license before writing. Adaptations in
`scripts/catalog-reference-code-adaptations.py` use shift-only division, fix
Word Pattern II's current-offset check, preserve Flip Game II positions and
repair its C++ cache lookup, avoid duplicate-driven Python quickselect recursion,
validate reconstruction coverage, correct two C++ portability/API errors,
normalize knight probabilities, skip the trie terminal marker in Longest Word,
and keep tiling states reduced modulo the problem modulus. It also makes small
annotation, separator, boundary, and allocation corrections. These adaptations
affect only the 120 new records; all 836 earlier references remain unchanged.

All 240 Python examples in this batch pass 1,708 example, boundary, API-trace,
structural, and small exhaustive-search checks. Every C++ default is syntax
checked, and 17 native boundary programs compile and run. Checks include
node-preserving tree splits, repeated updates, empty iterator rows, duplicate
dictionary entries, unknown-array reader-call bounds, and a duplicate-heavy
wiggle arrangement. The small searches cover every +/- game state through
length seven and all five-element permutations for chunk sorting. They are
finite checks, not full-input correctness proofs or performance benchmarks.

`src/data/problemReferences/*.json` contains the bundled references. Vite loads
only the requested reference after comparison or an explicit library visit.
`src/data/problemVideos.json` holds NeetCode's published problem-to-video mapping;
the application does not fetch YouTube or execute reference code in the browser.
External videos can change availability independently of an application release.

To reproduce the import from a local checkout of that revision:

```sh
python3 scripts/build-problem-references.py /path/to/neetcode-gh/leetcode
python3 scripts/verify-problem-references.py --cpp
```

The importer takes intuition, steps, complexity, and code from the same approach.
It requires an explanation, steps, complexity, Python, and C++ from one approach,
without a third-party Python dependency. It prefers the final complete approach,
with explicit choices for the simpler subtree DFS, kth-largest min-heap, and dependency-free interval-stream set/sort
examples, merge sort for Sort an Array, and the one-pass sets for Valid Sudoku.
Design In-Memory File System is skipped because the pinned article lacks a
complete bilingual approach. It adds missing standard Python imports, adapts
NeetCode method names
to LeetCode, adapts meeting intervals to LeetCode's `[start, end]` arrays, and
repairs a C++ narrowing conversion in Spiral Matrix, replaces compiler-specific
`__gcd` with C++17 `std::gcd`, resolves a member/method name collision in
Diameter of N-Ary Tree, and ensures the Python Reverse Words III loop advances
past spaces. LeetCode provides node types and problem-specific APIs (such as
`isBadVersion`,
`MountainArray`, and `NestedInteger`). The syntax check supplies declarations
for those interfaces and standard C++ headers. The Python checks load every
example and exercise selected normal
and edge cases; they are not an exhaustive correctness proof for every solution.

## Alternate approaches

The NeetCode 250 expansion and the extended-catalog batch follow the
[solution expansion plan](solution-expansion.md). Options are curated teaching
comparisons, not a measured popularity ranking. Useful brute-force approaches
are labeled as baselines that may exceed the full problem limits. Approaches
that directly violate a problem's operator restrictions are excluded; Product
of Array Except Self also excludes division. Problems with two useful options
do not gain an artificial third one.

`scripts/approach-reference-manifest.json` records the default, alternate names,
topic batch, pinned source path, and article SHA-256 for every core problem.
The generator checks all selected article hashes and defaults before writing:

```sh
python3 scripts/build-approach-references.py /path/to/neetcode-gh/leetcode
npm run verify:approaches
```

An extracted archive of the pinned revision also works. `--batch foundations`,
`structures`, `graphs`, `dynamic`, or `remaining` rebuilds one topic batch.
Refreshing the original default importer preserves alternate entries and rejects
an unexpected default change for a problem that already has alternatives.

Each alternate contains its own explanation, complexity, Python code, and source.
The pinned articles supply 441 examples. Four Python examples are authored for
LC Tracker: merging character intervals for Partition Labels, a reverse scan for
Roman to Integer, round-robin gap allocation for Text Justification, and exhaustive
edge subsets for Remove Max Number of Edges to Keep Graph Fully Traversable.
The latter is explicitly an exponential teaching baseline. The attribution
distinguishes authored code from adapted code and links the related source
without assigning its MIT license to LC Tracker's authored examples.

`scripts/approach-reference-notes.py` also supplies explanations for the
hash-map trie, wildcard-search trie, original indices in sorted Two Sum, and
Python's fixed-width full-adder simulation. It adapts judge class names and repairs
the bit-by-bit full adder's carry calculation to avoid addition/subtraction
operators. Explanatory pseudocode and the following algorithm steps survive
import; implementation tabs are not embedded in the explanation.
Sorting workspace notes use Python's worst-case bound, and the hash-set
permutation example materializes a list of lists for its declared return type.

The offline verifier loads all 445 added Python snippets and executes 845 finite
example/boundary checks covering every added approach. Checks include
stateful API operations, list/tree structure, in-place changes, multiple valid
output orders, wildcard searches, zeroes, negative values, and impossible cases.
GitHub's required `verify` job runs it. These checks do not prove correctness
for every input or that a teaching baseline meets the maximum time limits.

### Extended-catalog alternatives

`scripts/extended-approach-reference-manifest.json` adds 743 Python approaches
to 429 existing extended references: 314 have three options and 115 have two.
Examples include Count Primes, Design Browser History, Word Break II, Number
of Provinces, String Compression, and Sort an Array. All new code is adapted
from the same pinned NeetCode revision and uses its existing MIT attribution.
This article batch preserves the 250 core records and the 100 walkccc defaults.
The [further batch](#further-alternatives) expands 90 of those walkccc references
and 37 other single-option references. Thirty bundled references retain one
option; minor rewrites are not added solely to increase their counts.

The extended manifest pins each source article's SHA-256 and the entire existing
default's SHA-256, excluding only the new `alternatives` field. Generation
rejects a changed article or default before writing any records. The offline
verifier also checks default hashes. Rebuild all extended batches with:

```sh
python3 scripts/build-approach-references.py /path/to/neetcode-gh/leetcode \
  --manifest scripts/extended-approach-reference-manifest.json
npm run verify:approaches
```

Add `--batch foundations`, `structures`, `graphs`, `dynamic`, or `remaining`
to rebuild one topic batch. The default manifest still rebuilds NeetCode 250
independently, and its regenerated alternatives remain identical.

`scripts/extended-approach-fixtures.py` supplies independent expected examples,
boundaries, and stateful operation traces for every new approach. Its verifier
runs 1,922 checks across all 743 snippets, covering graph cycles, missing results,
negative values, inclusive intervals, tied rankings, iterator exhaustion,
cache eviction, corrected list/tree structures, in-place compression, and
deterministic boundaries for weighted random selection. Randomized outputs
are checked by their contract, not by requiring one arbitrary answer.
The required GitHub `verify` job runs both core and extended checks through
`npm run verify:approaches`. These finite examples do not establish exhaustive
correctness or full-size performance.

Reviewed adaptations in `scripts/approach-reference-notes.py` add standard
logarithm imports, use LeetCode's `minCost` method name for Paint House, remove
a debug print from distinct-island counting, return a list of crawled URLs,
and preserve Recover Binary Search Tree's in-place return contract. The
inorder closest-value example accumulates into one list instead of repeatedly
concatenating lists, so its linear time claim also holds on skew trees.
`scripts/extended-approach-reference-notes.py` supplies Python-specific
workspace and string-comparison bounds. It explicitly labels String
Compression's extra-space baseline as exceeding the constant-space requirement.
These content repairs do not change the existing defaults.

### Further alternatives

`scripts/more-approach-reference-manifest.json` adds a second approach to 127
more existing references: 90 from the walkccc group and 37 from the NeetCode
group. Examples include 01 Matrix, Single Number II, H-Index, Game of Life,
Path Sum III, Divide Chocolate, Design Snake Game, and both rolling-maze
variants. That batch brought the library to 806 problems with multiple options;
the subsequent 120-problem catalog batch brings the current total to 926.

Ten code examples are adapted from separate Python files in
[walkccc/LeetCode](https://github.com/walkccc/LeetCode/tree/9b85aa15e086d0b5dc1ead7184bca547942e6ff6),
at the same pinned revision as their defaults. The manifest records each
source path and SHA-256, the license SHA-256, and the complete existing default
SHA-256. They retain Peng-Yu Chen's attribution and the bundled MIT license.
The remaining 117 code examples and all explanations were written for LC
Tracker with AI assistance in `scripts/more-approach-reference-content.py`.
Authored entries use `codeAuthor` and `explanationAuthor` to identify LC Tracker;
their source link and license describe the related reference and do not assign
that source's license to the new code. The interface already supports both
attribution forms.

Rebuild from an extracted archive or checkout of the pinned walkccc revision:

```sh
python3 scripts/build-more-approach-references.py /path/to/walkccc/LeetCode
npm run verify:approaches
```

The builder validates every selected source, license, and default before any
writes. `build-additional-problem-references.py` now preserves alternatives
when refreshing those defaults, and rejects a changed default pending review.
Neither builder changes the earlier 250 core or 429 extended alternative sets.

`scripts/more-approach-fixtures.py` reuses established examples for the existing
reference group and adds problem-specific contracts. Its verifier executes
393 checks across all 127 added snippets, including exact expected values,
tree/list structure, original node identities during flattening, in-place
boards, stateful operations, API mocks, and nonunique output contracts.
The required `verify:approaches` command now runs all three batches for 3,160
finite checks. This verifies examples and boundaries, not every possible input.
Teaching baselines state time, memory, recursion, or API-query limits, and
extra-space word reversal is explicitly labeled against the problem's space
restriction. Original defaults, C++ examples, sources, videos, and personal
study state remain intact.

The approach title buttons change explanation, complexity, code, and attribution together in
both the library and revealed recall comparison. Python-only approaches cannot
display the default's C++ code. Approach selection is local to the view; reloads
start at the default. Original answers, corrections, personal notes, frozen
completions, and the historical `solution` reference type retain their existing
behavior. References remain lazy-loaded by problem, and no database migration
or user-data mutation is involved.

During recall, the pre-reference answer stays in `RecallAttempt.answer`.
Edits made after revealing a reference are stored separately as optional
`revisedAnswer`; rating still concerns the original answer. The optional
`solution` reference type distinguishes a built-in problem solution from historical
`reference` records representing general pattern guidance. Old records keep their
existing meanings.

Personal explanations continue to use `problem_progress.notes`, optionally with
a trailing Python or C++ fenced code block. Historical plain notes still work.
Recall comparison opens the built-in solution first when one exists and moves
focus to the comparison section. Saved notes remain selectable and editable;
their presence does not replace the solution. The selector contains only built-in
solutions and personal notes; external links and pattern guidance remain below.
Resumed checks using a removed selector option display the built-in solution if
available. Historical reference types and frozen completions remain intact.
Choosing the built-in view does not delete a personal draft. Removing the personal
explanation is explicit and takes effect when the recall outcome saves.
Original answer, corrections, personal notes, timing, activity, and receipt save
through the existing atomic recall operation. A lost-response retry retains its
original UUID and frozen completion. No database schema migration is required;
the added recall fields live in the existing study-state JSON.
