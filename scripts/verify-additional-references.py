#!/usr/bin/env python3
"""Exercise every reference in the reviewed medium/easy batch.
--cpp compiles and runs selected C++ boundary checks as well. No network or user data.
"""
import argparse
import copy
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import runpy
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
COMMON = runpy.run_path(str(ROOT / 'scripts/verify-problem-references.py'))
TreeNode, ListNode = COMMON['TreeNode'], COMMON['ListNode']


def tree(value, left=None, right=None):
    return TreeNode(value, left, right)


def linked(values):
    head = None
    for value in reversed(values):
        head = ListNode(value, head)
    return head


def values(head):
    result, seen = [], set()
    while head:
        assert id(head) not in seen, 'list contains a cycle'
        seen.add(id(head))
        result.append(head.val)
        head = head.next
    return result


class NaryNode:
    def __init__(self, val, children=None):
        self.val, self.children = val, children or []


# Expected values are independent examples/boundaries, not implementation copies.
CASES = {
8: ('myAtoi', [('   -42', -42), ('4193 with words', 4193), ('words and 987', 0), ('2147483648', 2147483647), ('-91283472332', -2147483648), ('+', 0)]),
16: ('threeSumClosest', [(([-1,2,1,-4],1),2), (([0,0,0],1),0)]),
38: ('countAndSay', [(1,'1'), (4,'1211'), (6,'312211')]),
107: ('levelOrderBottom', [(tree(3,tree(9),tree(20,tree(15),tree(7))), [[15,7],[9,20],[3]]), (None,[])]),
113: ('pathSum', [((tree(1,tree(2),tree(3)),3), [[1,2]]), ((tree(-2,None,tree(-3)),-5),[[-2,-3]]), ((None,0),[])]),
137: ('singleNumber', [([2,2,3,2],3), ([-2,-2,-2,-4],-4), ([0,1,0,1,0,1,99],99)]),
165: ('compareVersion', [(('1.01','1.001'),0), (('1.0','1.0.0'),0), (('0.1','1.1'),-1), (('1.10','1.2'),1)]),
166: ('fractionToDecimal', [((1,2),'0.5'), ((2,3),'0.(6)'), ((1,6),'0.1(6)'), ((-50,8),'-6.25'), ((-2147483648,-1),'2147483648')]),
172: ('trailingZeroes', [(0,0),(5,1),(25,6),(100,24)]),
216: ('combinationSum3', [((3,7),[[1,2,4]]), ((4,1),[])]),
223: ('computeArea', [((-3,0,3,4,0,-1,9,2),45), ((0,0,1,1,1,0,2,1),2)]),
240: ('searchMatrix', [(([[1,4,7],[2,5,8],[3,6,9]],6),True), (([[1,4,7],[2,5,8],[3,6,9]],10),False)]),
241: ('diffWaysToCompute', [('2*3-4*5',[-34,-14,-10,-10,10]), ('11',[11])]),
259: ('threeSumSmaller', [(([-2,0,1,3],2),2), (([0,0,0,0],1),4)]),
264: ('nthUglyNumber', [(1,1),(10,12),(1690,2123366400)]),
274: ('hIndex', [([3,0,6,1,5],3), ([0,0],0)]),
275: ('hIndex', [([0,1,3,5,6],3), ([0,0],0), ([1],1)]),
289: ('gameOfLife', []),
299: ('getHint', [(('1807','7810'),'1A3B'), (('1123','0111'),'1A1B'), (('1122','2211'),'0A4B')]),
313: ('nthSuperUglyNumber', [((12,[2,7,13,19]),32), ((1,[2,3,5]),1), ((31,[2]),1073741824)]),
316: ('removeDuplicateLetters', [('bcabc','abc'), ('cbacdcbc','acdb')]),
318: ('maxProduct', [(['abcw','baz','foo','bar','xtfn','abcdef'],16), (['a','aa','aaa'],0)]),
319: ('bulbSwitch', [(0,0),(3,1),(9,3)]),
325: ('maxSubArrayLen', [(([1,-1,5,-2,3],3),4), (([-2,-1,2,1],1),2), (([1,-1,1,-1],0),4)]),
331: ('isValidSerialization', [('9,3,4,#,#,1,#,#,2,#,6,#,#',True), ('1,#',False), ('9,#,#,1',False), ('#',True)]),
334: ('increasingTriplet', [([1,2,3,4,5],True), ([5,4,3,2,1],False), ([2,1,5,0,4,6],True), ([1,1,1],False)]),
357: ('countNumbersWithUniqueDigits', [(0,1),(2,91),(3,739)]),
360: ('sortTransformedArray', [(([-4,-2,2,4],1,3,5),[3,9,15,33]), (([-4,-2,2,4],-1,3,5),[-23,-5,1,7]), (([-2,0,2],0,-1,0),[-2,0,2])]),
361: ('maxKilledEnemies', [(([list('0E00'),list('E0WE'),list('0E00')],),3), (([list('WWW')],),0)]),
365: ('canMeasureWater', [((3,5,4),True), ((2,6,5),False), ((1,2,0),True)]),
370: ('getModifiedArray', [((5,[[1,3,2],[2,4,3],[0,2,-2]]),[-2,0,3,5,3]), ((1,[]),[0])]),
373: ('kSmallestPairs', [(([1,7,11],[2,4,6],3),[[1,2],[1,4],[1,6]]), (([1],[2],4),[[1,2]])]),
375: ('getMoneyAmount', [(1,0),(2,1),(10,16)]),
376: ('wiggleMaxLength', [([1,7,4,9,2,5],6), ([1,1,1],1), ([1,2,3,4],2)]),
378: ('kthSmallest', [(([[1,5,9],[10,11,13],[12,13,15]],8),13), (([[1,1],[1,2]],3),1)]),
386: ('lexicalOrder', [(13,[1,10,11,12,13,2,3,4,5,6,7,8,9]), (1,[1])]),
393: ('validUtf8', [([197,130,1],True), ([235,140,4],False), ([240,162,138],False), ([128],False)]),
395: ('longestSubstring', [(('aaabb',3),3), (('ababbc',2),5), (('abc',2),0)]),
396: ('maxRotateFunction', [([4,3,2,6],26), ([-1,-2,-3],-5)]),
397: ('integerReplacement', [(1,0),(3,2),(8,3),(2147483647,32)]),
413: ('numberOfArithmeticSlices', [([1,2,3,4],3), ([7,7,7,7],3), ([1,2],0)]),
419: ('countBattleships', [(([list('X..X'),list('...X'),list('...X')],),2), (([list('.')],),0)]),
429: ('levelOrder', [(NaryNode(1,[NaryNode(3,[NaryNode(5),NaryNode(6)]),NaryNode(2),NaryNode(4)]),[[1],[3,2,4],[5,6]]), (None,[])]),
433: ('minMutation', [(('AACCGGTT','AACCGGTA',['AACCGGTA']),1), (('AACCGGTT','AAACGGTA',['AACCGGTA','AACCGCTA','AAACGGTA']),2), (('AACCGGTT','AACCGGTT',[]),0)]),
436: ('findRightInterval', [(([[3,4],[2,3],[1,2]],),[-1,0,1]), (([[1,1]],),[0])]),
437: ('pathSum', [((tree(1,tree(1),tree(1)),2),2), ((tree(0,tree(0),tree(0)),0),5)]),
447: ('numberOfBoomerangs', [(([[0,0],[1,0],[2,0]],),2), (([[0,0]],),0)]),
453: ('minMoves', [([1,2,3],3), ([-1,0,1],3)]),
454: ('fourSumCount', [(([1,2],[-2,-1],[-1,2],[0,2]),2), (([0],[0],[0],[0]),1)]),
462: ('minMoves2', [([1,2,3],2), ([1,10,2,9],16)]),
467: ('findSubstringInWraproundString', [('zab',6), ('cac',2)]),
475: ('findRadius', [(([1,2,3],[2]),1), (([1,2,3,4],[1,4]),1), (([1,5],[2]),3)]),
476: ('findComplement', [(5,2),(1,0),(8,7)]),
477: ('totalHammingDistance', [([4,14,2],6), ([1,1],0)]),
486: ('predictTheWinner', [([1,5,2],False), ([1,5,233,7],True), ([1,1],True)]),
491: ('findSubsequences', [([4,6,7,7], [[4,6],[4,6,7],[4,6,7,7],[4,7],[4,7,7],[6,7],[6,7,7],[7,7]]), ([4,4,3,2],[[4,4]])]),
498: ('findDiagonalOrder', [(([[1,2,3],[4,5,6],[7,8,9]],),[1,2,4,7,5,3,6,8,9]), (([[1,2,3]],),[1,2,3]), (([[1],[2],[3]],),[1,2,3])]),
503: ('nextGreaterElements', [([1,2,1],[2,-1,2]), ([5,5,5],[-1,-1,-1])]),
508: ('findFrequentTreeSum', [(tree(5,tree(2),tree(-3)),[-3,2,4]), (tree(5,tree(2),tree(-5)),[2])]),
524: ('findLongestWord', [(('abpcplea',['ale','apple','monkey','plea']),'apple'), (('abpcplea',['b','a','c']),'a')]),
526: ('countArrangement', [(1,1),(2,2),(3,3)]),
529: ('updateBoard', [(([list('M')],[0,0]),[list('X')]), (([list('EE'),list('EE')],[0,0]),[list('BB'),list('BB')])]),
532: ('findPairs', [(([3,1,4,1,5],2),2), (([1,3,1,5,4],0),1), (([1],0),0)]),
537: ('complexNumberMultiply', [(('1+1i','1+1i'),'0+2i'), (('1+-1i','1+-1i'),'0+-2i')]),
539: ('findMinDifference', [(['23:59','00:00'],1), (['00:00','23:59','00:00'],0)]),
542: ('updateMatrix', [(([[0,0,0],[0,1,0],[1,1,1]],),[[0,0,0],[0,1,0],[1,2,1]])]),
553: ('optimalDivision', [([1000,100,10,2],'1000/(100/10/2)'), ([2],'2'), ([2,3],'2/3')]),
556: ('nextGreaterElement', [(12,21),(21,-1),(230241,230412),(1999999999,-1)]),
565: ('arrayNesting', [([5,4,0,3,1,6,2],4), ([0],1)]),
581: ('findUnsortedSubarray', [([2,6,4,8,10,9,15],5), ([1,2,3,4],0), ([1],0)]),
583: ('minDistance', [(('sea','eat'),2), (('','abc'),3)]),
593: ('validSquare', [(([0,0],[1,1],[1,0],[0,1]),True), (([0,0],[2,0],[2,1],[0,1]),False), (([0,0],[0,0],[1,0],[0,1]),False)]),
611: ('triangleNumber', [([2,2,3,4],3), ([0,0,0],0)]),
111: ('minDepth', [(tree(1,None,tree(2,None,tree(3))),3), (None,0)]),
171: ('titleToNumber', [('A',1),('AB',28),('ZY',701)]),
222: ('countNodes', [(tree(1,tree(2,tree(4),tree(5)),tree(3,tree(6))),6), (None,0)]),
228: ('summaryRanges', [([0,1,2,4,5,7],['0->2','4->5','7']), ([],[]), ([-2147483648,-2147483647,2147483647],['-2147483648->-2147483647','2147483647'])]),
257: ('binaryTreePaths', [(tree(1,tree(2,None,tree(5)),tree(3)),['1->2->5','1->3']), (None,[])]),
258: ('addDigits', [(0,0),(38,2),(18,9)]),
326: ('isPowerOfThree', [(1,True),(27,True),(45,False),(0,False)]),
345: ('reverseVowels', [('hello','holle'),('aA','Aa'),('xyz','xyz')]),
350: ('intersect', [(([1,2,2,1],[2,2]),[2,2]), (([4,9,5],[9,4,9,8,4]),[4,9])]),
404: ('sumOfLeftLeaves', [(tree(3,tree(9),tree(20,tree(15),tree(7))),24), (tree(1),0)]),
412: ('fizzBuzz', [(3,['1','2','Fizz'])]),
414: ('thirdMax', [([3,2,1],1), ([2,2,3,1],1), ([1,2],2), ([-2147483648,1,2],-2147483648)]),
415: ('addStrings', [(('11','123'),'134'), (('999','1'),'1000'), (('0','0'),'0')]),
459: ('repeatedSubstringPattern', [('abab',True),('aba',False),('a',False)]),
461: ('hammingDistance', [((1,4),2),((0,0),0)]),
509: ('fib', [(0,0),(1,1),(10,55),(30,832040)]),
541: ('reverseStr', [(('abcdefg',2),'bacdfeg'), (('abcd',4),'dcba')]),
643: ('findMaxAverage', [(([1,12,-5,-6,50,3],4),12.75), (([-2,-3,-1],2),-2.0)]),
653: ('findTarget', [((tree(2,tree(1),tree(3)),4),True), ((tree(2),4),False), ((tree(2,tree(2),tree(3)),4),True)]),
}


