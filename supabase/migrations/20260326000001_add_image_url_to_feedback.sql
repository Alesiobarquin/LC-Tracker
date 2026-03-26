-- Add image URL column to feedback table
ALTER TABLE public.user_feedback
ADD COLUMN IF NOT EXISTS image_url TEXT;
