-- Create the user_feedback table
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature_request', 'general')),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own feedback
CREATE POLICY "Users can insert own feedback" 
ON public.user_feedback FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own feedback (optional, but good for future 'my requests' features)
CREATE POLICY "Users can view own feedback" 
ON public.user_feedback FOR SELECT 
USING (auth.uid() = user_id);

-- Allow your admin user (Alesio) to view and update ALL feedback
-- ID: 44f4cbe8-2700-44d4-a55d-898c18e26e4a
CREATE POLICY "Admin can view all feedback" 
ON public.user_feedback FOR SELECT 
USING (auth.uid() = '44f4cbe8-2700-44d4-a55d-898c18e26e4a'::uuid);

CREATE POLICY "Admin can update all feedback" 
ON public.user_feedback FOR UPDATE 
USING (auth.uid() = '44f4cbe8-2700-44d4-a55d-898c18e26e4a'::uuid);

-- Ensure we can join auth.users securely for the admin dashboard email lookup
-- Note: Often developers do a join, or just look up user metadata. A secure view is best but let's allow it in a basic query if needed.
    