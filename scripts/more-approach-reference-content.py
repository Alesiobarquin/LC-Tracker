"""Reviewed teaching alternatives for references outside the article batch.

Code without a source filename was written for LC Tracker with AI assistance.
Source filenames select MIT-licensed walkccc examples at the pinned revision.
Every entry has independent fixtures; no user code is executed or graded.
"""
from textwrap import dedent

CONTENT = {}


def add(pid, name, insight, steps, time, space, code=None, *, filename=None, baseline=False, pitfalls=()):
    record = dict(approach=name, insight=insight, steps=steps.split('|'), time=time,
                  space=space, baseline=baseline, pitfalls=list(pitfalls))
    if filename:
        record['filename'] = filename
    else:
        record['python'] = dedent(code).strip() + '\n'
    CONTENT.setdefault(pid, []).append(record)


add('string-to-integer-atoi', 'Regular Expression Prefix',
    'A regular expression can isolate the exact prefix accepted by the conversion: leading spaces, an optional sign, then at least one decimal digit. Convert only that match and clamp it to the signed 32-bit range.',
    'Match the valid numeric prefix at the start of the string.|Return zero if no digits follow the spaces and optional sign.|Convert the captured prefix and clamp between the two signed 32-bit limits.',
    '`O(n)` for matching and consuming the prefix under the problem\'s bounded string length.', '`O(n)` for the match and integer conversion.', '''
    import re

    class Solution:
        def myAtoi(self, s: str) -> int:
            match = re.match(r" *([+-]?[0-9]+)", s)
            if not match:
                return 0
            value = int(match.group(1))
            return max(-(1 << 31), min((1 << 31) - 1, value))
    ''', pitfalls=('Match from the beginning; later numbers do not count.', 'A standalone sign is not a number.'))

add('3sum-closest', 'Enumerate Triplets',
    'Enumerate every choice of three different indices. Comparing each sum with the target gives a direct baseline for the sorted two-pointer improvement.',
    'Start with the sum of the first three values.|Enumerate indices i < j < k.|Keep the sum with the smallest absolute difference from the target.',
    '`O(n³)` for all triplets.', '`O(1)` auxiliary space.', '''
    class Solution:
        def threeSumClosest(self, nums: list[int], target: int) -> int:
            best = sum(nums[:3])
            for i in range(len(nums)):
                for j in range(i + 1, len(nums)):
                    for k in range(j + 1, len(nums)):
                        value = nums[i] + nums[j] + nums[k]
                        if abs(value - target) < abs(best - target):
                            best = value
            return best
    ''', baseline=True)

add('remove-duplicates-from-sorted-list-ii', 'Recursive Run Removal',
    'Treat the first equal-valued run as one unit. A repeated run is removed completely; a singleton is linked to the recursively filtered suffix.',
    'Return immediately for an empty list.|If the first two values match, skip the whole run and recurse on the remainder.|Otherwise preserve the first node and attach the filtered suffix.',
    '`O(n)` because every node belongs to one scanned run.', '`O(n)` recursion stack in the worst case.', '''
    class Solution:
        def deleteDuplicates(self, head: Optional[ListNode]) -> Optional[ListNode]:
            if not head:
                return None
            if head.next and head.val == head.next.val:
                value = head.val
                while head and head.val == value:
                    head = head.next
                return self.deleteDuplicates(head)
            head.next = self.deleteDuplicates(head.next)
            return head
    ''', pitfalls=('Remove every node in a repeated run, including its first node.', 'Long lists can exceed Python\'s recursion depth; the iterative default avoids that limit.'))

add('gray-code', 'Binary-to-Gray Formula',
    'The Gray encoding of integer i is i XOR (i shifted right once). Applying this formula to consecutive binary values produces the reflected Gray-code cycle without constructing reflection stages.',
    'Enumerate integers from zero through 2^n - 1.|XOR each integer with its right-shifted value.|Return the codes in that order.',
    '`O(2^n)` fixed-width bit operations.', '`O(1)` auxiliary space, plus `O(2^n)` output.', '''
    class Solution:
        def grayCode(self, n: int) -> list[int]:
            return [i ^ (i >> 1) for i in range(1 << n)]
    ''')

add('binary-tree-level-order-traversal-ii', 'Depth-Indexed DFS',
    'A depth-first traversal can collect values by depth. Visiting left before right preserves each level\'s reading order, and reversing the level list gives the requested bottom-up order.',
    'Create a list for each newly encountered depth.|Visit a node before recursively visiting its left and right children.|Reverse the completed level list.',
    '`O(n)` for n nodes.', '`O(h)` recursion stack plus `O(n)` output.', '''
    class Solution:
        def levelOrderBottom(self, root: Optional[TreeNode]) -> list[list[int]]:
            levels = []
            def visit(node, depth):
                if not node:
                    return
                if depth == len(levels):
                    levels.append([])
                levels[depth].append(node.val)
                visit(node.left, depth + 1)
                visit(node.right, depth + 1)
            visit(root, 0)
            return levels[::-1]
    ''')

add('convert-sorted-list-to-binary-search-tree', 'Inorder Construction',
    'Count the list once, then simulate the inorder traversal of a balanced tree. Build the left half first, consume the current list node as the root, and then build the right half. The list pointer advances once per tree node.',
    'Count the linked-list nodes.|Recursively allocate balanced index ranges.|Build the left subtree before consuming the current list value.|Advance the shared list pointer and construct the right subtree.',
    '`O(n)` for the length pass and one construction visit per node.', '`O(log n)` recursion space, excluding the new tree.', filename='109-3.py')

add('minimum-depth-of-binary-tree', 'First-Leaf BFS',
    'Breadth-first traversal reaches shallower nodes first. The first node with no children therefore determines the minimum root-to-leaf depth.',
    'Return zero for an empty tree.|Process the queue one level at a time.|Return the current depth on the first leaf.|Enqueue existing children and advance the depth.',
    '`O(n)` in the worst case.', '`O(w)` for the widest queued level.', filename='111-2.py', pitfalls=('A missing child is not a leaf.',))

add('path-sum-ii', 'Breadth-First Path Copies',
    'Keep the path and running sum with each queued node. When a leaf reaches the target sum, its stored path is already a complete answer.',
    'Queue the root with its value and one-element path.|Check sums only at leaves.|Queue each child with an updated sum and a copied path.',
    '`O(nh)` including path copies for n nodes and height h.', '`O(nh)` worst-case space including queued paths and output.', '''
    from collections import deque

    class Solution:
        def pathSum(self, root: Optional[TreeNode], targetSum: int) -> list[list[int]]:
            if not root:
                return []
            result = []
            queue = deque([(root, root.val, [root.val])])
            while queue:
                node, total, path = queue.popleft()
                if not node.left and not node.right and total == targetSum:
                    result.append(path)
                for child in (node.left, node.right):
                    if child:
                        queue.append((child, total + child.val, path + [child.val]))
            return result
    ''')

add('flatten-binary-tree-to-linked-list', 'Preorder Stack',
    'An explicit stack records preorder traversal before links are changed. Connect each visited node to the previous node\'s right pointer and clear the previous left pointer.',
    'Push the root when present.|Pop the next preorder node and push its original right child before its left child.|Connect the previous node to this node.|Finish with no left child or trailing right child on the final node.',
    '`O(n)` for n nodes.', '`O(h)` for the traversal stack.', '''
    class Solution:
        def flatten(self, root: Optional[TreeNode]) -> None:
            stack = [root] if root else []
            previous = None
            while stack:
                node = stack.pop()
                if node.right:
                    stack.append(node.right)
                if node.left:
                    stack.append(node.left)
                if previous:
                    previous.left = None
                    previous.right = node
                previous = node
            if previous:
                previous.left = previous.right = None
    ''', pitfalls=('Save the original children before rewiring.', 'Reuse the original nodes rather than constructing a new list.'))

add('single-number-ii', 'Two Bit-State Masks',
    'The ones and twos masks represent each bit\'s occurrence count modulo three. A bit moves through the states zero, one, two, then back to zero, leaving only the bits of the value that appears once.',
    'Start both masks at zero.|Update ones using bits that are not currently in twos.|Update twos using the newly updated ones.|Return the ones mask.',
    '`O(n)` fixed-width bit operations.', '`O(1)` for two masks under the signed 32-bit input bounds.', filename='137-2.py', pitfalls=('The second assignment uses the updated ones mask.', 'Signed inputs are included in the verification cases.'))

add('compare-version-numbers', 'Normalized String Revisions',
    'Revision numbers can be compared as decimal strings after removing leading zeros. A longer normalized revision is larger; equal lengths can be compared lexicographically. Missing revisions behave as zero.',
    'Split both versions into revisions and pair them, filling missing revisions with zero.|Strip leading zeros, retaining one zero for an empty result.|Compare revision lengths and then their text.|Return zero when every revision agrees.',
    '`O(n + m)` over both version strings.', '`O(n + m)` for split and normalized strings.', '''
    from itertools import zip_longest

    class Solution:
        def compareVersion(self, version1: str, version2: str) -> int:
            for a, b in zip_longest(version1.split('.'), version2.split('.'), fillvalue='0'):
                a = a.lstrip('0') or '0'
                b = b.lstrip('0') or '0'
                if len(a) != len(b):
                    return 1 if len(a) > len(b) else -1
                if a != b:
                    return 1 if a > b else -1
            return 0
    ''')

add('fraction-to-recurring-decimal', 'Linear Remainder Search',
    'Long division repeats precisely when a remainder repeats. Store earlier remainders in a list and search that list before generating each digit. This exposes why the default uses a hash map for faster repeat detection.',
    'Separate the sign and integer part using absolute values.|Before each decimal digit, search the earlier remainder list.|If a remainder repeats, insert parentheses around the digits starting at its first position.|Otherwise generate a digit and continue until the remainder becomes zero.',
    '`O(d²)` for d generated decimal digits with linear remainder searches.', '`O(d)` for remainders and output digits.', '''
    class Solution:
        def fractionToDecimal(self, numerator: int, denominator: int) -> str:
            if numerator == 0:
                return '0'
            sign = '-' if (numerator < 0) != (denominator < 0) else ''
            whole, remainder = divmod(abs(numerator), abs(denominator))
            result = sign + str(whole)
            if remainder == 0:
                return result
            remainders, digits = [], []
            while remainder:
                if remainder in remainders:
                    start = remainders.index(remainder)
                    return result + '.' + ''.join(digits[:start]) + '(' + ''.join(digits[start:]) + ')'
                remainders.append(remainder)
                digit, remainder = divmod(remainder * 10, abs(denominator))
                digits.append(str(digit))
            return result + '.' + ''.join(digits)
    ''', baseline=True)

add('factorial-trailing-zeroes', 'Factor Each Multiple of Five',
    'Every trailing decimal zero needs a factor of five paired with an abundant factor of two. Instead of aggregating powers of five, visit each multiple of five and count its individual factors.',
    'Visit positive multiples of five up to n.|Repeatedly divide each multiple by five and count each successful division.|Return the total factor count.',
    '`O(n)` total divisions: their counts form n/5 + n/25 + n/125 + ….', '`O(1)` auxiliary space under bounded integer arithmetic.', '''
    class Solution:
        def trailingZeroes(self, n: int) -> int:
            total = 0
            for value in range(5, n + 1, 5):
                while value % 5 == 0:
                    total += 1
                    value //= 5
            return total
    ''', baseline=True)

add('combination-sum-iii', 'Enumerate Digit Masks',
    'A nine-bit mask selects a subset of the digits one through nine. Each digit can appear once, so filtering masks by selected count and sum gives every valid combination exactly once.',
    'Enumerate the 512 masks over digits one through nine.|Keep masks with exactly k set bits.|Collect the selected digits and return those whose sum is n.',
    '`O(9 × 2^9)` fixed-domain work.', '`O(k)` temporary space, excluding output.', '''
    class Solution:
        def combinationSum3(self, k: int, n: int) -> list[list[int]]:
            result = []
            for mask in range(1 << 9):
                if mask.bit_count() == k:
                    digits = [i + 1 for i in range(9) if mask & (1 << i)]
                    if sum(digits) == n:
                        result.append(digits)
            return result
    ''')

add('count-complete-tree-nodes', 'Recursive Node Counting',
    'Count the current node and recursively count both subtrees. This general tree traversal makes the complete-tree shortcut in the default easier to compare.',
    'An empty subtree contributes zero.|Recursively count both children.|Add one for the current node.',
    '`O(n)` for n nodes.', '`O(log n)` recursion space for the guaranteed complete tree.', filename='222.py')

add('rectangle-area', 'Coordinate Compression',
    'The four x boundaries and four y boundaries partition the two rectangles into a constant number of small cells. Each cell lies entirely inside or outside each rectangle. Count a cell once if either rectangle covers it.',
    'Sort the distinct x and y boundaries of both rectangles.|Visit each cell between adjacent boundaries.|Check whether either rectangle covers the entire cell.|Sum the covered cell areas once.',
    '`O(1)` for two rectangles: at most nine compressed cells.', '`O(1)` for the boundary lists.', '''
    class Solution:
        def computeArea(self, ax1: int, ay1: int, ax2: int, ay2: int,
                        bx1: int, by1: int, bx2: int, by2: int) -> int:
            xs = sorted({ax1, ax2, bx1, bx2})
            ys = sorted({ay1, ay2, by1, by2})
            rectangles = [(ax1, ay1, ax2, ay2), (bx1, by1, bx2, by2)]
            total = 0
            for left, right in zip(xs, xs[1:]):
                for bottom, top in zip(ys, ys[1:]):
                    if any(x1 <= left and right <= x2 and y1 <= bottom and top <= y2
                           for x1, y1, x2, y2 in rectangles):
                        total += (right - left) * (top - bottom)
            return total
    ''')

