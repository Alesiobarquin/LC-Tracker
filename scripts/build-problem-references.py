#!/usr/bin/env python3
"""Import one coherent approach per supported catalog problem from a pinned MIT-licensed checkout.
Usage: python3 scripts/build-problem-references.py /path/to/neetcode-gh/leetcode
No network or user data is used. Review content changes before committing a refresh.
"""
import ast
import json
from pathlib import Path
import re
import subprocess
import sys

REVISION = '3186ede2ea4c4788e87be4b509bf2b66d5eba0e9'
ALIASES = dict(line.split('=') for line in '''contains-duplicate=duplicate-integer
valid-anagram=is-anagram
two-sum=two-integer-sum
group-anagrams=anagram-groups
top-k-frequent-elements=top-k-elements-in-list
product-of-array-except-self=products-of-array-discluding-self
encode-and-decode-strings=string-encode-and-decode
valid-palindrome=is-palindrome
two-sum-ii-input-array-is-sorted=two-integer-sum-ii
3sum=three-integer-sum
container-with-most-water=max-water-container
best-time-to-buy-and-sell-stock=buy-and-sell-crypto
longest-substring-without-repeating-characters=longest-substring-without-duplicates
longest-repeating-character-replacement=longest-repeating-substring-with-replacement
permutation-in-string=permutation-string
minimum-window-substring=minimum-window-with-characters
valid-parentheses=validate-parentheses
min-stack=minimum-stack
search-a-2d-matrix=search-2d-matrix
koko-eating-bananas=eating-bananas
search-in-rotated-sorted-array=find-target-in-rotated-sorted-array
reverse-linked-list=reverse-a-linked-list
merge-two-sorted-lists=merge-two-sorted-linked-lists
reorder-list=reorder-linked-list
remove-nth-node-from-end-of-list=remove-node-from-end-of-linked-list
copy-list-with-random-pointer=copy-linked-list-with-random-pointer
linked-list-cycle=linked-list-cycle-detection
find-the-duplicate-number=find-duplicate-integer
merge-k-sorted-lists=merge-k-sorted-linked-lists
invert-binary-tree=invert-a-binary-tree
maximum-depth-of-binary-tree=depth-of-binary-tree
diameter-of-binary-tree=binary-tree-diameter
same-tree=same-binary-tree
subtree-of-another-tree=subtree-of-a-binary-tree
lowest-common-ancestor-of-a-binary-search-tree=lowest-common-ancestor-in-binary-search-tree
binary-tree-level-order-traversal=level-order-traversal-of-binary-tree
validate-binary-search-tree=valid-binary-search-tree
kth-smallest-element-in-a-bst=kth-smallest-integer-in-bst
construct-binary-tree-from-preorder-and-inorder-traversal=binary-tree-from-preorder-and-inorder-traversal
implement-trie-prefix-tree=implement-prefix-tree
design-add-and-search-words-data-structure=design-word-search-data-structure
word-search-ii=search-for-word-ii
kth-largest-element-in-a-stream=kth-largest-integer-in-a-stream
task-scheduler=task-scheduling
design-twitter=design-twitter-feed
find-median-from-data-stream=find-median-in-a-data-stream
combination-sum=combination-target-sum
combination-sum-ii=combination-target-sum-ii
word-search=search-for-word
letter-combinations-of-a-phone-number=combinations-of-a-phone-number
number-of-islands=count-number-of-islands
rotting-oranges=rotting-fruit
walls-and-gates=islands-and-treasure
number-of-connected-components-in-an-undirected-graph=count-connected-components
graph-valid-tree=valid-tree
reconstruct-itinerary=reconstruct-flight-path
min-cost-to-connect-all-points=min-cost-to-connect-points
alien-dictionary=foreign-dictionary
cheapest-flights-within-k-stops=cheapest-flight-path
unique-paths=count-paths
best-time-to-buy-and-sell-stock-with-cooldown=buy-and-sell-crypto-with-cooldown
longest-increasing-path-in-a-matrix=longest-increasing-path-in-matrix
distinct-subsequences=count-subsequences
merge-triplets-to-form-target-triplet=merge-triplets-to-form-target
insert-interval=insert-new-interval
meeting-rooms=meeting-schedule
meeting-rooms-ii=meeting-schedule-ii
minimum-interval-to-include-each-query=minimum-interval-including-query
rotate-image=rotate-matrix
set-matrix-zeroes=set-zeroes-in-matrix
happy-number=non-cyclical-number
powx-n=pow-x-n
detect-squares=count-squares
number-of-1-bits=number-of-one-bits'''.splitlines())
# The articles use NeetCode's problem names; the library links to LeetCode.
METHODS = {
    'contains-duplicate': ('hasDuplicate', 'containsDuplicate'),
    'valid-anagram': ('isAnagram', 'isAnagram'),
    'walls-and-gates': ('islandsAndTreasure', 'wallsAndGates'),
    'alien-dictionary': ('foreignDictionary', 'alienOrder'),
}
IMPORTS = {
    'typing': ['List', 'Optional', 'Tuple', 'Dict', 'Set'],
    'collections': ['Counter', 'defaultdict', 'deque', 'OrderedDict'],
    'heapq': ['heapify', 'heappush', 'heappop', 'heappushpop', 'heapreplace', 'nlargest'],
    'functools': ['cache', 'lru_cache', 'cmp_to_key'],
    'bisect': ['bisect_left', 'bisect_right', 'insort', 'bisect'],
    'math': ['inf', 'ceil', 'sqrt', 'gcd', 'factorial', 'comb'],
    'itertools': ['accumulate', 'product', 'combinations'],
}