def verify(namespaces):
    tested, checks = set(), 0
    manifest = json.loads((ROOT / 'scripts/additional-reference-manifest.json').read_text())['references']
    by_number = {r['number']: r for r in manifest}
    unordered = {241,350,491,508}
    for number, (method, cases) in CASES.items():
        for inputs, expected in cases:
            inputs = inputs if isinstance(inputs, tuple) else (inputs,)
            actual = getattr(namespaces[by_number[number]['id']]['Solution'](), method)(*copy.deepcopy(inputs))
            if number in unordered:
                actual, expected = sorted(actual), sorted(expected)
            assert actual == expected, (number, method, actual, expected)
            checks += 1
        if cases:
            tested.add(number)
    for number, inputs, expected in [(82,[1,2,3,3,4,4,5],[1,2,5]), (82,[1,1],[]), (328,[1,2,3,4,5],[1,3,5,2,4]), (328,[],[])]:
        method = 'deleteDuplicates' if number == 82 else 'oddEvenList'
        result = getattr(namespaces[by_number[number]['id']]['Solution'](), method)(linked(inputs))
        assert values(result) == expected
        tested.add(number); checks += 1
    root = namespaces[by_number[109]['id']]['Solution']().sortedListToBST(linked([-10,-3,0,5,9]))
    def inorder(node):
        return inorder(node.left) + [node.val] + inorder(node.right) if node else []
    def height(node):
        if not node: return 0
        l, r = height(node.left), height(node.right)
        assert abs(l - r) <= 1
        return 1 + max(l, r)
    assert inorder(root) == [-10,-3,0,5,9]; height(root)
    tested.add(109); checks += 1
    root = tree(1,tree(2,tree(3),tree(4)),tree(5,None,tree(6)))
    assert namespaces[by_number[114]['id']]['Solution']().flatten(root) is None
    actual, seen = [], set()
    while root:
        assert root.left is None and id(root) not in seen
        seen.add(id(root)); actual.append(root.val); root = root.right
    assert actual == [1,2,3,4,5,6]
    tested.add(114); checks += 1
    node = linked([4,5,1,9]); assert namespaces[by_number[237]['id']]['Solution']().deleteNode(node.next) is None
    assert values(node) == [4,1,9]
    tested.add(237); checks += 1
    root = tree(2,tree(1),tree(3))
    assert namespaces[by_number[285]['id']]['Solution']().inorderSuccessor(root,root.left) is root
    assert namespaces[by_number[285]['id']]['Solution']().inorderSuccessor(root,root.right) is None
    tested.add(285); checks += 2
    board = [[0,1,0],[0,0,1],[1,1,1],[0,0,0]]
    assert namespaces[by_number[289]['id']]['Solution']().gameOfLife(board) is None
    assert board == [[0,0,0],[1,0,1],[0,1,1],[0,1,0]]
    tested.add(289); checks += 1
    counter = namespaces[by_number[362]['id']]['HitCounter']()
    for timestamp in [1,1,2,300]: counter.hit(timestamp)
    assert counter.getHits(300) == 4 and counter.getHits(301) == 2
    counter.hit(301); assert counter.getHits(301) == 3 and counter.getHits(601) == 0
    tested.add(362); checks += 4
    solution = namespaces[by_number[89]['id']]['Solution']()
    for n in range(1,7):
        result = solution.grayCode(n)
        assert result[0] == 0 and sorted(result) == list(range(2**n))
        assert all((a ^ b).bit_count() == 1 for a, b in zip(result,result[1:] + result[:1]))
        checks += 1
    tested.add(89)
    # A maximum-length input exercises the iterative replacement for #541.
    large = 'ab' * 5000
    assert namespaces[by_number[541]['id']]['Solution']().reverseStr(large,1) == large
    checks += 1
    assert tested == set(by_number), ('Missing behavioral checks', set(by_number) - tested)
    return len(tested), checks