add('search-a-2d-matrix-ii', 'Binary Search Each Row',
    'Each row is sorted, so binary-search the target independently in every row. This does not use the column ordering that makes the staircase default faster for many matrix shapes.',
    'Binary-search the insertion position in each row.|Return true if a row contains the target at that position.|Return false after all rows fail.',
    '`O(r log c)` for r rows and c columns.', '`O(1)` auxiliary space.', '''
    from bisect import bisect_left

    class Solution:
        def searchMatrix(self, matrix: list[list[int]], target: int) -> bool:
            for row in matrix:
                index = bisect_left(row, target)
                if index < len(row) and row[index] == target:
                    return True
            return False
    ''')

add('different-ways-to-add-parentheses', 'Bottom-Up Expression Intervals',
    'Parse the expression into numbers and operators. For each interval, try every possible final operator and combine all results from its left and right intervals. Keeping duplicates preserves distinct parenthesizations with equal results.',
    'Tokenize numbers and operators without using eval.|Seed one-number intervals.|Build longer intervals by splitting at every operator.|Combine every left/right result pair with that operator.',
    '`O(C × n²)` is a conservative upper bound for n numbers and C full parenthesizations; the output is already exponential.', '`O(C × n²)` as a conservative bound including all interval result lists.', '''
    import re

    class Solution:
        def diffWaysToCompute(self, expression: str) -> list[int]:
            tokens = re.findall(r'[0-9]+|[+*-]', expression)
            numbers = [int(value) for value in tokens[::2]]
            operators = tokens[1::2]
            n = len(numbers)
            dp = [[[] for _ in range(n)] for _ in range(n)]
            for i, value in enumerate(numbers):
                dp[i][i] = [value]
            for length in range(2, n + 1):
                for left in range(n - length + 1):
                    right = left + length - 1
                    for split in range(left, right):
                        for a in dp[left][split]:
                            for b in dp[split + 1][right]:
                                op = operators[split]
                                dp[left][right].append(a + b if op == '+' else a - b if op == '-' else a * b)
            return dp[0][-1]
    ''')

add('binary-tree-paths', 'Breadth-First Paths',
    'Carry a root-to-node path string through a breadth-first traversal. A leaf\'s path is complete and can be added directly to the output.',
    'Queue the root and its value as a string.|Emit a path when the node has no children.|Queue each child with its value appended after an arrow.',
    '`O(nh)` including path-string copying for height h.', '`O(nh)` worst-case space including queued paths and output.', '''
    from collections import deque

    class Solution:
        def binaryTreePaths(self, root: Optional[TreeNode]) -> list[str]:
            result = []
            queue = deque([(root, str(root.val))]) if root else deque()
            while queue:
                node, path = queue.popleft()
                if not node.left and not node.right:
                    result.append(path)
                for child in (node.left, node.right):
                    if child:
                        queue.append((child, path + '->' + str(child.val)))
            return result
    ''')

add('add-digits', 'Repeated Digit Sums',
    'Directly simulate the reduction rule: sum the decimal digits, then repeat until only one digit remains. This supplies a concrete comparison with the digital-root formula.',
    'While the number has at least two digits, extract digits with divmod.|Sum those digits.|Replace the number with that sum and repeat.',
    '`O(D)` digit work for an initial D-digit bounded integer; later rounds are much shorter.', '`O(1)` auxiliary space under the problem\'s integer bounds.', '''
    class Solution:
        def addDigits(self, num: int) -> int:
            while num >= 10:
                total = 0
                while num:
                    num, digit = divmod(num, 10)
                    total += digit
                num = total
            return num
    ''')

add('3sum-smaller', 'Enumerate Triplets',
    'Test each three-index choice directly. Counting one matching triplet at a time provides a baseline for the sorted approach that counts an entire valid suffix at once.',
    'Enumerate i < j < k.|Add one when the three values sum to less than the target.|Return the count.',
    '`O(n³)` time.', '`O(1)` auxiliary space.', '''
    class Solution:
        def threeSumSmaller(self, nums: list[int], target: int) -> int:
            return sum(nums[i] + nums[j] + nums[k] < target
                       for i in range(len(nums)) for j in range(i + 1, len(nums))
                       for k in range(j + 1, len(nums)))
    ''', baseline=True)

add('ugly-number-ii', 'Min-Heap Generation',
    'Every ugly number after one is an earlier ugly number multiplied by two, three, or five. A min-heap emits them in increasing order, and a set prevents duplicate products.',
    'Seed the heap and seen set with one.|Pop the next smallest number n times.|Insert unseen products with two, three, and five.|Return the last popped number.',
    '`O(n log n)` fixed-width heap operations.', '`O(n)` for the heap and seen set.', '''
    from heapq import heappop, heappush

    class Solution:
        def nthUglyNumber(self, n: int) -> int:
            heap, seen = [1], {1}
            value = 1
            for _ in range(n):
                value = heappop(heap)
                for prime in (2, 3, 5):
                    candidate = value * prime
                    if candidate not in seen:
                        seen.add(candidate)
                        heappush(heap, candidate)
            return value
    ''')

add('h-index', 'Sort and Find the Threshold',
    'After sorting citations in ascending order, position i has n - i papers at or above its value. The first citation meeting that count determines the largest valid h-index.',
    'Sort the citations.|Scan for the first citation at least n - i.|Return n - i, or zero when no position qualifies.',
    '`O(n log n)` time.', '`O(n)` worst-case workspace for Python sorting.', filename='274-2.py')

add('h-index-ii', 'Linear Threshold Scan',
    'The input is already sorted. Scan it directly and find the first position whose citation count is at least the number of papers from that position onward.',
    'For each position i, compute n - i.|Return that count when citations[i] is large enough.|Return zero if no position qualifies.',
    '`O(n)` time.', '`O(1)` auxiliary space.', '''
    class Solution:
        def hIndex(self, citations: list[int]) -> int:
            for i, citation in enumerate(citations):
                if citation >= len(citations) - i:
                    return len(citations) - i
            return 0
    ''')

add('inorder-successor-in-bst', 'Explicit Inorder Traversal',
    'The successor is the node immediately after p in inorder traversal. An explicit stack visits nodes in sorted order and can identify p by object identity.',
    'Push the left spine of the tree.|Pop nodes in inorder order, pushing each right subtree\'s left spine.|After visiting p, return the very next node.|Return null when p is the final node.',
    '`O(n)` in the worst case.', '`O(h)` for the stack.', '''
    class Solution:
        def inorderSuccessor(self, root: TreeNode, p: TreeNode) -> Optional[TreeNode]:
            stack, found = [], False
            while root or stack:
                while root:
                    stack.append(root)
                    root = root.left
                root = stack.pop()
                if found:
                    return root
                found = root is p
                root = root.right
            return None
    ''')

add('game-of-life', 'Snapshot and Update',
    'Read every neighbor from a copy of the old board, then write the next generation into the original board. The snapshot prevents earlier updates from affecting later decisions.',
    'Copy the board before changing cells.|Count the eight valid neighbors using the copy.|Keep a live cell with two neighbors, or any cell with three neighbors.|Write each next state into the original board.',
    '`O(r × c)` time.', '`O(r × c)` auxiliary space for the snapshot.', '''
    class Solution:
        def gameOfLife(self, board: list[list[int]]) -> None:
            old = [row[:] for row in board]
            for r in range(len(board)):
                for c in range(len(board[0])):
                    neighbors = sum(old[x][y]
                                    for x in range(max(0, r - 1), min(len(board), r + 2))
                                    for y in range(max(0, c - 1), min(len(board[0]), c + 2))
                                    if (x, y) != (r, c))
                    board[r][c] = int(neighbors == 3 or (old[r][c] == 1 and neighbors == 2))
    ''')

add('bulls-and-cows', 'One-Pass Balance Counts',
    'For mismatched digits, maintain how many copies have appeared on each side but have not yet been paired. A new secret digit pairs with an earlier unmatched guess, and a new guess digit pairs with an earlier unmatched secret.',
    'Count equal-position digits as bulls and skip their balance updates.|For mismatches, count a cow when the opposite side has an unmatched copy.|Update the digit balances in opposite directions.|Format the two counts.',
    '`O(n)` time.', '`O(1)` for ten digit balances.', '''
    class Solution:
        def getHint(self, secret: str, guess: str) -> str:
            balance = [0] * 10
            bulls = cows = 0
            for a, b in zip(secret, guess):
                if a == b:
                    bulls += 1
                    continue
                x, y = int(a), int(b)
                cows += (balance[x] < 0) + (balance[y] > 0)
                balance[x] += 1
                balance[y] -= 1
            return f'{bulls}A{cows}B'
    ''')

add('super-ugly-number', 'Heap-Merge Prime Streams',
    'Each prime supplies a sorted stream of multiples of previously emitted ugly numbers. Keep the smallest pending value from each stream in a heap, advancing every stream tied at the emitted value to avoid duplicates.',
    'Start the ugly-number sequence with one.|Put one candidate per prime into the heap.|Append the smallest candidate once.|Advance all prime streams tied at that candidate.|Stop at n values.',
    '`O(n × k × log(k + 1))` as a conservative bound when up to k prime streams tie at each emission.', '`O(n + k)` for the sequence and heap.', filename='313-2.py')

add('remove-duplicate-letters', 'Recursive Smallest Feasible Prefix',
    'Choose the smallest first character that leaves every required character available. The scan stops when the last remaining copy of any character is reached. Remove later copies of the chosen character and recurse on the suffix.',
    'Count characters in the current string.|Scan until a remaining count reaches zero, remembering the smallest character seen.|Choose that character next.|Remove its copies from the following suffix and recurse.',
    '`O(a × n)` for n characters and a distinct letters, at most 26 here.', '`O(a × n)` as a conservative bound for recursive substring copies.', '''
    from collections import Counter

    class Solution:
        def removeDuplicateLetters(self, s: str) -> str:
            if not s:
                return ''
            remaining = Counter(s)
            position = 0
            for i, char in enumerate(s):
                if char < s[position]:
                    position = i
                remaining[char] -= 1
                if remaining[char] == 0:
                    break
            char = s[position]
            return char + self.removeDuplicateLetters(s[position + 1:].replace(char, ''))
    ''')

add('maximum-product-of-word-lengths', 'Character-Set Pair Checks',
    'Represent each word by its set of letters. A pair is eligible when the two sets are disjoint, avoiding bit-mask encoding while keeping the pairwise search.',
    'Build one character set per word.|Check every pair with isdisjoint.|Keep the largest product of lengths for disjoint pairs.',
    '`O(S + n² × a)` for S total characters and alphabet size a, at most 26.', '`O(n × a)` for letter sets.', '''
    class Solution:
        def maxProduct(self, words: list[str]) -> int:
            letters = [set(word) for word in words]
            best = 0
            for i in range(len(words)):
                for j in range(i + 1, len(words)):
                    if letters[i].isdisjoint(letters[j]):
                        best = max(best, len(words[i]) * len(words[j]))
            return best
    ''')

add('bulb-switcher', 'Simulate Every Round',
    'Model the toggling rounds directly. Round i flips every i-th bulb. Counting the final states supplies a small-input comparison with the perfect-square observation.',
    'Start all bulbs off.|For each round i, toggle positions i, 2i, 3i, and so on.|Count bulbs left on.',
    '`O(n log n)` from the harmonic sum of toggles.', '`O(n)` for bulb states.', '''
    class Solution:
        def bulbSwitch(self, n: int) -> int:
            bulbs = [False] * n
            for step in range(1, n + 1):
                for index in range(step - 1, n, step):
                    bulbs[index] = not bulbs[index]
            return sum(bulbs)
    ''', baseline=True)

add('maximum-size-subarray-sum-equals-k', 'Enumerate Running Sums',
    'Choose each left endpoint and extend its right endpoint while updating a running sum. This checks all subarrays without assuming positive values.',
    'Start a fresh sum at each left endpoint.|Add values as the right endpoint advances.|Update the longest length whenever the sum equals k.',
    '`O(n²)` time.', '`O(1)` auxiliary space.', '''
    class Solution:
        def maxSubArrayLen(self, nums: list[int], k: int) -> int:
            best = 0
            for left in range(len(nums)):
                total = 0
                for right in range(left, len(nums)):
                    total += nums[right]
                    if total == k:
                        best = max(best, right - left + 1)
            return best
    ''', baseline=True, pitfalls=('Do not stop when a sum exceeds k; negative values can bring it back down.',))

add('power-of-three', 'Repeated Division',
    'Divide a positive power of three repeatedly until it reaches one. This recognizes powers without relying on the largest power fitting in 32 bits.',
    'Reject nonpositive values.|Divide by three while the remainder is zero.|Accept exactly when the final value is one.',
    '`O(log n)` divisions for positive n under bounded arithmetic.', '`O(1)` auxiliary space.', '''
    class Solution:
        def isPowerOfThree(self, n: int) -> bool:
            if n <= 0:
                return False
            while n % 3 == 0:
                n //= 3
            return n == 1
    ''')

add('odd-even-linked-list', 'Collect and Relink Nodes',
    'Store original nodes in traversal order, then concatenate odd-position nodes with even-position nodes. Relinking these objects preserves their values and identity with extra workspace.',
    'Collect nodes without changing links.|Order odd positions before even positions.|Reconnect adjacent nodes and terminate the final next pointer.',
    '`O(n)` time.', '`O(n)` auxiliary space for node references.', '''
    class Solution:
        def oddEvenList(self, head: Optional[ListNode]) -> Optional[ListNode]:
            nodes = []
            while head:
                nodes.append(head)
                head = head.next
            ordered = nodes[::2] + nodes[1::2]
            for i, node in enumerate(ordered):
                node.next = ordered[i + 1] if i + 1 < len(ordered) else None
            return ordered[0] if ordered else None
    ''')

