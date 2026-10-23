"""Independent finite examples for the further alternative batch.

Reuse the established 100-reference examples where their problem contracts
match. Structural, mutable, stateful, and nonunique results are checked below.
No expected output is produced by another bundled solution.
"""
from collections import Counter
import copy
import json
from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]
ADDITIONAL = runpy.run_path(str(ROOT / 'scripts/verify-additional-references.py'))
EXTENDED = runpy.run_path(str(ROOT / 'scripts/extended-approach-fixtures.py'))
TreeNode, ListNode, NaryNode = ADDITIONAL['TreeNode'], ADDITIONAL['ListNode'], ADDITIONAL['NaryNode']
tree, linked, values = EXTENDED['tree'], ADDITIONAL['linked'], ADDITIONAL['values']
manifest = json.loads((ROOT / 'scripts/additional-reference-manifest.json').read_text())
by_number = {entry['number']: entry['id'] for entry in manifest['references']}
CASES = {
    by_number[number]: (method, [(inputs if isinstance(inputs, tuple) else (inputs,), expected) for inputs, expected in cases])
    for number, (method, cases) in ADDITIONAL['CASES'].items() if cases
}
CASES.update({
    '4-keys-keyboard': ('maxA', [((3,),3),((7,),9),((9,),16)]),
    'add-bold-tag-in-string': ('addBoldTag', [(('abcxyz123',['abc','123']),'<b>abc</b>xyz<b>123</b>'),(('aaabbcc',['aaa','aab','bc']),'<b>aaabbc</b>c'),(('aaab',['aaa','b']),'<b>aaab</b>'),(('abc',[]),'abc')]),
    'all-paths-from-source-lead-to-destination': ('leadsToDestination', [((4,[[0,1],[0,2],[1,3],[2,3]],0,3),True),((3,[[0,1],[0,2]],0,2),False),((3,[[0,1],[1,1],[1,2]],0,2),False),((1,[],0,0),True),((2,[[0,1],[1,0]],0,1),False)]),
    'analyze-user-website-visit-pattern': ('mostVisitedPattern', [((['joe','joe','joe','james','james','james','james','mary','mary','mary'],[1,2,3,4,5,6,7,8,9,10],['home','about','career','home','cart','maps','home','home','about','career']),['home','about','career']),((['u','u','u','u'],[1,2,3,4],['b','a','b','a']),['a','b','a'])]),
    'bag-of-tokens': ('bagOfTokensScore', [(([100,200,300,400],200),2),(([100],50),0),(([],0),0),(([200,100],150),1)]),
    'binary-tree-longest-consecutive-sequence-ii': ('longestConsecutive', [((tree([2,1,3]),),3),((tree([1,2,3]),),2),((tree([3,2,4,1,None,None,5]),),5)]),
    'count-substrings-with-only-one-distinct-letter': ('countLetters', [(('aaaba',),8),(('aaaaaaaaaa',),55),(('a',),1)]),
    'divide-chocolate': ('maximizeSweetness', [(([1,2,3,4,5,6,7,8,9],5),6),(([5,6,7,8,9,1,2,3,4],8),1),(([1,2,3],0),6)]),
    'factor-combinations': ('getFactors', [((12,),[[2,6],[2,2,3],[3,4]]),((32,),[[2,16],[2,2,8],[2,2,2,4],[2,2,2,2,2],[2,4,4],[4,8]]),((1,),[]),((37,),[])]),
    'find-common-characters': ('commonChars', [((['bella','label','roller'],),['e','l','l']),((['cool','lock','cook'],),['c','o']),((['abc'],),['a','b','c'])]),
    'group-shifted-strings': ('groupStrings', [((['abc','bcd','acef','xyz','az','ba','a','z'],),[['abc','bcd','xyz'],['az','ba'],['acef'],['a','z']]),((['a','a'],),[['a','a']])]),
    'maximum-average-subtree': ('maximumAverageSubtree', [((tree([5,6,1]),),6.0),((tree([0,None,1]),),1.0),((tree([0]),),0.0)]),
    'minimum-cost-to-connect-sticks': ('connectSticks', [(([2,4,3],),14),(([1,8,3,5],),30),(([5],),0)]),
    'minimum-cost-to-hire-k-workers': ('mincostToHireWorkers', [(([10,20,5],[70,50,30],2),105.0),(([3,1,10,10,1],[4,8,2,2,7],3),92/3)]),
    'minimum-difference-between-highest-and-lowest-of-k-scores': ('minimumDifference', [(([9,4,1,7],2),2),(([90],1),0)]),
    'minimum-length-of-string-after-deleting-similar-ends': ('minimumLength', [(('ca',),2),(('cabaabac',),0),(('aabccabba',),3),(('a',),1),(('aa',),0),(('cabac',),1)]),
    'non-decreasing-array': ('checkPossibility', [(([4,2,3],),True),(([4,2,1],),False),(([3,4,2,3],),False),(([1],),True),(([2,3,3,2,4],),True)]),
    'number-of-islands-ii': ('numIslands2', [((3,3,[[0,0],[0,1],[1,2],[2,1],[1,1]]),[1,1,2,3,1]),((2,2,[[0,0],[0,0],[1,1],[0,1]]),[1,1,2,1])]),
    'one-edit-distance': ('isOneEditDistance', [(('ab','acb'),True),(('',''),False),(('a','a'),False),(('cab','ad'),False),(('','a'),True),(('abc','ab'),True)]),
    'robot-bounded-in-circle': ('isRobotBounded', [(('GGLLGG',),True),(('GG',),False),(('GL',),True),(('GLLG',),True)]),
    'sentence-similarity': ('areSentencesSimilar', [((['great','acting','skills'],['fine','drama','talent'],[['great','fine'],['drama','acting'],['skills','talent']]),True),((['great'],['fine'],[['great','good'],['good','fine']]),False),((['a'],['a'],[]),True),((['a'],[],[]),False)]),
    'sort-array-by-increasing-frequency': ('frequencySort', [(([1,1,2,2,2,3],),[3,1,1,2,2,2]),(([2,3,1,3,2],),[1,3,3,2,2]),(([-1,-1,2,2],),[2,2,-1,-1])]),
    'the-maze-ii': ('shortestDistance', [(([[0,0,1,0,0],[0,0,0,0,0],[0,0,0,1,0],[1,1,0,1,1],[0,0,0,0,0]],[0,4],[4,4]),12),(([[0,0,1,0,0],[0,0,0,0,0],[0,0,0,1,0],[1,1,0,1,1],[0,0,0,0,0]],[0,4],[3,2]),-1),(([[0]],[0,0],[0,0]),0)]),
    'the-maze-iii': ('findShortestWay', [(([[0,0,0,0,0],[1,1,0,0,1],[0,0,0,0,0],[0,1,0,0,1],[0,1,0,0,0]],[4,3],[0,1]),'lul'),(([[0,0,0,0,0],[1,1,0,0,1],[0,0,0,0,0],[0,1,0,0,1],[0,1,0,0,0]],[4,3],[3,0]),'impossible'),(([[0,0,0]],[0,0],[0,1]),'r')]),
    'ugly-number': ('isUgly', [((6,),True),((14,),False),((1,),True),((0,),False),((-6,),False),((2147483647,),False)]),
    'valid-word-abbreviation': ('validWordAbbreviation', [(('internationalization','i12iz4n'),True),(('apple','a2e'),False),(('substitution','s10n'),True),(('a','01'),False),(('word','4'),True),(('word','5'),False),(('word','w2d'),True)]),
    'can-place-flowers': ('canPlaceFlowers', [(([1,0,0,0,1],1),True),(([1,0,0,0,1],2),False),(([0],1),True),(([1],0),True),(([0,0,0],2),True)]),
    'lemonade-change': ('lemonadeChange', [(([5,5,5,10,20],),True),(([5,5,10,10,20],),False),(([10],),False),(([5,5,5,5,20,10],),True)]),
})

