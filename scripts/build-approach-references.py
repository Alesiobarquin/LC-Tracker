#!/usr/bin/env python3
"""Add reviewed Python approaches from a manifest, keeping existing defaults.

Sources are local articles from the revision in approach-reference-manifest.json.
Article hashes and recorded defaults are checked before any writes. No network
or user data is used. The core manifest remains the default; --manifest selects
the separately reviewed extended-catalog batch.
"""
import argparse
import ast
import hashlib
import json
from pathlib import Path
import re
import runpy

ROOT = Path(__file__).resolve().parents[1]
IMPORTER = runpy.run_path(str(ROOT / 'scripts/build-problem-references.py'))
NOTES = runpy.run_path(str(ROOT / 'scripts/approach-reference-notes.py'))
EXTENDED_NOTES = runpy.run_path(str(ROOT / 'scripts/extended-approach-reference-notes.py'))


def sections(article):
    article = re.sub(r'^### \*\*(.*?)\*\*', r'### \1', article, flags=re.M)
    return {
        re.sub(r'^\d+\.\s*', '', section.splitlines()[0]): section
        for section in re.split(r'^## (?=\d+\.)', article, flags=re.M)[1:]
    }


def section_text(section, heading):
    match = re.search(heading + r'[^\n]*\n(.*?)(?=^### |^## |\Z)', section, re.S | re.M)
    if not match:
        raise ValueError(f'Missing {heading}')
    # Code fences inside an algorithm can be explanatory pseudocode. Keep it
    # and the following steps; stop at the source's implementation tabs instead.
    text = match.group(1).split('::tabs-start')[0]
    blocks = []
    def preserve(match):
        blocks.append(match.group(0))
        return f'LCREFERENCECODEBLOCK{len(blocks) - 1}END'
    text = re.sub(r'```[^\n]*\n.*?```', preserve, text, flags=re.S)
    text = IMPORTER['clean'](text).rstrip('- ').strip()
    for index, block in enumerate(blocks):
        text = text.replace(f'LCREFERENCECODEBLOCK{index}END', block)
    return text