add('verify-preorder-serialization-of-a-binary-tree', 'Reduce Completed Subtrees',
    'A non-null node followed by two null subtrees forms a completed subtree. Replace each such triple by one null marker. A valid serialization reduces to exactly one marker.',
    'Push tokens onto a stack.|Replace a non-null node followed by two null markers with one null marker.|Accept only a final stack containing one null marker.',
    '`O(n)` for n tokens; every token is pushed and removed a bounded number of times.', '`O(n)` for tokenization and the stack.', '''
    class Solution:
        def isValidSerialization(self, preorder: str) -> bool:
            stack = []
            for token in preorder.split(','):
                stack.append(token)
                while len(stack) >= 3 and stack[-1] == stack[-2] == '#' and stack[-3] != '#':
                    stack[-3:] = ['#']
            return stack == ['#']
    ''')

add('increasing-triplet-subsequence', 'Quadratic Subsequence DP',
    'Compute the longest increasing subsequence ending at each index. Reaching length three proves that an increasing triplet exists.',
    'Initialize each position with length one.|For each earlier smaller value, extend its subsequence length.|Return true once a length reaches three.',
    '`O(n²)` time.', '`O(n)` for lengths.', '''
    class Solution:
        def increasingTriplet(self, nums: list[int]) -> bool:
            lengths = [1] * len(nums)
            for i in range(len(nums)):
                for j in range(i):
                    if nums[j] < nums[i]:
                        lengths[i] = max(lengths[i], lengths[j] + 1)
                if lengths[i] >= 3:
                    return True
            return False
    ''', baseline=True)

add('reverse-vowels-of-a-string', 'Collect and Replace Vowels',
    'Collect vowels separately, then fill vowel positions from that collection in reverse order. Other positions retain their original characters.',
    'Collect uppercase and lowercase vowels.|Scan the string again.|Replace each vowel by the last remaining collected vowel.|Join the output characters.',
    '`O(n)` time.', '`O(n)` auxiliary and output space.', '''
    class Solution:
        def reverseVowels(self, s: str) -> str:
            vowels = set('aeiouAEIOU')
            saved = [char for char in s if char in vowels]
            return ''.join(saved.pop() if char in vowels else char for char in s)
    ''')

add('intersection-of-two-arrays-ii', 'Sort and Merge',
    'Sort both arrays to group repeats. Two pointers consume one occurrence from each side on a match, preserving intersection multiplicity.',
    'Sort both arrays.|Advance the pointer on the smaller value.|On equality, emit that value and advance both pointers.',
    '`O(n log n + m log m)` time.', '`O(n + m)` worst-case Python sorting workspace, excluding output.', '''
    class Solution:
        def intersect(self, nums1: list[int], nums2: list[int]) -> list[int]:
            nums1.sort()
            nums2.sort()
            i = j = 0
            result = []
            while i < len(nums1) and j < len(nums2):
                if nums1[i] < nums2[j]:
                    i += 1
                elif nums1[i] > nums2[j]:
                    j += 1
                else:
                    result.append(nums1[i])
                    i += 1
                    j += 1
            return result
    ''')

add('count-numbers-with-unique-digits', 'Digit Backtracking',
    'Generate positive numbers up to n digits without repeating digits. Count zero separately and disallow leading zeros in positive numbers.',
    'Begin with one answer for zero.|Choose a nonzero first digit.|Extend only with unused digits, counting every created number.|Stop at n digits or ten distinct digits.',
    '`O(Σ P(10, d))` as an upper bound over d up to min(n, 10), where P counts permutations.', '`O(min(n, 10))` recursion depth.', '''
    class Solution:
        def countNumbersWithUniqueDigits(self, n: int) -> int:
            def visit(depth, used):
                if depth == min(n, 10):
                    return 0
                total = 0
                for digit in range(10):
                    if depth == 0 and digit == 0:
                        continue
                    if not used & (1 << digit):
                        total += 1 + visit(depth + 1, used | (1 << digit))
                return total
            return 1 + visit(0, 0)
    ''', baseline=True)

add('sort-transformed-array', 'Transform and Sort',
    'Evaluate the quadratic at every input value and sort the results. This avoids using the parabola\'s shape and the input\'s existing order.',
    'Compute a*x*x + b*x + c for each value.|Sort the transformed values.|Return the sorted list.',
    '`O(n log n)` time.', '`O(n)` including output and Python sorting workspace.', '''
    class Solution:
        def sortTransformedArray(self, nums: list[int], a: int, b: int, c: int) -> list[int]:
            return sorted(a * x * x + b * x + c for x in nums)
    ''')

add('bomb-enemy', 'Scan Four Rays per Empty Cell',
    'For each possible bomb location, walk in four directions until walls stop the rays. Count enemies along these rays and keep the best location.',
    'Consider empty cells only.|Advance along four rays until reaching a wall or board edge.|Count enemies passed and keep the largest total.',
    '`O(r × c × (r + c))` time.', '`O(1)` auxiliary space.', '''
    class Solution:
        def maxKilledEnemies(self, grid: list[list[str]]) -> int:
            if not grid or not grid[0]:
                return 0
            rows, cols = len(grid), len(grid[0])
            best = 0
            for r in range(rows):
                for c in range(cols):
                    if grid[r][c] != '0':
                        continue
                    count = 0
                    for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
                        x, y = r + dr, c + dc
                        while 0 <= x < rows and 0 <= y < cols and grid[x][y] != 'W':
                            count += grid[x][y] == 'E'
                            x, y = x + dr, y + dc
                    best = max(best, count)
            return best
    ''', baseline=True)

add('design-hit-counter', 'Timestamp Queue',
    'Keep each hit timestamp in a queue. Chronological calls mean expired hits form a prefix that can be removed before answering a query.',
    'Append every hit timestamp.|Before counting, remove timestamps at most current_time - 300.|Return the number of remaining hits.',
    '`O(1)` per hit and amortized `O(1)` per removed hit; one query may remove many.', '`O(H)` for stored hits between cleanups, rather than fixed-size buckets.', '''
    from collections import deque

    class HitCounter:
        def __init__(self):
            self.hits = deque()

        def hit(self, timestamp: int) -> None:
            self.hits.append(timestamp)

        def getHits(self, timestamp: int) -> int:
            while self.hits and self.hits[0] <= timestamp - 300:
                self.hits.popleft()
            return len(self.hits)
    ''', pitfalls=('A hit exactly 300 seconds old is excluded.', 'Repeated hits at one timestamp count separately.'))

add('water-and-jug-problem', 'Breadth-First Jug States',
    'Represent a state by the current volume in each jug. Explore fill, empty, and pour operations directly; reaching the requested total proves feasibility.',
    'Start with both jugs empty.|Generate fill, empty, and pour-in-either-direction states.|Visit each volume pair once.|Accept when the current volumes sum to targetCapacity.',
    '`O((x + 1) × (y + 1))` as an upper bound for capacities x and y.', '`O((x + 1) × (y + 1))` for visited states and queue.', '''
    from collections import deque

    class Solution:
        def canMeasureWater(self, x: int, y: int, targetCapacity: int) -> bool:
            queue, seen = deque([(0, 0)]), {(0, 0)}
            while queue:
                a, b = queue.popleft()
                if a + b == targetCapacity:
                    return True
                ab, ba = min(a, y - b), min(b, x - a)
                for state in [(x, b), (a, y), (0, b), (a, 0), (a - ab, b + ab), (a + ba, b - ba)]:
                    if state not in seen:
                        seen.add(state)
                        queue.append(state)
            return False
    ''', baseline=True)

add('range-addition', 'Apply Every Range Literally',
    'Apply every inclusive update to each affected position. This exposes the repeated work avoided by the default difference array.',
    'Create a zero-filled result.|For every update, add its increment at indices start through end.|Return the array.',
    '`O(length × u)` for u updates in the worst case.', '`O(1)` auxiliary space, excluding output.', '''
    class Solution:
        def getModifiedArray(self, length: int, updates: list[list[int]]) -> list[int]:
            result = [0] * length
            for start, end, increment in updates:
                for i in range(start, end + 1):
                    result[i] += increment
            return result
    ''', baseline=True)

add('find-k-pairs-with-smallest-sums', 'Enumerate and Sort Pairs',
    'Materialize the Cartesian product and sort it by pair sum. The first k pairs are smallest, while the default avoids building the full product.',
    'Create every pair.|Sort pairs by sum.|Return at most the first k pairs.',
    '`O(nm log(nm + 1))` time.', '`O(nm)` for pairs and sorting workspace.', '''
    class Solution:
        def kSmallestPairs(self, nums1: list[int], nums2: list[int], k: int) -> list[list[int]]:
            pairs = [[a, b] for a in nums1 for b in nums2]
            pairs.sort(key=lambda pair: pair[0] + pair[1])
            return pairs[:k]
    ''', baseline=True)

add('guess-number-higher-or-lower-ii', 'Bottom-Up Minimax Intervals',
    'Try every first guess for each interval and pay for the more expensive remaining side. Building intervals from short to long makes both subinterval costs available first.',
    'Initialize zero cost for intervals of at most one value.|Increase interval length.|Try each guess, adding its value to the larger subinterval cost.|Keep the minimum guaranteed cost.',
    '`O(n³)` time.', '`O(n²)` for the table.', filename='375-2.py')

add('wiggle-subsequence', 'Quadratic Up-and-Down DP',
    'Store the best subsequence ending at each index with an upward or downward final step. Extend from earlier positions to compare with the rolling greedy default.',
    'Initialize both lengths to one.|A smaller earlier value extends a downward state into an upward state.|A larger earlier value extends an upward state into a downward state.|Return the largest length.',
    '`O(n²)` time.', '`O(n)` for both state arrays.', '''
    class Solution:
        def wiggleMaxLength(self, nums: list[int]) -> int:
            if not nums:
                return 0
            up, down = [1] * len(nums), [1] * len(nums)
            for i in range(len(nums)):
                for j in range(i):
                    if nums[i] > nums[j]:
                        up[i] = max(up[i], down[j] + 1)
                    elif nums[i] < nums[j]:
                        down[i] = max(down[i], up[j] + 1)
            return max(max(up), max(down))
    ''', baseline=True)

add('kth-smallest-element-in-a-sorted-matrix', 'Binary Search the Value Range',
    'Count entries at most a candidate value with a staircase scan. Binary-search the first value whose count reaches k. Duplicates contribute separately to the count.',
    'Search between the smallest and largest values.|Count qualifying entries using a nonincreasing column pointer across rows.|Move the value bounds according to whether the count reaches k.',
    '`O(n log(R + 1))` for an n-by-n matrix and value span R.', '`O(1)` auxiliary space.', filename='378-2.py')

add('lexicographical-numbers', 'Sort Decimal Representations',
    'Lexicographical number order is string order on decimal representations. Sorting integers by those strings gives a baseline for walking the decimal-prefix tree.',
    'Enumerate integers one through n.|Use decimal strings as sorting keys.|Return the sorted integers.',
    '`O(n × D × log n)` as an upper bound for D decimal digits per key.', '`O(n × D)` including keys and output.', '''
    class Solution:
        def lexicalOrder(self, n: int) -> list[int]:
            return sorted(range(1, n + 1), key=str)
    ''')

add('longest-substring-with-at-least-k-repeating-characters', 'Split on Ineligible Characters',
    'A character occurring fewer than k times cannot belong to a valid substring of the current segment. Split around it and solve the remaining segments independently.',
    'Count characters in the segment.|Split around a character occurring fewer than k times and solve each piece.|When all present characters meet the threshold, return the whole segment length.',
    '`O(a × n)` for alphabet size a, at most 26.', '`O(a × n)` as a conservative bound for recursive slices and counts.', '''
    from collections import Counter

    class Solution:
        def longestSubstring(self, s: str, k: int) -> int:
            if len(s) < k:
                return 0
            for char, count in Counter(s).items():
                if count < k:
                    return max(self.longestSubstring(piece, k) for piece in s.split(char))
            return len(s)
    ''')

add('rotate-function', 'Evaluate Every Rotation',
    'Compute the weighted sum for every cyclic rotation. Modular indexing avoids allocating rotated arrays while exposing repeated work.',
    'Enumerate cyclic starting offsets.|Compute each weighted sum.|Keep the maximum.',
    '`O(n²)` time.', '`O(1)` auxiliary space.', '''
    class Solution:
        def maxRotateFunction(self, nums: list[int]) -> int:
            return max(sum(i * nums[(i + offset) % len(nums)] for i in range(len(nums)))
                       for offset in range(len(nums)))
    ''', baseline=True)

add('integer-replacement', 'Memoized Odd Branches',
    'Even values must be halved. For odd values above one, try both neighboring even values, immediately halve each, and cache the smaller result. This checks both choices instead of applying the greedy bit rule.',
    'Return zero for one.|For an even value, pay one and solve half.|For an odd value, pay two and choose between the halved neighbors.|Memoize visited values.',
    '`O(log n)` states under bounded arithmetic: each halving level has a bounded number of neighboring values.', '`O(log n)` for memoization and recursion.', '''
    from functools import cache

    class Solution:
        def integerReplacement(self, n: int) -> int:
            @cache
            def solve(value):
                if value == 1:
                    return 0
                if value % 2 == 0:
                    return 1 + solve(value // 2)
                return 2 + min(solve((value - 1) // 2), solve((value + 1) // 2))
            return solve(n)
    ''')

add('sum-of-left-leaves', 'Iterative Tree Stack',
    'Traverse with a stack. A left child contributes only when it has no children; right leaves never contribute.',
    'Push the root when present.|Add a left child\'s value if it is a leaf.|Push non-leaf left children and existing right children.',
    '`O(n)` time.', '`O(h)` stack space.', filename='404-2.py')

