"""Reviewed Python-specific notes for the extended source articles.

These notes replace ambiguous multi-language bounds and call out a teaching
baseline's space restriction. The algorithms remain adapted from NeetCode.
"""

COMPLEXITY = {
    ('armstrong-number','Calculate k by Converting to String'): 'For `M` decimal digits, time is `O(M)` under the problem\'s bounded-integer arithmetic model and auxiliary space is `O(M)` for the decimal string. These are bounded constants for the fixed-width input range.',
    ('power-of-four','Recursion'): 'Time and recursion space are `O(log n)` when generalized to arbitrary positive `n`: each call divides by four. Both are bounded constants for the problem\'s signed 32-bit range.',
    ('power-of-two','Brute Force'): 'For positive `n`, time is `O(log n)` and auxiliary space is `O(1)` under fixed-width arithmetic. The problem\'s 32-bit range bounds the loop to a constant number of iterations.',
    ('largest-unique-number','Sorting'): 'Time is `O(n log n)` and worst-case auxiliary space is `O(n)` for Python\'s sort, where `n` is the number of input values. Sorting changes the input order.',
    ('find-smallest-common-element-in-all-rows','Count Elements (Improved)'): 'For `r` rows and `c` columns, time is `O(r × c)`. The frequency array has 10,001 slots, so auxiliary space is `O(U)` for value bound `U = 10000`, a fixed constant in this problem. Rows contain strictly increasing values, so one value cannot be counted twice in the same row.',
    ('find-smallest-common-element-in-all-rows','Binary Search (Improved)'): 'For `r` rows and `c` columns, worst-case time is `O(r × c × log c)`: test each candidate in the first row against the other rows. Auxiliary space is `O(r)` for the remembered search positions.',
    ('search-suggestions-system','Brute Force'): 'Let `P` be the number of products, `W` the longest product length, and `Q` the query length. A worst-case upper bound is `O(P × W × log P + P × Q²)` for sorting with string comparisons and repeatedly comparing prefixes. Python sorting uses `O(P)` auxiliary workspace; the returned lists hold at most `3Q` references and use `O(Q)` output space.',
    ('search-suggestions-system','Sorting + Binary Search'): 'Let `P` be the number of products, `W` the longest product length, and `Q` the query length. A worst-case upper bound is `O(P × W × log P + Q² × log(P + 1))`, including sorting, prefix construction, and string comparisons during binary searches. Auxiliary space is `O(P + Q)` for Python sorting and the current prefix; the returned lists use `O(Q)` output space.',
    ('successful-pairs-of-spells-and-potions','Sorting + Binary Search'): 'For `n` spells and `m` potions, time is `O(m log m + n log m)`. Python sorting uses `O(m)` worst-case auxiliary space, and the returned counts use `O(n)` output space. The potion list is sorted in place.',
    ('string-compression','Using Extra Space'): 'For `n` input characters, repeated concatenation of immutable Python strings has a conservative worst-case bound of `O(n²)` time. The temporary compressed string uses `O(n)` auxiliary space. Copying it back is linear; the default two-pointer approach meets the constant-extra-space requirement.',
    ('verify-preorder-sequence-in-binary-search-tree','Constant Auxiliary Space'): 'Time is `O(n)` and auxiliary space is `O(1)`. The input array supplies the stack storage, so this approach overwrites its contents. Counting input storage separately does not change the constant auxiliary-space claim.',
}

PREAMBLES = {
    ('string-compression','Using Extra Space'): 'This teaching baseline uses extra space proportional to the input and does not meet the problem\'s constant-extra-space requirement. Use the default two-pointer approach when that restriction applies.',
}

REPLACEMENTS = {
    ('web-crawler','Depth-first search'): [('Return the `visited` set containing all crawled URLs.', 'Return the crawled URLs as a list; their order does not matter.')],
}
