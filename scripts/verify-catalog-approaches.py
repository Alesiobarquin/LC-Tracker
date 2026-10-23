#!/usr/bin/env python3
"""Execute both Python approaches for every new catalog reference.

--cpp also syntax-checks all new C++ examples and runs selected native boundary
programs. Finite content checks only; no network, user data, or automatic grading.
"""
import argparse
import ast
import copy
from concurrent.futures import ThreadPoolExecutor
import json
import math
from pathlib import Path
import runpy
import signal
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = runpy.run_path(str(ROOT / 'scripts/catalog-approach-fixtures.py'))
COMMON = FIXTURES['COMMON']

CPP_CASES = {
29: 'Solution s; assert(s.divide(INT_MIN,-1)==INT_MAX); assert(s.divide(INT_MIN,1)==INT_MIN); assert(s.divide(7,-3)==-2); assert(s.divide(0,3)==0);',
170: 'TwoSum s; s.add(1); s.add(3); assert(s.find(4)); assert(!s.find(2)); s.add(1); assert(s.find(2));',
288: 'vector<string> words{"deer","door","daar"}; ValidWordAbbr s(words); assert(!s.isUnique("deer")); assert(s.isUnique("cart"));',
291: 'Solution s; assert(!s.wordPatternMatch("aaaa","aaba")); assert(s.wordPatternMatch("abab","redblueredblue")); assert(!s.wordPatternMatch("ab","aa"));',
294: 'Solution s; assert(s.canWin("++++")); assert(!s.canWin("+++++")); assert(!s.canWin("++--++"));',
306: 'Solution s; assert(s.isAdditiveNumber("112358")); assert(s.isAdditiveNumber("199100199")); assert(!s.isAdditiveNumber("1023")); assert(s.isAdditiveNumber("000"));',
324: 'Solution s; vector<int> a(1200,1); fill(a.begin()+600,a.end(),2); s.wiggleSort(a); for(int i=1;i<a.size();++i) assert(i%2 ? a[i]>a[i-1] : a[i]<a[i-1]); assert(count(a.begin(),a.end(),1)==600);',
444: 'Solution s; vector<int> a{1,2,3}; vector<vector<int>> b{{1,2},{1,3}}; assert(!s.sequenceReconstruction(a,b)); b.push_back({2,3}); assert(s.sequenceReconstruction(a,b)); vector<int> c{1}; vector<vector<int>> d{{}}; assert(!s.sequenceReconstruction(c,d)); d.push_back({1}); assert(s.sequenceReconstruction(c,d));',
563: 'Solution s; TreeNode a(1),b(2),c(3); a.left=&b; a.right=&c; assert(s.findTilt(&a)==1); assert(s.findTilt(nullptr)==0);',
625: 'Solution s; assert(s.smallestFactorization(48)==68); assert(s.smallestFactorization(19)==0); assert(s.smallestFactorization(1<<30)==0);',
634: 'Solution s; assert(s.findDerangement(1)==0); assert(s.findDerangement(4)==9); assert(s.findDerangement(10)==1334961);',
650: 'Solution s; assert(s.minSteps(1)==0); assert(s.minSteps(18)==8); assert(s.minSteps(1000)==21);',
681: 'Solution s; assert(s.nextClosestTime("23:59")=="22:22"); assert(s.nextClosestTime("11:11")=="11:11");',
688: 'Solution s; assert(abs(s.knightProbability(3,2,0,0)-0.0625)<1e-12); assert(s.knightProbability(1,1,0,0)==0.0);',
720: 'Solution s; vector<string> a{"w","wo","wor","word"}; assert(s.longestWord(a)=="word"); vector<string> b{"a","ap","app","appl","apply","apple"}; Solution other; assert(other.longestWord(b)=="apple");',
747: 'Solution s; vector<int> a{0}; assert(s.dominantIndex(a)==0); vector<int> b{3,6,1,0}; assert(s.dominantIndex(b)==1);',
790: 'Solution s; assert(s.numTilings(1)==1); assert(s.numTilings(4)==11); assert(s.numTilings(30)==312342182);',
}