add('arithmetic-slices', 'Extend Every Starting Position',
    'Fix the first two values of a slice and extend its right endpoint while the adjacent difference stays unchanged. Every successful extension beyond length two contributes a slice.',
    'Choose each left endpoint.|Record the first difference.|Extend while the difference stays equal.|Count each successful extension.',
    '`O(n²)` in the worst case.', '`O(1)` auxiliary space.', '''
    class Solution:
        def numberOfArithmeticSlices(self, nums: list[int]) -> int:
            total = 0
            for left in range(len(nums) - 2):
                difference = nums[left + 1] - nums[left]
                for right in range(left + 2, len(nums)):
                    if nums[right] - nums[right - 1] != difference:
                        break
                    total += 1
            return total
    ''', baseline=True)

add('third-maximum-number', 'Three-Value Min-Heap',
    'Keep the three largest distinct values in a min-heap. A set prevents repeats from entering again. With three retained values, the root is the third maximum; otherwise return the overall maximum.',
    'Insert unseen values into the heap and set.|Remove the minimum when the heap exceeds three values.|Return the third maximum if present, otherwise the maximum.',
    '`O(n)` because the heap holds at most three values.', '`O(u)` for u distinct values in the seen set; the heap is constant-sized.', filename='414-2.py')

add('battleships-in-a-board', 'Flood-Fill Ship Components',
    'Treat connected ship cells as components. Start a traversal from each unseen ship cell and count one ship per traversal. The visited set preserves the board.',
    'Scan all board cells.|Start a component traversal at each unseen X.|Visit orthogonally adjacent X cells.|Count the number of traversals.',
    '`O(r × c)` time.', '`O(r × c)` for visited cells and the stack.', '''
    class Solution:
        def countBattleships(self, board: list[list[str]]) -> int:
            seen, count = set(), 0
            for r in range(len(board)):
                for c in range(len(board[0])):
                    if board[r][c] != 'X' or (r, c) in seen:
                        continue
                    count += 1
                    stack = [(r, c)]
                    seen.add((r, c))
                    while stack:
                        x, y = stack.pop()
                        for a, b in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
                            if 0 <= a < len(board) and 0 <= b < len(board[0]) and board[a][b] == 'X' and (a, b) not in seen:
                                seen.add((a, b))
                                stack.append((a, b))
            return count
    ''')

add('n-ary-tree-level-order-traversal', 'Depth-Indexed DFS',
    'Collect node values by depth while recursively visiting children in their stored order. Depth groups produce the same level order as a queue.',
    'Create a level list on the first visit to a depth.|Append the current value.|Visit each child at the next depth.',
    '`O(n)` time.', '`O(h)` recursion stack, plus `O(n)` output.', '''
    class Solution:
        def levelOrder(self, root: 'Node') -> list[list[int]]:
            levels = []
            def visit(node, depth):
                if not node:
                    return
                if len(levels) == depth:
                    levels.append([])
                levels[depth].append(node.val)
                for child in node.children:
                    visit(child, depth + 1)
            visit(root, 0)
            return levels
    ''')

add('minimum-genetic-mutation', 'Bidirectional BFS',
    'Search from both genes, expanding the smaller frontier. A meeting mutation connects the two shortest frontier distances, while the bank prevents invalid intermediate genes.',
    'Return zero if start equals end; otherwise require end in the bank.|Maintain frontiers from start and end.|Expand the smaller frontier by one-character mutations.|Return the accumulated layer count when frontiers meet.',
    '`O(B × L²)` as an upper bound including constructing and hashing L-character mutations for B bank genes.', '`O(B × L)` for the bank and frontiers.', '''
    class Solution:
        def minMutation(self, startGene: str, endGene: str, bank: list[str]) -> int:
            if startGene == endGene:
                return 0
            remaining = set(bank)
            if endGene not in remaining:
                return -1
            front, back = {startGene}, {endGene}
            remaining -= front | back
            distance = 0
            while front and back:
                if len(front) > len(back):
                    front, back = back, front
                following = set()
                for gene in front:
                    for i in range(len(gene)):
                        for char in 'ACGT':
                            candidate = gene[:i] + char + gene[i + 1:]
                            if candidate in back:
                                return distance + 1
                            if candidate in remaining:
                                remaining.remove(candidate)
                                following.add(candidate)
                front = following
                distance += 1
            return -1
    ''')

add('find-right-interval', 'Scan Candidate Starts',
    'For each interval, inspect every possible next interval and select the smallest start that is at least the current end. This baseline avoids sorting or an ordered lookup.',
    'Consider each interval\'s end.|Scan every start meeting that end.|Keep the index of the smallest qualifying start, or -1.',
    '`O(n²)` time.', '`O(1)` auxiliary space, excluding output.', '''
    class Solution:
        def findRightInterval(self, intervals: list[list[int]]) -> list[int]:
            result = []
            for _, end in intervals:
                best = -1
                for i, (start, _) in enumerate(intervals):
                    if start >= end and (best == -1 or start < intervals[best][0]):
                        best = i
                result.append(best)
            return result
    ''', baseline=True)

add('path-sum-iii', 'Prefix Sums on the Active Path',
    'A downward path ending here has the target sum when an earlier root-prefix sum differs by targetSum. Track prefix frequencies only along the current ancestor path and remove each prefix when backtracking.',
    'Seed prefix sum zero with count one.|Add the current value to the root-prefix sum.|Count earlier prefixes equal to current_sum - targetSum.|Add the current prefix, visit both children, then remove it.',
    '`O(n)` expected time with hash lookups.', '`O(h)` active prefix entries and recursion stack.', '''
    from collections import defaultdict

    class Solution:
        def pathSum(self, root: Optional[TreeNode], targetSum: int) -> int:
            prefixes = defaultdict(int, {0: 1})
            def visit(node, total):
                if not node:
                    return 0
                total += node.val
                count = prefixes.get(total - targetSum, 0)
                prefixes[total] += 1
                count += visit(node.left, total) + visit(node.right, total)
                prefixes[total] -= 1
                if prefixes[total] == 0:
                    del prefixes[total]
                return count
            return visit(root, 0)
    ''', pitfalls=('Count equal prefixes with their full frequency, especially for zero-valued nodes.', 'Remove prefixes after a subtree so sibling paths are not joined.'))

add('number-of-boomerangs', 'Enumerate Ordered Triples',
    'A boomerang chooses a center and two distinct endpoints at equal distance. Enumerating ordered endpoint pairs counts both orientations directly.',
    'Choose a center and two different remaining indices.|Compare squared distances from the center.|Count each ordered matching triple.',
    '`O(n³)` time.', '`O(1)` auxiliary space.', '''
    class Solution:
        def numberOfBoomerangs(self, points: list[list[int]]) -> int:
            total = 0
            for i, (x, y) in enumerate(points):
                for j, (a, b) in enumerate(points):
                    for k, (c, d) in enumerate(points):
                        if i != j and i != k and j != k and (a - x)**2 + (b - y)**2 == (c - x)**2 + (d - y)**2:
                            total += 1
            return total
    ''', baseline=True)

add('4sum-ii', 'Four Nested Choices',
    'Choose one value from each array and test the sum directly. This baseline exposes the repeated work avoided by hashing pair sums.',
    'Enumerate one index from each of the four arrays.|Count choices whose values sum to zero.|Return the count.',
    '`O(n⁴)` for equal-sized arrays.', '`O(1)` auxiliary space.', '''
    class Solution:
        def fourSumCount(self, nums1: list[int], nums2: list[int], nums3: list[int], nums4: list[int]) -> int:
            return sum(a + b + c + d == 0 for a in nums1 for b in nums2 for c in nums3 for d in nums4)
    ''', baseline=True)

add('repeated-substring-pattern', 'Try Every Period Length',
    'A repeated unit must have a length dividing the string length. Try each proper divisor and compare the resulting repeated prefix with the whole string.',
    'Enumerate candidate unit lengths up to half the string.|Skip lengths that do not divide the total.|Repeat the candidate prefix and compare with the input.',
    '`O(n²)` as a conservative worst-case bound.', '`O(n)` for a repeated candidate.', '''
    class Solution:
        def repeatedSubstringPattern(self, s: str) -> bool:
            for length in range(1, len(s) // 2 + 1):
                if len(s) % length == 0 and s[:length] * (len(s) // length) == s:
                    return True
            return False
    ''')

add('hamming-distance', 'Clear Differing Set Bits',
    'XOR marks exactly the bit positions where inputs differ. Repeatedly clearing its lowest set bit counts those differences without visiting zero bits.',
    'XOR the inputs.|Clear the lowest set bit using value & (value - 1).|Count clearing operations.',
    '`O(b)` for b differing bits, at most 31 under the input bounds.', '`O(1)` auxiliary space.', '''
    class Solution:
        def hammingDistance(self, x: int, y: int) -> int:
            value, count = x ^ y, 0
            while value:
                value &= value - 1
                count += 1
            return count
    ''')

add('minimum-moves-to-equal-array-elements-ii', 'Try Every Input Target',
    'For a chosen final value, each element needs its absolute distance in moves. At least one optimal target is an input value, so testing every input value gives a baseline for selecting the median.',
    'Treat each input value as a candidate target.|Sum distances from all values to that target.|Return the smallest sum.',
    '`O(n²)` time.', '`O(1)` auxiliary space.', '''
    class Solution:
        def minMoves2(self, nums: list[int]) -> int:
            return min(sum(abs(value - target) for value in nums) for target in nums)
    ''', baseline=True)

add('unique-substrings-in-wraparound-string', 'Store Valid Substrings',
    'Extend a substring while adjacent letters advance cyclically through the alphabet. Store every valid substring in a set to count distinct values directly.',
    'Start a candidate at each index.|Extend only when consecutive letters differ by one modulo 26.|Add every valid substring to a set.|Return the set size.',
    '`O(n³)` worst-case work including substring copying and hashing.', '`O(n³)` worst-case character storage across distinct substrings.', '''
    class Solution:
        def findSubstringInWraproundString(self, s: str) -> int:
            seen = set()
            for left in range(len(s)):
                for right in range(left, len(s)):
                    if right > left and (ord(s[right]) - ord(s[right - 1])) % 26 != 1:
                        break
                    seen.add(s[left:right + 1])
            return len(seen)
    ''', baseline=True)

add('heaters', 'Binary Search Each House',
    'A house\'s closest heater is one of the two heater positions surrounding it in sorted order. Binary-search those neighbors independently for each house and take the largest required distance.',
    'Sort heater positions.|Find each house\'s insertion point.|Measure distances to its existing neighbors.|Return the largest nearest-heater distance.',
    '`O(m log m + n log m)` for n houses and m heaters.', '`O(m)` worst-case Python sorting workspace.', '''
    from bisect import bisect_left

    class Solution:
        def findRadius(self, houses: list[int], heaters: list[int]) -> int:
            heaters.sort()
            radius = 0
            for house in houses:
                i = bisect_left(heaters, house)
                distance = float('inf')
                if i < len(heaters):
                    distance = heaters[i] - house
                if i:
                    distance = min(distance, house - heaters[i - 1])
                radius = max(radius, distance)
            return radius
    ''')

add('number-complement', 'Significant-Bit Mask',
    'Create a mask with one bit for every significant bit in the positive input. XOR flips exactly those positions and leaves leading zeros outside the mask untouched.',
    'Find the input\'s significant-bit count.|Construct an all-ones mask of that width.|XOR the mask with the input.',
    '`O(1)` under the fixed 32-bit input range.', '`O(1)` under the same bounds.', '''
    class Solution:
        def findComplement(self, num: int) -> int:
            return num ^ ((1 << num.bit_length()) - 1)
    ''')

add('total-hamming-distance', 'Count Every Pair',
    'Compute the Hamming distance independently for each unordered pair and add the results. This contrasts with aggregating all pairs by bit position.',
    'Enumerate i < j.|XOR the two values and count set bits.|Add those counts.',
    '`O(n² × w)` as a bit-work upper bound for width w, fixed by the problem.', '`O(1)` auxiliary space.', '''
    class Solution:
        def totalHammingDistance(self, nums: list[int]) -> int:
            return sum((nums[i] ^ nums[j]).bit_count()
                       for i in range(len(nums)) for j in range(i + 1, len(nums)))
    ''', baseline=True)

add('predict-the-winner', 'Memoized Score Difference',
    'For a remaining interval, the current player maximizes their final score difference. Taking an endpoint gains that value and gives the opponent the role represented by the smaller interval.',
    'Return a single value for a one-element interval.|Try taking either endpoint and subtract the opponent\'s best difference.|Memoize interval results.|Accept a nonnegative initial difference, including a tie.',
    '`O(n²)` states and time.', '`O(n²)` memoization plus `O(n)` recursion depth.', '''
    from functools import cache

    class Solution:
        def predictTheWinner(self, nums: list[int]) -> bool:
            @cache
            def difference(left, right):
                if left == right:
                    return nums[left]
                return max(nums[left] - difference(left + 1, right),
                           nums[right] - difference(left, right - 1))
            return difference(0, len(nums) - 1) >= 0
    ''')

add('non-decreasing-subsequences', 'Enumerate Subsequence Masks',
    'Every index mask defines a subsequence in its original order. Keep masks with at least two positions whose values are nondecreasing, and deduplicate equal value sequences.',
    'Enumerate index masks.|Collect selected values in index order.|Check adjacent values for nondecreasing order.|Deduplicate valid sequences as tuples and return lists.',
    '`O(n × 2^n)` time.', '`O(n × 2^n)` worst-case space including deduplicated output.', '''
    class Solution:
        def findSubsequences(self, nums: list[int]) -> list[list[int]]:
            found = set()
            for mask in range(1 << len(nums)):
                if mask.bit_count() < 2:
                    continue
                values = tuple(nums[i] for i in range(len(nums)) if mask & (1 << i))
                if all(a <= b for a, b in zip(values, values[1:])):
                    found.add(values)
            return [list(values) for values in found]
    ''', baseline=True)

