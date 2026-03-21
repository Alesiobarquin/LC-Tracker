-- Optional: only if the pre-normalized app used public.user_profiles with a JSON state blob.
-- Run the one-time script: npx tsx scripts/migrate-legacy-data.ts
ALTER TABLE IF EXISTS public.user_profiles
  ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMPTZ;

-- Realtime (enable in Dashboard): Database → Replication →
--   problem_progress, user_settings, activity_log, session_timings, sprint_state