CPP_CASES = {
8: 'assert(s.myAtoi("2147483648") == INT_MAX); assert(s.myAtoi("-91283472332") == INT_MIN);',
137: 'vector<int> v{-2,-2,-2,-4}; assert(s.singleNumber(v) == -4);',
165: 'assert(s.compareVersion("1.0", "1.0.0") == 0); assert(s.compareVersion("1.10", "1.2") == 1);',
166: 'assert(s.fractionToDecimal(INT_MIN,-1) == "2147483648"); assert(s.fractionToDecimal(1,6) == "0.1(6)");',
264: 'assert(s.nthUglyNumber(1690) == 2123366400);',
313: 'vector<int> p{2,7,13,19}; assert(s.nthSuperUglyNumber(12,p) == 32); vector<int> q{2}; assert(s.nthSuperUglyNumber(31,q) == 1073741824);',
397: 'assert(s.integerReplacement(INT_MAX) == 32);',
433: 'vector<string> b{}; assert(s.minMutation("AACCGGTT","AACCGGTT",b) == 0);',
476: 'assert(s.findComplement(8) == 7); assert(s.findComplement(1) == 0);',
486: 'vector<int> a{1,5,2}, b{1,1}; assert(!s.predictTheWinner(a)); assert(s.predictTheWinner(b));',
498: 'vector<vector<int>> m{{1},{2},{3}}; assert((s.findDiagonalOrder(m) == vector<int>{1,2,3}));',
541: 'assert(s.reverseStr("abcdefg",2) == "bacdfeg");',
593: 'vector<int> a{0,0},b{2,0},c{2,1},d{0,1}; assert(!s.validSquare(a,b,c,d));',
653: 'TreeNode a(2), b(2), c(3); a.left=&b; a.right=&c; assert(s.findTarget(&a,4)); assert(!s.findTarget(&b,4));',
}


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--cpp', action='store_true'); args = parser.parse_args()
    manifest = json.loads((ROOT / 'scripts/additional-reference-manifest.json').read_text())['references']
    namespaces, records = {}, {}
    for r in manifest:
        reference = json.loads((ROOT / 'src/data/problemReferences' / (r['id'] + '.json')).read_text())
        namespace = {'TreeNode':TreeNode, 'ListNode':ListNode, 'Node':NaryNode}
        exec(compile(reference['code']['python'], r['id'], 'exec'), namespace)
        namespaces[r['id']], records[r['number']] = namespace, reference
    tested, checks = verify(namespaces)
    print(f'{tested} new Python solutions exercised; {checks} example, edge, mutation, and structural checks passed.', flush=True)
    if args.cpp:
        def syntax_check(record):
            code = COMMON['cpp_headers'](record['code']['cpp']) + record['code']['cpp']
            result = subprocess.run(['c++','-std=c++20','-fsyntax-only','-x','c++','-'], input=code, text=True, capture_output=True)
            assert result.returncode == 0, (record['problemId'], result.stderr)
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(syntax_check, records.values()))
        print(f"{len(records)} new C++ snippets passed syntax validation.", flush=True)
        with tempfile.TemporaryDirectory() as folder:
            for number, body in CPP_CASES.items():
                code = COMMON['cpp_headers'](records[number]['code']['cpp']) + '\n#include <cassert>\n' + records[number]['code']['cpp'] + '\nint main() { Solution s; ' + body + ' }\n'
                binary = Path(folder) / str(number)
                result = subprocess.run(['c++','-std=c++20','-x','c++','-','-o',str(binary)],input=code,text=True,capture_output=True)
                assert result.returncode == 0, (number,result.stderr)
                subprocess.run([str(binary)],check=True,timeout=10)
        print(f'{len(CPP_CASES)} C++ boundary programs compiled and passed.')


if __name__ == '__main__': main()
