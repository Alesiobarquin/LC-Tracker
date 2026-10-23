"""Reviewed notes and AI-assisted alternatives for the next catalog batch.

Default Python/C++ and named source alternatives come from the pinned walkccc
checkout. Inline alternatives and all explanations were authored for LC Tracker
with AI assistance, then checked against the independent behavioral fixtures.
"""
from textwrap import dedent

CONTENT = {}


def note(name, insight, steps, time, space, code=None, *, filename=None,
         baseline=False, pitfalls=()):
    item = dict(approach=name, insight=insight, steps=steps.split('|'),
                time=time, space=space, baseline=baseline, pitfalls=list(pitfalls))
    if code is not None:
        item['python'] = dedent(code).strip() + '\n'
    if filename:
        item['filename'] = filename
    return item


def add(number, default, alternative, *, variant=None):
    assert number not in CONTENT
    CONTENT[number] = dict(default=default, alternative=alternative, variant=variant)


add(29,
    note('Repeated Doubling',
         'Subtract the largest doubled divisor that fits in the remaining dividend. Each subtraction contributes the matching power of two to the quotient. Work with positive magnitudes and apply the sign at the end.',
         'Handle the signed 32-bit overflow case.|Double the divisor and its quotient contribution until another doubling would be too large.|Subtract that chunk and repeat.|Apply the sign, truncating toward zero.',
         'O(log² A) for dividend magnitude A, with a fresh doubling search per chunk.', 'O(1) auxiliary space under 32-bit input bounds.',
         pitfalls=('Use shifts rather than multiplication, division, or modulo.', 'Widen C++ magnitudes before negating INT_MIN.')),
    note('Descending Bit Scan',
         'Try quotient bits from most significant to least significant. A shifted divisor either fits in the remaining magnitude, setting that quotient bit, or is skipped.',
         'Take absolute magnitudes and determine the result sign.|Scan shifts 31 down to zero.|Subtract a shifted divisor whenever it fits and set the corresponding quotient bit.|Apply the sign and clamp the one positive overflow case.',
         'O(32) shifted-divisor comparisons.', 'O(1) under the signed 32-bit bounds.', r'''
         class Solution:
             def divide(self, dividend: int, divisor: int) -> int:
                 negative = (dividend < 0) != (divisor < 0)
                 remaining, base = abs(dividend), abs(divisor)
                 quotient = 0
                 for bit in range(31, -1, -1):
                     if base << bit <= remaining:
                         remaining -= base << bit
                         quotient |= 1 << bit
                 if negative:
                     quotient = -quotient
                 return min(quotient, (1 << 31) - 1)
         '''))

add(117,
    note('Link the Next Level In Place',
         'Once a level is connected, its next pointers provide a traversal without a queue. Append its children to a temporary dummy-headed chain, then move down to that chain.',
         'Start at the root level.|Follow existing next pointers and append each left then right child to the next-level chain.|Move to the dummy node\'s first child.|Repeat until no children remain.',
         'O(n) for n nodes.', 'O(1) auxiliary space.',
         pitfalls=('The input next pointers initially contain null.', 'Skip absent children without creating gaps in the chain.')),
    note('Breadth-First Queue',
         'All nodes currently in the queue belong to one level. Link them in queue order and enqueue their children for the next level.',
         'Enqueue the root when present.|Process exactly the current queue length.|Link each node to its predecessor and enqueue existing children.|Terminate the last next pointer on every level.',
         'O(n) for n nodes.', 'O(w) for maximum level width w.', r'''
         from collections import deque

         class Solution:
             def connect(self, root: 'Node') -> 'Node':
                 queue = deque([root] if root else [])
                 while queue:
                     previous = None
                     for _ in range(len(queue)):
                         node = queue.popleft()
                         if previous:
                             previous.next = node
                         previous = node
                         if node.left:
                             queue.append(node.left)
                         if node.right:
                             queue.append(node.right)
                     previous.next = None
                 return root
         '''))

add(156,
    note('Recursive Left-Spine Rotation',
         'The leftmost node becomes the new root. As recursion unwinds, each former left child takes its old sibling as its left child and its old parent as its right child.',
         'Stop at an empty node or a node without a left child.|Recursively rotate the left subtree.|Attach the old right child and parent beneath the old left child.|Clear the old parent links and return the new root.',
         'O(h) for the left-spine length h.', 'O(h) recursion space.',
         pitfalls=('The problem guarantees that every right child is a leaf with a left sibling.', 'Clear the original links to avoid cycles.')),
    note('Iterative Spine Rewiring',
         'Walk down the original left spine while remembering the previous parent and its right child. These become the current node\'s new right and left children.',
         'Remember the next original left node.|Replace the current left pointer with the previous right sibling.|Save the original right child and link the current right pointer to the previous parent.|Advance and return the final visited node.',
         'O(h) for the left-spine length h.', 'O(1) auxiliary space.', filename='156-2.py'))

add(164,
    note('Minimum-Gap Buckets',
         'The largest adjacent sorted gap is at least the ceiling of the total range divided by n − 1. Buckets of that width cannot contain the winning larger gap internally, so only nonempty bucket boundaries need comparison.',
         'Handle fewer than two values and an all-equal range.|Allocate at most n buckets using the minimum possible maximum gap as their width.|Record each bucket\'s minimum and maximum.|Compare each nonempty minimum with the previous nonempty maximum.',
         'O(n) for n values.', 'O(n) for buckets.'),
    note('Sort and Compare Neighbors',
         'Sorting makes every candidate gap explicit. The largest difference between adjacent sorted values is the answer.',
         'Sort the values.|Compute each consecutive difference.|Return the largest difference, or zero for a single value.',
         'O(n log n).', 'O(n) for the sorted copy and sorting workspace.', r'''
         class Solution:
             def maximumGap(self, nums: list[int]) -> int:
                 ordered = sorted(nums)
                 return max((b - a for a, b in zip(ordered, ordered[1:])), default=0)
         '''))

add(170,
    note('Frequency Map',
         'Store the frequency of each inserted number. A query looks for a complementary value; pairing a value with itself requires two occurrences.',
         'Increment the inserted number\'s count.|For each distinct value during find, calculate its complement.|Accept distinct complementary values or a repeated value with count at least two.',
         'Expected O(1) per add and O(u) per find for u distinct numbers.', 'O(u) stored counts.'),
    note('Precomputed Pair Sums',
         'Pay for pair formation during insertion so queries become set lookups. Form sums with previously inserted values before adding the new value, preserving the requirement for two insertions.',
         'Keep a set of inserted values and a set of achievable sums.|On add, combine the new value with every previously seen value.|Insert the value after forming sums.|Answer find by membership in the sum set.',
         'Expected O(u) per add and O(1) per find.', 'O(u²) possible pair sums.', r'''
         class TwoSum:
             def __init__(self):
                 self.values = set()
                 self.sums = set()

             def add(self, number: int) -> None:
                 for value in self.values:
                     self.sums.add(number + value)
                 self.values.add(number)

             def find(self, value: int) -> bool:
                 return value in self.sums
         '''))

add(243,
    note('Latest Occurrence Scan',
         'When either target word appears, its closest preceding occurrence of the other target is the most recently seen one. Keep only those two indices.',
         'Initialize both target positions as unseen.|Update the appropriate position when a target appears.|Compare the current index to the latest opposite target.|Keep the smallest distance.',
         'O(n) word comparisons.', 'O(1) auxiliary space.'),
    note('Occurrence Lists and Two Pointers',
         'Collect the sorted positions of each target. Advancing the smaller position is sufficient because keeping it while moving the larger position can only increase their distance.',
         'Collect both target index lists.|Compare their current positions.|Advance the pointer at the smaller position.|Return the minimum difference encountered.',
         'O(n) word comparisons.', 'O(n) for occurrence lists.', r'''
         class Solution:
             def shortestDistance(self, wordsDict: list[str], word1: str, word2: str) -> int:
                 left = [i for i, word in enumerate(wordsDict) if word == word1]
                 right = [i for i, word in enumerate(wordsDict) if word == word2]
                 i = j = 0
                 best = len(wordsDict)
                 while i < len(left) and j < len(right):
                     best = min(best, abs(left[i] - right[j]))
                     if left[i] < right[j]:
                         i += 1
                     else:
                         j += 1
                 return best
         '''))

add(244,
    note('Indexed Occurrences with Two Pointers',
         'Preprocessing groups word positions in increasing order. Each query merges the two relevant position lists, moving whichever current index is smaller.',
         'Build a position list for every word.|Start at the first occurrence in each queried list.|Record the distance and advance the smaller index.|Stop when one list is exhausted.',
         'O(n) preprocessing; O(a + b) per query for occurrence counts a and b.', 'O(n) stored positions; O(1) query workspace.'),
    note('Binary Search Each Occurrence',
         'For each position in the shorter occurrence list, binary-search the other list. Only the insertion point and its predecessor can be closest.',
         'Build sorted position lists.|Use the shorter list as the query driver.|Binary-search each position in the longer list.|Compare the two neighboring candidate positions.',
         'O(n) preprocessing; O(min(a, b) log(max(a, b) + 1)) per query.', 'O(n) stored positions; O(1) query workspace.', r'''
         from bisect import bisect_left
         from collections import defaultdict

         class WordDistance:
             def __init__(self, wordsDict: list[str]):
                 self.positions = defaultdict(list)
                 for i, word in enumerate(wordsDict):
                     self.positions[word].append(i)

             def shortest(self, word1: str, word2: str) -> int:
                 a, b = self.positions[word1], self.positions[word2]
                 if len(a) > len(b):
                     a, b = b, a
                 best = float('inf')
                 for position in a:
                     j = bisect_left(b, position)
                     if j < len(b):
                         best = min(best, b[j] - position)
                     if j:
                         best = min(best, position - b[j - 1])
                 return best
         '''))

add(245,
    note('Single Pass with Equal-Word Handling',
         'For different targets, track the newest index of each. If the targets are equal, compare each occurrence with the previous occurrence rather than with itself.',
         'Detect whether the target words are equal.|Update the newest matching index on each visit.|For equal targets, shift the old newest index into the previous slot.|Minimize the distance between valid target indices.',
         'O(n) word comparisons.', 'O(1) auxiliary space.'),
    note('Collected Target Positions',
         'Separate preprocessing makes the equal-word rule explicit: consecutive positions are the only candidates for identical targets, while two sorted lists handle distinct targets.',
         'Collect positions of both target words.|For identical targets, compare adjacent occurrences.|Otherwise merge the two lists with pointers.|Return the smallest valid distance.',
         'O(n) word comparisons.', 'O(n) for positions.', r'''
         class Solution:
             def shortestWordDistance(self, wordsDict: list[str], word1: str, word2: str) -> int:
                 a = [i for i, word in enumerate(wordsDict) if word == word1]
                 if word1 == word2:
                     return min(y - x for x, y in zip(a, a[1:]))
                 b = [i for i, word in enumerate(wordsDict) if word == word2]
                 i = j = 0
                 best = len(wordsDict)
                 while i < len(a) and j < len(b):
                     best = min(best, abs(a[i] - b[j]))
                     if a[i] < b[j]:
                         i += 1
                     else:
                         j += 1
                 return best
         '''))

add(246,
    note('Rotational Two Pointers',
         'A 180-degree rotation reverses digit order and maps 6 to 9 and 9 to 6, while 0, 1, and 8 remain unchanged. Compare mirrored digits under that mapping.',
         'Place pointers at both ends.|Reject a digit without a rotational partner.|Compare the left digit with the rotated right digit.|Move inward, including the middle digit.',
         'O(n) for n digits.', 'O(1) auxiliary space.'),
    note('Construct the Rotated String',
         'Build the entire rotated representation by mapping the reversed digits. The number is strobogrammatic precisely when this constructed text equals the original.',
         'Reject digits outside 0, 1, 6, 8, and 9.|Reverse the digit sequence and map each digit.|Join the mapped digits and compare with the original text.',
         'O(n).', 'O(n) for the rotated representation.', r'''
         class Solution:
             def isStrobogrammatic(self, num: str) -> bool:
                 rotation = {'0': '0', '1': '1', '6': '9', '8': '8', '9': '6'}
                 if any(digit not in rotation for digit in num):
                     return False
                 return ''.join(rotation[digit] for digit in reversed(num)) == num
         '''))

add(251,
    note('Eager Flattening',
         'Copy all row contents into one array during construction. Iteration then needs only one index, and empty rows disappear naturally.',
         'Append every row into a flat array.|Keep an index for the next unread item.|Return and advance on next.|Compare the index with the flat array length on hasNext.',
         'O(N + r) construction for N values and r rows; O(1) per operation.', 'O(N) copied values.'),
    note('Lazy Row and Column Cursors',
         'Keep the original rows and advance across empty or exhausted rows only when needed. This avoids copying the contents.',
         'Store the input and two cursor indices.|Normalize the cursor by skipping exhausted rows.|On next, read the current item and advance the column.|Let repeated hasNext calls preserve the same unread item.',
         'O(1) construction; O(N + r) total traversal, with O(r) worst-case for one skip.', 'O(1) auxiliary space, retaining the input.', r'''
         class Vector2D:
             def __init__(self, vec: list[list[int]]):
                 self.rows = vec
                 self.row = self.column = 0

             def hasNext(self) -> bool:
                 while self.row < len(self.rows) and self.column == len(self.rows[self.row]):
                     self.row += 1
                     self.column = 0
                 return self.row < len(self.rows)

             def next(self) -> int:
                 if not self.hasNext():
                     raise StopIteration
                 value = self.rows[self.row][self.column]
                 self.column += 1
                 return value
         '''))

add(267,
    note('Unique Half-Permutation Backtracking',
         'A palindrome is determined by its left half and optional odd-count middle character. Backtrack over half the character multiset, skipping repeated choices at the same depth, then mirror each completed half.',
         'Reject more than one odd character count.|Group half of each character\'s occurrences as candidates.|Generate distinct permutations with used flags and duplicate skipping.|Mirror each half around the optional middle.',
         'O(n × h!) upper bound for n characters and h = floor(n/2), including output construction.', 'O(n) workspace, excluding returned palindromes.'),
    note('Count-Driven Half Construction',
         'Choose the next half-character directly from its remaining frequency instead of selecting individual copies. Equal copies never create separate branches.',
         'Count characters and identify the middle character.|Halve the counts.|Recursively choose any character with a remaining half-count.|Mirror completed halves and restore counts while backtracking.',
         'O(n × h!) upper bound, with duplicate branches avoided by counts.', 'O(n) workspace, excluding output.', r'''
         from collections import Counter

         class Solution:
             def generatePalindromes(self, s: str) -> list[str]:
                 counts = Counter(s)
                 odd = [c for c in counts if counts[c] % 2]
                 if len(odd) > 1:
                     return []
                 middle = ''.join(odd)
                 for c in counts:
                     counts[c] //= 2
                 result, path = [], []
                 def build():
                     if len(path) == len(s) // 2:
                         half = ''.join(path)
                         result.append(half + middle + half[::-1])
                         return
                     for c in counts:
                         if counts[c]:
                             counts[c] -= 1
                             path.append(c)
                             build()
                             path.pop()
                             counts[c] += 1
                 build()
                 return result
         '''))

add(288,
    note('Abbreviation Uniqueness Flags',
         'Deduplicate dictionary words first. Each abbreviation is unique until a second distinct word claims it. Queries are valid when the abbreviation is absent or belongs uniquely to that exact word.',
         'Create the set of distinct dictionary words.|Mark each abbreviation unique on its first encounter and ambiguous thereafter.|Build the query abbreviation.|Accept an unused abbreviation or its sole dictionary owner.',
         'O(D) preprocessing and O(L) per query, including string hashing, for total dictionary text D and query length L.', 'O(D) for dictionary and abbreviation keys.',
         pitfalls=('Repeated copies of one dictionary word do not create ambiguity.', 'A third owner must never turn an ambiguous abbreviation back into a unique one.')),
    note('Sets of Abbreviation Owners',
         'Store the actual distinct owners for every abbreviation. A query succeeds only when that owner set is empty or contains exactly the queried word.',
         'Map each abbreviation to a set of dictionary words.|Use the unchanged word as its abbreviation when its length is at most two.|For a query, inspect the associated owner set.|Accept an empty set or the singleton containing the query.',
         'O(D) preprocessing and O(L) per query, including string hashing.', 'O(D) for owner sets and keys.', r'''
         from collections import defaultdict

         class ValidWordAbbr:
             def __init__(self, dictionary: list[str]):
                 self.owners = defaultdict(set)
                 for word in dictionary:
                     self.owners[self._abbr(word)].add(word)

             def _abbr(self, word):
                 return word if len(word) <= 2 else word[0] + str(len(word) - 2) + word[-1]

             def isUnique(self, word: str) -> bool:
                 owners = self.owners.get(self._abbr(word), set())
                 return not owners or owners == {word}
         '''))

add(291,
    note('Bijection Backtracking',
         'Assign each pattern character a nonempty substring. Existing assignments must match at the current text position, while a set prevents two different characters from sharing a substring.',
         'Track the pattern and text positions plus both assignment structures.|Match an already assigned character using a prefix check.|For a new character, try every nonempty next substring not already used.|Undo failed assignments and accept only simultaneous exhaustion.',
         'O((n + m) × (n + 1)^m) loose upper bound for text length n and pattern length m.', 'O(n + m) live mapping and recursion space.',
         pitfalls=('A reused mapping must match at the current offset, not elsewhere in the remaining text.',)) ,
    note('Enumerate Mapping Lengths',
         'Each distinct pattern character has one fixed mapped length. Its occurrence count determines that length\'s contribution to the full text size. Enumerate feasible lengths first, then validate the actual substrings and bijection.',
         'Count each distinct pattern character.|Assign positive lengths whose weighted total equals the text length.|Split the text according to those lengths in pattern order.|Check repeated assignments and reject shared substrings between different characters.',
         'O((n + m) × n^k) loose upper bound for k distinct pattern characters.', 'O(n + m) live state.', r'''
         from collections import Counter

         class Solution:
             def wordPatternMatch(self, pattern: str, s: str) -> bool:
                 counts = Counter(pattern)
                 chars = list(counts)
                 lengths = {}
                 def validate():
                     mapping, used = {}, set()
                     position = 0
                     for char in pattern:
                         text = s[position:position + lengths[char]]
                         position += lengths[char]
                         if char in mapping:
                             if mapping[char] != text:
                                 return False
                         elif text in used:
                             return False
                         else:
                             mapping[char] = text
                             used.add(text)
                     return position == len(s)
                 def choose(i, remaining):
                     if i == len(chars):
                         return remaining == 0 and validate()
                     char = chars[i]
                     reserve = sum(counts[c] for c in chars[i + 1:])
                     for length in range(1, (remaining - reserve) // counts[char] + 1):
                         lengths[char] = length
                         if choose(i + 1, remaining - length * counts[char]):
                             return True
                     return False
                 return choose(0, len(s))
         ''', baseline=True))

