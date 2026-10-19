#!/usr/bin/env python3
"""Execute finite example/boundary checks for every added Python approach.

This is an offline content check, not a judge for user code or an exhaustive proof.
Inputs are copied for each run because several algorithms mutate them.
"""
from collections import Counter
import ast
import copy
import json
import math
from pathlib import Path
import runpy
import signal

ROOT = Path(__file__).resolve().parents[1]
BASE = runpy.run_path(str(ROOT / 'scripts/verify-problem-references.py'))
TreeNode, ListNode, Node = (BASE[k] for k in ['TreeNode', 'ListNode', 'Node'])

# (LeetCode method, [(arguments, expected result), ...]). Unordered results are
# normalized below; structural and stateful contracts have dedicated checks.
CASES = {
    **BASE['CASES'],
    'group-anagrams': ('groupAnagrams', [((['eat','tea','tan','ate','nat','bat'],), [['eat','tea','ate'],['tan','nat'],['bat']]), (([''],), [['']])]),
    'top-k-frequent-elements': ('topKFrequent', [(([1,1,1,2,2,3],2), [1,2]), (([7],1), [7])]),
    'two-sum-ii-input-array-is-sorted': ('twoSum', [(([2,7,11,15],9), [1,2]), (([-1,0],-1), [1,2])]),
    '3sum': ('threeSum', [(([-1,0,1,2,-1,-4],), [[-1,-1,2],[-1,0,1]]), (([0,0,0,0],), [[0,0,0]])]),
    'container-with-most-water': ('maxArea', [(([1,8,6,2,5,4,8,3,7],),49), (([1,1],),1)]),
    'best-time-to-buy-and-sell-stock': ('maxProfit', [(([7,1,5,3,6,4],),5), (([7,6,4,3,1],),0)]),
    'longest-repeating-character-replacement': ('characterReplacement', [(('AABABBA',1),4), (('ABAB',2),4)]),
    'permutation-in-string': ('checkInclusion', [(('ab','eidbaooo'),True), (('ab','eidboaoo'),False)]),
    'minimum-window-substring': ('minWindow', [(('ADOBECODEBANC','ABC'),'BANC'), (('a','aa'),'')]),
    'sliding-window-maximum': ('maxSlidingWindow', [(([1,3,-1,-3,5,3,6,7],3),[3,3,5,5,6,7]), (([1],1),[1])]),
    'evaluate-reverse-polish-notation': ('evalRPN', [((['2','1','+','3','*'],),9), ((['4','-3','/'],),-1)]),
    'generate-parentheses': ('generateParenthesis', [((3,),['((()))','(()())','(())()','()(())','()()()']), ((1,),['()'])]),
    'car-fleet': ('carFleet', [((12,[10,8,0,5,3],[2,4,1,1,3]),3), ((10,[3],[3]),1)]),
    'largest-rectangle-in-histogram': ('largestRectangleArea', [(([2,1,5,6,2,3],),10), (([2,2],),4)]),
    'search-a-2d-matrix': ('searchMatrix', [(([[1,3,5],[7,9,11]],9),True), (([[1]],0),False)]),
    'find-minimum-in-rotated-sorted-array': ('findMin', [(([3,4,5,1,2],),1), (([1],),1)]),
    'search-in-rotated-sorted-array': ('search', [(([4,5,6,7,0,1,2],0),4), (([1],0),-1)]),
    'median-of-two-sorted-arrays': ('findMedianSortedArrays', [(([1,3],[2]),2), (([],[1,2]),1.5)]),
    'find-the-duplicate-number': ('findDuplicate', [(([1,3,4,2,2],),2), (([3,1,3,4,2],),3)]),
    'k-closest-points-to-origin': ('kClosest', [(([[1,3],[-2,2]],1),[[-2,2]]), (([[1,0],[2,0],[3,0]],2),[[1,0],[2,0]])]),
    'last-stone-weight': ('lastStoneWeight', [(([2,7,4,1,8,1],),1), (([1,1],),0)]),
    'task-scheduler': ('leastInterval', [((list('AAABBB'),2),8), ((list('AAABBB'),0),6)]),
    'subsets': ('subsets', [(([1,2],),[[],[1],[2],[1,2]]), (([],),[[]])]),
    'combination-sum': ('combinationSum', [(([2,3,6,7],7),[[2,2,3],[7]]), (([2],1),[])]),
    'permutations': ('permute', [(([1,2],),[[1,2],[2,1]]), (([1],),[[1]])]),
    'subsets-ii': ('subsetsWithDup', [(([1,2,2],),[[],[1],[2],[1,2],[2,2],[1,2,2]]), (([0],),[[],[0]])]),
    'combination-sum-ii': ('combinationSum2', [(([10,1,2,7,6,1,5],8),[[1,1,6],[1,2,5],[1,7],[2,6]]), (([2,2],1),[])]),
    'word-search': ('exist', [(([list('ABCE'),list('SFCS'),list('ADEE')],'ABCCED'),True), (([['A']],'B'),False)]),
    'palindrome-partitioning': ('partition', [(('aab',),[['a','a','b'],['aa','b']]), (('a',),[['a']])]),
    'letter-combinations-of-a-phone-number': ('letterCombinations', [(('23',),['ad','ae','af','bd','be','bf','cd','ce','cf']), (('',),[])]),
    'n-queens': ('solveNQueens', [((1,),[['Q']]), ((2,),[])]),
    'max-area-of-island': ('maxAreaOfIsland', [(([[1,1,0],[0,1,0],[0,0,1]],),3), (([[0]],),0)]),
    'pacific-atlantic-water-flow': ('pacificAtlantic', [(([[1,2],[4,3]],),[[0,1],[1,0],[1,1]]), (([[1]],),[[0,0]])]),
    'rotting-oranges': ('orangesRotting', [(([[2,1,1],[1,1,0],[0,1,1]],),4), (([[0,2]],),0), (([[1]],),-1)]),
    'redundant-connection': ('findRedundantConnection', [(([[1,2],[1,3],[2,3]],),[2,3])]),
    'number-of-connected-components-in-an-undirected-graph': ('countComponents', [((5,[[0,1],[1,2],[3,4]]),2), ((3,[]),3)]),
    'graph-valid-tree': ('validTree', [((5,[[0,1],[0,2],[0,3],[1,4]]),True), ((3,[[0,1],[1,2],[2,0]]),False)]),
    'word-ladder': ('ladderLength', [(('hit','cog',['hot','dot','dog','lot','log','cog']),5), (('hit','cog',['hot','dot']),0)]),
    'reconstruct-itinerary': ('findItinerary', [(([['MUC','LHR'],['JFK','MUC'],['SFO','SJC'],['LHR','SFO']],),['JFK','MUC','LHR','SFO','SJC']), (([['JFK','KUL'],['JFK','NRT'],['NRT','JFK']],),['JFK','NRT','JFK','KUL'])]),
    'swim-in-rising-water': ('swimInWater', [(([[0,2],[1,3]],),3), (([[0]],),0)]),
    'cheapest-flights-within-k-stops': ('findCheapestPrice', [((3,[[0,1,100],[1,2,100],[0,2,500]],0,2,1),200), ((3,[[0,1,100],[1,2,100],[0,2,500]],0,2,0),500)]),
    'min-cost-climbing-stairs': ('minCostClimbingStairs', [(([10,15,20],),15), (([0,0],),0)]),
    'house-robber': ('rob', [(([1,2,3,1],),4), (([2],),2)]),
    'house-robber-ii': ('rob', [(([2,3,2],),3), (([1],),1)]),
    'palindromic-substrings': ('countSubstrings', [(('aaa',),6), (('abc',),3)]),
    'decode-ways': ('numDecodings', [(('226',),3), (('06',),0), (('10',),1)]),
    'maximum-product-subarray': ('maxProduct', [(([2,3,-2,4],),6), (([-2,0,-1],),0)]),
    'longest-increasing-subsequence': ('lengthOfLIS', [(([10,9,2,5,3,7,101,18],),4), (([7,7,7],),1)]),
    'partition-equal-subset-sum': ('canPartition', [(([1,5,11,5],),True), (([1,2,3,5],),False)]),
    'best-time-to-buy-and-sell-stock-with-cooldown': ('maxProfit', [(([1,2,3,0,2],),3), (([1],),0)]),
    'coin-change-ii': ('change', [((5,[1,2,5]),4), ((0,[2]),1)]),
    'target-sum': ('findTargetSumWays', [(([1,1,1,1,1],3),5), (([0,0],0),4)]),
    'interleaving-string': ('isInterleave', [(('aabcc','dbbca','aadbbcbcac'),True), (('a','b','aa'),False), (('','',''),True)]),
    'longest-increasing-path-in-a-matrix': ('longestIncreasingPath', [(([[9,9,4],[6,6,8],[2,1,1]],),4), (([[1]],),1)]),
    'distinct-subsequences': ('numDistinct', [(('rabbbit','rabbit'),3), (('a','b'),0)]),
    'burst-balloons': ('maxCoins', [(([3,1,5,8],),167), (([1],),1)]),
    'regular-expression-matching': ('isMatch', [(('aa','a'),False), (('aab','c*a*b'),True), (('ab','.*'),True)]),
    'jump-game-ii': ('jump', [(([2,3,1,1,4],),2), (([0],),0)]),
    'gas-station': ('canCompleteCircuit', [(([1,2,3,4,5],[3,4,5,1,2]),3), (([2,3,4],[3,4,3]),-1)]),
    'hand-of-straights': ('isNStraightHand', [(([1,2,3,6,2,3,4,7,8],3),True), (([1,2,3,4,5],4),False)]),
    'merge-triplets-to-form-target-triplet': ('mergeTriplets', [(([[2,5,3],[1,8,4],[1,7,5]],[2,7,5]),True), (([[1,1,1]],[2,2,2]),False)]),
    'partition-labels': ('partitionLabels', [(('ababcbacadefegdehijhklij',),[9,7,8]), (('abc',),[1,1,1])]),
    'valid-parenthesis-string': ('checkValidString', [(('(*)',),True), ((')*(',),False)]),
    'insert-interval': ('insert', [(([[1,3],[6,9]],[2,5]),[[1,5],[6,9]]), (([],[1,2]),[[1,2]])]),
    'non-overlapping-intervals': ('eraseOverlapIntervals', [(([[1,2],[2,3],[3,4],[1,3]],),1), (([[1,2],[2,3]],),0)]),
    'minimum-interval-to-include-each-query': ('minInterval', [(([[1,4],[2,4],[3,6],[4,4]],[2,3,4,5]),[3,3,1,4]), (([[1,2]],[3]),[-1])]),
    'spiral-matrix': ('spiralOrder', [(([[1,2,3],[4,5,6],[7,8,9]],),[1,2,3,6,9,8,7,4,5]), (([[1],[2]],),[1,2])]),
    'plus-one': ('plusOne', [(([1,2,3],),[1,2,4]), (([9,9],),[1,0,0])]),
    'powx-n': ('myPow', [((2.,10),1024.), ((2.,-2),.25), ((0.,1),0.)]),
    'multiply-strings': ('multiply', [(('123','456'),'56088'), (('0','12'),'0')]),
    'number-of-1-bits': ('hammingWeight', [((11,),3), ((0,),0)]),
    'counting-bits': ('countBits', [((5,),[0,1,1,2,1,2]), ((0,),[0])]),
    'reverse-bits': ('reverseBits', [((43261596,),964176192), ((0,),0)]),
    'missing-number': ('missingNumber', [(([3,0,1],),2), (([0],),1)]),
    'reverse-integer': ('reverse', [((123,),321), ((-120,),-21), ((1534236469,),0)]),
    'longest-common-prefix': ('longestCommonPrefix', [((['flower','flow','flight'],),'fl'), ((['dog','racecar','car'],),'')]),
    'find-the-index-of-the-first-occurrence-in-a-string': ('strStr', [(('sadbutsad','sad'),0), (('leetcode','leeto'),-1)]),
    'first-missing-positive': ('firstMissingPositive', [(([3,4,-1,1],),2), (([1,2,0],),3)]),
    'length-of-last-word': ('lengthOfLastWord', [(('Hello World',),5), (('  a  ',),1)]),
    'pascals-triangle': ('generate', [((1,),[[1]]), ((3,),[[1],[1,1],[1,2,1]])]),
    'best-time-to-buy-and-sell-stock-ii': ('maxProfit', [(([7,1,5,3,6,4],),7), (([7,6,4],),0)]),
    'majority-element': ('majorityElement', [(([2,2,1,1,1,2,2],),2), (([1],),1)]),
    'largest-number': ('largestNumber', [(([3,30,34,5,9],),'9534330'), (([0,0],),'0')]),
    'repeated-dna-sequences': ('findRepeatedDnaSequences', [(('AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT',),['AAAAACCCCC','CCCCCAAAAA']), (('AAAA',),[])]),
    'isomorphic-strings': ('isIsomorphic', [(('egg','add'),True), (('foo','bar'),False)]),
    '4sum': ('fourSum', [(([1,0,-1,0,-2,2],0),[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]), (([2,2,2,2,2],8),[[2,2,2,2]])]),
    'valid-palindrome-ii': ('validPalindrome', [(('abca',),True), (('abc',),False)]),
    'minimum-size-subarray-sum': ('minSubArrayLen', [((7,[2,3,1,2,4,3]),2), ((100,[1,2,3]),0)]),
    'contains-duplicate-ii': ('containsNearbyDuplicate', [(([1,2,3,1],3),True), (([1,2,3,1,2,3],2),False)]),
    'find-k-closest-elements': ('findClosestElements', [(([1,2,3,4,5],4,3),[1,2,3,4]), (([1,2,3],1,-1),[1])]),
    'simplify-path': ('simplifyPath', [(('/home//foo/',),'/home/foo'), (('/../',),'/')]),
    'decode-string': ('decodeString', [(('3[a2[c]]',),'accaccacc'), (('abc',),'abc')]),
    'remove-k-digits': ('removeKdigits', [(('1432219',3),'1219'), (('10200',1),'200'), (('10',2),'0')]),
    '132-pattern': ('find132pattern', [(([3,1,4,2],),True), (([1,2,3,4],),False)]),
    'baseball-game': ('calPoints', [((['5','2','C','D','+'],),30), ((['1','C'],),0)]),
    'asteroid-collision': ('asteroidCollision', [(([5,10,-5],),[5,10]), (([8,-8],),[])]),
    'find-first-and-last-position-of-element-in-sorted-array': ('searchRange', [(([5,7,7,8,8,10],8),[3,4]), (([],0),[-1,-1])]),
    'search-insert-position': ('searchInsert', [(([1,3,5,6],5),2), (([1,3,5,6],7),4)]),
    'sqrtx': ('mySqrt', [((8,),2), ((0,),0)]),
    'search-in-rotated-sorted-array-ii': ('search', [(([2,5,6,0,0,1,2],0),True), (([1,1,1],2),False)]),
    'valid-perfect-square': ('isPerfectSquare', [((16,),True), ((14,),False), ((1,),True)]),
    'unique-binary-search-trees': ('numTrees', [((3,),5), ((1,),1)]),
    'ipo': ('findMaximizedCapital', [((2,0,[1,2,3],[0,1,1]),4), ((1,0,[1],[2]),0)]),
    'car-pooling': ('carPooling', [(([[2,1,5],[3,3,7]],4),False), (([[2,1,5],[3,5,7]],3),True)]),
    'maximum-performance-of-a-team': ('maxPerformance', [((6,[2,10,3,1,5,8],[5,4,3,9,7,2],2),60), ((1,[1],[1],1),1)]),
    'permutations-ii': ('permuteUnique', [(([1,1,2],),[[1,1,2],[1,2,1],[2,1,1]]), (([1],),[[1]])]),
    'n-queens-ii': ('totalNQueens', [((4,),2), ((1,),1)]),
    'combinations': ('combine', [((4,2),[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]), ((1,1),[[1]])]),
    'restore-ip-addresses': ('restoreIpAddresses', [(('25525511135',),['255.255.11.135','255.255.111.35']), (('0000',),['0.0.0.0'])]),
    'matchsticks-to-square': ('makesquare', [(([1,1,2,2,2],),True), (([3,3,3,3,4],),False)]),
    'partition-to-k-equal-sum-subsets': ('canPartitionKSubsets', [(([4,3,2,3,5,2,1],4),True), (([1,2,3,4],3),False)]),
    'maximum-length-of-a-concatenated-string-with-unique-characters': ('maxLength', [((['un','iq','ue'],),4), ((['aa','bb'],),0)]),
    'splitting-a-string-into-descending-consecutive-values': ('splitString', [(('050043',),True), (('1234',),False)]),
    'extra-characters-in-a-string': ('minExtraChar', [(('leetscode',['leet','code','leetcode']),1), (('a',['b']),1)]),
    'evaluate-division': ('calcEquation', [(([['a','b'],['b','c']],[2.,3.],[['a','c'],['b','a'],['a','e'],['a','a']]),[6.,.5,-1.,1.])]),
    'island-perimeter': ('islandPerimeter', [(([[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]],),16), (([[1]],),4)]),
    'accounts-merge': ('accountsMerge', [(([['John','a@x','b@x'],['John','b@x','c@x'],['Mary','m@x']],),[['John','a@x','b@x','c@x'],['Mary','m@x']])]),
    'open-the-lock': ('openLock', [((['0201','0101','0102','1212','2002'],'0202'),6), ((['0000'],'8888'),-1)]),
    'is-graph-bipartite': ('isBipartite', [(([[1,3],[0,2],[1,3],[0,2]],),True), (([[1,2],[0,2],[0,1]],),False)]),
    'find-eventual-safe-states': ('eventualSafeNodes', [(([[1,2],[2,3],[5],[0],[5],[],[]],),[2,4,5,6]), (([[]],),[0])]),
    'snakes-and-ladders': ('snakesAndLadders', [(([[-1,-1],[-1,3]],),1), (([[-1,-1,-1],[-1,9,-1],[-1,-1,-1]],),1)]),
    'shortest-bridge': ('shortestBridge', [(([[0,1],[1,0]],),1), (([[0,1,0],[0,0,0],[0,0,1]],),2)]),
    'find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree': ('findCriticalAndPseudoCriticalEdges', [((5,[[0,1,1],[1,2,1],[2,3,2],[0,3,2],[0,4,3],[3,4,3],[1,4,6]]),[[0,1],[2,3,4,5]])]),
    'path-with-maximum-probability': ('maxProbability', [((3,[[0,1],[1,2],[0,2]],[.5,.5,.2],0,2),.25), ((3,[[0,1]],[.5],0,2),0.)]),
    'remove-max-number-of-edges-to-keep-graph-fully-traversable': ('maxNumEdgesToRemove', [((4,[[3,1,2],[3,2,3],[1,1,3],[1,2,4],[1,1,2],[2,3,4]]),2), ((4,[[3,2,3],[1,1,2],[2,3,4]]),-1)]),
    'triangle': ('minimumTotal', [(([[2],[3,4],[6,5,7],[4,1,8,3]],),11), (([[-10]],),-10)]),
    'perfect-squares': ('numSquares', [((12,),3), ((13,),2)]),
    'integer-break': ('integerBreak', [((10,),36), ((2,),1)]),
    'combination-sum-iv': ('combinationSum4', [(([1,2,3],4),7), (([9],3),0)]),
    'concatenated-words': ('findAllConcatenatedWordsInADict', [((['cat','cats','dog','catsdog'],),['catsdog']), ((['cat'],),[])]),
    'unique-paths-ii': ('uniquePathsWithObstacles', [(([[0,0,0],[0,1,0],[0,0,0]],),2), (([[1]],),0)]),
    'minimum-path-sum': ('minPathSum', [(([[1,3,1],[1,5,1],[4,2,1]],),7), (([[0]],),0)]),
    'maximal-square': ('maximalSquare', [(([list('10100'),list('10111'),list('11111'),list('10010')],),4), (([['0']],),0)]),
    'ones-and-zeroes': ('findMaxForm', [((['10','0001','111001','1','0'],5,3),4), ((['10','0','1'],1,1),2)]),
    'longest-palindromic-subsequence': ('longestPalindromeSubseq', [(('bbbab',),4), (('cbbd',),2)]),
    'maximum-length-of-pair-chain': ('findLongestChain', [(([[1,2],[2,3],[3,4]],),2), (([[1,2]],),1)]),
    'dota2-senate': ('predictPartyVictory', [(('RD',),'Radiant'), (('RDD',),'Dire')]),
    'maximum-sum-circular-subarray': ('maxSubarraySumCircular', [(([5,-3,5],),10), (([-3,-2,-3],),-2)]),
    'longest-turbulent-subarray': ('maxTurbulenceSize', [(([9,4,2,10,7,8,8,1,9],),5), (([4,4],),1)]),
    'two-city-scheduling': ('twoCitySchedCost', [(([[10,20],[30,200],[400,50],[30,20]],),110)]),
    'candy': ('candy', [(([1,0,2],),5), (([1,2,2],),4)]),
    'zigzag-conversion': ('convert', [(('PAYPALISHIRING',3),'PAHNAPLSIIGYIR'), (('AB',1),'AB')]),
    'palindrome-number': ('isPalindrome', [((121,),True), ((-121,),False), ((10,),False)]),
    'integer-to-roman': ('intToRoman', [((1994,),'MCMXCIV'), ((3,),'III')]),
    'roman-to-integer': ('romanToInt', [(('MCMXCIV',),1994), (('III',),3)]),
    'text-justification': ('fullJustify', [((['This','is','an','example','of','text','justification.'],16),['This    is    an','example  of text','justification.  ']), ((['a','b'],1),['a','b']), ((['aa','b'],2),['aa','b '])]),
    'spiral-matrix-ii': ('generateMatrix', [((3,),[[1,2,3],[8,9,4],[7,6,5]]), ((1,),[[1]])]),
    'add-binary': ('addBinary', [(('11','1'),'100'), (('0','0'),'0')]),
    'add-to-array-form-of-integer': ('addToArrayForm', [(([1,2,0,0],34),[1,2,3,4]), (([9,9],1),[1,0,0])]),
    'shuffle-the-array': ('shuffle', [(([2,5,1,3,4,7],3),[2,3,5,4,1,7]), (([1,2],1),[1,2])]),
}

