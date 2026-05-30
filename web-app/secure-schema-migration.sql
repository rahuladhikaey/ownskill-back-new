-- MIGRATION SCRIPT: Move to secure Supabase Auth and enable RLS
-- Run this completely in your Supabase SQL Editor

-- 1. Wipe the old insecure user tables to avoid foreign key conflicts
TRUNCATE TABLE user_profiles CASCADE;

-- 2. Link user_profiles directly to Supabase Auth system
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_pkey CASCADE;

ALTER TABLE user_profiles
ALTER COLUMN id SET DEFAULT gen_random_uuid(),
ADD PRIMARY KEY (id);

-- Ensure the ID column is linked to auth.users if we use Supabase Auth
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_auth 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Remove the password column as Supabase Auth handles it securely
ALTER TABLE user_profiles DROP COLUMN IF EXISTS password;

-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dpp_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_test_scores ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies to PREVENT HACKERS
-- Only allow users to read/update their OWN profiles based on their secure auth token (auth.uid())

-- user_profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" 
ON user_profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" 
ON user_profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" 
ON user_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- user_dpp_progress Policies
DROP POLICY IF EXISTS "Users can view their own dpp progress" ON user_dpp_progress;
CREATE POLICY "Users can view their own dpp progress" 
ON user_dpp_progress FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own dpp progress" ON user_dpp_progress;
CREATE POLICY "Users can insert their own dpp progress" 
ON user_dpp_progress FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own dpp progress" ON user_dpp_progress;
CREATE POLICY "Users can update their own dpp progress" 
ON user_dpp_progress FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- user_test_scores Policies
DROP POLICY IF EXISTS "Users can view their own test scores" ON user_test_scores;
CREATE POLICY "Users can view their own test scores" 
ON user_test_scores FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own test scores" ON user_test_scores;
CREATE POLICY "Users can insert their own test scores" 
ON user_test_scores FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- 5. Give Admins full bypass access via service role
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON user_dpp_progress TO service_role;
GRANT ALL ON user_test_scores TO service_role;
