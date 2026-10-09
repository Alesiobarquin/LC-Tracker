"""Reviewed adaptations for the pinned walkccc examples.
Python translations are used when only C++ is available, when the two languages
use different algorithms, or when a standard-library/in-place version is needed.
"""
PYTHON = {
38: '''class Solution:
    def countAndSay(self, n: int) -> str:
        term = "1"
        for _ in range(n - 1):
            parts = []
            i = 0
            while i < len(term):
                j = i + 1
                while j < len(term) and term[j] == term[i]:
                    j += 1
                parts.extend((str(j - i), term[i]))
                i = j
            term = "".join(parts)
        return term
''',
113: '''class Solution:
    def pathSum(self, root: TreeNode | None, targetSum: int) -> list[list[int]]:
        result, path = [], []
        def dfs(node, remaining):
            if node is None:
                return
            path.append(node.val)
            remaining -= node.val
            if node.left is None and node.right is None and remaining == 0:
                result.append(path.copy())
            dfs(node.left, remaining)
            dfs(node.right, remaining)
            path.pop()
        dfs(root, targetSum)
        return result
''',
166: '''class Solution:
    def fractionToDecimal(self, numerator: int, denominator: int) -> str:
        if numerator == 0:
            return "0"
        sign = "-" if (numerator < 0) != (denominator < 0) else ""
        numerator, denominator = abs(numerator), abs(denominator)
        integer, remainder = divmod(numerator, denominator)
        prefix = sign + str(integer)
        if remainder == 0:
            return prefix
        positions, digits = {}, []
        while remainder and remainder not in positions:
            positions[remainder] = len(digits)
            digit, remainder = divmod(remainder * 10, denominator)
            digits.append(str(digit))
        if remainder:
            start = positions[remainder]
            digits.insert(start, "(")
            digits.append(")")
        return prefix + "." + "".join(digits)
''',
216: '''class Solution:
    def combinationSum3(self, k: int, n: int) -> list[list[int]]:
        result, path = [], []
        def dfs(slots, remaining, start):
            if slots == 0 and remaining == 0:
                result.append(path.copy())
                return
            if slots == 0 or remaining <= 0:
                return
            for value in range(start, 10):
                path.append(value)
                dfs(slots - 1, remaining - value, value + 1)
                path.pop()
        dfs(k, n, 1)
        return result
''',
275: '''class Solution:
    def hIndex(self, citations: list[int]) -> int:
        n = len(citations)
        left, right = 0, n
        while left < right:
            mid = (left + right) // 2
            if citations[mid] + mid >= n:
                right = mid
            else:
                left = mid + 1
        return n - left
''',
299: '''class Solution:
    def getHint(self, secret: str, guess: str) -> str:
        bulls = 0
        secret_count, guess_count = [0] * 10, [0] * 10
        for a, b in zip(secret, guess):
            if a == b:
                bulls += 1
            else:
                secret_count[int(a)] += 1
                guess_count[int(b)] += 1
        cows = sum(min(a, b) for a, b in zip(secret_count, guess_count))
        return f"{bulls}A{cows}B"
''',
436: '''from bisect import bisect_left

class Solution:
    def findRightInterval(self, intervals: list[list[int]]) -> list[int]:
        starts = sorted((start, index) for index, (start, _) in enumerate(intervals))
        values = [start for start, _ in starts]
        result = []
        for _, end in intervals:
            index = bisect_left(values, end)
            result.append(starts[index][1] if index < len(starts) else -1)
        return result
''',
475: '''class Solution:
    def findRadius(self, houses: list[int], heaters: list[int]) -> int:
        houses.sort()
        heaters.sort()
        radius, index = 0, 0
        for house in houses:
            while index + 1 < len(heaters) and house - heaters[index] > heaters[index + 1] - house:
                index += 1
            radius = max(radius, abs(house - heaters[index]))
        return radius
''',
476: '''class Solution:
    def findComplement(self, num: int) -> int:
        original, mask = num, 1
        while mask <= original:
            num ^= mask
            mask <<= 1
        return num
''',
486: '''class Solution:
    def predictTheWinner(self, nums: list[int]) -> bool:
        n = len(nums)
        dp = [[0] * n for _ in range(n)]
        for i, value in enumerate(nums):
            dp[i][i] = value
        for length in range(2, n + 1):
            for i in range(n - length + 1):
                j = i + length - 1
                dp[i][j] = max(nums[i] - dp[i + 1][j], nums[j] - dp[i][j - 1])
        return dp[0][n - 1] >= 0
''',
498: '''class Solution:
    def findDiagonalOrder(self, mat: list[list[int]]) -> list[int]:
        m, n = len(mat), len(mat[0])
        result, direction, row, col = [], 1, 0, 0
        for _ in range(m * n):
            result.append(mat[row][col])
            row -= direction
            col += direction
            if row == m:
                row = m - 1
                col += 2
                direction = -direction
            if col == n:
                col = n - 1
                row += 2
                direction = -direction
            if row < 0:
                row = 0
                direction = -direction
            if col < 0:
                col = 0
                direction = -direction
        return result
''',
526: '''from functools import lru_cache

class Solution:
    def countArrangement(self, n: int) -> int:
        @lru_cache(None)
        def dfs(number, filled):
            if number == n + 1:
                return 1
            count = 0
            for position in range(1, n + 1):
                if filled[position] == "x" and (number % position == 0 or position % number == 0):
                    next_state = filled[:position] + "o" + filled[position + 1:]
                    count += dfs(number + 1, next_state)
            return count
        return dfs(1, "x" * (n + 1))
''',
539: '''class Solution:
    def findMinDifference(self, timePoints: list[str]) -> int:
        seen = [False] * 1440
        for time in timePoints:
            minute = int(time[:2]) * 60 + int(time[3:])
            if seen[minute]:
                return 0
            seen[minute] = True
        first = previous = None
        result = 1440
        for minute, present in enumerate(seen):
            if not present:
                continue
            if first is None:
                first = minute
            if previous is not None:
                result = min(result, minute - previous)
            previous = minute
        return min(result, 1440 - previous + first)
''',
541: '''class Solution:
    def reverseStr(self, s: str, k: int) -> str:
        chars = list(s)
        for start in range(0, len(chars), 2 * k):
            left, right = start, min(start + k - 1, len(chars) - 1)
            while left < right:
                chars[left], chars[right] = chars[right], chars[left]
                left += 1
                right -= 1
        return "".join(chars)
''',
593: '''from itertools import combinations

class Solution:
    def validSquare(self, p1, p2, p3, p4) -> bool:
        distances = sorted((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2
                           for a, b in combinations((p1, p2, p3, p4), 2))
        return (distances[0] > 0 and
                distances[0] == distances[1] == distances[2] == distances[3] and
                distances[4] == distances[5] == 2 * distances[0])
''',
}
CPP = {
593: '''class Solution {
public:
    bool validSquare(vector<int>& p1, vector<int>& p2, vector<int>& p3, vector<int>& p4) {
        vector<vector<int>> points{p1, p2, p3, p4};
        vector<long long> distances;
        for (int i = 0; i < 4; ++i)
            for (int j = i + 1; j < 4; ++j) {
                long long dx = points[i][0] - points[j][0];
                long long dy = points[i][1] - points[j][1];
                distances.push_back(dx * dx + dy * dy);
            }
        sort(distances.begin(), distances.end());
        return distances[0] > 0 && distances[0] == distances[1] &&
               distances[0] == distances[2] && distances[0] == distances[3] &&
               distances[4] == distances[5] && distances[4] == 2 * distances[0];
    }
};
''',
}


