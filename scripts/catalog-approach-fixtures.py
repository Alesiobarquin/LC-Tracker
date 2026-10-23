"""Independent examples, boundary values, API traces, and structural checks."""
from collections import Counter, deque
import copy
from itertools import product
from pathlib import Path
import runpy

COMMON = runpy.run_path(str(Path(__file__).with_name('verify-problem-references.py')))
TreeNode, ListNode = COMMON['TreeNode'], COMMON['ListNode']


class Node(TreeNode):
    def __init__(self, val=0, children=None):
        super().__init__(val)
        self.children = children or []
        self.next = None


class NestedInteger:
    def __init__(self, value):
        self.value = value if isinstance(value, int) else [NestedInteger(v) for v in value]

    def isInteger(self):
        return isinstance(self.value, int)

    def getInteger(self):
        assert self.isInteger()
        return self.value

    def getList(self):
        assert not self.isInteger()
        return self.value


class Employee:
    def __init__(self, id, importance, subordinates):
        self.id, self.importance, self.subordinates = id, importance, subordinates


class ArrayReader:
    def __init__(self, values):
        self.values, self.calls = values, 0

    def get(self, index):
        self.calls += 1
        assert index >= 0
        return self.values[index] if index < len(self.values) else 2**31 - 1


def t(value, left=None, right=None):
    return TreeNode(value, left, right)


def shape(root):
    seen = set()
    def visit(node):
        if node is None:
            return None
        assert id(node) not in seen, 'tree contains a cycle or shared child'
        seen.add(id(node))
        return node.val, visit(node.left), visit(node.right)
    return visit(root)


