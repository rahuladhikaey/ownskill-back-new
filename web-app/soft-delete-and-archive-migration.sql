-- ============================================================================
-- SQL Migration: Soft Delete & Archive Triggers for DPP and Live Tests
-- Run this script in your Supabase SQL Editor
-- ============================================================================

-- 1. Add 'is_deleted' column to active tables if not already present
ALTER TABLE public.dpp_questions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.live_exams ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.live_test_questions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 2. Create Archive Tables (without foreign key constraints or primary key constraints on ID)
CREATE TABLE IF NOT EXISTS public.archive_dpp_questions (
  archive_id SERIAL PRIMARY KEY,
  id TEXT,
  topic_id TEXT,
  type TEXT,
  question TEXT,
  options TEXT[],
  answer TEXT,
  explanation TEXT,
  tags TEXT[],
  is_deleted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.archive_live_exams (
  archive_id SERIAL PRIMARY KEY,
  id TEXT,
  title TEXT,
  date TEXT,
  time TEXT,
  duration INTEGER,
  is_realtime BOOLEAN,
  description TEXT,
  duration_minutes INTEGER,
  is_active BOOLEAN,
  pdf_url TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  status TEXT,
  subject_id TEXT,
  chapter_id TEXT,
  is_deleted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.archive_live_test_questions (
  archive_id SERIAL PRIMARY KEY,
  id TEXT,
  exam_id TEXT,
  question TEXT,
  options TEXT[],
  correct_answer TEXT,
  explanation TEXT,
  marks INTEGER,
  question_order INTEGER,
  tags TEXT[],
  pdf_url TEXT,
  is_live_practice BOOLEAN,
  type TEXT,
  is_deleted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Backup Trigger Functions

-- Trigger for DPP Questions
CREATE OR REPLACE FUNCTION backup_deleted_dpp_question()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.archive_dpp_questions (
    id, topic_id, type, question, options, answer, explanation, tags, is_deleted, created_at
  ) VALUES (
    OLD.id, OLD.topic_id, OLD.type, OLD.question, OLD.options, OLD.answer, OLD.explanation, OLD.tags, OLD.is_deleted, OLD.created_at
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Live Exams
CREATE OR REPLACE FUNCTION backup_deleted_live_exam()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.archive_live_exams (
    id, title, date, time, duration, is_realtime, description, duration_minutes, is_active, pdf_url, scheduled_start, status, subject_id, chapter_id, is_deleted, created_at
  ) VALUES (
    OLD.id, OLD.title, OLD.date, OLD.time, OLD.duration, OLD.is_realtime, OLD.description, OLD.duration_minutes, OLD.is_active, OLD.pdf_url, OLD.scheduled_start, OLD.status, OLD.subject_id, OLD.chapter_id, OLD.is_deleted, OLD.created_at
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Live Test Questions
CREATE OR REPLACE FUNCTION backup_deleted_live_test_question()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.archive_live_test_questions (
    id, exam_id, question, options, correct_answer, explanation, marks, question_order, tags, pdf_url, is_live_practice, type, is_deleted, created_at
  ) VALUES (
    OLD.id, OLD.exam_id, OLD.question, OLD.options, OLD.correct_answer, OLD.explanation, OLD.marks, OLD.question_order, OLD.tags, OLD.pdf_url, OLD.is_live_practice, OLD.type, OLD.is_deleted, OLD.created_at
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach Triggers BEFORE DELETE

DROP TRIGGER IF EXISTS trg_backup_deleted_dpp_question ON public.dpp_questions;
CREATE TRIGGER trg_backup_deleted_dpp_question
BEFORE DELETE ON public.dpp_questions
FOR EACH ROW EXECUTE FUNCTION backup_deleted_dpp_question();

DROP TRIGGER IF EXISTS trg_backup_deleted_live_exam ON public.live_exams;
CREATE TRIGGER trg_backup_deleted_live_exam
BEFORE DELETE ON public.live_exams
FOR EACH ROW EXECUTE FUNCTION backup_deleted_live_exam();

DROP TRIGGER IF EXISTS trg_backup_deleted_live_test_question ON public.live_test_questions;
CREATE TRIGGER trg_backup_deleted_live_test_question
BEFORE DELETE ON public.live_test_questions
FOR EACH ROW EXECUTE FUNCTION backup_deleted_live_test_question();

-- 5. Force PostgREST schema cache to reload
NOTIFY pgrst, 'reload schema';

-- Success confirmation
SELECT 'Soft Delete and Archive Triggers created successfully!' as status;
