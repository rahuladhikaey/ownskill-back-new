-- 1. Enable RLS on the tables
ALTER TABLE public.live_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_live_test_progress ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow public read access on live_exams" ON public.live_exams;
DROP POLICY IF EXISTS "Allow all insert on live_exams" ON public.live_exams;
DROP POLICY IF EXISTS "Allow all update on live_exams" ON public.live_exams;
DROP POLICY IF EXISTS "Allow all delete on live_exams" ON public.live_exams;

DROP POLICY IF EXISTS "Allow public read access on live_test_questions" ON public.live_test_questions;
DROP POLICY IF EXISTS "Allow all insert on live_test_questions" ON public.live_test_questions;
DROP POLICY IF EXISTS "Allow all update on live_test_questions" ON public.live_test_questions;
DROP POLICY IF EXISTS "Allow all delete on live_test_questions" ON public.live_test_questions;

DROP POLICY IF EXISTS "Allow public read access on user_live_test_progress" ON public.user_live_test_progress;
DROP POLICY IF EXISTS "Allow users to insert their own test progress" ON public.user_live_test_progress;
DROP POLICY IF EXISTS "Allow users to update their own test progress" ON public.user_live_test_progress;
DROP POLICY IF EXISTS "Allow users to delete their own test progress" ON public.user_live_test_progress;

-- 3. Create Policies for public.live_exams
-- Allow read access for everyone
CREATE POLICY "Allow public read access on live_exams" 
ON public.live_exams FOR SELECT USING (true);
-- Allow write access for admin operations (open to prevent admin CMS errors)
CREATE POLICY "Allow all insert on live_exams" 
ON public.live_exams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on live_exams" 
ON public.live_exams FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on live_exams" 
ON public.live_exams FOR DELETE USING (true);

-- 4. Create Policies for public.live_test_questions
-- Allow read access for everyone
CREATE POLICY "Allow public read access on live_test_questions" 
ON public.live_test_questions FOR SELECT USING (true);
-- Allow write access for admin operations
CREATE POLICY "Allow all insert on live_test_questions" 
ON public.live_test_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on live_test_questions" 
ON public.live_test_questions FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on live_test_questions" 
ON public.live_test_questions FOR DELETE USING (true);

-- 5. Create Policies for public.user_live_test_progress
-- Everyone can read (to allow the leaderboard to work and fetch other users' scores)
CREATE POLICY "Allow public read access on user_live_test_progress" 
ON public.user_live_test_progress FOR SELECT USING (true);
-- Users can only modify their own progress
CREATE POLICY "Allow users to insert their own test progress" 
ON public.user_live_test_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update their own test progress" 
ON public.user_live_test_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete their own test progress" 
ON public.user_live_test_progress FOR DELETE USING (auth.uid() = user_id);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
