-- ============================================================
-- Add type column and change correct_answer to TEXT for SAQ support
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Add type column defaulting to MCQ
ALTER TABLE live_test_questions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'MCQ';

-- Cast correct_answer to TEXT so it can hold index numbers OR text answers
ALTER TABLE live_test_questions ALTER COLUMN correct_answer TYPE TEXT USING correct_answer::text;

-- Force Supabase PostgREST schema cache to reload
NOTIFY pgrst, 'reload schema';
