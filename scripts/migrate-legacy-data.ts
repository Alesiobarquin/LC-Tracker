/**
 * One-time migration: legacy user_profiles.state JSON → normalized tables.
 *
 * Env (service role, not anon):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional: add migrated_at to user_profiles (see supabase/migrations/20260321_002_legacy_user_profiles_migrated_at.sql)
 *
 * Run: npx tsx scripts/migrate-legacy-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

type LegacyRow = { id: string; state: unknown; migrated_at?: string | null };

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return undefined;
}

async function migrateOne(row: LegacyRow) {
  const state = row.state;
  if (!state || typeof state !== 'object') return;
  const s = state as Record<string, unknown>;
  const userId = row.id;

  const settingsJson = {
    settings: pick(s, 'settings'),
    targetEvents: pick(s, 'targetEvents', 'target_events'),
    dayMode: pick(s, 'dayMode', 'day_mode'),
    catchUpPlan: pick(s, 'catchUpPlan', 'catch_up_plan'),
    syntaxProgress: pick(s, 'syntaxProgress', 'syntax_progress'),
  };

  const { error: settingsErr } = await supabase.from('user_settings').upsert({
    user_id: userId,
    onboarding_complete: Boolean(pick(s, 'onboardingComplete', 'onboarding_complete') ?? false),
    leetcode_username: (pick<string | null>(s, 'leetcodeUsername', 'leetcode_username') ?? null) as string | null,
    target_interview_date: (pick<string>(s, 'targetInterviewDate', 'target_interview_date') ?? '2026-09-15') as string,
    settings_json: settingsJson as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  });
  if (settingsErr) throw settingsErr;

  const progress = pick<Record<string, unknown>>(s, 'progress', 'problemProgress', 'problem_progress');
  if (progress && typeof progress === 'object') {
    const progRows = Object.entries(progress).map(([problemId, prog]) => {
      const p = prog as Record<string, unknown>;
      return {
        user_id: userId,
        problem_id: problemId,
        first_solved_at: pick(p, 'firstSolvedAt', 'first_solved_at'),
        last_reviewed_at: pick(p, 'lastReviewedAt', 'last_reviewed_at'),
        next_review_at: pick(p, 'nextReviewAt', 'next_review_at'),
        review_count: Number(pick(p, 'reviewCount', 'review_count') ?? 0),
        consecutive_threes: Number(pick(p, 'consecutiveThrees', 'consecutive_threes') ?? 0),
        consecutive_successes: Number(pick(p, 'consecutiveSuccesses', 'consecutive_successes') ?? 0),
        retired: Boolean(p.retired ?? false),
        notes: (pick<string | null>(p, 'notes') ?? null) as string | null,
        history: (p.history as unknown[]) ?? [],
        updated_at: new Date().toISOString(),
      };
    });
    if (progRows.length > 0) {
      const { error } = await supabase.from('problem_progress').upsert(progRows);
      if (error) throw error;
    }
  }

  const activityLog = pick<Record<string, { solved?: number; reviewed?: number }>>(s, 'activityLog', 'activity_log');
  if (activityLog && typeof activityLog === 'object') {
    const actRows = Object.entries(activityLog).map(([log_date, v]) => ({
      user_id: userId,
      log_date,
      solved: v?.solved ?? 0,
      reviewed: v?.reviewed ?? 0,
    }));
    if (actRows.length > 0) {
      const { error } = await supabase.from('activity_log').upsert(actRows);
      if (error) throw error;
    }
  }

  const timings = pick<unknown[]>(s, 'sessionTimings', 'session_timings');
  if (Array.isArray(timings)) {
    const timingRows = timings
      .map((raw) => {
        const t = raw as Record<string, unknown>;
        const problemId = pick<string>(t, 'problemId', 'problem_id');
        const recordedAt = pick<string>(t, 'date', 'recorded_at');
        if (!problemId || !recordedAt) return null;
        return {
          user_id: userId,
          problem_id: problemId,
          category: String(t.category ?? ''),
          recorded_at: recordedAt,
          elapsed_seconds: Number(t.elapsedSeconds ?? t.elapsed_seconds ?? 0),
          session_type: String(t.sessionType ?? t.session_type ?? 'new'),
          rating: Number(t.rating ?? 3) as 1 | 2 | 3,
        };
      })
      .filter(Boolean) as Record<string, unknown>[];
    if (timingRows.length > 0) {
      const { error } = await supabase.from('session_timings').insert(timingRows);
      if (error) throw error;
    }
  }

  const sprintState = pick<Record<string, unknown>>(s, 'sprintState', 'sprint_state');
  const sprintHistory = (pick<unknown[]>(s, 'sprintHistory', 'sprint_history') ?? []) as Record<string, unknown>[];
  if (sprintState && typeof sprintState === 'object') {
    const st = sprintState;
    const { error } = await supabase.from('sprint_state').upsert({
      user_id: userId,
      current_category: (pick<string | null>(st, 'currentCategory', 'current_category') ?? null) as string | null,
      sprint_start_date: (pick<string | null>(st, 'sprintStartDate', 'sprint_start_date') ?? null) as string | null,
      sprint_length: pick<number | null>(st, 'sprintLength', 'sprint_length') ?? null,
      sprint_status: (pick<string | null>(st, 'sprintStatus', 'sprint_status') ?? null) as string | null,
      sprint_index: Number(pick(st, 'sprintIndex', 'sprint_index') ?? 0),
      extension_days: Number(pick(st, 'extensionDays', 'extension_days') ?? 0),
      retro_problem_id: (pick<string | null>(st, 'retroProblemId', 'retro_problem_id') ?? null) as string | null,
      retro_attempted: Boolean(pick(st, 'retroAttempted', 'retro_attempted') ?? false),
      sprint_history: sprintHistory,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}

async function main() {
  const probe = await supabase.from('user_profiles').select('id').limit(1);
  if (probe.error?.code === '42P01' || probe.error?.message?.includes('does not exist')) {
    console.log('Table user_profiles does not exist — skipping.');
    return;
  }

  const withMigrated = await supabase.from('user_profiles').select('id, state, migrated_at').limit(1);
  const hasMigratedCol = !withMigrated.error;

  let rows: LegacyRow[] | null = null;
  let error = withMigrated.error;

  if (hasMigratedCol) {
    const r = await supabase.from('user_profiles').select('id, state, migrated_at').is('migrated_at', null);
    rows = r.data as LegacyRow[] | null;
    error = r.error;
  } else {
    console.warn('Column migrated_at not found — selecting all user_profiles rows (idempotent upserts only).');
    const r = await supabase.from('user_profiles').select('id, state');
    rows = (r.data as LegacyRow[]) ?? null;
    error = r.error;
  }

  if (error) {
    console.error(error);
    process.exit(1);
  }
  if (!rows?.length) {
    console.log('Nothing to migrate.');
    return;
  }

  for (const row of rows) {
    try {
      await migrateOne(row);
      if (hasMigratedCol) {
        const { error: upErr } = await supabase
          .from('user_profiles')
          .update({ migrated_at: new Date().toISOString() })
          .eq('id', row.id);
        if (upErr) console.error('Could not set migrated_at', row.id, upErr);
      }
      console.log('Migrated', row.id);
    } catch (e) {
      console.error('Failed', row.id, e);
    }
  }
}

main();
