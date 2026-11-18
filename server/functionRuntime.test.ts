import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { expect, it } from 'vitest';

function inNativeNode(sources: string[], evaluate: (entry: string) => string) {
  // Bundler-based tests accept extensionless imports that fail on Vercel.
  const directory = mkdtempSync(join(tmpdir(), 'lc-tracker-function-'));
  try {
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ type: 'module' }));
    symlinkSync(resolve('node_modules'), join(directory, 'node_modules'), 'dir');
    for (const source of sources) {
      const target = join(directory, source.replace(/\.ts$/, '.js'));
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, ts.transpileModule(readFileSync(source, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText);
    }
    const entry = pathToFileURL(join(directory, sources[0].replace(/\.ts$/, '.js'))).href;
    return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', evaluate(entry)], { encoding: 'utf8', timeout: 10_000 }));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

it('loads the compiled LeetCode function in native Node ESM', () => {
  const result = inNativeNode(['api/leetcode-ac.ts', 'server/leetcodeAc.ts'], entry => `
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
  `);
  expect(result.status).toBe(200);
  expect(result.body.submissions).toEqual([{ titleSlug: 'two-sum' }]);
});

it('loads the compiled coach function in native Node ESM and keeps unconfigured inference off', () => {
  const result = inNativeNode(['api/coach.ts', 'server/coachAuth.ts', 'server/coachProvider.ts', 'src/coach/protocol.ts'], entry => `
    delete process.env.COACH_ALLOWED_ORIGINS;
    const { default: handler } = await import(${JSON.stringify(entry)});
    const response = await handler.fetch(new Request('https://lc-tracker.test/api/coach'));
    process.stdout.write(JSON.stringify({ status: response.status, body: await response.json() }));
  `);
  expect(result).toEqual({ status: 200, body: { hosted: 'off', nativeKeys: false } });
});
