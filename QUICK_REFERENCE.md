# QUICK REFERENCE - OwnSkill Schema

## 🚀 QUICK START

```sql
-- 1. Copy all content from: schema-main.sql
-- 2. Paste into Supabase SQL Editor
-- 3. Click RUN
-- 4. Done! ✓
```

## 📋 TABLE REFERENCE

### USER MANAGEMENT
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_profiles` | User accounts | id, username, email, coins, xp, streak |

### CATALOG
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `subjects` | Subject categories | id, name |
| `chapters` | Chapters per subject | id, subject_id, name |
| `topics` | Topics per chapter | id, chapter_id, name |
| `dpp_questions` | Daily practice questions | id, chapter_id, type, question, options, answer |

### LIVE EXAMS
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `live_exams` | Scheduled tests | id, title, chapter_id, status, scheduled_start |
| `live_test_questions` | Questions in exams | id, exam_id, question, correct_answer, marks |
| `user_live_test_progress` | Student progress | id, user_id, exam_id, answers, score, is_submitted |

### PROGRESS
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_dpp_progress` | DPP completion | id, user_id, topic_id, questions_correct |
| `mock_tests` | Full-length tests | id, title, duration, total_marks |
| `user_test_scores` | Test scores | id, user_id, test_id, marks_secured |

## 🔑 KEY COLUMNS (THE CRITICAL FIX!)

### live_exams Table Now Includes:
```
✅ chapter_id       ← THIS WAS MISSING! Now fixed.
✅ subject_id       ← Links to subjects
✅ status           ← Draft, Scheduled, Published, Live, Completed
✅ scheduled_start  ← When test begins
✅ duration_minutes ← Test length
✅ pdf_url          ← Optional PDF attachment
```

## 🔍 COMMON QUERIES

### Get Live Exams for a Chapter
```sql
SELECT * FROM live_exams 
WHERE chapter_id = 'ch-physics-1'
ORDER BY scheduled_start;
```

### Get Questions for an Exam
```sql
SELECT * FROM live_test_questions 
WHERE exam_id = 'exam-1' 
ORDER BY question_order;
```

### Get Student's Score
```sql
SELECT * FROM user_live_test_progress 
WHERE user_id = 'USER_ID' AND exam_id = 'exam-1';
```

### Get DPP Progress
```sql
SELECT t.name, udp.questions_correct, udp.questions_attempted
FROM user_dpp_progress udp
JOIN topics t ON udp.topic_id = t.id
WHERE udp.user_id = 'USER_ID';
```

### Get Mock Test Results
```sql
SELECT uts.marks_secured, uts.accuracy_rate, mt.total_marks
FROM user_test_scores uts
JOIN mock_tests mt ON uts.test_id = mt.id
WHERE uts.user_id = 'USER_ID';
```

## 🛡️ RLS POLICIES SUMMARY

| Table | Public Read | User Read Own | User Write Own | Admin Manage |
|-------|-----------|---------------|----------------|--------------|
| user_profiles | ❌ | ✅ | ✅ | ✅ |
| subjects | ✅ | ✅ | ❌ | ✅ |
| chapters | ✅ | ✅ | ❌ | ✅ |
| topics | ✅ | ✅ | ❌ | ✅ |
| dpp_questions | ✅ | ✅ | ❌ | ✅ |
| live_exams | ✅ | ✅ | ❌ | ✅ |
| live_test_questions | ✅ | ✅ | ❌ | ✅ |
| user_dpp_progress | ❌ | ✅ | ✅ | ✅ |
| user_live_test_progress | ❌ | ✅ | ✅ | ✅ |
| user_test_scores | ❌ | ✅ | ✅ | ✅ |

## 📊 DATA FLOW