add('diagonal-traverse', 'Group by Coordinate Sum',
    'Cells with equal row-plus-column belong to one diagonal. Row-major collection gives their downward order; reversing even-numbered groups produces the alternating traversal.',
    'Group values by r + c while scanning rows.|Visit diagonal groups in increasing index order.|Reverse even-index groups and concatenate them.',
    '`O(r × c)` time.', '`O(r × c)` for grouped values and output.', '''
    from collections import defaultdict

    class Solution:
        def findDiagonalOrder(self, mat: list[list[int]]) -> list[int]:
            diagonals = defaultdict(list)
            for r, row in enumerate(mat):
                for c, value in enumerate(row):
                    diagonals[r + c].append(value)
            result = []
            for d in range(len(mat) + len(mat[0]) - 1):
                result.extend(diagonals[d][::-1] if d % 2 == 0 else diagonals[d])
            return result
    ''')

add('next-greater-element-ii', 'Circular Scan per Position',
    'For each position, scan forward around the circle until finding a strictly larger value or returning to the start. This directly models the query that the monotone stack batches.',
    'Start every answer at -1.|For each index, examine the next n - 1 circular positions.|Stop on the first strictly greater value.',
    '`O(n²)` time.', '`O(1)` auxiliary space, excluding output.', '''
    class Solution:
        def nextGreaterElements(self, nums: list[int]) -> list[int]:
            result = [-1] * len(nums)
            for i in range(len(nums)):
                for step in range(1, len(nums)):
                    value = nums[(i + step) % len(nums)]
                    if value > nums[i]:
                        result[i] = value
                        break
            return result
    ''', baseline=True)

add('most-frequent-subtree-sum', 'Recompute Each Subtree Sum',
    'Visit every node as a possible subtree root, recomputing its complete subtree sum independently. Count those sums to expose the work saved by a single postorder pass.',
    'Enumerate all tree nodes.|For each node, traverse its subtree to calculate the sum.|Count sum frequencies and return every most-frequent sum.',
    '`O(n²)` in the worst case of a skew tree.', '`O(n)` for traversal, sum frequencies, and recursion.', '''
    from collections import Counter

    class Solution:
        def findFrequentTreeSum(self, root: Optional[TreeNode]) -> list[int]:
            if not root:
                return []
            def total(node):
                return node.val + total(node.left) + total(node.right) if node else 0
            counts, stack = Counter(), [root]
            while stack:
                node = stack.pop()
                counts[total(node)] += 1
                stack.extend(child for child in (node.left, node.right) if child)
            largest = max(counts.values())
            return [value for value, count in counts.items() if count == largest]
    ''', baseline=True)

add('fibonacci-number', 'Memoized Recursion',
    'Use the recursive Fibonacci definition while caching each argument. Shared subproblems are evaluated once instead of being expanded repeatedly.',
    'Return n for zero and one.|Recursively sum the previous two values.|Cache the result for each n.',
    '`O(n)` under the fixed integer bounds.', '`O(n)` for cache and recursion.', '''
    from functools import cache

    class Solution:
        def fib(self, n: int) -> int:
            @cache
            def solve(value):
                if value < 2:
                    return value
                return solve(value - 1) + solve(value - 2)
            return solve(n)
    ''')

add('longest-word-in-dictionary-through-deleting', 'Sort Candidates Before Matching',
    'Order dictionary words by descending length and then ascending lexicographical order. The first word that is a subsequence already satisfies both answer priorities.',
    'Sort words by negative length and then text.|Check each candidate with one forward scan through s.|Return the first subsequence match, or an empty string.',
    '`O(W × L × log W + W × (S + L))` as an upper bound for W words, maximum length L, and source length S.', '`O(W)` sorting workspace, excluding input strings.', '''
    class Solution:
        def findLongestWord(self, s: str, dictionary: list[str]) -> str:
            for word in sorted(dictionary, key=lambda word: (-len(word), word)):
                index = 0
                for char in s:
                    if index < len(word) and char == word[index]:
                        index += 1
                if index == len(word):
                    return word
            return ''
    ''')

add('beautiful-arrangement', 'Bottom-Up Used-Digit Masks',
    'The chosen-digit mask determines the next position. Add each unused number that divides that position or is divisible by it, accumulating counts into the next mask.',
    'Seed the empty mask with one arrangement.|Use set-bit count plus one as the next position.|Append each unused compatible number.|Return the full-mask count.',
    '`O(n × 2^n)` time.', '`O(2^n)` for mask counts.', '''
    class Solution:
        def countArrangement(self, n: int) -> int:
            dp = [0] * (1 << n)
            dp[0] = 1
            for mask in range(1 << n):
                position = mask.bit_count() + 1
                for number in range(1, n + 1):
                    bit = 1 << (number - 1)
                    if not mask & bit and (number % position == 0 or position % number == 0):
                        dp[mask | bit] += dp[mask]
            return dp[-1]
    ''')

add('minesweeper', 'Breadth-First Reveal',
    'Reveal safe cells with a queue. A numbered cell stops expansion; an empty cell with no neighboring mines reveals its surrounding unrevealed cells.',
    'Turn a clicked mine into X and return.|Queue the clicked safe cell.|Count adjacent mines for each queued cell.|Write a number when mines exist; otherwise write B and queue unseen safe neighbors.',
    '`O(r × c)` time.', '`O(r × c)` for the queue and visited set.', '''
    from collections import deque

    class Solution:
        def updateBoard(self, board: list[list[str]], click: list[int]) -> list[list[str]]:
            r, c = click
            if board[r][c] == 'M':
                board[r][c] = 'X'
                return board
            queue, seen = deque([(r, c)]), {(r, c)}
            while queue:
                r, c = queue.popleft()
                neighbors = [(x, y) for x in range(max(0, r - 1), min(len(board), r + 2))
                             for y in range(max(0, c - 1), min(len(board[0]), c + 2)) if (x, y) != (r, c)]
                mines = sum(board[x][y] == 'M' for x, y in neighbors)
                board[r][c] = str(mines) if mines else 'B'
                if not mines:
                    for x, y in neighbors:
                        if board[x][y] == 'E' and (x, y) not in seen:
                            seen.add((x, y))
                            queue.append((x, y))
            return board
    ''')

add('k-diff-pairs-in-an-array', 'Sort and Advance Two Pointers',
    'Sort values and compare the difference between two positions. Move the right pointer to increase that difference or the left pointer to decrease it, skipping repeated first values after a match.',
    'Sort the values and start two distinct pointers.|Move right when the difference is too small and left when too large.|Count a match once, then skip its repeated first value.|Keep the two pointers distinct.',
    '`O(n log n)` time.', '`O(n)` worst-case Python sorting workspace.', '''
    class Solution:
        def findPairs(self, nums: list[int], k: int) -> int:
            if k < 0:
                return 0
            nums.sort()
            left, right, count = 0, 1, 0
            while right < len(nums):
                if left == right or nums[right] - nums[left] < k:
                    right += 1
                elif nums[right] - nums[left] > k:
                    left += 1
                else:
                    count += 1
                    value = nums[left]
                    while left < len(nums) and nums[left] == value:
                        left += 1
                    right = max(right, left + 1)
            return count
    ''')

add('minimum-time-difference', 'Sort Minutes and Check the Wrap',
    'Convert clock readings to minutes and sort them. The minimum circular gap lies between adjacent sorted readings or between the last and first readings across midnight.',
    'Convert each HH:MM value to minutes after midnight.|Sort the readings.|Check neighboring gaps and the midnight wrap gap.',
    '`O(n log n)` time.', '`O(n)` for minute values and sorting workspace.', '''
    class Solution:
        def findMinDifference(self, timePoints: list[str]) -> int:
            minutes = sorted(int(t[:2]) * 60 + int(t[3:]) for t in timePoints)
            best = minutes[0] + 1440 - minutes[-1]
            for a, b in zip(minutes, minutes[1:]):
                best = min(best, b - a)
            return best
    ''')

add('01-matrix', 'Two-Pass Distance DP',
    'Every nonzero cell is one step beyond a neighboring distance. A forward pass propagates information from above and left; a backward pass adds information from below and right.',
    'Initialize zero cells to zero and other cells to infinity.|Scan top-left to bottom-right using top and left neighbors.|Scan in reverse using bottom and right neighbors.|Return the distance matrix.',
    '`O(r × c)` time.', '`O(r × c)` for the returned matrix; `O(1)` other workspace.', '''
    class Solution:
        def updateMatrix(self, mat: list[list[int]]) -> list[list[int]]:
            rows, cols = len(mat), len(mat[0])
            distance = [[float('inf')] * cols for _ in range(rows)]
            for r in range(rows):
                for c in range(cols):
                    if mat[r][c] == 0:
                        distance[r][c] = 0
                    else:
                        if r:
                            distance[r][c] = min(distance[r][c], distance[r - 1][c] + 1)
                        if c:
                            distance[r][c] = min(distance[r][c], distance[r][c - 1] + 1)
            for r in range(rows - 1, -1, -1):
                for c in range(cols - 1, -1, -1):
                    if r + 1 < rows:
                        distance[r][c] = min(distance[r][c], distance[r + 1][c] + 1)
                    if c + 1 < cols:
                        distance[r][c] = min(distance[r][c], distance[r][c + 1] + 1)
            return distance
    ''', pitfalls=('The problem guarantees at least one zero.', 'Both passes are needed for sources on different sides.'))

add('optimal-division', 'Enumerate Parenthesizations',
    'Try every binary split and every left/right parenthesization, using exact rational arithmetic to compare results. This baseline derives the best expression without using the positive-number shortcut.',
    'A single number supplies its own value and expression.|Split each interval at every position.|Divide every left result by every right result, keeping the expressions.|Return an expression with maximum exact value.',
    'Exponential in the number of values: there are Catalan-many parenthesizations, plus rational-arithmetic costs.', 'Exponential result storage; intended for small examples.', '''
    from fractions import Fraction
    from functools import cache

    class Solution:
        def optimalDivision(self, nums: list[int]) -> str:
            @cache
            def choices(left, right):
                if right - left == 1:
                    return [(Fraction(nums[left]), str(nums[left]))]
                result = []
                for split in range(left + 1, right):
                    for a, expression_a in choices(left, split):
                        for b, expression_b in choices(split, right):
                            if b:
                                denominator = '(' + expression_b + ')' if right - split > 1 else expression_b
                                result.append((a / b, expression_a + '/' + denominator))
                return result
            return max(choices(0, len(nums)), key=lambda item: item[0])[1]
    ''', baseline=True, pitfalls=('Parentheses on a denominator with several values are necessary.', 'Exact rational comparisons avoid a floating-point ranking error.'))

add('next-greater-element-iii', 'Digit-Count Backtracking',
    'Build candidate numbers in increasing digit order from the same digit counts. A prefix smaller than the original can never produce the next greater number; a prefix above the 32-bit maximum can never be valid.',
    'Count available decimal digits.|Build candidate digits in ascending order, never using a leading zero.|Prune prefixes below the original or above the signed 32-bit limit.|Return the first complete strictly larger candidate.',
    '`O(D × D!)` as a conservative unpruned upper bound for D digits; prefix pruning reduces the explored states.', '`O(D)` recursion and digit counts.', '''
    from collections import Counter

    class Solution:
        def nextGreaterElement(self, n: int) -> int:
            original = str(n)
            counts = Counter(original)
            limit = str((1 << 31) - 1)
            def visit(prefix):
                if len(prefix) == len(original):
                    value = int(prefix)
                    return value if n < value <= (1 << 31) - 1 else -1
                for digit in '0123456789':
                    if counts[digit] == 0 or (not prefix and digit == '0'):
                        continue
                    candidate = prefix + digit
                    if candidate < original[:len(candidate)]:
                        continue
                    if len(original) == len(limit) and candidate > limit[:len(candidate)]:
                        continue
                    counts[digit] -= 1
                    value = visit(candidate)
                    counts[digit] += 1
                    if value != -1:
                        return value
                return -1
            return visit('')
    ''')

add('array-nesting', 'Independent Cycle Walks',
    'Walk the permutation from every starting position with a fresh visited set. This recomputes cycles and gives a baseline for globally marking them once.',
    'Start a local set for each index.|Follow array values as next indices until a repeat.|Keep the largest set size.',
    '`O(n²)` in the worst case.', '`O(n)` for a local cycle set.', '''
    class Solution:
        def arrayNesting(self, nums: list[int]) -> int:
            best = 0
            for start in range(len(nums)):
                seen, current = set(), start
                while current not in seen:
                    seen.add(current)
                    current = nums[current]
                best = max(best, len(seen))
            return best
    ''', baseline=True)

add('shortest-unsorted-continuous-subarray', 'Compare with a Sorted Copy',
    'The first and last positions differing from the fully sorted array bound the shortest segment that must be sorted. Positions outside those bounds already have their required values.',
    'Sort a copy of the array.|Find all positions whose values differ.|Return the span from first to last mismatch, or zero.',
    '`O(n log n)` time.', '`O(n)` for the sorted copy and mismatch indices.', '''
    class Solution:
        def findUnsortedSubarray(self, nums: list[int]) -> int:
            ordered = sorted(nums)
            wrong = [i for i, (a, b) in enumerate(zip(nums, ordered)) if a != b]
            return wrong[-1] - wrong[0] + 1 if wrong else 0
    ''')

