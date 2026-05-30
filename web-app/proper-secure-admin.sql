-- PROPER SECURITY FIX FOR ADMIN TABLES (V2)
-- This version automatically creates any missing tables first so you don't get "relation does not exist" errors!

-- 1. CREATE ALL ADMIN TABLES (if they don't exist yet)
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dpp_questions (
    id TEXT PRIMARY KEY,
    chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT,
    tags TEXT[],
    pdf_url TEXT,
    is_live_practice BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mock_tests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    duration INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS live_exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    is_realtime BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_logs (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TURN SECURITY ON FOR EVERY TABLE (To make Supabase Advisor happy)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpp_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- 3. CLEAR ANY OLD INSECURE PUBLIC POLICIES
DROP POLICY IF EXISTS "Allow anon everything" ON subjects;
DROP POLICY IF EXISTS "Allow anon everything" ON chapters;
DROP POLICY IF EXISTS "Allow anon everything" ON dpp_questions;
DROP POLICY IF EXISTS "Allow anon everything" ON mock_tests;
DROP POLICY IF EXISTS "Allow anon everything" ON live_exams;
DROP POLICY IF EXISTS "Allow anon everything" ON articles;

-- 4. CREATE PROPER SECURE POLICIES FOR AUTHENTICATED ADMINS ONLY
DROP POLICY IF EXISTS "Authenticated users can manage subjects" ON subjects;
CREATE POLICY "Authenticated users can manage subjects" ON subjects FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage chapters" ON chapters;
CREATE POLICY "Authenticated users can manage chapters" ON chapters FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage dpp_questions" ON dpp_questions;
CREATE POLICY "Authenticated users can manage dpp_questions" ON dpp_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage mock_tests" ON mock_tests;
CREATE POLICY "Authenticated users can manage mock_tests" ON mock_tests FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage live_exams" ON live_exams;
CREATE POLICY "Authenticated users can manage live_exams" ON live_exams FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage articles" ON articles;
CREATE POLICY "Authenticated users can manage articles" ON articles FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage system_logs" ON system_logs;
CREATE POLICY "Authenticated users can manage system_logs" ON system_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. STILL ALLOW EVERYONE TO READ THE SUBJECTS/CHAPTERS (For the app to display them)
DROP POLICY IF EXISTS "Public can view subjects" ON subjects;
CREATE POLICY "Public can view subjects" ON subjects FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can view chapters" ON chapters;
CREATE POLICY "Public can view chapters" ON chapters FOR SELECT TO public USING (true);
