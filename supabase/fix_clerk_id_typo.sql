-- ============================================================
-- Fix Clerk ID Typo Migration
-- Typo'd ID:  user_38V1A5ihcc6hwpmSCCQaeSpt6KX
-- Actual ID:  user_3BV1A5ihoc6hwpmSCCQaeSpt6KX
-- ============================================================
-- Run this in the Supabase SQL Editor as a single transaction.

BEGIN;

-- 1. DELETE the empty rows created under the ACTUAL Clerk ID
--    (these were auto-created when Alesio logged in and hit onboarding)
DELETE FROM public.sprint_state   WHERE user_id = 'user_3BV1A5ihoc6hwpmSCCQaeSpt6KX';
DELETE FROM public.user_settings  WHERE user_id = 'user_3BV1A5ihoc6hwpmSCCQaeSpt6KX';

-- 2. UPDATE all tables: reassign the typo'd ID → actual Clerk ID
UPDATE public.user_settings    SET user_id = 'user_3BV1A5ihoc6hwpmSCCQaeSpt6KX' WHERE user_id = 'user_38V1A5ihcc6hwpmSCCQaeSpt6KX';
UPDATE public.problem_progress SET user_id = 'user_3BV1A5ihoc6hwpmSCCQaeSpt6KX' WHERE user_id = 'user_38V1A5ihcc6hwpmSCCQaeSpt6KX';
UPDATE public.session_timings  SET user_id = 'user_3BV1A5ihoc6hwpmSCCQaeSpt6KX' WHERE user_id = 'user_38V1A5ihcc6hwpmSCCQaeSpt6KX';
UPDATE public.activity_log     SET user_id = 'user_3BV1A5ihoc6hwpmSCCQaeSpt6KX' WHERE user_id = 'user_38V1A5ihcc6hwpmSCCQaeSpt6KX';
UPDATE public.sprint_state     SET user_id = 'user_3BV1A5ihoc6hwpmSCCQaeSpt6KX' WHERE user_id = 'user_38V1A5ihcc6hwpmSCCQaeSpt6KX';
UPDATE public.user_feedback    SET user_id = 'user_3BV1A5ihoc6hwpmSCCQaeSpt6KX' WHERE user_id = 'user_38V1A5ihcc6hwpmSCCQaeSpt6KX';

-- 3. UPDATE the admin RLS policies to use the correct Clerk ID
--    Drop and recreate the admin policies with the correct ID.
DROP POLICY IF EXISTS "Admin can view all feedback"  ON public.user_feedback;
DROP POLICY IF EXISTS "Admin can update all feedback" ON public.user_feedback;

CREATE POLICY "Admin can view all feedback"
  ON public.user_feedback FOR SELECT
  USING (requesting_user_id() = 'user_3BV1A5ihoc6hwpmSCCQaeSpt6KX');

CREATE POLICY "Admin can update all feedback"
  ON public.user_feedback FOR UPDATE
  USING (requesting_user_id() = 'user_3BV1A5ihoc6hwpmSCCQaeSpt6KX');

COMMIT;

-- 4. Verify the fix
SELECT user_id, leetcode_username, onboarding_complete FROM public.user_settings WHERE user_id LIKE 'user_3%';
