-- Fix for Admin Panel "violates row-level security policy" errors
-- Run this in your Supabase SQL Editor

-- 1. Disable RLS on all admin content tables so the frontend can freely insert/edit data
ALTER TABLE IF EXISTS subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dpp_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mock_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS live_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_logs DISABLE ROW LEVEL SECURITY;

-- 2. Ensure anon and authenticated users have permission to use these tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
