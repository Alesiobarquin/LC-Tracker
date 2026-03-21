-- ─── 1. User Settings ─────────────────────────────────────────────────────────
-- One row per user. Stores preferences, schedule, and onboarding status.
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_complete  BOOLEAN NOT NULL DEFAULT FALSE,
  leetcode_username    TEXT,
  target_interview_date TEXT NOT NULL DEFAULT '2026-09-15',
  settings_json JSONB NOT NULL DEFAULT '{}',   -- studySchedule, skillLevels, sprintSettings, etc.
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. Problem Progress ──────────────────────────────────────────────────────
-- One row per (user, problem). The core data.
CREATE TABLE IF NOT EXISTS public.problem_progress (
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id      TEXT NOT NULL,
  first_solved_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at  TIMESTAMPTZ,
  review_count    INT NOT NULL DEFAULT 0,
  consecutive_threes INT NOT NULL DEFAULT 0,
  consecutive_successes INT NOT NULL DEFAULT 0,
  retired         BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT,
  history         JSONB NOT NULL DEFAULT '[]',  -- array of solve history entries
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_problem_progress_next_review 
  ON public.problem_progress(user_id, next_review_at);

-- ─── 3. Session Timings ───────────────────────────────────────────────────────
-- Normalized table for analytics (avg solve time, personal bests).
CREATE TABLE IF NOT EXISTS public.session_timings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id      TEXT NOT NULL,
  category        TEXT NOT NULL,
  session_type    TEXT NOT NULL, -- 'new' | 'review' | 'cold_solve' | 'mock'
  rating          SMALLINT NOT NULL CHECK (rating IN (1, 2, 3)),
  elapsed_seconds INT NOT NULL,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_timings_user 
  ON public.session_timings(user_id, recorded_at DESC);

-- ─── 4. Activity Log ─────────────────────────────────────────────────────────
-- One row per (user, date). Used for streak calculation and the heatmap.
CREATE TABLE IF NOT EXISTS public.activity_log (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date  DATE NOT NULL,
  solved    INT NOT NULL DEFAULT 0,
  reviewed  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, log_date)
);

-- ─── 5. Sprint State ─────────────────────────────────────────────────────────
-- Stores the current sprint and its history.
CREATE TABLE IF NOT EXISTS public.sprint_state (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_category   TEXT,
  sprint_start_date  TEXT,
  sprint_length      INT,
  sprint_status      TEXT, -- 'active' | 'retrospective' | 'complete'
  sprint_index       INT NOT NULL DEFAULT 0,
  extension_days     INT NOT NULL DEFAULT 0,
  retro_problem_id   TEXT,
  retro_attempted    BOOLEAN NOT NULL DEFAULT FALSE,
  sprint_history     JSONB NOT NULL DEFAULT '[]',
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RLS Policies ────────────────────────────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_timings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_state ENABLE ROW LEVEL SECURITY;

-- user_settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- problem_progress
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.problem_progress;
CREATE POLICY "Users can manage their own progress"
  ON public.problem_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- session_timings
DROP POLICY IF EXISTS "Users can manage their own timings" ON public.session_timings;
CREATE POLICY "Users can manage their own timings"
  ON public.session_timings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- activity_log
DROP POLICY IF EXISTS "Users can manage their own activity" ON public.activity_log;
CREATE POLICY "Users can manage their own activity"
  ON public.activity_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- sprint_state
DROP POLICY IF EXISTS "Users can manage their own sprint" ON public.sprint_state;
CREATE POLICY "Users can manage their own sprint"
  ON public.sprint_state FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
