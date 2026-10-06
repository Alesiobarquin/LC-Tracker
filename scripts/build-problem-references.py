#!/usr/bin/env python3
"""Import one coherent approach per core problem from a pinned MIT-licensed checkout.
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
    ids = re.findall(r"\{ id: '([^']+)'", (root / 'src/data/problems.ts').read_text())
    metadata = {r['link'].strip('/'): r for r in json.loads((source / '.problemSiteData.json').read_text())}
    output = root / 'src/data/problemReferences'
    output.mkdir(exist_ok=True)
    videos = {}
    diagnostics = []
    for problem_id in ids:
        slug = ALIASES.get(problem_id, problem_id)
        article_path = source / 'articles' / f'{slug}.md'
        article = re.sub(r'^### \*\*(.*?)\*\*', r'### \1', article_path.read_text(), flags=re.M)
        sections = re.split(r'^## (?=\d+\.)', article, flags=re.M)[1:]
        candidates = [s for s in sections if re.search(r'```python\s*\n', s) and '### Intuition' in s and '### Algorithm' in s]
        if not candidates:
            raise ValueError(f'No complete approach for {problem_id}')
        # Last complete approach is the article's final implementation, not an
        # explanation taken from a different solution or a general pattern.
        preferred = {'data-stream-as-disjoint-intervals': 'Hash Set + Sorting', 'subtree-of-another-tree': 'Depth First Search (DFS)', 'kth-largest-element-in-an-array': 'Min-Heap'}.get(problem_id)
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
                codes[language] = python_imports(code) if language == 'python' else code + '\n'
        if not re.fullmatch(r'[\w-]{11}', metadata[problem_id]['video']):
            raise ValueError(f'Invalid video for {problem_id}')
        videos[problem_id] = 'https://www.youtube.com/watch?v=' + metadata[problem_id]['video']
        record = {
            'problemId': problem_id, 'approach': approach, 'explanation': explanation,
            'code': codes, 'videoUrl': videos[problem_id], 'sourceUrl': f'https://github.com/neetcode-gh/leetcode/blob/{REVISION}/articles/{slug}.md',
        }
        (output / f'{problem_id}.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
        diagnostics.append((problem_id, approach, len(explanation), len(codes['python'])))
    (root / 'src/data/problemVideos.json').write_text(json.dumps(videos, indent=2) + '\n')
    (root / 'public/neetcode-license.txt').write_text((source / 'LICENSE').read_text())
    print(f'Imported {len(ids)} references and verified video mappings from {REVISION}.')
    print('Missing C++:', [i for i in ids if 'cpp' not in json.loads((output / f'{i}.json').read_text())['code']])
    Path('/private/tmp/lc-tracker-reference-audit.json').write_text(json.dumps(diagnostics, indent=2))


if __name__ == '__main__':
    main()