add(294,
    note('Memoized Game States',
         'A position is winning if one legal flip leaves the opponent a losing position. Cache each explored string so repeated move orders do not recompute the same state.',
         'Return a cached outcome when available.|Try replacing every adjacent ++ with --.|Win as soon as one resulting state is losing.|Cache false when no winning move exists.',
         'O(n² × 2^n) loose upper bound including string construction and hashing.', 'O(n × 2^n) upper bound for cached strings.',
         pitfalls=('A move replaces both plus signs and preserves string length.',)) ,
    note('Independent Runs and Grundy Numbers',
         'Minus signs separate independent runs of plus signs. Flipping two adjacent plus signs splits one run into two smaller runs. The mex of their XOR values gives that run\'s Grundy number; XOR all runs to determine whether the whole position is winning.',
         'Split the state into plus runs.|Build Grundy numbers for all run lengths up to the longest run.|For each possible flip, XOR the two remaining run values and take the smallest missing nonnegative result.|XOR the actual run values; nonzero means a winning state.',
         'O(n²) for state length n.', 'O(n) for Grundy values and reachable outcomes.', r'''
         class Solution:
             def canWin(self, currentState: str) -> bool:
                 runs = [len(run) for run in currentState.split('-')]
                 grundy = [0] * (max(runs, default=0) + 1)
                 for length in range(2, len(grundy)):
                     reachable = {grundy[left] ^ grundy[length - left - 2]
                                  for left in range(length - 1)}
                     value = 0
                     while value in reachable:
                         value += 1
                     grundy[length] = value
                 total = 0
                 for length in runs:
                     total ^= grundy[length]
                 return total != 0
         '''))

add(306,
    note('Choose Two Numbers, Match Sums',
         'The first two numbers determine every later number. Enumerate valid initial splits and recursively match each decimal sum against the next text prefix.',
         'Try nonempty first and second numbers while leaving room for their sum.|Reject multi-digit numbers with a leading zero.|Match the next exact sum and advance the pair.|Accept when the sequence consumes the entire text.',
         'O(n³) conservative bound on decimal-character work.', 'O(n²) conservative bound for live recursive decimal strings and integers.',
         pitfalls=('The sequence must contain at least three numbers.', 'The C++ numeric bounds rely on the 35-digit limit and initial-split length checks.')),
    note('Backtrack Over All Next Numbers',
         'Parse a sequence one number at a time. Before two numbers exist, every valid next substring is possible; afterward, prune candidates below the required sum and stop once they exceed it.',
         'Extend the next numeric substring digit by digit.|Stop a multi-digit candidate that begins with zero.|After the first two values, require the sum of the last pair.|Backtrack until at least three numbers consume the entire text.',
         'O(n³) conservative decimal-operation bound.', 'O(n) stored sequence values in a conservative O(n²)-bit bound.', r'''
         class Solution:
             def isAdditiveNumber(self, num: str) -> bool:
                 sequence = []
                 def search(start):
                     if start == len(num):
                         return len(sequence) >= 3
                     value = 0
                     for end in range(start, len(num)):
                         if end > start and num[start] == '0':
                             break
                         value = value * 10 + int(num[end])
                         if len(sequence) >= 2:
                             expected = sequence[-2] + sequence[-1]
                             if value < expected:
                                 continue
                             if value > expected:
                                 break
                         sequence.append(value)
                         if search(end + 1):
                             return True
                         sequence.pop()
                     return False
                 return search(0)
         '''))

add(308,
    note('Two-Dimensional Fenwick Tree',
         'A 2D Fenwick tree supports point deltas and rectangle-prefix sums. Store the current cell values so an assignment can be converted into a delta, then use four prefix queries for an inclusive rectangle.',
         'Build a Fenwick tree by adding every initial cell.|On update, add the difference from the stored value.|Compute a rectangle-prefix sum by walking decreasing low bits in both dimensions.|Combine four prefixes using inclusion-exclusion.',
         'O(mn log m log n) construction; O(log m log n) per update or query.', 'O(mn) for matrix and Fenwick storage.'),
    note('Per-Row Prefix Sums',
         'Each row has its own prefix array. A point assignment changes the suffix of only that row; a rectangle query sums one prefix difference from each included row.',
         'Copy the matrix and build row prefixes.|Convert an update to a delta and adjust that row\'s later prefixes.|For a rectangle, add the requested column-range sum from each included row.',
         'O(mn) construction; O(n) per update and O(m) per rectangle query.', 'O(mn) for copied cells and row prefixes.', r'''
         class NumMatrix:
             def __init__(self, matrix: list[list[int]]):
                 self.matrix = [row[:] for row in matrix]
                 self.prefix = []
                 for row in matrix:
                     sums = [0]
                     for value in row:
                         sums.append(sums[-1] + value)
                     self.prefix.append(sums)

             def update(self, row: int, col: int, val: int) -> None:
                 delta = val - self.matrix[row][col]
                 self.matrix[row][col] = val
                 for j in range(col + 1, len(self.prefix[row])):
                     self.prefix[row][j] += delta

             def sumRegion(self, row1: int, col1: int, row2: int, col2: int) -> int:
                 return sum(self.prefix[i][col2 + 1] - self.prefix[i][col1]
                            for i in range(row1, row2 + 1))
         '''))

add(320,
    note('Backtracking with a Pending Count',
         'Each character can be kept or abbreviated. Accumulate consecutive abbreviated characters as a count and emit that count only when keeping a character or finishing the word.',
         'Branch at each position between abbreviation and keeping the letter.|Increase the pending count on abbreviation.|Flush the count before a kept letter.|Flush any final count when recording an answer.',
         'O(n × 2^n), including all output strings.', 'O(n) workspace, excluding output.'),
    note('Enumerate Abbreviation Masks',
         'A bitmask explicitly chooses which positions are abbreviated. Scan each mask to merge consecutive selected positions into a single decimal count.',
         'Enumerate all 2^n masks.|Scan the word and count consecutive selected positions.|Flush each count before an unselected letter.|Append the final count and record the abbreviation.',
         'O(n × 2^n).', 'O(n) temporary space, excluding output.', r'''
         class Solution:
             def generateAbbreviations(self, word: str) -> list[str]:
                 result = []
                 for mask in range(1 << len(word)):
                     pieces, count = [], 0
                     for i, char in enumerate(word):
                         if mask & (1 << i):
                             count += 1
                         else:
                             if count:
                                 pieces.append(str(count))
                                 count = 0
                             pieces.append(char)
                     if count:
                         pieces.append(str(count))
                     result.append(''.join(pieces))
                 return result
         '''))

add(324,
    note('Quickselect and Virtual-Index Partition',
         'Select a median and apply three-way partitioning through virtual indices that visit odd positions before even positions. Large values occupy peaks, small values occupy valleys, and median values fill the middle.',
         'Quickselect the median value.|Map logical index i to (1 + 2i) modulo (n | 1).|Partition values greater than, equal to, and less than the median through that mapping.|Reuse the original array for the strict wiggle arrangement.',
         'Expected O(n); O(n²) worst case for quickselect.', 'O(1) auxiliary space with iterative three-way Python quickselect.',
         pitfalls=('The problem guarantees that a strict wiggle arrangement exists.', 'Do not advance the scan after swapping in an unclassified value from the end.')),
    note('Sorted Reversed Halves',
         'Sort the values, then place the lower half in decreasing order into even positions and the upper half in decreasing order into odd positions. Reversal separates repeated median values when a strict arrangement exists.',
         'Sort a copy of the array.|Split after ceiling(n/2) values.|Assign the reversed lower half to even indices.|Assign the reversed upper half to odd indices.',
         'O(n log n).', 'O(n) for the sorted copy and slices.', r'''
         class Solution:
             def wiggleSort(self, nums: list[int]) -> None:
                 ordered = sorted(nums)
                 middle = (len(nums) + 1) // 2
                 nums[::2] = ordered[:middle][::-1]
                 nums[1::2] = ordered[middle:][::-1]
         '''))

add(339,
    note('Breadth-First Depth Weighting',
         'Process nested values one depth at a time. Multiply integers by the current level and enqueue the contents of lists for the next level.',
         'Enqueue the top-level NestedInteger values.|Increment depth for each queue level.|Add depth times every encountered integer.|Enqueue child lists without increasing depth inside the same level.',
         'O(N) for N integers and list containers.', 'O(w) for maximum nested-level width w.'),
    note('Recursive Depth Weighting',
         'Carry the current depth through recursion. Integers contribute their value times depth, while a nested list is visited at depth plus one.',
         'Begin at depth one.|Add weighted integers.|Recurse into nested lists with the next depth.|Accumulate all contributions.',
         'O(N).', 'O(d) recursion space for maximum nesting depth d.', filename='339-2.py'))

add(351,
    note('Symmetry-Reduced Pattern Search',
         'A move is legal when its destination is unused and any intermediate key has already been visited. Corner starts are symmetric, as are edge starts, so only one representative from each group needs exploration.',
         'Record the required midpoint for moves crossing another key.|Backtrack over unvisited destinations whose midpoint is already visited or absent.|Count prefixes with lengths between m and n.|Multiply one corner and one edge result by four, then add the center result.',
         'O(sum of 9!/(9 − k)! for k from 1 to n), a fixed nine-key search.', 'O(1) bounded storage for nine keys and recursion.'),
    note('Bitmask Dynamic Programming',
         'A visited-key mask and current endpoint completely describe legal future moves. Memoize the number of valid continuations, computing midpoint legality from the 3×3 coordinates.',
         'Represent each key by a bit and a grid coordinate.|Memoize states of endpoint and visited mask.|Count the current pattern when its length is in range.|Extend to each unused key unless an unvisited midpoint blocks the move.',
         'O(9² × 2^9) for the fixed keypad.', 'O(9 × 2^9) memoized states.', r'''
         from functools import cache

         class Solution:
             def numberOfPatterns(self, m: int, n: int) -> int:
                 @cache
                 def count(last, mask):
                     length = mask.bit_count()
                     total = int(m <= length <= n)
                     if length == n:
                         return total
                     x, y = divmod(last, 3)
                     for nxt in range(9):
                         if mask & (1 << nxt):
                             continue
                         a, b = divmod(nxt, 3)
                         if (x + a) % 2 == 0 and (y + b) % 2 == 0:
                             midpoint = ((x + a) // 2) * 3 + (y + b) // 2
                             if not mask & (1 << midpoint):
                                 continue
                         total += count(nxt, mask | (1 << nxt))
                     return total
                 return sum(count(start, 1 << start) for start in range(9))
         '''))

add(356,
    note('Global Reflection Axis and Point Set',
         'The vertical reflection axis must lie halfway between the minimum and maximum x coordinates. Every point must have its reflected partner at the same y coordinate.',
         'Find the minimum and maximum x coordinates.|Store distinct points in a hash set.|Reflect x as minX + maxX − x.|Require every reflected point to exist.',
         'Expected O(n).', 'O(n) distinct points.',
         pitfalls=('Repeated copies of a point do not alter the geometric point set.',)) ,
    note('Sorted Horizontal Rows',
         'Group points by y coordinate and deduplicate each row. Every row must be symmetric about the same global axis, which can be checked by pairing its smallest and largest x values.',
         'Compute the global sum of extreme x coordinates.|Group distinct x values by y.|Sort each row.|Check that every mirrored pair has the global x sum.',
         'O(n log n).', 'O(n) for grouped coordinates.', r'''
         from collections import defaultdict

         class Solution:
             def isReflected(self, points: list[list[int]]) -> bool:
                 rows = defaultdict(set)
                 for x, y in points:
                     rows[y].add(x)
                 axis_sum = min(x for x, _ in points) + max(x for x, _ in points)
                 for row in rows.values():
                     xs = sorted(row)
                     if any(a + b != axis_sum for a, b in zip(xs, reversed(xs))):
                         return False
                 return True
         '''))

add(359,
    note('Expiring Queue and Active Set',
         'Keep only messages printed within the last ten seconds. Ordered timestamps allow expired queue entries to be removed from both the queue and the membership set.',
         'Remove printed messages whose timestamps are at least ten seconds old.|Reject a message still in the active set.|Otherwise append its timestamp and add it to the set.',
         'Expected amortized O(1) per call; a single call may remove O(w) entries.', 'O(w) active messages within the ten-second window.',
         pitfalls=('Timestamps arrive in nondecreasing order.', 'A rejected message does not extend its suppression window.')),
    note('Next-Allowed Timestamp Map',
         'Store the earliest timestamp when each message may be printed again. This removes expiry processing in exchange for retaining entries for old messages.',
         'Look up the message\'s next allowed timestamp.|Reject an earlier timestamp.|On success, replace the allowed time with timestamp + 10.',
         'Expected O(1) per call.', 'O(u) for all distinct messages seen.', filename='359-2.py'))

add(364,
    note('Cumulative Breadth-First Sums',
         'Add the sum of all integers seen so far after every level. An integer at depth d is added once for each remaining level, giving weight maxDepth − d + 1 without knowing the maximum depth in advance.',
         'Enqueue the top-level values.|Accumulate integers into a running unweighted sum.|Enqueue child contents.|After each level, add the running sum to the answer.',
         'O(N) for nested entries.', 'O(w) for maximum level width.',
         pitfalls=('Empty nested lists are excluded by this problem\'s input constraints.',)) ,
    note('Depth Records and Final Reweighting',
         'Record each integer with its depth and find the deepest integer. A final pass applies the inverse depth weight directly.',
         'Traverse nested values with explicit depth records.|Store each integer and update the maximum depth.|Sum value × (maxDepth − depth + 1).',
         'O(N).', 'O(N) for pending values and integer records.', r'''
         class Solution:
             def depthSumInverse(self, nestedList: list['NestedInteger']) -> int:
                 stack = [(item, 1) for item in nestedList]
                 integers = []
                 deepest = 1
                 while stack:
                     item, depth = stack.pop()
                     if item.isInteger():
                         integers.append((item.getInteger(), depth))
                         deepest = max(deepest, depth)
                     else:
                         stack.extend((child, depth + 1) for child in item.getList())
                 return sum(value * (deepest - depth + 1) for value, depth in integers)
         '''))

add(372,
    note('Left-to-Right Decimal Exponent Fold',
         'Appending digit d to an exponent changes e into 10e + d. Update the modular result as result^10 × a^d, reducing modulo 1337.',
         'Start the result at one.|Read exponent digits from left to right.|Raise the previous result to ten modulo 1337.|Multiply by the base raised to the current digit and reduce.',
         'O(d) bounded-modulus operations for d exponent digits.', 'O(1) auxiliary space.'),
    note('Right-to-Left Decimal Place Powers',
         'Treat the exponent as a sum of digit × decimal-place values. Scan from the least significant digit while repeatedly raising the base power to ten.',
         'Reduce the base modulo 1337.|Visit exponent digits in reverse.|Multiply the result by the current place power raised to that digit.|Raise the place power to ten for the next digit.',
         'O(d) bounded-modulus operations.', 'O(1) auxiliary space.', r'''
         class Solution:
             def superPow(self, a: int, b: list[int]) -> int:
                 result, power = 1, a % 1337
                 for digit in reversed(b):
                     result = result * pow(power, digit, 1337) % 1337
                     power = pow(power, 10, 1337)
                 return result
         '''))

add(379,
    note('Array-Backed Free List',
         'The array stores the next available number, while −1 marks an allocated number. Allocation removes the head of the free list and release inserts a number back at its head.',
         'Initialize a circular chain of available numbers.|On get, remove the current free head and mark it allocated.|Check availability using the marker.|Release an allocated number by linking it before the current head.',
         'O(N) construction; O(1) per operation for N phone numbers.', 'O(N) for the free-list array.'),
    note('Available-Number Set',
         'Keep the available numbers directly in a set. Any available number may be returned, so set removal is enough for allocation.',
         'Initialize the set with all valid numbers.|Pop an arbitrary number on get, or return −1 when empty.|Check set membership.|Release by adding the number back.',
         'O(N) construction; expected O(1) per operation.', 'O(N) for available numbers.', r'''
         class PhoneDirectory:
             def __init__(self, maxNumbers: int):
                 self.available = set(range(maxNumbers))

             def get(self) -> int:
                 return self.available.pop() if self.available else -1

             def check(self, number: int) -> bool:
                 return number in self.available

             def release(self, number: int) -> None:
                 self.available.add(number)
         '''))

add(388,
    note('Ancestor Length Stack',
         'Tab depth identifies the current entry\'s parent. Maintain cumulative directory lengths on a stack, removing entries at the same or deeper depth before processing the next name.',
         'Split the input into entries and count leading tabs.|Pop directories that cannot be the current parent.|For a file, update the maximum parent-length plus filename-length.|For a directory, push its cumulative length including a slash.',
         'O(L) for input text length L.', 'O(L) including split entries; O(d) stack for depth d.'),
    note('Depth-Indexed Prefix Lengths',
         'Store the cumulative directory length for each depth. Later entries overwrite obsolete values, so parent lookup needs no stack popping.',
         'Keep the empty root prefix at depth zero.|Extract each entry\'s leading-tab depth.|Use that depth\'s prefix to calculate the full path length.|Update the next-depth directory prefix or the longest file path.',
         'O(L).', 'O(L) including split entries and depth prefixes.', r'''
         class Solution:
             def lengthLongestPath(self, input: str) -> int:
                 prefixes = {0: 0}
                 best = 0
                 for entry in input.split('\n'):
                     name = entry.lstrip('\t')
                     depth = len(entry) - len(name)
                     length = prefixes[depth] + len(name)
                     if '.' in name:
                         best = max(best, length)
                     else:
                         prefixes[depth + 1] = length + 1
                 return best
         '''))

add(390,
    note('Reflected Elimination Recurrence',
         'The first left-to-right pass keeps the even numbers. The next reversed pass corresponds to reflecting the smaller problem\'s survivor, then scaling it by two.',
         'Return one for a single remaining number.|Solve the half-sized elimination problem recursively.|Reflect that survivor within the half-size sequence.|Multiply by two to restore the original even-number positions.',
         'O(log n).', 'O(log n) recursion space.'),
    note('Track Head, Step, and Direction',
         'The remaining numbers always form an arithmetic progression. Track its first value and spacing; a left-to-right pass always changes the first value, while a right-to-left pass does so only for an odd remaining count.',
         'Start with head one, spacing one, and left-to-right direction.|Advance the head for a left pass or an odd-sized right pass.|Halve the count and double the spacing.|Reverse direction until one value remains.',
         'O(log n).', 'O(1) auxiliary space.', r'''
         class Solution:
             def lastRemaining(self, n: int) -> int:
                 head, step, left = 1, 1, True
                 while n > 1:
                     if left or n % 2:
                         head += step
                     n //= 2
                     step *= 2
                     left = not left
                 return head
         '''))

