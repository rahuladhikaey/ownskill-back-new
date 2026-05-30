-- ============================================================
-- Live Test System Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Update live_exams table (add new columns, make old ones optional)
ALTER TABLE live_exams ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE live_exams ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;
ALTER TABLE live_exams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
-- Make old columns optional if they exist
ALTER TABLE live_exams ALTER COLUMN date DROP NOT NULL;
ALTER TABLE live_exams ALTER COLUMN time DROP NOT NULL;
ALTER TABLE live_exams ALTER COLUMN duration DROP NOT NULL;

-- 2. Create live_test_questions table
CREATE TABLE IF NOT EXISTS live_test_questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES live_exams(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  marks INTEGER NOT NULL DEFAULT 4,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Disable RLS on both tables (admin can manage freely)
ALTER TABLE live_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE live_test_questions DISABLE ROW LEVEL SECURITY;

-- 4. Reload schema
NOTIFY pgrst, 'reload schema';

-- Done! You can now create live tests with MCQ questions from the Admin Panel.
