-- ============================================================================
-- OwnSkill App - Production Database Schema (PostgreSQL / Supabase)
-- ============================================================================

-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE (Linked directly to Supabase Auth auth.users)
-- ============================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text not null,
  coins integer default 0 check (coins >= 0),
  xp integer default 0 check (xp >= 0),
  streak integer default 1 check (streak >= 0),
  user_goal text default 'foundation',
  user_subjects text[] default '{}',
  accent_theme text default 'hsl(262, 80%, 55%)',
  is_dark_mode boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on Profiles
alter table public.profiles enable row level security;

-- RLS Policies for Profiles
create policy "Allow public read access to profiles"
  on public.profiles for select
  using (true);

create policy "Allow authenticated users to update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================================
-- 2. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, coins, xp, streak, user_goal, user_subjects, accent_theme, is_dark_mode)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'New Student'),
    0,     -- Dynamic starts at 0 coins
    0,     -- Dynamic starts at 0 XP
    1,     -- Initial streak starts at 1
    'foundation',
    '{}',
    'hsl(262, 80%, 55%)',
    true
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create the Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- 3. SYLLABUS CATALOGS: SUBJECTS, CHAPTERS, & TOPICS
-- ============================================================================

-- Subjects Table
create table public.subjects (
  id text not null primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chapters Table
create table public.chapters (
  id text not null primary key,
  subject_id text references public.subjects(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Topics Table
create table public.topics (
  id text not null primary key,
  chapter_id text references public.chapters(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Syllabus Catalogs (Public read, Admin manage)
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.topics enable row level security;

create policy "Allow public read access to subjects" on public.subjects for select using (true);
create policy "Allow public read access to chapters" on public.chapters for select using (true);
create policy "Allow public read access to topics" on public.topics for select using (true);

-- ============================================================================
-- 4. DPP QUESTIONS TABLE
-- ============================================================================
create table public.dpp_questions (
  id text not null primary key,
  topic_id text references public.topics(id) on delete cascade not null,
  type text not null check (type in ('MCQ', 'MSQ', 'AssertionReason', 'MatrixMatch')),
  question text not null,
  options text[] not null,
  answer text not null, -- Option index e.g., '2' or comma separated indices for MSQ '0,1,2'
  explanation text not null,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.dpp_questions enable row level security;

create policy "Allow public read access to questions" on public.dpp_questions for select using (true);

-- ============================================================================
-- 5. STUDENT ACTIVE Telemetry Progress Log (REAL ACTIVITIES)
-- ============================================================================
create table public.user_dpp_progress (
  id uuid default gen_random_uuid() not null primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic_id text references public.topics(id) on delete cascade not null,
  questions_attempted integer default 0 not null,
  questions_correct integer default 0 not null,
  completed boolean default false not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, topic_id)
);

alter table public.user_dpp_progress enable row level security;

create policy "Allow authenticated users to read their own DPP progress"
  on public.user_dpp_progress for select
  using (auth.uid() = user_id);

create policy "Allow authenticated users to write/update their own DPP progress"
  on public.user_dpp_progress for insert
  with check (auth.uid() = user_id);

create policy "Allow authenticated users to update their own DPP progress record"
  on public.user_dpp_progress for update
  using (auth.uid() = user_id);

-- ============================================================================
-- 6. MOCK TESTS & BATTLE SCORES
-- ============================================================================

-- Mock Tests Table
create table public.mock_tests (
  id text not null primary key,
  title text not null,
  duration integer not null, -- in minutes
  total_marks integer not null,
  is_published boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Test Scores Table
create table public.user_test_scores (
  id uuid default gen_random_uuid() not null primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  test_id text references public.mock_tests(id) on delete cascade not null,
  marks_secured integer not null,
  accuracy_rate numeric check (accuracy_rate >= 0 and accuracy_rate <= 100),
  time_spent integer not null, -- in seconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.mock_tests enable row level security;
alter table public.user_test_scores enable row level security;

create policy "Allow public read access to mock tests" on public.mock_tests for select using (true);
create policy "Allow authenticated users to view their own scores"
  on public.user_test_scores for select
  using (auth.uid() = user_id);
create policy "Allow authenticated users to submit their scores"
  on public.user_test_scores for insert
  with check (auth.uid() = user_id);

-- ============================================================================
-- 7. SQL INDEXES FOR HIGH-SPEED PERFORMANCES
-- ============================================================================
create index idx_chapters_subject_id on public.chapters(subject_id);
create index idx_topics_chapter_id on public.topics(chapter_id);
create index idx_dpp_questions_topic_id on public.dpp_questions(topic_id);
create index idx_user_dpp_progress_user_id on public.user_dpp_progress(user_id);
create index idx_user_test_scores_user_id on public.user_test_scores(user_id);
