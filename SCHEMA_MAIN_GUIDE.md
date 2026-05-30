# schema-main.sql - COMPLETE DATABASE SETUP GUIDE

## Overview
This is the **SINGLE UNIFIED SCHEMA FILE** containing the entire OwnSkill database setup. All SQL commands are organized in 12 logical sections with detailed comments.

## File Location
```
c:\Ownskill Back New\schema-main.sql
```

## How to Use

### Step 1: Access Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your OwnSkill project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Load the Schema File
1. Copy the entire content of `schema-main.sql`
2. Paste it into the Supabase SQL Editor
3. Click **Run** button (or press Ctrl+Enter)

### Step 3: Verify Setup
Wait for the confirmation message:
```
OwnSkill Database Schema Setup Complete! ✓ All tables, policies, triggers, and indexes created successfully.
```

## File Structure (12 Sections)

### 📦 PART 1: EXTENSIONS & SETUP
- UUID extension for PostgreSQL
- Foundation setup

### 👤 PART 2: AUTHENTICATION & USER PROFILES
- `user_profiles` table
- Auto-update trigger for timestamps
- Auto-create profile on signup trigger
- Links to Supabase Auth

**Tables: 1**

### 📚 PART 3: SYLLABUS CATALOG
- `subjects` (Physics, Chemistry, Maths)
- `chapters` (Kinematics, Dynamics, etc.)
- `topics` (Specific concepts)
- `dpp_questions` (Daily Practice Problems)

**Tables: 4**

### 🔴 PART 4: LIVE EXAM SYSTEM
- `live_exams` (Scheduled tests)
- `live_test_questions` (Questions in exams)
- Status tracking (Draft → Published → Live → Completed)

**Tables: 2** (plus progress table below)

### 📊 PART 5: DPP PROGRESS TRACKING
- `user_dpp_progress` (Topic completion tracking)

**Tables: 1**

### 🎯 PART 6: MOCK TESTS & BATTLE ARENA
- `mock_tests` (Full-length tests)
- `user_test_scores` (Test results)

**Tables: 2**

### 📄 PART 7: ADMIN CONTENT MANAGEMENT
- `articles` (Student resources)
- `system_logs` (Audit trail)

**Tables: 2**

### ⚡ PART 8: PERFORMANCE INDEXES
- 20+ indexes on frequently queried columns
- Optimizes queries for speed

### 🔒 PART 9: ROW LEVEL SECURITY (RLS)
- Privacy policies for each table
- Public read access for catalogs
- User data isolation
- Admin CRUD permissions

### 🔑 PART 10: PERMISSIONS & GRANTS
- Service role permissions
- Authenticated user access
- Anonymous user access

### 📦 PART 11: SAMPLE DATA (OPTIONAL)
- Commented-out sample inserts
- Uncomment to load test data

### ✅ PART 12: VERIFICATION
- Schema reload notification
- Confirmation message

## Database Schema Summary

| Category | Tables | Purpose |
|----------|--------|---------|
| Auth & Users | 1 | User profiles & authentication |
| Syllabus | 4 | Subject structure & DPP questions |
| Live Exams | 3 | Scheduled tests & tracking |
| DPP Progress | 1 | Topic completion tracking |
| Mock Tests | 2 | Full-length tests & scores |
| Admin | 2 | Content & system logs |
| **TOTAL** | **13** | Complete system |

## Key Features

### ✅ Security
- Row Level Security (RLS) on all tables
- User data isolation
- Auth.uid() verification
- Role-based access control

### ✅ Performance
- 20+ optimized indexes
- Efficient queries
- Database normalization

### ✅ Reliability
- Foreign key constraints
- Data validation (CHECK constraints)
- Unique constraints
- Cascade deletes

### ✅ Audit Trail
- Created/Updated timestamps
- System logs table
- Trigger tracking

## Column Reference

### user_profiles
```sql
id                    -- UUID (links to auth.users)
username              -- Unique identifier
email                 -- Unique email
coins                 -- Currency (>= 0)
xp                    -- Experience points (>= 0)
streak                -- Day streak (>= 0)
user_goal             -- Learning goal
user_subjects[]       -- Array of subject IDs
accent_theme          -- Color preference
is_dark_mode          -- Theme setting
tasks_completed[]     -- Completed task IDs
completed_dpp_topics[]-- Finished DPP topics
unlocked_themes[]     -- Available themes
saved_articles[]      -- Bookmarked articles
saved_formulas[]      -- Saved formulas
is_admin              -- Admin flag
is_banned             -- Ban status
is_maintenance_mode   -- Maintenance flag
created_at            -- Signup time
updated_at            -- Last update
```

