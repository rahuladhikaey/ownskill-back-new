-- User Profiles Table Schema for OwnSkill App
-- Run this SQL in your Supabase SQL Editor to create the table

-- 1. If you are updating from an older version, uncomment the following line to drop the old table first
-- DROP TABLE IF EXISTS user_profiles;

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE,
  password TEXT NOT NULL,
  coins INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  user_goal TEXT DEFAULT 'jee-advanced',
  user_subjects TEXT[] DEFAULT '{}',
  accent_theme TEXT DEFAULT 'hsl(142, 70%, 45%)',
  is_dark_mode BOOLEAN DEFAULT true,
  tasks_completed INTEGER[] DEFAULT '{}',
  completed_dpp_topics TEXT[] DEFAULT '{}',
  unlocked_themes TEXT[] DEFAULT '{}',
  saved_articles TEXT[] DEFAULT '{}',
  saved_formulas TEXT[] DEFAULT '{}',
  is_maintenance_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Important: Since we are not using Supabase Auth, we disable RLS
-- so the React app can freely query the table using email/username and password.
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;
GRANT ALL ON user_profiles TO service_role;

-- Mock Tests Meta Table
CREATE TABLE IF NOT EXISTS mock_tests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DPP Progress Table
CREATE TABLE IF NOT EXISTS user_dpp_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Scores Table
CREATE TABLE IF NOT EXISTS user_test_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  test_id TEXT REFERENCES mock_tests(id) ON DELETE CASCADE,
  marks_secured INTEGER NOT NULL,
  accuracy_rate NUMERIC NOT NULL,
  time_spent INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DROP old profiles table since we migrated to user_profiles
-- Uncomment to clean up the database
-- DROP TABLE IF EXISTS profiles CASCADE;