add('delete-operation-for-two-strings', 'Deletion-Cost DP',
    'Store the minimum deletions needed for every pair of prefixes directly. Matching characters are kept together; differing characters require deleting from one side.',
    'Initialize deletion costs against an empty prefix.|On equal characters, reuse the diagonal cost.|Otherwise add one to the smaller cost of deleting from either side.|Return the full-prefix cost.',
    '`O(nm)` time.', '`O(m)` for rolling prefix costs.', '''
    class Solution:
        def minDistance(self, word1: str, word2: str) -> int:
            previous = list(range(len(word2) + 1))
            for i, a in enumerate(word1, 1):
                current = [i]
                for j, b in enumerate(word2, 1):
                    current.append(previous[j - 1] if a == b else 1 + min(previous[j], current[-1]))
                previous = current
            return previous[-1]
    ''')

add('valid-square', 'Try Cyclic Vertex Orders',
    'Try each ordering as a possible walk around the square. Four equal nonzero sides and two diagonals with twice the squared side length characterize a square in that order.',
    'Enumerate orderings of the four points.|Check equal positive squared side lengths.|Check both squared diagonals equal twice a squared side.|Accept any ordering meeting those conditions.',
    '`O(1)` for 24 orderings of four points.', '`O(1)` auxiliary space.', '''
    from itertools import permutations

    class Solution:
        def validSquare(self, p1: list[int], p2: list[int], p3: list[int], p4: list[int]) -> bool:
            def distance(a, b):
                return (a[0] - b[0])**2 + (a[1] - b[1])**2
            for a, b, c, d in permutations([p1, p2, p3, p4]):
                side = distance(a, b)
                if side > 0 and distance(b, c) == distance(c, d) == distance(d, a) == side and distance(a, c) == distance(b, d) == 2 * side:
                    return True
            return False
    ''')

add('valid-triangle-number', 'Enumerate Side Triples',
    'Test every index triple against all three triangle inequalities. Zero-length sides fail automatically, and equal lengths at distinct indices remain separate choices.',
    'Enumerate three distinct indices.|Require each pair of sides to sum to more than the third.|Count valid triples.',
    '`O(n³)` time.', '`O(1)` auxiliary space.', '''
    class Solution:
        def triangleNumber(self, nums: list[int]) -> int:
            count = 0
            for i in range(len(nums)):
                for j in range(i + 1, len(nums)):
                    for k in range(j + 1, len(nums)):
                        a, b, c = nums[i], nums[j], nums[k]
                        count += a + b > c and a + c > b and b + c > a
            return count
    ''', baseline=True)

add('maximum-average-subarray-i', 'Recompute Every Window',
    'Calculate each length-k window sum independently and keep the largest. This makes the repeated additions removed by a sliding sum visible.',
    'Enumerate valid starting positions.|Sum the next k values.|Return the largest sum divided by k.',
    '`O(nk)` time.', '`O(k)` temporary slicing space.', '''
    class Solution:
        def findMaxAverage(self, nums: list[int], k: int) -> float:
            return max(sum(nums[left:left + k]) for left in range(len(nums) - k + 1)) / k
    ''', baseline=True)

add('two-sum-iv-input-is-a-bst', 'Traversal with Seen Values',
    'Traverse the tree and remember values already encountered. A node forms a pair when its complement was seen at a different earlier node. Checking before insertion preserves the distinct-node rule.',
    'Traverse nodes with a stack.|Before recording a value, check whether target minus value is already present.|Return true on a complement match; otherwise store the value and continue.',
    '`O(n)` expected time with hash lookups.', '`O(n)` for seen values and stack.', '''
    class Solution:
        def findTarget(self, root: Optional[TreeNode], k: int) -> bool:
            stack = [root] if root else []
            seen = set()
            while stack:
                node = stack.pop()
                if k - node.val in seen:
                    return True
                seen.add(node.val)
                stack.extend(child for child in (node.left, node.right) if child)
            return False
    ''', pitfalls=('One node cannot pair with itself.', 'Two distinct nodes with the same value can form a valid pair.'))

add('4-keys-keyboard', 'Memoized Keyboard States',
    'Represent the screen and clipboard contents explicitly. Try typing A, pasting, or spending two presses on select-all and copy. This explores keyboard actions directly instead of using the optimized breakpoint recurrence.',
    'Track remaining presses, screen size, and clipboard size.|Try typing or pasting with one press.|Try select-all plus copy with two presses.|Memoize states and return the largest final screen.',
    'Exponential state growth in the press budget; a conservative action-tree bound is `O(3^n)`.', 'Exponential memo storage and `O(n)` recursion depth; intended for small examples.', '''
    from functools import cache

    class Solution:
        def maxA(self, n: int) -> int:
            @cache
            def solve(left, screen, clipboard):
                if left == 0:
                    return screen
                best = solve(left - 1, screen + 1, clipboard)
                if clipboard:
                    best = max(best, solve(left - 1, screen + clipboard, clipboard))
                if left >= 2 and screen:
                    best = max(best, solve(left - 2, screen, screen))
                return best
            return solve(n, 0, 0)
    ''', baseline=True)

add('add-bold-tag-in-string', 'Find and Merge Match Intervals',
    'Find every word occurrence, including overlapping matches. Merge intervals that overlap or touch, then insert bold tags around each merged span.',
    'Find all occurrences of every dictionary word.|Sort their half-open intervals.|Merge overlapping or adjacent spans.|Copy unbolded gaps and bolded spans in order.',
    '`O(D × N × L + K log K)` as a substring-search upper bound for D words, length N, maximum word length L, and K matches.', '`O(K + N)` including merged intervals and output.', '''
    class Solution:
        def addBoldTag(self, s: str, words: list[str]) -> str:
            intervals = []
            for word in words:
                start = s.find(word)
                while start != -1:
                    intervals.append((start, start + len(word)))
                    start = s.find(word, start + 1)
            merged = []
            for start, end in sorted(intervals):
                if merged and start <= merged[-1][1]:
                    merged[-1][1] = max(merged[-1][1], end)
                else:
                    merged.append([start, end])
            parts, cursor = [], 0
            for start, end in merged:
                parts.extend([s[cursor:start], '<b>', s[start:end], '</b>'])
                cursor = end
            parts.append(s[cursor:])
            return ''.join(parts)
    ''', pitfalls=('Touching matches belong to one bold span.', 'Advance by one after a match so overlapping occurrences are found.'))

add('all-paths-from-source-lead-to-destination', 'Reverse Topological Elimination',
    'Start from the required terminal destination and mark a predecessor safe only after all its outgoing edges lead to already-safe nodes. A reachable bad terminal or cycle prevents the source from becoming safe.',
    'Reject a destination with outgoing edges.|Build reverse edges and outgoing-edge counts.|Queue the terminal destination.|When a safe node is removed, decrement its predecessors\' remaining outgoing counts.|Accept if the source becomes safe.',
    '`O(n + e)` time.', '`O(n + e)` for reverse edges, counts, and queue.', '''
    from collections import deque

    class Solution:
        def leadsToDestination(self, n: int, edges: list[list[int]], source: int, destination: int) -> bool:
            reverse, degree = [[] for _ in range(n)], [0] * n
            for a, b in edges:
                reverse[b].append(a)
                degree[a] += 1
            if degree[destination]:
                return False
            queue, safe = deque([destination]), set()
            while queue:
                node = queue.popleft()
                safe.add(node)
                for parent in reverse[node]:
                    degree[parent] -= 1
                    if degree[parent] == 0:
                        queue.append(parent)
            return source in safe
    ''')

add('analyze-user-website-visit-pattern', 'Enumerate Global Visit Triples',
    'Sort all visits by time and enumerate triples belonging to one user. Associate each three-site sequence with the set of users who followed it; a user counts once even after repeated occurrences.',
    'Sort visit events by timestamp.|Enumerate triples of increasing event positions.|Keep triples belonging to the same user and add that user to the sequence\'s set.|Choose the most-user sequence, breaking ties lexicographically.',
    '`O(N³ + N log N)` time for N visits, with fixed-size website triples.', '`O(N³)` as an upper bound for sequence/user memberships.', '''
    from collections import defaultdict
    from itertools import combinations

    class Solution:
        def mostVisitedPattern(self, username: list[str], timestamp: list[int], website: list[str]) -> list[str]:
            events = sorted(zip(timestamp, username, website))
            users = defaultdict(set)
            for a, b, c in combinations(events, 3):
                if a[1] == b[1] == c[1]:
                    users[(a[2], b[2], c[2])].add(a[1])
            best = min(users, key=lambda pattern: (-len(users[pattern]), pattern))
            return list(best)
    ''', baseline=True)

add('bag-of-tokens', 'Explore Buy and Sell Orders',
    'Try each unused token face up when power permits, and face down when a score point is available. Track the best score at every intermediate state, since the final sale need not improve the answer.',
    'Track used-token bits, remaining power, and score.|Try every legal face-up purchase.|Try every legal face-down sale.|Return the maximum score reached anywhere in the search.',
    '`O(n × 2^n × n!)` as a conservative upper bound on orders and orientations.', '`O(n)` recursion depth.', '''
    class Solution:
        def bagOfTokensScore(self, tokens: list[int], power: int) -> int:
            best = 0
            def visit(used, available, score):
                nonlocal best
                best = max(best, score)
                for i, token in enumerate(tokens):
                    if used & (1 << i):
                        continue
                    if available >= token:
                        visit(used | (1 << i), available - token, score + 1)
                    if score:
                        visit(used | (1 << i), available + token, score - 1)
            visit(0, power, 0)
            return best
    ''', baseline=True)

add('binary-tree-longest-consecutive-sequence-ii', 'Search Consecutive Paths from Each Node',
    'Treat the tree as an undirected graph and start an increasing-by-one path search at every node. A path in the opposite direction is covered when its lower-valued endpoint is chosen as the start.',
    'Build undirected parent-child adjacency.|Start a traversal at each node.|Follow only neighbors whose value is exactly one larger.|Keep the longest path length.',
    '`O(n²)` as an upper bound over all starting nodes.', '`O(n)` for adjacency and traversal.', '''
    class Solution:
        def longestConsecutive(self, root: Optional[TreeNode]) -> int:
            if not root:
                return 0
            adjacency, pending = {}, [root]
            while pending:
                node = pending.pop()
                adjacency.setdefault(node, [])
                for child in (node.left, node.right):
                    if child:
                        adjacency[node].append(child)
                        adjacency.setdefault(child, []).append(node)
                        pending.append(child)
            best = 1
            for start in adjacency:
                stack = [(start, 1)]
                while stack:
                    node, length = stack.pop()
                    best = max(best, length)
                    stack.extend((neighbor, length + 1) for neighbor in adjacency[node] if neighbor.val == node.val + 1)
            return best
    ''', baseline=True)

add('count-substrings-with-only-one-distinct-letter', 'Extend Constant-Letter Substrings',
    'Choose every starting position and extend while characters match the first one. Each successful extension is one valid substring.',
    'Start a substring at each position.|Extend until a different character appears.|Count every valid endpoint.',
    '`O(n²)` time.', '`O(1)` auxiliary space.', '''
    class Solution:
        def countLetters(self, s: str) -> int:
            count = 0
            for left in range(len(s)):
                right = left
                while right < len(s) and s[right] == s[left]:
                    count += 1
                    right += 1
            return count
    ''', baseline=True)

add('delete-n-nodes-after-m-nodes-of-a-linked-list', 'Collect and Filter Node Positions',
    'The keep/delete pattern repeats every m + n original positions. Collect retained node objects according to that pattern, then reconnect them.',
    'Walk the original list with a zero-based position.|Keep nodes whose position modulo m + n is less than m.|Reconnect retained nodes and terminate the final link.',
    '`O(L)` for L list nodes.', '`O(L)` for retained node references.', '''
    class Solution:
        def deleteNodes(self, head: ListNode, m: int, n: int) -> Optional[ListNode]:
            kept, position = [], 0
            while head:
                if position % (m + n) < m:
                    kept.append(head)
                position += 1
                head = head.next
            for i, node in enumerate(kept):
                node.next = kept[i + 1] if i + 1 < len(kept) else None
            return kept[0] if kept else None
    ''')

add('design-snake-game', 'Body List and Linear Collision Checks',
    'Store the snake\'s body from tail to head in a list. A linear membership test detects collisions. On a move without food, the tail leaves before collision checking, so moving into that old tail cell is legal.',
    'Track body cells, food position, and game-over state.|Compute the next head and reject walls.|Remove the tail when not growing.|Reject a collision with the remaining body, then append the head.|Advance food and score only when it is eaten.',
    '`O(L)` per move for body length L, including front removal and collision lookup.', '`O(L)` for body cells.', '''
    class SnakeGame:
        def __init__(self, width: int, height: int, food: list[list[int]]):
            self.width, self.height, self.food = width, height, food
            self.body, self.eaten, self.over = [(0, 0)], 0, False

        def move(self, direction: str) -> int:
            if self.over:
                return -1
            dr, dc = {'U': (-1, 0), 'D': (1, 0), 'L': (0, -1), 'R': (0, 1)}[direction]
            r, c = self.body[-1][0] + dr, self.body[-1][1] + dc
            if not (0 <= r < self.height and 0 <= c < self.width):
                self.over = True
                return -1
            growing = self.eaten < len(self.food) and [r, c] == self.food[self.eaten]
            if not growing:
                self.body.pop(0)
            if (r, c) in self.body:
                self.over = True
                return -1
            self.body.append((r, c))
            self.eaten += growing
            return self.eaten
    ''', pitfalls=('The old tail can be entered on a non-growing move.', 'Repeated moves after game over continue returning -1.'))