def make_approach(problem_id, name, article, source_url):
    authored = NOTES['AUTHORED'].get(problem_id, {}).get(name)
    if authored:
        return {**authored, 'approach': name, 'sourceUrl': source_url,
                'explanationAuthor': 'LC Tracker', 'codeAuthor': 'LC Tracker'}
    section = sections(article)[name]
    code = re.search(r'```python\s*\n(.*?)```', section, re.S).group(1).strip()
    if 'sortedcontainers' in code:
        raise ValueError(f'Third-party dependency in {problem_id}: {name}')
    if problem_id in IMPORTER['METHODS']:
        before, after = IMPORTER['METHODS'][problem_id]
        code = code.replace(before, after)
    # NeetCode uses PrefixTree; LeetCode instantiates Trie.
    if problem_id == 'implement-trie-prefix-tree':
        code = re.sub(r'\bPrefixTree\b', 'Trie', code)
    if problem_id in ['meeting-rooms', 'meeting-rooms-ii']:
        code = code.replace('List[Interval]', 'List[List[int]]')
        code = re.sub(r'\.(start|end)\b', lambda m: '[0]' if m[1] == 'start' else '[1]', code)
        code = re.sub(r'\"\"\".*?\"\"\"\s*', '', code, flags=re.S)
    code = NOTES['adapt_code'](problem_id, name, code)
    notes = NOTES['EXPLANATIONS'].get((problem_id, name))
    if notes:
        explanation = notes
    else:
        intuition = section_text(section, r'### Intuition')
        algorithm = section_text(section, r'### Algorithm')
        complexity = section_text(section, r'### Time (?:&|and) Space Complexity')
        explanation = f'### How it works\n\n{intuition}\n\n### Steps\n\n{algorithm}\n\n### Complexity\n\n{complexity}'
    if problem_id == 'walls-and-gates':
        explanation = explanation.replace('treasures', 'gates').replace('treasure', 'gate')
    if problem_id in ['meeting-rooms', 'meeting-rooms-ii']:
        explanation = explanation.replace('.start', '[0]').replace('.end', '[1]')
    explanation = re.sub(
        r'`O\(1\)` or `O\(([^`]+)\)` (?:space )?depending on (?:the )?sorting algorithm\.',
        r'`O(\1)` worst-case auxiliary space for Python\'s sort.', explanation)
    if 'Brute Force' in name or (name == 'Recursion' and 'Dynamic Programming' in article):
        explanation = 'This baseline is useful for understanding the problem on small inputs; it can exceed the time or recursion limits on large inputs.\n\n' + explanation
    key = (problem_id, name)
    complexity = EXTENDED_NOTES['COMPLEXITY'].get(key)
    if complexity:
        explanation = re.sub(r'### Complexity\n.*?(?=\n\n### |\Z)', '### Complexity\n\n' + complexity, explanation, flags=re.S)
    for before, after in EXTENDED_NOTES['REPLACEMENTS'].get(key, []):
        explanation = explanation.replace(before, after)
    if key in EXTENDED_NOTES['PREAMBLES']:
        explanation = EXTENDED_NOTES['PREAMBLES'][key] + '\n\n' + explanation
    result = {'approach': name, 'explanation': explanation,
              'code': {'python': IMPORTER['python_imports'](code)}, 'sourceUrl': source_url}
    if notes or complexity or key in EXTENDED_NOTES['REPLACEMENTS'] or key in EXTENDED_NOTES['PREAMBLES']:
        result['explanationAuthor'] = 'LC Tracker'
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, help='Local pinned NeetCode checkout or extracted archive')
    parser.add_argument('--batch', choices=['foundations', 'structures', 'graphs', 'dynamic', 'remaining'])
    parser.add_argument('--manifest', type=Path, default=ROOT / 'scripts/approach-reference-manifest.json')
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text())
    if manifest['revision'] != IMPORTER['REVISION']:
        raise ValueError('The default and alternate importers must use the same reviewed revision')
    pending = []
    for entry in manifest['problems']:
        if args.batch and entry['batch'] != args.batch:
            continue
        raw = (args.source / entry['article']).read_bytes()
        if hashlib.sha256(raw).hexdigest() != entry['sha256']:
            raise ValueError(f"Source hash mismatch: {entry['article']}")
        path = ROOT / 'src/data/problemReferences' / (entry['id'] + '.json')
        reference = json.loads(path.read_text())
        if reference['approach'] != entry['default']:
            raise ValueError(f"Default changed for {entry['id']}; review the manifest first")
        default = {key: value for key, value in reference.items() if key != 'alternatives'}
        digest = hashlib.sha256(json.dumps(default, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        if entry.get('defaultSha256', digest) != digest:
            raise ValueError(f"Default content changed for {entry['id']}; review the manifest first")
        alternatives = []
        for name in entry['alternatives']:
            approach = make_approach(entry['id'], name, raw.decode(), reference['sourceUrl'])
            approach['id'] = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
            ast.parse(approach['code']['python'])
            alternatives.append(approach)
        if not 1 <= len(alternatives) <= 2:
            raise ValueError(f"Expected one or two alternatives for {entry['id']}")
        if len({a['id'] for a in alternatives}) != len(alternatives):
            raise ValueError(f"Duplicate approach IDs for {entry['id']}")
        if len({reference['code']['python'].strip(), *(a['code']['python'].strip() for a in alternatives)}) != len(alternatives) + 1:
            raise ValueError(f"Duplicate code for {entry['id']}")
        reference['alternatives'] = alternatives
        pending.append((path, reference))
    for path, reference in pending:
        path.write_text(json.dumps(reference, ensure_ascii=False, indent=2) + '\n')
    count = sum(len(r['alternatives']) for _, r in pending)
    print(f'Added {count} Python alternatives across {len(pending)} problems; defaults preserved.')


if __name__ == '__main__':
    main()
