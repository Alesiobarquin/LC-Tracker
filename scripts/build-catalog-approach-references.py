#!/usr/bin/env python3
"""Build complete two-approach catalog references from pinned, hashed sources.

Usage: python3 scripts/build-catalog-approach-references.py /path/to/walkccc
No network or user data is used. Source files and the bundled license are checked
before any output is written. Existing references outside this batch are untouched.
"""
import argparse
import ast
import hashlib
import json
from pathlib import Path
import re
import runpy
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
CONTENT = runpy.run_path(str(ROOT / 'scripts/catalog-approach-reference-content.py'))['CONTENT']
IMPORTS = runpy.run_path(str(ROOT / 'scripts/build-problem-references.py'))['python_imports']
ADAPT = runpy.run_path(str(ROOT / 'scripts/catalog-reference-code-adaptations.py'))['adapt']


def prepare_python(code):
    code = IMPORTS(code)
    tree = ast.parse(code)
    names = {node.id for node in ast.walk(tree) if isinstance(node, ast.Name)}
    imported = {alias.name for node in ast.walk(tree) if isinstance(node, (ast.Import, ast.ImportFrom)) for alias in node.names}
    modules = [name for name in ['re', 'string'] if name in names and name not in imported]
    if modules:
        code = '\n'.join('import ' + name for name in modules) + '\n' + code
    if 'NestedInteger' in names:
        code = 'from __future__ import annotations\n\n' + code
    ast.parse(code)
    assert 'sortedcontainers' not in code and 'eval(' not in code
    return code


def explanation(item):
    steps = '\n'.join(f'{i}. {step}' for i, step in enumerate(item['steps'], 1))
    result = f'### How it works\n\n{item["insight"]}\n\n### Steps\n\n{steps}\n\n### Complexity\n\n- Time: {item["time"]}\n- Space: {item["space"]}'
    if item['baseline']:
        result = 'This teaching baseline is for small examples; its time, memory, recursion depth, or API-call count can exceed the full problem limits.\n\n' + result
    if item['pitfalls']:
        result += '\n\n### Things to watch for\n\n' + '\n'.join('- ' + text for text in item['pitfalls'])
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'scripts/catalog-approach-reference-manifest.json').read_text())
    license_data = (args.source / 'LICENSE').read_bytes()
    assert hashlib.sha256(license_data).hexdigest() == manifest['licenseSha256']
    assert license_data == (ROOT / 'public/walkccc-license.txt').read_bytes()
    assert set(CONTENT) == {entry['number'] for entry in manifest['problems']}
    assert len({entry['id'] for entry in manifest['problems']}) == len(CONTENT)
    catalog = {p['id']: p for p in json.loads((ROOT / 'src/data/leetcodeExtendedCatalog.json').read_text())}
    videos = json.loads((ROOT / 'src/data/problemVideos.json').read_text())
    prior_ids = set()
    for filename in ['approach-reference-manifest.json', 'extended-approach-reference-manifest.json', 'more-approach-reference-manifest.json']:
        prior_ids.update(entry['id'] for entry in json.loads((ROOT / 'scripts' / filename).read_text())['problems'])
    pending = []
    for entry in manifest['problems']:
        assert entry['id'] in catalog and entry['id'] not in prior_ids
        item = CONTENT[entry['number']]
        assert entry['default'] == item['default']['approach']
        assert entry['alternative']['approach'] == item['alternative']['approach']
        sources = {}
        for language in ['python', 'cpp']:
            source = entry['sources'][language]
            raw = (args.source / source['path']).read_bytes()
            assert hashlib.sha256(raw).hexdigest() == source['sha256'], source['path']
            sources[language] = ADAPT(entry['number'], language, raw.decode())
        reference = dict(problemId=entry['id'], approach=entry['default'], explanation=explanation(item['default']),
                         code={'python': prepare_python(sources['python']), 'cpp': sources['cpp'].strip() + '\n'},
                         sourceUrl=f'https://github.com/walkccc/LeetCode/tree/{manifest["revision"]}/' + quote(entry['folder'], safe='/'),
                         sourceName='walkccc / Peng-Yu Chen', licenseUrl='/walkccc-license.txt',
                         explanationAuthor='LC Tracker', videoUrl=videos.get(entry['id'], ''))
        alternative = item['alternative']
        result = dict(id=re.sub(r'[^a-z0-9]+', '-', alternative['approach'].lower()).strip('-'),
                      approach=alternative['approach'], explanation=explanation(alternative), explanationAuthor='LC Tracker',
                      sourceName='walkccc / Peng-Yu Chen', licenseUrl='/walkccc-license.txt')
        source = entry['alternative']
        if source['kind'] == 'walkccc':
            raw = (args.source / source['path']).read_bytes()
            assert hashlib.sha256(raw).hexdigest() == source['sha256'], source['path']
            code = raw.decode()
            result['sourceUrl'] = f'https://github.com/walkccc/LeetCode/blob/{manifest["revision"]}/' + quote(source['path'], safe='/')
        else:
            assert source['kind'] == 'authored'
            code = alternative['python']
            result.update(codeAuthor='LC Tracker', sourceUrl=reference['sourceUrl'])
        result['code'] = {'python': prepare_python(code)}
        assert result['code']['python'].strip() != reference['code']['python'].strip()
        reference['alternatives'] = [result]
        path = ROOT / 'src/data/problemReferences' / (entry['id'] + '.json')
        if path.exists():
            previous = json.loads(path.read_text())
            assert previous['sourceUrl'] == reference['sourceUrl'], f'Refusing to overwrite a prior reference: {entry["id"]}'
        pending.append((path, reference))
    for path, reference in pending:
        path.write_text(json.dumps(reference, ensure_ascii=False, indent=2) + '\n')
    print(f'Built {len(pending)} new catalog references with two approaches each ({len(pending) * 2} Python and {len(pending)} C++ examples).')


if __name__ == '__main__':
    main()
