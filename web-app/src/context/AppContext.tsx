import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAndroidBridge } from '../hooks/useAndroidBridge';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

// Define Types for state catalog objects
export interface Subject {
  id: string;
  name: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
}

export interface DppQuestion {
  id: string;
  chapterId: string;
  type: 'MCQ' | 'MSQ' | 'AssertionReason' | 'MatrixMatch';
  question: string;
  options: string[];
  answer: string | number; // Option indices
  explanation: string;
  tags?: string[];
  pdfUrl?: string; // PDF attachment for the question
  isLivePractice?: boolean; // Whether this is for live practice
}

export interface MockTest {
  id: string;
  title: string;
  duration: number; // in minutes
  totalMarks: number;
  isPublished?: boolean;
}

export interface LiveExam {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  isActive: boolean;
  pdfUrl?: string;
  scheduledStart?: string;
  status?: 'Draft' | 'Scheduled' | 'Published' | 'Live' | 'Completed';
  subjectId?: string;
  chapterId?: string;
}

export interface LiveTestQuestion {
  id: string;
  examId: string;
  type?: 'MCQ' | 'SAQ';
  question: string;
  options: string[];
  correctAnswer: string | number;
  explanation?: string;
  marks: number;
  questionOrder: number;
  tags?: string[];
  pdfUrl?: string;
  isLivePractice?: boolean;
}

export interface User {
  name: string;
  role?: string;
  isBanned?: boolean;
}

export interface ChatMessage {
  sender: string;
  text: string;
  type: 'sent' | 'received';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'academic' | 'consistency' | 'mastery' | 'social';
  unlockedAt: string;
  xpReward: number;
  coinReward: number;
}

export interface CoinTransaction {
  id: string;
  type: 'earned' | 'spent';
  amount: number;
  reason: string;
  timestamp: string;
}

export interface PerformanceDataPoint {
  date: string;
  accuracy: number;
  completion: number;
  xpEarned: number;
  dppsCompleted: number;
}

export interface GraphData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'area';
  dataPoints: PerformanceDataPoint[];
  color: string;
}

export interface AppState {
  user: User | null;
  username: string;
  coins: number;
  xp: number;
  streak: number;
  userGoal: string;
  userSubjects: string[];
  accentTheme: string;
  activeTab: 'dashboard' | 'dpp' | 'tests' | 'visualizer' | 'more';
  isDarkMode: boolean;
  tasksCompleted: number[];
  completedDppChapters: string[];
  unlockedThemes: string[];
  savedArticles: string[];
  savedFormulas: string[];
  chatMessages: ChatMessage[];
  isMaintenanceMode: boolean;
  activeProfileSubTab?: 'profile' | 'articles';
  activeArticleId?: string | null;
  notifications: AppNotification[];
  achievements: Achievement[];
  coinTransactions: CoinTransaction[];
  performanceGraphs: GraphData[];
}

interface AppContextType {
  state: AppState;
  subjects: Subject[];
  chapters: Chapter[];
  dppQuestions: DppQuestion[];
  mockTests: MockTest[];
  liveExams: LiveExam[];
  liveTestQuestions: LiveTestQuestion[];
  usersList: User[];
  storageFiles: string[];
  logs: string[];
  
  // State Mutators
  loginUser: (username: string) => void;
  logoutUser: () => void;
  updateState: (updater: Partial<AppState> | ((prev: AppState) => AppState)) => void;
  addCoinsAndXp: (coins: number, xp: number) => void;
  toggleTheme: (isDark: boolean) => void;
  setAccentColor: (hslStr: string) => void;
  
  // Fake Data Management
  addAchievement: (achievement: Omit<Achievement, 'id'>) => void;
  deleteAchievement: (id: string) => void;
  addCoinTransaction: (transaction: Omit<CoinTransaction, 'id'>) => void;
  deleteCoinTransaction: (id: string) => void;
  addPerformanceGraph: (graph: Omit<GraphData, 'id'>) => void;
  deletePerformanceGraph: (id: string) => void;
  initializeStudentData: () => void;
  