```
SIGNUP
├─ User registers via Supabase Auth
├─ Trigger: auto-create user_profiles record
└─ User logged in ✓

TAKE LIVE EXAM
├─ Student views live_exams (filtered by chapter_id)
├─ Student sees live_test_questions for exam_id
├─ Student answers questions
├─ Student's answers saved to user_live_test_progress
├─ Score calculated on submit
└─ Rewards (coins, xp) added to user_profiles ✓

DO DPP PRACTICE
├─ Student selects topic
├─ DPP questions loaded (where isLivePractice = true)
├─ Answers tracked in state
├─ On submit: user_dpp_progress updated
├─ Score calculated
└─ Rewards granted ✓

TAKE MOCK TEST
├─ Mock test questions loaded from mock_tests
├─ Student answers
├─ Score saved to user_test_scores
├─ Leaderboard updated
└─ Results displayed ✓
```

## 🔧 MAINTENANCE CHECKLIST

- [ ] Schema file backed up
- [ ] All 13 tables created
- [ ] All 20+ indexes active
- [ ] RLS policies enabled
- [ ] Triggers working
- [ ] Sample data loaded (optional)
- [ ] Admin can create content
- [ ] Students can view content
- [ ] Students can submit scores
- [ ] Leaderboards working

## ⚠️ COMMON ERRORS & FIXES

| Error | Cause | Fix |
|-------|-------|-----|
| "Could not find 'chapter_id'" | Column missing | Run schema-main.sql |
| "violates row level security" | RLS policy issue | Check auth.uid() |
| "Foreign key violation" | Parent record missing | Create parent first |
| "duplicate key value" | Unique constraint | Use ON CONFLICT or check ID |
| "relation does not exist" | Table not created | Run full schema file |

## 📝 KEY TYPES

```typescript
// Live Exam Status Flow
type ExamStatus = 'Draft' | 'Scheduled' | 'Published' | 'Live' | 'Completed';

// Question Types
type QuestionType = 'MCQ' | 'MSQ' | 'AssertionReason' | 'MatrixMatch';

// Answer Format (in user_live_test_progress)
type Answers = Record<questionId: string, answerIndex: number>;

// Score Calculation
const score = correctAnswers * 4;  // 4 marks per question default
const accuracy = (correctAnswers / totalQuestions) * 100;
```

## 🎯 PART BREAKDOWN

| Part | Focus | Tables | Purpose |
|------|-------|--------|---------|
| 1-2 | Setup & Auth | 1 | User foundation |
| 3 | Catalog | 4 | Content structure |
| 4-5 | Live Exams | 3 | Scheduled tests |
| 6-7 | Tests | 4 | Mock tests & scoring |
| 8 | Performance | - | Indexes |
| 9 | Security | - | RLS policies |
| 10 | Permissions | - | Access control |
| 11 | Sample Data | - | Test data |
| 12 | Verification | - | Confirmation |

## 🔗 RELATIONSHIPS

```
subjects (1) ────────── (N) chapters
                         │
                         └───── (N) topics
                                  │
                                  └───── (N) dpp_questions

live_exams ──────────── (N) live_test_questions
   │
   ├─ subject_id → subjects
   └─ chapter_id → chapters

user_profiles (1) ────── (N) user_dpp_progress
                         (N) user_test_scores
                         (N) user_live_test_progress
```

## 📊 STATISTICS

- Total Tables: **13**
- Total Columns: **80+**
- Total Indexes: **20+**
- RLS Policies: **25+**
- Triggers: **2**
- Functions: **2**
- Constraints: **50+**

## ✅ VERIFICATION

After running schema-main.sql, you should see:

```
"OwnSkill Database Schema Setup Complete! ✓ 
All tables, policies, triggers, and indexes created successfully."
```

## 🎓 NEXT STEPS

1. ✅ Run `schema-main.sql` in Supabase
2. ✅ Load sample data (PART 11)
3. ✅ Create Supabase client in React
4. ✅ Test live exam creation
5. ✅ Test DPP functionality
6. ✅ Deploy to production

---

**Version:** 1.0  
**Date:** May 30, 2026  
**Status:** Production Ready ✓
