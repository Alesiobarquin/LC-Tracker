#!/usr/bin/env python3
"""Check all imported snippets and run example/edge cases across problem families.
Python is required. --cpp also checks each C++ snippet with a C++20 compiler.
This never accesses user data, executes a network request, or grades user answers.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right
class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next
class Node:
    def __init__(self, val=0, neighbors=None):
        self.val, self.neighbors = val, neighbors or []
        self.left = self.right = self.next = self.random = None

CASES = {
 'contains-duplicate': ('containsDuplicate', [(([1,2,3,1],), True), (([1,2,3],), False)]),
 'valid-anagram': ('isAnagram', [(('anagram','nagaram'),True), (('rat','car'),False)]),
 'two-sum': ('twoSum', [(([2,7,11,15],9),[0,1]), (([3,3],6),[0,1])]),
 'product-of-array-except-self': ('productExceptSelf', [(([1,2,3,4],),[24,12,8,6]), (([0,0,1],),[0,0,0])]),
 'longest-consecutive-sequence': ('longestConsecutive', [(([100,4,200,1,3,2],),4), (([],),0)]),
 'valid-palindrome': ('isPalindrome', [(('A man, a plan, a canal: Panama',),True), (('race a car',),False)]),
 'trapping-rain-water': ('trap', [(([0,1,0,2,1,0,1,3,2,1,2,1],),6)]),
 'longest-substring-without-repeating-characters': ('lengthOfLongestSubstring', [(('abcabcbb',),3), (('',),0)]),
 'valid-parentheses': ('isValid', [(('()[]{}',),True), (('(]',),False)]),
 'daily-temperatures': ('dailyTemperatures', [(([73,74,75,71,69,72,76,73],),[1,1,4,2,1,1,0,0])]),
 'binary-search': ('search', [(([-1,0,3,5,9,12],9),4), (([1],2),-1)]),
 'koko-eating-bananas': ('minEatingSpeed', [(([3,6,7,11],8),4)]),
 'maximum-depth-of-binary-tree': ('maxDepth', [((TreeNode(1,TreeNode(2)),),2), ((None,),0)]),
 'validate-binary-search-tree': ('isValidBST', [((TreeNode(2,TreeNode(1),TreeNode(3)),),True), ((TreeNode(1,TreeNode(2)),),False)]),
 'kth-largest-element-in-an-array': ('findKthLargest', [(([3,2,1,5,6,4],2),5), (([2,2,2],1),2)]),
 'number-of-islands': ('numIslands', [(([list('110'),list('010'),list('001')],),2)]),
 'course-schedule': ('canFinish', [((2,[[1,0]]),True), ((2,[[1,0],[0,1]]),False)]),
 'network-delay-time': ('networkDelayTime', [(([[2,1,1],[2,3,1],[3,4,1]],4,2),2)]),
 'climbing-stairs': ('climbStairs', [((2,),2), ((5,),8)]),
 'coin-change': ('coinChange', [(([1,2,5],11),3), (([2],3),-1)]),
 'word-break': ('wordBreak', [(('leetcode',['leet','code']),True)]),
 'unique-paths': ('uniquePaths', [((3,7),28)]),
 'longest-common-subsequence': ('longestCommonSubsequence', [(('abcde','ace'),3)]),
 'edit-distance': ('minDistance', [(('horse','ros'),3)]),
 'maximum-subarray': ('maxSubArray', [(([-2,1,-3,4,-1,2,1,-5,4],),6), (([-3,-2],),-2)]),
 'jump-game': ('canJump', [(([2,3,1,1,4],),True), (([3,2,1,0,4],),False)]),
 'merge-intervals': ('merge', [(([[1,3],[2,6],[8,10]],),[[1,6],[8,10]])]),
 'meeting-rooms': ('canAttendMeetings', [(([[0,30],[5,10],[15,20]],),False), (([[0,1],[1,2]],),True)]),
 'meeting-rooms-ii': ('minMeetingRooms', [(([[0,30],[5,10],[15,20]],),2), (([[0,1],[1,2]],),1)]),
 'happy-number': ('isHappy', [((19,),True), ((2,),False)]),
 'single-number': ('singleNumber', [(([4,1,2,1,2],),4)]),
 'sum-of-two-integers': ('getSum', [((1,2),3), ((-2,1),-1)]),
 'text-justification': ('fullJustify', [((['This','is','an','example','of','text','justification.'],16),['This    is    an','example  of text','justification.  '])]),
 'remove-duplicates-from-sorted-array-ii': ('removeDuplicates', [(([1,1,1,2,2,3],),5)]),
 'min-cost-to-connect-all-points': ('minCostConnectPoints', [(([[0,0],[2,2],[3,10],[5,2],[7,0]],),20)]),
 'path-with-minimum-effort': ('minimumEffortPath', [(([[1,2,2],[3,8,2],[5,3,5]],),2)]),
}
HEADERS = '''#include <algorithm>
#include <array>
#include <bit>
#include <bitset>
#include <climits>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <deque>
#include <functional>
#include <iostream>
#include <limits>
#include <list>
#include <map>
#include <numeric>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
using namespace std;
struct TreeNode { int val; TreeNode *left, *right; TreeNode(int v=0, TreeNode* l=nullptr, TreeNode* r=nullptr):val(v),left(l),right(r){} };
struct ListNode { int val; ListNode* next; ListNode(int v=0, ListNode* n=nullptr):val(v),next(n){} };
struct Node { int val; Node *left=nullptr,*right=nullptr,*next=nullptr,*random=nullptr; vector<Node*> neighbors; Node(int v=0):val(v){} Node(int v,vector<Node*> n):val(v),neighbors(n){} };
'''

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cpp', action='store_true')
    args = parser.parse_args()
    references = [json.loads(f.read_text()) for f in sorted((ROOT/'src/data/problemReferences').glob('*.json'))]
    namespaces = {}
    for reference in references:
        namespace = {'TreeNode':TreeNode, 'ListNode':ListNode, 'Node':Node}
        exec(compile(reference['code']['python'], reference['problemId'], 'exec'), namespace)
        namespaces[reference['problemId']] = namespace
    checked = 0
    for problem_id, (method, cases) in CASES.items():
        for inputs, expected in cases:
            actual = getattr(namespaces[problem_id]['Solution'](), method)(*inputs)
            assert actual == expected, (problem_id, actual, expected)
            checked += 1
    # The imported LRU example must resolve OrderedDict at construction time.
    cache = namespaces['lru-cache']['LRUCache'](2)
    cache.put(1,1); cache.put(2,2); assert cache.get(1)==1
    cache.put(3,3); assert cache.get(2)==-1
    ranges = namespaces['data-stream-as-disjoint-intervals']['SummaryRanges']()
    for value in [1,3,7,2,6,6]: ranges.addNum(value)
    assert ranges.getIntervals()==[[1,3],[6,7]]
    codec = namespaces['encode-and-decode-strings']['Solution']()
    assert codec.decode(codec.encode(['', '#', 'a#b', 'hello'])) == ['', '#', 'a#b', 'hello']
    print(f'{len(references)} Python snippets loaded; {checked + 4} example/edge checks passed.', flush=True)
    if args.cpp:
        def check(reference):
            result = subprocess.run(['c++','-std=c++20','-fsyntax-only','-x','c++','-'], input=HEADERS+reference['code']['cpp'], text=True, capture_output=True)
            return reference['problemId'], result.returncode, result.stderr
        failures = []
        with ThreadPoolExecutor(max_workers=6) as pool:
            for problem_id, status, error in pool.map(check, references):
                if status: failures.append((problem_id,error))
        for problem_id,error in failures: print(problem_id,error)
        assert not failures, f'{len(failures)} C++ snippets failed syntax validation'
        print(f'{len(references)} C++ snippets passed syntax validation.')

if __name__=='__main__': main()
