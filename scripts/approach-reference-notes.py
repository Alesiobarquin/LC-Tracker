"""Authored explanations and reviewed adaptations for additional Python approaches.

AUTHORED contains LC Tracker code, not code attributed to the linked NeetCode
article. EXPLANATIONS fills gaps in the pinned source while retaining its code.
"""

EXPLANATIONS = {
('two-sum', 'Sorting'): '''### How it works

Sort `(value, original index)` pairs, then move two pointers toward each other. If their sum is too small, advance the left pointer; if it is too large, move the right pointer left. Keeping the original index beside each value lets the answer refer to the input's positions after sorting.

### Steps

1. Build a list of value/index pairs and sort it by value. The input array stays unchanged.
2. Put a pointer at each end of the sorted list.
3. If the two values sum to the target, return their original indices.
4. If the sum is below the target, advance the left pointer; otherwise move the right pointer left.
5. Stop before the pointers meet so the same element is never used twice. The problem guarantees one valid pair.

### Complexity

- Time complexity: `O(n log n)` for sorting plus a linear scan.
- Space complexity: `O(n)` for value/index pairs and Python's sorting workspace.

### Things to watch for

- Return original indices, not sorted positions or the values themselves.
- Equal values at different indices can form a valid pair.
- Sorting the original values alone would lose the index mapping.''',
('sum-of-two-integers', 'Bit Manipulation'): '''### How it works

Simulate a 32-bit full adder one bit at a time. XOR of the two input bits and the incoming carry gives the result bit. The next carry is set when at least two of those three bits are set: `(a_bit & b_bit) | (a_bit & carry) | (b_bit & carry)`. This computes the sum without addition or subtraction operators.

Python integers have arbitrary precision, so this algorithm deliberately builds a 32-bit result and then interprets its sign bit as two's complement. The problem's input bounds keep the required sum within this signed range.

### Steps

1. Start with a zero result and zero carry.
2. For bit positions 0 through 31, extract one bit from each input using shifts and a mask.
3. XOR the input bits with the incoming carry to obtain the current result bit.
4. Compute the next carry using the three pairwise AND operations, then set the result bit when needed.
5. If the unsigned result exceeds `0x7FFFFFFF`, convert it to a negative Python integer with `~(result ^ 0xFFFFFFFF)`.

### Complexity

- Time complexity: `O(1)` for the fixed 32-bit loop; `O(w)` for a generalized width `w`.
- Space complexity: `O(1)` for the fixed-width problem.

### Things to watch for

- Use bitwise operations for carry as well as for the result; adding the three bits would violate the operator restriction.
- Include the incoming carry in both calculations.
- Convert the completed unsigned value back to signed form for negative answers.''',
('implement-trie-prefix-tree', 'Prefix Tree (Hash Map)'): '''### How it works

Store a dictionary of child nodes at each trie node instead of a fixed array of 26 slots. Common prefixes share nodes; missing letters allocate children only when needed. A separate word-end flag distinguishes an inserted word from a prefix.

### Steps

1. Start every operation at the root.
2. To insert, create a dictionary child for each missing character, follow it, and mark the final node as a complete word.
3. To search, follow existing children and require the final word-end flag.
4. For `startsWith`, reaching the end of the prefix is sufficient; do not require a complete word.

### Complexity

Expected time is `O(L)` per operation for a word or prefix of length `L`, assuming constant-time dictionary operations. The trie uses `O(S)` nodes and edges for `S` total inserted characters in the worst case. An individual iterative lookup uses `O(1)` auxiliary space.

### Things to watch for

- Inserting `apple` makes `startsWith("app")` true but leaves `search("app")` false.
- Mark word ends without removing longer words that share the prefix.
- Dictionary children save unused alphabet slots, but have their own object overhead.''',
('design-add-and-search-words-data-structure', 'Depth First Search (Trie)'): '''### How it works

Insert words into a trie with dictionary children. A normal search character follows one edge. A `.` can match any one character, so search recursively tries each child from that position. A match must end at a node marked as a complete word.

### Steps

1. Insert each word by creating missing trie nodes and marking its final node.
2. Scan a search pattern from the root.
3. For an ordinary character, return false if its child is missing; otherwise follow that child.
4. For `.`, recursively search the remaining pattern from each child and succeed if any branch matches.
5. After the final character, check the word-end flag.

### Complexity

Insertion takes expected `O(L)` time for a word of length `L`. A literal search takes expected `O(L)` time. Wildcards can visit `O(min(T, L × 26^w))` trie nodes in the worst case, where `T` is the trie size and `w` is the number of wildcard positions. Recursion uses `O(L)` stack space; stored words use `O(S)` space for total inserted characters `S`.

### Things to watch for

- A dot consumes exactly one character, not an arbitrary suffix.
- Explore all matching children before returning false.
- Reaching a prefix node alone does not establish a complete-word match.''',
}

