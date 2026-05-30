// ============================================================================
// LIVE TEST INTERFACES - Complete Type Definitions
// Location: src/context/AppContext.tsx
// ============================================================================

/**
 * Live Exam Object - Represents a scheduled live test
 * Maps to 'live_exams' table in Supabase
 */
export interface LiveExam {
  id: string;                           // Unique identifier (l-{timestamp})
  title: string;                        // Exam title (e.g., "Physics Chapter 1")
  description?: string;                 // Optional description
  durationMinutes: number;              // Duration in minutes (default: 60)
  isActive: boolean;                    // Is test currently active?
  pdfUrl?: string;                      // Optional PDF attachment URL
  scheduledStart?: string;              // ISO timestamp for scheduled start
  status?: 'Draft' | 'Scheduled' | 'Published' | 'Live' | 'Completed';
  subjectId?: string;                   // Links to subjects table (optional)
  chapterId?: string;                   // Links to chapters table (optional)
}

/**
 * Live Test Question - Individual question in a live test
 * Maps to 'live_test_questions' table in Supabase
 */
export interface LiveTestQuestion {
  id: string;                           // Unique identifier (ltq-{timestamp})
  examId: string;                       // Foreign key to live_exams
  question: string;                     // Question text
  options: string[];                    // Array of options (0-indexed)
  correctAnswer: number;                // Index of correct option
  explanation?: string;                 // Optional explanation
  marks: number;                        // Points for this question (default: 4)
  questionOrder: number;                // Display order (0-based)
  tags?: string[];                      // Topic tags
  pdfUrl?: string;                      // Optional PDF attachment
  isLivePractice?: boolean;             // Is this a live practice question?
}

/**
 * DPP Question - Daily Practice Problem
 * Maps to 'dpp_questions' table OR internal storage
 */
export interface DppQuestion {
  id: string;                           // Unique identifier
  chapterId: string;                    // Links to chapters table
  type: 'MCQ' | 'MSQ' | 'AssertionReason' | 'MatrixMatch';
  question: string;                     // Question text
  options: string[];                    // Answer options
  answer: string | number;              // Correct answer (index or indices for MSQ)
  explanation: string;                  // Solution explanation
  tags?: string[];                      // Topic tags
  pdfUrl?: string;                      // Optional PDF attachment
  isLivePractice?: boolean;             // Mark as live practice question
}

/**
 * User Live Test Progress - Real-time tracking
 * Maps to 'user_live_test_progress' table in Supabase
 */
export interface UserLiveTestProgress {
  id: string;                           // UUID
  userId: string;                       // Foreign key to user
  examId: string;                       // Foreign key to live_exams
  answers: Record<string, number>;      // Question ID → Answer index mapping
  isSubmitted: boolean;                 // Has user submitted?
  score?: number;                       // Final score
  maxScore?: number;                    // Total marks
  timeTaken?: number;                   // Time taken in seconds
  createdAt: string;                    // Created timestamp
  updatedAt: string;                    // Last updated timestamp
}

// ============================================================================
// LIVE TEST CONTEXT FUNCTIONS
// ============================================================================

/**
 * Create a new live exam
 * @param exam - Exam object without ID
 */
const addLiveExam = async (exam: Omit<LiveExam, 'id'>) => {
  // Creates: live_exams.insert()
};

/**
 * Add a question to a live exam
 * @param question - Question object without ID
 */
const addLiveTestQuestion = async (question: Omit<LiveTestQuestion, 'id'>) => {
  // Creates: live_test_questions.insert()
};

/**
 * Update a live exam's status (Draft → Published → Live → Completed)
 * @param id - Exam ID
 * @param status - New status
 * @param scheduledStart - Optional start time
 */
const updateLiveExamStatus = async (
  id: string,
  status: 'Draft' | 'Scheduled' | 'Published' | 'Live' | 'Completed',
  scheduledStart?: string
) => {
  // Updates: live_exams.update()
};

/**
 * Sync student's answers and score in real-time
 * @param examId - Exam ID
 * @param answers - Question ID → Answer mapping
 * @param isSubmitted - Whether submission is final
 * @param score - Points earned (optional)
 * @param maxScore - Total possible points (optional)
 * @param timeTaken - Seconds spent (optional)
 */
const syncLiveTestAnswer = async (
  examId: string,
  answers: Record<string, number>,
  isSubmitted: boolean,
  score?: number,
  maxScore?: number,
  timeTaken?: number
) => {
  // Updates/Inserts: user_live_test_progress.upsert()
};

/**
 * Fetch leaderboard for a live test
 * @param examId - Exam ID
 * @returns Array of top scorers with ranks
 */
const fetchLiveTestLeaderboard = async (examId: string): Promise<any[]> => {
  // Queries: user_live_test_progress + profiles
};

// ============================================================================
// USAGE IN DPPRACTICE COMPONENT
// ============================================================================

