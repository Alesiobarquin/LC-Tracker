-- Insert a new public bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback_images',
  'feedback_images',
  true, 
  5242880, -- 5MB limit
  '{image/png, image/jpeg, image/webp}' -- Only allow these 3 formats
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Important: Storage buckets map to the `storage.objects` table.

-- Allow authenticated users to INSERT files to the feedback bucket
CREATE POLICY "Users can upload feedback images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback_images' AND
  (storage.foldername(name))[1] = auth.uid()::text -- Enforce folder mapping to their User ID for security
);

-- Allow anyone to read the public images (or keep it tight if needed, but since it's a public bucket, we allow select)
CREATE POLICY "Anyone can view feedback images"
ON storage.objects FOR SELECT
USING (bucket_id = 'feedback_images');

-- Allow users to delete their own images (cleanup)
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'feedback_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