add(400,
    note('Skip Fixed-Digit Blocks',
         'There are 9 one-digit numbers, 90 two-digit numbers, and so on. Remove entire digit blocks until the desired position falls inside one, then locate its number and digit.',
         'Track the block\'s digit width, first number, and count.|Subtract complete blocks before the target.|Locate the target number with a zero-based offset.|Extract its requested decimal digit.',
         'O(log n) bounded-integer operations.', 'O(1) auxiliary space.'),
    note('Binary Search the Containing Number',
         'The total number of digits written through integer x is monotone. Binary-search the first x whose cumulative digit count reaches n, then index into that number.',
         'Count digits through a candidate number by decimal blocks.|Binary-search the smallest candidate reaching position n.|Count digits before that number.|Select the target character at the remaining offset.',
         'O(log² n) bounded-integer operations.', 'O(log n) for the final decimal representation.', r'''
         class Solution:
             def findNthDigit(self, n: int) -> int:
                 def count_through(value):
                     total, start, width = 0, 1, 1
                     while start <= value:
                         total += (min(value, start * 10 - 1) - start + 1) * width
                         start *= 10
                         width += 1
                     return total
                 low, high = 1, n
                 while low < high:
                     middle = (low + high) // 2
                     if count_through(middle) >= n:
                         high = middle
                     else:
                         low = middle + 1
                 offset = n - count_through(low - 1) - 1
                 return int(str(low)[offset])
         '''))

add(401,
    note('Choose Illuminated LEDs',
         'Backtrack over the ten LED positions, adding each chosen LED\'s hour or minute weight. Reject combinations as soon as hours or minutes exceed their valid ranges.',
         'Associate four LEDs with hour weights and six with minute weights.|Choose remaining LEDs in increasing index order.|Prune hours at least 12 and minutes at least 60.|Format every valid completed selection with two minute digits.',
         'O(10 × C(10, k)) upper bound for k illuminated LEDs; fixed domain.', 'O(k) recursion space, excluding output.'),
    note('Enumerate Valid Times',
         'Only 720 valid clock times exist. Count the set bits in each hour and minute and retain times using the requested number of LEDs.',
         'Enumerate hours 0 through 11 and minutes 0 through 59.|Add their set-bit counts.|Format matching times with a zero-padded minute.',
         'O(12 × 60), a constant-sized search.', 'O(1) workspace, excluding output.', filename='401-2.py'))

add(405,
    note('Low-Nibble Extraction',
         'Normalize a negative input to its unsigned 32-bit representation, then repeatedly read the low four bits and shift them away. Reverse the collected hexadecimal digits.',
         'Return zero for input zero.|Add 2^32 to a negative Python input.|Map each low nibble to a hexadecimal digit.|Shift right four bits and reverse the digit sequence.',
         'O(8) for the 32-bit domain.', 'O(8) output and temporary digits.'),
    note('High-to-Low Nibble Scan',
         'Scan all eight 4-bit groups from the most significant end. Skip leading zero groups, then emit each remaining nibble.',
         'Mask to 32 bits.|Visit shifts 28, 24, …, 0.|Start output at the first nonzero nibble.|Return zero if every nibble was zero.',
         'O(8) for the 32-bit domain.', 'O(8) output and temporary digits.', r'''
         class Solution:
             def toHex(self, num: int) -> str:
                 value = num & 0xffffffff
                 digits, result = '0123456789abcdef', []
                 for shift in range(28, -1, -4):
                     nibble = (value >> shift) & 15
                     if nibble or result:
                         result.append(digits[nibble])
                 return ''.join(result) or '0'
         '''))

add(418,
    note('Cyclic Sentence Cursor',
         'Join the sentence with spaces and repeat it conceptually. For each row, advance by the column count, then adjust to a word boundary. Complete traversals of the joined text count fitted sentences.',
         'Create a space-terminated sentence string.|Advance the cursor by cols for each row.|Move past a boundary space or backtrack to the last whole-word boundary.|Divide the final cursor by the sentence length.',
         'O(L + r × w) for joined length L, rows r, and maximum word length w.', 'O(L) for the joined sentence.'),
    note('Precomputed Row Transitions',
         'A row\'s effect depends only on which sentence word starts it. Precompute the next starting word and the number of complete sentences for every possible start, then process rows using those transitions.',
         'For every starting word, greedily fit complete words into one row.|Record the next word index and wraps through the sentence.|Apply the recorded transition once per row.|Sum the recorded completed sentences.',
         'O(k × (cols + 1) + rows) upper bound for k sentence words.', 'O(k) transition storage.', r'''
         class Solution:
             def wordsTyping(self, sentence: list[str], rows: int, cols: int) -> int:
                 size = len(sentence)
                 transitions = []
                 for start in range(size):
                     used = count = 0
                     while used + len(sentence[(start + count) % size]) <= cols:
                         used += len(sentence[(start + count) % size]) + 1
                         count += 1
                     transitions.append(((start + count) % size, (start + count) // size))
                 index = total = 0
                 for _ in range(rows):
                     index, completed = transitions[index]
                     total += completed
                 return total
         '''))

add(421,
    note('Greedy XOR Prefixes',
         'Build the maximum XOR from its highest bit downward. A candidate prefix is feasible when two masked input prefixes XOR to it; a set allows that partner check.',
         'Find the highest significant input bit.|Extend the prefix mask one bit at a time.|Tentatively set the corresponding result bit.|Keep it when some pair of masked prefixes produces the candidate.',
         'Expected O(n × b) for n values and b significant bits.', 'O(n) masked prefixes.'),
    note('Binary Trie',
         'Store prior numbers as bit paths. When querying a number, prefer the opposite bit at each level to maximize the most significant remaining XOR bit.',
         'Create a trie spanning the maximum bit width.|Query each number against the previously inserted paths.|Prefer opposite-bit children, falling back to equal bits.|Insert the number and update the best XOR.',
         'O(n × b).', 'O(n × b) trie nodes.', filename='421-2.py'))

add(423,
    note('Unique-Letter Count Equations',
         'Some digits have identifying letters: z, w, u, x, and g identify zero, two, four, six, and eight. Subtract their contributions to resolve the remaining digit counts.',
         'Count identifying letters in the input.|Resolve digits 0, 2, 4, 6, and 8 directly.|Subtract known contributions to derive 1, 3, 5, 7, and 9.|Emit the digits in increasing order.',
         'O(n) for n letters.', 'O(1) counts, excluding output.'),
    note('Ordered Word-Multiset Elimination',
         'Remove whole digit words from a character multiset in an order where each selected word has an identifying letter among the remaining words.',
         'Count every letter.|Process zero, two, four, six, eight, one, three, five, seven, and nine.|Use each word\'s identifying-letter count as its multiplicity and subtract all its letters.|Emit the recorded digits in sorted order.',
         'O(n) with ten fixed digit words.', 'O(1) counts, excluding output.', r'''
         from collections import Counter

         class Solution:
             def originalDigits(self, s: str) -> str:
                 remaining = Counter(s)
                 result = [0] * 10
                 order = [(0, 'zero', 'z'), (2, 'two', 'w'), (4, 'four', 'u'),
                          (6, 'six', 'x'), (8, 'eight', 'g'), (1, 'one', 'o'),
                          (3, 'three', 'h'), (5, 'five', 'f'), (7, 'seven', 's'),
                          (9, 'nine', 'i')]
                 for digit, word, key in order:
                     result[digit] = remaining[key]
                     for char in word:
                         remaining[char] -= result[digit]
                 return ''.join(str(digit) * count for digit, count in enumerate(result))
         '''))

add(444,
    note('Unique Topological Order',
         'Consecutive values in each subsequence form directed edges. A unique reconstruction requires exactly one available zero-indegree value at every topological-sort step, matching the next original value.',
         'Validate and record all observed values and subsequence edges.|Initialize the zero-indegree queue.|Reject ambiguity whenever more than one value is available.|Require every popped value to match the original sequence and consume all values.',
         'O(n + S) for n original values and S total subsequence entries.', 'O(n + S) for the graph and indegrees.',
         pitfalls=('Every original value must appear in the supplied sequences.',)) ,
    note('Adjacent-Pair Coverage',
         'Every subsequence must respect the original order. Once that holds, the reconstruction is unique precisely when each adjacent pair of original values is explicitly constrained somewhere.',
         'Map each original value to its position.|Reject unknown values and nonincreasing subsequence positions.|Record original adjacent pairs that appear consecutively in a subsequence.|Require all values and all n − 1 adjacent pairs to be covered.',
         'Expected O(n + S).', 'O(n) for positions and coverage sets.', r'''
         class Solution:
             def sequenceReconstruction(self, nums: list[int], sequences: list[list[int]]) -> bool:
                 positions = {value: i for i, value in enumerate(nums)}
                 seen, edges = set(), set()
                 for sequence in sequences:
                     for value in sequence:
                         if value not in positions:
                             return False
                         seen.add(value)
                     for a, b in zip(sequence, sequence[1:]):
                         if positions[a] >= positions[b]:
                             return False
                         if positions[b] == positions[a] + 1:
                             edges.add((a, b))
                 return len(seen) == len(nums) and len(edges) == len(nums) - 1
         '''))

add(449,
    note('Preorder with BST Bounds',
         'Preorder values alone describe a BST when the valid value range is carried through reconstruction. Consume the next value only if it fits the current subtree\'s bounds.',
         'Serialize the root before its left and right subtrees.|Parse serialized values into a queue.|Build a subtree only when the next value lies within its bounds.|Tighten the bounds around each accepted root value.',
         'O(n) node visits, plus decimal text processing.', 'O(n) for serialized values and O(h) recursion.',
         pitfalls=('This problem uses distinct BST values.',)) ,
    note('Explicit Null-Marker Preorder',
         'Include a marker for every missing child. This general binary-tree encoding reconstructs structure directly and does not depend on the BST ordering invariant.',
         'Serialize each value followed by its left and right subtree encodings.|Write # for missing nodes.|Read one token at a time during reconstruction.|Build children recursively unless the token is #.',
         'O(n) node visits, plus text processing.', 'O(n) tokens and O(h) recursion.', r'''
         class Codec:
             def serialize(self, root: 'TreeNode') -> str:
                 tokens = []
                 def visit(node):
                     if node is None:
                         tokens.append('#')
                     else:
                         tokens.append(str(node.val))
                         visit(node.left)
                         visit(node.right)
                 visit(root)
                 return ','.join(tokens)

             def deserialize(self, data: str) -> 'TreeNode':
                 tokens = iter(data.split(','))
                 def build():
                     token = next(tokens)
                     if token == '#':
                         return None
                     node = TreeNode(int(token))
                     node.left = build()
                     node.right = build()
                     return node
                 return build()
         '''))

add(457,
    note('Floyd Cycles with Processed-Path Marking',
         'A valid cycle must keep one direction and contain more than one index. Use slow and fast pointers under that direction constraint, then mark an unsuccessful path with zeros so later starts skip it.',
         'Start from each unprocessed index.|Advance slow and fast pointers only through values with the starting sign.|Accept a meeting only when it is not a self-loop.|Mark the unsuccessful same-direction path as processed.',
         'O(n) total path processing.', 'O(1) auxiliary space; mutates the input.'),
    note('Per-Start Visited Indices',
         'Follow each possible start while recording the first step at which each index appears. A repeated index gives a cycle, whose length must exceed one; mixed-direction paths are abandoned.',
         'Choose a starting direction.|Follow modular next indices while signs agree.|Record the step number for every visited index.|Accept a repeat with a cycle length greater than one.',
         'O(n²) worst case.', 'O(n) per-start visited indices.', r'''
         class Solution:
             def circularArrayLoop(self, nums: list[int]) -> bool:
                 for start in range(len(nums)):
                     positive = nums[start] > 0
                     seen = {}
                     index = start
                     while (nums[index] > 0) == positive:
                         if index in seen:
                             if len(seen) - seen[index] > 1:
                                 return True
                             break
                         seen[index] = len(seen)
                         index = (index + nums[index]) % len(nums)
                 return False
         ''', baseline=True))

add(464,
    note('Memoized Used-Number Masks',
         'The set of chosen numbers determines the remaining target and future moves. A player wins if choosing one available number makes the opponent lose, with immediate target attainment treated as an opponent loss.',
         'Handle a nonpositive target and an unreachable total sum.|Memoize states of remaining target and used-number mask.|Try every unused number.|Return true when one choice leaves a losing state.',
         'O(k × 2^k) for k choosable numbers.', 'O(2^k) cached states.'),
    note('Bottom-Up Subset Game Table',
         'Process used-number masks in descending numeric order, so every possible next mask already has an outcome. Compute the used sum incrementally and evaluate legal winning moves.',
         'Reject an unreachable target and accept a nonpositive target.|Precompute each mask\'s selected sum.|Visit masks from largest to smallest.|Win if an unused number reaches the target or moves to a losing mask.',
         'O(k × 2^k).', 'O(2^k) for subset sums and outcomes.', r'''
         class Solution:
             def canIWin(self, maxChoosableInteger: int, desiredTotal: int) -> bool:
                 if desiredTotal <= 0:
                     return True
                 k = maxChoosableInteger
                 if k * (k + 1) // 2 < desiredTotal:
                     return False
                 size = 1 << k
                 sums = [0] * size
                 for mask in range(1, size):
                     bit = mask & -mask
                     sums[mask] = sums[mask ^ bit] + bit.bit_length()
                 winning = bytearray(size)
                 for mask in range(size - 1, -1, -1):
                     if sums[mask] >= desiredTotal:
                         continue
                     for i in range(k):
                         bit = 1 << i
                         if not mask & bit and (sums[mask] + i + 1 >= desiredTotal or not winning[mask | bit]):
                             winning[mask] = 1
                             break
                 return bool(winning[0])
         '''))

add(468,
    note('Split and Validate Address Groups',
         'IPv4 requires four bounded decimal groups without leading zeros. IPv6 requires eight groups of one to four hexadecimal characters; compressed notation is outside this problem\'s accepted format.',
         'Use separator counts to choose a candidate address family.|Validate every IPv4 group\'s digits, length, leading zero, and value.|Validate every IPv6 group\'s length and hexadecimal characters.|Return Neither when neither complete format matches.',
         'O(n) for address length n.', 'O(n) for split groups.'),
    note('Full-String Regular Expressions',
         'Encode each allowed group as a regular-expression fragment and require the whole input to match exactly. The IPv4 fragment separately represents one-digit, two-digit, and bounded three-digit values.',
         'Define a decimal group for values zero through 255 without extra leading zeros.|Repeat it four times with literal dots.|Define an IPv6 group of one to four hexadecimal characters.|Require a full match against either complete pattern.',
         'O(n) for these fixed, bounded-group patterns.', 'O(1) pattern storage and bounded matching state.', r'''
         import re

         class Solution:
             def validIPAddress(self, queryIP: str) -> str:
                 decimal = r'(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])'
                 if re.fullmatch(decimal + r'(?:\.' + decimal + r'){3}', queryIP):
                     return 'IPv4'
                 hexadecimal = r'[0-9a-fA-F]{1,4}'
                 if re.fullmatch(hexadecimal + r'(?::' + hexadecimal + r'){7}', queryIP):
                     return 'IPv6'
                 return 'Neither'
         '''))

add(469,
    note('Consistent Consecutive Cross Products',
         'For the guaranteed simple polygon, convexity means every noncollinear turn has the same orientation. Cross products reveal left and right turns without floating-point slopes.',
         'Visit each cyclic triple of consecutive vertices.|Compute the cross product of its two edges.|Ignore zero cross products.|Reject any nonzero sign change.',
         'O(n).', 'O(1) auxiliary space.',
         pitfalls=('The input vertices form a simple polygon in boundary order.', 'Collinear boundary vertices do not force rejection.')),
    note('Every Edge Supports One Half-Plane',
         'A convex polygon lies entirely on one side of each of its directed edges. Check all other vertices against every edge and reject an edge seeing points on both sides.',
         'Choose each cyclic edge.|Compute cross products from that edge to every vertex.|Ignore collinear points.|Reject an edge with both positive and negative cross products.',
         'O(n²).', 'O(1) auxiliary space.', r'''
         class Solution:
             def isConvex(self, points: list[list[int]]) -> bool:
                 for i, (x, y) in enumerate(points):
                     a, b = points[(i + 1) % len(points)]
                     sign = 0
                     for c, d in points:
                         cross = (a - x) * (d - y) - (b - y) * (c - x)
                         if cross:
                             current = 1 if cross > 0 else -1
                             if sign and sign != current:
                                 return False
                             sign = current
                 return True
         ''', baseline=True))

add(481,
    note('Self-Describing Run Expansion',
         'Start from 122. Subsequent digits specify the lengths of alternating runs of ones and twos. Expand each indicated run and count ones in the requested prefix.',
         'Seed the sequence with 122.|Read later sequence digits as run lengths.|Alternate which digit is appended.|Count ones among the first n generated digits.',
         'O(n).', 'O(n) generated digits.'),
    note('Queued Run-Length Stream',
         'Keep only the unread run-length digits in a queue. Each generated digit becomes a future instruction, while a separate count tracks ones inside the requested prefix.',
         'Handle prefixes ending within the initial 122.|Seed the next unread instruction with two.|Pop a run length and append that many copies of the next alternating digit.|Count only generated positions at most n.',
         'O(n).', 'O(n) pending run lengths.', r'''
         from collections import deque

         class Solution:
             def magicalString(self, n: int) -> int:
                 if n <= 3:
                     return int(n > 0)
                 pending = deque([2])
                 produced, ones, digit = 3, 1, 1
                 while produced < n:
                     count = pending.popleft()
                     for _ in range(count):
                         pending.append(digit)
                         produced += 1
                         if produced <= n and digit == 1:
                             ones += 1
                     digit = 3 - digit
                 return ones
         '''))

add(482,
    note('Build Groups from the Right',
         'Every group except the first must have exactly k characters. Scanning backward makes each full group immediate while naturally leaving a shorter initial group.',
         'Skip existing dashes while scanning backward.|Insert a new dash before each next group of k characters.|Uppercase letters as they are collected.|Reverse the completed characters.',
         'O(n).', 'O(n) for output characters.'),
    note('Clean Then Slice Groups',
         'Remove dashes first and compute the first group length from the cleaned length modulo k. Every later group is a fixed-width slice.',
         'Remove dashes and uppercase the text.|Calculate the first group width, using k when divisible.|Slice the remaining groups in widths of k.|Join groups with dashes.',
         'O(n).', 'O(n) cleaned text and group slices.', r'''
         class Solution:
             def licenseKeyFormatting(self, s: str, k: int) -> str:
                 text = s.replace('-', '').upper()
                 if not text:
                     return ''
                 first = len(text) % k or k
                 groups = [text[:first]]
                 groups.extend(text[i:i + k] for i in range(first, len(text), k))
                 return '-'.join(groups)
         '''))

add(495,
    note('Cap Each Consecutive Gap',
         'Before the next attack, the current poison contributes at most duration seconds and at most the gap to that next attack. The final attack contributes its full duration.',
         'Handle zero duration.|Sum the smaller of each consecutive timestamp gap and duration.|Add duration for the final attack.',
         'O(n) for n attacks.', 'O(1) auxiliary space.'),
    note('Union Poison Intervals',
         'Treat each attack as the half-open interval [time, time + duration). Maintain the union length while extending the end of the current poisoned interval.',
         'Keep the end of the poison union processed so far.|For each attack, start newly counted time after both its timestamp and the previous end.|Add only its uncovered suffix.|Advance the ending timestamp.',
         'O(n).', 'O(1) auxiliary space.', r'''
         class Solution:
             def findPoisonedDuration(self, timeSeries: list[int], duration: int) -> int:
                 total, end = 0, 0
                 for time in timeSeries:
                     finish = time + duration
                     total += max(0, finish - max(time, end))
                     end = max(end, finish)
                 return total
         '''))

