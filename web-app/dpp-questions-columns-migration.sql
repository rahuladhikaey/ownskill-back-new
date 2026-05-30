-- Migration to add missing columns to dpp_questions table
-- This adds the columns required by the new DPP Question Builder

ALTER TABLE dpp_questions
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'MCQ',
ADD COLUMN IF NOT EXISTS explanation TEXT,
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- NOTE: If tags need to be a text array instead of JSONB depending on how it was originally created in other tables:
-- ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
-- Usually JSONB is safer for arrays if using Supabase client, but check your other tables if you want consistency.

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
