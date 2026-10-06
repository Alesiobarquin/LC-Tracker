-- Repair the deployed UUID policies without replaying unrelated historical SQL.
BEGIN;

DROP POLICY IF EXISTS "Users can upload feedback images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

CREATE POLICY "Users can upload feedback images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'feedback_images'
  AND public.requesting_user_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.requesting_user_id()
);

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'feedback_images'
  AND public.requesting_user_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.requesting_user_id()
);

COMMIT;