CASES = {
29: ('divide', [((10, 3), 3), ((7, -3), -2), ((-2**31, -1), 2**31 - 1), ((-2**31, 1), -2**31), ((0, 3), 0), ((1, 2**30), 0)]),
164: ('maximumGap', [(([3, 6, 9, 1],), 3), (([10],), 0), (([1, 1, 1],), 0), (([0, 10**9],), 10**9)]),
243: ('shortestDistance', [((['practice', 'makes', 'perfect', 'coding', 'makes'], 'coding', 'practice'), 3), ((['a', 'b', 'a', 'b'], 'a', 'b'), 1)]),
245: ('shortestWordDistance', [((['practice', 'makes', 'perfect', 'coding', 'makes'], 'makes', 'coding'), 1), ((['practice', 'makes', 'perfect', 'coding', 'makes'], 'makes', 'makes'), 3), ((['a', 'a', 'b'], 'a', 'a'), 1)]),
246: ('isStrobogrammatic', [(('69',), True), (('88',), True), (('962',), False), (('6',), False), (('1',), True)]),
267: ('generatePalindromes', [(('aabb',), ['abba', 'baab']), (('abc',), []), (('aaa',), ['aaa']), (('aaaa',), ['aaaa'])]),
291: ('wordPatternMatch', [(('abab', 'redblueredblue'), True), (('aaaa', 'asdasdasdasd'), True), (('aabb', 'xyzabcxzyabc'), False), (('aaaa', 'aaba'), False), (('ab', 'aa'), False)]),
294: ('canWin', [(('++++',), True), (('+',), False), (('+++++',), False), (('++--++',), False), (('+++',), True)]),
306: ('isAdditiveNumber', [(('112358',), True), (('199100199',), True), (('1023',), False), (('000',), True), (('1203',), False), (('12122436',), True)]),
320: ('generateAbbreviations', [(('a',), ['1', 'a']), (('ab',), ['2', '1b', 'a1', 'ab']), (('word',), ['4','3d','2r1','2rd','1o2','1o1d','1or1','1ord','w3','w2d','w1r1','w1rd','wo2','wo1d','wor1','word'])]),
351: ('numberOfPatterns', [((1, 1), 9), ((1, 2), 65), ((2, 2), 56), ((1, 9), 389497)]),
356: ('isReflected', [(([[1, 1], [-1, 1]],), True), (([[1, 1], [-1, -1]],), False), (([[1, 1], [1, 1], [3, 1]],), True), (([[0, 0]],), True)]),
372: ('superPow', [((2, [3]), 8), ((2, [1, 0]), 1024), ((1, [4, 3, 3, 8, 5, 2]), 1), ((1337, [1]), 0), ((2147483647, [2, 0, 0]), pow(2147483647, 200, 1337))]),
388: ('lengthLongestPath', [(('dir\n\tsubdir1\n\tsubdir2\n\t\tfile.ext',), 20), (('a',), 0), (('file1.txt\nfile2.txt\nlongfile.txt',), 12), (('a\n\tb\n\t\tc.txt\naaa\n\tb.txt',), 9)]),
390: ('lastRemaining', [((1,), 1), ((9,), 6), ((24,), 14), ((100,), 54)]),
400: ('findNthDigit', [((3,), 3), ((11,), 0), ((190,), 1), ((191,), 0), ((192,), 0), ((1000,), 3)]),
401: ('readBinaryWatch', [((0,), ['0:00']), ((1,), ['1:00','2:00','4:00','8:00','0:01','0:02','0:04','0:08','0:16','0:32']), ((9,), [])]),
405: ('toHex', [((26,), '1a'), ((-1,), 'ffffffff'), ((0,), '0'), ((-2**31,), '80000000'), ((2**31 - 1,), '7fffffff')]),
418: ('wordsTyping', [((['hello', 'world'], 2, 8), 1), ((['a','bcd','e'], 3, 6), 2), ((['i','had','apple','pie'], 4, 5), 1), ((['toolong'], 200, 2), 0)]),
421: ('findMaximumXOR', [(([3,10,5,25,2,8],), 28), (([0],), 0), (([2,4],), 6), (([1,1,1],), 0), (([0,2**31-1],), 2**31-1)]),
423: ('originalDigits', [(('owoztneoer',), '012'), (('fviefuro',), '45'), (('zerozero',), '00'), (('nnei',), '9')]),
444: ('sequenceReconstruction', [(([1,2,3], [[1,2],[1,3]]), False), (([1,2,3], [[1,2],[1,3],[2,3]]), True), (([1], [[]]), False), (([1], [[],[1]]), True), (([1,2], [[1]]), False), (([1,2], [[1,2],[2,1]]), False)]),
457: ('circularArrayLoop', [(([2,-1,1,2,2],), True), (([-1,2],), False), (([-2,1,-1,-2,-2],), False), (([1,1],), True), (([2,2],), False)]),
464: ('canIWin', [((10, 11), False), ((10, 0), True), ((10, 1), True), ((5, 50), False), ((3, 6), True)]),
468: ('validIPAddress', [(('172.16.254.1',), 'IPv4'), (('2001:0db8:85a3:0:0:8A2E:0370:7334',), 'IPv6'), (('256.256.256.256',), 'Neither'), (('01.1.1.1',), 'Neither'), (('2001:db8::1',), 'Neither'), (('1.1.1.1:',), 'Neither')]),
469: ('isConvex', [(([[0,0],[0,1],[1,1],[1,0]],), True), (([[0,0],[0,10],[10,10],[10,0],[5,5]],), False), (([[0,0],[1,0],[2,0],[2,2],[0,2]],), True)]),
481: ('magicalString', [((0,), 0), ((1,), 1), ((6,), 3), ((10,), 5), ((20,), 10)]),
482: ('licenseKeyFormatting', [(('5F3Z-2e-9-w',4), '5F3Z-2E9W'), (('2-5g-3-J',2), '2-5G-3J'), (('---',3), ''), (('abc',1), 'A-B-C')]),
495: ('findPoisonedDuration', [(([1,4],2), 4), (([1,2],2), 3), (([1,2],0), 0), (([0,1,10],5), 11)]),
500: ('findWords', [((['Hello','Alaska','Dad','Peace'],), ['Alaska','Dad']), ((['omk'],), []), ((['a','S','z'],), ['a','S','z'])]),
501: ('findMode', [((t(1,None,t(2,t(2))),), [2]), ((t(0),), [0]), ((t(2,t(1),t(3)),), [1,2,3])]),
507: ('checkPerfectNumber', [((28,), True), ((6,), True), ((1,), False), ((12,), False), ((33550336,), True)]),
520: ('detectCapitalUse', [(('USA',), True), (('leetcode',), True), (('Google',), True), (('FlaG',), False), (('g',), True)]),
522: ('findLUSlength', [((['aba','cdc','eae'],), 3), ((['aaa','aaa','aa'],), -1), ((['aabbcc','aabbcc','cb'],), 2)]),
533: ('findBlackPixel', [(([list('WBWBBW'),list('WBWBBW'),list('WBWBBW'),list('WWBWBW')],3), 6), (([list('BB'),list('BB')],2), 4), (([list('BW'),list('WB')],1), 2)]),
544: ('findContestMatch', [((2,), '(1,2)'), ((4,), '((1,4),(2,3))'), ((8,), '(((1,8),(4,5)),((2,7),(3,6)))')]),
551: ('checkRecord', [(('PPALLP',), True), (('PPALLL',), False), (('AA',), False), (('LPLPL',), True)]),
559: ('maxDepth', [((Node(1,[Node(3,[Node(5),Node(6)]),Node(2),Node(4)]),), 3), ((None,), 0), ((Node(1),), 1)]),
561: ('arrayPairSum', [(([1,4,3,2],), 4), (([6,2,6,5,1,2],), 9), (([-10000,10000],), -10000), (([-1,-1,0,0],), -1)]),
562: ('longestLine', [(([[0,1,1,0],[0,1,1,0],[0,0,0,1]],), 3), (([[0]],), 0), (([[1]],), 1), (([[0,0,1],[0,1,0],[1,0,0]],), 3)]),
563: ('findTilt', [((t(1,t(2),t(3)),), 1), ((t(4,t(2,t(3),t(5)),t(9,None,t(7))),), 15), ((None,), 0)]),
566: ('matrixReshape', [(([[1,2],[3,4]],1,4), [[1,2,3,4]]), (([[1,2],[3,4]],2,4), [[1,2],[3,4]]), (([[1,2,3,4]],4,1), [[1],[2],[3],[4]])]),
573: ('minDistance', [((5,7,[2,2],[4,4],[[3,0],[2,5]]), 12), ((1,3,[0,0],[0,2],[[0,1]]), 2), ((1,5,[0,0],[0,4],[[0,1]]), 4)]),
575: ('distributeCandies', [(([1,1,2,2,3,3],), 3), (([1,1,2,3],), 2), (([6,6,6,6],), 1)]),
592: ('fractionAddition', [(('-1/2+1/2',), '0/1'), (('-1/2+1/2+1/3',), '1/3'), (('1/3-1/2',), '-1/6'), (('5/3+1/3',), '2/1')]),
594: ('findLHS', [(([1,3,2,2,5,2,3,7],), 5), (([1,1,1,1],), 0), (([1,2,3,4],), 2), (([-2,-1,-1],), 3)]),
598: ('maxCount', [((3,3,[[2,2],[3,3]]), 4), ((3,3,[]), 9), ((4,5,[[1,4],[3,2]]), 2)]),
599: ('findRestaurant', [((['Shogun','Tapioca Express','Burger King','KFC'],['Piatti','The Grill at Torrey Pines','Hungry Hunter Steakhouse','Shogun']), ['Shogun']), ((['a','b','c'],['c','b','a']), ['a','b','c'])]),
609: ('findDuplicate', [((['root/a 1.txt(abcd) 2.txt(efgh)','root/c 3.txt(abcd)','root/c/d 4.txt(efgh)','root 4.txt(efgh)'],), [['root/a/1.txt','root/c/3.txt'],['root/a/2.txt','root/c/d/4.txt','root/4.txt']]), ((['root/a x.txt(a) y.txt(b)'],), [])]),
625: ('smallestFactorization', [((48,), 68), ((15,), 35), ((1,), 1), ((19,), 0), ((2**30,), 0)]),
628: ('maximumProduct', [(([1,2,3],), 6), (([-10,-10,5,2],), 500), (([-1,-2,-3],), -6), (([0,0,1],), 0)]),
633: ('judgeSquareSum', [((5,), True), ((3,), False), ((0,), True), ((2,), True), ((2147483647,), False)]),
634: ('findDerangement', [((1,), 0), ((2,), 1), ((3,), 2), ((4,), 9), ((10,), 1334961)]),
638: ('shoppingOffers', [(([2,5],[[3,0,5],[1,2,10]],[3,2]), 14), (([2,3,4],[[1,1,0,4],[2,2,1,9]],[1,2,1]), 11), (([2],[[1,1]],[0]), 0)]),
640: ('solveEquation', [(('x+5-3+x=6+x-2',), 'x=2'), (('x=x',), 'Infinite solutions'), (('2x=x',), 'x=0'), (('x=x+2',), 'No solution'), (('0x=0',), 'Infinite solutions'), (('-x=-1',), 'x=1')]),
648: ('replaceWords', [((['cat','bat','rat'],'the cattle was rattled by the battery'), 'the cat was rat by the bat'), ((['a','aa'],'a aa aaa aaaa'), 'a a a a'), ((['xyz'],'the cat'), 'the cat')]),
650: ('minSteps', [((1,), 0), ((3,), 3), ((4,), 4), ((9,), 6), ((18,), 8), ((1000,), 21)]),
655: ('printTree', [((t(1,t(2)),), [['','1',''],['2','','']]), ((t(1,t(2),t(3,None,t(4))),), [['','','','1','','',''],['','2','','','','3',''],['','','','','','','4']]), ((t(0),), [['0']])]),
657: ('judgeCircle', [(('UD',), True), (('LL',), False), (('RRDDLLUU',), True)]),
663: ('checkEqualTree', [((t(5,t(10),t(10,t(2),t(3))),), True), ((t(1,t(2),t(10,t(2),t(20))),), False), ((t(0),), False), ((t(0,t(0)),), True), ((t(-1,t(-1)),), True)]),
666: ('pathSum', [(([113,215,221],), 12), (([113,221],), 4), (([110],), 0), (([113,215,221,315,415],), 22)]),
670: ('maximumSwap', [((2736,), 7236), ((9973,), 9973), ((98368,), 98863), ((0,), 0)]),
672: ('flipLights', [((1,1), 2), ((2,1), 3), ((3,1), 4), ((3,2), 7), ((1000,3), 8), ((5,0), 1)]),
674: ('findLengthOfLCIS', [(([1,3,5,4,7],), 3), (([2,2,2,2,2],), 1), (([1],), 1)]),
681: ('nextClosestTime', [(('19:34',), '19:39'), (('23:59',), '22:22'), (('11:11',), '11:11'), (('20:48',), '22:00')]),
686: ('repeatedStringMatch', [(('abcd','cdabcdab'), 3), (('a','aa'), 2), (('abc','wxyz'), -1), (('abc','c'), 1), (('abc','cabcabca'), 4)]),
687: ('longestUnivaluePath', [((t(5,t(4,t(1),t(1)),t(5,None,t(5))),), 2), ((t(1,t(1),t(1)),), 2), ((t(7),), 0), ((None,), 0)]),
688: ('knightProbability', [((3,2,0,0), 0.0625), ((1,0,0,0), 1.0), ((1,1,0,0), 0.0), ((8,1,3,3), 1.0)]),
692: ('topKFrequent', [((['i','love','leetcode','i','love','coding'],2), ['i','love']), ((['the','day','is','sunny','the','the','the','sunny','is','is'],4), ['the','is','sunny','day']), ((['c','b','a'],2), ['a','b'])]),
693: ('hasAlternatingBits', [((5,), True), ((7,), False), ((11,), False), ((1,), True), ((2,), True)]),
696: ('countBinarySubstrings', [(('00110011',), 6), (('10101',), 4), (('000',), 0), (('01',), 1)]),
697: ('findShortestSubArray', [(([1,2,2,3,1],), 2), (([1,2,2,3,1,4,2],), 6), (([1],), 1)]),
714: ('maxProfit', [(([1,3,2,8,4,9],2), 8), (([1,3,7,5,10,3],3), 6), (([9,8,7],0), 0), (([1,2,3],0), 2)]),
717: ('isOneBitCharacter', [(([1,0,0],), True), (([1,1,1,0],), False), (([0],), True), (([1,1,0],), True)]),
718: ('findLength', [(([1,2,3,2,1],[3,2,1,4,7]), 3), (([0,0,0],[0,0]), 2), (([1,2],[3,4]), 0)]),
720: ('longestWord', [((['w','wo','wor','worl','world'],), 'world'), ((['a','banana','app','appl','ap','apply','apple'],), 'apple'), ((['w','wo','wor','word'],), 'word'), ((['abc','bc'],), '')]),
722: ('removeComments', [((['/*Test program */','int main()','{ ','  // variable declaration ','int a, b, c;','/* This is a test','   multiline  ','   comment for ','   testing */','a = b + c;','}'],), ['int main()','{ ','  ','int a, b, c;','a = b + c;','}']), ((['a/*comment','line','more*/b'],), ['ab']), ((['x// hi','y/* // ignored */z'],), ['x','yz'])]),
728: ('selfDividingNumbers', [((1,22), [1,2,3,4,5,6,7,8,9,11,12,15,22]), ((47,85), [48,55,66,77]), ((100,100), [])]),
737: ('areSentencesSimilarTwo', [((['great','acting','skills'],['fine','drama','talent'],[['great','good'],['fine','good'],['acting','drama'],['skills','talent']]), True), ((['a'],['a'],[]), True), ((['a'],['b'],[]), False), ((['a'],['a','b'],[]), False)]),
744: ('nextGreatestLetter', [((['c','f','j'],'a'), 'c'), ((['c','f','j'],'c'), 'f'), ((['c','f','j'],'j'), 'c'), ((['a','a','c'],'a'), 'c')]),
747: ('dominantIndex', [(([3,6,1,0],), 1), (([1,2,3,4],), -1), (([0],), 0), (([1],), 0)]),
748: ('shortestCompletingWord', [(('1s3 PSt',['step','steps','stripe','stepple']), 'steps'), (('1s3 456',['looks','pest','stew','show']), 'pest'), (('ABC',['abcc','aabbcc','abc']), 'abc')]),
754: ('reachNumber', [((3,), 2), ((2,), 3), ((-2,), 3), ((1,), 1), ((10**9,), 44723)]),
756: ('pyramidTransition', [(('BCD',['BCC','CDE','CEA','FFF']), True), (('AAAA',['AAB','AAC','BCD','BBE','DEF']), False), (('AB',['ABC']), True)]),
766: ('isToeplitzMatrix', [(([[1,2,3,4],[5,1,2,3],[9,5,1,2]],), True), (([[1,2],[2,2]],), False), (([[1,2,3]],), True)]),
769: ('maxChunksToSorted', [(([4,3,2,1,0],), 1), (([1,0,2,3,4],), 4), (([0],), 1)]),
775: ('isIdealPermutation', [(([1,0,2],), True), (([1,2,0],), False), (([0],), True)]),
777: ('canTransform', [(('RXXLRXRXL','XRLXXRRLX'), True), (('X','L'), False), (('XL','LX'), True), (('RX','XR'), True), (('LX','XL'), False)]),
781: ('numRabbits', [(([1,1,2],), 5), (([10,10,10],), 11), (([0,0,1,1,1],), 6)]),
788: ('rotatedDigits', [((10,), 4), ((1,), 0), ((2,), 1), ((100,), 40)]),
790: ('numTilings', [((1,), 1), ((2,), 2), ((3,), 5), ((4,), 11), ((30,), 312342182)]),
792: ('numMatchingSubseq', [(('abcde',['a','bb','acd','ace']), 3), (('a',['a','a','aa','b']), 2), (('dsahjpjauf',['ahjpjau','ja','ahbwzgqnuk','tnmlanowax']), 2)]),
795: ('numSubarrayBoundedMax', [(([2,1,4,3],2,3), 3), (([2,9,2,5,6],2,8), 7), (([1,1],2,3), 0), (([2,2],2,2), 3)]),
797: ('allPathsSourceTarget', [(([[1,2],[3],[3],[]],), [[0,1,3],[0,2,3]]), (([[1],[]],), [[0,1]]), (([[],[]],), [])]),
807: ('maxIncreaseKeepingSkyline', [(([[3,0,8,4],[2,4,5,7],[9,2,6,3],[0,3,1,0]],), 35), (([[0,0],[0,0]],), 0), (([[1]],), 0)]),
809: ('expressiveWords', [(('heeellooo',['hello','hi','helo']), 1), (('zzzzzyyyyy',['zzyy','zy','zyy']), 3), (('abcd',['abc']), 0)]),
811: ('subdomainVisits', [((['9001 discuss.leetcode.com'],), ['9001 discuss.leetcode.com','9001 leetcode.com','9001 com']), ((['10 a.com','5 b.com'],), ['10 a.com','5 b.com','15 com'])]),
841: ('canVisitAllRooms', [(([[1],[2],[3],[]],), True), (([[1,3],[3,0,1],[2],[0]],), False), (([[]],), True)]),
}