// 1. SELECT MODE - Choose subject and chapter
const [selectedSubj, setSelectedSubj] = useState('');
const [selectedChap, setSelectedChap] = useState('');

// 2. LOAD QUESTIONS
const handleLaunchDpp = () => {
  const qs = dppQuestions.filter(q => q.chapterId === selectedChap);
  
  // Check for live practice questions
  const liveQuestions = qs.filter(q => q.isLivePractice);
  if (liveQuestions.length > 0) {
    setMode('live');
    setQuizQuestions(liveQuestions);
  } else {
    setMode('quiz');
    setQuizQuestions(qs);
  }
};

// 3. ANSWER TRACKING
const handleOptionSelect = (optionIdx: number) => {
  const q = quizQuestions[currentIdx];
  setAnswers(prev => ({
    ...prev,
    [q.id]: optionIdx  // Track: QuestionID → AnswerIndex
  }));
};

// 4. SUBMISSION & SCORING
const handleSubmitQuiz = () => {
  let correct = 0;
  quizQuestions.forEach(q => {
    if (answers[q.id] === q.answer) correct++;
  });
  
  const coinsReward = correct * 10;
  const xpReward = correct * 20;
  addCoinsAndXp(coinsReward, xpReward);
  
  setMode('report');
};

// ============================================================================
// DATABASE SCHEMA (PostgreSQL)
// ============================================================================

-- live_exams table
CREATE TABLE IF NOT EXISTS live_exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT false,
  pdf_url TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'Draft',
  subject_id TEXT,
  chapter_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- live_test_questions table
CREATE TABLE IF NOT EXISTS live_test_questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT REFERENCES live_exams(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  marks INTEGER DEFAULT 4,
  question_order INTEGER DEFAULT 0,
  tags TEXT[],
  pdf_url TEXT,
  is_live_practice BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_live_test_progress table
CREATE TABLE IF NOT EXISTS user_live_test_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_id TEXT REFERENCES live_exams(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '{}',
  is_submitted BOOLEAN DEFAULT FALSE,
  score INTEGER,
  max_score INTEGER,
  time_taken INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exam_id)
);

// ============================================================================
// COMPONENT MODES
// ============================================================================

type Mode = 'select' | 'quiz' | 'report' | 'live';

/**
 * SELECT MODE
 * - User chooses Subject → Chapter
 * - Displays available question sets
 * - Triggers launch of selected quiz
 */

/**
 * LIVE PRACTICE MODE
 * - Questions displayed without timer
 * - PDF support for each question
 * - Unlimited answer changes
 * - Real-time progress tracking
 */

/**
 * QUIZ MODE
 * - Timed mode (5 minutes default)
 * - Question navigation (Previous/Next)
 * - Scientific calculator available
 * - Auto-submit on timeout
 */

/**
 * REPORT MODE
 * - Score display
 * - Accuracy percentage
 * - XP/Coin rewards
 * - Subject breakdown
 */

// ============================================================================
// INTEGRATION WITH LIVETESTS COMPONENT
// ============================================================================

/**
 * LiveTests.tsx uses same types:
 * - LiveExam
 * - LiveTestQuestion
 * - Same scoring logic
 * - Same leaderboard fetch
 * 
 * Main differences:
 * - LiveTests: Scheduled for specific times, shows status
 * - DppPractice: On-demand DPP with live practice option
 */

// ============================================================================
// ERROR HANDLING
// ============================================================================

try {
  await supabase
    .from('live_exams')
    .select('*')
    .eq('chapter_id', chapterId); // This query now works!
} catch (error) {
  bridge.showToast('Failed to load exam: ' + error.message);
  // Falls back to localStorage
}

// ============================================================================
// LOCAL STORAGE BACKUP
// ============================================================================

// Saves to localStorage for offline support:
- 'ownskill_liveexams' - All live exams
- 'ownskill_livetestqs' - All live test questions
- 'live_progress_{examId}' - Individual progress per exam

// ============================================================================
// TESTING SCENARIOS
// ============================================================================

Scenario 1: Create DPP Question marked as Live Practice
  1. Admin creates question with isLivePractice: true
  2. Student opens DPP
  3. System detects live practice questions
  4. Automatically switches to 'live' mode
  ✓ Questions display without timer

Scenario 2: Complete Live Practice and Get Rewards
  1. Student answers all questions in live mode
  2. Clicks "Submit Answers"
  3. System calculates score
  4. Coins and XP added to profile
  5. Report displays analytics
  ✓ Rewards granted and profile updated

Scenario 3: PDF Support in Live Practice
  1. Question has pdfUrl provided
  2. Student sees "PDF" button
  3. Clicks to open PDF viewer
  4. Views full question image/diagram
  5. Returns to continue answering
  ✓ PDF displays correctly

// ============================================================================
// COMPLETE - NO ERRORS
// ============================================================================
