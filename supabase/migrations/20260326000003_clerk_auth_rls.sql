-- Create helper function for Clerk JWT token parsing
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
    ''
  )::text;
$$ LANGUAGE SQL STABLE;

-- 1. Drop ALL existing policies that depend on the user_id column BEFORE we alter it
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.problem_progress;
DROP POLICY IF EXISTS "Users can manage their own timings" ON public.session_timings;
DROP POLICY IF EXISTS "Users can manage their own activity" ON public.activity_log;
DROP POLICY IF EXISTS "Users can manage their own sprint" ON public.sprint_state;
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admin can view all feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admin can update all feedback" ON public.user_feedback;

-- 2. Remove foreign key constraints to auth.users 
ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
ALTER TABLE public.problem_progress DROP CONSTRAINT IF EXISTS problem_progress_user_id_fkey;
ALTER TABLE public.session_timings DROP CONSTRAINT IF EXISTS session_timings_user_id_fkey;
ALTER TABLE public.activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;
ALTER TABLE public.sprint_state DROP CONSTRAINT IF EXISTS sprint_state_user_id_fkey;
ALTER TABLE public.user_feedback DROP CONSTRAINT IF EXISTS user_feedback_user_id_fkey;

-- 3. Safely change user_id type to TEXT to support Clerk ID strings
ALTER TABLE public.user_settings ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.problem_progress ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.session_timings ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.activity_log ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.sprint_state ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.user_feedback ALTER COLUMN user_id TYPE TEXT;

-- 4. Recreate the RLS policies using the new Clerk ID mechanism
CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL
  USING (requesting_user_id() = user_id)
  WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can manage their own progress"
  ON public.problem_progress FOR ALL
  USING (requesting_user_id() = user_id)
  WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can manage their own timings"
  ON public.session_timings FOR ALL
  USING (requesting_user_id() = user_id)
  WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can manage their own activity"
  ON public.activity_log FOR ALL
  USING (requesting_user_id() = user_id)
  WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can manage their own sprint"
  ON public.sprint_state FOR ALL
  USING (requesting_user_id() = user_id)
  WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON public.user_feedback FOR INSERT
  WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can view own feedback"
  ON public.user_feedback FOR SELECT
  USING (requesting_user_id() = user_id);

-- NOTE: Since your Admin ID will change from a Supabase UUID to a Clerk string,
-- we'll use a placeholder here. Update this string value once you login via Clerk and get your new user ID!
CREATE POLICY "Admin can view all feedback"
  ON public.user_feedback FOR SELECT
  USING (requesting_user_id() = 'user_3BV1A5ihoc6hwpmSCCQaeSpt6KX');

CREATE POLICY "Admin can update all feedback"
  ON public.user_feedback FOR UPDATE
  USING (requesting_user_id() = 'user_3BV1A5ihoc6hwpmSCCQaeSpt6KX');