add(500,
    note('Keyboard Row Sets',
         'A word uses one keyboard row when the set of its lowercase letters is a subset of one row\'s character set.',
         'Create the three keyboard-row sets.|Lowercase and deduplicate each word\'s letters.|Keep the original word if one row contains its entire letter set.',
         'O(L) for total input characters L.', 'O(w) temporary space for maximum word length w, bounded by the alphabet, excluding output.'),
    note('Letter-to-Row Lookup',
         'Assign every keyboard letter its row number. A word is valid when each letter has the same row number as its first letter.',
         'Build a lookup from lowercase letter to keyboard row.|Read the first letter\'s row for each word.|Check every remaining letter against that row.|Preserve the original spelling in output.',
         'O(L).', 'O(1) fixed alphabet lookup, excluding output.', r'''
         class Solution:
             def findWords(self, words: list[str]) -> list[str]:
                 row_of = {char: i for i, row in enumerate(['qwertyuiop', 'asdfghjkl', 'zxcvbnm']) for char in row}
                 return [word for word in words
                         if all(row_of[char.lower()] == row_of[word[0].lower()] for char in word)]
         '''))

add(501,
    note('Inorder Equal-Value Runs',
         'BST inorder traversal groups equal values consecutively. Track the current run length and the largest run, replacing or extending the mode list as needed.',
         'Traverse left subtree, node, then right subtree.|Increment the run when the previous value matches; otherwise reset it.|Replace the mode list on a new maximum.|Append on a tied maximum.',
         'O(n).', 'O(h) recursion space, excluding returned modes.'),
    note('Value Frequency Counting',
         'Count values during a general tree traversal and return every value attaining the maximum count. This also works without the BST ordering property.',
         'Traverse with an explicit stack.|Count every visited value.|Find the largest frequency.|Return all values with that frequency.',
         'Expected O(n).', 'O(n) for counts and traversal stack.', r'''
         from collections import Counter

         class Solution:
             def findMode(self, root: 'TreeNode') -> list[int]:
                 counts = Counter()
                 stack = [root] if root else []
                 while stack:
                     node = stack.pop()
                     counts[node.val] += 1
                     if node.left:
                         stack.append(node.left)
                     if node.right:
                         stack.append(node.right)
                 highest = max(counts.values(), default=0)
                 return [value for value, count in counts.items() if count == highest]
         '''))

add(507,
    note('Perfect Numbers Within the Input Bound',
         'For the stated positive input bound of 10^8, the only perfect numbers are 6, 28, 496, 8128, and 33550336. Membership in this fixed list answers the bounded problem.',
         'Use the five perfect numbers within the allowed range.|Check whether the input belongs to that fixed set.',
         'O(1) for the specified bound.', 'O(1) fixed lookup.',
         pitfalls=('This lookup depends on the 10^8 input bound and is not a general perfect-number algorithm.',)) ,
    note('Sum Proper Divisor Pairs',
         'Divisors come in pairs around the square root. Add both members of each pair, counting a square root once, and compare the sum of proper divisors to the input.',
         'Reject one.|Start the proper-divisor sum at one.|Test divisors from two through the integer square root.|Add each divisor and its distinct partner, then compare with num.',
         'O(sqrt(num)).', 'O(1) auxiliary space.', r'''
         from math import isqrt

         class Solution:
             def checkPerfectNumber(self, num: int) -> bool:
                 if num <= 1:
                     return False
                 total = 1
                 for divisor in range(2, isqrt(num) + 1):
                     if num % divisor == 0:
                         total += divisor
                         if divisor != num // divisor:
                             total += num // divisor
                 return total == num
         '''))

add(520,
    note('Whole-Word Case Predicates',
         'The allowed capitalization forms are all uppercase, all lowercase, or one uppercase initial followed by lowercase letters. Python\'s case predicates express those three alternatives directly.',
         'Check all uppercase.|Check all lowercase.|Check title case.|Accept if any allowed form holds.',
         'O(n).', 'O(1) auxiliary space for ASCII-letter input.'),
    note('Count Uppercase Positions',
         'The uppercase count must be zero, the full word length, or exactly one at the first position.',
         'Count ASCII uppercase letters.|Accept zero or all uppercase.|Otherwise accept exactly one uppercase letter when it is the first character.',
         'O(n).', 'O(1) auxiliary space.', r'''
         class Solution:
             def detectCapitalUse(self, word: str) -> bool:
                 uppercase = sum('A' <= char <= 'Z' for char in word)
                 return uppercase == 0 or uppercase == len(word) or (uppercase == 1 and 'A' <= word[0] <= 'Z')
         '''))

add(522,
    note('Longest-First Subsequence Filtering',
         'A longest uncommon subsequence can be an entire input string. Try strings from longest to shortest, skipping duplicates and rejecting a candidate that is a subsequence of any earlier, at-least-as-long string.',
         'Identify duplicate input strings.|Sort strings by decreasing length.|Skip duplicate candidates.|Return the first candidate not contained as a subsequence in a preceding string.',
         'O(k² × L + k log k) for k strings of maximum length L.', 'O(k × L) conservative bound for duplicate sets and sorting storage.'),
    note('Compare Every Whole-String Candidate',
         'Check each input string against every other string without sorting. A candidate is uncommon when it is not a subsequence of any other indexed string, including an equal duplicate.',
         'Choose each input index as a candidate.|Scan each other string to test subsequence containment.|Reject the candidate on the first containment.|Keep the longest surviving length.',
         'O(k² × L).', 'O(1) auxiliary space.', r'''
         class Solution:
             def findLUSlength(self, strs: list[str]) -> int:
                 def contained(a, b):
                     i = 0
                     for char in b:
                         if i < len(a) and a[i] == char:
                             i += 1
                     return i == len(a)
                 best = -1
                 for i, word in enumerate(strs):
                     if all(i == j or not contained(word, other) for j, other in enumerate(strs)):
                         best = max(best, len(word))
                 return best
         '''))

add(533,
    note('Row Signatures and Black Counts',
         'A qualifying black pixel requires target black cells in its row and column, and every black cell in that column must belong to the same row pattern. A row pattern occurring target times makes that last condition testable by counts.',
         'Count black pixels per row and column.|Count identical row strings.|Keep rows with target black pixels and target identical copies.|Count their black pixels in columns containing target black pixels.',
         'O(mn).', 'O(mn) for row strings and signature counts.'),
    note('Validate Each Column Directly',
         'For each column, collect the rows containing black pixels. If exactly target rows appear, verify that all those rows are identical and each has target black pixels.',
         'Collect black-row indices for each column.|Reject columns with the wrong black count.|Compare each selected row with the first selected row.|Add target when the identical row has the correct black count.',
         'O(mn²) worst case including row comparisons.', 'O(m) temporary row indices.', r'''
         class Solution:
             def findBlackPixel(self, picture: list[list[str]], target: int) -> int:
                 total = 0
                 for col in range(len(picture[0])):
                     rows = [row for row in range(len(picture)) if picture[row][col] == 'B']
                     if len(rows) != target:
                         continue
                     first = picture[rows[0]]
                     if first.count('B') == target and all(picture[row] == first for row in rows):
                         total += target
                 return total
         ''', baseline=True))

add(544,
    note('Recursive Tournament Rounds',
         'Pair the strongest remaining seed with the weakest, then recurse on the resulting ordered match strings. Each round halves the number of entries.',
         'Create one string per seed.|Pair first with last, second with second-last, and so on.|Wrap each pair in parentheses.|Recurse until one tournament expression remains.',
         'O(n log² n) conservative character-copy bound with decimal seed text.', 'O(n log n) live character storage across rounds.'),
    note('Iterative Tournament Rounds',
         'Build the same balanced bracket from successive rounds in a reusable list. Only the active first half remains relevant after each round.',
         'Start with seed strings in rank order.|Overwrite the first half with strongest-versus-weakest pair strings.|Halve the active count.|Return the single remaining bracket.',
         'O(n log² n) conservative character-copy bound.', 'O(n log n) live character storage.', filename='544-2.py'))

add(551,
    note('Absence Count and Late-Run Search',
         'A record is eligible when it contains fewer than two absences and no run of three late days. Counting A and searching for LLL express both rules.',
         'Count absences.|Check for the substring LLL.|Accept only at most one absence and no forbidden late run.',
         'O(n).', 'O(1) auxiliary space.'),
    note('Streaming Attendance State',
         'Track total absences and the current consecutive-late run while scanning once. Reject as soon as either eligibility threshold is exceeded.',
         'Increment absences on A.|Increment the late run on L and reset it on every other character.|Reject two absences or a late run of three.|Accept when the scan finishes.',
         'O(n).', 'O(1) auxiliary space.', r'''
         class Solution:
             def checkRecord(self, s: str) -> bool:
                 absences = late = 0
                 for char in s:
                     absences += char == 'A'
                     late = late + 1 if char == 'L' else 0
                     if absences > 1 or late >= 3:
                         return False
                 return True
         '''))

add(559,
    note('Recursive Maximum Child Depth',
         'The depth of a nonempty N-ary tree is one plus the maximum child depth. A leaf contributes one and an empty tree contributes zero.',
         'Return zero for an empty node.|Return one for a leaf.|Recursively find the maximum child depth and add one.',
         'O(n).', 'O(h) recursion space.'),
    note('Level-Order Depth Counting',
         'Each breadth-first queue layer is one tree depth. Count complete layers until all children have been visited.',
         'Enqueue the root when present.|Process the current queue length.|Enqueue every child.|Increment depth once per processed level.',
         'O(n).', 'O(w) for maximum level width.', r'''
         from collections import deque

         class Solution:
             def maxDepth(self, root: 'Node') -> int:
                 queue = deque([root] if root else [])
                 depth = 0
                 while queue:
                     for _ in range(len(queue)):
                         queue.extend(queue.popleft().children)
                     depth += 1
                 return depth
         '''))

add(561,
    note('Sorted Adjacent Pairing',
         'Pair adjacent values after sorting. Pairing the smallest value with the next smallest uses the least costly partner, leaving larger values available as later pair minima.',
         'Sort all values.|Pair consecutive sorted positions.|Sum values at even indices.',
         'O(n log n).', 'O(n) for the sorted copy and slices.'),
    note('Counting-Sort Pair Minima',
         'The input values lie between −10000 and 10000. Count each value and traverse that fixed domain, adding every other occurrence in sorted order without a comparison sort.',
         'Count values in an offset array.|Traverse counts from smallest to largest value.|Track whether the next sorted occurrence contributes a pair minimum.|Add the correct number of copies and update parity.',
         'O(n + U) for fixed domain size U = 20001.', 'O(U) counts.', r'''
         class Solution:
             def arrayPairSum(self, nums: list[int]) -> int:
                 counts = [0] * 20001
                 for value in nums:
                     counts[value + 10000] += 1
                 take = True
                 total = 0
                 for index, count in enumerate(counts):
                     selected = (count + int(take)) // 2
                     total += selected * (index - 10000)
                     if count % 2:
                         take = not take
                 return total
         '''))

add(562,
    note('Four-Direction Dynamic Programming',
         'For each one cell, record consecutive-one run lengths ending there horizontally, vertically, diagonally, and anti-diagonally. Each extends exactly one previous neighboring state.',
         'Allocate four run lengths per cell.|Leave zero cells at zero.|Extend the left, upper, upper-left, and upper-right states for a one.|Track the largest state.',
         'O(mn).', 'O(mn) for four states per cell.'),
    note('Start Only at Line Beginnings',
         'For each of the four directions, begin scanning a run only when the preceding cell in that direction is absent or zero. Every one cell belongs to only one scanned run per direction.',
         'Visit every one cell.|For each direction, skip it if the predecessor is also one.|Otherwise walk forward until the run ends.|Keep the largest run length.',
         'O(mn): each cell is scanned at most once per direction.', 'O(1) auxiliary space.', r'''
         class Solution:
             def longestLine(self, mat: list[list[int]]) -> int:
                 rows, cols = len(mat), len(mat[0])
                 best = 0
                 for row in range(rows):
                     for col in range(cols):
                         if not mat[row][col]:
                             continue
                         for dr, dc in [(0, 1), (1, 0), (1, 1), (1, -1)]:
                             before_r, before_c = row - dr, col - dc
                             if 0 <= before_r < rows and 0 <= before_c < cols and mat[before_r][before_c]:
                                 continue
                             r, c, length = row, col, 0
                             while 0 <= r < rows and 0 <= c < cols and mat[r][c]:
                                 length += 1
                                 r, c = r + dr, c + dc
                             best = max(best, length)
                 return best
         '''))

add(563,
    note('Postorder Subtree Sums',
         'A node\'s tilt is the absolute difference between its left and right subtree sums. Postorder traversal computes those sums once while accumulating every node\'s tilt.',
         'Return zero for an empty subtree.|Compute left and right sums recursively.|Add their absolute difference to the total tilt.|Return the node value plus both sums.',
         'O(n).', 'O(h) recursion space.'),
    note('Iterative Postorder Sums',
         'An explicit visited flag schedules each node after its children. Store computed subtree sums by node identity and calculate its tilt when both children are ready.',
         'Push the root with an unprocessed flag.|Schedule each node for a later visit after its children.|Read the stored child sums on that later visit.|Store the total subtree sum and accumulate tilt.',
         'O(n).', 'O(n) stored sums and traversal state.', r'''
         class Solution:
             def findTilt(self, root: 'TreeNode') -> int:
                 sums = {None: 0}
                 stack = [(root, False)] if root else []
                 total = 0
                 while stack:
                     node, ready = stack.pop()
                     if ready:
                         left, right = sums[node.left], sums[node.right]
                         total += abs(left - right)
                         sums[node] = node.val + left + right
                     else:
                         stack.append((node, True))
                         for child in (node.right, node.left):
                             if child:
                                 stack.append((child, False))
                 return total
         '''))

add(566,
    note('Row-Major Write Cursor',
         'A reshape preserves row-major element order. A single write index maps each visited original value to its new row and column.',
         'Reject a changed element count by returning the original matrix.|Allocate the requested shape.|Traverse the input row by row.|Write index k at row k // c and column k % c.',
         'O(mn).', 'O(rc) returned matrix; O(1) extra cursor state.'),
    note('Flatten Then Slice',
         'Materialize the shared row-major sequence, then divide it into c-wide rows. This trades an extra copy for a direct expression of reshape semantics.',
         'Check that the requested shape preserves element count.|Flatten the matrix in row-major order.|Slice consecutive groups of c values.',
         'O(mn).', 'O(mn) temporary flat storage, plus output.', r'''
         class Solution:
             def matrixReshape(self, mat: list[list[int]], r: int, c: int) -> list[list[int]]:
                 if len(mat) * len(mat[0]) != r * c:
                     return mat
                 flat = [value for row in mat for value in row]
                 return [flat[i:i + c] for i in range(0, len(flat), c)]
         '''))

add(573,
    note('Best First-Nut Saving',
         'Every nut normally costs a round trip from the tree. Only the first nut starts at the squirrel, so choose the nut maximizing tree-to-nut distance minus squirrel-to-nut distance.',
         'Sum twice the tree distance for every nut.|Compute the saving from starting with each nut.|Subtract the largest saving, even if it is negative.',
         'O(n) for n nuts.', 'O(1) auxiliary space.'),
    note('Enumerate the First Route',
         'Explicitly evaluate the full travel distance for each possible first nut. The first route starts at the squirrel and ends at the tree; every remaining nut requires a tree round trip.',
         'Choose each nut as the first.|Add squirrel-to-first and first-to-tree distances.|Add twice the tree distance for every other nut.|Return the smallest route total.',
         'O(n²).', 'O(1) auxiliary space.', r'''
         class Solution:
             def minDistance(self, height: int, width: int, tree: list[int], squirrel: list[int], nuts: list[list[int]]) -> int:
                 def distance(a, b):
                     return abs(a[0] - b[0]) + abs(a[1] - b[1])
                 best = float('inf')
                 for first, nut in enumerate(nuts):
                     total = distance(squirrel, nut) + distance(nut, tree)
                     for i, other in enumerate(nuts):
                         if i != first:
                             total += 2 * distance(tree, other)
                     best = min(best, total)
                 return best
         ''', baseline=True))

add(575,
    note('Distinct Types Versus Eating Limit',
         'The sister can eat half the candies and cannot receive more distinct types than exist. Giving one candy of each available type reaches the smaller of those two bounds.',
         'Count distinct candy types.|Compute half the number of candies.|Return the smaller value.',
         'Expected O(n) in Python; O(n + U) bitset work in C++ for fixed U = 200001.', 'Python: O(u) for u distinct types. C++: a fixed 200001-bit domain array.'),
    note('Sorted Type Transitions',
         'After sorting, a new type appears exactly when the value changes. Count those transitions and cap the count by the number of candies she may receive.',
         'Sort a copy of the candy types.|Count the first value and each change from its predecessor.|Cap the distinct count at n/2.',
         'O(n log n).', 'O(n) sorted copy.', r'''
         class Solution:
             def distributeCandies(self, candyType: list[int]) -> int:
                 ordered = sorted(candyType)
                 types = sum(i == 0 or value != ordered[i - 1] for i, value in enumerate(ordered))
                 return min(types, len(ordered) // 2)
         '''))

add(592,
    note('Incremental Reduced Fraction Sum',
         'Parse signed numerators and denominators, add each fraction using cross multiplication, and reduce by the greatest common divisor after every step.',
         'Extract signed integer components.|Start the accumulated fraction at zero over one.|Cross-multiply to add each next fraction.|Reduce numerator and denominator by their gcd and format the result.',
         'O(L) parsing plus O(k log B) bounded-integer gcd work for k fractions and intermediate bound B.', 'O(L) parsed components.'),
    note('Exact Fraction Objects',
         'Python\'s standard-library Fraction maintains exact reduced rational values. Parse each signed fraction token and let rational addition normalize the result.',
         'Extract full signed numerator/denominator tokens.|Construct a Fraction for each token.|Add them exactly.|Format the final numerator and positive denominator.',
         'O(L) parsing plus exact rational arithmetic and gcd costs.', 'O(L) parsed tokens plus rational integer storage.', r'''
         import re
         from fractions import Fraction

         class Solution:
             def fractionAddition(self, expression: str) -> str:
                 total = Fraction(0, 1)
                 for token in re.findall(r'[+-]?\d+/\d+', expression):
                     total += Fraction(token)
                 return f'{total.numerator}/{total.denominator}'
         '''))

