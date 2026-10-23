"""Small, reviewed judge-interface/correctness adaptations to pinned sources."""

ADAPTATION_NOTES = {
    29: 'Use shifts and subtraction only; widen C++ magnitudes before negation.',
    291: 'Require a mapped substring at the current offset, not anywhere in the suffix.',
    294: 'Preserve both flipped positions and correct the C++ memo-hit comparison.',
    324: 'Use iterative three-way Python quickselect so duplicate pivots do not exhaust recursion.',
    444: 'Require every original value to be observed and safely handle empty subsequences.',
    563: 'Correct the subtree-sum helper return annotation to int.',
    575: 'Use bitset.count() to count represented C++ candy types.',
    592: 'Use standard C++ std::gcd instead of compiler-specific __gcd.',
    625: 'Use the inclusive signed 32-bit upper bound.',
    681: 'Exclude the separator from the Python digit collection.',
    688: 'Normalize Python probabilities at each move, matching the C++ rolling DP.',
    720: 'Exclude the terminal word marker from Python trie-child traversal.',
    747: 'Initialize the largest-value index for the single-zero boundary.',
    790: 'Allocate by requested width and reduce each Python DP state modulo the modulus.',
}


def replace_once(code, old, new):
    assert code.count(old) == 1, ('Pinned source replacement changed', old)
    return code.replace(old, new, 1)


def adapt(number, language, code):
    if number == 29:
        if language == 'python':
            code = replace_once(code, '      k = 1\n      while k * 2 * dvs <= dvd:\n        k <<= 1\n      dvd -= k * dvs',
                                '      k = 1\n      chunk = dvs\n      while chunk << 1 <= dvd:\n        chunk <<= 1\n        k <<= 1\n      dvd -= chunk')
            code = replace_once(code, 'return sign * ans', 'return -ans if sign < 0 else ans')
        else:
            code = replace_once(code, '    long ans = 0;\n    long dvd = labs(dividend);\n    long dvs = labs(divisor);',
                                '    long long ans = 0;\n    long long dvd = dividend;\n    long long dvs = divisor;\n    if (dvd < 0) dvd = -dvd;\n    if (dvs < 0) dvs = -dvs;')
            code = replace_once(code, '      long k = 1;\n      while (k * 2 * dvs <= dvd)\n        k *= 2;\n      dvd -= k * dvs;',
                                '      long long k = 1;\n      long long chunk = dvs;\n      while ((chunk << 1) <= dvd) {\n        chunk <<= 1;\n        k <<= 1;\n      }\n      dvd -= chunk;')
            code = replace_once(code, 'return sign * ans;', 'return sign < 0 ? -ans : ans;')
    elif number == 291:
        code = replace_once(code, 'if t not in s[j:]:', 'if not s.startswith(t, j):') if language == 'python' else replace_once(code, 'if (s.substr(j).find(t) == string::npos)', 'if (s.compare(j, t.length(), t) != 0)')
    elif number == 294:
        if language == 'python':
            code = replace_once(code, "currentState[:i] + '-' + currentState[i + 2:]", "currentState[:i] + '--' + currentState[i + 2:]")
        else:
            code = replace_once(code, 'if (it == mem.cend())', 'if (it != mem.cend())')
            code = replace_once(code, "currentState.substr(0, i) + '-' + currentState.substr(i + 2)", 'currentState.substr(0, i) + "--" + currentState.substr(i + 2)')
        code = code.replace('to "--" (or "-")', 'to "--"')
    elif number == 324 and language == 'python':
        start = code.index('  # Same as 215.')
        code = code[:start] + '''  def _findKthLargest(self, nums: list[int], k: int) -> int:
    target = len(nums) - k
    low, high = 0, len(nums) - 1
    while low <= high:
      pivot = nums[random.randint(low, high)]
      left, scan, right = low, low, high
      while scan <= right:
        if nums[scan] < pivot:
          nums[left], nums[scan] = nums[scan], nums[left]
          left += 1
          scan += 1
        elif nums[scan] > pivot:
          nums[scan], nums[right] = nums[right], nums[scan]
          right -= 1
        else:
          scan += 1
      if target < left:
        high = left - 1
      elif target > right:
        low = right + 1
      else:
        return pivot
    raise ValueError('k outside the input range')
'''
    elif number == 444:
        if language == 'python':
            code = replace_once(code, '    n = len(org)', '    if set(org) != {value for sequence in seqs for value in sequence}:\n      return False\n\n    n = len(org)')
            code = replace_once(code, '      if len(seq) == 1 and seq[0] < 1 or seq[0] > n:\n        return False\n', '')
        else:
            code = replace_once(code, '    const int n = org.size();', '    const int n = org.size();\n    unordered_set<int> observed;\n    for (const auto& seq : seqs)\n      for (int value : seq) {\n        if (value < 1 || value > n) return false;\n        observed.insert(value);\n      }\n    if (observed.size() != org.size()) return false;')
            code = replace_once(code, '      if (seq.size() == 1 && seq[0] < 1 || seq[0] > n)\n        return false;\n', '')
    elif number == 563 and language == 'python':
        code = replace_once(code, 'def summ(root: TreeNode | None) -> None:', 'def summ(root: TreeNode | None) -> int:')
    elif number == 575 and language == 'cpp':
        code = replace_once(code, 'bitset.contains()', 'bitset.count()')
    elif number == 592 and language == 'cpp':
        code = replace_once(code, '__gcd(A, B)', 'std::gcd(A, B)')
    elif number == 625 and language == 'python':
        code = replace_once(code, 'ans < 2**31 - 1', 'ans <= 2**31 - 1')
    elif number == 681 and language == 'python':
        code = replace_once(code, 'digits = sorted(ans)', "digits = sorted(time.replace(':', ''))")
    elif number == 688 and language == 'python':
        code = replace_once(code, 'newDp[i][j] += dp[x][y]', 'newDp[i][j] += dp[x][y] / 8')
        code = replace_once(code, 'return sum(map(sum, dp)) / 8**k', 'return sum(map(sum, dp))')
    elif number == 720 and language == 'python':
        code = replace_once(code, "if 'word' in node[child] and len(node[child]['word']) > 0:", "if child != 'word' and 'word' in node[child]:")
    elif number == 747:
        code = replace_once(code, '    mx = 0', '    ans = 0\n    mx = 0') if language == 'python' else replace_once(code, '    int ans;', '    int ans = 0;')
    elif number == 790:
        if language == 'python':
            code = replace_once(code, 'dp = [0, 1, 2, 5] + [0] * 997', 'dp = [0, 1, 2, 5] + [0] * max(0, n - 3)')
            code = replace_once(code, 'dp[i] = 2 * dp[i - 1] + dp[i - 3]', 'dp[i] = (2 * dp[i - 1] + dp[i - 3]) % MOD')
        else:
            code = replace_once(code, 'vector<long> dp(1001);', 'vector<long> dp(max(4, n + 1));')
    return code