AUTHORED = {
'partition-labels': {
    'Merge Character Intervals': {
        'explanation': '''### How it works

Each character must belong to one partition, so its first and last occurrences define an interval that cannot be split. Sort these intervals and merge overlapping ones. The merged intervals are the smallest independent partitions and therefore produce the maximum number of parts.

### Steps

1. Record the first and last occurrence of each character.
2. Sort the intervals by their start position.
3. Merge an interval when its start is at or before the current interval's end.
4. When the next interval is disjoint, emit the current length and begin a new partition.
5. Emit the final length.

### Complexity

Time is `O(n + k log k)` and auxiliary space is `O(k)` for `n` characters and `k` distinct characters. With the problem's 26-letter alphabet, this is `O(n)` time and `O(1)` auxiliary space, excluding output.

### Things to watch for

- Intervals are inclusive, so the length is `end - start + 1`.
- Adjacent but nonoverlapping intervals are separate partitions.
- Extend the end with the maximum, since nested intervals must not shrink it.''',
        'code': {'python': '''class Solution:
    def partitionLabels(self, s: str) -> list[int]:
        bounds = {}
        for i, char in enumerate(s):
            if char not in bounds:
                bounds[char] = [i, i]
            bounds[char][1] = i
        intervals = sorted(bounds.values())
        result = []
        start, end = intervals[0]
        for left, right in intervals[1:]:
            if left <= end:
                end = max(end, right)
            else:
                result.append(end - start + 1)
                start, end = left, right
        result.append(end - start + 1)
        return result
'''},
    },
},
'roman-to-integer': {
    'Right-to-Left Scan': {
        'explanation': '''### How it works

Read a valid Roman numeral from right to left while remembering the greatest symbol value seen. A smaller symbol to its left is subtractive; otherwise add it. For example, in `MCM`, the first `M` encountered contributes 1000, `C` subtracts 100, and the remaining `M` adds 1000.

### Steps

1. Store the seven Roman symbol values.
2. Initialize the total and largest value seen to zero.
3. Scan the characters from right to left.
4. Subtract a value smaller than the largest seen; otherwise add it and update the largest value.
5. Return the total.

### Complexity

Time is `O(n)` for `n` characters. Auxiliary space is `O(1)` because the value table is fixed and `reversed` does not copy the string.

### Things to watch for

- This interprets valid Roman numerals as required by the problem; it does not validate arbitrary numeral strings.
- Equal symbols add rather than subtract.
- Use a reverse iterator to avoid allocating a reversed string.''',
        'code': {'python': '''class Solution:
    def romanToInt(self, s: str) -> int:
        values = {"I": 1, "V": 5, "X": 10, "L": 50,
                  "C": 100, "D": 500, "M": 1000}
        total = largest = 0
        for char in reversed(s):
            value = values[char]
            if value < largest:
                total -= value
            else:
                total += value
                largest = value
        return total
'''},
    },
},
'text-justification': {
    'Greedy (Round-Robin Spacing)': {
        'explanation': '''### How it works

Greedily pack as many words as fit on each line. For a full line, allocate spaces one at a time across the gaps from left to right, cycling back to the first gap. This produces equal gap widths with any extra spaces assigned to the leftmost gaps. Unlike the default's quotient/remainder calculation, this version simulates the allocation using integer counters before building the string.

### Steps

1. Find the longest prefix of remaining words that fits with at least one space per gap.
2. For the last line or a single-word line, join with one space and pad on the right.
3. Otherwise create one counter per gap and cycle through the counters once per required space.
4. Build the line from each word and its counted spaces.
5. Continue from the first unused word.

### Complexity

Time is `O(C + L × W)` for `C` input characters, `L` output lines, and width `W`. This includes writing the output spaces. Auxiliary workspace is `O(W)` per line, excluding the `O(L × W)` output.

### Things to watch for

- Count the mandatory spaces when deciding whether another word fits.
- Handle a single word separately so there is no modulo by zero.
- The last line is always left-justified.
- Count spaces before constructing strings to avoid repeatedly copying growing strings.''',
        'code': {'python': '''class Solution:
    def fullJustify(self, words: list[str], maxWidth: int) -> list[str]:
        result = []
        start = 0
        while start < len(words):
            end = start + 1
            letters = len(words[start])
            while end < len(words) and letters + len(words[end]) + end - start <= maxWidth:
                letters += len(words[end])
                end += 1
            line = words[start:end]
            gaps = len(line) - 1
            if end == len(words) or gaps == 0:
                result.append(" ".join(line).ljust(maxWidth))
            else:
                spaces = [0] * gaps
                for i in range(maxWidth - letters):
                    spaces[i % gaps] += 1
                parts = []
                for word, count in zip(line, spaces):
                    parts.extend((word, " " * count))
                parts.append(line[-1])
                result.append("".join(parts))
            start = end
        return result
'''},
    },
},
'remove-max-number-of-edges-to-keep-graph-fully-traversable': {
    'Brute Force (Edge Subsets)': {
        'explanation': '''This exhaustive baseline is for small examples. Its exponential running time exceeds the full problem limits; use the default disjoint-set solution for large graphs.

### How it works

Try every subset of edges to keep. For each subset, build Alice's and Bob's allowed graphs and check both with a traversal. Among subsets where both users reach every node, keep the one using the fewest edges. The answer is the number of edges outside that subset.

### Steps

1. Enumerate all bit masks over the edges.
2. Build separate adjacency lists for Alice and Bob from the selected edges; type 3 goes into both graphs.
3. Traverse from node 1 in each graph and require all `n` nodes to be reachable.
4. Track the largest number of removable edges among valid subsets.
5. Return `-1` if no subset connects both users.

### Complexity

There are `2^E` subsets. Each subset costs `O(n + E)` to build and traverse, so time is `O(2^E × (n + E))`. Auxiliary space is `O(n + E)` for adjacency lists and traversal. This is a teaching baseline, not a submission suitable for the maximum constraints.

### Things to watch for

- Alice cannot use type 2 edges, and Bob cannot use type 1 edges.
- Connectivity must hold separately for both users.
- Shared edges count once in the kept subset even though both users can traverse them.''',
        'code': {'python': '''class Solution:
    def maxNumEdgesToRemove(self, n: int, edges: list[list[int]]) -> int:
        def connected(graph):
            seen = {1}
            stack = [1]
            while stack:
                node = stack.pop()
                for neighbor in graph[node]:
                    if neighbor not in seen:
                        seen.add(neighbor)
                        stack.append(neighbor)
            return len(seen) == n

        best = -1
        for mask in range(1 << len(edges)):
            alice = [[] for _ in range(n + 1)]
            bob = [[] for _ in range(n + 1)]
            for i, (kind, u, v) in enumerate(edges):
                if mask & (1 << i):
                    for graph in ([alice, bob] if kind == 3 else [alice] if kind == 1 else [bob]):
                        graph[u].append(v)
                        graph[v].append(u)
            if connected(alice) and connected(bob):
                best = max(best, len(edges) - mask.bit_count())
        return best
'''},
    },
},
}


