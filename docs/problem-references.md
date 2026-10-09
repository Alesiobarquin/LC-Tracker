# Built-in problem references

The 250 core library problems share one reference each across Pareto, NeetCode
75, 150, and 250. Another 486 extended-catalog problems have built-in references,
for 736 total. This includes String Compression (#443) and Reverse Words in a
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
examples, and merge sort instead of shell sort for Sort an Array.
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

During recall, the pre-reference answer stays in `RecallAttempt.answer`.
Edits made after revealing a reference are stored separately as optional
`revisedAnswer`; rating still concerns the original answer. The optional
`solution` reference type distinguishes a built-in problem solution from historical
`reference` records representing general pattern guidance. Old records keep their
existing meanings.

Personal explanations continue to use `problem_progress.notes`, optionally with
a trailing Python or C++ fenced code block. Historical plain notes still work.
Choosing the built-in view does not delete a personal draft. Removing the personal
explanation is explicit and takes effect when the recall outcome saves.
Original answer, corrections, personal notes, timing, activity, and receipt save
through the existing atomic recall operation. A lost-response retry retains its
original UUID and frozen completion. No database schema migration is required;
the added recall fields live in the existing study-state JSON.
