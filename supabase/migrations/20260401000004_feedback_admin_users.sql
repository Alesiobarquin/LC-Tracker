-- Replace hardcoded feedback admin policies with a DB-managed admin list.

CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.admin_users TO authenticated;

DROP POLICY IF EXISTS "Users can view own admin record" ON public.admin_users;
CREATE POLICY "Users can view own admin record"
  ON public.admin_users FOR SELECT
  USING (requesting_user_id() = user_id);

DROP POLICY IF EXISTS "Admin can view all feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admin can update all feedback" ON public.user_feedback;

CREATE POLICY "Admin can view all feedback"
  ON public.user_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users AS au
      WHERE au.user_id = requesting_user_id()
    )
  );

CREATE POLICY "Admin can update all feedback"
  ON public.user_feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users AS au
      WHERE au.user_id = requesting_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_users AS au
      WHERE au.user_id = requesting_user_id()
    )
  );

INSERT INTO public.admin_users (user_id)
VALUES ('user_3BX0nBCxUq0Jo9mYOjsomwe6Yf8')
ON CONFLICT (user_id) DO NOTHING;