def check(number, approach):
    code = approach['code']['python']
    ast.parse(code)
    assert 'sortedcontainers' not in code and 'eval(' not in code
    namespace = {name: FIXTURES[name] for name in ['TreeNode','ListNode','Node','NestedInteger','Employee','ArrayReader']}
    exec(compile(code, str(number) + ':' + approach['approach'], 'exec'), namespace)
    if number not in FIXTURES['CASES']:
        checks = FIXTURES['check_special'](number, namespace)
    else:
        method, cases = FIXTURES['CASES'][number]
        assert cases
        for inputs, expected in cases:
            actual = getattr(namespace['Solution'](), method)(*copy.deepcopy(inputs))
            actual = FIXTURES['normalize'](number, actual)
            expected = FIXTURES['normalize'](number, expected)
            if isinstance(expected, float):
                assert math.isclose(actual, expected, rel_tol=1e-9, abs_tol=1e-12), (actual, expected)
            else:
                assert actual == expected, (actual, expected)
        checks = len(cases)
    return checks + FIXTURES['check_exhaustive_small'](number, namespace)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cpp', action='store_true')
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'scripts/catalog-approach-reference-manifest.json').read_text())
    records, failures, checks, snippets = {}, [], 0, 0
    def timeout(signum, frame):
        raise TimeoutError('fixture exceeded 30 seconds')
    signal.signal(signal.SIGALRM, timeout)
    for entry in manifest['problems']:
        reference = json.loads((ROOT / 'src/data/problemReferences' / (entry['id'] + '.json')).read_text())
        records[entry['number']] = reference
        assert reference['approach'] == entry['default']
        assert [a['approach'] for a in reference['alternatives']] == [entry['alternative']['approach']]
        for approach in [reference, *reference['alternatives']]:
            snippets += 1
            signal.alarm(30)
            try:
                checks += check(entry['number'], approach)
            except Exception as error:
                failures.append((entry['id'], approach['approach'], repr(error)))
            finally:
                signal.alarm(0)
    for failure in failures:
        print(*failure, sep=' | ')
    print(f'{len(records)} new catalog problems; {snippets} Python examples; {checks} example/boundary/small-search checks passed; {len(failures)} failures.', flush=True)
    assert not failures, f'{len(failures)} catalog approaches failed behavioral checks'
    if args.cpp:
        def syntax_check(reference):
            code = COMMON['cpp_headers'](reference['code']['cpp']) + reference['code']['cpp']
            result = subprocess.run(['c++','-std=c++20','-fsyntax-only','-x','c++','-'], input=code, text=True, capture_output=True, timeout=60)
            return reference['problemId'], result.returncode, result.stderr
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(syntax_check, records.values()))
        failures = [(pid, errors) for pid, status, errors in results if status]
        for failure in failures:
            print(*failure, sep=' | ')
        assert not failures, f'{len(failures)} new C++ snippets failed syntax checks'
        print(f'{len(records)} new C++ snippets passed syntax validation.', flush=True)
        with tempfile.TemporaryDirectory() as folder:
            for number, body in CPP_CASES.items():
                reference = records[number]
                code = COMMON['cpp_headers'](reference['code']['cpp']) + '\n#include <cassert>\n' + reference['code']['cpp'] + '\nint main() { ' + body + ' }\n'
                binary = Path(folder) / str(number)
                result = subprocess.run(['c++','-std=c++20','-x','c++','-','-o',str(binary)], input=code, text=True, capture_output=True, timeout=60)
                assert result.returncode == 0, (number, result.stderr)
                subprocess.run([str(binary)], check=True, timeout=10)
        print(f'{len(CPP_CASES)} C++ boundary programs compiled and passed.', flush=True)


if __name__ == '__main__':
    main()