def clean(text):
    text = re.sub(r'```[^\n]*\n.*?```', '', text, flags=re.S)
    text = re.sub(r'<a[^>]*>(.*?)</a>', r'\1', text, flags=re.S)
    text = re.sub(r'</?[A-Za-z][^>\n]*>|::tabs-(?:start|end)', '', text)
    # Render math notation as readable inline code, without needing a math engine.
    text = re.sub(r'\$([^$]+)\$', lambda m: '`' + m[1].replace(r'\cdot', ' × ').replace(r'\times', ' × ').replace(r'\log', 'log').replace(r'\sum', 'sum').replace(r'\min', 'min').replace(r'\max', 'max').replace(chr(92), '').strip() + '`', text)
    return re.sub(r'\n{3,}', '\n\n', text).strip()


def python_imports(code):
    tree = ast.parse(code)
    names = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name)}
    existing = {n.name for n in ast.walk(tree) if isinstance(n, ast.alias)}
    lines = []
    for module, options in IMPORTS.items():
        used = [name for name in options if name in names and name not in existing]
        if used:
            lines.append(f'from {module} import {", ".join(used)}')
    for module in ['collections', 'heapq', 'math', 'bisect', 'functools', 'itertools', 'random']:
        if module in names and module not in existing:
            lines.append(f'import {module}')
    return '\n'.join(lines) + ('\n\n' if lines else '') + code.strip() + '\n'