add('divide-chocolate', 'Maximin Partition DP',
    'For each suffix and number of pieces, try every next cut. The value of a partition is its least sweet piece; choose cuts maximizing that minimum.',
    'Build prefix sums for constant-time segment sums.|Memoize a suffix start and required piece count.|Try every first cut leaving enough elements for other pieces.|Take the best minimum of the first piece and the suffix solution.',
    '`O(k × n²)` time.', '`O(k × n)` memoization plus `O(k)` recursion depth.', '''
    from functools import cache
    from itertools import accumulate

    class Solution:
        def maximizeSweetness(self, sweetness: list[int], k: int) -> int:
            prefix = [0] + list(accumulate(sweetness))
            @cache
            def solve(start, pieces):
                if pieces == 1:
                    return prefix[-1] - prefix[start]
                return max(min(prefix[end] - prefix[start], solve(end, pieces - 1))
                           for end in range(start + 1, len(sweetness) - pieces + 2))
            return solve(0, k + 1)
    ''')

add('factor-combinations', 'Breadth-First Factor Splitting',
    'A queue stores a chosen nondecreasing prefix and a remaining quotient. Splitting that quotient by a factor no smaller than the prefix\'s last factor emits a combination and a new state without duplicate factor orders.',
    'Start with an empty prefix and quotient n.|Try divisors from the minimum allowed factor through the square root.|Emit prefix, divisor, and quotient/divisor.|Queue the extended prefix with the smaller remaining quotient.',
    '`O(S × sqrt(n) × log n)` as a conservative bound for S visited states including list copies.', '`O(S × log n)` as a conservative bound for queued prefixes and output.', '''
    from collections import deque
    from math import isqrt

    class Solution:
        def getFactors(self, n: int) -> list[list[int]]:
            result = []
            queue = deque([(n, 2, [])])
            while queue:
                remaining, minimum, prefix = queue.popleft()
                for factor in range(minimum, isqrt(remaining) + 1):
                    if remaining % factor == 0:
                        quotient = remaining // factor
                        result.append(prefix + [factor, quotient])
                        queue.append((quotient, factor, prefix + [factor]))
            return result
    ''')

add('find-common-characters', 'Sort and Merge Character Multisets',
    'Sort each word\'s characters and intersect the sorted lists with two pointers. Equal characters consume one occurrence from each side, preserving the minimum multiplicity across all words.',
    'Sort the first word\'s characters.|For each later word, merge-intersect its sorted characters with the current result.|Return the remaining character list.',
    '`O(S log L)` for S total characters and maximum word length L.', '`O(L)` workspace, excluding output.', '''
    class Solution:
        def commonChars(self, words: list[str]) -> list[str]:
            common = sorted(words[0])
            for word in words[1:]:
                chars, merged = sorted(word), []
                i = j = 0
                while i < len(common) and j < len(chars):
                    if common[i] < chars[j]:
                        i += 1
                    elif chars[j] < common[i]:
                        j += 1
                    else:
                        merged.append(common[i])
                        i += 1
                        j += 1
                common = merged
            return common
    ''')

add('find-the-index-of-the-large-integer', 'Linear Reader Comparisons',
    'Compare each singleton with index zero. The unique larger element either exceeds index zero or makes index zero exceed the first ordinary element. This teaching baseline can exceed the reader\'s comparison allowance on large arrays.',
    'Compare singleton i with singleton zero.|Return i for a larger comparison, or zero for a smaller one.|Continue past equal comparisons.',
    '`O(n)` reader calls; the default binary search uses logarithmically many.', '`O(1)` auxiliary space.', '''
    class Solution:
        def getIndex(self, reader: 'ArrayReader') -> int:
            for i in range(1, reader.length()):
                comparison = reader.compareSub(i, i, 0, 0)
                if comparison > 0:
                    return i
                if comparison < 0:
                    return 0
            return 0
    ''', baseline=True)

add('group-shifted-strings', 'Pairwise Shift Checks',
    'Compare a word with one representative from each existing group. Equal-length words belong together when every character is shifted by the same amount modulo 26.',
    'Visit each word.|Compare its length and character shifts with group representatives.|Append it to the first matching group, or start a new group.',
    '`O(n² × L)` for n words of maximum length L.', '`O(n)` group references, excluding the input strings.', '''
    class Solution:
        def groupStrings(self, strings: list[str]) -> list[list[str]]:
            groups = []
            for word in strings:
                for group in groups:
                    other = group[0]
                    if len(word) == len(other):
                        shift = (ord(word[0]) - ord(other[0])) % 26
                        if all((ord(a) - ord(b)) % 26 == shift for a, b in zip(word, other)):
                            group.append(word)
                            break
                else:
                    groups.append([word])
            return groups
    ''', baseline=True)

add('max-stack', 'List and Reverse Maximum Search',
    'Use a list for the ordinary stack operations. Find the maximum by scanning; remove its last occurrence for popMax so ties follow the stack\'s most-recent rule.',
    'Append and remove at the list end for push and pop.|Read the last value for top.|Scan for the maximum.|For popMax, scan backward and remove the first matching maximum.',
    'Amortized `O(1)` push; `O(1)` pop/top; `O(n)` peekMax and popMax.', '`O(n)` for stored values.', '''
    class MaxStack:
        def __init__(self):
            self.values = []

        def push(self, x: int) -> None:
            self.values.append(x)

        def pop(self) -> int:
            return self.values.pop()

        def top(self) -> int:
            return self.values[-1]

        def peekMax(self) -> int:
            return max(self.values)

        def popMax(self) -> int:
            largest = max(self.values)
            for i in range(len(self.values) - 1, -1, -1):
                if self.values[i] == largest:
                    return self.values.pop(i)
    ''')

add('maximum-average-subtree', 'Recompute Subtree Totals',
    'Calculate each subtree\'s sum and node count independently, then compare its average. This baseline exposes repeated traversal avoided by a shared postorder result.',
    'Enumerate subtree roots.|Traverse each subtree to obtain sum and size.|Compare sum divided by size.|Return the largest average.',
    '`O(n²)` in the worst case.', '`O(n)` traversal and recursion space.', '''
    class Solution:
        def maximumAverageSubtree(self, root: Optional[TreeNode]) -> float:
            def measure(node):
                if not node:
                    return 0, 0
                a, na = measure(node.left)
                b, nb = measure(node.right)
                return node.val + a + b, 1 + na + nb
            best = float('-inf')
            stack = [root] if root else []
            while stack:
                node = stack.pop()
                total, size = measure(node)
                best = max(best, total / size)
                stack.extend(child for child in (node.left, node.right) if child)
            return best if root else 0.0
    ''', baseline=True)

add('minimum-cost-to-connect-sticks', 'Explore Every Merge Order',
    'Try every pair as the next merge and recursively solve the smaller multiset. Add the immediate merge cost to the best remaining cost. This checks the greedy choice by exhaustive search on small examples.',
    'Return zero when at most one stick remains.|Choose every pair of sticks.|Replace it with its sum and solve recursively.|Return the minimum total cost across choices.',
    '`O(n × (n!)²)` as a conservative upper bound on pair-choice recursion and copying.', '`O(n²)` for live lists across recursion levels.', '''
    class Solution:
        def connectSticks(self, sticks: list[int]) -> int:
            def solve(values):
                if len(values) < 2:
                    return 0
                best = float('inf')
                for i in range(len(values)):
                    for j in range(i + 1, len(values)):
                        merged = values[i] + values[j]
                        rest = [value for k, value in enumerate(values) if k != i and k != j]
                        best = min(best, merged + solve(rest + [merged]))
                return best
            return solve(sticks)
    ''', baseline=True)

add('minimum-cost-to-hire-k-workers', 'Enumerate Worker Teams',
    'For a fixed team, the smallest legal shared wage-to-quality ratio is the largest required ratio among its members. Enumerate teams and compute that minimum legal team cost.',
    'Enumerate every k-worker subset.|Find its maximum wage/quality requirement.|Multiply that ratio by its total quality.|Keep the cheapest team.',
    '`O(k × C(n, k))` time.', '`O(k)` per candidate team.', '''
    from itertools import combinations

    class Solution:
        def mincostToHireWorkers(self, quality: list[int], wage: list[int], k: int) -> float:
            best = float('inf')
            for team in combinations(range(len(quality)), k):
                ratio = max(wage[i] / quality[i] for i in team)
                best = min(best, ratio * sum(quality[i] for i in team))
            return best
    ''', baseline=True)

add('minimum-difference-between-highest-and-lowest-of-k-scores', 'Enumerate Student Groups',
    'Choose every group of k scores and calculate its range. This supplies a direct comparison with the sorted-window argument.',
    'Enumerate k-score combinations.|Subtract each group\'s minimum from its maximum.|Return the smallest range.',
    '`O(k × C(n, k))` time.', '`O(k)` for a candidate group.', '''
    from itertools import combinations

    class Solution:
        def minimumDifference(self, nums: list[int], k: int) -> int:
            return min(max(group) - min(group) for group in combinations(nums, k))
    ''', baseline=True)

add('minimum-length-of-string-after-deleting-similar-ends', 'Run-Length Deque',
    'Compress the string into character runs. Matching first and last runs can be removed entirely. If only one run remains, it can be removed when it contains at least two characters; a single remaining character cannot be split into disjoint ends.',
    'Build a deque of character/count runs.|While distinct end runs share a character, remove both.|Handle one remaining run by its length.|Otherwise sum the remaining run lengths.',
    '`O(n)` time.', '`O(n)` for character runs.', '''
    from collections import deque
    from itertools import groupby

    class Solution:
        def minimumLength(self, s: str) -> int:
            runs = deque((char, sum(1 for _ in group)) for char, group in groupby(s))
            while len(runs) > 1 and runs[0][0] == runs[-1][0]:
                runs.popleft()
                runs.pop()
            if len(runs) == 1:
                return 1 if runs[0][1] == 1 else 0
            return sum(count for _, count in runs)
    ''')

add('non-decreasing-array', 'Try One Neighbor Replacement',
    'If one value can be repaired, it can be moved to a neighboring boundary value. Try those replacements independently and check the full array rather than committing greedily during the scan.',
    'Accept an already nondecreasing array.|For each index, try replacing it by either existing neighbor\'s value.|Check whether that copy is nondecreasing.|Return true on any valid copy.',
    '`O(n²)` time.', '`O(n)` for each candidate copy.', '''
    class Solution:
        def checkPossibility(self, nums: list[int]) -> bool:
            def ordered(values):
                return all(a <= b for a, b in zip(values, values[1:]))
            if ordered(nums):
                return True
            for i in range(len(nums)):
                for neighbor in [i - 1, i + 1]:
                    if 0 <= neighbor < len(nums):
                        candidate = nums[:]
                        candidate[i] = nums[neighbor]
                        if ordered(candidate):
                            return True
            return False
    ''', baseline=True)

add('number-of-islands-ii', 'Recount Components after Each Addition',
    'After each land insertion, traverse the current land cells to count components from scratch. Duplicate insertions leave the set unchanged. This baseline shows the work saved by incremental union-find.',
    'Add the new position to a land set.|Traverse unseen land cells with four-neighbor searches.|Count the resulting components and append the count.|Repeat for each addition.',
    '`O(p²)` expected time for p additions, since at most p land cells are rescanned each time.', '`O(p)` for land and traversal sets.', '''
    class Solution:
        def numIslands2(self, m: int, n: int, positions: list[list[int]]) -> list[int]:
            land, result = set(), []
            for r, c in positions:
                land.add((r, c))
                seen, count = set(), 0
                for start in land:
                    if start in seen:
                        continue
                    count += 1
                    stack = [start]
                    seen.add(start)
                    while stack:
                        x, y = stack.pop()
                        for neighbor in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
                            if neighbor in land and neighbor not in seen:
                                seen.add(neighbor)
                                stack.append(neighbor)
                result.append(count)
            return result
    ''', baseline=True)

add('one-edit-distance', 'Levenshtein Distance DP',
    'Compute the full insertion/deletion/replacement distance with dynamic programming, then require it to equal exactly one. Equal strings have distance zero and must be rejected.',
    'Initialize distances to an empty prefix.|For equal characters, carry the diagonal value.|Otherwise add one to the best insertion, deletion, or replacement.|Accept only a final distance of one.',
    '`O(nm)` time.', '`O(m)` for rolling rows.', '''
    class Solution:
        def isOneEditDistance(self, s: str, t: str) -> bool:
            previous = list(range(len(t) + 1))
            for i, a in enumerate(s, 1):
                current = [i]
                for j, b in enumerate(t, 1):
                    current.append(previous[j - 1] if a == b else 1 + min(previous[j], current[-1], previous[j - 1]))
                previous = current
            return previous[-1] == 1
    ''')

add('plus-one-linked-list', 'Reverse, Add, and Reverse Back',
    'Reverse the list to reach the least significant digit first. Propagate a carry of one, add a node if every digit overflows, then reverse back to restore forward digit order.',
    'Reverse the links.|Propagate one through the least significant digits.|Append a carry node if needed.|Reverse back and return the head.',
    '`O(n)` time.', '`O(1)` auxiliary space, excluding one possible new node.', '''
    class Solution:
        def plusOne(self, head: ListNode) -> ListNode:
            def reverse(node):
                previous = None
                while node:
                    following = node.next
                    node.next = previous
                    previous, node = node, following
                return previous
            backward = reverse(head)
            current, previous, carry = backward, None, 1
            while current and carry:
                carry, current.val = divmod(current.val + carry, 10)
                previous, current = current, current.next
            if carry:
                previous.next = ListNode(carry)
            return reverse(backward)
    ''')

