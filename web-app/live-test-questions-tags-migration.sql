-- ============================================================
-- Live Test Questions tags and PDF attachment Migration
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE live_test_questions ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE live_test_questions ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE live_test_questions ADD COLUMN IF NOT EXISTS is_live_practice BOOLEAN DEFAULT false;

NOTIFY pgrst, 'reload schema';
