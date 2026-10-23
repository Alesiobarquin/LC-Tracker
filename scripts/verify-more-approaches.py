#!/usr/bin/env python3
"""Execute independent finite checks for every further teaching alternative."""
import ast
import copy
import hashlib
import json
import math
from pathlib import Path
import runpy
import signal

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = runpy.run_path(str(ROOT / 'scripts/more-approach-fixtures.py'))


def check(pid, approach):
    code = approach['code']['python']
    ast.parse(code)
    assert 'sortedcontainers' not in code and 'eval(' not in code
    namespace = {key:FIXTURES[key] for key in ['TreeNode','ListNode']}
    namespace['Node'] = FIXTURES['NaryNode']
    exec(compile(code,pid + ':' + approach['id'],'exec'),namespace)
    if pid not in FIXTURES['CASES']:
        return FIXTURES['check_special'](pid,namespace)
    method,cases = FIXTURES['CASES'][pid]
    for inputs,expected in cases:
        actual = getattr(namespace['Solution'](),method)(*copy.deepcopy(inputs))
        actual = FIXTURES['normalize'](pid,actual)
        expected = FIXTURES['normalize'](pid,expected)
        if isinstance(expected,float):
            assert math.isclose(actual,expected,rel_tol=1e-9,abs_tol=1e-9), (actual,expected)
        else:
            assert actual == expected, (actual,expected)
    assert cases, 'empty behavioral fixture'
    return len(cases)


def main():
    manifest = json.loads((ROOT / 'scripts/more-approach-reference-manifest.json').read_text())
    failures, snippets, checks = [],0,0
    def timeout(signum,frame):
        raise TimeoutError('fixture exceeded 10 seconds')
    signal.signal(signal.SIGALRM,timeout)
    for entry in manifest['problems']:
        reference = json.loads((ROOT / 'src/data/problemReferences' / (entry['id'] + '.json')).read_text())
        default = {key:value for key,value in reference.items() if key != 'alternatives'}
        digest = hashlib.sha256(json.dumps(default,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
        assert digest == entry['defaultSha256'], f"Default changed: {entry['id']}"
        alternatives = reference.get('alternatives',[])
        assert [a['approach'] for a in alternatives] == [a['approach'] for a in entry['alternatives']]
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
    print(f'{len(manifest["problems"])} further problems; {snippets} Python alternatives; {checks} example/boundary checks passed; {len(failures)} failures.',flush=True)
    assert snippets == sum(len(entry['alternatives']) for entry in manifest['problems'])
    assert not failures, f'{len(failures)} alternatives failed behavioral checks'


if __name__ == '__main__':
    main()
