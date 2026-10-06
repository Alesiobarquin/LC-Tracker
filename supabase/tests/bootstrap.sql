-- Minimal Supabase roles/auth surfaces needed by the actual migration files.
CREATE ROLE authenticated;
CREATE ROLE anon;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE SQL STABLE AS $$ SELECT NULL::uuid $$;
CREATE SCHEMA storage;
CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text NOT NULL, name text NOT NULL);
CREATE FUNCTION storage.foldername(path text) RETURNS text[] LANGUAGE SQL IMMUTABLE AS $$
  SELECT (string_to_array(path, '/'))[:array_length(string_to_array(path, '/'), 1) - 1]
$$;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT SELECT, INSERT, DELETE ON storage.objects TO authenticated, anon;
CREATE POLICY "Anyone can view feedback images" ON storage.objects FOR SELECT USING (bucket_id = 'feedback_images');
CREATE TABLE public.user_feedback (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id));
GRANT USAGE ON SCHEMA public, auth TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