def main():
    source = Path(sys.argv[1]).resolve()
    actual = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    if actual != REVISION:
        raise ValueError(f'Expected reviewed revision {REVISION}, got {actual}')
    root = Path(__file__).resolve().parents[1]
    core_ids = re.findall(r"\{ id: '([^']+)'", (root / 'src/data/problems.ts').read_text())
    catalog = json.loads((root / 'src/data/leetcodeExtendedCatalog.json').read_text())
    ids = core_ids + [p['id'] for p in catalog if (source / 'articles' / f"{p['id']}.md").exists()]
    metadata = {r['link'].strip('/'): r for r in json.loads((source / '.problemSiteData.json').read_text())}
    output = root / 'src/data/problemReferences'
    output.mkdir(exist_ok=True)
    videos = {}
    diagnostics = []
    skipped = []
    for problem_id in ids:
        slug = ALIASES.get(problem_id, problem_id)
        article_path = source / 'articles' / f'{slug}.md'
        article = re.sub(r'^### \*\*(.*?)\*\*', r'### \1', article_path.read_text(), flags=re.M)
        sections = re.split(r'^## (?=\d+\.)', article, flags=re.M)[1:]
        candidates = [s for s in sections if re.search(r'```python\s*\n', s) and re.search(r'```cpp\s*\n', s) and '### Intuition' in s and '### Algorithm' in s and re.search(r'### Time (?:&|and) Space Complexity', s) and 'sortedcontainers' not in s]
        if not candidates:
            if problem_id in core_ids:
                raise ValueError(f'No complete approach for {problem_id}')
            skipped.append(problem_id)
            continue
        # Last complete approach is the article's final implementation, not an
        # explanation taken from a different solution or a general pattern.
        preferred = {'data-stream-as-disjoint-intervals': 'Hash Set + Sorting', 'subtree-of-another-tree': 'Depth First Search (DFS)', 'kth-largest-element-in-an-array': 'Min-Heap', 'sort-an-array': 'Merge Sort', 'valid-sudoku': 'Hash Set (One Pass)'}.get(problem_id)
        chosen = next((s for s in candidates if s.splitlines()[0].endswith(preferred)), candidates[-1]) if preferred else candidates[-1]
        approach = re.sub(r'^\d+\.\s*', '', chosen.splitlines()[0])
        intuition = re.search(r'### Intuition[^\n]*\n(.*?)(?=^### |^## |\Z)', chosen, re.S | re.M).group(1)
        algorithm = re.search(r'### Algorithm[^\n]*\n(.*?)(?=^### |```|\Z)', chosen, re.S | re.M).group(1)
        complexity = re.search(r'### Time (?:&|and) Space Complexity[^\n]*\n(.*?)(?=^### |^## |\Z)', chosen, re.S | re.M)
        if not complexity:
            raise ValueError(f'Missing complexity for {problem_id}')
        pitfalls = re.search(r'^## Common Pitfalls\s*\n(.*)', article, re.S | re.M)
        explanation = f'### How it works\n\n{clean(intuition)}\n\n### Steps\n\n{clean(algorithm)}\n\n### Complexity\n\n{clean(complexity.group(1)).rstrip("- ").strip()}'
        if pitfalls:
            explanation += '\n\n### Things to watch for\n\n' + clean(pitfalls.group(1))
        if problem_id in ['meeting-rooms', 'meeting-rooms-ii']:
            explanation = explanation.replace('.start', '[0]').replace('.end', '[1]')
        if problem_id == 'walls-and-gates':
            explanation = explanation.replace('treasures', 'gates').replace('treasure', 'gate').replace('Treasure', 'Gate')
            explanation = explanation.split('### Updating Distance Before Adding to Queue')[0].rstrip()
        if problem_id == 'valid-sudoku':
            explanation = '''### How it works

Scan the board once and keep the digits already seen in each row, column, and 3×3 box. A filled cell is valid only if its digit is absent from all three sets. Check for a duplicate before adding the digit, so a cell never conflicts with itself.

In Python, `collections.defaultdict(set)` creates an empty set when a row, column, or box is first accessed. `rows[r]` tracks row `r`, `cols[c]` tracks column `c`, and `squares[(r // 3, c // 3)]` tracks the box. Integer division groups indices `0–2`, `3–5`, and `6–8` into box coordinates `0`, `1`, and `2`. For example, cells `(3, 6)` and `(5, 8)` share box key `(1, 2)`. The C++ example uses the same sets with the box key `{r / 3, c / 3}`.

### Steps

1. Create the `rows`, `cols`, and `squares` maps of sets.
2. Visit each cell `(r, c)` in the 9×9 board. Skip `"."`, which represents an empty cell.
3. If `board[r][c]` is already in `rows[r]`, `cols[c]`, or `squares[(r // 3, c // 3)]`, return `False`.
4. Otherwise, add the digit to all three sets and continue.
5. Return `True` after scanning the entire board without a duplicate.

### Complexity

For this fixed 9×9 board, time and auxiliary space are `O(1)`: visit at most 81 cells and store each filled digit in three sets. If generalized to an `n×n` board, expected time and auxiliary space are `O(n²)` with constant-time hash-set operations. The C++ box map has at most nine keys here; a generalized ordered map would add a logarithmic lookup factor.

### Things to watch for

- Skip empty cells before checking or inserting; multiple `"."` cells are allowed.
- Use integer division for both box coordinates. `r // 3 + c // 3` can merge different boxes into the same key.
- Check all three sets before inserting the current digit.
- This validates the filled cells; it does not solve the puzzle or determine whether it can be completed.
- The board is read without modifying it.'''
        codes = {}
        for language in ['python', 'cpp']:
            block = re.search(r'```' + language + r'\s*\n(.*?)```', chosen, re.S)
            if block:
                code = block.group(1).strip()
                if problem_id in METHODS:
                    before, after = METHODS[problem_id]
                    code = code.replace(before, after)
                if problem_id in ['meeting-rooms', 'meeting-rooms-ii']:
                    code = code.replace('List[Interval]', 'List[List[int]]').replace('vector<Interval>', 'vector<vector<int>>')
                    code = re.sub(r'\.start\b', '[0]', code)
                    code = re.sub(r'\.end\b(?!\()', '[1]', code)
                    code = re.sub(r'\"\"\".*?\"\"\"\s*|/\*\*.*?\*/\s*', '', code, flags=re.S)
                if language == 'cpp' and problem_id == 'spiral-matrix':
                    code = code.replace('vector<int> steps = {matrix[0].size(), matrix.size() - 1};', 'vector<int> steps = {static_cast<int>(matrix[0].size()), static_cast<int>(matrix.size()) - 1};')
                if language == 'cpp':
                    code = code.replace('__gcd(', 'std::gcd(')
                    if problem_id == 'diameter-of-n-ary-tree':
                        code = code.replace('int diameter = 0;', 'int bestDiameter = 0;').replace('this->diameter', 'this->bestDiameter').replace('return diameter;', 'return bestDiameter;')
                if problem_id == 'reverse-words-in-a-string-iii' and language == 'python':
                    code = code.replace('                i = j + 1', '                i = j\n            i += 1')
                if problem_id == 'valid-sudoku' and language == 'python':
                    code = code.replace('defaultdict(set)', 'collections.defaultdict(set)')
                    code = code.replace('squares = collections.defaultdict(set)', 'squares = collections.defaultdict(set)  # key = (r // 3, c // 3)')
                    code = code.replace('if ( board[r][c] in rows[r]\n                    or board[r][c] in cols[c]\n                    or board[r][c] in squares[(r // 3, c // 3)]):', 'if (board[r][c] in rows[r] or\n                    board[r][c] in cols[c] or\n                    board[r][c] in squares[(r // 3, c // 3)]):')
                codes[language] = python_imports(code) if language == 'python' else code + '\n'
        video_id = metadata.get(problem_id, {}).get('video', '')
        if re.fullmatch(r'[\w-]{11}', video_id):
            videos[problem_id] = 'https://www.youtube.com/watch?v=' + video_id
        elif problem_id in core_ids:
            raise ValueError(f'Invalid video for {problem_id}')
        record = {
            'problemId': problem_id, 'approach': approach, 'explanation': explanation,
            'code': codes, 'videoUrl': videos.get(problem_id, ''), 'sourceUrl': f'https://github.com/neetcode-gh/leetcode/blob/{REVISION}/articles/{slug}.md',
        }
        (output / f'{problem_id}.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
        diagnostics.append((problem_id, approach, len(explanation), len(codes['python'])))
    # This problem has source code but no article at the pinned revision.
    # Explain the source's split/reverse/join approach and supply a C++ translation.
    problem_id = 'reverse-words-in-a-string'
    record = {
        'problemId': problem_id,
        'approach': 'Split, Reverse, and Join',
        'explanation': '### How it works\n\nSplit the input into words, reverse their order, and join them with one space. Splitting on whitespace removes leading and trailing spaces and collapses repeated spaces. Reverse the list of words, preserving the character order inside each word. The C++ example reads words with a string stream, which performs the same whitespace handling.\n\n### Steps\n\n1. Extract the nonempty words from the input.\n2. Reverse the word list.\n3. Join the words with exactly one space between adjacent words.\n4. Return the resulting string.\n\n### Complexity\n\nFor `n` input characters, time is `O(n)` and auxiliary space is `O(n)` for the words and output. This approach builds a new string.\n\n### Things to watch for\n\n- Split on whitespace rather than a literal single space so repeated spaces do not create empty words.\n- Reverse word order, keeping each word intact. For example, `  hello   world  ` becomes `world hello`.\n- Produce no leading or trailing space.\n\nThe explanation and C++ translation follow the linked NeetCode Python example.',
        'code': {
            'python': python_imports((source / 'python/0151-reverse-words-in-a-string.py').read_text()),
            'cpp': 'class Solution {\npublic:\n    string reverseWords(string s) {\n        istringstream input(s);\n        vector<string> words;\n        string word;\n        while (input >> word) words.push_back(word);\n        reverse(words.begin(), words.end());\n        string result;\n        for (const string& current : words) {\n            if (!result.empty()) result += \" \";\n            result += current;\n        }\n        return result;\n    }\n};\n',
        },
        'videoUrl': '',
        'sourceUrl': f'https://github.com/neetcode-gh/leetcode/blob/{REVISION}/python/0151-reverse-words-in-a-string.py',
    }
    (output / f'{problem_id}.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
    diagnostics.append((problem_id, record['approach'], len(record['explanation']), len(record['code']['python'])))
    (root / 'src/data/problemVideos.json').write_text(json.dumps(videos, indent=2) + '\n')
    (root / 'public/neetcode-license.txt').write_text((source / 'LICENSE').read_text())
    print(f'Imported {len(diagnostics)} references and verified available video mappings from {REVISION}.')
    print('Skipped (no complete dependency-free Python/C++ approach):', skipped)
    print('Missing C++:', [i for i, *_ in diagnostics if 'cpp' not in json.loads((output / f'{i}.json').read_text())['code']])
    Path('/private/tmp/lc-tracker-reference-audit.json').write_text(json.dumps(diagnostics, indent=2))


if __name__ == '__main__':
    main()