UNORDERED_NESTED = set('3sum 4sum combination-sum combination-sum-ii subsets subsets-ii combinations k-closest-points-to-origin pacific-atlantic-water-flow'.split())
UNORDERED_OUTER = set('generate-parentheses letter-combinations-of-a-phone-number permutations permutations-ii palindrome-partitioning n-queens repeated-dna-sequences restore-ip-addresses concatenated-words'.split())


def normalize(pid, value):
    if pid == 'group-anagrams':
        return sorted(sorted(group) for group in value)
    if pid in UNORDERED_NESTED:
        return sorted(sorted(group) for group in value)
    if pid in UNORDERED_OUTER:
        if pid in ['permutations','permutations-ii','palindrome-partitioning','n-queens']:
            return sorted(list(row) for row in value)
        return sorted(value)
    if pid == 'top-k-frequent-elements':
        return sorted(value)
    if pid == 'accounts-merge':
        return sorted([row[0], *sorted(row[1:])] for row in value)
    if pid == 'find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree':
        return [sorted(group) for group in value]
    return value


def linked(values):
    head = None
    for value in reversed(values):
        head = ListNode(value, head)
    return head


def list_values(head):
    values = []
    seen = set()
    while head:
        assert id(head) not in seen, 'unexpected linked-list cycle'
        seen.add(id(head)); values.append(head.val); head = head.next
    return values


