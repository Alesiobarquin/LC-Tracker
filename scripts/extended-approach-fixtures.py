"""Independent finite examples for extended-catalog teaching approaches.

The expected answers are fixed examples, not results calculated by another
bundled solution. Keep exponential baselines on small inputs. Structural and
stateful contracts live in check_special rather than comparing object identity.
"""
from collections import Counter, deque
import copy
from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]
CORE = runpy.run_path(str(ROOT / 'scripts/verify-approach-references.py'))
TreeNode, ListNode = CORE['TreeNode'], CORE['ListNode']
linked, list_values, tree_values = (CORE[k] for k in ['linked', 'list_values', 'tree_values'])


def tree(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    parents = deque([root])
    index = 1
    while parents and index < len(values):
        parent = parents.popleft()
        for side in ['left', 'right']:
            if index < len(values) and values[index] is not None:
                child = TreeNode(values[index])
                setattr(parent, side, child)
                parents.append(child)
            index += 1
    return root


CASES = {
    **CORE['CASES'],
    'append-characters-to-string-to-make-subsequence': ('appendCharacters', [(('coaching', 'coding'), 4), (('abc', 'a'), 0), (('z', 'abc'), 3)]),
    'arithmetic-slices-ii-subsequence': ('numberOfArithmeticSlices', [(([2,4,6,8,10],), 7), (([7,7,7,7,7],), 16)]),
    'armstrong-number': ('isArmstrong', [((153,), True), ((123,), False), ((0,), True)]),
    'arranging-coins': ('arrangeCoins', [((5,), 2), ((8,), 3), ((1,), 1)]),
    'as-far-from-land-as-possible': ('maxDistance', [(([[1,0,1],[0,0,0],[1,0,1]],), 2), (([[0,0],[0,0]],), -1), (([[1]],), -1)]),
    'assign-cookies': ('findContentChildren', [(([1,2,3],[1,1]), 1), (([1,2],[1,2,3]), 2)]),
    'backspace-string-compare': ('backspaceCompare', [(('ab#c','ad#c'), True), (('a#c','b'), False), (('a##c','#a#c'), True)]),
    'basic-calculator-ii': ('calculate', [(('3+2*2',), 7), ((' 3/2 ',), 1), (('14-3/2',), 13)]),
    'basic-calculator-iii': ('calculate', [(('2*(5+5*2)/3+(6/2+8)',), 21), (('(2+6*3+5-(3*14/7+2)*5)+3',), -12)]),
    'best-team-with-no-conflicts': ('bestTeamScore', [(([1,3,5,10,15],[1,2,3,4,5]), 34), (([4,5,6,5],[2,1,2,1]), 16)]),
    'binary-subarrays-with-sum': ('numSubarraysWithSum', [(([1,0,1,0,1],2), 4), (([0,0,0],0), 6)]),
    'binary-tree-longest-consecutive-sequence': ('longestConsecutive', [((tree([1,None,3,2,4,None,None,None,5]),), 3), ((tree([1]),), 1)]),
    'binary-tree-postorder-traversal': ('postorderTraversal', [((tree([1,None,2,3]),), [3,2,1]), ((None,), [])]),
    'binary-tree-preorder-traversal': ('preorderTraversal', [((tree([1,None,2,3]),), [1,2,3]), ((None,), [])]),
    'binary-tree-vertical-order-traversal': ('verticalOrder', [((tree([3,9,20,None,None,15,7]),), [[9],[3,15],[20],[7]]), ((None,), [])]),
    'bitwise-and-of-numbers-range': ('rangeBitwiseAnd', [((5,7), 4), ((0,0), 0), ((8,15), 8)]),
    'boats-to-save-people': ('numRescueBoats', [(([3,2,2,1],3), 3), (([1,2],3), 1)]),
    'boundary-of-binary-tree': ('boundaryOfBinaryTree', [((tree([1,None,2,3,4]),), [1,3,4,2]), ((tree([1]),), [1])]),
    'brace-expansion': ('expand', [(('{a,b}c{d,e}f',), ['acdf','acef','bcdf','bcef']), (('abcd',), ['abcd'])]),
    'brick-wall': ('leastBricks', [(([[1,2,2,1],[3,1,2],[1,3,2],[2,4],[3,1,2],[1,3,1,1]],), 2), (([[1],[1],[1]],), 3)]),
    'buildings-with-an-ocean-view': ('findBuildings', [(([4,2,3,1],), [0,2,3]), (([2,2,2],), [2])]),
    'bus-routes': ('numBusesToDestination', [(([[1,2,7],[3,6,7]],1,6), 2), (([[1,2]],1,1), 0), (([[1,2],[3,4]],1,4), -1)]),
    'buy-two-chocolates': ('buyChoco', [(([1,2,2],3), 0), (([3,2,3],3), 3)]),
    'calculate-money-in-leetcode-bank': ('totalMoney', [((4,), 10), ((10,), 37), ((20,), 96)]),
    'campus-bikes': ('assignBikes', [(([[0,0],[2,1]],[[1,2],[3,3]]), [1,0]), (([[0,0],[1,1]],[[1,0],[2,2]]), [0,1])]),
    'capacity-to-ship-packages-within-d-days': ('shipWithinDays', [(([1,2,3,4,5,6,7,8,9,10],5), 15), (([3,2,2,4,1,4],3), 6)]),
    'champagne-tower': ('champagneTower', [((1,1,1), 0.0), ((2,1,1), 0.5), ((4,2,1), 0.5)]),
    'check-completeness-of-a-binary-tree': ('isCompleteTree', [((tree([1,2,3,4,5,6]),), True), ((tree([1,2,3,4,5,None,7]),), False)]),
    'check-if-a-number-is-majority-element-in-a-sorted-array': ('isMajorityElement', [(([2,4,5,5,5,5,5,6,6],5), True), (([1,1,2,2],1), False)]),
    'check-if-a-string-contains-all-binary-codes-of-size-k': ('hasAllCodes', [(('00110110',2), True), (('0110',2), False)]),
    'check-if-array-is-sorted-and-rotated': ('check', [(([3,4,5,1,2],), True), (([2,1,3,4],), False), (([1,1,1],), True)]),
    'check-if-there-is-a-valid-partition-for-the-array': ('validPartition', [(([4,4,4,5,6],), True), (([1,1,1,2],), False), (([7,7],), True)]),
    'check-if-two-string-arrays-are-equivalent': ('arrayStringsAreEqual', [((['ab','c'],['a','bc']), True), ((['a','cb'],['ab','c']), False)]),
    'cherry-pickup-ii': ('cherryPickup', [(([[3,1,1],[2,5,1],[1,5,5],[2,1,1]],), 24), (([[1,1],[1,1]],), 4)]),
    'cherry-pickup': ('cherryPickup', [(([[0,1,-1],[1,0,-1],[1,1,1]],), 5), (([[1,-1],[-1,1]],), 0)]),
    'circular-sentence': ('isCircularSentence', [(('leetcode exercises sound delightful',), True), (('Leetcode is cool',), False)]),
    'closest-binary-search-tree-value-ii': ('closestKValues', [((tree([4,2,5,1,3]),3.714286,2), [3,4]), ((tree([1]),0.0,1), [1])]),
    'closest-binary-search-tree-value': ('closestValue', [((tree([4,2,5,1,3]),3.714286), 4), ((tree([1]),4.4), 1)]),
    'confusing-number': ('confusingNumber', [((6,), True), ((89,), True), ((11,), False), ((25,), False), ((0,), False)]),
    'constrained-subsequence-sum': ('constrainedSubsetSum', [(([10,2,-10,5,20],2), 37), (([-1,-2,-3],1), -1)]),
    'construct-string-from-binary-tree': ('tree2str', [((tree([1,2,3,4]),), '1(2(4))(3)'), ((tree([1,None,2]),), '1()(2)')]),
    'contiguous-array': ('findMaxLength', [(([0,1,0],), 2), (([1,1],), 0)]),
    'continuous-subarray-sum': ('checkSubarraySum', [(([23,2,4,6,7],6), True), (([23,2,6,4,7],13), False), (([0,0],1), True)]),
    'count-all-valid-pickup-and-delivery-options': ('countOrders', [((1,), 1), ((2,), 6), ((3,), 90)]),
    'count-number-of-bad-pairs': ('countBadPairs', [(([4,1,3,3],), 5), (([1,2,3,4,5],), 0)]),
    'count-odd-numbers-in-an-interval-range': ('countOdds', [((3,7), 3), ((8,10), 1), ((0,0), 0)]),
    'count-of-matches-in-tournament': ('numberOfMatches', [((7,), 6), ((1,), 0)]),
    'count-prefix-and-suffix-pairs-i': ('countPrefixSuffixPairs', [((['a','aba','ababa','aa'],), 4), ((['abab','ab'],), 0)]),
    'count-primes': ('countPrimes', [((10,), 4), ((2,), 0), ((0,), 0)]),
    'count-servers-that-communicate': ('countServers', [(([[1,0],[1,1]],), 3), (([[1,0],[0,1]],), 0)]),
    'count-sub-islands': ('countSubIslands', [(([[1,1],[1,0]],[[1,0],[1,0]]), 1), (([[1,0],[0,0]],[[1,1],[0,0]]), 0)]),
    'count-subarrays-where-max-element-appears-at-least-k-times': ('countSubarrays', [(([1,3,2,3,3],2), 6), (([1,4,2,1],3), 0)]),
    'count-the-number-of-consistent-strings': ('countConsistentStrings', [(('ab',['ad','bd','aaab','baa','badab']), 2), (('a',['a','b']), 1)]),
    'count-triplets-that-can-form-two-arrays-of-equal-xor': ('countTriplets', [(([2,3,1,6,7],), 4), (([1,1,1,1,1],), 10)]),
    'count-univalue-subtrees': ('countUnivalSubtrees', [((tree([5,1,5,5,5,None,5]),), 4), ((None,), 0)]),
    'count-vowel-strings-in-ranges': ('vowelStrings', [((['aba','bcb','ece','aa','e'],[[0,2],[1,4],[1,1]]), [2,3,0]), ((['b'],[[0,0]]), [0])]),
    'count-vowels-permutation': ('countVowelPermutation', [((1,), 5), ((2,), 10), ((5,), 68)]),
    'count-ways-to-build-good-strings': ('countGoodStrings', [((3,3,1,1), 8), ((2,3,1,2), 5)]),
    'counting-elements': ('countElements', [(([1,2,3],), 2), (([1,1,2],), 2), (([1,3],), 0)]),
    'counting-words-with-a-given-prefix': ('prefixCount', [((['pay','attention','practice','attend'],'at'), 2), ((['a'],'b'), 0)]),
    'course-schedule-iv': ('checkIfPrerequisite', [((2,[[1,0]],[[0,1],[1,0]]), [False,True]), ((3,[[0,1],[1,2]],[[0,2],[2,0]]), [True,False])]),
    'crawler-log-folder': ('minOperations', [((['d1/','d2/','../','d21/','./'],), 2), ((['../','../'],), 0)]),
    'delete-and-earn': ('deleteAndEarn', [(([3,4,2],), 6), (([2,2,3,3,3,4],), 9)]),
    'destination-city': ('destCity', [(([['London','New York'],['New York','Lima'],['Lima','Sao Paulo']],), 'Sao Paulo'), (([['B','A']],), 'A')]),
    'detonate-the-maximum-bombs': ('maximumDetonation', [(([[2,1,3],[6,1,4]],), 2), (([[1,1,1],[10,10,1]],), 1)]),
    'distribute-candies-among-children-ii': ('distributeCandies', [((5,2), 3), ((3,3), 10), ((0,1), 1)]),
    'distribute-coins-in-binary-tree': ('distributeCoins', [((tree([3,0,0]),), 2), ((tree([0,3,0]),), 3)]),
    'divide-array-into-equal-pairs': ('divideArray', [(([3,2,3,2,2,2],), True), (([1,2,3,4],), False)]),
    'eliminate-maximum-number-of-monsters': ('eliminateMaximum', [(([1,3,4],[1,1,1]), 3), (([1,1,2,3],[1,1,1,1]), 1)]),
    'evaluate-boolean-binary-tree': ('evaluateTree', [((tree([2,1,3,None,None,0,1]),), True), ((tree([0]),), False)]),
    'even-odd-tree': ('isEvenOddTree', [((tree([1,10,4,3,None,7,9,12,8,6,None,None,2]),), True), ((tree([5,4,2,3,3,7]),), False)]),
    'excel-sheet-column-title': ('convertToTitle', [((1,), 'A'), ((28,), 'AB'), ((701,), 'ZY')]),
    'final-array-state-after-k-multiplication-operations-i': ('getFinalState', [(([2,1,3,5,6],5,2), [8,4,6,5,6]), (([1,1],1,3), [3,1])]),
    'find-all-anagrams-in-a-string': ('findAnagrams', [(('cbaebabacd','abc'), [0,6]), (('abab','ab'), [0,1,2])]),
    'find-all-duplicates-in-an-array': ('findDuplicates', [(([4,3,2,7,8,2,3,1],), [2,3]), (([1],), [])]),
    'find-all-numbers-disappeared-in-an-array': ('findDisappearedNumbers', [(([4,3,2,7,8,2,3,1],), [5,6]), (([1,1],), [2])]),
    'find-all-people-with-secret': ('findAllPeople', [((6,[[1,2,5],[2,3,8],[1,5,10]],1), [0,1,2,3,5]), ((4,[[3,1,3],[1,2,2],[0,3,3]],3), [0,1,3])]),
    'find-bottom-left-tree-value': ('findBottomLeftValue', [((tree([2,1,3]),), 1), ((tree([1]),), 1)]),
    'find-closest-node-to-given-two-nodes': ('closestMeetingNode', [(([2,2,3,-1],0,1), 2), (([-1,-1],0,1), -1)]),
    'find-first-palindromic-string-in-the-array': ('firstPalindrome', [((['abc','car','ada','racecar','cool'],), 'ada'), ((['abc'],), '')]),
    'find-k-length-substrings-with-no-repeated-characters': ('numKLenSubstrNoRepeats', [(('havefunonleetcode',5), 6), (('home',5), 0)]),
    'find-largest-value-in-each-tree-row': ('largestValues', [((tree([1,3,2,5,3,None,9]),), [1,3,9]), ((None,), [])]),
    'find-leaves-of-binary-tree': ('findLeaves', [((tree([1,2,3,4,5]),), [[4,5,3],[2],[1]]), ((None,), [])]),
    'find-lucky-integer-in-an-array': ('findLucky', [(([2,2,3,4],), 2), (([2,2,2,3,3],), -1)]),
    'find-missing-and-repeated-values': ('findMissingAndRepeatedValues', [(([[1,3],[2,2]],), [2,4]), (([[9,1,7],[8,9,2],[3,4,6]],), [9,5])]),
    'find-permutation': ('findPermutation', [(('I',), [1,2]), (('DI',), [2,1,3]), (('DD',), [3,2,1])]),
    'find-pivot-index': ('pivotIndex', [(([1,7,3,6,5,6],), 3), (([1,2,3],), -1), (([2,1,-1],), 0)]),
    'find-polygon-with-the-largest-perimeter': ('largestPerimeter', [(([5,5,5],), 15), (([1,12,1,2,5,50,3],), 12), (([5,5,50],), -1)]),
    'find-smallest-common-element-in-all-rows': ('smallestCommonElement', [(([[1,2,3,4,5],[2,4,5,8,10],[3,5,7,9,11],[1,3,5,7,9]],), 5), (([[1,2],[3,4]],), -1)]),
    'find-the-difference-of-two-arrays': ('findDifference', [(([1,2,3],[2,4,6]), [[1,3],[4,6]]), (([1,1],[1]), [[],[]])]),
    'find-the-difference': ('findTheDifference', [(('abcd','abcde'), 'e'), (('','y'), 'y'), (('a','aa'), 'a')]),
    'find-the-kth-largest-integer-in-the-array': ('kthLargestNumber', [((['3','6','7','10'],4), '3'), ((['2','21','12','1'],3), '2')]),
    'find-the-longest-valid-obstacle-course-at-each-position': ('longestObstacleCourseAtEachPosition', [(([1,2,3,2],), [1,2,3,3]), (([3,1,5,6,4,2],), [1,1,2,3,2,2])]),
    'find-the-maximum-sum-of-node-values': ('maximumValueSum', [(([1,2,1],3,[[0,1],[0,2]]), 6), (([2,3],7,[[0,1]]), 9)]),
    'find-the-safest-path-in-a-grid': ('maximumSafenessFactor', [(([[0,0,1],[0,0,0],[0,0,0]],), 2), (([[1,0],[0,0]],), 0)]),
    'find-the-town-judge': ('findJudge', [((2,[[1,2]]), 2), ((3,[[1,3],[2,3],[3,1]]), -1), ((1,[]), 1)]),
    'find-words-that-can-be-formed-by-characters': ('countCharacters', [((['cat','bt','hat','tree'],'atach'), 6), ((['hello','world','leetcode'],'welldonehoneyr'), 10)]),
    'first-unique-character-in-a-string': ('firstUniqChar', [(('leetcode',), 0), (('aabb',), -1)]),
    'flip-equivalent-binary-trees': ('flipEquiv', [((tree([1,2,3]),tree([1,3,2])), True), ((tree([1,2]),tree([1,3])), False)]),
    'flip-string-to-monotone-increasing': ('minFlipsMonoIncr', [(('00110',), 1), (('010110',), 2), (('000',), 0)]),
    'flood-fill': ('floodFill', [(([[1,1,1],[1,1,0],[1,0,1]],1,1,2), [[2,2,2],[2,2,0],[2,0,1]]), (([[0,0]],0,0,0), [[0,0]])]),
    'freedom-trail': ('findRotateSteps', [(('godding','gd'), 4), (('abc','aa'), 2)]),
    'frequency-of-the-most-frequent-element': ('maxFrequency', [(([1,2,4],5), 3), (([1,4,8,13],5), 2)]),
    'fruit-into-baskets': ('totalFruit', [(([1,2,1],), 3), (([0,1,2,2],), 3)]),
    'furthest-building-you-can-reach': ('furthestBuilding', [(([4,2,7,6,9,14,12],5,1), 4), (([1,2,3],0,0), 0)]),
    'get-equal-substrings-within-budget': ('equalSubstring', [(('abcd','bcdf',3), 3), (('abcd','cdef',3), 1), (('abc','abc',0), 3)]),
    'greatest-common-divisor-of-strings': ('gcdOfStrings', [(('ABCABC','ABC'), 'ABC'), (('LEET','CODE'), '')]),
    'greatest-common-divisor-traversal': ('canTraverseAllPairs', [(([2,3,6],), True), (([3,9,5],), False), (([1],), True)]),
    'grid-game': ('gridGame', [(([[2,5,4],[1,5,1]],), 4), (([[1],[2]],), 0)]),
    'grumpy-bookstore-owner': ('maxSatisfied', [(([1,0,1,2,1,1,7,5],[0,1,0,1,0,1,0,1],3), 16), (([1],[0],1), 1)]),
    'handshakes-that-dont-cross': ('numberOfWays', [((2,), 1), ((4,), 2), ((6,), 5)]),
    'height-checker': ('heightChecker', [(([1,1,4,2,1,3],), 3), (([1,2,3],), 0)]),
    'high-five': ('highFive', [(([[1,91],[1,92],[2,93],[2,97],[1,60],[2,77],[1,65],[1,87],[1,100],[2,100],[2,76]],), [[1,87],[2,88]])]),
    'house-robber-iii': ('rob', [((tree([3,2,3,None,3,None,1]),), 7), ((tree([3,4,5,1,3,None,1]),), 9)]),
    'image-smoother': ('imageSmoother', [(([[1,1,1],[1,0,1],[1,1,1]],), [[0,0,0],[0,0,0],[0,0,0]]), (([[100]],), [[100]])]),
    'intersection-of-two-arrays': ('intersection', [(([1,2,2,1],[2,2]), [2]), (([1],[3]), [])]),
    'interval-list-intersections': ('intervalIntersection', [(([[0,2],[5,10]],[[1,5],[8,12]]), [[1,2],[5,5],[8,10]]), (([],[[1,2]]), [])]),
    'is-subsequence': ('isSubsequence', [(('abc','ahbgdc'), True), (('axc','ahbgdc'), False), (('','abc'), True)]),
    'jump-game-vii': ('canReach', [(('011010',2,3), True), (('01101110',2,3), False)]),
    'k-inverse-pairs-array': ('kInversePairs', [((3,0), 1), ((3,1), 2), ((3,4), 0)]),
    'k-th-smallest-in-lexicographical-order': ('findKthNumber', [((13,2), 10), ((1,1), 1)]),
    'k-th-symbol-in-grammar': ('kthGrammar', [((1,1), 0), ((4,5), 1), ((4,8), 1)]),
    'kill-process': ('killProcess', [(([1,3,10,5],[3,0,5,3],5), [5,10]), (([1],[0],1), [1])]),
    'knight-dialer': ('knightDialer', [((1,), 10), ((2,), 20), ((3,), 46)]),
    'kth-distinct-string-in-an-array': ('kthDistinct', [((['d','b','c','b','c','a'],2), 'a'), ((['a','b','a'],3), '')]),
    'kth-smallest-product-of-two-sorted-arrays': ('kthSmallestProduct', [(([2,5],[3,4],2), 8), (([-4,-2,0,3],[2,4],6), 0)]),
    'largest-3-same-digit-number-in-string': ('largestGoodInteger', [(('6777133339',), '777'), (('2300019',), '000'), (('123',), '')]),
    'largest-bst-subtree': ('largestBSTSubtree', [((tree([10,5,15,1,8,None,7]),), 3), ((None,), 0)]),
    'largest-color-value-in-a-directed-graph': ('largestPathValue', [(('abaca',[[0,1],[0,2],[2,3],[3,4]]), 3), (('a',[[0,0]]), -1)]),
    'largest-local-values-in-a-matrix': ('largestLocal', [(([[9,9,8,1],[5,6,2,6],[8,2,6,4],[6,2,2,2]],), [[9,9],[8,6]]), (([[1,1,1],[1,2,1],[1,1,1]],), [[2]])]),
    'largest-odd-number-in-string': ('largestOddNumber', [(('52',), '5'), (('4206',), ''), (('35427',), '35427')]),
    'largest-submatrix-with-rearrangements': ('largestSubmatrix', [(([[0,0,1],[1,1,1],[1,0,1]],), 4), (([[1,0,1,0,1]],), 3)]),
    'largest-substring-between-two-equal-characters': ('maxLengthBetweenEqualCharacters', [(('aa',), 0), (('abca',), 2), (('cbzxy',), -1)]),
    'largest-unique-number': ('largestUniqueNumber', [(([5,7,3,9,4,9,8,3,1],), 8), (([9,9,8,8],), -1)]),
    'last-stone-weight-ii': ('lastStoneWeightII', [(([2,7,4,1,8,1],), 1), (([31,26,33,21,40],), 5)]),
    'leaf-similar-trees': ('leafSimilar', [((tree([1,2,3]),tree([1,2,3])), True), ((tree([1,2,3]),tree([1,3,2])), False)]),
    'least-number-of-unique-integers-after-k-removals': ('findLeastNumOfUniqueInts', [(([5,5,4],1), 1), (([4,3,1,1,3,3,2],3), 2)]),
    'length-of-longest-subarray-with-at-most-k-frequency': ('maxSubarrayLength', [(([1,2,3,1,2,3,1,2],2), 6), (([1,1,1],1), 1)]),
    'lonely-pixel-i': ('findLonelyPixel', [(([list('WWB'),list('WBW'),list('BWW')],), 3), (([list('BB')],), 0)]),
    'longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit': ('longestSubarray', [(([8,2,4,7],4), 2), (([10,1,2,4,7,2],5), 4)]),
    'longest-ideal-subsequence': ('longestIdealString', [(('acfgbd',2), 4), (('abcd',3), 4)]),
    'longest-increasing-subsequence-ii': ('lengthOfLIS', [(([4,2,1,4,3,4,5,8,15],3), 5), (([1,5],1), 1)]),
    'longest-palindrome': ('longestPalindrome', [(('abccccdd',), 7), (('a',), 1)]),
    'longest-strictly-increasing-or-strictly-decreasing-subarray': ('longestMonotonicSubarray', [(([1,4,3,3,2],), 2), (([3,2,1],), 3)]),
    'longest-string-chain': ('longestStrChain', [((['a','b','ba','bca','bda','bdca'],), 4), ((['a','ab','cab'],), 3)]),
    'longest-substring-with-at-most-k-distinct-characters': ('lengthOfLongestSubstringKDistinct', [(('eceba',2), 3), (('aa',0), 0)]),
    'longest-substring-with-at-most-two-distinct-characters': ('lengthOfLongestSubstringTwoDistinct', [(('eceba',), 3), (('ccaabbb',), 5)]),
    'majority-element-ii': ('majorityElement', [(([3,2,3],), [3]), (([1,2],), [1,2]), (([1,2,3],), [])]),
    'make-sum-divisible-by-p': ('minSubarray', [(([3,1,4,2],6), 1), (([1,2,3],3), 0), (([1,2,3],7), -1)]),
    'make-the-string-great': ('makeGood', [(('leEeetcode',), 'leetcode'), (('abBAcC',), '')]),
    'max-consecutive-ones-ii': ('findMaxConsecutiveOnes', [(([1,0,1,1,0],), 4), (([0],), 1)]),
    'max-consecutive-ones-iii': ('longestOnes', [(([1,1,1,0,0,0,1,1,1,1,0],2), 6), (([0,0,1,1],0), 2)]),
    'max-consecutive-ones': ('findMaxConsecutiveOnes', [(([1,1,0,1,1,1],), 3), (([0,0],), 0)]),
    'max-points-on-a-line': ('maxPoints', [(([[1,1],[2,2],[3,3]],), 3), (([[0,0],[0,1],[0,2],[1,1]],), 3)]),
    'maximize-score-after-n-operations': ('maxScore', [(([1,2],), 1), (([3,4,6,8],), 11)]),
    'maximize-ysum-by-picking-a-triplet-of-distinct-xvalues': ('maxSumDistinctTriplet', [(([1,2,1,3,2],[5,3,4,6,2]), 14), (([1,1,2],[1,2,3]), -1)]),
    'maximum-alternating-subsequence-sum': ('maxAlternatingSum', [(([4,2,5,3],), 7), (([5,6,7,8],), 8)]),
    'maximum-ascending-subarray-sum': ('maxAscendingSum', [(([10,20,30,5,10,50],), 65), (([3,2,1],), 3)]),
    'maximum-average-subarray-ii': ('findMaxAverage', [(([1,12,-5,-6,50,3],4), 12.75), (([-3,-5,-1],2), -3.0)]),
    'maximum-distance-in-arrays': ('maxDistance', [(([[1,2,3],[4,5],[1,2,3]],), 4), (([[1],[1]],), 0)]),
    'maximum-element-after-decreasing-and-rearranging': ('maximumElementAfterDecrementingAndRearranging', [(([2,2,1,2,1],), 2), (([100,1,1000],), 3)]),
    'maximum-frequency-after-subarray-operation': ('maxFrequency', [(([1,2,3,4,5,6],1), 2), (([1,1,1],1), 3)]),
    'maximum-nesting-depth-of-the-parentheses': ('maxDepth', [(('(1+(2*3)+((8)/4))+1',), 3), (('abc',), 0)]),
    'maximum-number-of-ones': ('maximumNumberOfOnes', [((3,3,2,1), 4), ((3,3,2,2), 6)]),
    'maximum-number-of-points-with-cost': ('maxPoints', [(([[1,2,3],[1,5,1],[3,1,1]],), 9), (([[1,5],[2,3],[4,2]],), 11)]),
    'maximum-number-of-removable-characters': ('maximumRemovals', [(('abcacb','ab',[3,1,0]), 2), (('abcbddddd','abcd',[3,2,1,4,5,6]), 1)]),
    'maximum-number-of-vowels-in-a-substring-of-given-length': ('maxVowels', [(('abciiidef',3), 3), (('rhythms',4), 0)]),
    'maximum-odd-binary-number': ('maximumOddBinaryNumber', [(('010',), '001'), (('0101',), '1001')]),
    'maximum-points-you-can-obtain-from-cards': ('maxScore', [(([1,2,3,4,5,6,1],3), 12), (([2,2,2],3), 6)]),
    'maximum-product-difference-between-two-pairs': ('maxProductDifference', [(([5,6,2,7,4],), 34), (([1,1,1,1],), 0)]),
    'maximum-product-of-the-length-of-two-palindromic-subsequences': ('maxProduct', [(('leetcodecom',), 9), (('bb',), 1)]),
    'maximum-score-after-splitting-a-string': ('maxScore', [(('011101',), 5), (('00',), 1)]),
    'maximum-score-of-a-good-subarray': ('maximumScore', [(([1,4,3,7,4,5],3), 15), (([5],0), 5)]),
    'maximum-score-words-formed-by-letters': ('maxScoreWords', [((['a','b','ab'],list('ab'),[1,2]+[0]*24), 3), ((['z'],list('a'),[1]*26), 0)]),
    'maximum-subarray-min-product': ('maxSumMinProduct', [(([1,2,3,2],), 14), (([2,3,3,1,2],), 18)]),
    'maximum-subsequence-score': ('maxScore', [(([1,3,3,2],[2,1,3,4],3), 12), (([4,2,3,1,1],[7,5,10,9,6],1), 30)]),
    'maximum-value-of-k-coins-from-piles': ('maxValueOfCoins', [(([[1,100,3],[7,8,9]],2), 101), (([[5],[2]],2), 7)]),
    'maximum-width-of-binary-tree': ('widthOfBinaryTree', [((tree([1,3,2,5,3,None,9]),), 4), ((tree([1]),), 1)]),
    'meeting-rooms-iii': ('mostBooked', [((2,[[0,10],[1,5],[2,7],[3,4]]), 0), ((3,[[1,20],[2,10],[3,5],[4,9],[6,8]]), 1)]),
    'minimize-maximum-of-array': ('minimizeArrayValue', [(([3,7,1,6],), 5), (([10,1],), 10)]),
    'minimize-the-maximum-difference-of-pairs': ('minimizeMax', [(([10,1,2,7,1,3],2), 1), (([4,2,1,2],1), 0), (([1],0), 0)]),
    'minimum-array-end': ('minEnd', [((3,4), 6), ((2,7), 15), ((1,5), 5)]),
    'minimum-changes-to-make-alternating-binary-string': ('minOperations', [(('0100',), 1), (('10',), 0), (('1111',), 2)]),
    'minimum-cost-for-tickets': ('mincostTickets', [(([1,4,6,7,8,20],[2,7,15]), 11), (([1],[2,7,15]), 2)]),
    'minimum-cost-to-cut-a-stick': ('minCost', [((7,[1,3,4,5]), 16), ((9,[5,6,1,4,2]), 22)]),
    'minimum-deletions-to-make-character-frequencies-unique': ('minDeletions', [(('aaabbbcc',), 2), (('abc',), 2)]),
    'minimum-difficulty-of-a-job-schedule': ('minDifficulty', [(([6,5,4,3,2,1],2), 7), (([9,9,9],4), -1)]),
    'minimum-distance-between-bst-nodes': ('minDiffInBST', [((tree([4,2,6,1,3]),), 1), ((tree([1,0,48,None,None,12,49]),), 1)]),
    'minimum-falling-path-sum-ii': ('minFallingPathSum', [(([[1,2,3],[4,5,6],[7,8,9]],), 13), (([[7]],), 7)]),
    'minimum-falling-path-sum': ('minFallingPathSum', [(([[2,1,3],[6,5,4],[7,8,9]],), 13), (([[-19,57],[-40,-5]],), -59)]),
    'minimum-fuel-cost-to-report-to-the-capital': ('minimumFuelCost', [(([[0,1],[0,2],[0,3]],5), 3), (([],1), 0)]),
    'minimum-height-trees': ('findMinHeightTrees', [((4,[[1,0],[1,2],[1,3]]), [1]), ((2,[[0,1]]), [0,1])]),
    'minimum-index-of-a-valid-split': ('minimumIndex', [(([1,2,2,2],), 2), (([3,3,3,3,7,2,2],), -1)]),
    'minimum-knight-moves': ('minKnightMoves', [((2,1), 1), ((5,5), 4), ((0,0), 0)]),
    'minimum-number-of-arrows-to-burst-balloons': ('findMinArrowShots', [(([[10,16],[2,8],[1,6],[7,12]],), 2), (([[1,2],[2,3]],), 1)]),
    'minimum-number-of-days-to-eat-n-oranges': ('minDays', [((10,), 4), ((6,), 3), ((1,), 1)]),
    'minimum-number-of-flips-to-make-the-binary-string-alternating': ('minFlips', [(('111000',), 2), (('010',), 0), (('1110',), 1)]),
    'minimum-number-of-increments-on-subarrays-to-form-a-target-array': ('minNumberOperations', [(([1,2,3,2,1],), 3), (([3,1,5,4,2],), 7)]),
    'minimum-number-of-moves-to-seat-everyone': ('minMovesToSeat', [(([3,1,5],[2,7,4]), 4), (([2,2,6,6],[1,3,2,6]), 4)]),
    'minimum-number-of-operations-to-make-array-continuous': ('minOperations', [(([4,2,5,3],), 0), (([1,2,3,5,6],), 1), (([1,1,1],), 2)]),
    'minimum-number-of-operations-to-make-array-empty': ('minOperations', [(([2,3,3,2,2,4,2,3,4],), 4), (([2,1,2,2,3,3],), -1)]),
    'minimum-number-of-operations-to-move-all-balls-to-each-box': ('minOperations', [(('110',), [1,1,3]), (('001011',), [11,8,5,4,3,4])]),
    'minimum-number-of-swaps-to-make-the-string-balanced': ('minSwaps', [(('][][',), 1), ((']]][[[',), 2), (('[]',), 0)]),
    'minimum-number-of-vertices-to-reach-all-nodes': ('findSmallestSetOfVertices', [((6,[[0,1],[0,2],[2,5],[3,4],[4,2]]), [0,3]), ((3,[]), [0,1,2])]),
    'minimum-one-bit-operations-to-make-integers-zero': ('minimumOneBitOperations', [((3,), 2), ((6,), 4), ((0,), 0)]),
    'minimum-operations-to-reduce-x-to-zero': ('minOperations', [(([1,1,4,2,3],5), 2), (([5,6,7,8,9],4), -1), (([1,1],2), 2)]),
    'minimum-penalty-for-a-shop': ('bestClosingTime', [(('YYNY',), 2), (('NNNNN',), 0), (('YYYY',), 4)]),
    'minimum-recolors-to-get-k-consecutive-black-blocks': ('minimumRecolors', [(('WBBWWBBWBW',7), 3), (('WBWBBBW',2), 0)]),
    'minimum-score-of-a-path-between-two-cities': ('minScore', [((4,[[1,2,9],[2,3,6],[2,4,5],[1,4,7]]), 5), ((2,[[1,2,3]]), 3)]),
    'minimum-time-to-collect-all-apples-in-a-tree': ('minTime', [((7,[[0,1],[0,2],[1,4],[1,5],[2,3],[2,6]],[False,False,True,False,True,True,False]), 8), ((1,[],[True]), 0)]),
    'minimum-time-to-make-rope-colorful': ('minCost', [(('abaac',[1,2,3,4,5]), 3), (('abc',[1,2,3]), 0)]),
    'missing-element-in-sorted-array': ('missingElement', [(([4,7,9,10],1), 5), (([4,7,9,10],3), 8), (([1,2,4],3), 6)]),
    'missing-number-in-arithmetic-progression': ('missingNumber', [(([5,7,11,13],), 9), (([15,13,12],), 14), (([0,0,0],), 0)]),
    'monotonic-array': ('isMonotonic', [(([1,2,2,3],), True), (([1,3,2],), False)]),
    'n-th-tribonacci-number': ('tribonacci', [((0,), 0), ((4,), 4), ((10,), 149)]),
    'naming-a-company': ('distinctNames', [((['coffee','donuts','time','toffee'],), 6), ((['lack','back'],), 0)]),
    'new-21-game': ('new21Game', [((10,1,10), 1.0), ((6,1,10), 0.6), ((0,0,1), 1.0)]),
    'next-greater-element-i': ('nextGreaterElement', [(([4,1,2],[1,3,4,2]), [-1,3,-1]), (([2,4],[1,2,3,4]), [3,-1])]),
    'number-of-closed-islands': ('closedIsland', [(([[1,1,1],[1,0,1],[1,1,1]],), 1), (([[0,1],[1,1]],), 0)]),
    'number-of-dice-rolls-with-target-sum': ('numRollsToTarget', [((1,6,3), 1), ((2,6,7), 6), ((2,2,5), 0)]),
    'number-of-distinct-islands': ('numDistinctIslands', [(([[1,1,0,0,0],[1,0,0,1,1],[0,0,0,1,0]],), 1), (([[1,0,1],[1,0,0]],), 2)]),
    'number-of-enclaves': ('numEnclaves', [(([[0,0,0,0],[1,0,1,0],[0,1,1,0],[0,0,0,0]],), 3), (([[1]],), 0)]),
    'number-of-flowers-in-full-bloom': ('fullBloomFlowers', [(([[1,6],[3,7],[9,12],[4,13]],[2,3,7,11]), [1,2,2,2]), (([[1,1]],[1,2]), [1,0])]),
    'number-of-good-pairs': ('numIdenticalPairs', [(([1,2,3,1,1,3],), 4), (([1,2,3],), 0)]),
    'number-of-good-paths': ('numberOfGoodPaths', [(([1,3,2,1,3],[[0,1],[0,2],[2,3],[2,4]]), 6), (([1],[]), 1)]),
    'number-of-longest-increasing-subsequence': ('findNumberOfLIS', [(([1,3,5,4,7],), 2), (([2,2,2,2,2],), 5)]),
    'number-of-music-playlists': ('numMusicPlaylists', [((3,3,1), 6), ((2,3,0), 6), ((2,3,1), 2)]),
    'number-of-pairs-of-interchangeable-rectangles': ('interchangeableRectangles', [(([[4,8],[3,6],[10,20],[15,30]],), 6), (([[4,5],[7,8]],), 0)]),
    'number-of-provinces': ('findCircleNum', [(([[1,1,0],[1,1,0],[0,0,1]],), 2), (([[1]],), 1)]),
    'number-of-students-unable-to-eat-lunch': ('countStudents', [(([1,1,0,0],[0,1,0,1]), 0), (([1,1,1,0,0,1],[1,0,0,0,1,1]), 3)]),
    'number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold': ('numOfSubarrays', [(([2,2,2,2,5,5,5,8],3,4), 3), (([1,1],2,2), 0)]),
    'number-of-sub-arrays-with-odd-sum': ('numOfSubarrays', [(([1,3,5],), 4), (([2,4,6],), 0)]),
    'number-of-submatrices-that-sum-to-target': ('numSubmatrixSumTarget', [(([[0,1,0],[1,1,1],[0,1,0]],0), 4), (([[1,-1],[-1,1]],0), 5)]),
    'number-of-subsequences-that-satisfy-the-given-sum-condition': ('numSubseq', [(([3,5,6,7],9), 4), (([3,3,6,8],10), 6)]),
    'number-of-visible-people-in-a-queue': ('canSeePersonsCount', [(([10,6,8,5,11,9],), [3,1,2,1,1,0]), (([5,1,2,3,10],), [4,1,1,1,0])]),
    'number-of-ways-to-divide-a-long-corridor': ('numberOfWays', [(('SSPPSPS',), 3), (('PPSPSP',), 1), (('S',), 0)]),
    'number-of-ways-to-form-a-target-string-given-a-dictionary': ('numWays', [((['acca','bbbb','caca'],'aba'), 6), ((['abba','baab'],'bab'), 4)]),
    'number-of-ways-to-rearrange-sticks-with-k-sticks-visible': ('rearrangeSticks', [((3,2), 3), ((5,5), 1), ((3,1), 2)]),
    'number-of-ways-to-split-array': ('waysToSplitArray', [(([10,4,-8,7],), 2), (([2,3,1,0],), 2)]),
    'number-of-ways-to-stay-in-the-same-place-after-some-steps': ('numWays', [((3,2), 4), ((2,4), 2), ((4,2), 8)]),
    'number-of-zero-filled-subarrays': ('zeroFilledSubarray', [(([1,3,0,0,2,0,0,4],), 6), (([0,0,0],), 6)]),
    'optimal-partition-of-string': ('partitionString', [(('abacaba',), 4), (('ssssss',), 6)]),
    'out-of-boundary-paths': ('findPaths', [((2,2,2,0,0), 6), ((1,3,3,0,1), 12), ((1,1,0,0,0), 0)]),
    'paint-fence': ('numWays', [((3,2), 6), ((1,1), 1), ((2,1), 1)]),
    'paint-house-ii': ('minCostII', [(([[1,5,3],[2,9,4]],), 5), (([[1,3]],), 1)]),
    'paint-house': ('minCost', [(([[17,2,17],[16,16,5],[14,3,19]],), 10), (([[7,6,2]],), 2)]),
    'painting-the-walls': ('paintWalls', [(([1,2,3,2],[1,2,3,2]), 3), (([2,3,4,2],[1,1,1,1]), 4)]),
    'palindrome-permutation': ('canPermutePalindrome', [(('code',), False), (('aab',), True), (('carerac',), True)]),
    'parallel-courses-iii': ('minimumTime', [((3,[[1,3],[2,3]],[3,2,5]), 8), ((1,[],[4]), 4)]),
    'parallel-courses': ('minimumSemesters', [((3,[[1,3],[2,3]]), 2), ((3,[[1,2],[2,3],[3,1]]), -1)]),
    'partition-array-for-maximum-sum': ('maxSumAfterPartitioning', [(([1,15,7,9,2,5,10],3), 84), (([1],1), 1)]),
    'pascals-triangle-ii': ('getRow', [((3,), [1,3,3,1]), ((0,), [1])]),
    'path-crossing': ('isPathCrossing', [(('NES',), False), (('NESWW',), True)]),
    'path-with-maximum-gold': ('getMaximumGold', [(([[0,6,0],[5,8,7],[0,9,0]],), 24), (([[0]],), 0)]),
    'perform-string-shifts': ('stringShift', [(('abc',[[0,1],[1,2]]), 'cab'), (('abc',[[0,3]]), 'abc')]),
    'power-of-four': ('isPowerOfFour', [((16,), True), ((5,), False), ((1,), True), ((0,), False), ((-4,), False), ((4**15-1,), False)] + [((4**k,), True) for k in range(16)]),
    'power-of-two': ('isPowerOfTwo', [((16,), True), ((3,), False), ((0,), False), ((-16,), False)]),
    'process-tasks-using-servers': ('assignTasks', [(([3,3,2],[1,2,3,2,1,2]), [2,2,0,2,1,2]), (([1],[3,1]), [0,0])]),
    'profitable-schemes': ('profitableSchemes', [((5,3,[2,2],[2,3]), 2), ((1,0,[1],[0]), 2)]),
    'pseudo-palindromic-paths-in-a-binary-tree': ('pseudoPalindromicPaths', [((tree([2,3,1,3,1,None,1]),), 2), ((tree([9]),), 1)]),
    'push-dominoes': ('pushDominoes', [(('.L.R...LR..L..',), 'LL.RR.LLRRLL..'), (('RR.L',), 'RR.L')]),
    'put-marbles-in-bags': ('putMarbles', [(([1,3,5,1],2), 4), (([1,3],2), 0)]),
    'range-sum-of-bst': ('rangeSumBST', [((tree([10,5,15,3,7,None,18]),7,15), 32), ((tree([1]),2,3), 0)]),
    'ransom-note': ('canConstruct', [(('aa','aab'), True), (('aa','ab'), False)]),
    'rearrange-array-elements-by-sign': ('rearrangeArray', [(([3,1,-2,-5,2,-4],), [3,-2,1,-5,2,-4]), (([-1,1],), [1,-1])]),
    'redistribute-characters-to-make-all-strings-equal': ('makeEqual', [((['abc','aabc','bc'],), True), ((['ab','a'],), False)]),
    'relative-sort-array': ('relativeSortArray', [(([2,3,1,3,2,4,6,7,9,2,19],[2,1,4,3,9,6]), [2,2,2,1,4,3,3,9,6,7,19]), (([3,1,2],[2]), [2,1,3])]),
    'remove-all-adjacent-duplicates-in-string-ii': ('removeDuplicates', [(('deeedbbcccbdaa',3), 'aa'), (('abcd',2), 'abcd')]),
    'remove-colored-pieces-if-both-neighbors-are-the-same-color': ('winnerOfGame', [(('AAABABB',), True), (('AA',), False)]),
    'remove-covered-intervals': ('removeCoveredIntervals', [(([[1,4],[3,6],[2,8]],), 2), (([[1,4],[2,3]],), 1)]),
    'remove-sub-folders-from-the-filesystem': ('removeSubfolders', [((['/a','/a/b','/c/d','/c/d/e','/c/f'],), ['/a','/c/d','/c/f']), ((['/a','/ab'],), ['/a','/ab'])]),
    'removing-stars-from-a-string': ('removeStars', [(('leet**cod*e',), 'lecoe'), (('erase*****',), '')]),
    'reorder-routes-to-make-all-paths-lead-to-the-city-zero': ('minReorder', [((6,[[0,1],[1,3],[2,3],[4,0],[4,5]]), 3), ((3,[[1,0],[2,0]]), 0)]),
    'replace-elements-with-greatest-element-on-right-side': ('replaceElements', [(([17,18,5,4,6,1],), [18,6,6,6,1,-1]), (([400],), [-1])]),
    'reveal-cards-in-increasing-order': ('deckRevealedIncreasing', [(([17,13,11,2,3,5,7],), [2,13,3,11,5,17,7]), (([1],), [1])]),
    'rotating-the-box': ('rotateTheBox', [(([list('#.*.'),list('##*.')],), [['#','.'],['#','#'],['*','*'],['.','.']]), (([list('#.#')],), [['.'],['#'],['#']])]),
    'russian-doll-envelopes': ('maxEnvelopes', [(([[5,4],[6,4],[6,7],[2,3]],), 3), (([[1,1],[1,1]],), 1)]),
    'score-after-flipping-matrix': ('matrixScore', [(([[0,0,1,1],[1,0,1,0],[1,1,0,0]],), 39), (([[0]],), 1)]),
    'search-suggestions-system': ('suggestedProducts', [((['mobile','mouse','moneypot','monitor','mousepad'],'mouse'), [['mobile','moneypot','monitor'],['mobile','moneypot','monitor'],['mouse','mousepad'],['mouse','mousepad'],['mouse','mousepad']]), ((['a'],'b'), [[]])]),
    'sequential-digits': ('sequentialDigits', [((100,300), [123,234]), ((1000,13000), [1234,2345,3456,4567,5678,6789,12345])]),
    'set-mismatch': ('findErrorNums', [(([1,2,2,4],), [2,3]), (([1,1],), [1,2])]),
    'shift-2d-grid': ('shiftGrid', [(([[1,2,3],[4,5,6],[7,8,9]],1), [[9,1,2],[3,4,5],[6,7,8]]), (([[1,2]],2), [[1,2]])]),
    'shifting-letters-ii': ('shiftingLetters', [(('abc',[[0,1,0],[1,2,1],[0,2,1]]), 'ace'), (('a',[[0,0,0]]), 'z')]),
    'shortest-distance-from-all-buildings': ('shortestDistance', [(([[1,0,2,0,1],[0,0,0,0,0],[0,0,1,0,0]],), 7), (([[1,2,0]],), -1)]),
    'shortest-path-in-binary-matrix': ('shortestPathBinaryMatrix', [(([[0,1],[1,0]],), 2), (([[1,0],[0,0]],), -1), (([[0]],), 1)]),
    'shortest-path-with-alternating-colors': ('shortestAlternatingPaths', [((3,[[0,1],[1,2]],[]), [0,1,-1]), ((3,[[0,1]],[[1,2]]), [0,1,2])]),
    'shortest-way-to-form-string': ('shortestWay', [(('abc','abcbc'), 2), (('abc','acdbc'), -1)]),
    'sign-of-the-product-of-an-array': ('arraySign', [(([-1,-2,-3,-4,3,2,1],), 1), (([1,5,0,2,-3],), 0)]),
    'single-element-in-a-sorted-array': ('singleNonDuplicate', [(([1,1,2,3,3,4,4,8,8],), 2), (([1],), 1)]),
    'single-number-iii': ('singleNumber', [(([1,2,1,3,2,5],), [3,5]), (([-1,0],), [-1,0])]),
    'single-threaded-cpu': ('getOrder', [(([[1,2],[2,4],[3,2],[4,1]],), [0,2,3,1]), (([[7,10],[7,12],[7,5],[7,4],[7,2]],), [4,3,2,0,1])]),
    'sliding-window-median': ('medianSlidingWindow', [(([1,3,-1,-3,5,3,6,7],3), [1,-1,-1,3,5,6]), (([1,2,3,4],2), [1.5,2.5,3.5])]),
    'smallest-string-starting-from-leaf': ('smallestFromLeaf', [((tree([0,1,2,3,4,3,4]),), 'dba'), ((tree([25]),), 'z')]),
    'solving-questions-with-brainpower': ('mostPoints', [(([[3,2],[4,3],[4,4],[2,5]],), 5), (([[1,1],[2,2],[3,3],[4,4],[5,5]],), 7)]),
    'sort-the-jumbled-numbers': ('sortJumbled', [(([8,9,4,0,2,1,3,5,7,6],[991,338,38]), [338,38,991]), ((list(range(10)),[0,2,1]), [0,1,2])]),
    'sort-the-people': ('sortPeople', [((['Mary','John','Emma'],[180,165,170]), ['Mary','Emma','John']), ((['A'],[1]), ['A'])]),
    'sparse-matrix-multiplication': ('multiply', [(([[1,0,0],[-1,0,3]],[[7,0,0],[0,0,0],[0,0,1]]), [[7,0,0],[-7,0,3]]), (([[0]],[[0]]), [[0]])]),
    'special-array-with-x-elements-greater-than-or-equal-x': ('specialArray', [(([3,5],), 2), (([0,0],), -1), (([0,4,3,0,4],), 3)]),
    'split-array-largest-sum': ('splitArray', [(([7,2,5,10,8],2), 18), (([1,4,4],3), 4)]),
    'split-array-with-same-average': ('splitArraySameAverage', [(([1,2,3,4,5,6,7,8],), True), (([3,1],), False)]),
    'squares-of-a-sorted-array': ('sortedSquares', [(([-4,-1,0,3,10],), [0,1,9,16,100]), (([-7,-3,-1],), [1,9,49])]),
    'stickers-to-spell-word': ('minStickers', [((['with','example','science'],'thehat'), 3), ((['notice','possible'],'basicbasic'), -1)]),
    'stone-game-ii': ('stoneGameII', [(([2,7,9,4,4],), 10), (([1,2,3,4,5,100],), 104)]),
    'stone-game-iii': ('stoneGameIII', [(([1,2,3,7],), 'Bob'), (([1,2,3,-9],), 'Alice'), (([1,2,3,6],), 'Tie')]),
    'stone-game': ('stoneGame', [(([5,3,4,5],), True), (([3,7,2,3],), True)]),
    'string-compression-ii': ('getLengthOfOptimalCompression', [(('aaabcccd',2), 4), (('aabbaa',2), 2)]),
    'string-matching-in-an-array': ('stringMatching', [((['mass','as','hero','superhero'],), ['as','hero']), ((['blue','green','bu'],), [])]),
    'strobogrammatic-number-ii': ('findStrobogrammatic', [((2,), ['11','69','88','96']), ((1,), ['0','1','8'])]),
    'student-attendance-record-ii': ('checkRecord', [((1,), 3), ((2,), 8), ((3,), 19)]),
    'subarray-sums-divisible-by-k': ('subarraysDivByK', [(([4,5,0,-2,-3,1],5), 7), (([5],9), 0)]),
    'subarrays-with-k-different-integers': ('subarraysWithKDistinct', [(([1,2,1,2,3],2), 7), (([1,2,1,3,4],3), 3)]),
    'successful-pairs-of-spells-and-potions': ('successfulPairs', [(([5,1,3],[1,2,3,4,5],7), [4,0,3]), (([1],[1],1), [1])]),
    'sum-of-absolute-differences-in-a-sorted-array': ('getSumAbsoluteDifferences', [(([2,3,5],), [4,3,5]), (([1,4,6,8,10],), [24,15,13,15,21])]),
    'sum-of-all-subset-xor-totals': ('subsetXORSum', [(([1,3],), 6), (([5,1,6],), 28)]),
    'sum-of-subarray-minimums': ('sumSubarrayMins', [(([3,1,2,4],), 17), (([2,2],), 6)]),
    'sum-root-to-leaf-numbers': ('sumNumbers', [((tree([1,2,3]),), 25), ((tree([0]),), 0)]),
    'take-gifts-from-the-richest-pile': ('pickGifts', [(([25,64,9,4,100],4), 29), (([1,1],2), 2)]),
    'ternary-expression-parser': ('parseTernary', [(('T?2:3',), '2'), (('F?1:T?4:5',), '4'), (('T?T?F:5:3',), 'F')]),
    'the-maze': ('hasPath', [(([[0,0,1,0,0],[0,0,0,0,0],[0,0,0,1,0],[1,1,0,1,1],[0,0,0,0,0]],[0,4],[4,4]), True), (([[0,0,0]],[0,0],[0,1]), False)]),
    'the-number-of-beautiful-subsets': ('beautifulSubsets', [(([2,4,6],2), 4), (([1],1), 1)]),
    'time-needed-to-buy-tickets': ('timeRequiredToBuy', [(([2,3,2],2), 6), (([5,1,1,1],0), 8)]),
    'time-needed-to-inform-all-employees': ('numOfMinutes', [((1,0,[-1],[0]), 0), ((6,2,[2,2,-1,2,2,2],[0,0,1,0,0,0]), 1)]),
    'two-sum-bsts': ('twoSumBSTs', [((tree([2,1,4]),tree([1,0,3]),5), True), ((tree([1]),tree([2]),4), False)]),
    'uncrossed-lines': ('maxUncrossedLines', [(([1,4,2],[1,2,4]), 2), (([2,5,1,2,5],[10,5,2,1,5,2]), 3)]),
    'unique-email-addresses': ('numUniqueEmails', [((['test.email+alex@leetcode.com','test.e.mail+bob.cathy@leetcode.com','testemail+david@lee.tcode.com'],), 2), ((['a@b.com','a@b.com'],), 1)]),
    'unique-length-3-palindromic-subsequences': ('countPalindromicSubsequence', [(('aabca',), 3), (('adc',), 0), (('bbcbaba',), 4)]),
    'valid-word-square': ('validWordSquare', [((['abcd','bnrt','crmy','dtye'],), True), ((['ball','area','read','lady'],), False)]),
    'validate-binary-tree-nodes': ('validateBinaryTreeNodes', [((4,[1,-1,3,-1],[2,-1,-1,-1]), True), ((4,[1,-1,3,-1],[2,3,-1,-1]), False), ((2,[1,0],[-1,-1]), False)]),
    'validate-stack-sequences': ('validateStackSequences', [(([1,2,3,4,5],[4,5,3,2,1]), True), (([1,2,3,4,5],[4,3,5,1,2]), False)]),
    'verify-preorder-sequence-in-binary-search-tree': ('verifyPreorder', [(([5,2,1,3,6],), True), (([5,2,6,1,3],), False)]),
    'verifying-an-alien-dictionary': ('isAlienSorted', [((['hello','leetcode'],'hlabcdefgijkmnopqrstuvwxyz'), True), ((['apple','app'],'abcdefghijklmnopqrstuvwxyz'), False)]),
    'widest-vertical-area-between-two-points-containing-no-points': ('maxWidthOfVerticalArea', [(([[8,7],[9,9],[7,4],[9,7]],), 1), (([[1,1],[10,2]],), 9)]),
    'word-break-ii': ('wordBreak', [(('catsanddog',['cat','cats','and','sand','dog']), ['cats and dog','cat sand dog']), (('catsandog',['cats','dog','sand','and','cat']), [])]),
    'word-pattern': ('wordPattern', [(('abba','dog cat cat dog'), True), (('abba','dog cat cat fish'), False), (('abba','dog dog dog dog'), False)]),
    'word-subsets': ('wordSubsets', [((['amazon','apple','facebook','google','leetcode'],['e','o']), ['facebook','google','leetcode']), ((['a'],['aa']), [])]),
    'minimize-deviation-in-array': ('minimumDeviation', [(([1,2,3,4],), 1), (([4,1,5,20,3],), 3)]),
    'palindrome-linked-list': ('isPalindrome', [((linked([1,2,2,1]),), True), ((linked([1,2]),), False)]),
    'maximum-twin-sum-of-a-linked-list': ('pairSum', [((linked([5,4,2,1]),), 6), ((linked([4,2,2,3]),), 7)]),
    'subarray-product-less-than-k': ('numSubarrayProductLessThanK', [(([10,5,2,6],100),8), (([1,2,3],0),0), (([1,1,1],2),6), (([10],10),0), (([10],11),1), (([1000,1000],1000000),2)]),
}

UNORDERED = set('brace-expansion closest-binary-search-tree-value-ii find-all-duplicates-in-an-array find-all-people-with-secret intersection-of-two-arrays kill-process majority-element-ii minimum-height-trees minimum-number-of-vertices-to-reach-all-nodes remove-sub-folders-from-the-filesystem single-number-iii string-matching-in-an-array strobogrammatic-number-ii word-break-ii word-subsets'.split())


def normalize(pid, value):
    if pid in UNORDERED:
        return sorted(value)
    if pid == 'find-the-difference-of-two-arrays':
        return [sorted(row) for row in value]
    if pid == 'find-leaves-of-binary-tree':
        return [sorted(row) for row in value]
    return CORE['normalize'](pid, value)


LINKED_CASES = {
    'add-two-numbers-ii': ('addTwoNumbers', [((linked([7,2,4,3]),linked([5,6,4])), [7,8,0,7]), ((linked([9,9]),linked([1])), [1,0,0])]),
    'insertion-sort-list': ('insertionSortList', [((linked([4,2,1,3]),), [1,2,3,4]), ((None,), [])]),
    'merge-in-between-linked-lists': ('mergeInBetween', [((linked([10,1,13,6,9,5]),3,4,linked([1000000,1000001,1000002])), [10,1,13,1000000,1000001,1000002,5]), ((linked([0,1,2,3,4]),1,3,linked([8])), [0,8,4])]),
    'middle-of-the-linked-list': ('middleNode', [((linked([1,2,3,4,5]),), [3,4,5]), ((linked([1,2,3,4,5,6]),), [4,5,6])]),
    'partition-list': ('partition', [((linked([1,4,3,2,5,2]),3), [1,2,2,4,3,5]), ((linked([2,1]),2), [1,2])]),
    'remove-linked-list-elements': ('removeElements', [((linked([1,2,6,3,4,5,6]),6), [1,2,3,4,5]), ((linked([7,7]),7), []), ((None,1), [])]),
    'remove-nodes-from-linked-list': ('removeNodes', [((linked([5,2,13,3,8]),), [13,8]), ((linked([1,1,1]),), [1,1,1])]),
    'reverse-linked-list-ii': ('reverseBetween', [((linked([1,2,3,4,5]),2,4), [1,4,3,2,5]), ((linked([1,2]),1,2), [2,1])]),
    'sort-list': ('sortList', [((linked([4,2,1,3]),), [1,2,3,4]), ((linked([-1,5,3,4,0]),), [-1,0,3,4,5]), ((None,), [])]),
    'swapping-nodes-in-a-linked-list': ('swapNodes', [((linked([1,2,3,4,5]),2), [1,4,3,2,5]), ((linked([1]),1), [1])]),
}

TREE_CASES = {
    'convert-bst-to-greater-tree': ('convertBST', [((tree([2,1,3]),), tree([5,6,3])), ((None,), None)]),
    'delete-leaves-with-a-given-value': ('removeLeafNodes', [((tree([1,2,3,2,None,2,4]),2), tree([1,None,3,None,4])), ((tree([2,2,2]),2), None)]),
    'merge-two-binary-trees': ('mergeTrees', [((tree([1,3,2,5]),tree([2,1,3,None,4,None,7])), tree([3,4,5,5,4,None,7])), ((None,tree([1])), tree([1]))]),
    'search-in-a-binary-search-tree': ('searchBST', [((tree([4,2,7,1,3]),2), tree([2,1,3])), ((tree([1]),2), None)]),
    'trim-a-binary-search-tree': ('trimBST', [((tree([1,0,2]),1,2), tree([1,None,2])), ((tree([3,0,4,None,2,None,None,1]),1,3), tree([3,2,None,1]))]),
}


class NaryNode:
    def __init__(self, val=0, children=None):
        self.val, self.children = val, children or []
        self.left = self.right = self.parent = None


class QuadNode:
    def __init__(self, val=False, isLeaf=False, topLeft=None, topRight=None, bottomLeft=None, bottomRight=None):
        self.val, self.isLeaf = val, isLeaf
        self.topLeft, self.topRight = topLeft, topRight
        self.bottomLeft, self.bottomRight = bottomLeft, bottomRight


def nary_values(root):
    return None if root is None else (root.val, tuple(nary_values(child) for child in root.children))


def inorder(root):
    return inorder(root.left) + [root.val] + inorder(root.right) if root else []


def check_special(pid, ns):
    solution = ns['Solution']() if 'Solution' in ns and pid != 'random-pick-with-weight' else None
    if pid in LINKED_CASES or pid in TREE_CASES:
        method, cases = {**LINKED_CASES, **TREE_CASES}[pid]
        convert = list_values if pid in LINKED_CASES else tree_values
        for args, expected in cases:
            result = getattr(solution, method)(*copy.deepcopy(args))
            assert convert(result) == (expected if pid in LINKED_CASES else convert(expected)), pid
        return len(cases)
    if pid in ['insert-into-a-binary-search-tree', 'delete-node-in-a-bst']:
        if pid.startswith('insert'):
            tests = [(tree([4,2,7,1,3]),5,[1,2,3,4,5,7]), (None,1,[1])]
            method = solution.insertIntoBST
        else:
            tests = [(tree([5,3,6,2,4,None,7]),3,[2,4,5,6,7]), (tree([1]),1,[]), (tree([1]),2,[1])]
            method = solution.deleteNode
        for root, value, expected in tests:
            assert inorder(method(root,value)) == expected
        return len(tests)
    if pid == 'recover-binary-search-tree':
        for before, after in [([1,3,None,None,2],[3,1,None,None,2]), ([3,1,4,None,None,2],[2,1,4,None,None,3])]:
            root = tree(before)
            assert solution.recoverTree(root) is None
            assert tree_values(root) == tree_values(tree(after))
        return 2
    if pid == 'all-possible-full-binary-trees':
        def inspect(node):
            assert node is not None and node.val == 0
            assert bool(node.left) == bool(node.right)
            return 1 + inspect(node.left) + inspect(node.right) if node.left else 1
        for n, count in [(1,1),(2,0),(7,5)]:
            roots = solution.allPossibleFBT(n)
            assert len(roots) == count
            assert len({str(tree_values(root)) for root in roots}) == count
            assert all(inspect(root) == n for root in roots)
        return 3
    if pid in ['clone-n-ary-tree','diameter-of-n-ary-tree','find-root-of-n-ary-tree','n-ary-tree-postorder-traversal','serialize-and-deserialize-n-ary-tree','encode-n-ary-tree-to-binary-tree']:
        root = NaryNode(1,[NaryNode(3,[NaryNode(5),NaryNode(6)]),NaryNode(2),NaryNode(4)])
        if pid == 'clone-n-ary-tree':
            clone = solution.cloneTree(root)
            assert nary_values(clone) == nary_values(root) and clone is not root
            assert clone.children[0] is not root.children[0] and solution.cloneTree(None) is None
        elif pid == 'diameter-of-n-ary-tree':
            assert solution.diameter(root) == 3 and solution.diameter(NaryNode(1)) == 0
        elif pid == 'find-root-of-n-ary-tree':
            assert solution.findRoot([root.children[1],root,*root.children[:1],*root.children[0].children,root.children[2]]) is root
            assert solution.findRoot([NaryNode(9)]).val == 9
        elif pid == 'n-ary-tree-postorder-traversal':
            assert solution.postorder(root) == [5,6,3,2,4,1] and solution.postorder(None) == []
        else:
            codec = ns['Codec']()
            encode = codec.serialize if pid.startswith('serialize') else codec.encode
            decode = codec.deserialize if pid.startswith('serialize') else codec.decode
            assert nary_values(decode(encode(root))) == nary_values(root)
            assert decode(encode(None)) is None
        return 2
    if pid == 'construct-quad-tree':
        def expand(node, size):
            if node.isLeaf:
                assert not any([node.topLeft,node.topRight,node.bottomLeft,node.bottomRight])
                return [[int(node.val)] * size for _ in range(size)]
            half = size // 2
            tl,tr,bl,br = [expand(child, half) for child in [node.topLeft,node.topRight,node.bottomLeft,node.bottomRight]]
            return [a+b for a,b in zip(tl,tr)] + [a+b for a,b in zip(bl,br)]
        for grid in [[[1]], [[0,1],[1,0]], [[1,1],[1,1]]]:
            assert expand(solution.construct(grid), len(grid)) == grid
        return 3
    if pid == 'find-duplicate-subtrees':
        result = solution.findDuplicateSubtrees(tree([1,2,3,4,None,2,4,None,None,4]))
        assert sorted(str(tree_values(node)) for node in result) == sorted(str(tree_values(tree(row))) for row in [[2,4],[4]])
        assert solution.findDuplicateSubtrees(tree([1])) == []
        return 2
    if pid in ['intersection-of-two-linked-lists','linked-list-cycle-ii']:
        if pid.startswith('intersection'):
            shared = linked([8,4,5]); a = ListNode(1,shared); b = ListNode(2,ListNode(3,shared))
            assert solution.getIntersectionNode(a,b) is shared
            assert solution.getIntersectionNode(linked([1]),linked([1])) is None
        else:
            head = linked([3,2,0,-4]); head.next.next.next.next = head.next
            assert solution.detectCycle(head) is head.next
            assert solution.detectCycle(linked([1])) is None
        return 2
    if pid in ['lowest-common-ancestor-of-a-binary-tree','lowest-common-ancestor-of-a-binary-tree-iii']:
        root = tree([3,5,1,6,2,0,8,None,None,7,4])
        def parents(node, parent=None):
            if node:
                node.parent = parent; parents(node.left,node); parents(node.right,node)
        parents(root)
        def lca(p,q):
            return solution.lowestCommonAncestor(p,q) if pid.endswith('-iii') else solution.lowestCommonAncestor(root,p,q)
        assert lca(root.left,root.right) is root
        assert lca(root.left,root.left.right.right) is root.left
        return 2
    if pid == 'split-linked-list-in-parts':
        for args, expected in [((linked([1,2,3]),5), [[1],[2],[3],[],[]]), ((linked([1,2,3,4,5,6,7]),3), [[1,2,3],[4,5],[6,7]])]:
            assert [list_values(head) for head in solution.splitListToParts(*args)] == expected
        return 2
    if pid == 'print-immutable-linked-list-in-reverse':
        printed = []
        class ImmutableListNode:
            def __init__(self, val, next=None): self.val,self.next = val,next
            def printValue(self): printed.append(self.val)
            def getNext(self): return self.next
        for values in [[1,2,3],[7]]:
            head = None
            for value in reversed(values): head = ImmutableListNode(value,head)
            printed.clear(); solution.printLinkedListInReverse(head)
            assert printed == values[::-1]
        return 2
    if pid == 'string-compression':
        for text, expected in [('aabbccc','a2b2c3'),('a','a'),('a' * 12,'a12')]:
            chars = list(text); length = solution.compress(chars)
            assert length == len(expected) and ''.join(chars[:length]) == expected
        return 3
    if pid == 'next-permutation':
        for nums, expected in [([1,2,3],[1,3,2]),([3,2,1],[1,2,3]),([1,1,5],[1,5,1])]:
            assert solution.nextPermutation(nums) is None and nums == expected
        return 3
    if pid == 'wiggle-sort':
        for nums in [[3,5,2,1,6,4],[1,1,1,1]]:
            before = Counter(nums); solution.wiggleSort(nums)
            assert Counter(nums) == before
            assert all(nums[i] <= nums[i+1] if i % 2 == 0 else nums[i] >= nums[i+1] for i in range(len(nums)-1))
        return 2
    if pid == 'candy-crush':
        for board, expected in [([[110,5,112,113,114],[210,211,5,213,214],[310,311,3,313,314],[410,411,412,5,414],[5,1,512,3,3],[610,4,1,613,614],[710,1,2,713,714],[810,1,2,1,1],[1,1,2,2,2],[4,1,4,4,1014]], [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[110,0,0,0,114],[210,0,0,0,214],[310,0,0,113,314],[410,0,0,213,414],[610,211,112,313,614],[710,311,412,613,714],[810,411,512,713,1014]]), ([[1,2],[3,4]],[[1,2],[3,4]])]:
            assert solution.candyCrush(board) == expected
        return 2
    if pid in ['first-bad-version','guess-number-higher-or-lower']:
        for n, target in [(5,4),(1,1),(10,1)]:
            ns['isBadVersion'] = lambda version: version >= target
            ns['guess'] = lambda value: (target > value) - (target < value)
            assert (solution.firstBadVersion(n) if pid.startswith('first') else solution.guessNumber(n)) == target
        return 3
    if pid == 'find-in-mountain-array':
        class MountainArray:
            def __init__(self, values): self.values = values
            def get(self, i): return self.values[i]
            def length(self): return len(self.values)
        assert solution.findInMountainArray(3,MountainArray([1,2,3,4,5,3,1])) == 2
        assert solution.findInMountainArray(3,MountainArray([0,1,2,4,2,1])) == -1
        return 2
    if pid == 'find-the-celebrity':
        for matrix, expected in [([[True,True,False],[False,True,False],[False,True,True]],1), ([[True,True,False],[False,True,True],[True,False,True]],-1)]:
            ns['knows'] = lambda a,b: matrix[a][b]
            # Each judge instance has one fixed knows graph. Do not change that
            # API behind a memoized instance between independent test graphs.
            assert ns['Solution']().findCelebrity(3) == expected
        return 2
    if pid == 'web-crawler':
        pages = {'http://news.test/a':['http://news.test/b','http://other.test/a'], 'http://news.test/b':['http://news.test/a']}
        class HtmlParser:
            def getUrls(self, url): return pages.get(url,[])
        assert sorted(solution.crawl('http://news.test/a',HtmlParser())) == ['http://news.test/a','http://news.test/b']
        assert solution.crawl('http://empty.test',HtmlParser()) == ['http://empty.test']
        return 2
    if pid == 'array-with-elements-not-equal-to-average-of-neighbors':
        for nums in [[1,2,3,4,5],[6,2,0,9,7]]:
            result = solution.rearrangeArray(nums[:])
            assert sorted(result) == sorted(nums)
            assert all(result[i]*2 != result[i-1]+result[i+1] for i in range(1,len(result)-1))
        return 2
    if pid == 'convert-an-array-into-a-2d-array-with-conditions':
        for nums in [[1,3,4,1,2,3,1],[1,2,3,4]]:
            result = solution.findMatrix(nums[:])
            assert Counter(value for row in result for value in row) == Counter(nums)
            assert len(result) == max(Counter(nums).values())
            assert all(len(row) == len(set(row)) for row in result)
        return 2
    if pid == 'divide-array-into-arrays-with-max-difference':
        for nums,k,possible in [([1,3,4,8,7,9,3,5,1],2,True),([1,3,3,2,7,3],3,False)]:
            result = solution.divideArray(nums[:],k)
            if not possible:
                assert result == []
            else:
                assert Counter(value for row in result for value in row) == Counter(nums)
                assert all(len(row) == 3 and max(row)-min(row) <= k for row in result)
        return 2
    if pid == 'custom-sort-string':
        for order,s in [('cba','abcd'),('bcafg','abcd')]:
            result = solution.customSortString(order,s)
            assert Counter(result) == Counter(s)
            ranks = [order.index(char) for char in result if char in order]
            assert ranks == sorted(ranks)
        return 2
    if pid == 'find-anagram-mappings':
        for a,b in [([12,28,46,32,50],[50,12,32,46,28]),([1],[1])]:
            result = solution.anagramMappings(a[:],b[:])
            assert len(result) == len(a) and all(0 <= index < len(b) and a[i] == b[index] for i,index in enumerate(result))
        return 2
    if pid == 'find-missing-observations':
        for rolls,mean,n,possible in [([3,2,4,3],4,2,True),([1,5,6],3,4,True),([1,2,3,4],6,4,False)]:
            result = solution.missingRolls(rolls,mean,n)
            if not possible:
                assert result == []
            else:
                assert len(result) == n and all(1 <= value <= 6 for value in result)
                assert sum(result)+sum(rolls) == mean*(len(rolls)+n)
        return 3
    if pid == 'find-unique-binary-string':
        for nums in [['01','10'],['000','001','010']]:
            result = solution.findDifferentBinaryString(nums)
            assert len(result) == len(nums) and set(result) <= {'0','1'} and result not in nums
        return 2
    if pid == 'largest-divisible-subset':
        for nums,length in [([1,2,4,8],4),([1,2,3],2),([7],1)]:
            result = solution.largestDivisibleSubset(nums[:])
            assert len(result) == length and len(set(result)) == length and set(result) <= set(nums)
            assert all(a % b == 0 or b % a == 0 for a in result for b in result)
        return 3
    if pid == 'minimum-remove-to-make-valid-parentheses':
        for text,length in [('lee(t(c)o)de)',12),('a)b(c)d',6),('))((',0)]:
            result = solution.minRemoveToMakeValid(text)
            assert len(result) == length
            original = iter(text)
            assert all(any(item == char for item in original) for char in result)
            assert ''.join(c for c in result if c not in '()') == ''.join(c for c in text if c not in '()')
            balance = 0
            for char in result:
                balance += (char == '(') - (char == ')')
                assert balance >= 0
            assert balance == 0
        return 3
    if pid == 'queue-reconstruction-by-height':
        for people in [[[7,0],[4,4],[7,1],[5,0],[6,1],[5,2]],[[1,0]]]:
            result = solution.reconstructQueue(copy.deepcopy(people))
            assert sorted(result) == sorted(people)
            assert all(sum(h >= height for h,_ in result[:i]) == k for i,(height,k) in enumerate(result))
        return 2
    if pid == 'shortest-common-supersequence':
        for a,b,length in [('abac','cab',5),('aaaaaaaa','aaaaaaaa',8)]:
            result = solution.shortestCommonSupersequence(a,b)
            assert isinstance(result,str) and len(result) == length
            for source in [a,b]:
                output = iter(result)
                assert all(any(c == char for c in output) for char in source)
        return 2
    if pid == 'sort-array-by-parity':
        for nums in [[3,1,2,4],[0]]:
            result = solution.sortArrayByParity(nums[:])
            assert sorted(result) == sorted(nums)
            assert [n % 2 for n in result] == sorted(n % 2 for n in nums)
        return 2
    if pid == 'sort-characters-by-frequency':
        for text in ['tree','cccaaa','Aabb']:
            result = solution.frequencySort(text)
            assert Counter(result) == Counter(text)
            counts = Counter(text)
            assert [counts[c] for c in result] == sorted([counts[c] for c in text],reverse=True)
            assert all(result.count(c) == result.rfind(c)-result.find(c)+1 for c in set(result))
        return 3
    if pid == 'build-a-matrix-with-conditions':
        rows,cols = [[1,2],[3,2]],[[2,1],[3,2]]
        result = solution.buildMatrix(3,rows,cols)
        assert len(result) == 3 and all(len(row) == 3 for row in result)
        positions = {value:(r,c) for r,row in enumerate(result) for c,value in enumerate(row) if value}
        assert sorted(positions) == [1,2,3] and sum(bool(v) for row in result for v in row) == 3
        assert all(positions[a][0] < positions[b][0] for a,b in rows)
        assert all(positions[a][1] < positions[b][1] for a,b in cols)
        assert solution.buildMatrix(2,[[1,2],[2,1]],[]) == []
        return 2
    if pid == 'sort-items-by-groups-respecting-dependencies':
        n,m,group,before = 8,2,[-1,-1,1,0,0,1,0,-1],[[],[6],[5],[6],[3,6],[],[],[]]
        result = solution.sortItems(n,m,group[:],copy.deepcopy(before))
        assert sorted(result) == list(range(n))
        assert all(result.index(dependency) < result.index(i) for i,deps in enumerate(before) for dependency in deps)
        for g in range(m):
            positions = [result.index(i) for i in range(n) if group[i] == g]
            assert max(positions)-min(positions)+1 == len(positions)
        assert solution.sortItems(2,1,[0,0],[[1],[0]]) == []
        return 2
    return check_stateful(pid, ns)


# Constructor arguments followed by an operation trace. Every query has a
# concrete expected result; mutations are also checked through later queries.
STATEFUL = {
    'binary-search-tree-iterator': ('BSTIterator',(tree([7,3,15,None,None,9,20]),), [('hasNext',(),True),('next',(),3),('next',(),7),('next',(),9),('hasNext',(),True),('next',(),15),('next',(),20),('hasNext',(),False)]),
    'design-a-food-rating-system': ('FoodRatings',(['kimchi','miso','sushi','ramen'],['korean','japanese','japanese','japanese'],[9,12,8,14]), [('highestRated',('japanese',),'ramen'),('changeRating',('sushi',16),None),('highestRated',('japanese',),'sushi'),('changeRating',('ramen',16),None),('highestRated',('japanese',),'ramen'),('changeRating',('ramen',1),None),('highestRated',('japanese',),'sushi')]),
    'design-a-leaderboard': ('Leaderboard',(), [('addScore',(1,73),None),('addScore',(2,56),None),('addScore',(3,39),None),('top',(2,),129),('addScore',(2,20),None),('top',(1,),76),('reset',(2,),None),('top',(2,),112)]),
    'design-browser-history': ('BrowserHistory',('leetcode.com',), [('visit',('google.com',),None),('visit',('facebook.com',),None),('back',(1,),'google.com'),('back',(5,),'leetcode.com'),('forward',(1,),'google.com'),('visit',('youtube.com',),None),('forward',(5,),'youtube.com'),('back',(1,),'google.com')]),
    'design-circular-queue': ('MyCircularQueue',(2,), [('isEmpty',(),True),('Front',(),-1),('enQueue',(1,),True),('enQueue',(2,),True),('enQueue',(3,),False),('isFull',(),True),('Rear',(),2),('deQueue',(),True),('enQueue',(3,),True),('Front',(),2),('Rear',(),3),('deQueue',(),True),('deQueue',(),True),('deQueue',(),False)]),
    'design-compressed-string-iterator': ('StringIterator',('a2b10',), [('hasNext',(),True)]+[('next',(),'a')]*2+[('next',(),'b')]*10+[('hasNext',(),False),('next',(),' ')]),
    'design-hashmap': ('MyHashMap',(), [('get',(1,),-1),('put',(1,1),None),('put',(2,2),None),('put',(1,3),None),('get',(1,),3),('remove',(1,),None),('get',(1,),-1),('put',(1000000,7),None),('get',(1000000,),7)]),
    'design-hashset': ('MyHashSet',(), [('add',(1,),None),('add',(2,),None),('add',(2,),None),('contains',(2,),True),('remove',(2,),None),('contains',(2,),False),('contains',(1,),True),('add',(1000000,),None),('contains',(1000000,),True)]),
    'design-linked-list': ('MyLinkedList',(), [('get',(0,),-1),('addAtHead',(1,),None),('addAtTail',(3,),None),('addAtIndex',(1,2),None),('get',(1,),2),('deleteAtIndex',(1,),None),('get',(1,),3),('addAtIndex',(10,8),None),('get',(2,),-1),('deleteAtIndex',(0,),None),('get',(0,),3)]),
    'design-search-autocomplete-system': ('AutocompleteSystem',(['i love you','island','iroman','i love leetcode'],[5,3,2,2]), [('input',('i',),['i love you','island','i love leetcode']),('input',(' ',),['i love you','i love leetcode']),('input',('a',),[]),('input',('#',),[]),('input',('i',),['i love you','island','i love leetcode']),('input',(' ',),['i love you','i love leetcode','i a'])]),
    'design-tic-tac-toe': ('TicTacToe',(3,), [('move',(0,0,1),0),('move',(0,2,2),0),('move',(2,2,1),0),('move',(1,1,2),0),('move',(2,0,1),0),('move',(1,0,2),0),('move',(2,1,1),1)]),
    'first-unique-number': ('FirstUnique',([2,3,5],), [('showFirstUnique',(),2),('add',(5,),None),('showFirstUnique',(),2),('add',(2,),None),('showFirstUnique',(),3),('add',(3,),None),('showFirstUnique',(),-1)]),
    'implement-queue-using-stacks': ('MyQueue',(), [('empty',(),True),('push',(1,),None),('push',(2,),None),('peek',(),1),('pop',(),1),('push',(3,),None),('pop',(),2),('pop',(),3),('empty',(),True)]),
    'insert-delete-getrandom-o1': ('RandomizedSet',(), [('insert',(1,),True),('insert',(1,),False),('getRandom',(),1),('insert',(2,),True),('remove',(1,),True),('remove',(1,),False),('getRandom',(),2)]),
    'lfu-cache': ('LFUCache',(2,), [('put',(1,1),None),('put',(2,2),None),('get',(1,),1),('put',(3,3),None),('get',(2,),-1),('get',(3,),3),('put',(4,4),None),('get',(1,),-1),('get',(3,),3),('get',(4,),4)]),
    'maximum-frequency-stack': ('FreqStack',(), [('push',(v,),None) for v in [5,7,5,7,4,5]]+[('pop',(),v) for v in [5,7,5,4]]),
    'moving-average-from-data-stream': ('MovingAverage',(3,), [('next',(1,),1),('next',(10,),5.5),('next',(3,),14/3),('next',(5,),6)]),
    'my-calendar-i': ('MyCalendar',(), [('book',(10,20),True),('book',(15,25),False),('book',(20,30),True),('book',(5,10),True),('book',(10,20),False)]),
    'online-stock-span': ('StockSpanner',(), [('next',(price,),span) for price,span in zip([100,80,60,70,60,75,85],[1,1,1,2,1,4,6])]),
    'operations-on-tree': ('LockingTree',([-1,0,0,1,1,2,2],), [('lock',(2,2),True),('unlock',(2,3),False),('unlock',(2,2),True),('lock',(4,5),True),('upgrade',(0,1),True),('lock',(0,1),False),('unlock',(4,5),False),('unlock',(0,1),True)]),
    'prefix-and-suffix-search': ('WordFilter',(['apple','apply','apple'],), [('f',('a','e'),2),('f',('app','ly'),1),('f',('b','e'),-1)]),
    'range-sum-query-2d-immutable': ('NumMatrix',([[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]],), [('sumRegion',(2,1,4,3),8),('sumRegion',(1,1,2,2),11),('sumRegion',(0,0,0,0),3)]),
    'range-sum-query-immutable': ('NumArray',([-2,0,3,-5,2,-1],), [('sumRange',(0,2),1),('sumRange',(2,5),-1),('sumRange',(0,5),-3)]),
    'range-sum-query-mutable': ('NumArray',([1,3,5],), [('sumRange',(0,2),9),('update',(1,2),None),('sumRange',(0,2),8),('sumRange',(1,1),2),('update',(0,-1),None),('sumRange',(0,1),1)]),
    'seat-reservation-manager': ('SeatManager',(3,), [('reserve',(),1),('reserve',(),2),('unreserve',(1,),None),('reserve',(),1),('reserve',(),3)]),
    'zigzag-iterator': ('ZigzagIterator',([1,2],[3,4,5,6]), [('hasNext',(),True)]+[('next',(),v) for v in [1,3,2,4,5,6]]+[('hasNext',(),False)]),
}


def check_stateful(pid, ns):
    if pid in STATEFUL:
        cls,args,operations = STATEFUL[pid]
        obj = ns[cls](*copy.deepcopy(args))
        for method,inputs,expected in operations:
            actual = getattr(obj,method)(*inputs)
            assert actual == expected, (method,inputs,actual,expected)
        if pid == 'lfu-cache':
            empty = ns[cls](0); empty.put(1,1); assert empty.get(1) == -1
        if pid == 'zigzag-iterator':
            empty = ns[cls]([],[]); assert not empty.hasNext()
        return len(operations)
    if pid == 'encode-and-decode-tinyurl':
        codec = ns['Codec']()
        urls = ['https://leetcode.com/problems/design-tinyurl','https://example.com/other','https://leetcode.com/problems/design-tinyurl']
        encoded = [codec.encode(url) for url in urls]
        assert encoded[0] != encoded[1]
        assert [codec.decode(url) for url in encoded] == urls
        return 3
    if pid == 'flatten-nested-list-iterator':
        class NestedInteger:
            def __init__(self,value): self.value = value
            def isInteger(self): return isinstance(self.value,int)
            def getInteger(self): return self.value if self.isInteger() else None
            def getList(self): return [NestedInteger(value) for value in self.value] if not self.isInteger() else None
        for values,expected in [([[1,1],2,[1,1]],[1,1,2,1,1]),([[],[[],[3]]],[3]),([],[])]:
            obj = ns['NestedIterator']([NestedInteger(value) for value in values])
            output = []
            while obj.hasNext():
                assert obj.hasNext(); output.append(obj.next())
                assert len(output) <= len(expected)
            assert output == expected
        return 3
    if pid == 'random-pick-with-weight':
        from unittest.mock import patch
        obj = ns['Solution']([1,3,2])
        with patch.object(ns['random'],'random',side_effect=[0.0,0.16,0.2,0.65,0.7,0.9999]):
            assert [obj.pickIndex() for _ in range(6)] == [0,0,1,1,2,2]
        return 6
    raise AssertionError(f'No behavioral fixture for {pid}')
