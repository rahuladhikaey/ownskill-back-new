-- ============================================================================
-- FINAL SCHEMA FIX FOR OWNSKILL APP - Live Test System
-- Run this in Supabase SQL Editor to fix all schema issues
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. FIX LIVE_EXAMS TABLE - Add missing columns
-- ============================================================================

-- Add missing columns to live_exams if they don't exist
ALTER TABLE IF EXISTS live_exams ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS live_exams ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;
ALTER TABLE IF EXISTS live_exams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS live_exams ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE IF EXISTS live_exams ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS live_exams ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';
ALTER TABLE IF EXISTS live_exams ADD COLUMN IF NOT EXISTS subject_id TEXT;
ALTER TABLE IF EXISTS live_exams ADD COLUMN IF NOT EXISTS chapter_id TEXT;
ALTER TABLE IF EXISTS live_exams ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add status check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'live_exams_status_check'
  ) THEN
    ALTER TABLE live_exams ADD CONSTRAINT live_exams_status_check 
      CHECK (status IN ('Draft', 'Scheduled', 'Published', 'Live', 'Completed'));
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE/UPDATE LIVE_TEST_QUESTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS live_test_questions (
  id TEXT NOT NULL PRIMARY KEY,
  exam_id TEXT REFERENCES live_exams(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  marks INTEGER DEFAULT 4 NOT NULL,
  question_order INTEGER DEFAULT 0 NOT NULL,
  tags TEXT[],
  pdf_url TEXT,
  is_live_practice BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for exam_id
CREATE INDEX IF NOT EXISTS idx_live_test_questions_exam_id 
  ON live_test_questions(exam_id);

-- ============================================================================
-- 3. CREATE/UPDATE USER_LIVE_TEST_PROGRESS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_live_test_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_id TEXT REFERENCES live_exams(id) ON DELETE CASCADE NOT NULL,
  answers JSONB DEFAULT '{}',
  is_submitted BOOLEAN DEFAULT false,
  score INTEGER,
  max_score INTEGER,
  time_taken INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exam_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_live_test_progress_user_id 
  ON user_live_test_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_live_test_progress_exam_id 
  ON user_live_test_progress(exam_id);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE live_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_live_test_progress ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Public can read live exams" ON live_exams;
DROP POLICY IF EXISTS "Authenticated can manage live exams" ON live_exams;
DROP POLICY IF EXISTS "Public can read live test questions" ON live_test_questions;
DROP POLICY IF EXISTS "Authenticated can manage live test questions" ON live_test_questions;
DROP POLICY IF EXISTS "Users can read their own progress" ON user_live_test_progress;

-- Create new policies for live_exams
CREATE POLICY "Public can read live exams" 
  ON live_exams FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated can manage live exams" 
  ON live_exams FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Create policies for live_test_questions
CREATE POLICY "Public can read live test questions" 
  ON live_test_questions FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated can manage live test questions" 
  ON live_test_questions FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Create policies for user_live_test_progress
CREATE POLICY "Users can read their own progress" 
  ON user_live_test_progress FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
  ON user_live_test_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
  ON user_live_test_progress FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. SAMPLE DATA (OPTIONAL - For Testing)
-- ============================================================================

-- You can uncomment below if you want sample live exams/questions

-- INSERT INTO live_exams (id, title, description, duration_minutes, is_active, status, chapter_id, subject_id)
-- VALUES (
--   'exam-1',
--   'Physics Chapter 1 - Live Test',
--   'Live practice test for Newton Laws',
--   45,
--   true,
--   'Published',
--   'ch-physics-1',
--   'subj-physics'
-- ) ON CONFLICT (id) DO NOTHING;

-- INSERT INTO live_test_questions (id, exam_id, question, options, correct_answer, marks, question_order)
-- VALUES (
--   'q1',
--   'exam-1',
--   'What is Newton first law?',
--   ARRAY['Motion continues', 'Force equals mass', 'Action reaction', 'Velocity constant'],
--   0,
--   4,
--   1
-- ) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. SCHEMA MIGRATION COMPLETE
-- ============================================================================

-- Notify PostgREST API to reload schema
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'Schema migration completed successfully! All tables are now properly configured.' as status;