add('rearrange-string-k-distance-apart', 'Max-Heap with Cooldown Queue',
    'Choose the available character with the largest remaining count, then keep it unavailable until k positions after its use. A cooldown queue tracks release positions; an empty heap before completion means no valid next character exists.',
    'Heapify negative character counts.|Release cooldown characters whose next allowed position has arrived.|Append the most frequent available character.|Queue its remaining copies for position + k.|Fail if no character is available before completion.',
    '`O(n log a)` for alphabet size a.', '`O(a + n)` including output.', '''
    from collections import Counter, deque
    from heapq import heapify, heappop, heappush

    class Solution:
        def rearrangeString(self, s: str, k: int) -> str:
            heap = [(-count, char) for char, count in Counter(s).items()]
            heapify(heap)
            cooldown, result = deque(), []
            for position in range(len(s)):
                while cooldown and cooldown[0][0] <= position:
                    _, count, char = cooldown.popleft()
                    heappush(heap, (count, char))
                if not heap:
                    return ''
                count, char = heappop(heap)
                result.append(char)
                if count + 1 < 0:
                    cooldown.append((position + k, count + 1, char))
            return ''.join(result)
    ''')

add('reverse-words-in-a-string', 'Scan and Prepend Words',
    'Parse words manually and prepend each completed word to the result. This reverses word order while normalizing spaces, and illustrates the copying avoided by split/reverse/join.',
    'Skip spaces and scan each maximal word.|Prepend the word, adding one separator only when needed.|Return the accumulated result.',
    '`O(n²)` worst-case time from repeated string copying.', '`O(n)` output and temporary strings.', '''
    class Solution:
        def reverseWords(self, s: str) -> str:
            result, index = '', 0
            while index < len(s):
                while index < len(s) and s[index] == ' ':
                    index += 1
                start = index
                while index < len(s) and s[index] != ' ':
                    index += 1
                if start < index:
                    result = s[start:index] + (' ' + result if result else '')
            return result
    ''')

add('reverse-words-in-a-string-ii', 'Word Buffer and Copy Back',
    'Use an auxiliary word buffer, reverse the word order, and copy the characters back into the original array. This is a teaching comparison that exceeds the problem\'s constant-extra-space restriction.',
    'Join the character array and split its words.|Reverse the words and join them with one space.|Replace the original array contents with those characters.',
    '`O(n)` time.', '`O(n)` extra space; use the default for the constant-space requirement.', '''
    class Solution:
        def reverseWords(self, s: list[str]) -> None:
            s[:] = list(' '.join(''.join(s).split(' ')[::-1]))
    ''', baseline=True)

add('robot-bounded-in-circle', 'Four-Cycle Simulation',
    'A bounded instruction cycle returns to its original position and direction within four repetitions: a changed direction completes a full orientation cycle in at most four runs. Simulate those runs directly.',
    'Start at the origin facing north.|Execute the instructions four times.|Update direction for turns and position for moves.|Accept exactly when the final position is the origin.',
    '`O(n)` for four repetitions of n instructions.', '`O(1)` auxiliary space.', '''
    class Solution:
        def isRobotBounded(self, instructions: str) -> bool:
            directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
            x = y = direction = 0
            for _ in range(4):
                for instruction in instructions:
                    if instruction == 'L':
                        direction = (direction - 1) % 4
                    elif instruction == 'R':
                        direction = (direction + 1) % 4
                    else:
                        dx, dy = directions[direction]
                        x, y = x + dx, y + dy
            return x == 0 and y == 0
    ''')

add('sentence-similarity', 'Scan Similarity Pairs per Word',
    'For each unequal aligned word pair, scan the supplied pairs for a direct match in either direction. Similarity is not transitive, so no graph reachability is inferred.',
    'Reject different sentence lengths.|Skip equal aligned words.|Scan pairs for a direct match in either order.|Reject any unmatched position.',
    '`O(n × p × L)` as a string-comparison bound for n positions, p pairs, and maximum word length L.', '`O(1)` auxiliary space.', '''
    class Solution:
        def areSentencesSimilar(self, sentence1: list[str], sentence2: list[str], similarPairs: list[list[str]]) -> bool:
            if len(sentence1) != len(sentence2):
                return False
            for a, b in zip(sentence1, sentence2):
                if a != b and not any((a == x and b == y) or (a == y and b == x) for x, y in similarPairs):
                    return False
            return True
    ''', baseline=True)

add('sort-array-by-increasing-frequency', 'Frequency Buckets',
    'Bucket distinct values by their occurrence count. Insert distinct values in descending order so ties inside each frequency bucket already satisfy the required order.',
    'Count occurrences.|Visit distinct values in descending numeric order and place them in count-indexed buckets.|Read buckets from low frequency to high, repeating each value by its count.',
    '`O(n + u log u)` for u distinct values.', '`O(n + u)` including buckets and output.', '''
    from collections import Counter

    class Solution:
        def frequencySort(self, nums: list[int]) -> list[int]:
            counts = Counter(nums)
            buckets = [[] for _ in range(len(nums) + 1)]
            for value in sorted(counts, reverse=True):
                buckets[counts[value]].append(value)
            return [value for frequency, bucket in enumerate(buckets)
                    for value in bucket for _ in range(frequency)]
    ''')

add('the-maze-ii', 'Bellman-Ford on Rolling Stops',
    'Build weighted edges for each possible roll until a wall. Repeatedly relax these edges rather than selecting the smallest unsettled distance with a heap. Passing through the destination does not count unless the ball stops there.',
    'For every open cell, calculate each direction\'s stopping cell and travel distance.|Set only the start distance to zero.|Relax all edges for at most V - 1 rounds, stopping early when unchanged.|Return the destination distance or -1.',
    '`O(V² + V × L)` for V open cells and maximum roll length L, since each cell has at most four edges.', '`O(V)` for edges and distances.', '''
    class Solution:
        def shortestDistance(self, maze: list[list[int]], start: list[int], destination: list[int]) -> int:
            rows, cols = len(maze), len(maze[0])
            cells = [(r, c) for r in range(rows) for c in range(cols) if maze[r][c] == 0]
            edges = []
            for r, c in cells:
                for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
                    x, y, steps = r, c, 0
                    while 0 <= x + dr < rows and 0 <= y + dc < cols and maze[x + dr][y + dc] == 0:
                        x, y, steps = x + dr, y + dc, steps + 1
                    if steps:
                        edges.append(((r, c), (x, y), steps))
            distance = {cell: float('inf') for cell in cells}
            distance[tuple(start)] = 0
            for _ in range(len(cells) - 1):
                changed = False
                for a, b, steps in edges:
                    if distance[a] + steps < distance[b]:
                        distance[b] = distance[a] + steps
                        changed = True
                if not changed:
                    break
            result = distance[tuple(destination)]
            return -1 if result == float('inf') else result
    ''', baseline=True)

add('the-maze-iii', 'Scan-Based Dijkstra',
    'Maintain the best distance and instruction string for each reached stopping cell. Select the smallest unvisited pair with a linear scan instead of a heap. Rolling stops immediately if the hole is crossed.',
    'Seed the start with distance zero and an empty path.|Linearly select the smallest unvisited distance/path pair.|Return its path when the selected cell is the hole.|Roll in each direction, stopping at walls or the hole.|Update a cell for a shorter distance or lexicographically smaller tied path.',
    '`O(V² × P + V × L)` as an upper bound for V open cells, path-string length P, and maximum roll length L.', '`O(V × P)` including stored instruction strings.', '''
    class Solution:
        def findShortestWay(self, maze: list[list[int]], ball: list[int], hole: list[int]) -> str:
            rows, cols = len(maze), len(maze[0])
            target = tuple(hole)
            best, visited = {tuple(ball): (0, '')}, set()
            while True:
                available = [cell for cell in best if cell not in visited]
                if not available:
                    return 'impossible'
                cell = min(available, key=lambda cell: best[cell])
                distance, path = best[cell]
                if cell == target:
                    return path
                visited.add(cell)
                for dr, dc, letter in [(1, 0, 'd'), (0, -1, 'l'), (0, 1, 'r'), (-1, 0, 'u')]:
                    x, y, steps = cell[0], cell[1], 0
                    while 0 <= x + dr < rows and 0 <= y + dc < cols and maze[x + dr][y + dc] == 0:
                        x, y, steps = x + dr, y + dc, steps + 1
                        if (x, y) == target:
                            break
                    candidate = (distance + steps, path + letter)
                    if steps and candidate < best.get((x, y), (float('inf'), '')):
                        best[(x, y)] = candidate
    ''')

add('ugly-number', 'Generate Ugly Numbers in Order',
    'Generate numbers with prime factors two, three, and five in increasing order. Stop when the smallest generated value reaches or passes the query. This compares generation with the default factor-stripping test.',
    'Reject nonpositive input.|Start a min-heap and seen set with one.|Pop the smallest value and insert unseen multiples of two, three, and five.|Accept if the popped value equals n; reject once it exceeds n.',
    '`O(U log U)` heap operations for U ugly numbers generated through n.', '`O(U)` for generated candidates.', '''
    from heapq import heappop, heappush

    class Solution:
        def isUgly(self, n: int) -> bool:
            if n <= 0:
                return False
            heap, seen = [1], {1}
            while heap:
                value = heappop(heap)
                if value >= n:
                    return value == n
                for prime in (2, 3, 5):
                    candidate = value * prime
                    if candidate not in seen:
                        seen.add(candidate)
                        heappush(heap, candidate)
            return False
    ''')

add('valid-word-abbreviation', 'Compile a Fixed-Length Pattern',
    'Translate each numeric abbreviation token into a fixed number of wildcard characters and keep letters literal. A full regular-expression match enforces that the whole word is consumed.',
    'Scan letters and decimal skip counts.|Reject leading zeros and skips longer than the whole word.|Compile skips as fixed-length wildcard groups and escape literal letters.|Require a full match.',
    '`O(n + m)` under the bounded word/abbreviation lengths, with fixed-size wildcard groups and no variable-length alternatives.', '`O(m)` for pattern pieces.', '''
    import re

    class Solution:
        def validWordAbbreviation(self, word: str, abbr: str) -> bool:
            pieces, i = [], 0
            while i < len(abbr):
                if abbr[i].isdigit():
                    if abbr[i] == '0':
                        return False
                    start = i
                    while i < len(abbr) and abbr[i].isdigit():
                        i += 1
                    count = int(abbr[start:i])
                    if count > len(word):
                        return False
                    pieces.append('.{' + str(count) + '}')
                else:
                    pieces.append(re.escape(abbr[i]))
                    i += 1
            return re.fullmatch(''.join(pieces), word) is not None
    ''', pitfalls=('A numeric token cannot begin with zero.', 'Full matching prevents accepting an abbreviation for only a prefix.'))

add('can-place-flowers', 'Two-State Planting DP',
    'Track the best number of new flowers after each position, with separate states for whether the previous position is occupied. This considers skip and plant choices explicitly instead of committing greedily.',
    'Start before the bed with the previous position empty.|An existing flower can follow only an empty state.|At an empty position, either skip or plant after an empty state.|Keep the best count per resulting occupancy and compare with n.',
    '`O(L)` for L positions.', '`O(1)` for two occupancy states.', '''
    class Solution:
        def canPlaceFlowers(self, flowerbed: list[int], n: int) -> bool:
            states = {False: 0}
            for flower in flowerbed:
                following = {}
                for occupied, count in states.items():
                    if flower:
                        if not occupied:
                            following[True] = max(following.get(True, -1), count)
                    else:
                        following[False] = max(following.get(False, -1), count)
                        if not occupied:
                            following[True] = max(following.get(True, -1), count + 1)
                states = following
            return max(states.values(), default=-1) >= n
    ''')

add('design-underground-system', 'Store Trips and Query Averages',
    'Keep each completed trip duration rather than an aggregate total and count. Queries scan the matching route\'s durations and calculate their average, providing a data-storage comparison with constant-time aggregate queries.',
    'Store active check-ins by customer ID.|On checkout, append the completed duration to its route list and remove the active entry.|Calculate a requested route\'s average from its stored durations.',
    'Expected `O(1)` check-in/checkout; `O(T)` average query for T trips on that route.', '`O(A + C)` for active check-ins and all completed trips.', '''
    from collections import defaultdict

    class UndergroundSystem:
        def __init__(self):
            self.active = {}
            self.trips = defaultdict(list)

        def checkIn(self, id: int, stationName: str, t: int) -> None:
            self.active[id] = (stationName, t)

        def checkOut(self, id: int, stationName: str, t: int) -> None:
            start, time = self.active.pop(id)
            self.trips[(start, stationName)].append(t - time)

        def getAverageTime(self, startStation: str, endStation: str) -> float:
            durations = self.trips[(startStation, endStation)]
            return sum(durations) / len(durations)
    ''')

add('lemonade-change', 'Explore Change Inventories',
    'Retain all reachable inventories of five- and ten-dollar bills after each customer. For a twenty-dollar payment, try both a ten plus a five and three fives rather than choosing greedily.',
    'Start with no change.|For a five, add one five to every inventory.|For a ten, require and spend one five.|For a twenty, explore both legal change combinations.|Reject when no inventory remains reachable.',
    '`O(n³)` as a conservative bound from n steps and at most `O(n²)` inventory states.', '`O(n²)` for reachable inventories.', '''
    class Solution:
        def lemonadeChange(self, bills: list[int]) -> bool:
            states = {(0, 0)}
            for bill in bills:
                following = set()
                for fives, tens in states:
                    if bill == 5:
                        following.add((fives + 1, tens))
                    elif bill == 10 and fives:
                        following.add((fives - 1, tens + 1))
                    elif bill == 20:
                        if fives and tens:
                            following.add((fives - 1, tens - 1))
                        if fives >= 3:
                            following.add((fives - 3, tens))
                states = following
                if not states:
                    return False
            return True
    ''', baseline=True)