def adapt_code(problem_id, name, code):
    if problem_id == 'permutations-ii' and name == 'Backtracking (Hash Set)':
        code = code.replace('return list(res)', 'return [list(permutation) for permutation in res]')
    if problem_id == 'detect-squares':
        code = code.replace('CountSquares', 'DetectSquares')
    if problem_id == 'sum-of-two-integers' and name == 'Bit Manipulation':
        # A full adder computes the carry with bit operations too. The source's
        # a_bit + b_bit + carry violates this problem's operator restriction.
        code = code.replace('(a_bit + b_bit + carry) >= 2', '(a_bit & b_bit) | (a_bit & carry) | (b_bit & carry)')
    if problem_id == 'paint-house':
        code = code.replace('def min_cost(', 'def minCost(')
    if problem_id == 'number-of-distinct-islands':
        code = code.replace('        print(unique_islands)\n', '')
    if problem_id == 'recover-binary-search-tree' and name == 'Brute Force':
        # LeetCode's contract is an in-place update with no returned tree.
        code = code.removesuffix('return root').rstrip()
    if problem_id == 'web-crawler':
        code = code.replace('return visited', 'return list(visited)')
    if problem_id == 'closest-binary-search-tree-value' and name == 'Recursive Inorder + Linear search, O(N) time':
        # Repeated list concatenation in the source can take quadratic time on
        # a skew tree. Accumulate once so the advertised linear bound holds.
        code = code.replace(
            'return inorder(r.left) + [r.val] + inorder(r.right) if r else []',
            'if r:\n                inorder(r.left)\n                values.append(r.val)\n                inorder(r.right)')
        code = code.replace('return min(inorder(root),', 'values = []\n        inorder(root)\n        return min(values,')
    return code