add(594,
    note('Neighboring Frequency Counts',
         'A harmonious subsequence contains exactly two values differing by one. For each value, combine its frequency with the frequency of its successor when that successor exists.',
         'Count each value.|Look for value + 1 for every distinct value.|Maximize the combined frequency.|Return zero if no neighboring pair exists.',
         'Expected O(n).', 'O(u) for distinct counts.'),
    note('Sorted Difference-One Window',
         'In sorted order, all values in a harmonious subsequence can be taken as a contiguous window. Shrink the left edge whenever the range exceeds one and score only range exactly one.',
         'Sort a copy.|Advance the right endpoint.|Move the left endpoint until the value difference is at most one.|Update the answer only when the difference equals one.',
         'O(n log n).', 'O(n) for the sorted copy.', r'''
         class Solution:
             def findLHS(self, nums: list[int]) -> int:
                 ordered = sorted(nums)
                 left = best = 0
                 for right, value in enumerate(ordered):
                     while value - ordered[left] > 1:
                         left += 1
                     if value - ordered[left] == 1:
                         best = max(best, right - left + 1)
                 return best
         '''))

add(598,
    note('Common Prefix-Rectangle Intersection',
         'Every operation increments a rectangle anchored at the origin. The cells receiving every increment form the intersection, whose dimensions are the minimum operation height and width.',
         'Start with the full matrix dimensions.|Minimize height and width across operations.|Multiply the resulting intersection dimensions.',
         'O(k) for k operations.', 'O(1) auxiliary space.'),
    note('Compressed-Cell Simulation',
         'Operation boundaries partition the matrix into cells with uniform increment counts. Simulate each compressed cell, then sum the areas of cells attaining the largest count.',
         'Collect all operation row and column boundaries plus matrix boundaries.|Visit every compressed cell.|Count operations covering its top-left corner.|Keep the largest count and total area at that count.',
         'O(k³ + k log k) upper bound.', 'O(k) compressed boundaries.', r'''
         class Solution:
             def maxCount(self, m: int, n: int, ops: list[list[int]]) -> int:
                 rows = sorted({0, m, *(a for a, _ in ops)})
                 cols = sorted({0, n, *(b for _, b in ops)})
                 best, area = -1, 0
                 for r, end_r in zip(rows, rows[1:]):
                     for c, end_c in zip(cols, cols[1:]):
                         count = sum(r < a and c < b for a, b in ops)
                         size = (end_r - r) * (end_c - c)
                         if count > best:
                             best, area = count, size
                         elif count == best:
                             area += size
                 return area
         ''', baseline=True))

add(599,
    note('Restaurant-to-Index Map',
         'Map one list\'s restaurants to indices and scan the other list. Shared names compete by the sum of their two indices, preserving every tie.',
         'Build a name-to-index map for list1.|Scan list2 and skip names absent from the map.|Replace results on a smaller index sum.|Append on an equal index sum.',
         'Expected O(n + m) name lookups, plus string hashing.', 'O(n) map, excluding output.'),
    note('Search by Increasing Index Sum',
         'Consider possible index sums from smallest to largest. Once any matches exist at a sum, those matches are exactly the answers and larger sums can be skipped.',
         'Enumerate each possible index sum.|Visit valid index pairs with that sum.|Collect equal restaurant names.|Return the first nonempty match group.',
         'O(nm) name comparisons in the worst case.', 'O(1) auxiliary space, excluding output.', r'''
         class Solution:
             def findRestaurant(self, list1: list[str], list2: list[str]) -> list[str]:
                 for total in range(len(list1) + len(list2) - 1):
                     matches = []
                     for i in range(max(0, total - len(list2) + 1), min(len(list1) - 1, total) + 1):
                         if list1[i] == list2[total - i]:
                             matches.append(list1[i])
                     if matches:
                         return matches
                 return []
         ''', baseline=True))

add(609,
    note('Group File Paths by Content',
         'Parse each directory description into filenames and contents. Use content as a hash-map key and retain groups with at least two file paths.',
         'Split each description into directory and file tokens.|Separate each filename from its parenthesized content.|Append its full path to the content group.|Return groups containing duplicates.',
         'Expected O(L) parsing and hashing for total text length L.', 'O(L) grouped content and paths.'),
    note('Sort Content-Path Records',
         'Sort parsed files by content so equal-content files become consecutive. Scan those runs and return only groups with multiple members.',
         'Parse every file into a content/path pair.|Sort all pairs by content.|Group adjacent equal-content records.|Return paths from groups of size at least two.',
         'O(L + f log f × C) upper bound for f files and maximum compared content length C.', 'O(L) parsed records and grouping storage.', r'''
         from itertools import groupby

         class Solution:
             def findDuplicate(self, paths: list[str]) -> list[list[str]]:
                 records = []
                 for description in paths:
                     directory, *files = description.split()
                     for file in files:
                         name, content = file.split('(', 1)
                         records.append((content[:-1], directory + '/' + name))
                 records.sort()
                 result = []
                 for _, group in groupby(records, key=lambda record: record[0]):
                     names = [path for _, path in group]
                     if len(names) > 1:
                         result.append(names)
                 return result
         '''))

add(625,
    note('Greedy Large-Digit Factorization',
         'Use factors from nine down to two to minimize the number of decimal digits, then place larger chosen factors in less significant positions. Any remaining prime factor above nine makes the construction impossible.',
         'Return one for input one.|Repeatedly remove factors nine down to two.|Prepend each removed digit to the numeric answer.|Require no remaining factor and a signed 32-bit result.',
         'O(log num) bounded-integer divisions.', 'O(1) auxiliary space under the result bound.'),
    note('Memoized Divisor Search',
         'Search all single-digit factors of the remaining product. Memoization merges repeated divisor subproblems; sort each candidate digit multiset and prefer shorter, then lexicographically smaller, strings.',
         'Use an empty digit string for remaining product one.|Try every dividing digit from two through nine.|Recursively solve the quotient and insert the chosen digit in sorted order.|Choose the smallest candidate and enforce the 32-bit result limit.',
         'O(τ(num) × log² num) conservative character-work bound, where τ counts divisors.', 'O(τ(num) × log num) stored characters.', r'''
         from functools import cache

         class Solution:
             def smallestFactorization(self, num: int) -> int:
                 if num == 1:
                     return 1
                 @cache
                 def best(remaining):
                     if remaining == 1:
                         return ''
                     answer = None
                     for digit in range(2, 10):
                         if remaining % digit:
                             continue
                         suffix = best(remaining // digit)
                         if suffix is not None:
                             candidate = ''.join(sorted(suffix + str(digit)))
                             if answer is None or (len(candidate), candidate) < (len(answer), answer):
                                 answer = candidate
                     return answer
                 digits = best(num)
                 value = int(digits) if digits else 0
                 return value if value <= 2**31 - 1 else 0
         '''))

add(628,
    note('Sorted Extremes',
         'The maximum triple product uses either the three largest values or the largest value with the two smallest values, whose negative signs may cancel.',
         'Sort the input.|Multiply the three largest values.|Multiply the largest value and two smallest values.|Return the larger product.',
         'O(n log n).', 'O(n) worst-case Python sorting workspace.'),
    note('Five Running Extremes',
         'Only two minima and three maxima are needed. Maintain those five values in one pass and compare the same two product candidates.',
         'Initialize two minima and three maxima.|Update them for each value, retaining duplicates.|Compare the all-largest and two-smallest product choices.',
         'O(n).', 'O(1) auxiliary space.', filename='628-2.py'))

add(633,
    note('Two Pointers on Square Values',
         'Start with the smallest possible square and the largest square not exceeding c. Increase the small endpoint when the sum is too small and decrease the large endpoint when it is too large.',
         'Set endpoints to zero and integer sqrt(c).|Compare their squared sum with c.|Move the endpoint that can bring the sum toward c.|Stop on equality or crossing pointers.',
         'O(sqrt(c)).', 'O(1) auxiliary space.'),
    note('Enumerate One Square and Test the Remainder',
         'Try each possible first square. The remaining value must itself be a perfect square, which an integer square-root check tests exactly.',
         'Enumerate a from zero through integer sqrt(c).|Calculate c − a².|Take its integer square root.|Accept when squaring that root reconstructs the remainder.',
         'O(sqrt(c)) integer-root tests under the bounded input domain.', 'O(1) auxiliary space.', r'''
         from math import isqrt

         class Solution:
             def judgeSquareSum(self, c: int) -> bool:
                 for a in range(isqrt(c) + 1):
                     remainder = c - a * a
                     b = isqrt(remainder)
                     if b * b == remainder:
                         return True
                 return False
         '''))

add(634,
    note('Derangement Table',
         'Choose the destination of the first element. There are n − 1 choices; the displaced element either returns to the first position, leaving n − 2 elements, or participates in a larger cycle, leaving a derangement subproblem of size n − 1.',
         'Initialize D(0) = 1 and D(1) = 0.|For each size i, compute (i − 1) × (D(i − 1) + D(i − 2)).|Reduce every step modulo 10^9 + 7.|Return D(n).',
         'O(n).', 'O(n) for the table.'),
    note('Alternating Single-State Recurrence',
         'The equivalent recurrence D(i) = i × D(i − 1) + (−1)^i follows by combining the standard recurrence at consecutive sizes. Only the preceding answer is needed.',
         'Start from the empty derangement count one.|For sizes one through n, multiply by the size.|Add one for an even size or subtract one for an odd size.|Reduce modulo 10^9 + 7.',
         'O(n).', 'O(1) auxiliary space.', r'''
         class Solution:
             def findDerangement(self, n: int) -> int:
                 result = 1
                 for size in range(1, n + 1):
                     result = (size * result + (1 if size % 2 == 0 else -1)) % 1_000_000_007
                 return result
         '''), variant=2)

add(635,
    note('Timestamp-Prefix Scan',
         'Fixed-width timestamps sort chronologically as text. Truncating both query bounds and stored timestamps to the requested granularity turns retrieval into inclusive prefix comparisons.',
         'Append each log ID and timestamp.|Map granularity to a timestamp-prefix length.|Truncate the query bounds.|Return IDs whose timestamp prefixes fall inside the inclusive range.',
         'O(1) per put; O(q) per retrieve for q logs, with fixed-width timestamps.', 'O(q) stored logs, excluding query output.'),
    note('Sorted Timestamps and Binary Search',
         'Keep logs ordered by full timestamp. Prefix bounds can be converted to a contiguous lexicographic interval, found with two binary searches.',
         'Insert timestamp/ID pairs into a sorted list.|Use the truncated start prefix as the lower bound.|Append a high ASCII sentinel to the end prefix for an inclusive upper bound.|Return IDs from the located slice.',
         'O(q) per put due to list shifts; O(log q + k) per retrieve returning k logs.', 'O(q) stored logs and O(k) query slice.', r'''
         from bisect import bisect_left, insort

         class LogSystem:
             def __init__(self):
                 self.logs = []
                 self.width = {'Year': 4, 'Month': 7, 'Day': 10, 'Hour': 13, 'Minute': 16, 'Second': 19}

             def put(self, id: int, timestamp: str) -> None:
                 insort(self.logs, (timestamp, id))

             def retrieve(self, start: str, end: str, granularity: str) -> list[int]:
                 width = self.width[granularity]
                 left = bisect_left(self.logs, (start[:width], -1))
                 right = bisect_left(self.logs, (end[:width] + '~', -1))
                 return [identifier for _, identifier in self.logs[left:right]]
         '''))

add(638,
    note('Ordered Offer Backtracking',
         'Compare buying all remaining items individually with taking each fitting special offer. Restrict later offers to the current or a higher index so the same offer combination is not explored in different orders.',
         'Calculate the individual-purchase cost for the current needs.|Try each fitting offer at or after the current index.|Subtract quantities, recurse allowing reuse of that offer, and restore quantities.|Return the cheapest option.',
         'O(n × (k + 1)^(S + 1)) loose upper bound for n item types, k offers, and S total required items.', 'O(S + n) live recursion and needs state.', baseline=True),
    note('Memoized Remaining-Needs States',
         'The cheapest completion cost depends only on the remaining item quantities. Memoize each needs tuple so different offer orders share the same subproblem.',
         'Represent remaining quantities as an immutable tuple.|Initialize its answer with individual purchases.|Try every offer that does not exceed the remaining needs.|Cache the minimum offer-plus-remainder cost.',
         'O(k × n × P), where P = product(needs[i] + 1).', 'O(n × P) for cached tuples and recursion.', r'''
         from functools import cache

         class Solution:
             def shoppingOffers(self, price: list[int], special: list[list[int]], needs: list[int]) -> int:
                 @cache
                 def cost(remaining):
                     best = sum(p * quantity for p, quantity in zip(price, remaining))
                     for offer in special:
                         if any(offer[:-1]) and all(offer[i] <= remaining[i] for i in range(len(price))):
                             rest = tuple(remaining[i] - offer[i] for i in range(len(price)))
                             best = min(best, offer[-1] + cost(rest))
                     return best
                 return cost(tuple(needs))
         '''))

add(640,
    note('Character-Level Linear-Term Parser',
         'Each side of the equation reduces to a coefficient of x and a constant. Scan signs and decimal values, treating a bare x as coefficient one, then move coefficients and constants to opposite sides.',
         'Parse each side into coefficient and constant totals.|Subtract right coefficients from left coefficients.|Subtract left constants from right constants.|Handle zero coefficient as infinite or no solutions; otherwise divide.',
         'O(n) for equation length n under bounded integer arithmetic.', 'O(n) for the two side strings.'),
    note('Signed-Term Tokenization',
         'Split each side into signed variable or constant terms with a regular expression. Summing each category produces the same two coefficients without character-by-character numeric state.',
         'Extract signed terms from each side.|Interpret x and +x as one and −x as negative one.|Sum variable coefficients and constants separately.|Solve the reduced one-variable equation and handle the zero-coefficient cases.',
         'O(n) under bounded integer arithmetic.', 'O(n) token storage.', r'''
         import re

         class Solution:
             def solveEquation(self, equation: str) -> str:
                 def parse(side):
                     coefficient = constant = 0
                     for term in re.findall(r'[+-]?(?:\d+x?|x)', side):
                         if term.endswith('x'):
                             number = term[:-1]
                             coefficient += int(number + '1') if number in ('', '+', '-') else int(number)
                         else:
                             constant += int(term)
                     return coefficient, constant
                 left, right = map(parse, equation.split('='))
                 coefficient, constant = left[0] - right[0], right[1] - left[1]
                 if coefficient == 0:
                     return 'Infinite solutions' if constant == 0 else 'No solution'
                 return 'x=' + str(constant // coefficient)
         '''))

add(648,
    note('Shortest-Root Trie',
         'Insert dictionary roots into a trie and stop a sentence-word search at the first terminal node. The earliest terminal is its shortest matching root.',
         'Insert dictionary roots and mark their terminal nodes.|Traverse each sentence word through the trie.|Return the first terminal root or the original word if no root matches.|Join the replaced words.',
         'O(D + S) for dictionary text D and sentence text S.', 'O(D + S) including trie and output words.'),
    note('Prefix Set Lookup',
         'Keep roots in a hash set and test each word\'s prefixes from shortest to longest. The first membership hit supplies the required shortest root.',
         'Build the root set.|For each sentence word, test increasing prefix lengths.|Replace at the first set match.|Keep unmatched words unchanged and join the result.',
         'O(D + sum of word-length²), including Python prefix copying and hashing.', 'O(D + S) stored roots and output words.', r'''
         class Solution:
             def replaceWords(self, dictionary: list[str], sentence: str) -> str:
                 roots = set(dictionary)
                 words = sentence.split()
                 for i, word in enumerate(words):
                     for length in range(1, len(word) + 1):
                         if word[:length] in roots:
                             words[i] = word[:length]
                             break
                 return ' '.join(words)
         '''))

add(650,
    note('Divisor-Based Dynamic Programming',
         'To reach i characters, first construct a divisor j of i, then copy once and paste i/j − 1 times. The table reuses the cost of constructing that divisor.',
         'Initialize each count with the copy-one then repeated-paste cost.|For each target size, look backward for a useful divisor.|Combine the divisor\'s best cost with the required copy/paste group.|Return the target entry.',
         'O(n²) worst-case divisor search.', 'O(n) table.'),
    note('Prime Factor Operation Groups',
         'A copy followed by pastes multiplies the current count. Splitting a composite multiplier into smaller factors never increases total operations, so the optimum is the sum of the target\'s prime factors.',
         'Try divisors starting at two.|For every successful division, add that factor to the cost.|Continue until the remaining value has no smaller factors.|Add the remaining prime factor when greater than one.',
         'O(sqrt(n)) trial divisions.', 'O(1) auxiliary space.', r'''
         class Solution:
             def minSteps(self, n: int) -> int:
                 total, factor = 0, 2
                 while factor * factor <= n:
                     while n % factor == 0:
                         total += factor
                         n //= factor
                     factor += 1
                 return total + (n if n > 1 else 0)
         '''))

add(654,
    note('Recursive Maximum Selection',
         'The largest value becomes the subtree root. Values before and after it recursively form the left and right subtrees.',
         'Find the maximum in the current interval.|Create its root node.|Recurse on intervals before and after its index.|Return the root, or null for an empty interval.',
         'O(n²) worst case from repeated scans and index searches.', 'O(n) worst-case recursion and temporary slices, excluding output.'),
    note('Decreasing Monotonic Stack',
         'Maintain roots of unfinished decreasing subtrees. A new larger value takes popped smaller roots as its left subtree and becomes the right child of the remaining larger stack top.',
         'Create a node for each value.|Pop smaller stack roots and attach the last popped root as the new left child.|Attach the new node as the remaining top\'s right child.|Push the new node and finally return the bottom stack root.',
         'O(n), since each node is pushed and popped once.', 'O(n) stack, excluding tree nodes.', r'''
         class Solution:
             def constructMaximumBinaryTree(self, nums: list[int]) -> 'TreeNode':
                 stack = []
                 for value in nums:
                     node = TreeNode(value)
                     while stack and stack[-1].val < value:
                         node.left = stack.pop()
                     if stack:
                         stack[-1].right = node
                     stack.append(node)
                 return stack[0] if stack else None
         '''))

add(655,
    note('Recursive Interval Placement',
         'A tree of height h needs h rows and 2^h − 1 columns. Place each node at the center of its allocated column interval, then give its children the left and right subintervals.',
         'Measure tree height.|Allocate the required empty string matrix.|Write each node at its interval midpoint.|Recurse into the two child intervals on the next row.',
         'O(h × 2^h + n), including output initialization.', 'O(h) recursion workspace plus O(h × 2^h) output.'),
    note('Breadth-First Column Offsets',
         'After measuring height, the root has the center column. Each child offset is a power of two determined by its row, so a queue can place nodes level by level.',
         'Measure height with level-order traversal.|Allocate the output matrix.|Queue the root at the center column.|Place children using the next-row power-of-two offset.',
         'O(h × 2^h + n).', 'O(w) queue plus O(h × 2^h) output.', r'''
         from collections import deque

         class Solution:
             def printTree(self, root: 'TreeNode') -> list[list[str]]:
                 if not root:
                     return []
                 level, height = [root], 0
                 while level:
                     height += 1
                     level = [child for node in level for child in (node.left, node.right) if child]
                 width = (1 << height) - 1
                 result = [[''] * width for _ in range(height)]
                 queue = deque([(root, 0, width // 2)])
                 while queue:
                     node, row, column = queue.popleft()
                     result[row][column] = str(node.val)
                     if row + 1 < height:
                         offset = 1 << (height - row - 2)
                         if node.left:
                             queue.append((node.left, row + 1, column - offset))
                         if node.right:
                             queue.append((node.right, row + 1, column + offset))
                 return result
         '''))