UNORDERED = {'combination-sum-iii','different-ways-to-add-parentheses','binary-tree-paths','intersection-of-two-arrays-ii','non-decreasing-subsequences','most-frequent-subtree-sum','find-common-characters'}


def normalize(pid, result):
    if pid in {'combination-sum-iii','non-decreasing-subsequences','factor-combinations'}:
        return sorted(tuple(row) for row in result)
    if pid == 'group-shifted-strings':
        return sorted(tuple(sorted(group)) for group in result)
    if pid in UNORDERED:
        return sorted(result)
    return result


def check_special(pid, ns):
    solution = ns['Solution']() if 'Solution' in ns else None
    if pid in ['remove-duplicates-from-sorted-list-ii','odd-even-linked-list','delete-n-nodes-after-m-nodes-of-a-linked-list','plus-one-linked-list']:
        cases = {
            'remove-duplicates-from-sorted-list-ii': ('deleteDuplicates', [([1,2,3,3,4,4,5],(),[1,2,5]),([1,1],(),[]),([],(),[])]),
            'odd-even-linked-list': ('oddEvenList', [([1,2,3,4,5],(),[1,3,5,2,4]),([],(),[])]),
            'delete-n-nodes-after-m-nodes-of-a-linked-list': ('deleteNodes', [(list(range(1,14)),(2,3),[1,2,6,7,11,12]),([1,2,3],(1,1),[1,3]),([1],(2,3),[1])]),
            'plus-one-linked-list': ('plusOne', [([1,2,9],(),[1,3,0]),([9,9],(),[1,0,0]),([0],(),[1])]),
        }
        method, tests = cases[pid]
        for data, arguments, expected in tests:
            assert values(getattr(solution,method)(linked(data),*arguments)) == expected
        return len(tests)
    if pid == 'convert-sorted-list-to-binary-search-tree':
        def inspect(node):
            if not node:
                return [],0
            left,lh = inspect(node.left); right,rh = inspect(node.right)
            assert abs(lh-rh) <= 1
            return left+[node.val]+right,1+max(lh,rh)
        for data in [[-10,-3,0,5,9],[],[1,2]]:
            assert inspect(solution.sortedListToBST(linked(data)))[0] == data
        return 3
    if pid == 'flatten-binary-tree-to-linked-list':
        for root, expected in [(tree([1,2,5,3,4,None,6]),[1,2,3,4,5,6]),(None,[])]:
            original = set()
            def collect(node):
                if node:
                    original.add(id(node)); collect(node.left); collect(node.right)
            collect(root)
            assert solution.flatten(root) is None
            result, seen = [],set()
            while root:
                assert root.left is None and id(root) not in seen
                seen.add(id(root)); result.append(root.val); root=root.right
            assert result == expected and seen == original
        return 2
    if pid == 'inorder-successor-in-bst':
        root = tree([2,1,3])
        assert solution.inorderSuccessor(root,root.left) is root
        assert solution.inorderSuccessor(root,root.right) is None
        return 2
    if pid == 'game-of-life':
        for board, expected in [([[0,1,0],[0,0,1],[1,1,1],[0,0,0]],[[0,0,0],[1,0,1],[0,1,1],[0,1,0]]),([[1]],[[0]])]:
            assert solution.gameOfLife(board) is None and board == expected
        return 2
    if pid == 'gray-code':
        for n in range(1,7):
            result = solution.grayCode(n)
            assert result[0] == 0 and sorted(result) == list(range(1 << n))
            assert all((a ^ b).bit_count() == 1 for a,b in zip(result,result[1:]+result[:1]))
        return 6
    if pid == 'find-the-index-of-the-large-integer':
        class ArrayReader:
            def __init__(self, data): self.data = data
            def length(self): return len(self.data)
            def compareSub(self, a,b,c,d):
                left,right=sum(self.data[a:b+1]),sum(self.data[c:d+1])
                return (left > right)-(left < right)
        for data,expected in [([7,2,2,2],0),([2,2,7,2],2),([2,2,2,7],3),([7],0)]:
            assert solution.getIndex(ArrayReader(data)) == expected
        return 4
    if pid == 'rearrange-string-k-distance-apart':
        for text,k,possible in [('aabbcc',3,True),('aaab',3,False),('aaabc',2,True),('aaaa',0,True),('',0,True)]:
            result = solution.rearrangeString(text,k)
            if not possible:
                assert result == ''
            else:
                assert Counter(result) == Counter(text)
                previous = {}
                for i,char in enumerate(result):
                    assert char not in previous or i-previous[char] >= k
                    previous[char] = i
        return 5
    if pid == 'reverse-words-in-a-string-ii':
        for text,expected in [('the sky is blue','blue is sky the'),('a','a')]:
            chars = list(text)
            assert solution.reverseWords(chars) is None and chars == list(expected)
        return 2
    if pid == 'reverse-words-in-a-string':
        for text,expected in [('the sky is blue','blue is sky the'),('  hello   world  ','world hello'),('a','a')]:
            assert solution.reverseWords(text) == expected
        return 3
    if pid == 'design-hit-counter':
        obj = ns['HitCounter']()
        for timestamp in [1,1,2,300]: obj.hit(timestamp)
        assert obj.getHits(300) == 4
        assert obj.getHits(301) == 2
        obj.hit(301)
        assert obj.getHits(301) == 3 and obj.getHits(601) == 0
        return 4
    if pid == 'max-stack':
        obj = ns['MaxStack']()
        for value in [5,1,5]: obj.push(value)
        assert obj.top() == 5 and obj.popMax() == 5 and obj.top() == 1
        assert obj.peekMax() == 5 and obj.pop() == 1 and obj.top() == 5
        obj.push(-2)
        assert obj.popMax() == 5 and obj.top() == -2
        return 8
    if pid == 'design-snake-game':
        obj = ns['SnakeGame'](3,2,[[1,2],[0,1]])
        assert [obj.move(direction) for direction in ['R','D','R','U','L','U']] == [0,0,1,1,2,-1]
        assert obj.move('D') == -1
        obj = ns['SnakeGame'](2,2,[[0,1],[1,1],[1,0]])
        assert [obj.move(direction) for direction in ['R','D','L','U','R']] == [1,2,3,3,3]
        obj = ns['SnakeGame'](2,2,[[0,1],[1,1],[1,0]])
        assert [obj.move(direction) for direction in ['R','D','L','R']] == [1,2,3,-1]
        return 16
    if pid == 'design-underground-system':
        obj = ns['UndergroundSystem']()
        obj.checkIn(1,'A',3); obj.checkIn(2,'A',8)
        obj.checkOut(1,'B',15); obj.checkOut(2,'B',20)
        assert obj.getAverageTime('A','B') == 12
        obj.checkIn(1,'A',21); obj.checkOut(1,'B',30)
        assert obj.getAverageTime('A','B') == 11
        obj.checkIn(3,'B',31); obj.checkOut(3,'A',35)
        assert obj.getAverageTime('B','A') == 4 and obj.getAverageTime('A','B') == 11
        return 4
    raise AssertionError(f'No behavioral fixture for {pid}')