def adapt(number, language, code):
    if language == 'python':
        code = PYTHON.get(number, code)
        if number == 241:
            code = code.replace("ans.append(eval(str(a) + c + str(b)))", "ans.append(a + b if c == '+' else a - b if c == '-' else a * b)")
        if number == 370:
            code = code.replace('return itertools.accumulate(line)', 'return list(itertools.accumulate(line))')
        if number == 433:
            code = code.replace('    bankSet = set(bank)', '    if startGene == endGene:\n      return 0\n    bankSet = set(bank)')
        if number == 581:
            code = code.replace('reversed(list(enumerate(nums)))', '((i, nums[i]) for i in range(len(nums) - 1, -1, -1))')
        if number == 643:
            code = code.replace('summ = sum(nums[:k])', 'summ = sum(nums[i] for i in range(k))')
        if number == 653:
            code = code.replace('def next(self) -> int:', 'def next(self) -> TreeNode:').replace('return node.val', 'return node')
            code = code.replace('while l < r:', 'while l is not r:').replace('summ = l + r', 'summ = l.val + r.val')
    else:
        code = CPP.get(number, code).replace('__gcd(', 'std::gcd(')
        if number == 165:
            code = code.replace('int v1;', 'int v1 = 0;').replace('int v2;', 'int v2 = 0;')
        if number == 264:
            for factor in [2, 3, 5]:
                code = code.replace(f'const int next{factor} = uglyNums[i{factor}] * {factor};', f'const long long next{factor} = {factor}LL * uglyNums[i{factor}];')
        if number == 313:
            code = code.replace('vector<int> uglyNums', 'vector<long long> uglyNums').replace('vector<int> nexts', 'vector<long long> nexts').replace('const int next =', 'const long long next =')
        if number == 396:
            code = code.replace('sum - nums.size() * nums[i]', 'sum - static_cast<int>(nums.size()) * nums[i]')
        if number == 447:
            code = code.replace('// C(freq, 2)', '// Ordered pairs with this distance')
        if number == 433:
            code = code.replace('    unordered_set<string> bankSet', '    if (startGene == endGene) return 0;\n    unordered_set<string> bankSet').replace('constexpr char kGenes[]', 'constexpr string_view kGenes')
        if number == 486:
            code = code.replace('PredictTheWinner', 'predictTheWinner')
        if number == 653:
            code = code.replace('int next()', 'TreeNode* next()').replace('return root->val;', 'return root;')
            code = code.replace('int l = left.next(), r = right.next(); l < r;', 'TreeNode* l = left.next(), *r = right.next(); l != r;')
            code = code.replace('const int sum = l + r;', 'const int sum = l->val + r->val;')
    return code.strip() + '\n'
