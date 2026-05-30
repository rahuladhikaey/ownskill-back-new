-- ============================================================
-- Fix: Add missing subject_id and chapter_id columns to live_exams
-- Run this in the Supabase SQL Editor
-- ============================================================

ALTER TABLE live_exams ADD COLUMN IF NOT EXISTS subject_id TEXT;
ALTER TABLE live_exams ADD COLUMN IF NOT EXISTS chapter_id TEXT;
ALTER TABLE live_exams ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';
ALTER TABLE live_exams ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ;

-- Force Supabase PostgREST schema cache to reload
NOTIFY pgrst, 'reload schema';