add(657,
    note('Opposite-Move Counts',
         'Horizontal displacement is zero when left and right counts agree; vertical displacement is zero when up and down counts agree.',
         'Count R and L and compare them.|Count U and D and compare them.|Accept only when both pairs agree.',
         'O(n).', 'O(1) auxiliary space.'),
    note('Coordinate Simulation',
         'Simulate each movement as a unit change to an x or y coordinate and check the final position.',
         'Start at (0, 0).|Apply the coordinate delta for every move.|Return whether both coordinates are zero.',
         'O(n).', 'O(1) auxiliary space.', r'''
         class Solution:
             def judgeCircle(self, moves: str) -> bool:
                 changes = {'L': (-1, 0), 'R': (1, 0), 'U': (0, 1), 'D': (0, -1)}
                 x = y = 0
                 for move in moves:
                     dx, dy = changes[move]
                     x += dx
                     y += dy
                 return x == 0 and y == 0
         '''))

add(663,
    note('Proper-Subtree Sum Set',
         'Removing one edge isolates a proper subtree. Such a cut splits the total equally exactly when that subtree sum is half the full tree sum. Exclude the root itself from candidate cuts.',
         'Compute and store sums of all subtrees below the root.|Add the root value to obtain the full total.|Reject an odd total.|Look for half the total among proper-subtree sums.',
         'Expected O(n).', 'O(n) stored sums and O(h) recursion.',
         pitfalls=('A zero total still requires a proper zero-sum subtree.',)) ,
    note('Reverse Traversal Subtree Table',
         'Collect nodes with parents before children, then process that order backward so child sums are ready. Compare every nonroot sum with half the full total.',
         'Collect all nodes in a parent-before-child traversal.|Compute sums in reverse order.|Read the root total.|Test twice each nonroot subtree sum against that total.',
         'O(n).', 'O(n) traversal order and sum table.', r'''
         class Solution:
             def checkEqualTree(self, root: 'TreeNode') -> bool:
                 if not root:
                     return False
                 order, stack = [], [root]
                 while stack:
                     node = stack.pop()
                     order.append(node)
                     stack.extend(child for child in (node.left, node.right) if child)
                 sums = {None: 0}
                 for node in reversed(order):
                     sums[node] = node.val + sums[node.left] + sums[node.right]
                 return any(2 * sums[node] == sums[root] for node in order[1:])
         '''))

add(666,
    note('Decode and Traverse the Small Tree',
         'Each three-digit value gives a depth, a position within that depth, and a node value. Decode these into the bounded four-level tree, then accumulate root-to-leaf path sums.',
         'Decode each value into a zero-based depth and position.|Store node values in the four-level layout.|Traverse children at positions 2p and 2p + 1.|Add the accumulated sum at each leaf.',
         'O(n) input decoding and bounded traversal.', 'O(1) for the fixed four-level domain.'),
    note('Forward Encoded-Node Path Sums',
         'The sorted encodings visit parents before children. Store each encoded node\'s root-path sum directly, then add values belonging to nodes without encoded children.',
         'Decode each node\'s depth and one-based position.|Look up its parent at the preceding depth and ceiling(position/2).|Store parent path sum plus node value.|Sum stored paths whose nodes have no children.',
         'Expected O(n).', 'O(n), bounded by the four-level tree.', r'''
         class Solution:
             def pathSum(self, nums: list[int]) -> int:
                 paths = {}
                 for code in nums:
                     depth, position, value = code // 100, code // 10 % 10, code % 10
                     parent = (depth - 1, (position + 1) // 2)
                     paths[(depth, position)] = paths.get(parent, 0) + value
                 return sum(total for (depth, position), total in paths.items()
                            if (depth + 1, 2 * position - 1) not in paths
                            and (depth + 1, 2 * position) not in paths)
         '''))

add(667,
    note('Increasing Prefix and Alternating Tail',
         'An increasing prefix contributes difference one. Alternating high and low values in the last k positions creates the additional differences k down to two while preserving a permutation.',
         'Write the increasing prefix from one through n − k.|Append alternating largest and smallest unused tail values.|Continue until all n values are used.',
         'O(n).', 'O(n) output; O(1) extra state.'),
    note('Alternating Prefix and Increasing Suffix',
         'Construct the first k + 1 values by alternating endpoints of [1, k + 1], creating differences k, k − 1, …, 1. Append the remaining larger values in increasing order; they add no new difference value.',
         'Maintain low = 1 and high = k + 1.|Alternate taking low and high until the interval is exhausted.|Append values k + 2 through n.|Return the permutation.',
         'O(n).', 'O(n) output; O(1) extra state.', r'''
         class Solution:
             def constructArray(self, n: int, k: int) -> list[int]:
                 result = []
                 low, high = 1, k + 1
                 while low <= high:
                     result.append(low)
                     low += 1
                     if low <= high:
                         result.append(high)
                         high -= 1
                 result.extend(range(k + 2, n + 1))
                 return result
         '''))

add(670,
    note('Rightmost Larger-Digit Lookup',
         'Improving the earliest digit dominates every later change. Record the last position of each digit and swap the first improvable position with the rightmost occurrence of the largest possible digit.',
         'Record each digit\'s final index.|Scan positions from left to right.|Try larger digits from nine downward.|Perform the first valid improving swap, or keep the input.',
         'O(d) for d decimal digits and a fixed ten-digit alphabet.', 'O(d) digit storage.'),
    note('Enumerate Every Swap',
         'The decimal representation is short under the integer bound. Try every pair of positions, convert the swapped string back to an integer, and retain the maximum.',
         'Start the best answer at the original number.|Swap each index pair temporarily.|Evaluate the resulting number.|Undo the swap and keep the best result.',
         'O(d³) including conversion for O(d²) swaps.', 'O(d) for digit and string storage.', r'''
         class Solution:
             def maximumSwap(self, num: int) -> int:
                 digits = list(str(num))
                 best = num
                 for i in range(len(digits)):
                     for j in range(i + 1, len(digits)):
                         digits[i], digits[j] = digits[j], digits[i]
                         best = max(best, int(''.join(digits)))
                         digits[i], digits[j] = digits[j], digits[i]
                 return best
         '''))

add(672,
    note('Reduced-State Case Analysis',
         'The four buttons have repeating, dependent effects, so at most three bulb positions distinguish outcomes. The number of reachable states then depends only on that reduced size and whether the press count is zero, one, two, or at least three.',
         'Reduce the bulb count to at most three.|Return one state for zero presses.|Use the one-press and two-press outcome tables.|For three or more presses, return all reduced states.',
         'O(1).', 'O(1) auxiliary space.'),
    note('Enumerate Button-Press Parities',
         'Pressing a button twice cancels its effect. Enumerate the sixteen parity masks of the four buttons, retaining masks with an achievable press count and parity, then deduplicate resulting bulb patterns.',
         'Keep at most six bulbs, covering the buttons\' full positional period.|Enumerate all sixteen subsets of buttons pressed an odd number of times.|Require selected count at most presses and matching parity.|Simulate each valid mask and count distinct outcomes.',
         'O(16 × 6), a fixed-domain bound.', 'O(1) bounded pattern set.', r'''
         class Solution:
             def flipLights(self, n: int, presses: int) -> int:
                 states = set()
                 for mask in range(16):
                     used = mask.bit_count()
                     if used > presses or (presses - used) % 2:
                         continue
                     state = []
                     for bulb in range(1, min(n, 6) + 1):
                         toggles = ((mask & 1) != 0)
                         toggles ^= bool(mask & 2) and bulb % 2 == 0
                         toggles ^= bool(mask & 4) and bulb % 2 == 1
                         toggles ^= bool(mask & 8) and bulb % 3 == 1
                         state.append(not toggles)
                     states.add(tuple(state))
                 return len(states)
         '''))

add(674,
    note('Increasing-Run Start Index',
         'A nonincreasing adjacent pair breaks the current increasing run. Track the index after the last break and maximize the current run length.',
         'Start the current run at index zero.|Reset its start when the current value is not larger than its predecessor.|Measure the current index minus run start plus one.|Keep the maximum.',
         'O(n).', 'O(1) auxiliary space.'),
    note('Run-Length Dynamic Programming',
         'Store the longest increasing run ending at every position. It extends the preceding state by one when the adjacent values increase, and otherwise restarts at one.',
         'Initialize each position to run length one.|Extend from the preceding position on a strict increase.|Take the largest stored run length.',
         'O(n).', 'O(n) for the state array.', r'''
         class Solution:
             def findLengthOfLCIS(self, nums: list[int]) -> int:
                 lengths = [1] * len(nums)
                 for i in range(1, len(nums)):
                     if nums[i] > nums[i - 1]:
                         lengths[i] = lengths[i - 1] + 1
                 return max(lengths, default=0)
         '''))

add(676,
    note('Wildcard-Position Signatures',
         'Replace one position of each dictionary word with a wildcard. Store its original character, or an ambiguity marker if multiple words share that signature. A query succeeds when one matching signature permits a different character.',
         'Generate one wildcard signature per dictionary position.|Record the removed character, marking shared signatures ambiguous.|Generate the query\'s signatures.|Accept when the stored character differs or the signature is ambiguous.',
         'O(sum of dictionary word-length²) build; O(L²) query, including string copies and hashes.', 'O(sum of dictionary word-length²) signature characters.',
         pitfalls=('Exactly one substitution is required; an unchanged dictionary match alone is insufficient.',)) ,
    note('Trie with One Substitution',
         'Walk along the query\'s unchanged prefix. At each position, try another letter branch and require the rest of the query to match that branch exactly.',
         'Build a terminal-marked dictionary trie.|At each query position, try each different available letter.|Check the remaining suffix without further substitutions.|Continue along the unchanged branch to consider a later substitution.',
         'O(D) build; O(26 × L²) upper bound per query.', 'O(D) trie plus O(L) temporary suffix storage.', filename='676-2.py'))

add(677,
    note('Prefix-Sum Trie with Value Deltas',
         'Store the sum of all keys sharing each trie prefix. Replacing a key changes those sums only by the difference between its new and old values.',
         'Look up the previous full-key value.|Compute the value delta.|Walk the key, creating trie nodes and adding the delta.|Answer a prefix query using its final node\'s stored sum.',
         'Expected O(L) per insertion or prefix query for text length L.', 'O(D) for distinct stored key-prefix characters and key values.'),
    note('Full-Key Map and Prefix Scan',
         'Keep only full keys and their latest values. A sum query scans every stored key and includes values whose keys begin with the requested prefix.',
         'Assign the latest value in a key map.|On sum, inspect all stored keys.|Add values whose keys start with the prefix.',
         'Expected O(L) insertion including hashing; O(k × p) query for k keys and prefix length p.', 'O(D) stored keys and values.', r'''
         class MapSum:
             def __init__(self):
                 self.values = {}

             def insert(self, key: str, val: int) -> None:
                 self.values[key] = val

             def sum(self, prefix: str) -> int:
                 return sum(value for key, value in self.values.items() if key.startswith(prefix))
         '''))

add(681,
    note('Greedy Digit Carry',
         'Try to increase the least significant time digit using only available digits. If that position cannot increase within its valid limit, reset it to the smallest digit and carry into the next position.',
         'Sort the available digits.|Try minute ones, then minute tens, respecting their limits.|Carry into hour ones with a limit depending on hour tens.|Finally update hour tens or wrap to the next day.',
         'O(1) for four time digits.', 'O(1) auxiliary space.'),
    note('Scan the Next Day of Minutes',
         'There are only 1440 possible future minutes before the same time repeats. Check them chronologically and return the first time whose digits all come from the input.',
         'Convert the input to minutes after midnight.|Try offsets one through 1440, wrapping at midnight.|Format each candidate as HH:MM.|Accept the first candidate using only available digits.',
         'O(1440), a fixed bound.', 'O(1) auxiliary space.', r'''
         class Solution:
             def nextClosestTime(self, time: str) -> str:
                 allowed = set(time.replace(':', ''))
                 start = int(time[:2]) * 60 + int(time[3:])
                 for offset in range(1, 1441):
                     hour, minute = divmod((start + offset) % 1440, 60)
                     candidate = f'{hour:02d}:{minute:02d}'
                     if set(candidate.replace(':', '')) <= allowed:
                         return candidate
         '''))

add(686,
    note('Bounded Repetition and Substring Search',
         'At least ceiling(len(b)/len(a)) copies are needed. If b appears at all, it fits within that many copies or one extra copy, because its start can be shifted into the first a block.',
         'Compute the minimum copy count covering b\'s length.|Search b inside that repetition.|Search once more after appending one a.|Return the matching count or −1.',
         'O((n + m) × m) conservative substring-search bound for lengths n and m.', 'O(n + m) repeated text.'),
    note('KMP over a Virtual Repeated String',
         'Build b\'s prefix-function table, then stream characters from the repeated a using modular indexing. KMP finds the earliest complete match without constructing the repeated text.',
         'Build the longest-prefix/suffix table for b.|Read enough virtual copies of a to cover all possible match starts.|Use failure links after mismatches.|On the first complete match, return the copies needed to reach its ending position.',
         'O(n + m).', 'O(m) prefix-function table.', r'''
         class Solution:
             def repeatedStringMatch(self, a: str, b: str) -> int:
                 prefix = [0] * len(b)
                 matched = 0
                 for i in range(1, len(b)):
                     while matched and b[i] != b[matched]:
                         matched = prefix[matched - 1]
                     if b[i] == b[matched]:
                         matched += 1
                     prefix[i] = matched
                 matched = 0
                 limit = ((len(b) + len(a) - 1) // len(a) + 1) * len(a)
                 for i in range(limit):
                     char = a[i % len(a)]
                     while matched and char != b[matched]:
                         matched = prefix[matched - 1]
                     if char == b[matched]:
                         matched += 1
                     if matched == len(b):
                         return (i + len(a)) // len(a)
                 return -1
         '''))

add(687,
    note('Recursive Equal-Value Arrows',
         'Return the longest matching-value downward path from each node. A complete path through that node can combine the left and right matching arrows, while its parent can extend only the longer one.',
         'Recursively calculate both child arrows.|Extend an arrow only when the child value matches the current node.|Score the sum of both arrows.|Return the longer arrow to the parent.',
         'O(n).', 'O(h) recursion space.'),
    note('Iterative Postorder Arrow Table',
         'Process nodes after their children using an explicit stack. Store each node\'s longest downward matching path and combine child paths when its postorder visit is ready.',
         'Schedule each node before and after its children.|On the later visit, read child arrow lengths.|Zero any arrow whose child value differs.|Update the full path maximum and store the longer arrow.',
         'O(n).', 'O(n) stored arrows and traversal state.', r'''
         class Solution:
             def longestUnivaluePath(self, root: 'TreeNode') -> int:
                 stack = [(root, False)] if root else []
                 arrows, best = {}, 0
                 while stack:
                     node, ready = stack.pop()
                     if ready:
                         left = arrows[node.left] + 1 if node.left and node.left.val == node.val else 0
                         right = arrows[node.right] + 1 if node.right and node.right.val == node.val else 0
                         best = max(best, left + right)
                         arrows[node] = max(left, right)
                     else:
                         stack.append((node, True))
                         stack.extend((child, False) for child in (node.left, node.right) if child)
                 return best
         '''))

add(688,
    note('Rolling Survival Probabilities',
         'The board array stores the probability of being at each square without having left the board. Each move distributes one eighth of every current probability to valid knight destinations; off-board probability is discarded.',
         'Place probability one at the starting square.|Build a fresh board using the eight knight offsets and one-eighth contributions.|Repeat for k moves.|Sum the surviving board probabilities.',
         'O(k × n²).', 'O(n²) rolling probability arrays.'),
    note('Memoized Survival Probability',
         'The chance of remaining on the board depends on the current square and moves remaining. Average the eight successor probabilities, counting off-board moves as zero.',
         'Return zero immediately for an off-board square.|Return one when no moves remain on board.|Average the eight recursive successor probabilities.|Memoize each square and remaining-move state.',
         'O(k × n²).', 'O(k × n²) cached states and O(k) recursion.', r'''
         from functools import cache

         class Solution:
             def knightProbability(self, n: int, k: int, row: int, column: int) -> float:
                 moves = [(1, 2), (2, 1), (2, -1), (1, -2), (-1, -2), (-2, -1), (-2, 1), (-1, 2)]
                 @cache
                 def probability(r, c, remaining):
                     if not (0 <= r < n and 0 <= c < n):
                         return 0.0
                     if remaining == 0:
                         return 1.0
                     return sum(probability(r + dr, c + dc, remaining - 1) for dr, dc in moves) / 8
                 return probability(row, column, k)
         '''))

add(690,
    note('Employee Lookup and Recursive Aggregation',
         'Map IDs to employee records, then recursively sum the selected employee\'s importance and that of every subordinate in the guaranteed hierarchy.',
         'Build the ID lookup.|Add the selected employee\'s importance.|Recurse into each listed subordinate.|Return the combined sum.',
         'O(n + r) for n employee records and r reachable employees.', 'O(n) lookup plus O(h) recursion.'),
    note('Iterative Hierarchy Traversal',
         'Use an explicit work stack of employee IDs to aggregate the selected hierarchy without recursive calls.',
         'Build the ID lookup.|Push the selected ID.|Pop an employee, add importance, and push subordinate IDs.|Continue until the stack is empty.',
         'O(n + r).', 'O(n) lookup and traversal stack.', r'''
         class Solution:
             def getImportance(self, employees: list['Employee'], id: int) -> int:
                 by_id = {employee.id: employee for employee in employees}
                 pending, total = [id], 0
                 while pending:
                     employee = by_id[pending.pop()]
                     total += employee.importance
                     pending.extend(employee.subordinates)
                 return total
         '''))

add(692,
    note('Frequency Buckets with Lexical Ties',
         'Group distinct words by occurrence count. Visit frequency buckets from largest to smallest and sort words inside each bucket lexicographically to resolve ties.',
         'Count word frequencies.|Place each distinct word in its frequency bucket.|Visit buckets in decreasing frequency.|Append lexically sorted words until k are collected.',
         'O(n + u log u × L) conservative bound for u distinct words of maximum length L.', 'O(n + u × L) buckets and count keys.'),
    note('Size-k Heap with Reversed Lexical Ties',
         'Keep the best k words in a min-heap whose root is the worst retained candidate: lowest frequency, or lexicographically largest among ties. Reverse the removal order to obtain the requested ranking.',
         'Count frequencies.|Push each word/frequency pair using the custom comparator.|Pop the worst candidate whenever the heap grows beyond k.|Pop remaining words and reverse the result.',
         'O(n + u log(k + 1) × L).', 'O(u × L + k) for counts and heap.', filename='692-2.py'))

