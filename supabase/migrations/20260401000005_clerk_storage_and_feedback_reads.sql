-- Align storage policies with Clerk user IDs and add per-admin feedback read tracking.

DROP POLICY IF EXISTS "Users can upload feedback images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view feedback images" ON storage.objects;

CREATE POLICY "Users can upload feedback images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback_images' AND
  public.requesting_user_id() IS NOT NULL AND
  (storage.foldername(name))[1] = public.requesting_user_id()
);

CREATE POLICY "Anyone can view feedback images"
ON storage.objects FOR SELECT
USING (bucket_id = 'feedback_images');

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'feedback_images' AND
  public.requesting_user_id() IS NOT NULL AND
  (storage.foldername(name))[1] = public.requesting_user_id()
);

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