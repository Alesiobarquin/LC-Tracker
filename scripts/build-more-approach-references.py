#!/usr/bin/env python3
"""Build the further reviewed alternatives, preserving complete defaults.

Usage: python3 scripts/build-more-approach-references.py /path/to/walkccc/LeetCode
The source directory is an extracted archive of the pinned walkccc revision.
All source and default hashes are validated before any files are written.
No network or user data is used.
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
CONTENT = runpy.run_path(str(ROOT / 'scripts/more-approach-reference-content.py'))['CONTENT']
IMPORTS = runpy.run_path(str(ROOT / 'scripts/build-problem-references.py'))['python_imports']


def default_digest(reference):
    default = {key: value for key, value in reference.items() if key != 'alternatives'}
    return hashlib.sha256(json.dumps(default, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, help='Pinned walkccc checkout or extracted archive')
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'scripts/more-approach-reference-manifest.json').read_text())
    assert len({entry['id'] for entry in manifest['problems']}) == len(manifest['problems'])
    assert set(CONTENT) == {entry['id'] for entry in manifest['problems']}
    license_data = (args.source / 'LICENSE').read_bytes()
    assert hashlib.sha256(license_data).hexdigest() == manifest['sourceLicenseSha256'], 'Source license changed'
    assert license_data == (ROOT / 'public/walkccc-license.txt').read_bytes(), 'Bundled license differs'
    pending = []
    for entry in manifest['problems']:
        path = ROOT / 'src/data/problemReferences' / (entry['id'] + '.json')
        reference = json.loads(path.read_text())
        assert reference['approach'] == entry['default'], f"Default approach changed: {entry['id']}"
        assert default_digest(reference) == entry['defaultSha256'], f"Default content changed: {entry['id']}"
        assert [item['approach'] for item in CONTENT[entry['id']]] == [a['approach'] for a in entry['alternatives']]
        alternatives = []
        for item, source in zip(CONTENT[entry['id']], entry['alternatives']):
            steps = '\n'.join(f'{i}. {step}' for i, step in enumerate(item['steps'], 1))
            explanation = f'### How it works\n\n{item["insight"]}\n\n### Steps\n\n{steps}\n\n### Complexity\n\n- Time: {item["time"]}\n- Space: {item["space"]}'
            if item['baseline']:
                explanation = 'This teaching baseline is for small examples; its time, memory, recursion depth, or API-call count can exceed the full problem limits.\n\n' + explanation
            if item['pitfalls']:
                explanation += '\n\n### Things to watch for\n\n' + '\n'.join('- ' + pitfall for pitfall in item['pitfalls'])
            approach = dict(id=re.sub(r'[^a-z0-9]+', '-', item['approach'].lower()).strip('-'),
                            approach=item['approach'], explanation=explanation,
                            explanationAuthor='LC Tracker')
            if source['kind'] == 'walkccc':
                raw = (args.source / source['path']).read_bytes()
                assert hashlib.sha256(raw).hexdigest() == source['sha256'], f"Source changed: {source['path']}"
                code = raw.decode()
                approach.update(sourceUrl=f'https://github.com/walkccc/LeetCode/blob/{manifest["sourceRevision"]}/' + quote(source['path'], safe='/'),
                                sourceName='walkccc / Peng-Yu Chen', licenseUrl='/walkccc-license.txt')
            else:
                assert source['kind'] == 'authored' and 'python' in item
                code = item['python']
                approach.update(codeAuthor='LC Tracker', sourceUrl=reference['sourceUrl'],
                                sourceName=reference.get('sourceName', 'NeetCode’s source'),
                                licenseUrl=reference.get('licenseUrl', '/neetcode-license.txt'))
            code = IMPORTS(code)
            ast.parse(code)
            assert 'sortedcontainers' not in code
            approach['code'] = {'python': code}
            alternatives.append(approach)
        assert 1 <= len(alternatives) <= 2
        assert len({a['id'] for a in alternatives}) == len(alternatives)
        assert len({reference['code']['python'].strip(), *(a['code']['python'].strip() for a in alternatives)}) == len(alternatives) + 1
        reference['alternatives'] = alternatives
        pending.append((path, reference))
    for path, reference in pending:
        path.write_text(json.dumps(reference, ensure_ascii=False, indent=2) + '\n')
    print(f'Added {sum(len(r["alternatives"]) for _, r in pending)} further alternatives across {len(pending)} problems; defaults preserved.')


if __name__ == '__main__':
    main()
