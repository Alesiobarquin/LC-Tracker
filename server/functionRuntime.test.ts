import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { expect, it } from 'vitest';

it('loads the compiled LeetCode function in native Node ESM', () => {
  // Bundler-based tests accept extensionless imports that fail on Vercel.
  const directory = mkdtempSync(join(tmpdir(), 'lc-tracker-function-'));
  try {
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ type: 'module' }));
    for (const source of ['api/leetcode-ac.ts', 'server/leetcodeAc.ts']) {
      const target = join(directory, source.replace(/\.ts$/, '.js'));
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, ts.transpileModule(readFileSync(source, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText);
    }
    const entry = pathToFileURL(join(directory, 'api/leetcode-ac.js')).href;
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
      globalThis.fetch = async () => ({ ok: true, json: async () => ({
        data: { recentAcSubmissionList: [{ titleSlug: 'two-sum' }] }
      }) });
      const { default: handler } = await import(${JSON.stringify(entry)});
      const result = { headers: {} };
      const response = {
        setHeader(key, value) { result.headers[key] = value; },
        status(code) { result.status = code; return this; },
        json(body) { result.body = body; }
      };
      await handler({ method: 'GET', query: { username: 'test-user', limit: '1' } }, response);
      process.stdout.write(JSON.stringify(result));
    `], { encoding: 'utf8', timeout: 10_000 });
    const result = JSON.parse(output);
    expect(result.status).toBe(200);
    expect(result.body.submissions).toEqual([{ titleSlug: 'two-sum' }]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
