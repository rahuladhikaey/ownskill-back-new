-- Fix for "Could not find the 'is_live_practice' column" error
-- This explicitly adds the column if it's missing from when the table was originally created

ALTER TABLE dpp_questions ADD COLUMN IF NOT EXISTS is_live_practice BOOLEAN DEFAULT FALSE;

-- Force Supabase's API schema cache to reload so the app immediately sees the new column
NOTIFY pgrst, 'reload schema';
