#!/usr/bin/env python3
"""Offline example/boundary checks for every extended-catalog alternative.

Runs bundled teaching snippets in Python, never user code. This does not prove
correctness for all inputs or that a baseline meets the largest input limits.
"""
import ast
import copy
import hashlib
import json
import math
from pathlib import Path
import runpy
import signal

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = runpy.run_path(str(ROOT / 'scripts/extended-approach-fixtures.py'))


def check(pid, approach):
    code = approach['code']['python']
    ast.parse(code)
    assert 'sortedcontainers' not in code, 'third-party Python dependency'
    namespace = {key: FIXTURES[key] for key in ['TreeNode','ListNode']}
    namespace['Node'] = FIXTURES['QuadNode'] if pid == 'construct-quad-tree' else FIXTURES['NaryNode']
    namespace['__code__'] = code
    exec(compile(code,pid + ':' + approach['id'],'exec'),namespace)
    if pid not in FIXTURES['CASES']:
        return FIXTURES['check_special'](pid,namespace)
    method,cases = FIXTURES['CASES'][pid]
    for inputs,expected in cases:
        result = getattr(namespace['Solution'](),method)(*copy.deepcopy(inputs))
        actual = FIXTURES['normalize'](pid,result)
        expected = FIXTURES['normalize'](pid,expected)
        if isinstance(expected,float):
            tolerance = 1e-5 if pid == 'maximum-average-subarray-ii' else 1e-9
            assert math.isclose(actual,expected,rel_tol=tolerance,abs_tol=tolerance), (actual,expected)
        else:
            assert actual == expected, (actual,expected)
    assert cases, 'empty behavioral fixture'
    return len(cases)


def main():
    manifest = json.loads((ROOT / 'scripts/extended-approach-reference-manifest.json').read_text())
    failures = []
    snippets = checks = 0
    def timeout(signum, frame):
        raise TimeoutError('fixture exceeded 10 seconds')
    signal.signal(signal.SIGALRM,timeout)
    for entry in manifest['problems']:
        reference = json.loads((ROOT / 'src/data/problemReferences' / (entry['id'] + '.json')).read_text())
        default = {key:value for key,value in reference.items() if key != 'alternatives'}
        digest = hashlib.sha256(json.dumps(default,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
        assert digest == entry['defaultSha256'], f"Default content changed for {entry['id']}"
        alternatives = reference.get('alternatives',[])
        assert [a['approach'] for a in alternatives] == entry['alternatives'], entry['id']
        for approach in alternatives:
            snippets += 1
            signal.alarm(10)
            try:
                checks += check(entry['id'],approach)
            except Exception as error:
                failures.append((entry['id'],approach['id'],repr(error)))
            finally:
                signal.alarm(0)
    for failure in failures:
        print(*failure,sep=' | ')
    print(f'{len(manifest["problems"])} extended problems; {snippets} added Python snippets; {checks} example/boundary checks passed; {len(failures)} failures.',flush=True)
    assert snippets == sum(len(p['alternatives']) for p in manifest['problems'])
    assert not failures, f'{len(failures)} approaches failed behavioral checks'


if __name__ == '__main__':
    main()
