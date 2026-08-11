-- Run this in the Supabase SQL Editor if admin_feedback_reads 404s (PGRST205).
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS public.admin_feedback_reads (
    admin_user_id TEXT NOT NULL,
    feedback_id UUID NOT NULL REFERENCES public.user_feedback(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (admin_user_id, feedback_id)
);

ALTER TABLE public.admin_feedback_reads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_feedback_reads_admin_user_id
  ON public.admin_feedback_reads (admin_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_feedback_reads_feedback_id
  ON public.admin_feedback_reads (feedback_id);

GRANT SELECT, INSERT, UPDATE ON TABLE public.admin_feedback_reads TO authenticated;

DROP POLICY IF EXISTS "Admins can view own read markers" ON public.admin_feedback_reads;
CREATE POLICY "Admins can view own read markers"
  ON public.admin_feedback_reads FOR SELECT
  USING (
    admin_user_id = public.requesting_user_id()
  );

DROP POLICY IF EXISTS "Admins can insert own read markers" ON public.admin_feedback_reads;
CREATE POLICY "Admins can insert own read markers"
  ON public.admin_feedback_reads FOR INSERT
  WITH CHECK (
    admin_user_id = public.requesting_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.admin_users AS au
      WHERE au.user_id = public.requesting_user_id()
    )
  );

DROP POLICY IF EXISTS "Admins can update own read markers" ON public.admin_feedback_reads;
CREATE POLICY "Admins can update own read markers"
  ON public.admin_feedback_reads FOR UPDATE
  USING (
    admin_user_id = public.requesting_user_id()
  )
  WITH CHECK (
    admin_user_id = public.requesting_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.admin_users AS au
      WHERE au.user_id = public.requesting_user_id()
    )
  );

NOTIFY pgrst, 'reload schema';
