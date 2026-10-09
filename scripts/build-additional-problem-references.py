#!/usr/bin/env python3
"""Rebuild the reviewed medium/easy references from pinned, hashed source files.
Usage: python3 scripts/build-additional-problem-references.py --cache-dir /private/tmp/walkccc-source
Use --offline to require cached files. Never reads or writes user data.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import runpy
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cache-dir', type=Path, required=True)
    parser.add_argument('--offline', action='store_true')
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'scripts/additional-reference-manifest.json').read_text())
    revision = manifest['revision']
    references = manifest['references']
    imports = runpy.run_path(str(ROOT / 'scripts/build-problem-references.py'))['python_imports']
    adapt = runpy.run_path(str(ROOT / 'scripts/reference-code-adaptations.py'))['adapt']
    catalog = {p['id']: p for p in json.loads((ROOT / 'src/data/leetcodeExtendedCatalog.json').read_text())}
    videos = json.loads((ROOT / 'src/data/problemVideos.json').read_text())

    def source_file(job):
        record, language = job
        path = record[language + 'Path']
        if path is None:
            return record['number'], language, ''
        local = args.cache_dir / path
        if not local.exists():
            if args.offline:
                raise FileNotFoundError(local)
            url = f'https://raw.githubusercontent.com/walkccc/LeetCode/{revision}/' + urllib.parse.quote(path, safe='/')
            with urllib.request.urlopen(url, timeout=30) as response:
                data = response.read()
            if hashlib.sha256(data).hexdigest() != record[language + 'Sha256']:
                raise ValueError(f'Source digest mismatch: {path}')
            local.parent.mkdir(parents=True, exist_ok=True)
            local.write_bytes(data)
        data = local.read_bytes()
        if hashlib.sha256(data).hexdigest() != record[language + 'Sha256']:
            raise ValueError(f'Source digest mismatch: {path}')
        return record['number'], language, data.decode()

    license_path = args.cache_dir / 'LICENSE'
    if not license_path.exists():
        if args.offline:
            raise FileNotFoundError(license_path)
        with urllib.request.urlopen(f'https://raw.githubusercontent.com/walkccc/LeetCode/{revision}/LICENSE', timeout=30) as response:
            license_data = response.read()
        if hashlib.sha256(license_data).hexdigest() != manifest['licenseSha256']:
            raise ValueError('License digest mismatch')
        license_path.parent.mkdir(parents=True, exist_ok=True)
        license_path.write_bytes(license_data)
    license_data = license_path.read_bytes()
    if hashlib.sha256(license_data).hexdigest() != manifest['licenseSha256']:
        raise ValueError('License digest mismatch')

    # Read/download independent immutable source files before writing any records.
    with ThreadPoolExecutor(max_workers=8) as pool:
        sources = {(number, language): code for number, language, code in pool.map(
            source_file, [(r, lang) for r in references for lang in ['python', 'cpp']])}
    output = ROOT / 'src/data/problemReferences'
    built = []
    for r in references:
        problem = catalog[r['id']]
        if problem['difficulty'] != r['difficulty']:
            raise ValueError(f'Catalog difficulty changed: {r["id"]}')
        steps = '\n'.join(f'{i}. {step}' for i, step in enumerate(r['steps'], 1))
        pitfalls = '\n'.join('- ' + item for item in r['pitfalls'])
        explanation = f'### How it works\n\n{r["insight"]}\n\n### Steps\n\n{steps}\n\n### Complexity\n\n- Time: {r["time"]}\n- Space: {r["space"]}\n\n### Things to watch for\n\n{pitfalls}'
        code = {lang: adapt(r['number'], lang, sources[r['number'], lang]) for lang in ['python', 'cpp']}
        code['python'] = imports(code['python'])
        path = str(Path(r['cppPath']).parent)
        record = dict(problemId=r['id'], approach=r['approach'], explanation=explanation,
                      code=code, videoUrl=videos.get(r['id'], ''),
                      sourceUrl=f'https://github.com/walkccc/LeetCode/tree/{revision}/' + urllib.parse.quote(path, safe='/'),
                      sourceName='walkccc / Peng-Yu Chen', licenseUrl='/walkccc-license.txt', explanationAuthor='LC Tracker')
        existing = output / (r['id'] + '.json')
        if existing.exists() and 'walkccc/LeetCode' not in json.loads(existing.read_text())['sourceUrl']:
            raise ValueError(f'Refusing to replace another source: {r["id"]}')
        built.append((existing, json.dumps(record, ensure_ascii=False, indent=2) + '\n'))
    (ROOT / 'public/walkccc-license.txt').write_bytes(license_data)
    for path, content in built:
        path.write_text(content)
    print(f'Built {len(built)} additional references: ' + ', '.join(f'{sum(r["difficulty"] == d for r in references)} {d}' for d in ['Medium', 'Easy']))


if __name__ == '__main__':
    main()