### live_exams
```sql
id                    -- Text (exam-{timestamp})
title                 -- Test name
description           -- Optional description
duration_minutes      -- Test length
is_active             -- Currently available?
pdf_url               -- Optional PDF
scheduled_start       -- When test begins
status                -- Draft/Scheduled/Published/Live/Completed
subject_id            -- Links to subjects (optional)
chapter_id            -- Links to chapters (optional) ← KEY FIX!
created_at            -- Creation time
```

### live_test_questions
```sql
id                    -- Text (ltq-{timestamp})
exam_id               -- Foreign key to live_exams
question              -- Question text
options[]             -- Answer choices
correct_answer        -- Index of correct option
explanation           -- Solution explanation
marks                 -- Points value
question_order        -- Display order
tags[]                -- Topic tags
pdf_url               -- Optional diagram
is_live_practice      -- Can use in live mode?
created_at            -- Creation time
```

## Query Examples

### Get all live exams for a chapter
```sql
SELECT * FROM live_exams 
WHERE chapter_id = 'ch-physics-1' 
AND status IN ('Published', 'Live');
```

### Get questions for a live exam
```sql
SELECT * FROM live_test_questions 
WHERE exam_id = 'exam-1' 
ORDER BY question_order;
```

### Get student's exam progress
```sql
SELECT * FROM user_live_test_progress 
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
AND exam_id = 'exam-1';
```

### Get student's DPP progress
```sql
SELECT udp.*, t.name as topic_name, c.name as chapter_name
FROM user_dpp_progress udp
JOIN topics t ON udp.topic_id = t.id
JOIN chapters c ON t.chapter_id = c.id
WHERE udp.user_id = '123e4567-e89b-12d3-a456-426614174000';
```

## Troubleshooting

### Error: "Could not find the 'chapter_id' column"
✅ **Solution:** Run `schema-main.sql` completely
- This file adds the missing column to `live_exams`

### Error: "Violates row level security policy"
✅ **Solution:** Check RLS policies (PART 9)
- Ensure auth.uid() matches user_id
- Service role bypasses RLS

### Error: "Foreign key constraint violation"
✅ **Solution:** Verify referenced records exist
- Insert subjects before chapters
- Insert chapters before topics
- Insert live_exams before questions

### Error: "Relation does not exist"
✅ **Solution:** Run complete schema file
- All tables must be created first

## Loading Sample Data

To load test data, uncomment PART 11 and run:

```sql
-- Subjects
INSERT INTO subjects (id, name) VALUES
('subj-physics', 'Physics'),
('subj-chemistry', 'Chemistry'),
('subj-maths', 'Mathematics')
ON CONFLICT (id) DO NOTHING;

-- Chapters
INSERT INTO chapters (id, subject_id, name) VALUES
('ch-physics-1', 'subj-physics', 'Kinematics'),
('ch-physics-2', 'subj-physics', 'Dynamics')
ON CONFLICT (id) DO NOTHING;

-- Live Exam
INSERT INTO live_exams (id, title, description, duration_minutes, status, chapter_id, subject_id) VALUES
('exam-1', 'Physics Chapter 1 Live Test', 'Kinematics practice', 45, 'Published', 'ch-physics-1', 'subj-physics')
ON CONFLICT (id) DO NOTHING;
```

## Maintenance Tasks

### Backup Database
```bash
# Using Supabase CLI
supabase db pull
```

### Check Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Analyze Performance
```sql
ANALYZE;  -- Updates statistics
```

### View RLS Policies
```sql
SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename IN (
  'user_profiles', 'live_exams', 'dpp_questions'
);
```

## Migration Path

If updating from old schema:

1. **Backup first** (via Supabase)
2. **Run** `schema-main.sql` completely
3. **Verify** all tables exist
4. **Migrate** old data (if needed)
5. **Test** app functionality
6. **Deploy** to production

## File Statistics

- **Total Lines:** 1000+
- **Comments:** 200+
- **SQL Statements:** 150+
- **Tables:** 13
- **Indexes:** 20+
- **RLS Policies:** 25+
- **Triggers:** 2
- **Functions:** 2

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-30 | 1.0 | Initial consolidated schema |

## Support

For issues:
1. Check **TROUBLESHOOTING** section
2. Verify all 12 parts ran successfully
3. Check Supabase logs for errors
4. Run `NOTIFY pgrst, 'reload schema';` to refresh

---

**Status:** Production Ready ✓
**Last Updated:** May 30, 2026
**Maintainer:** OwnSkill Dev Team