def tree_values(node):
    return None if node is None else (node.val, tree_values(node.left), tree_values(node.right))


def check_special(pid, ns):
    solution = ns['Solution']() if 'Solution' in ns else None
    if pid == 'valid-sudoku':
        return BASE['verify_sudoku']({'code': {'python': ns['__code__']}})
    if pid == 'encode-and-decode-strings':
        for words in [[], [''], ['', '#', 'a#b', 'hello']]:
            assert solution.decode(solution.encode(words)) == words
        return 3
    if pid == 'min-stack':
        obj = ns['MinStack']()
        for n in [-2,0,-3]: obj.push(n)
        assert obj.getMin() == -3
        obj.pop(); assert obj.top() == 0 and obj.getMin() == -2
        return 3
    if pid == 'time-based-key-value-store':
        obj = ns['TimeMap'](); obj.set('foo','bar',1)
        assert obj.get('foo',0) == '' and obj.get('absent',2) == ''
        assert obj.get('foo',3) == 'bar'
        obj.set('foo','bar2',4)
        assert obj.get('foo',4) == 'bar2' and obj.get('foo',5) == 'bar2'
        return 5
    if pid == 'lru-cache':
        obj = ns['LRUCache'](2); obj.put(1,1); obj.put(2,2)
        assert obj.get(1) == 1
        obj.put(3,3); assert obj.get(2) == -1
        obj.put(1,10); obj.put(4,4)
        assert obj.get(3) == -1 and obj.get(1) == 10
        return 4
    if pid == 'kth-largest-element-in-a-stream':
        obj = ns['KthLargest'](3,[4,5,8,2])
        assert [obj.add(n) for n in [3,5,10,9,4]] == [4,5,5,8,8]
        return 5
    if pid == 'design-twitter':
        obj = ns['Twitter'](); obj.postTweet(1,5)
        assert obj.getNewsFeed(1) == [5]
        obj.follow(1,2); obj.postTweet(2,6)
        assert obj.getNewsFeed(1) == [6,5]
        obj.unfollow(1,2); assert obj.getNewsFeed(1) == [5]
        return 3
    if pid == 'find-median-from-data-stream':
        obj = ns['MedianFinder'](); obj.addNum(1); obj.addNum(2)
        assert obj.findMedian() == 1.5
        obj.addNum(3); assert obj.findMedian() == 2
        return 2
    if pid == 'detect-squares':
        obj = ns.get('DetectSquares', ns.get('CountSquares'))()
        for p in [[3,10],[11,2],[3,2]]: obj.add(p)
        assert obj.count([11,10]) == 1 and obj.count([14,8]) == 0
        obj.add([11,2]); assert obj.count([11,10]) == 2
        return 3
    if pid == 'implement-stack-using-queues':
        obj = ns['MyStack'](); obj.push(1); obj.push(2)
        assert obj.top() == 2 and obj.pop() == 2 and not obj.empty()
        assert obj.pop() == 1 and obj.empty()
        return 5
    if pid == 'data-stream-as-disjoint-intervals':
        obj = ns['SummaryRanges']()
        for n in [1,3,7,2,6,6]: obj.addNum(n)
        assert obj.getIntervals() == [[1,3],[6,7]]
        return 1
    if pid == 'implement-trie-prefix-tree':
        obj = ns['Trie'](); obj.insert('apple')
        assert obj.search('apple') and not obj.search('app') and obj.startsWith('app')
        obj.insert('app'); assert obj.search('app') and not obj.startsWith('bad')
        return 5
    if pid == 'design-add-and-search-words-data-structure':
        obj = ns['WordDictionary']()
        for word in ['bad','dad','mad']: obj.addWord(word)
        assert not obj.search('pad') and obj.search('bad') and obj.search('.ad') and obj.search('b..')
        assert not obj.search('..') and not obj.search('b...')
        return 6
    if pid in ['reverse-linked-list','merge-two-sorted-lists','reorder-list','remove-nth-node-from-end-of-list','add-two-numbers','merge-k-sorted-lists','reverse-nodes-in-k-group','swap-nodes-in-pairs','rotate-list','remove-duplicates-from-sorted-list']:
        operations = {
            'reverse-linked-list': ('reverseList', (linked([1,2,3]),), [3,2,1]),
            'merge-two-sorted-lists': ('mergeTwoLists', (linked([1,2,4]),linked([1,3,4])), [1,1,2,3,4,4]),
            'reorder-list': ('reorderList', (linked([1,2,3,4,5]),), [1,5,2,4,3]),
            'remove-nth-node-from-end-of-list': ('removeNthFromEnd', (linked([1,2,3]),3), [2,3]),
            'add-two-numbers': ('addTwoNumbers', (linked([9,9]),linked([1])), [0,0,1]),
            'merge-k-sorted-lists': ('mergeKLists', ([linked([1,4,5]),linked([1,3,4]),linked([2,6])],), [1,1,2,3,4,4,5,6]),
            'reverse-nodes-in-k-group': ('reverseKGroup', (linked([1,2,3,4,5]),2), [2,1,4,3,5]),
            'swap-nodes-in-pairs': ('swapPairs', (linked([1,2,3]),), [2,1,3]),
            'rotate-list': ('rotateRight', (linked([1,2,3]),4), [3,1,2]),
            'remove-duplicates-from-sorted-list': ('deleteDuplicates', (linked([1,1,2,3,3]),), [1,2,3]),
        }
        method, args, expected = operations[pid]
        result = getattr(solution,method)(*args)
        assert list_values(args[0] if pid == 'reorder-list' else result) == expected
        return 1
    if pid == 'linked-list-cycle':
        head = linked([1,2,3]); assert not solution.hasCycle(head)
        head.next.next.next = head.next; assert solution.hasCycle(head)
        return 2
    if pid == 'copy-list-with-random-pointer':
        head, second = Node(7), Node(13); head.next = second; second.random = head
        result = solution.copyRandomList(head)
        assert result is not head and result.val == 7 and result.random is None
        assert result.next is not second and result.next.val == 13 and result.next.random is result
        assert head.next is second and second.random is head
        assert solution.copyRandomList(None) is None
        return 4
    if pid == 'clone-graph':
        a,b = Node(1),Node(2); a.neighbors=[b]; b.neighbors=[a]
        result=solution.cloneGraph(a)
        assert result is not a and result.val == 1 and result.neighbors[0] is not b
        assert result.neighbors[0].val == 2 and result.neighbors[0].neighbors[0] is result
        assert solution.cloneGraph(None) is None
        return 3
    if pid in ['invert-binary-tree','diameter-of-binary-tree','balanced-binary-tree','same-tree','subtree-of-another-tree','lowest-common-ancestor-of-a-binary-search-tree','binary-tree-level-order-traversal','binary-tree-right-side-view','count-good-nodes-in-binary-tree','kth-smallest-element-in-a-bst','binary-tree-maximum-path-sum','serialize-and-deserialize-binary-tree','binary-tree-inorder-traversal','symmetric-tree','binary-tree-zigzag-level-order-traversal','path-sum']:
        tree = TreeNode(2,TreeNode(1),TreeNode(3))
        if pid == 'invert-binary-tree': assert tree_values(solution.invertTree(tree)) == (2,(3,None,None),(1,None,None))
        elif pid == 'diameter-of-binary-tree': assert solution.diameterOfBinaryTree(tree) == 2
        elif pid == 'balanced-binary-tree':
            assert solution.isBalanced(tree)
            assert not solution.isBalanced(TreeNode(1,TreeNode(2,TreeNode(3))))
        elif pid == 'same-tree': assert solution.isSameTree(tree,copy.deepcopy(tree)) and not solution.isSameTree(tree,None)
        elif pid == 'subtree-of-another-tree': assert solution.isSubtree(tree,TreeNode(1)) and not solution.isSubtree(tree,TreeNode(2))
        elif pid == 'lowest-common-ancestor-of-a-binary-search-tree': assert solution.lowestCommonAncestor(tree,tree.left,tree.right) is tree
        elif pid == 'binary-tree-level-order-traversal': assert solution.levelOrder(tree) == [[2],[1,3]]
        elif pid == 'binary-tree-right-side-view': assert solution.rightSideView(tree) == [2,3]
        elif pid == 'count-good-nodes-in-binary-tree': assert solution.goodNodes(tree) == 2
        elif pid == 'kth-smallest-element-in-a-bst': assert solution.kthSmallest(tree,2) == 2
        elif pid == 'binary-tree-maximum-path-sum': assert solution.maxPathSum(tree) == 6 and solution.maxPathSum(TreeNode(-3)) == -3
        elif pid == 'serialize-and-deserialize-binary-tree':
            codec=ns['Codec'](); assert tree_values(codec.deserialize(codec.serialize(tree))) == tree_values(tree)
            assert codec.deserialize(codec.serialize(None)) is None
        elif pid == 'binary-tree-inorder-traversal': assert solution.inorderTraversal(tree) == [1,2,3]
        elif pid == 'symmetric-tree': assert not solution.isSymmetric(tree) and solution.isSymmetric(TreeNode(1,TreeNode(2),TreeNode(2)))
        elif pid == 'binary-tree-zigzag-level-order-traversal': assert solution.zigzagLevelOrder(tree) == [[2],[3,1]]
        elif pid == 'path-sum': assert solution.hasPathSum(tree,3) and not solution.hasPathSum(tree,6)
        return 1
    if pid in ['construct-binary-tree-from-preorder-and-inorder-traversal','construct-binary-tree-from-inorder-and-postorder-traversal']:
        result = solution.buildTree([2,1,3],[1,2,3]) if 'preorder' in pid else solution.buildTree([1,2,3],[1,3,2])
        assert tree_values(result) == (2,(1,None,None),(3,None,None))
        return 1
    if pid == 'convert-sorted-array-to-binary-search-tree':
        root=solution.sortedArrayToBST([-10,-3,0,5,9])
        def inspect(node):
            if node is None: return [],0
            left,lh=inspect(node.left); right,rh=inspect(node.right)
            assert abs(lh-rh)<=1
            return left+[node.val]+right,1+max(lh,rh)
        assert inspect(root)[0] == [-10,-3,0,5,9]
        return 1
    if pid == 'unique-binary-search-trees-ii':
        roots=solution.generateTrees(3)
        assert len(roots) == 5 and len({str(tree_values(root)) for root in roots}) == 5
        def inorder(node): return [] if node is None else inorder(node.left)+[node.val]+inorder(node.right)
        assert all(inorder(root) == [1,2,3] for root in roots)
        return 2
    if pid == 'populating-next-right-pointers-in-each-node':
        root=Node(1); root.left=Node(2); root.right=Node(3)
        for parent,values in [(root.left,[4,5]),(root.right,[6,7])]: parent.left,parent.right=Node(values[0]),Node(values[1])
        result=solution.connect(root)
        assert result is root and root.left.next is root.right and root.left.right.next is root.right.left and root.right.right.next is None
        return 3
    if pid == 'word-search-ii':
        result=solution.findWords([list('oaan'),list('etae'),list('ihkr'),list('iflv')],['oath','pea','eat','rain'])
        assert sorted(result) == ['eat','oath']
        return 1
    if pid in ['surrounded-regions','walls-and-gates','rotate-image','set-matrix-zeroes','sort-colors','merge-sorted-array','rotate-array','move-zeroes','reverse-string']:
        checks={
            'surrounded-regions': ('solve', ([list('XXXX'),list('XOOX'),list('XXOX'),list('XOXX')],), [list('XXXX'),list('XXXX'),list('XXXX'),list('XOXX')]),
            'walls-and-gates': ('wallsAndGates', ([[2147483647,-1,0,2147483647],[2147483647,2147483647,2147483647,-1],[2147483647,-1,2147483647,-1],[0,-1,2147483647,2147483647]],), [[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]),
            'rotate-image': ('rotate', ([[1,2],[3,4]],), [[3,1],[4,2]]),
            'set-matrix-zeroes': ('setZeroes', ([[1,1,1],[1,0,1],[1,1,1]],), [[1,0,1],[0,0,0],[1,0,1]]),
            'sort-colors': ('sortColors', ([2,0,2,1,1,0],), [0,0,1,1,2,2]),
            'merge-sorted-array': ('merge', ([1,2,3,0,0,0],3,[2,5,6],3), [1,2,2,3,5,6]),
            'rotate-array': ('rotate', ([1,2,3,4,5,6,7],3), [5,6,7,1,2,3,4]),
            'move-zeroes': ('moveZeroes', ([0,1,0,3,12],), [1,3,12,0,0]),
            'reverse-string': ('reverseString', (list('hello'),), list('olleh')),
        }
        method,args,expected=checks[pid]; getattr(solution,method)(*args)
        assert args[0] == expected, (args[0],expected)
        return 1
    if pid in ['remove-element','remove-duplicates-from-sorted-array','remove-duplicates-from-sorted-array-ii']:
        if pid == 'remove-element':
            nums=[3,2,2,3]; length=solution.removeElement(nums,3); expected=[2,2]
        else:
            nums=[1,1,1,2,2,3]; length=solution.removeDuplicates(nums)
            expected=[1,2,3] if pid.endswith('sorted-array') else [1,1,2,2,3]
        assert length == len(expected) and sorted(nums[:length]) == expected
        return 1
    if pid == 'course-schedule-ii':
        result=solution.findOrder(4,[[1,0],[2,0],[3,1],[3,2]])
        assert sorted(result) == [0,1,2,3]
        assert all(result.index(a)>result.index(b) for a,b in [[1,0],[2,0],[3,1],[3,2]])
        assert solution.findOrder(2,[[0,1],[1,0]]) == []
        return 3
    if pid == 'alien-dictionary':
        assert solution.alienOrder(['wrt','wrf','er','ett','rftt']) == 'wertf'
        assert solution.alienOrder(['abc','ab']) == ''
        return 2
    if pid == 'longest-palindromic-substring':
        assert solution.longestPalindrome('babad') in ['bab','aba']
        assert solution.longestPalindrome('cbbd') == 'bb'
        return 2
    if pid == 'find-peak-element':
        nums=[1,2,1,3,5,6,4]; i=solution.findPeakElement(nums)
        assert 0<=i<len(nums) and (i==0 or nums[i]>nums[i-1]) and (i==len(nums)-1 or nums[i]>nums[i+1])
        assert solution.findPeakElement([1]) == 0
        return 2
    if pid == 'reorganize-string':
        result=solution.reorganizeString('aab')
        assert Counter(result) == Counter('aab') and all(a!=b for a,b in zip(result,result[1:]))
        assert solution.reorganizeString('aaab') == ''
        return 2
    if pid == 'longest-happy-string':
        result=solution.longestDiverseString(1,1,7)
        assert len(result) == 8 and 'aaa' not in result and 'bbb' not in result and 'ccc' not in result
        assert all(Counter(result)[c]<=n for c,n in [('a',1),('b',1),('c',7)])
        return 2
    raise AssertionError(f'No behavioral fixture for {pid}')


def check(pid, approach):
    tree = ast.parse(approach['code']['python'])
    if pid == 'sum-of-two-integers':
        assert not any(isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Add, ast.Sub)) for node in ast.walk(tree)), 'addition/subtraction is forbidden'
    if pid == 'product-of-array-except-self':
        assert not any(isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Div, ast.FloorDiv)) for node in ast.walk(tree)), 'division is forbidden'
    namespace={'TreeNode':TreeNode,'ListNode':ListNode,'Node':Node,'__code__':approach['code']['python']}
    exec(compile(approach['code']['python'],pid+':'+approach['id'],'exec'),namespace)
    if pid not in CASES:
        return check_special(pid,namespace)
    method,cases=CASES[pid]
    for inputs,expected in cases:
        result=getattr(namespace['Solution'](),method)(*copy.deepcopy(inputs))
        actual=normalize(pid,result); expected=normalize(pid,expected)
        if isinstance(expected,float): assert math.isclose(actual,expected,rel_tol=1e-9,abs_tol=1e-9), (actual,expected)
        elif pid == 'evaluate-division': assert all(math.isclose(a,b) for a,b in zip(actual,expected)) and len(actual)==len(expected), (actual,expected)
        else: assert actual == expected, (actual,expected)
    return len(cases)


def main():
    manifest=json.loads((ROOT/'scripts/approach-reference-manifest.json').read_text())
    failures=[]; checked=0; count=0
    def timeout(signum,frame): raise TimeoutError('fixture exceeded 10 seconds')
    signal.signal(signal.SIGALRM,timeout)
    for entry in manifest['problems']:
        reference=json.loads((ROOT/'src/data/problemReferences'/f"{entry['id']}.json").read_text())
        for approach in reference.get('alternatives',[]):
            count+=1; signal.alarm(10)
            try: checked+=check(entry['id'],approach)
            except Exception as error: failures.append((entry['id'],approach['id'],repr(error)))
            finally: signal.alarm(0)
    for failure in failures: print(*failure,sep=' | ')
    print(f'{count} added Python snippets; {checked} example/boundary checks passed; {len(failures)} failures.',flush=True)
    assert count == sum(len(entry['alternatives']) for entry in manifest['problems']), 'missing alternatives'
    assert not failures, f'{len(failures)} approaches failed behavioral checks'


if __name__ == '__main__':
    main()