  // CMS CRUD handlers
  addSubject: (name: string) => void;
  deleteSubject: (id: string) => void;
  addChapter: (subjectId: string, name: string) => void;
  deleteChapter: (id: string) => void;
  addDppQuestion: (question: Omit<DppQuestion, 'id'>) => void;
  updateDppQuestion: (id: string, updates: Partial<Omit<DppQuestion, 'id' | 'chapterId'>>) => void;
  deleteDppQuestion: (id: string) => void;
  addMockTest: (test: Omit<MockTest, 'id'>) => void;
  addLiveExam: (exam: Omit<LiveExam, 'id'>) => void;
  deleteLiveExam: (id: string) => void;
  toggleLiveExamActive: (id: string) => void;
  updateLiveExamStatus: (id: string, status: 'Draft' | 'Scheduled' | 'Published' | 'Live' | 'Completed', scheduledStart?: string) => Promise<void>;
  syncLiveTestAnswer: (examId: string, answers: Record<string, string | number>, isSubmitted: boolean, score?: number, maxScore?: number, timeTaken?: number) => Promise<void>;
  fetchLiveTestLeaderboard: (examId: string) => Promise<any[]>;
  addLiveTestQuestion: (question: Omit<LiveTestQuestion, 'id'>) => void;
  updateLiveTestQuestion: (id: string, updates: Partial<Omit<LiveTestQuestion, 'id' | 'examId'>>) => void;
  deleteLiveTestQuestion: (id: string) => void;
  updateUserRole: (name: string, role: string) => void;
  toggleUserBan: (name: string) => void;
  uploadStorageFile: (filename: string) => void;
  deleteStorageFile: (filename: string) => void;
  addSystemLog: (msg: string) => void;
  clearSystemLogs: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultState: AppState = {
  user: null,
  username: "",
  coins: 0,
  xp: 0,
  streak: 0,
  userGoal: "foundation",
  userSubjects: [],
  accentTheme: "hsl(262, 80%, 55%)",
  activeTab: "dashboard",
  isDarkMode: true,
  tasksCompleted: [],
  completedDppChapters: [],
  unlockedThemes: ["default-violet"],
  savedArticles: [],
  savedFormulas: [],
  chatMessages: [],
  isMaintenanceMode: false,
  activeProfileSubTab: "profile",
  notifications: [],
  achievements: [],
  coinTransactions: [],
  performanceGraphs: [],
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const bridge = useAndroidBridge();
  
  // Core State
  const [state, setState] = useState<AppState>(() => {
    const cached = localStorage.getItem('ownskill_react_state');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Reset fake data fields to 0 to ensure clean state
        return { 
          ...defaultState, 
          ...parsed,
          streak: 0,
          coins: 0,
          xp: 0,
          achievements: [],
          coinTransactions: [],
          performanceGraphs: []
        };
      } catch (e) {
        console.error("Local db corrupt.");
      }
    }
    return defaultState;
  });

  // Load user profile from database on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profileData, error } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
              if (profileData && !error) {
                localStorage.setItem('user_profile', JSON.stringify(profileData));
                setState(prev => ({
                  ...prev,
                  username: profileData.username,
                  coins: profileData.coins,
                  xp: profileData.xp,
                  streak: profileData.streak,
                  userGoal: profileData.user_goal,
                  userSubjects: profileData.user_subjects || [],
                  accentTheme: profileData.accent_theme,
                  isDarkMode: profileData.is_dark_mode,
                  tasksCompleted: profileData.tasks_completed || [],
                  completedDppChapters: profileData.completed_dpp_topics || [],
                  unlockedThemes: profileData.unlocked_themes || [],
                  savedArticles: profileData.saved_articles || [],
                  savedFormulas: profileData.saved_formulas || [],
                }));
              }
            }
        } catch (err) {
          console.error('Failed to securely load user profile:', err);
        }
      }
    };
    
    loadUserProfile();
  }, []);

  // Sync user state to database
  const syncUserProfile = async (currentState: AppState) => {
    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { error } = await supabase
            .from('user_profiles')
            .update({
              username: currentState.username,
                coins: currentState.coins,
                xp: currentState.xp,
                streak: currentState.streak,
                user_goal: currentState.userGoal,
                user_subjects: currentState.userSubjects,
                accent_theme: currentState.accentTheme,
                is_dark_mode: currentState.isDarkMode,
                tasks_completed: currentState.tasksCompleted,
                completed_dpp_topics: currentState.completedDppChapters,
                unlocked_themes: currentState.unlockedThemes,
                saved_articles: currentState.savedArticles,
              saved_formulas: currentState.savedFormulas,
              is_maintenance_mode: currentState.isMaintenanceMode
            })
            .eq('id', session.user.id);
            
          if (error) {
            console.error('Failed to securely sync profile:', error);
            }
        }
      } catch (err) {
        console.error('Exception securely syncing profile:', err);
      }
    }
  };

  const parseSafeArray = <T,>(key: string, defaultVal: T[]): T[] => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return defaultVal;
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed) ? parsed : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const [subjects, setSubjects] = useState<Subject[]>(() => parseSafeArray('ownskill_subjects', []));
  const [chapters, setChapters] = useState<Chapter[]>(() => parseSafeArray('ownskill_chapters', []));
  const [dppQuestions, setDppQuestions] = useState<DppQuestion[]>(() => parseSafeArray('ownskill_questions', []));
  const [mockTests, setMockTests] = useState<MockTest[]>(() => parseSafeArray('ownskill_mocktests', []));
  const [liveExams, setLiveExams] = useState<LiveExam[]>(() => parseSafeArray('ownskill_liveexams', []));
  const [liveTestQuestions, setLiveTestQuestions] = useState<LiveTestQuestion[]>(() => parseSafeArray('ownskill_livetestqs', []));
  const [usersList, setUsersList] = useState<User[]>(() => parseSafeArray('ownskill_users', []));
  const [storageFiles, setStorageFiles] = useState<string[]>(() => parseSafeArray('ownskill_storage', []));
  const [logs, setLogs] = useState<string[]>(() => parseSafeArray('ownskill_logs', ["[SYSTEM] Database dynamic binding initialized successfully."]));

  // Persists local caches on state alterations
  useEffect(() => {
    localStorage.setItem('ownskill_react_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('ownskill_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('ownskill_chapters', JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    localStorage.setItem('ownskill_questions', JSON.stringify(dppQuestions));
  }, [dppQuestions]);

  useEffect(() => {
    localStorage.setItem('ownskill_mocktests', JSON.stringify(mockTests));
  }, [mockTests]);

  useEffect(() => {
    localStorage.setItem('ownskill_liveexams', JSON.stringify(liveExams));
  }, [liveExams]);

  useEffect(() => {
    localStorage.setItem('ownskill_livetestqs', JSON.stringify(liveTestQuestions));
  }, [liveTestQuestions]);

  useEffect(() => {
    localStorage.setItem('ownskill_users', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem('ownskill_storage', JSON.stringify(storageFiles));
  }, [storageFiles]);

  useEffect(() => {
    localStorage.setItem('ownskill_logs', JSON.stringify(logs));
  }, [logs]);

  // Synchronizes accent colors in index.css dynamically
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', state.accentTheme);
    const match = state.accentTheme.match(/\d+/);
    const h = match ? parseInt(match[0]) : 262;
    document.documentElement.style.setProperty('--accent-color-rgb', 
      h === 262 ? "108, 38, 242" : h === 142 ? "16, 185, 129" : h === 24 ? "245, 158, 11" : "59, 130, 246"
    );
  }, [state.accentTheme]);

  // Handles responsive dark mode theme class toggling
  useEffect(() => {
    if (state.isDarkMode) {
      document.body.classList.remove('light-theme');
      bridge.updateThemeColor("#070913", "#101427");
    } else {
      document.body.classList.add('light-theme');
      bridge.updateThemeColor("#f3f4f6", "#ffffff");
    }
  }, [state.isDarkMode, bridge]);

  // Note: Real-time sync via useEffect removed as it now syncs directly inside updateState.

  // Synchronizes all Syllabus and CMS arrays dynamically from the cloud database
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const fetchDatabaseData = async () => {
      try {
        // 1. Subjects
        const { data: subs, error: errSubs } = await supabase.from('subjects').select('*');
        if (!errSubs && subs) {
          setSubjects(subs);
          localStorage.setItem('ownskill_subjects', JSON.stringify(subs));
        }

        // 2. Chapters
        const { data: chaps, error: errChaps } = await supabase.from('chapters').select('*');
        if (!errChaps && chaps) {
          const formattedChaps = chaps.map((c: any) => ({
            id: c.id,
            subjectId: c.subject_id,
            name: c.name
          }));
          setChapters(formattedChaps);
          localStorage.setItem('ownskill_chapters', JSON.stringify(formattedChaps));
        }

        // 3. DPP Questions (with pdfUrl)
        const { data: qns, error: errQns } = await supabase.from('dpp_questions').select('*');
        if (!errQns && qns) {
          const formattedQns = qns.map((q: any) => ({
            id: q.id,
            chapterId: q.chapter_id,
            type: q.type,
            question: q.question,
            options: q.options,
            answer: isNaN(Number(q.answer)) ? q.answer : Number(q.answer),
            explanation: q.explanation,
            tags: q.tags,
            pdfUrl: q.pdf_url || undefined
          }));
          setDppQuestions(formattedQns);
          localStorage.setItem('ownskill_questions', JSON.stringify(formattedQns));
        }

        // 4. Mock Tests
        const { data: tests, error: errTests } = await supabase.from('mock_tests').select('*');
        if (!errTests && tests) {
          const formattedTests = tests.map((t: any) => ({
            id: t.id,
            title: t.title,
            duration: t.duration,
            totalMarks: t.total_marks,
            isPublished: t.is_published
          }));
          setMockTests(formattedTests);
          localStorage.setItem('ownskill_mocktests', JSON.stringify(formattedTests));
        }

        // 5. Live Exams (with pdfUrl)
        const { data: exams, error: errExams } = await supabase.from('live_exams').select('*');
        if (!errExams && exams) {
          const formattedExams = exams.map((e: any) => ({
            id: e.id,
            title: e.title,
            description: e.description || undefined,
            durationMinutes: e.duration_minutes || 60,
            isActive: e.is_active || false,
            pdfUrl: e.pdf_url || undefined,
            scheduledStart: e.scheduled_start || undefined,
            status: e.status || 'Draft',
            subjectId: e.subject_id || undefined,
            chapterId: e.chapter_id || undefined
          }));
          setLiveExams(formattedExams);
          localStorage.setItem('ownskill_liveexams', JSON.stringify(formattedExams));
        }

        // 5b. Live Test Questions
        const { data: ltqs, error: errLtqs } = await supabase.from('live_test_questions').select('*');
        if (!errLtqs && ltqs) {
          const formattedLtqs = ltqs.map((q: any) => ({
            id: q.id,
            examId: q.exam_id,
            question: q.question,
            options: q.options,
            correctAnswer: Number(q.correct_answer),
            explanation: q.explanation || undefined,
            marks: q.marks || 4,
            questionOrder: q.question_order || 0,
            tags: q.tags || undefined,
            pdfUrl: q.pdf_url || undefined,
            isLivePractice: q.is_live_practice || false
          }));
          setLiveTestQuestions(formattedLtqs);
          localStorage.setItem('ownskill_livetestqs', JSON.stringify(formattedLtqs));
        }

        // 6. Users List
        const { data: profiles, error: errProfiles } = await supabase.from('user_profiles').select('*');
        if (!errProfiles && profiles) {
          const formattedProfiles = profiles.map((p: any) => ({
            name: p.username,
            role: 'Student',
            isBanned: false
          }));
          setUsersList(formattedProfiles);
          localStorage.setItem('ownskill_users', JSON.stringify(formattedProfiles));
        }

        addSystemLog("[DATABASE] Successfully synchronized workspace databases from cloud container.");
      } catch (e: any) {
        console.error("Supabase dynamic synchronizer failure:", e);
        addSystemLog(`[DATABASE] Sync failure: ${e.message || e}`);
      }
    };

    fetchDatabaseData();
  }, []); // Run once on mount — fetches all CMS data for both admin and student

  // State Mutators
  const loginUser = (username: string) => {
    const formatted = username.trim() || "Student";
    const userObj = { name: formatted, role: 'Student', isBanned: false };
    setState(prev => ({
      ...prev,
      username: formatted,
      user: userObj
    }));
    // Register user inside the lists directory if not already there
    setUsersList(prev => {
      if (prev.some(u => u.name === formatted)) return prev;
      return [...prev, userObj];
    });
    addSystemLog(`[AUTH] Student login session started: ${formatted}`);
  };

  const logoutUser = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn("Supabase signout issue", e);
    }
    localStorage.removeItem('user_profile');
    setState(prev => ({
      ...prev,
      user: null
    }));
    addSystemLog("[AUTH] Session securely signed out.");
  };

  const updateState = (updater: Partial<AppState> | ((prev: AppState) => AppState)) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const newState = { ...prev, ...next };
      
      // Sync to database
      syncUserProfile(newState);
      
      return newState;
    });
  };

  const addCoinsAndXp = (coinsToAdd: number, xpToAdd: number) => {
    setState(prev => ({
      ...prev,
      coins: prev.coins + coinsToAdd,
      xp: prev.xp + xpToAdd
    }));
    addSystemLog(`[REWARDS] Earned +${coinsToAdd} Coins and +${xpToAdd} XP`);
  };

  const toggleTheme = (isDark: boolean) => {
    setState(prev => ({ ...prev, isDarkMode: isDark }));
  };

  const setAccentColor = (hslStr: string) => {
    setState(prev => ({ ...prev, accentTheme: hslStr }));
  };

  // SYSTEM LOGS
  const addSystemLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const addAppNotification = (title: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setState(prev => ({
      ...prev,
      notifications: [
        {
          id: `n-${Date.now()}`,
          title,
          message,
          timestamp,
          isRead: false
        },
        ...(prev.notifications || [])
      ]
    }));
  };
  
  const clearSystemLogs = () => {
    setLogs([]);
  };

  // Fake Data Management Functions
  const addAchievement = (achievement: Omit<Achievement, 'id'>) => {
    const newAchievement = { ...achievement, id: `ach-${Date.now()}` };
    setState(prev => ({
      ...prev,
      achievements: [...prev.achievements, newAchievement]
    }));
    addSystemLog(`[ACHIEVEMENT] Unlocked: ${achievement.title}`);
  };

  const deleteAchievement = (id: string) => {
    setState(prev => ({
      ...prev,
      achievements: prev.achievements.filter(a => a.id !== id)
    }));
    addSystemLog(`[ACHIEVEMENT] Deleted: ${id}`);
  };

  const addCoinTransaction = (transaction: Omit<CoinTransaction, 'id'>) => {
    const newTransaction = { ...transaction, id: `tx-${Date.now()}` };
    setState(prev => ({
      ...prev,
      coinTransactions: [newTransaction, ...prev.coinTransactions],
      coins: transaction.type === 'earned' ? prev.coins + transaction.amount : prev.coins - transaction.amount
    }));
    addSystemLog(`[COINS] ${transaction.type}: ${transaction.amount} - ${transaction.reason}`);
  };

  const deleteCoinTransaction = (id: string) => {
    setState(prev => ({
      ...prev,
      coinTransactions: prev.coinTransactions.filter(t => t.id !== id)
    }));
    addSystemLog(`[COINS] Transaction deleted: ${id}`);
  };

  const addPerformanceGraph = (graph: Omit<GraphData, 'id'>) => {
    const newGraph = { ...graph, id: `graph-${Date.now()}` };
    setState(prev => ({
      ...prev,
      performanceGraphs: [...prev.performanceGraphs, newGraph]
    }));
    addSystemLog(`[GRAPH] Created: ${graph.title}`);
  };

  const deletePerformanceGraph = (id: string) => {
    setState(prev => ({
      ...prev,
      performanceGraphs: prev.performanceGraphs.filter(g => g.id !== id)
    }));
    addSystemLog(`[GRAPH] Deleted: ${id}`);
  };

  // Initialize student with clean state (no fake data)
  const initializeStudentData = () => {
    setState(prev => {
      addSystemLog("[INIT] Student account initialized with clean state");
      return {
        ...prev,
        coins: 0,
        xp: 0,
        streak: 0,
        achievements: [],
        coinTransactions: [],
        performanceGraphs: []
      };
    });
  };

  // CMS CRUD handlers
  const addSubject = async (name: string) => {
    const newId = `s-${Date.now()}`;
    const newSub = { id: newId, name };
    
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('subjects').insert([{ id: newId, name }]);
        if (error) {
          bridge.showToast(error.message);
          return;
        }
      } catch (err: any) {
        bridge.showToast(err.message || "Failed to save subject.");
        return;
      }
    }
    setSubjects(prev => [...prev, newSub]);
    addSystemLog(`[Syllabus] Subject added: ${name}`);
    addAppNotification("Syllabus Published", `A brand new subject "${name}" is now live! Update your preferences to start practicing.`);
  };

  const deleteSubject = async (id: string) => {
    const target = subjects.find(s => s.id === id);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) {
          bridge.showToast(error.message);
          return;
        }
      } catch (err: any) {
        bridge.showToast(err.message || "Failed to delete subject.");
        return;
      }
    }
    setSubjects(prev => prev.filter(s => s.id !== id));
    setChapters(prev => prev.filter(c => c.subjectId !== id)); // Cascade
    if (target) addSystemLog(`[Syllabus] Subject deleted: ${target.name}`);
  };

  const addChapter = async (subjectId: string, name: string) => {
    const newId = `c-${Date.now()}`;
    const newChap = { id: newId, subjectId, name };
    
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('chapters').insert([{ id: newId, subject_id: subjectId, name }]);
        if (error) {
          bridge.showToast(error.message);
          return;
        }
      } catch (err: any) {
        bridge.showToast(err.message || "Failed to save chapter.");
        return;
      }
    }
    setChapters(prev => [...prev, newChap]);
    addSystemLog(`[Syllabus] Chapter added: ${name}`);
    addAppNotification("Chapter Released", `A new chapter "${name}" is now available in your syllabus catalog.`);
  };

  const deleteChapter = async (id: string) => {
    const target = chapters.find(c => c.id === id);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('chapters').delete().eq('id', id);
        if (error) {
          bridge.showToast(error.message);
          return;
        }
      } catch (err: any) {
        bridge.showToast(err.message || "Failed to delete chapter.");
        return;
      }
    }
    setChapters(prev => prev.filter(c => c.id !== id));
    setDppQuestions(prev => prev.filter(q => q.chapterId !== id)); // Cascade
    if (target) addSystemLog(`[Syllabus] Chapter deleted: ${target.name}`);
  };

  const addDppQuestion = async (q: Omit<DppQuestion, 'id'>) => {
    const newId = `q-${Date.now()}`;
    const newQ = { ...q, id: newId };
    
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('dpp_questions').insert([{ 
          id: newId, 
          chapter_id: q.chapterId, 
          type: q.type, 
          question: q.question, 
          options: q.options, 
          answer: q.answer.toString(), 
          explanation: q.explanation, 
          tags: q.tags || [],
          pdf_url: q.pdfUrl || null,
          is_live_practice: q.isLivePractice || false
        }]);
        if (error) {
          bridge.showToast(error.message);
          return;
        }
      } catch (err: any) {
        bridge.showToast(err.message || "Failed to save question.");
        return;
      }
    }
    setDppQuestions(prev => [...prev, newQ]);
    addSystemLog(`[DPP CMS] Question added to Chapter ID: ${q.chapterId}`);
    addAppNotification("📝 New DPP Question Published", `A new practice question has been added to the question bank. Check the DPP section to practice!`);
  };

  const updateDppQuestion = async (id: string, updates: Partial<Omit<DppQuestion, 'id' | 'chapterId'>>) => {
    if (isSupabaseConfigured) {
      try {
        const payload: any = {};
        if (updates.type !== undefined) payload.type = updates.type;
        if (updates.question !== undefined) payload.question = updates.question;
        if (updates.options !== undefined) payload.options = updates.options;
        if (updates.answer !== undefined) payload.answer = updates.answer.toString();
        if (updates.explanation !== undefined) payload.explanation = updates.explanation;
        if (updates.tags !== undefined) payload.tags = updates.tags;
        if (updates.pdfUrl !== undefined) payload.pdf_url = updates.pdfUrl;
        if (updates.isLivePractice !== undefined) payload.is_live_practice = updates.isLivePractice;
        
        const { error } = await supabase.from('dpp_questions').update(payload).eq('id', id);
        if (error) { bridge.showToast(error.message); return; }
      } catch (err: any) { bridge.showToast(err.message || "Failed to update question."); return; }
    }
    setDppQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    addSystemLog(`[DPP CMS] Question updated: ${id}`);
  };

  const deleteDppQuestion = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('dpp_questions').delete().eq('id', id);
        if (error) {
          bridge.showToast(error.message);
          return;
        }
      } catch (err: any) {
        bridge.showToast(err.message || "Failed to delete question.");
        return;
      }
    }
    setDppQuestions(prev => prev.filter(q => q.id !== id));
    addSystemLog(`[DPP CMS] Question ID: ${id} deleted.`);
  };

  const addMockTest = async (test: Omit<MockTest, 'id'>) => {
    const newId = `m-${Date.now()}`;
    const newTest = { ...test, id: newId, isPublished: test.isPublished ?? false };
    
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('mock_tests').insert([{ 
          id: newId, 
          title: test.title, 
          duration: test.duration, 
          total_marks: test.totalMarks, 
          is_published: test.isPublished ?? false 
        }]);
        if (error) {
          bridge.showToast(error.message);
          return;
        }
      } catch (err: any) {
        bridge.showToast(err.message || "Failed to save test.");
        return;
      }
    }
    setMockTests(prev => [...prev, newTest]);
    addSystemLog(`[Mock CMS] Compiled Test: ${test.title}`);
    addAppNotification("🧪 New Mock Test Available", `A new timed battle "${test.title}" (${test.duration} min, ${test.totalMarks} marks) has been published! Join the Battle Arena to compete.`);
  };

  const addLiveExam = async (exam: Omit<LiveExam, 'id'>) => {
    const newId = `l-${Date.now()}`;
    const newExam = { 
      ...exam, 
      id: newId, 
      status: exam.status || 'Draft', 
      scheduledStart: exam.scheduledStart || undefined,
      subjectId: exam.subjectId || undefined,
      chapterId: exam.chapterId || undefined
    };
    
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('live_exams').insert([{ 
          id: newId, 
          title: exam.title,
          description: exam.description || null,
          duration_minutes: exam.durationMinutes,
          is_active: exam.isActive,
          pdf_url: exam.pdfUrl || null,
          scheduled_start: exam.scheduledStart || null,
          status: exam.status || 'Draft',
          subject_id: exam.subjectId || null,
          chapter_id: exam.chapterId || null
        }]);
        if (error) { bridge.showToast(error.message); return; }
      } catch (err: any) {
        bridge.showToast(err.message || "Failed to save live exam.");
        return;
      }
    }
    setLiveExams(prev => [...prev, newExam]);
    addSystemLog(`[Live CMS] Created Exam: ${exam.title} (Draft)`);
    addAppNotification("📝 New Live Test Draft", `"${exam.title}" is created as a Draft. You can now add questions or schedule it!`);
  };

  const updateLiveExamStatus = async (id: string, status: 'Draft' | 'Scheduled' | 'Published' | 'Live' | 'Completed', scheduledStart?: string) => {
    if (isSupabaseConfigured) {
      try {
        const updatePayload: any = { status };
        if (scheduledStart !== undefined) {
          updatePayload.scheduled_start = scheduledStart || null;
        }
        if (status === 'Published' || status === 'Live') {
          updatePayload.is_active = true;
        } else if (status === 'Completed' || status === 'Draft') {
          updatePayload.is_active = false;
        }
        await supabase.from('live_exams').update(updatePayload).eq('id', id);
      } catch (err: any) {
        bridge.showToast(err.message || "Failed to update status.");
      }
    }

    setLiveExams(prev => prev.map(e => {
      if (e.id === id) {
        return { 
          ...e, 
          status, 
          isActive: (status === 'Published' || status === 'Live'),
          scheduledStart: scheduledStart !== undefined ? scheduledStart : e.scheduledStart 
        };
      }
      return e;
    }));

    const target = liveExams.find(e => e.id === id);
    addSystemLog(`[Live CMS] Exam "${target?.title || id}" status updated to ${status}`);
    
    if (status === 'Published') {
      addAppNotification("🔔 New Live Test Available", `"${target?.title || 'Exam'}" has been published and scheduled for ${scheduledStart ? new Date(scheduledStart).toLocaleString() : 'the scheduled time'}!`);
    }
  };

  const syncLiveTestAnswer = async (
    examId: string,
    answers: Record<string, string | number>,
    isSubmitted: boolean,
    score?: number,
    maxScore?: number,
    timeTaken?: number
  ) => {
    // Local backup
    const storageKey = `live_progress_${examId}`;
    localStorage.setItem(storageKey, JSON.stringify({ answers, isSubmitted, score, maxScore, timeTaken }));

    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { error } = await supabase
            .from('user_live_test_progress')
            .upsert({
              user_id: session.user.id,
              exam_id: examId,
              answers: answers,
              is_submitted: isSubmitted,
              score: score !== undefined ? score : null,
              max_score: maxScore !== undefined ? maxScore : null,
              time_taken: timeTaken !== undefined ? timeTaken : null,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,exam_id' });

          if (error) {
            console.error('[SYNC] Upsert error:', error);
          }
        }
      } catch (err) {
        console.error('[SYNC] Database upsert exception:', err);
      }
    }
  };

  const fetchLiveTestLeaderboard = async (examId: string) => {
    const mockStudents = [
      { name: 'Aditya Sharma', score: 320, maxScore: 360, timeTaken: 5400, isCurrentUser: false },
      { name: 'Priya Patel', score: 300, maxScore: 360, timeTaken: 5700, isCurrentUser: false },
      { name: 'Rohan Mehta', score: 280, maxScore: 360, timeTaken: 6200, isCurrentUser: false },
      { name: 'Sneha Reddy', score: 250, maxScore: 360, timeTaken: 6500, isCurrentUser: false },
      { name: 'Ananya Gupta', score: 220, maxScore: 360, timeTaken: 7100, isCurrentUser: false }
    ];

    let resultsList: any[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_live_test_progress')
          .select('score, max_score, time_taken, is_submitted, user_id, user_profiles(username)')
          .eq('exam_id', examId)
          .eq('is_submitted', true);

        if (!error && data) {
          const profileJson = localStorage.getItem('user_profile');
          const currentUserId = profileJson ? JSON.parse(profileJson).id : null;
          resultsList = data.map((item: any) => ({
            name: item.user_profiles?.username || 'Student',
            score: item.score || 0,
            maxScore: item.max_score || 360,
            timeTaken: item.time_taken || 0,
            isCurrentUser: item.user_id === currentUserId
          }));
        }
      } catch (err) {
        console.error('[SYNC] Failed to fetch leaderboard from database:', err);
      }
    }

    if (resultsList.length === 0) {
      resultsList = [...mockStudents];
    } else {
      const currentUsername = state.user?.name || 'You';
      const filteredMocks = mockStudents.filter(m => m.name !== currentUsername);
      resultsList = [...resultsList, ...filteredMocks];
    }

    resultsList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeTaken - b.timeTaken;
    });

    return resultsList.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  };

  const deleteLiveExam = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('live_test_questions').delete().eq('exam_id', id);
        await supabase.from('live_exams').delete().eq('id', id);
      } catch (err: any) { bridge.showToast(err.message || "Delete failed."); }
    }
    setLiveExams(prev => prev.filter(e => e.id !== id));
    setLiveTestQuestions(prev => prev.filter(q => q.examId !== id));
    addSystemLog(`[Live CMS] Deleted Exam: ${id}`);
  };

  const toggleLiveExamActive = async (id: string) => {
    const exam = liveExams.find(e => e.id === id);
    if (!exam) return;
    const newActive = !exam.isActive;
    if (isSupabaseConfigured) {
      try {
        await supabase.from('live_exams').update({ is_active: newActive }).eq('id', id);
      } catch (err: any) { bridge.showToast(err.message || "Update failed."); }
    }
    setLiveExams(prev => prev.map(e => e.id === id ? { ...e, isActive: newActive } : e));
    addSystemLog(`[Live CMS] Exam "${exam.title}" ${newActive ? 'ACTIVATED' : 'DEACTIVATED'}`);
    if (newActive) addAppNotification("🟢 Live Test Active!", `"${exam.title}" is now LIVE! Join now before it closes.`);
  };

  const addLiveTestQuestion = async (q: Omit<LiveTestQuestion, 'id'>) => {
    const newId = `ltq-${Date.now()}`;
    const newQ = { ...q, id: newId };
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('live_test_questions').insert([{
          id: newId,
          exam_id: q.examId,
          type: q.type || 'MCQ',
          question: q.question,
          options: q.options,
          correct_answer: q.correctAnswer.toString(),
          explanation: q.explanation || null,
          marks: q.marks,
          question_order: q.questionOrder,
          tags: q.tags || [],
          pdf_url: q.pdfUrl || null,
          is_live_practice: q.isLivePractice || false
        }]);
        if (error) { bridge.showToast(error.message); return; }
      } catch (err: any) { bridge.showToast(err.message || "Failed to add question."); return; }
    }
    setLiveTestQuestions(prev => [...prev, newQ]);
    addSystemLog(`[Live CMS] Question added to exam ${q.examId}`);
  };

  const updateLiveTestQuestion = async (id: string, updates: Partial<Omit<LiveTestQuestion, 'id' | 'examId'>>) => {
    if (isSupabaseConfigured) {
      try {
        const payload: any = {};
        if (updates.type !== undefined) payload.type = updates.type;
        if (updates.question !== undefined) payload.question = updates.question;
        if (updates.options !== undefined) payload.options = updates.options;
        if (updates.correctAnswer !== undefined) payload.correct_answer = updates.correctAnswer.toString();
        if (updates.explanation !== undefined) payload.explanation = updates.explanation;
        if (updates.marks !== undefined) payload.marks = updates.marks;
        if (updates.questionOrder !== undefined) payload.question_order = updates.questionOrder;
        if (updates.tags !== undefined) payload.tags = updates.tags;
        if (updates.pdfUrl !== undefined) payload.pdf_url = updates.pdfUrl;
        if (updates.isLivePractice !== undefined) payload.is_live_practice = updates.isLivePractice;
        
        const { error } = await supabase.from('live_test_questions').update(payload).eq('id', id);
        if (error) { bridge.showToast(error.message); return; }
      } catch (err: any) { bridge.showToast(err.message || "Failed to update question."); return; }
    }
    setLiveTestQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    addSystemLog(`[Live CMS] Question updated: ${id}`);
  };

  const deleteLiveTestQuestion = async (id: string) => {
    if (isSupabaseConfigured) {
      try { await supabase.from('live_test_questions').delete().eq('id', id); }
      catch (err: any) { bridge.showToast(err.message || "Delete failed."); }
    }
    setLiveTestQuestions(prev => prev.filter(q => q.id !== id));
    addSystemLog(`[Live CMS] Question deleted: ${id}`);
  };

  const updateUserRole = (name: string, role: string) => {
    setUsersList(prev => prev.map(u => u.name === name ? { ...u, role } : u));
    addSystemLog(`[Privileges] User ${name} role updated to: ${role}`);
  };

  const toggleUserBan = (name: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.name === name) {
        const next = !u.isBanned;
        addSystemLog(`[Access Control] User ${name} ${next ? 'BANNED' : 'UNBANNED'}`);
        return { ...u, isBanned: next };
      }
      return u;
    }));
  };

  const uploadStorageFile = (filename: string) => {
    setStorageFiles(prev => {
      if (prev.includes(filename)) return prev;
      return [...prev, filename];
    });
    addSystemLog(`[Storage Bucket] File mock-uploaded: ${filename}`);
  };

  const deleteStorageFile = (filename: string) => {
    setStorageFiles(prev => prev.filter(f => f !== filename));
    addSystemLog(`[Storage Bucket] File deleted: ${filename}`);
  };

  return (
    <AppContext.Provider value={{
      state,
      subjects,
      chapters,

      dppQuestions,
      mockTests,
      liveExams,
      liveTestQuestions,
      usersList,
      storageFiles,
      logs,
      
      loginUser,
      logoutUser,
      updateState,
      addCoinsAndXp,
      toggleTheme,
      setAccentColor,
      
      addAchievement,
      deleteAchievement,
      addCoinTransaction,
      deleteCoinTransaction,
      addPerformanceGraph,
      deletePerformanceGraph,
      initializeStudentData,
      
      addSubject,
      deleteSubject,
      addChapter,
      deleteChapter,

      addDppQuestion,
      updateDppQuestion,
      deleteDppQuestion,
      addMockTest,
      addLiveExam,
      deleteLiveExam,
      toggleLiveExamActive,
      updateLiveExamStatus,
      syncLiveTestAnswer,
      fetchLiveTestLeaderboard,
      addLiveTestQuestion,
      updateLiveTestQuestion,
      deleteLiveTestQuestion,
      updateUserRole,
      toggleUserBan,
      uploadStorageFile,
      deleteStorageFile,
      addSystemLog,
      clearSystemLogs
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside an AppProvider");
  return context;
}
