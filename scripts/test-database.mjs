import { execFile, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

// This harness always creates a disposable local cluster. It never accepts a
// production connection string or loads .env. PostgreSQL binaries must be on PATH.
const root = mkdtempSync(join(tmpdir(), 'lc-tracker-db-'));
const data = join(root, 'data');
const socket = join(root, 'socket');
mkdirSync(socket);
let started = false;
function run(bin, args, input) {
  try { return execFileSync(bin, args, { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }); }
  catch (error) {
    console.error(error.stderr?.toString() || `${bin} failed. Install PostgreSQL and add its binaries to PATH.`);
    throw error;
  }
}
try {
  run('initdb', ['-D', data, '-A', 'trust', '--no-locale']);
  run('pg_ctl', ['-D', data, '-l', join(root, 'postgres.log'), '-o', `-k ${socket} -p 55439 -c listen_addresses=''`, 'start']);
  started = true;
  const args = ['-X', '-v', 'ON_ERROR_STOP=1', '-h', socket, '-p', '55439', '-d', 'postgres'];
  run('psql', args, readFileSync('supabase/tests/bootstrap.sql', 'utf8'));
  for (const name of ['20260321_001_normalized_schema.sql', '20260326000003_clerk_auth_rls.sql', '20260407000000_fix_session_rating_constraint.sql', '20261006000000_reliable_user_writes.sql']) {
    run('psql', args, readFileSync(`supabase/migrations/${name}`, 'utf8'));
  }
  const output = run('psql', args, readFileSync('supabase/tests/reliability.sql', 'utf8'));
  console.log(output.split('\n').find((line) => line.includes('Atomic saves'))?.trim());
  const raceSql = (operationId, version, reviewCount) => {
    const payload = JSON.stringify({ problemId: 'two-sum', progress: [{ problem_id: 'two-sum',
      first_solved_at: '2026-10-01T00:00:00Z', last_reviewed_at: '2026-10-06T00:00:00Z', next_review_at: '2026-10-09T00:00:00Z',
      review_count: reviewCount, consecutive_threes: 0, consecutive_successes: 1, retired: false, notes: null, history: [],
    }], logDate: '2026-10-06', isNew: version === 0 });
    const expected = JSON.stringify({ progress: { 'two-sum': version } });
    return `SET ROLE authenticated;
      SELECT set_config('request.jwt.claims', '{"sub":"user_race","role":"authenticated"}', false);
      SELECT public.commit_user_change('${operationId}', 'session', '${expected}', '${payload}');`;
  };
  const ids = ['00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000021'];
  const racers = await Promise.allSettled(ids.map((id) => promisify(execFile)('psql', [...args, '-c', raceSql(id, 0, 0)], { encoding: 'utf8' })));
  if (racers.filter((result) => result.status === 'fulfilled').length !== 1) throw new Error('Concurrent stale writes must not both succeed');
  const failed = racers.findIndex((result) => result.status === 'rejected');
  if (!racers[failed].reason.stderr.includes('Progress changed')) throw new Error('Concurrent rejection must be a version conflict');
  run('psql', args, raceSql(ids[failed], 1, 1));
  const counts = run('psql', [...args, '-tA', '-c', "SELECT solved || ',' || reviewed FROM public.activity_log WHERE user_id = 'user_race'"]);
  if (counts.trim() !== '1,1') throw new Error('Concurrent retry lost or duplicated activity');
  console.log('Concurrent devices serialize changes and retry without losing activity.');
  console.log('Database reliability tests passed (isolated PostgreSQL).');
} finally {
  if (started) run('pg_ctl', ['-D', data, '-m', 'immediate', 'stop']);
  rmSync(root, { recursive: true, force: true });
}
