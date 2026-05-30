-- Run this in your Supabase SQL Editor to migrate from topics to chapters for DPP questions

-- 1. If you already have dpp_questions table, rename topic_id to chapter_id
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dpp_questions' AND column_name = 'topic_id') THEN
    ALTER TABLE dpp_questions RENAME COLUMN topic_id TO chapter_id;
  END IF;
END $$;

-- 2. Drop the topics table as it is no longer needed
DROP TABLE IF EXISTS topics CASCADE;

-- 3. The proper-secure-admin.sql script will handle enabling RLS and setting policies.
