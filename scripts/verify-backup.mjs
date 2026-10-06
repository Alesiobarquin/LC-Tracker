import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
// File input only: this workflow always restores into an isolated local cluster.
// Provider webhook delivery is deliberately disabled in the recovery environment.
if (!process.argv[2])
  throw new Error(
    "Usage: npm run verify:backup -- /private/path/database.dump (PostgreSQL 17+ binaries on PATH)",
  );
const archive = resolve(process.argv[2]);
const root = mkdtempSync(join(tmpdir(), "lc-tracker-recovery-"));
const data = join(root, "data"),
  socket = join(root, "socket");
mkdirSync(socket);
let started = false;
function run(name, args, input) {
  return execFileSync(name, args, {
    input,
    encoding: "utf8",
    timeout: 120000,
    stdio: ["pipe", "pipe", "pipe"],
  });
}
const args = [
  "-X",
  "-v",
  "ON_ERROR_STOP=1",
  "-h",
  socket,
  "-p",
  "55519",
  "-U",
  "postgres",
  "-d",
  "postgres",
];
const query = (sql) => run("psql", [...args, "-tA", "-c", sql]).trim();
function digest() {
  const tables = JSON.parse(
    query(
      "SELECT json_agg(tablename ORDER BY tablename) FROM pg_tables WHERE schemaname='public'",
    ),
  );
  const result = {};
  for (const table of tables) {
    const name = '"' + table.replaceAll('"', '""') + '"';
    result[table] = JSON.parse(
      query(
        `SELECT json_build_object('rows',count(*),'checksum',md5(coalesce(string_agg(md5((to_jsonb(t)-'version')::text),'' ORDER BY md5((to_jsonb(t)-'version')::text)),''))) FROM public.${name} t`,
      ),
    );
  }
  return result;
}
try {
  run("initdb", ["-D", data, "-A", "trust", "--no-locale", "-U", "postgres"]);
  run("pg_ctl", [
    "-D",
    data,
    "-l",
    join(root, "postgres.log"),
    "-o",
    `-k ${socket} -p 55519 -c listen_addresses=''`,
    "start",
  ]);
  started = true;
  run(
    "psql",
    args,
    `CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role; CREATE ROLE supabase_auth_admin; CREATE ROLE supabase_storage_admin; CREATE ROLE supabase_admin;
 CREATE SCHEMA auth; CREATE SCHEMA storage; CREATE SCHEMA supabase_functions; CREATE FUNCTION supabase_functions.http_request() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Outbound webhook disabled in recovery test'; END $$; CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions; CREATE EXTENSION "uuid-ossp" WITH SCHEMA extensions; CREATE EXTENSION citext WITH SCHEMA extensions;`,
  );
  run("pg_restore", [
    "--exit-on-error",
    "--no-owner",
    "--no-privileges",
    "--schema=auth",
    "--schema=storage",
    "--schema=public",
    "-h",
    socket,
    "-p",
    "55519",
    "-U",
    "postgres",
    "-d",
    "postgres",
    archive,
  ]);
  const before = digest();
  run(
    "psql",
    args,
    `GRANT USAGE ON SCHEMA public,auth TO authenticated,anon; CREATE PUBLICATION supabase_realtime;`,
  );
  for (const file of [
    "20260407000000_fix_session_rating_constraint.sql",
    "20261006000000_reliable_user_writes.sql",
    "20261006000001_clerk_feedback_storage.sql",
  ])
    run("psql", args, readFileSync("supabase/migrations/" + file, "utf8"));
  const after = digest();
  for (const [table, value] of Object.entries(before)) {
    if (JSON.stringify(value) !== JSON.stringify(after[table]))
      throw new Error("Migration changed existing data in " + table);
  }
  const checks = run(
    "psql",
    args,
    "BEGIN;\n" +
      readFileSync("supabase/tests/reliability.sql", "utf8") +
      "\nROLLBACK;",
  );
  console.log(
    JSON.stringify({
      restoredSchemas: ["auth", "storage", "public"],
      tables: Object.keys(before).length,
      rows: Object.values(before).reduce((sum, t) => sum + t.rows, 0),
      migrationPreservesExistingRows: true,
      reliabilityTests: checks.includes("RLS isolation passed"),
    }),
  );
} catch (error) {
  console.error(error.stderr?.toString() ?? error.message);
  process.exitCode = 1;
} finally {
  if (started) run("pg_ctl", ["-D", data, "-m", "immediate", "stop"]);
  rmSync(root, { recursive: true, force: true });
}