add(693,
    note('Two-Bit-Shift Identity',
         'For an alternating binary pattern, shifting by two aligns every repeated bit except the leading one. XOR therefore leaves exactly one set bit, recognized by a & (a − 1) = 0.',
         'XOR n with n shifted right by two.|Test whether the result has exactly one set bit.|Return that test for the positive input.',
         'O(1) under the 32-bit input bound.', 'O(1) auxiliary space.'),
    note('Compare Adjacent Binary Digits',
         'Write the positive number in binary and ensure every adjacent pair differs.',
         'Convert n to binary without the prefix.|Compare neighboring characters.|Reject any equal pair.',
         'O(b) for b binary digits.', 'O(b) binary text.', r'''
         class Solution:
             def hasAlternatingBits(self, n: int) -> bool:
                 bits = bin(n)[2:]
                 return all(a != b for a, b in zip(bits, bits[1:]))
         '''))

add(696,
    note('Two Consecutive Run Lengths',
         'A valid substring spans exactly two adjacent runs of different bits. The number contributed by such a pair is the smaller run length, so only the current and previous run lengths are needed.',
         'Count the current equal-bit run.|On a bit change, add the minimum of the two completed neighboring run lengths.|Shift the run counters.|Add the last neighboring-run contribution.',
         'O(n).', 'O(1) auxiliary space.'),
    note('Run-Length Encoding Then Pairing',
         'Materialize all equal-bit run lengths, then sum the minimum of each adjacent pair. This separates identifying runs from counting valid substrings.',
         'Group consecutive equal bits.|Record each group length.|Sum minima of adjacent group lengths.',
         'O(n).', 'O(n) run lengths in the alternating worst case.', r'''
         from itertools import groupby

         class Solution:
             def countBinarySubstrings(self, s: str) -> int:
                 lengths = [sum(1 for _ in group) for _, group in groupby(s)]
                 return sum(min(a, b) for a, b in zip(lengths, lengths[1:]))
         '''))

add(697,
    note('Streaming Frequency and First Index',
         'A value determines a candidate span from its first occurrence to the current occurrence. Update the array degree as counts grow and minimize spans tied at that degree.',
         'Remember each value\'s first index.|Increment its frequency as the array is scanned.|Replace the answer when a new degree is reached.|Minimize the span for counts tying the degree.',
         'Expected O(n).', 'O(u) distinct-value state.'),
    note('Grouped Occurrence Positions',
         'Group all positions by value. Only values reaching the global degree matter, and their shortest covering span runs from their first to last occurrence.',
         'Collect each value\'s positions.|Find the largest occurrence-list length.|For all lists of that length, calculate last − first + 1.|Return the smallest span.',
         'Expected O(n).', 'O(n) stored positions.', r'''
         from collections import defaultdict

         class Solution:
             def findShortestSubArray(self, nums: list[int]) -> int:
                 positions = defaultdict(list)
                 for i, value in enumerate(nums):
                     positions[value].append(i)
                 degree = max(map(len, positions.values()))
                 return min(indices[-1] - indices[0] + 1 for indices in positions.values() if len(indices) == degree)
         '''))

add(702,
    note('Binary Search the Stated Index Bound',
         'The problem bounds the hidden array length by 10000 and returns a large sentinel beyond its end. Binary-search that known index range through the reader API, then check the located value.',
         'Search the index range from zero to 10000.|Compare reader.get(mid) with the target.|Narrow to the first value at least the target.|Verify equality before returning the index.',
         'O(log 10000) reader calls.', 'O(1) auxiliary space.',
         pitfalls=('This method relies on the problem\'s 10000-element upper bound and out-of-range sentinel.',)) ,
    note('Exponential Bracketing Then Binary Search',
         'Double the upper index until its value reaches or exceeds the target. The bracket is proportional to the target position rather than a predetermined maximum size.',
         'Start with upper index one.|Double it while the reader value is below the target.|Binary-search the resulting bracket.|Verify the final candidate value.',
         'O(log(p + 2)) reader calls for target or insertion position p.', 'O(1) auxiliary space.', r'''
         class Solution:
             def search(self, reader: 'ArrayReader', target: int) -> int:
                 low, high = 0, 1
                 while reader.get(high) < target:
                     low, high = high + 1, high * 2
                 while low < high:
                     middle = (low + high) // 2
                     if reader.get(middle) < target:
                         low = middle + 1
                     else:
                         high = middle
                 return low if reader.get(low) == target else -1
         '''))

add(714,
    note('Two Rolling Trading States',
         'Track the best cash after selling and the best balance while holding one share. Charge the fee when buying; each day offers a choice to keep a state or perform its allowed trade.',
         'Start with zero cash and an impossible holding balance.|Update the selling state from the prior holding balance.|Update holding from available cash minus price and fee.|Return the selling balance.',
         'O(n).', 'O(1) auxiliary space.',
         pitfalls=('Using the just-updated cash cannot improve a same-day rebuy because the fee is nonnegative.',)) ,
    note('Explicit Day-by-Day Trading Table',
         'Store cash and holding balances for every day, updating both only from the preceding day. Charge the fee on sale to make the transition accounting explicit.',
         'Initialize day-zero cash and holding values.|For each later day, choose between keeping cash and selling with the fee.|Choose between keeping a share and buying from prior cash.|Return the last cash state.',
         'O(n).', 'O(n) for both daily state arrays.', r'''
         class Solution:
             def maxProfit(self, prices: list[int], fee: int) -> int:
                 cash, holding = [0] * len(prices), [0] * len(prices)
                 holding[0] = -prices[0]
                 for day in range(1, len(prices)):
                     cash[day] = max(cash[day - 1], holding[day - 1] + prices[day] - fee)
                     holding[day] = max(holding[day - 1], cash[day - 1] - prices[day])
                 return cash[-1]
         '''))

add(717,
    note('Forward Character Decoding',
         'A zero starts a one-bit character, while a one starts a two-bit character. Advance by that deterministic width until reaching or passing the final bit.',
         'Start at index zero.|Before the last position, advance one for a zero or two for a one.|Accept if decoding lands exactly on the final position.',
         'O(n).', 'O(1) auxiliary space.'),
    note('Parity of Ones Before the Final Zero',
         'The final bit is guaranteed zero. Consecutive ones immediately before it pair off as two-bit characters; an odd count consumes the final zero, while an even count leaves it as one bit.',
         'Start just before the last zero.|Count consecutive preceding ones.|Return whether that count is even.',
         'O(n) worst case.', 'O(1) auxiliary space.', r'''
         class Solution:
             def isOneBitCharacter(self, bits: list[int]) -> bool:
                 index = len(bits) - 2
                 count = 0
                 while index >= 0 and bits[index] == 1:
                     count += 1
                     index -= 1
                 return count % 2 == 0
         '''))

add(718,
    note('Common-Suffix Table',
         'For each pair of starting indices, store the length of the equal contiguous run starting there. Equal values extend the diagonal successor state; unequal values give zero.',
         'Allocate a zero-bordered table.|Visit both arrays backward.|On equal values, set one plus the next diagonal entry.|Track the largest entry.',
         'O(mn).', 'O(mn) for the table.'),
    note('One-Row Common-Run States',
         'Only the next outer row is needed. Scan the first array backward and the second array forward so dp[j + 1] still contains the previous outer row\'s diagonal value.',
         'Allocate one zero-bordered row.|Visit the first array backward.|Visit the second array forward, extending dp[j + 1] on equality and resetting on mismatch.|Keep the largest state.',
         'O(mn).', 'O(n) for one row.', filename='718-2.py'))

add(720,
    note('Trie Traversal Through Complete Prefixes',
         'Insert all dictionary words into a trie, then descend only through nodes that are themselves complete words. Such a path guarantees every prefix needed to build its candidate exists.',
         'Insert words and store a terminal word at each ending node.|Search only children representing complete words.|Prefer a longer candidate.|Resolve equal lengths with lexicographic order.',
         'O(D + k × L) conservative bound for total dictionary characters D and k words of maximum length L.', 'O(D) trie and O(L) recursion.'),
    note('Sorted Words and Buildable Prefixes',
         'In lexicographic order, a word\'s immediate prefix appears before it. Add a word to the buildable set only if its prefix is already buildable, keeping the first word at each best length.',
         'Seed the buildable set with the empty string.|Visit words in sorted order.|Accept a word when its all-but-last-character prefix is buildable.|Replace the answer only on a longer word.',
         'O(k log k × L + D) conservative string-comparison bound.', 'O(D) buildable words and sorted references.', r'''
         class Solution:
             def longestWord(self, words: list[str]) -> str:
                 buildable, best = {''}, ''
                 for word in sorted(words):
                     if word[:-1] in buildable:
                         buildable.add(word)
                         if len(word) > len(best):
                             best = word
                 return best
         '''))

add(722,
    note('Comment-State Scanner',
         'Track whether a block comment is active while scanning lines. Outside blocks, a line comment discards the rest of its line; a block comment may span lines and concatenate surviving code on either side.',
         'Scan each line while retaining block-comment state.|Recognize opening and closing block markers.|Stop a line on // only outside a block.|Emit nonempty accumulated code when no block remains open.',
         'O(L²) conservative bound for Python immutable-string accumulation; O(L) character scanning.', 'O(L) accumulated code and output.',
         pitfalls=('Do not interpret // inside a block as a line comment.', 'Removing a multiline block can join code from different source lines.')),
    note('Ordered Comment-Token Removal',
         'On the complete newline-joined source, match a block comment or a line comment at its first opening marker. Non-greedy block matching stops at the first closing marker; line matching stops before a newline.',
         'Join source lines with newline characters.|Remove block comments and line comments with one ordered regular expression.|Split the remaining text into lines.|Discard empty lines while preserving nonempty whitespace.',
         'O(L²) conservative regular-expression search bound.', 'O(L) joined and filtered text.', r'''
         import re

         class Solution:
             def removeComments(self, source: list[str]) -> list[str]:
                 text = '\n'.join(source)
                 cleaned = re.sub(r'/\*.*?\*/|//[^\n]*', '', text, flags=re.DOTALL)
                 return [line for line in cleaned.split('\n') if line]
         '''))

add(728,
    note('Decimal-String Digit Checks',
         'A number is self-dividing when every decimal digit is nonzero and divides the original value. Check each candidate\'s string digits directly.',
         'Visit every number in the inclusive range.|Convert it into decimal digits.|Reject zero digits and nondividing digits.|Collect candidates passing every test.',
         'O(R × d) bounded-integer operations for R candidates and maximum d digits.', 'O(d) temporary digit text, excluding output.'),
    note('Arithmetic Digit Extraction',
         'Repeated remainder and division by ten expose every digit without converting the candidate to text.',
         'Copy each candidate into a working value.|Extract its last digit.|Reject zero or a digit that does not divide the original number.|Remove that digit and continue until all pass.',
         'O(R × d) bounded-integer operations.', 'O(1) auxiliary space, excluding output.', r'''
         class Solution:
             def selfDividingNumbers(self, left: int, right: int) -> list[int]:
                 result = []
                 for number in range(left, right + 1):
                     working = number
                     while working:
                         digit = working % 10
                         if digit == 0 or number % digit:
                             break
                         working //= 10
                     if working == 0:
                         result.append(number)
                 return result
         '''))

add(737,
    note('Similarity Graph Search',
         'Similarity pairs form an undirected graph, and transitive similarity is graph connectivity. For each unequal word pair, search for a path between them.',
         'Reject sentences of different lengths.|Build the undirected word graph.|Skip equal word pairs.|Search the graph for every remaining pair and reject any disconnected pair.',
         'O(P + q × (V + P)) for P pairs, V graph words, and q sentence positions.', 'O(V + P) graph and traversal state.'),
    note('Union-Find Word Components',
         'Union all directly similar words once. Path-compressed component lookups then answer every sentence-position comparison.',
         'Reject different sentence lengths.|Create parent and size records for words.|Union every similarity pair by component size.|Accept each position only when the words are equal or share a component.',
         'Expected O((P + q) × α(V)) component operations, plus word hashing.', 'O(V) parent and size maps.', r'''
         class Solution:
             def areSentencesSimilarTwo(self, sentence1: list[str], sentence2: list[str], similarPairs: list[list[str]]) -> bool:
                 if len(sentence1) != len(sentence2):
                     return False
                 parent, sizes = {}, {}
                 def find(word):
                     parent.setdefault(word, word)
                     sizes.setdefault(word, 1)
                     while word != parent[word]:
                         parent[word] = parent[parent[word]]
                         word = parent[word]
                     return word
                 for a, b in similarPairs:
                     a, b = find(a), find(b)
                     if a != b:
                         if sizes[a] < sizes[b]:
                             a, b = b, a
                         parent[b] = a
                         sizes[a] += sizes[b]
                 return all(a == b or find(a) == find(b) for a, b in zip(sentence1, sentence2))
         '''))

add(744,
    note('Upper-Bound Binary Search',
         'The letters are sorted. Find the first index strictly greater than the target; if none exists, wrap to the first letter.',
         'Binary-search the upper bound of the target.|Wrap the insertion index modulo the list length.|Return that letter.',
         'O(log n).', 'O(1) auxiliary space.'),
    note('First-Greater Linear Scan',
         'Sorted order makes the first letter greater than the target the answer. Falling off the scan means the answer wraps around.',
         'Visit letters in order.|Return the first letter greater than target.|Return the first list element when none is greater.',
         'O(n).', 'O(1) auxiliary space.', r'''
         class Solution:
             def nextGreatestLetter(self, letters: list[str], target: str) -> str:
                 for letter in letters:
                     if letter > target:
                         return letter
                 return letters[0]
         '''))

add(747,
    note('Largest and Second-Largest Values',
         'Only the second-largest value can violate the largest-at-least-double rule. Track both extrema and the largest value\'s original index in one pass.',
         'Maintain the largest and second-largest values.|Update the largest index whenever a new maximum appears.|Compare the maximum with twice the second maximum.|Return its index or −1.',
         'O(n).', 'O(1) auxiliary space.'),
    note('Sort Value-Index Pairs',
         'Sort the values together with their original indices. Compare the top two values, then return the stored original index if the rule holds.',
         'Create value/index pairs.|Sort them.|Handle a single value directly.|Compare the last value with twice the preceding value.',
         'O(n log n).', 'O(n) pairs and sorting storage.', r'''
         class Solution:
             def dominantIndex(self, nums: list[int]) -> int:
                 ordered = sorted((value, i) for i, value in enumerate(nums))
                 if len(ordered) == 1 or ordered[-1][0] >= 2 * ordered[-2][0]:
                     return ordered[-1][1]
                 return -1
         '''))

add(748,
    note('Required-Letter Frequency Checks',
         'Ignore digits and spaces in the plate, count its lowercase letters, and require each candidate word to supply those multiplicities. Replace the answer only with a shorter match to preserve the first tie.',
         'Count case-normalized plate letters.|Count each candidate\'s letters.|Check that every required multiplicity is available.|Keep the shortest qualifying word, preserving input order on ties.',
         'O(P + W) for plate length P and total candidate characters W, with a fixed alphabet.', 'O(1) alphabet counts, excluding input and returned word.'),
    note('Length-Ordered Character Consumption',
         'Visit candidates in stable increasing-length order. For each, remove one matching character for every required plate letter; the first fully consumed requirement is the answer.',
         'Collect lowercase plate letters, retaining repeats.|Stable-sort candidates by length.|Copy a candidate\'s character list and remove each required letter once.|Return the first candidate satisfying every removal.',
         'O(k log k + P × W) conservative bound for k candidates.', 'O(k + P + L) temporary storage for maximum candidate length L.', r'''
         class Solution:
             def shortestCompletingWord(self, licensePlate: str, words: list[str]) -> str:
                 required = [char.lower() for char in licensePlate if char.isalpha()]
                 for word in sorted(words, key=len):
                     available = list(word)
                     for char in required:
                         if char not in available:
                             break
                         available.remove(char)
                     else:
                         return word
                 return ''
         '''))

add(754,
    note('Grow the Triangular Sum Until Parity Matches',
         'After k moves, the maximum positive reach is k(k + 1)/2. Reversing chosen moves changes that sum by an even amount, so the first sufficiently large triangular sum with the target\'s parity is optimal.',
         'Use the absolute target by symmetry.|Increase the move count until its triangular sum reaches the target.|Continue until their difference is even.|Return the move count.',
         'O(sqrt(abs(target))) bounded-integer steps.', 'O(1) auxiliary space.'),
    note('Integer-Root Starting Point',
         'Solve the triangular inequality with an integer square root to jump near the minimum move count, then adjust only until both reach and parity conditions hold.',
         'Take the absolute target.|Estimate k from integer sqrt(8 × target + 1).|Increment k until k(k + 1)/2 is large enough and differs by an even amount.|Return k.',
         'O(1) bounded-domain root operation and at most a constant number of corrections.', 'O(1) auxiliary space.', r'''
         from math import isqrt

         class Solution:
             def reachNumber(self, target: int) -> int:
                 target = abs(target)
                 steps = (isqrt(8 * target + 1) - 1) // 2
                 while steps * (steps + 1) // 2 < target or (steps * (steps + 1) // 2 - target) % 2:
                     steps += 1
                 return steps
         '''))

add(756,
    note('Row-Building Backtracking',
         'Each adjacent pair in a row permits a set of blocks above it. Backtrack while building the next row, then recurse on that row until reaching the single top block.',
         'Group allowed upper blocks by their two-block base.|Build the next row one position at a time.|On completing a row, recurse upward.|Accept any path reaching a one-character row.',
         'O(A^(b(b − 1)/2)) loose upper bound for alphabet size A and bottom width b.', 'O(b²) live row strings and recursion.'),
    note('Memoized Complete-Row States',
         'Different lower constructions may produce the same next row. Cache whether each complete row can reach the top, while a generator enumerates its valid successor rows.',
         'Map each adjacent pair to allowed upper characters.|Memoize the result for each complete row.|Generate successor rows position by position.|Accept if any generated row can reach the top.',
         'O(sum from r=2 to b of r × A^(2r − 1)) loose bound covering cached rows and successor enumeration.', 'O(b × A^b + b²) loose cache and recursion bound.', r'''
         from collections import defaultdict
         from functools import cache

         class Solution:
             def pyramidTransition(self, bottom: str, allowed: list[str]) -> bool:
                 choices = defaultdict(list)
                 for a, b, c in allowed:
                     choices[a + b].append(c)
                 @cache
                 def possible(row):
                     if len(row) == 1:
                         return True
                     def build(index, path):
                         if index == len(row) - 1:
                             return possible(path)
                         return any(build(index + 1, path + char)
                                    for char in choices[row[index:index + 2]])
                     return build(0, '')
                 return possible(bottom)
         '''))

