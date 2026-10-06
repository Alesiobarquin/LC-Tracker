import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHmac, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

// Runs only against the disposable cluster supplied by test-database.mjs.
// Fixture JWTs have no relationship to Clerk or any hosted project.
export async function testPostgrest(socket) {
  const secret = 'lc-tracker-local-postgrest-test-secret-only';
  const base = 'http://127.0.0.1:55441';
  const server = spawn('postgrest', [], { stdio: 'ignore', env: { ...process.env,
    PGRST_DB_URI: `postgresql://authenticator@/postgres?host=${encodeURIComponent(socket)}&port=55439`,
    PGRST_DB_SCHEMAS: 'public', PGRST_DB_ANON_ROLE: 'anon', PGRST_DB_POOL: '2',
    PGRST_DB_POOL_ACQUISITION_TIMEOUT: '1', PGRST_JWT_SECRET: secret,
    PGRST_SERVER_HOST: '127.0.0.1', PGRST_SERVER_PORT: '55441',
  } });
  const exited = new Promise((resolve) => server.once('exit', resolve));
  let startupError;
  server.on('error', (error) => { startupError = error; });
  const token = (sub) => {
    const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ sub, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 120 })).toString('base64url');
    return `${head}.${body}.${createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url')}`;
  };
  const headers = { Authorization: `Bearer ${token('user_api_test')}`, 'Content-Type': 'application/json' };
  const request = (path, options = {}) => fetch(base + path, { ...options, signal: AbortSignal.timeout(3000) });
  const save = (id, version, minutes = 60) => request('/rpc/commit_user_change', { method: 'POST', headers,
    body: JSON.stringify({ p_operation_id: id, p_kind: 'settings', p_expected: { settings: version },
      p_payload: { settings: { onboarding_complete: true, leetcode_username: null,
        target_interview_date: '2027-01-01', settings_json: { settings: { studySchedule: { weekdayMinutes: minutes } } } } } }) });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      if (startupError) throw new Error('Install PostgREST 14.5 and add it to PATH: ' + startupError.code);
      if (server.exitCode !== null) throw new Error('PostgREST test server exited during startup');
      try { ready = (await request('/problem_progress?select=problem_id&limit=0')).ok; }
      catch { /* Wait for this local test process to listen. */ }
      if (ready) break;
      await delay(100);
    }
    assert.ok(ready, 'Local PostgREST server must become ready');
    assert.equal((await save(randomUUID(), 0)).status, 200);
    // More conflicts than pool slots must return instead of occupying the pool.
    const conflicts = await Promise.all(Array.from({ length: 4 }, () => save(randomUUID(), 0)));
    for (const conflict of conflicts) {
      assert.equal(conflict.status, 409);
      assert.equal((await conflict.json()).code, 'PT409');
    }
    assert.equal((await request('/problem_progress?select=problem_id&limit=0')).status, 200);
    const id = randomUUID();
    assert.equal((await save(id, 1, 90)).status, 200);
    assert.equal((await (await save(id, 1, 90)).json()).duplicate, true);
    const settings = await (await request('/user_settings?select=version,settings_json', { headers })).json();
    assert.equal(settings[0].version, 2);
    assert.equal(settings[0].settings_json.settings.studySchedule.weekdayMinutes, 90);
    const other = await request('/user_settings?select=version', { headers: { Authorization: `Bearer ${token('another_api_user')}` } });
    assert.deepEqual(await other.json(), []);
    const progressRow = { problem_id: 'two-sum', first_solved_at: '2020-01-01T00:00:00Z',
      last_reviewed_at: '2020-01-01T00:00:00Z', next_review_at: '2026-10-06T00:00:00Z',
      review_count: 0, consecutive_threes: 0, consecutive_successes: 0, retired: false, history: [] };
    assert.equal((await request('/rpc/commit_user_change', { method: 'POST', headers, body: JSON.stringify({
      p_operation_id: randomUUID(), p_kind: 'import', p_expected: {}, p_payload: { progress: [progressRow] },
    }) })).status, 200);
    const recallId = randomUUID();
    const studyState = { version: 1, source: 'leetcode_import', recallIntervalDays: 5, codingIntervalDays: 7,
      nextRecallAt: '2026-10-11T00:00:00Z', nextCodingAt: '2026-10-13T00:00:00Z', lapses: 0,
      recallHistory: [{ id: recallId, date: '2026-10-06T12:00:00Z', elapsedSeconds: 180,
        outcome: 'recalled', answer: 'A fixture recall answer', checkedAgainst: 'external' }] };
    const recallSave = () => request('/rpc/commit_user_change', { method: 'POST', headers, body: JSON.stringify({
      p_operation_id: recallId, p_kind: 'recall', p_expected: { progress: { 'two-sum': 1 } },
      p_payload: { problemId: 'two-sum', progress: [{ ...progressRow, study_state: studyState }],
        logDate: '2026-10-06', isNew: false, timings: [{ id: recallId, problem_id: 'two-sum',
          category: 'Arrays & Hashing', recorded_at: '2026-10-06T12:00:00Z', elapsed_seconds: 180, session_type: 'recall', rating: 4 }] },
    }) });
    assert.equal((await recallSave()).status, 200);
    assert.equal((await (await recallSave()).json()).duplicate, true);
    const recalledRows = await (await request('/problem_progress?select=study_state,history,review_count', { headers })).json();
    assert.deepEqual(recalledRows[0].study_state, studyState);
    assert.deepEqual(recalledRows[0].history, []);
    assert.equal(recalledRows[0].review_count, 0);
    const recallTimings = await (await request('/session_timings?select=id,session_type', { headers })).json();
    assert.equal(recallTimings.length, 1);
    assert.equal(recallTimings[0].session_type, 'recall');
    const isolated = await request('/problem_progress?select=study_state', { headers: { Authorization: `Bearer ${token('another_api_user')}` } });
    assert.deepEqual(await isolated.json(), []);
    console.log('PostgREST recall state, modality, exact-once retry, and answer privacy passed.');
    console.log('PostgREST HTTP conflicts return 409 without pool starvation; retry receipts and JWT RLS passed.');
  } finally {
    if (server.exitCode === null && !startupError) {
      server.kill('SIGKILL');
      await exited;
    }
  }
}
