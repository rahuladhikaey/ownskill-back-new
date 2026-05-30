-- ============================================================
-- Live Test Lifecycle & Real-time Progress Migration
-- Run in your Supabase SQL Editor to apply these database schema updates
-- ============================================================

-- 1. Alter live_exams table to support scheduling, status, subject, and chapter
ALTER TABLE live_exams ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE live_exams ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';
ALTER TABLE live_exams ADD COLUMN IF NOT EXISTS subject_id TEXT;
ALTER TABLE live_exams ADD COLUMN IF NOT EXISTS chapter_id TEXT;

-- Ensure status has a valid check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_live_exams_status'
  ) THEN
    ALTER TABLE live_exams ADD CONSTRAINT chk_live_exams_status CHECK (status IN ('Draft', 'Scheduled', 'Published', 'Live', 'Completed'));
  END IF;
END $$;

-- 2. Create user_live_test_progress table for real-time saving
CREATE TABLE IF NOT EXISTS user_live_test_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  exam_id TEXT REFERENCES live_exams(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  is_submitted BOOLEAN DEFAULT false,
  score INTEGER,
  max_score INTEGER,
  time_taken INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exam_id)
);

-- 3. Disable Row Level Security (RLS) on progress table so client-side React app can sync seamlessly
ALTER TABLE user_live_test_progress DISABLE ROW LEVEL SECURITY;

-- 4. Reload PostgREST API schema
NOTIFY pgrst, 'reload schema';

-- Migration complete! The application can now schedule tests and sync answers in real-time.