add(766,
    note('Adjacent Diagonal Comparisons',
         'Every diagonal is constant exactly when each cell agrees with its lower-right neighbor wherever both exist.',
         'Visit cells outside the final row and column.|Compare each with its lower-right neighbor.|Reject a mismatch and otherwise accept.',
         'O(mn).', 'O(1) auxiliary space.'),
    note('Diagonal-ID Map',
         'Cells on the same top-left to bottom-right diagonal share row − column. Store the first value for each diagonal ID and compare later cells against it.',
         'Compute row − column for every cell.|Record the first value for a new ID.|Reject a differing value under an existing ID.',
         'Expected O(mn).', 'O(m + n) diagonal values.', r'''
         class Solution:
             def isToeplitzMatrix(self, matrix: list[list[int]]) -> bool:
                 diagonals = {}
                 for row, values in enumerate(matrix):
                     for column, value in enumerate(values):
                         key = row - column
                         if key in diagonals and diagonals[key] != value:
                             return False
                         diagonals[key] = value
                 return True
         '''))

add(769,
    note('Prefix Maximum Boundaries',
         'The input is a permutation of 0 through n − 1. A prefix ending at index i can be sorted independently exactly when its maximum is i, meaning it contains every value zero through i.',
         'Track the running maximum.|At each index i, compare that maximum with i.|Count a chunk boundary on equality.',
         'O(n).', 'O(1) auxiliary space.',
         pitfalls=('The permutation constraint is essential; duplicates require a different criterion.',)) ,
    note('Prefix Sum Boundaries',
         'For i + 1 distinct nonnegative values, the smallest possible sum is 0 + … + i. Equality means the prefix contains exactly that smallest set, so it can end a chunk.',
         'Accumulate the permutation\'s prefix sum.|Compare it with i(i + 1)/2 at every index.|Count each equality as a chunk boundary.',
         'O(n).', 'O(1) auxiliary space.', r'''
         class Solution:
             def maxChunksToSorted(self, arr: list[int]) -> int:
                 total = chunks = 0
                 for i, value in enumerate(arr):
                     total += value
                     if total == i * (i + 1) // 2:
                         chunks += 1
                 return chunks
         '''))

add(775,
    note('Detect Nonlocal Inversions',
         'Every local inversion is global. Equality of their counts therefore means there is no inversion spanning at least two positions. A running prefix maximum detects exactly those forbidden pairs.',
         'Track the maximum through index i.|Compare it against the value at i + 2.|Reject if the maximum is larger.|Accept when no nonlocal inversion exists.',
         'O(n).', 'O(1) auxiliary space.'),
    note('Permutation Displacement Bound',
         'For a permutation of 0 through n − 1, the absence of nonlocal inversions is equivalent to every value lying at most one position from its sorted index.',
         'Visit each index and value.|Reject an absolute displacement greater than one.|Otherwise accept.',
         'O(n).', 'O(1) auxiliary space.', filename='775-2.py'))

add(776,
    note('Recursive Split Along the Search Path',
         'Only the search path toward the target crosses the partition. Recursively split that child, reconnect the matching piece, and leave the opposite subtree unchanged.',
         'Return two empty trees for an empty root.|For a root above target, split its left child and retain the larger piece as its new left child.|Otherwise split its right child and retain the smaller piece as its new right child.|Return both partition roots.',
         'O(h) for tree height h.', 'O(h) recursion space.',
         pitfalls=('Values equal to target belong in the first tree.', 'Reuse the original nodes and preserve links within each partition.')),
    note('Iterative Two-Chain Split',
         'Follow the same search path, appending nodes to a small-value right chain or a large-value left chain. Off-path subtrees already belong entirely to their node\'s partition.',
         'Create dummy roots for the two result chains.|Append a value at most target to the small chain and follow its original right child.|Append a larger value to the large chain and follow its original left child.|Terminate both boundary chains and return their roots.',
         'O(h).', 'O(1) auxiliary space, reusing original nodes.', r'''
         class Solution:
             def splitBST(self, root: 'TreeNode', target: int) -> list['TreeNode']:
                 small_dummy, large_dummy = TreeNode(0), TreeNode(0)
                 small, large = small_dummy, large_dummy
                 while root:
                     if root.val <= target:
                         small.right = root
                         small = root
                         root = root.right
                     else:
                         large.left = root
                         large = root
                         root = root.left
                 small.right = None
                 large.left = None
                 return [small_dummy.right, large_dummy.left]
         '''))

add(777,
    note('Ordered Pieces with Direction Constraints',
         'Deleting X must leave the same L/R sequence because pieces never cross. Then each L may move only left and each R only right, which paired indices can verify.',
         'Compare both strings after removing X.|Advance two pointers to the next non-X piece.|Reject L moving right or R moving left.|Accept when all ordered pieces satisfy their direction constraints.',
         'O(n).', 'O(n) for strings with X removed.'),
    note('Materialized Piece Positions',
         'Collect each nonempty piece and its position in both strings. Compare these aligned records directly for matching order and permitted movement.',
         'Build lists of character/index pairs excluding X.|Require the same number of pieces.|Compare each paired character.|Require a target L index no larger than its start, or a target R index no smaller.',
         'O(n).', 'O(n) piece records.', r'''
         class Solution:
             def canTransform(self, start: str, end: str) -> bool:
                 original = [(char, i) for i, char in enumerate(start) if char != 'X']
                 target = [(char, i) for i, char in enumerate(end) if char != 'X']
                 if len(original) != len(target):
                     return False
                 for (char, i), (other, j) in zip(original, target):
                     if char != other or (char == 'L' and j > i) or (char == 'R' and j < i):
                         return False
                 return True
         '''))

add(781,
    note('Allocate Answer-Sized Groups Online',
         'A rabbit answering x belongs to a color group of x + 1 rabbits. Every first observed member of a fresh group forces that entire group into the minimum total.',
         'Count observations for each answer.|Before adding a new observation, detect whether its current group is full.|Allocate x + 1 rabbits when a new group begins.|Increment the observed count.',
         'Expected O(n).', 'O(u) distinct answers.'),
    note('Round Frequencies Up to Whole Groups',
         'For each answer x appearing f times, at least ceiling(f/(x + 1)) color groups are required. Multiply that group count by x + 1 and sum.',
         'Count each answer frequency.|Compute its group size x + 1.|Round the frequency up to a multiple of that group size.|Add all rounded counts.',
         'Expected O(n).', 'O(u) counts.', r'''
         from collections import Counter

         class Solution:
             def numRabbits(self, answers: list[int]) -> int:
                 return sum((count + answer) // (answer + 1) * (answer + 1)
                            for answer, count in Counter(answers).items())
         '''))

add(788,
    note('Validate Each Rotated Number',
         'Digits 0, 1, and 8 remain unchanged; 2, 5, 6, and 9 change; 3, 4, and 7 are invalid. A good number uses only valid digits and contains at least one changing digit.',
         'Enumerate numbers one through n.|Reject a number containing 3, 4, or 7.|Track whether any digit changes under rotation.|Count numbers that remain valid and change.',
         'O(n log n) decimal-digit checks.', 'O(log n) temporary text.'),
    note('Digit Dynamic Programming',
         'Count valid digit prefixes under n while tracking whether the number has started and whether a changing digit has appeared. Tight prefixes obey n\'s current digit; smaller prefixes can use any digit.',
         'Read n\'s decimal digits.|Memoize position, tightness, started status, and changed status.|Try valid rotational digits, allowing leading zeros without starting a number.|Count completed positive numbers with at least one changed digit.',
         'O(log n) states up to fixed digit and flag factors.', 'O(log n) memo and recursion.', r'''
         from functools import cache

         class Solution:
             def rotatedDigits(self, n: int) -> int:
                 digits = tuple(map(int, str(n)))
                 @cache
                 def count(position, tight, started, changed):
                     if position == len(digits):
                         return int(started and changed)
                     limit = digits[position] if tight else 9
                     total = 0
                     for digit in [0, 1, 2, 5, 6, 8, 9]:
                         if digit <= limit:
                             total += count(position + 1, tight and digit == limit,
                                            started or digit != 0,
                                            changed or digit in (2, 5, 6, 9))
                     return total
                 return count(0, True, False, False)
         '''))

add(790,
    note('Full-Board Tiling Recurrence',
         'Domino and tromino tilings satisfy F(n) = 2F(n − 1) + F(n − 3), with initial counts one, two, and five for widths one, two, and three. Store preceding counts and reduce each step modulo 10^9 + 7.',
         'Initialize the first three nonempty widths.|Apply the recurrence from width four onward.|Reduce every entry modulo 10^9 + 7.|Return the requested width.',
         'O(n) arithmetic operations.', 'O(n) states after adapting the source\'s fixed upper-bound allocation.'),
    note('Full and One-Gap Profile States',
         'Track complete boards and a board with one specified corner missing. A full board extends a previous full board by a vertical domino, a two-columns-earlier full board by horizontal dominoes, or either gap profile by a tromino.',
         'Initialize full counts for widths zero and one and a zero gap count.|Compute the next full count as previous full + two-back full + twice the previous gap.|Update the gap count as previous gap + two-back full.|Roll the states modulo 10^9 + 7.',
         'O(n).', 'O(1) auxiliary space.', r'''
         class Solution:
             def numTilings(self, n: int) -> int:
                 if n <= 1:
                     return 1
                 two_back, full, gap = 1, 1, 0
                 modulus = 1_000_000_007
                 for _ in range(2, n + 1):
                     next_full = (full + two_back + 2 * gap) % modulus
                     gap = (gap + two_back) % modulus
                     two_back, full = full, next_full
                 return full
         '''))

add(792,
    note('Dictionary Trie and Next-Character Search',
         'A trie shares prefixes among candidate words and stores duplicate counts at terminals. Traverse each trie edge by locating its character after the current position in s, accumulating reachable terminal counts.',
         'Insert all words into a trie and count duplicate terminals.|At each node, add its terminal count.|For each child character, search for its next occurrence after the current s position.|Recurse only when the character can be matched.',
         'O(W + n × T) upper bound for total word text W, source length n, and trie nodes T.', 'O(W) trie and O(L) recursion for maximum word length L.'),
    note('Buckets of Waiting Word Positions',
         'Group each word by the next character it needs. When reading a source character, advance only the words waiting for it; detach that bucket first so one source character cannot satisfy two positions in the same word.',
         'Place every word at its first required-character bucket.|Read s left to right.|Detach and clear the matching bucket before advancing its word positions.|Count completed words or enqueue their next required positions.',
         'O(n + W).', 'O(k) waiting positions for k words.', filename='792-2.py'))

add(795,
    note('Last Forbidden and Last Required Positions',
         'For each right endpoint, valid starts lie after the latest value above right and at or before the latest value at least left. Their index difference counts valid subarrays ending here.',
         'Track the last index exceeding right.|Track the last index at least left.|Update both markers as values arrive.|Add the second marker minus the first.',
         'O(n).', 'O(1) auxiliary space.'),
    note('Difference of At-Most Counts',
         'Subarrays whose maximum lies in [left, right] equal those with maximum at most right minus those with maximum at most left − 1. Count each at-most class using runs of allowed values.',
         'Count subarrays entirely formed by values at most right.|Count those entirely formed by values below left.|For each bound, extend or reset an allowed-value run and add its length.|Subtract the two counts.',
         'O(n).', 'O(1) auxiliary space.', r'''
         class Solution:
             def numSubarrayBoundedMax(self, nums: list[int], left: int, right: int) -> int:
                 def at_most(limit):
                     run = total = 0
                     for value in nums:
                         run = run + 1 if value <= limit else 0
                         total += run
                     return total
                 return at_most(right) - at_most(left - 1)
         '''))

add(797,
    note('Depth-First Path Enumeration',
         'The graph is a DAG, so following every outgoing edge from the source enumerates all source-to-target paths without a cycle guard. Store a copied path at each branch.',
         'Start from node zero with path [0].|Record the path on reaching the final node.|Otherwise recurse on each outgoing neighbor with that neighbor appended.',
         'O(n × 2^n) loose upper bound including copied and returned paths.', 'O(n²) live copied paths in recursion, excluding output.'),
    note('Breadth-First Partial Paths',
         'Use a queue of unfinished paths. Expand the last node of each path, recording complete target paths and enqueuing the rest.',
         'Enqueue the initial source path.|Pop a partial path.|Record it if its last node is the target.|Otherwise append each outgoing neighbor in a copied path.',
         'O(n × 2^n) loose upper bound.', 'O(n × 2^n) queued and returned path storage.', r'''
         from collections import deque

         class Solution:
             def allPathsSourceTarget(self, graph: list[list[int]]) -> list[list[int]]:
                 queue, result = deque([[0]]), []
                 while queue:
                     path = queue.popleft()
                     if path[-1] == len(graph) - 1:
                         result.append(path)
                     else:
                         for neighbor in graph[path[-1]]:
                             queue.append(path + [neighbor])
                 return result
         '''))

add(807,
    note('Precomputed Row and Column Skylines',
         'A building can rise to the smaller of its row maximum and column maximum. Raising it to that cap preserves both skyline views, and independent cell increases can be summed.',
         'Compute every row maximum.|Compute every column maximum.|For each cell, find the smaller skyline bound.|Sum that cap minus the current height.',
         'O(mn).', 'O(m + n) skyline arrays.'),
    note('Recompute Each Cell\'s Skyline Bounds',
         'Apply the same per-cell cap directly by rescanning its row and column. This makes the redundant work removed by precomputation visible.',
         'Visit each cell.|Scan its row and column for their maxima.|Subtract the cell height from the smaller maximum.|Add all independent increases.',
         'O(mn × (m + n)).', 'O(1) auxiliary space.', r'''
         class Solution:
             def maxIncreaseKeepingSkyline(self, grid: list[list[int]]) -> int:
                 total = 0
                 for row in range(len(grid)):
                     for col in range(len(grid[0])):
                         row_max = max(grid[row])
                         col_max = max(grid[r][col] for r in range(len(grid)))
                         total += min(row_max, col_max) - grid[row][col]
                 return total
         ''', baseline=True))

add(809,
    note('Character Scan with Stretchable Runs',
         'Match each candidate word against s. An unmatched repeated character in s may be skipped only when it belongs to a run of at least three, making that run stretchable.',
         'Scan s while advancing a candidate pointer on equal characters.|Allow unmatched characters inside a length-at-least-three repeated run.|Reject any other mismatch.|Require the entire candidate to be consumed.',
         'O(k × n) for k candidate words and source length n.', 'O(1) per-candidate auxiliary space.'),
    note('Run-Length Encoded Word Comparison',
         'Encode s and each candidate as character/run-length pairs. Matching runs need equal characters, no longer candidate run, and exact equality whenever the source run is shorter than three.',
         'Run-length encode s.|Encode each candidate.|Require the same run-character sequence.|Accept each pair when lengths are equal or the source run is at least three and no shorter.',
         'O(n + W) for total candidate text W.', 'O(n + L) temporary runs for maximum candidate length L.', r'''
         from itertools import groupby

         class Solution:
             def expressiveWords(self, s: str, words: list[str]) -> int:
                 def encode(word):
                     return [(char, sum(1 for _ in group)) for char, group in groupby(word)]
                 target = encode(s)
                 total = 0
                 for word in words:
                     runs = encode(word)
                     if len(runs) == len(target) and all(a == b and (x == y or x >= 3 and x >= y)
                                                        for (a, x), (b, y) in zip(target, runs)):
                         total += 1
                 return total
         '''))

add(811,
    note('Count Every Domain Suffix',
         'A visit to a domain also visits each parent suffix. Split the name into labels and add its count to every suffix name.',
         'Parse the count and domain.|Split the domain labels.|Join each suffix and increment its total.|Format every accumulated domain count.',
         'O(sum of domain-length²) conservative suffix-copy bound.', 'O(T) stored suffix text, plus output.'),
    note('Reversed-Label Trie',
         'Insert domains from their top-level label inward. Every visited trie node corresponds to a parent domain and accumulates that domain\'s visits.',
         'Parse each count and reverse its domain labels.|Walk or create one trie node per label.|Add the visit count at every traversed node.|Traverse the trie to reconstruct and format full suffix names.',
         'O(L + T) for input label text L and total returned domain text T.', 'O(L + T) trie and output construction.', r'''
         class Solution:
             def subdomainVisits(self, cpdomains: list[str]) -> list[str]:
                 root = {'children': {}, 'count': 0}
                 for entry in cpdomains:
                     count, domain = entry.split()
                     node = root
                     for label in reversed(domain.split('.')):
                         node = node['children'].setdefault(label, {'children': {}, 'count': 0})
                         node['count'] += int(count)
                 result = []
                 stack = [(node, label) for label, node in root['children'].items()]
                 while stack:
                     node, domain = stack.pop()
                     result.append(f'{node["count"]} {domain}')
                     stack.extend((child, label + '.' + domain) for label, child in node['children'].items())
                 return result
         '''))

add(814,
    note('Recursive Bottom-Up Pruning',
         'Prune both child subtrees first. A zero-valued node with no surviving children contains no one and can then be removed.',
         'Return null for an empty subtree.|Recursively replace both children with their pruned results.|Remove a zero node whose children are both null.|Otherwise keep the node.',
         'O(n).', 'O(h) recursion space.'),
    note('Iterative Postorder Pruning',
         'Use an explicit postorder stack and remember whether each processed subtree contains a one. Remove a child link when that child\'s completed subtree contains none.',
         'Schedule each node after its children.|Read the children\'s contains-one flags.|Clear links to children whose flags are false.|Keep the root only when its final flag is true.',
         'O(n).', 'O(n) flags and traversal state.', r'''
         class Solution:
             def pruneTree(self, root: 'TreeNode') -> 'TreeNode':
                 if not root:
                     return None
                 stack, contains = [(root, False)], {None: False}
                 while stack:
                     node, ready = stack.pop()
                     if ready:
                         left, right = contains[node.left], contains[node.right]
                         contains[node] = node.val == 1 or left or right
                         if not left:
                             node.left = None
                         if not right:
                             node.right = None
                     else:
                         stack.append((node, True))
                         stack.extend((child, False) for child in (node.left, node.right) if child)
                 return root if contains[root] else None
         '''))

add(841,
    note('Recursive Key Graph Traversal',
         'Rooms form a directed graph and each key is an outgoing edge. Starting at room zero, mark every room reachable by recursively following its keys.',
         'Mark room zero visited.|Recursively follow keys leading to unvisited rooms.|Require every room to be marked at the end.',
         'O(r + k) for r rooms and k listed keys.', 'O(r) visited state and recursion.'),
    note('Breadth-First Key Queue',
         'Explore reachable rooms with a queue. Mark a room when enqueuing it so duplicate keys cannot schedule repeated visits.',
         'Enqueue room zero and mark it visited.|Pop a room and inspect all its keys.|Enqueue newly discovered rooms.|Compare the visited count with the room count.',
         'O(r + k).', 'O(r) visited set and queue.', r'''
         from collections import deque

         class Solution:
             def canVisitAllRooms(self, rooms: list[list[int]]) -> bool:
                 queue, seen = deque([0]), {0}
                 while queue:
                     for key in rooms[queue.popleft()]:
                         if key not in seen:
                             seen.add(key)
                             queue.append(key)
                 return len(seen) == len(rooms)
         '''))