def normalize(number, value):
    if number in [267, 320, 401, 501, 599, 811]:
        return sorted(value)
    if number in [609, 797]:
        return sorted(tuple(sorted(group)) if number == 609 else tuple(group) for group in value)
    return value


def nodes(root):
    if not root:
        return set()
    return {root} | nodes(root.left) | nodes(root.right)


def check_special(number, namespace):
    if number == 117:
        root = Node(1)
        root.left, root.right = Node(2), Node(3)
        root.left.left, root.left.right, root.right.right = Node(4), Node(5), Node(7)
        expected = [[root], [root.left, root.right], [root.left.left, root.left.right, root.right.right]]
        assert namespace['Solution']().connect(root) is root
        for level in expected:
            for i, node in enumerate(level):
                assert node.next is (level[i + 1] if i + 1 < len(level) else None)
        assert namespace['Solution']().connect(None) is None
        return 7
    if number == 156:
        root = t(1,t(2,t(4),t(5)),t(3))
        original = nodes(root)
        result = namespace['Solution']().upsideDownBinaryTree(root)
        assert shape(result) == (4,(5,None,None),(2,(3,None,None),(1,None,None)))
        assert nodes(result) == original
        assert namespace['Solution']().upsideDownBinaryTree(None) is None
        return 3
    if number == 170:
        item = namespace['TwoSum']()
        item.add(1); item.add(3); item.add(5)
        assert item.find(4) is True and item.find(7) is False
        assert item.find(2) is False
        item.add(1)
        assert item.find(2) is True
        item.add(-1)
        assert item.find(0) is True
        return 5
    if number == 244:
        item = namespace['WordDistance'](['practice','makes','perfect','coding','makes'])
        assert item.shortest('coding','practice') == 3
        assert item.shortest('makes','coding') == 1
        assert item.shortest('practice','makes') == 1
        return 3
    if number == 251:
        for values, expected in [([[],[1,2],[],[3],[]],[1,2,3]), ([[],[]],[]), ([[0]],[0])]:
            item = namespace['Vector2D'](copy.deepcopy(values))
            result = []
            while item.hasNext():
                assert item.hasNext() is True
                result.append(item.next())
            assert item.hasNext() is False and result == expected
        return 3
    if number == 288:
        item = namespace['ValidWordAbbr'](['deer','door','cake','card','deer'])
        assert item.isUnique('dear') is False
        assert item.isUnique('cart') is True
        assert item.isUnique('cane') is False
        assert item.isUnique('cake') is True
        triple = namespace['ValidWordAbbr'](['deer','door','daar'])
        assert triple.isUnique('deer') is False
        duplicate = namespace['ValidWordAbbr'](['hello','hello'])
        assert duplicate.isUnique('hello') is True
        return 6
    if number == 308:
        item = namespace['NumMatrix']([[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]])
        assert item.sumRegion(2,1,4,3) == 8
        item.update(3,2,2)
        assert item.sumRegion(2,1,4,3) == 10
        item.update(3,2,-2)
        assert item.sumRegion(3,2,3,2) == -2
        assert item.sumRegion(0,0,0,4) == 10
        return 4
    if number == 324:
        for values in [[1,5,1,1,6,4], [1,3,2,2,3,1], [1], [1,1,2], [1]*600 + [2]*600]:
            working = values[:]
            assert namespace['Solution']().wiggleSort(working) is None
            assert Counter(working) == Counter(values)
            assert all((a < b) if i % 2 == 0 else (a > b) for i, (a,b) in enumerate(zip(working,working[1:])))
        return 5
    if number in [339, 364]:
        method = 'depthSum' if number == 339 else 'depthSumInverse'
        examples = [([[1,1],2,[1,1]], 10 if number == 339 else 8), ([1,[4,[6]]], 27 if number == 339 else 17), ([-1,[-2]], -5 if number == 339 else -4)]
        for values, expected in examples:
            assert getattr(namespace['Solution'](),method)([NestedInteger(value) for value in values]) == expected
        return len(examples)
    if number == 359:
        item = namespace['Logger']()
        trace = [(1,'foo',True),(2,'bar',True),(3,'foo',False),(8,'bar',False),(10,'foo',False),(11,'foo',True),(12,'bar',True)]
        for timestamp, message, expected in trace:
            assert item.shouldPrintMessage(timestamp,message) is expected
        return len(trace)
    if number == 379:
        item = namespace['PhoneDirectory'](3)
        allocated = [item.get() for _ in range(3)]
        assert set(allocated) == {0,1,2}
        assert item.get() == -1
        assert all(item.check(value) is False for value in allocated)
        item.release(allocated[1]); item.release(allocated[1])
        assert item.check(allocated[1]) is True
        assert item.get() == allocated[1] and item.get() == -1
        return 5
    if number == 449:
        for root in [None, t(2,t(1),t(3)), t(0,None,t(10000)), t(5,t(2,t(1),t(3)),t(8))]:
            codec = namespace['Codec']()
            encoded = codec.serialize(root)
            result = codec.deserialize(encoded)
            assert shape(result) == shape(root)
        return 4
    if number == 635:
        item = namespace['LogSystem']()
        item.put(1,'2017:01:01:23:59:59')
        item.put(2,'2017:01:01:22:59:59')
        item.put(3,'2016:01:01:00:00:00')
        assert sorted(item.retrieve('2016:01:01:01:01:01','2017:01:01:23:00:00','Year')) == [1,2,3]
        assert sorted(item.retrieve('2016:01:01:01:01:01','2017:01:01:23:00:00','Hour')) == [1,2]
        assert item.retrieve('2017:01:01:23:59:59','2017:01:01:23:59:59','Second') == [1]
        assert item.retrieve('2015:01:01:00:00:00','2015:12:31:23:59:59','Month') == []
        return 4
    if number == 654:
        for values, expected in [([3,2,1,6,0,5], (6,(3,None,(2,None,(1,None,None))),(5,(0,None,None),None))), ([1],(1,None,None)), ([1,2,3],(3,(2,(1,None,None),None),None))]:
            assert shape(namespace['Solution']().constructMaximumBinaryTree(values[:])) == expected
        return 3
    if number == 667:
        for n,k in [(3,1),(3,2),(9,5),(20,19),(20,1)]:
            result = namespace['Solution']().constructArray(n,k)
            assert sorted(result) == list(range(1,n+1))
            assert len({abs(a-b) for a,b in zip(result,result[1:])}) == k
        return 5
    if number == 676:
        item = namespace['MagicDictionary']()
        item.buildDict(['hello','leetcode'])
        for word, expected in [('hello',False),('hhllo',True),('hell',False),('leetcoded',False),('leetcodd',True)]:
            assert item.search(word) is expected
        other = namespace['MagicDictionary']()
        other.buildDict(['hello','hallo'])
        assert other.search('hello') is True
        return 6
    if number == 677:
        item = namespace['MapSum']()
        item.insert('apple',3)
        assert item.sum('ap') == 3
        item.insert('app',2)
        assert item.sum('ap') == 5
        item.insert('apple',1)
        assert item.sum('ap') == 3
        assert item.sum('apple') == 1
        assert item.sum('b') == 0
        return 5
    if number == 690:
        employees = [Employee(1,5,[2,3]),Employee(2,3,[]),Employee(3,3,[]),Employee(4,-2,[])]
        item = namespace['Solution']()
        assert item.getImportance(employees,1) == 11
        assert item.getImportance(employees,2) == 3
        assert item.getImportance(employees,4) == -2
        return 3
    if number == 702:
        for values, target, expected in [([-1,0,3,5,9,12],9,4), ([-1,0,3,5,9,12],2,-1), ([7],7,0), ([7],8,-1), (list(range(0,20000,2)),19998,9999)]:
            reader = ArrayReader(values)
            assert namespace['Solution']().search(reader,target) == expected
            assert reader.calls <= 40
        return 5
    if number == 776:
        for target, expected in [(2, ((2,(1,None,None),None),(4,(3,None,None),(6,(5,None,None),(7,None,None))))), (0, (None,(4,(2,(1,None,None),(3,None,None)),(6,(5,None,None),(7,None,None))))), (7, ((4,(2,(1,None,None),(3,None,None)),(6,(5,None,None),(7,None,None))),None))]:
            root = t(4,t(2,t(1),t(3)),t(6,t(5),t(7)))
            original = nodes(root)
            small, large = namespace['Solution']().splitBST(root,target)
            assert (shape(small),shape(large)) == expected
            assert nodes(small).isdisjoint(nodes(large))
            assert nodes(small) | nodes(large) == original
        return 3
    if number == 814:
        for root, expected in [(t(1,None,t(0,t(0),t(1))), (1,None,(0,None,(1,None,None)))), (t(0,t(0),t(0)),None), (t(1),(1,None,None)), (None,None)]:
            original = nodes(root)
            result = namespace['Solution']().pruneTree(root)
            assert shape(result) == expected
            assert nodes(result) <= original
        return 4
    raise AssertionError(f'Missing behavioral fixtures for {number}')


def check_exhaustive_small(number, namespace):
    # Small independent search/count oracles catch errors beyond the named cases.
    if number == 294:
        from functools import cache
        @cache
        def wins(state):
            choices = [state[:i] + '--' + state[i+2:] for i in range(len(state)-1) if state[i:i+2] == '++']
            return any(not wins(child) for child in choices)
        count = 0
        for length in range(1,8):
            for chars in product('+-', repeat=length):
                state = ''.join(chars)
                assert namespace['Solution']().canWin(state) == wins(state)
                count += 1
        return count
    if number == 769:
        from itertools import permutations
        count = 0
        for values in permutations(range(5)):
            best = 0
            for mask in range(1 << 4):
                chunks, start = [], 0
                for end in range(5):
                    if end == 4 or mask & (1 << end):
                        chunks.append(sorted(values[start:end+1]))
                        start = end + 1
                if [value for chunk in chunks for value in chunk] == list(range(5)):
                    best = max(best,len(chunks))
            assert namespace['Solution']().maxChunksToSorted(list(values)) == best
            count += 1
        return count
    return 0
