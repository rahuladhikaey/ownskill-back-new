import React, { useState, useEffect, useRef } from 'react';
import { useApp, LiveExam, LiveTestQuestion } from '../../context/AppContext';
import { useAndroidBridge } from '../../hooks/useAndroidBridge';
import { DppPdfViewer } from './DppPdfViewer';
import {
  FileText, Play, AlertCircle, Clock, Trophy, CheckCircle2,
  XCircle, ChevronLeft, ChevronRight, ArrowLeft, Activity,
  BookOpen, Timer, Target, Zap, Cloud, Sparkles, Award, Users, Share2
} from 'lucide-react';

type Mode = 'lobby' | 'quiz' | 'result';
type Tab = 'live' | 'upcoming' | 'completed';

export function LiveTests() {
  const {
    liveExams,
    liveTestQuestions,
    addCoinsAndXp,
    syncLiveTestAnswer,
    fetchLiveTestLeaderboard,
    updateState,
    state
  } = useApp();
  const bridge = useAndroidBridge();

  const [mode, setMode] = useState<Mode>('lobby');
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const [selectedExam, setSelectedExam] = useState<LiveExam | null>(null);
  const [examQuestions, setExamQuestions] = useState<LiveTestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);

  // States for lifecycle
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // PDF viewer
  const [showPdf, setShowPdf] = useState(false);
  const [pdfExam, setPdfExam] = useState<LiveExam | null>(null);

  // Result state
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Force re-renders for the lobby ticking countdowns
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const tInterval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(tInterval);
  }, []);

  // Helper: Computed live test statuses based on scheduling date & duration
  const getComputedStatus = (exam: LiveExam): 'Draft' | 'Scheduled' | 'Published' | 'Live' | 'Completed' => {
    if (exam.status === 'Completed') return 'Completed';
    if (exam.status === 'Draft') return 'Draft';

    if (exam.scheduledStart) {
      const startTime = new Date(exam.scheduledStart).getTime();
      const endTime = startTime + (exam.durationMinutes * 60 * 1000);
      const now = currentTime;

      if (now >= endTime) return 'Completed';
      if (now >= startTime) return 'Live';
      return 'Published'; // Scheduled and visible
    }

    // Fallback to active state
    return exam.isActive ? 'Live' : 'Draft';
  };

  // Helper: Check if student already submitted this exam
  const isSubmitted = (examId: string): boolean => {
    const local = localStorage.getItem(`live_progress_${examId}`);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        return parsed.isSubmitted === true;
      } catch {
        return false;
      }
    }
    return false;
  };

  // Helper: Get user's saved answers or scores locally
  const getSavedRecord = (examId: string): any | null => {
    const local = localStorage.getItem(`live_progress_${examId}`);
    if (local) {
      try { return JSON.parse(local); } catch { return null; }
    }
    return null;
  };

  // Filter exams into Tabs
  const liveTestsList = liveExams.filter(e => getComputedStatus(e) === 'Live' && !isSubmitted(e.id));
  const upcomingTestsList = liveExams.filter(e => {
    const status = getComputedStatus(e);
    return (status === 'Published' || status === 'Scheduled') && !isSubmitted(e.id);
  });
  const completedTestsList = liveExams.filter(e => getComputedStatus(e) === 'Completed' || isSubmitted(e.id));

  // Load leaderboard details
  const loadLeaderboardData = async (examId: string) => {
    setLoadingLeaderboard(true);
    try {
      const data = await fetchLiveTestLeaderboard(examId);
      setLeaderboard(data);
    } catch (e) {
      console.error("Failed to load rankings:", e);
    }
    setLoadingLeaderboard(false);
  };

  const startQuiz = (exam: LiveExam) => {
    const qs = liveTestQuestions
      .filter(q => q.examId === exam.id)
      .sort((a, b) => a.questionOrder - b.questionOrder);

    if (qs.length === 0) {
      if (exam.pdfUrl) {
        setPdfExam(exam);
        setShowPdf(true);
      } else {
        bridge.showToast('This test has no questions yet.');
      }
      return;
    }

    // Try to load any pre-existing progress
    const progress = getSavedRecord(exam.id);
    const initialAnswers = progress?.answers || {};

    setSelectedExam(exam);
    setExamQuestions(qs);
    setAnswers(initialAnswers);
    setCurrentIdx(0);

    // Calculate remaining duration minutes dynamically if scheduled
    let examTimeLeft = exam.durationMinutes * 60;
    if (exam.scheduledStart) {
      const startTime = new Date(exam.scheduledStart).getTime();
      const elapsedSecs = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      examTimeLeft = Math.max(10, (exam.durationMinutes * 60) - elapsedSecs);
    }

    setTimeLeft(examTimeLeft);
    startTimeRef.current = Date.now();
    setMode('quiz');
    setHasShownWarning(false);
    setShowWarningModal(false);
    bridge.vibrate(40);

    // Save initial session sync
    syncLiveTestAnswer(exam.id, initialAnswers, false);

    // Start countdown timer ticking
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        // 10-Minute Warning trigger
        if (prev <= 600 && prev > 590 && !hasShownWarning) {
          setHasShownWarning(true);
          setShowWarningModal(true);
          bridge.vibrate(100);
          bridge.showToast("⚠️ 10-Minute Warning! Review and save answers.");
        }

        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswer = async (questionId: string, answer: string | number) => {
    const updatedAnswers = { ...answers, [questionId]: answer };
    setAnswers(updatedAnswers);
    bridge.vibrate(8);

    // Real-time Supabase saving indicator sync
    setSavingStatus('saving');
    try {
      await syncLiveTestAnswer(selectedExam!.id, updatedAnswers, false);
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 1500);
    } catch (e) {
      console.error("Answer sync error:", e);
      setSavingStatus('idle');
    }
  };

  const handleAutoSubmit = () => {
    setIsAutoSubmitting(true);
    bridge.vibrate(150);
    setTimeout(() => {
      handleSubmit(true);
      setIsAutoSubmitting(false);
    }, 1800);
  };

  const handleSubmit = (autoSubmit = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const taken = Math.round((Date.now() - startTimeRef.current) / 1000);
    setTimeTaken(taken);

    let earned = 0;
    let total = 0;
    examQuestions.forEach(q => {
      total += q.marks;
      const userAns = answers[q.id];
      let isCorrect = false;
      if (q.type === 'SAQ') {
        isCorrect = userAns?.toString().trim().toLowerCase() === q.correctAnswer?.toString().trim().toLowerCase();
      } else {
        isCorrect = userAns === q.correctAnswer;
      }
      if (isCorrect) earned += q.marks;
    });

    setScore(earned);
    setMaxScore(total);

    // Dynamic Reward Calculation
    const coins = Math.round((earned / Math.max(total, 1)) * 30) + 15;
    const xp = Math.round((earned / Math.max(total, 1)) * 80) + 30;
    addCoinsAndXp(coins, xp);

    // Sync to Supabase with isSubmitted = true
    syncLiveTestAnswer(selectedExam!.id, answers, true, earned, total, taken);

    // Inject dynamic performance graph update for Student Home Portal!
    const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const accuracyVal = Math.round((earned / Math.max(total, 1)) * 100);

    // Add dynamic performance graph data points directly into app context state
    updateState(prev => {
      const updatedGraphPoints = prev.performanceGraphs.map(g => {
        if (g.title.toLowerCase().includes('accuracy') || g.title.toLowerCase().includes('performance')) {
          return {
            ...g,
            dataPoints: [
              ...g.dataPoints,
              { date: dateStr, accuracy: accuracyVal, completion: 100, xpEarned: xp, dppsCompleted: 1 }
            ]
          };
        }
        return g;
      });
      return { ...prev, performanceGraphs: updatedGraphPoints };
    });

    setMode('result');
    bridge.vibrate(150);

    // Fetch rankings instantly
    loadLeaderboardData(selectedExam!.id);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const answeredCount = Object.keys(answers).length;

  // PDF viewer overlay
  if (showPdf && pdfExam?.pdfUrl) {
    return (
      <DppPdfViewer
        pdfUrl={pdfExam.pdfUrl}
        questionTitle={pdfExam.title}
        onClose={() => { setShowPdf(false); setPdfExam(null); }}
      />
    );
  }

  // ─── RESULT & DETAILED EVALUATION & RANKS ───
  if (mode === 'result' && selectedExam) {
    // Subject Accuracy breakdown
    const correctQuestions = examQuestions.filter(q => {
      const userAns = answers[q.id];
      if (q.type === 'SAQ') return userAns?.toString().trim().toLowerCase() === q.correctAnswer?.toString().trim().toLowerCase();
      return userAns === q.correctAnswer;
    });
    const wrongQuestions = examQuestions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '' && !correctQuestions.includes(q));

    return (
      <div className="space-y-6 pb-20 animate-form-fade text-left">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setMode('lobby'); setSelectedExam(null); }} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-extrabold text-white truncate">{selectedExam.title}</h2>
        </div>

        {/* Celebrative banner */}
        <div className="glass-panel p-5 bg-gradient-to-br from-purple-500/10 via-accent/5 to-transparent border border-accent/20 rounded-2xl relative overflow-hidden flex items-center gap-4">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles className="w-32 h-32 text-accent" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/35 flex items-center justify-center text-accent shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Congratulations, {state.user?.name || 'Student'}!</h3>
            <p className="text-[10px] text-slate-400">Test evaluated automatically. Rewards and dashboard updated successfully!</p>
          </div>
        </div>

        {/* Score Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Marks Card */}
          <div className={`glass-panel p-6 text-center space-y-4 border ${pct >= 60 ? 'border-emerald-500/25 bg-emerald-500/5' : pct >= 35 ? 'border-amber-500/25 bg-amber-500/5' : 'border-red-500/25 bg-red-500/5'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border-4 ${pct >= 60 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : pct >= 35 ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-red-500/40 bg-red-500/10 text-red-400'}`}>
              {pct >= 60 ? <Trophy className="w-8 h-8" /> : <Target className="w-8 h-8" />}
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white mb-0.5">{score}<span className="text-lg text-slate-400">/{maxScore}</span></p>
              <p className={`text-xs font-extrabold uppercase tracking-wide ${pct >= 60 ? 'text-emerald-400' : pct >= 35 ? 'text-amber-400' : 'text-red-400'}`}>
                {pct}% Accuracy Secured
              </p>
              <p className="text-[10px] text-slate-400 mt-1">{pct >= 60 ? 'Stellar performance! Coins & XP granted.' : pct >= 35 ? 'Good attempt! Keep reviewing formulas.' : 'Needs practice. Review detailed explanations.'}</p>
            </div>

            <div className="border-t border-slate-800/80 pt-3 flex justify-around text-center text-[10px] font-semibold">
              <div>
                <span className="text-slate-500 block uppercase text-[8px] tracking-wider font-bold mb-0.5">Correct</span>
                <span className="text-emerald-400 font-extrabold text-sm">{correctQuestions.length} Qs</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-slate-500 block uppercase text-[8px] tracking-wider font-bold mb-0.5">Wrong</span>
                <span className="text-red-400 font-extrabold text-sm">{wrongQuestions.length} Qs</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-slate-500 block uppercase text-[8px] tracking-wider font-bold mb-0.5">Time Spent</span>
                <span className="text-accent font-extrabold text-sm">{formatTime(timeTaken)}</span>
              </div>
            </div>
          </div>

          {/* Performance Analysis Gauge */}
          <div className="glass-panel p-5 space-y-4">
            <h4 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-accent" /> Speed & Subject Analytics
            </h4>
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-400">Accuracy Rating</span>
                  <span className="text-white">{pct}%</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pct >= 60 ? 'bg-emerald-500' : pct >= 35 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-400">Response Speed</span>
                  <span className="text-white">
                    {timeTaken > 0 ? Math.round(timeTaken / Math.max(1, answeredCount)) : 0}s / Q
                  </span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, Math.max(10, (120 - (timeTaken / Math.max(1, answeredCount))) / 1.2))}%` }} />
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-3 flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> Reward Coins: +{Math.round((score / Math.max(maxScore, 1)) * 30) + 15}</span>
                <span className="flex items-center gap-1"><Award className="w-3 h-3 text-emerald-400" /> XP Earned: +{Math.round((score / Math.max(maxScore, 1)) * 80) + 30}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Rankings Leaderboard Grid */}
        <div className="glass-panel p-5 space-y-3.5">
          <h4 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-accent" /> Live Exam Rankings & Leaderboard
          </h4>
          {loadingLeaderboard ? (
            <div className="flex items-center justify-center py-6 gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <span className="text-[10px] text-slate-400 font-bold">Recalculating batch ranks...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((player, idx) => {
                const isUser = player.isCurrentUser || player.name === state.user?.name;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${isUser
                        ? 'border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 to-transparent shadow-md shadow-yellow-500/5'
                        : 'border-slate-900 bg-slate-950/40'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                            idx === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30' :
                              'bg-slate-900 text-slate-500'
                        }`}>
                        {player.rank}
                      </span>
                      <p className={`text-xs font-bold truncate ${isUser ? 'text-yellow-400' : 'text-slate-200'}`}>
                        {player.name} {isUser && <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/15 px-1.5 py-0.5 rounded ml-1">YOU</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-400">
                      <span>{player.score}M</span>
                      <span className="font-mono text-slate-500">{formatTime(player.timeTaken)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Answer Review list */}
        <div className="glass-panel p-5 space-y-3">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Detailed Answer Key</h3>
          {examQuestions.map((q, i) => {
            const userAns = answers[q.id];
            let isCorrect = false;
            if (q.type === 'SAQ') {
              isCorrect = userAns?.toString().trim().toLowerCase() === q.correctAnswer?.toString().trim().toLowerCase();
            } else {
              isCorrect = userAns === q.correctAnswer;
            }
            const isSkipped = userAns === undefined || (q.type === 'SAQ' && userAns === '');
            return (
              <div key={q.id} className={`border rounded-xl p-3.5 space-y-2 ${isCorrect ? 'border-emerald-500/25 bg-emerald-500/5' : isSkipped ? 'border-slate-800 bg-slate-950/20' : 'border-red-500/25 bg-red-500/5'}`}>
                <div className="flex items-start gap-2">
                  {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : isSkipped ? <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                  <p className="text-xs font-semibold text-white">Q{i + 1}. {q.question}</p>
                </div>
                {q.type === 'SAQ' ? (
                  <div className="pl-6 space-y-1">
                    <p className={`text-xs ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>Your Answer: <strong>{userAns?.toString() || 'Skipped'}</strong></p>
                    {!isCorrect && <p className="text-xs text-emerald-400">Correct Answer: <strong>{q.correctAnswer}</strong></p>}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 pl-6">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`text-[10px] px-2 py-1 rounded-lg border ${oi === q.correctAnswer ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-bold' : oi === userAns ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-slate-800 text-slate-500'}`}>
                        {String.fromCharCode(65 + oi)}. {opt}
                      </div>
                    ))}
                  </div>
                )}
                {q.explanation && (
                  <p className="text-[10px] text-slate-400 pl-6 italic">💡 {q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={() => { setMode('lobby'); setSelectedExam(null); }}
          className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer shadow-lg shadow-purple-500/25">
          Back to Tests Room
        </button>
      </div>
    );
  }

  // ─── QUIZ MODE (TIMED EXAM BOARD) ───
  if (mode === 'quiz' && selectedExam && examQuestions.length > 0) {
    const q = examQuestions[currentIdx];
    const isLast = currentIdx === examQuestions.length - 1;
    const urgency = timeLeft <= 600; // Under 10 minutes urgency alert

    return (
      <div className="flex flex-col min-h-full pb-10 animate-form-fade text-left">
        {/* Urgent/Auto-submitting Overlay Banner */}
        {isAutoSubmitting && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[99999] flex flex-col items-center justify-center gap-4 text-center">
            <Timer className="w-16 h-16 text-red-400 animate-spin" />
            <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">Time Has Expired!</h3>
            <p className="text-xs text-slate-400 px-6">Your live answers are being securely locked and auto-submitted to Supabase...</p>
          </div>
        )}

        {/* 10-Minute warning popup modal */}
        {showWarningModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99998] flex items-center justify-center p-4 animate-fade-scale">
            <div className="w-full max-w-[360px] glass-panel p-6 text-center space-y-4 border border-red-500/25 bg-red-950/10">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto animate-pulse">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">⚠️ 10-Minute Warning!</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  There are less than 10 minutes remaining for this Live Test. Make sure your answers are finalized; they are saved in real-time.
                </p>
              </div>
              <button
                onClick={() => { setShowWarningModal(false); bridge.vibrate(15); }}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-xs tracking-wide transition-all cursor-pointer"
              >
                Dismiss & Continue
              </button>
            </div>
          </div>
        )}

        {/* Header - Timer and Cloud Saving indicators */}
        <div className={`glass-panel p-3.5 mb-4 flex items-center justify-between gap-3 ${urgency ? 'border-red-500/30 bg-red-500/5' : ''}`}>
          <div className="flex items-center gap-2 shrink-0">
            <Timer className={`w-4 h-4 ${urgency ? 'text-red-400 animate-pulse' : 'text-accent'}`} />
            <span className={`text-sm font-extrabold font-mono ${urgency ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <div className="flex-1 text-center truncate px-2">
            <p className="text-[10px] text-slate-400 font-semibold truncate">{selectedExam.title}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-right">
            {/* Real-time saving status indicators */}
            <span className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-500">
              <Cloud className={`w-3.5 h-3.5 ${savingStatus === 'saving' ? 'text-accent animate-pulse' : savingStatus === 'saved' ? 'text-emerald-400' : 'text-slate-600'}`} />
              {savingStatus === 'saving' ? 'Syncing...' : savingStatus === 'saved' ? 'Synced' : 'Autosave active'}
            </span>
            <span className="text-[10px] font-extrabold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{answeredCount}/{examQuestions.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mb-4 relative">
          <div className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / examQuestions.length) * 100}%` }} />
        </div>

        {/* Navigator dots */}
        <div className="flex gap-1.5 flex-wrap mb-4 select-none">
          {examQuestions.map((eq, i) => (
            <button key={eq.id} onClick={() => setCurrentIdx(i)}
              className={`w-7 h-7 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer border ${i === currentIdx ? 'bg-accent text-white border-accent' : answers[eq.id] !== undefined ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question Panel */}
        <div className="glass-panel p-5 space-y-4 flex-1 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-accent tracking-wider">Question {currentIdx + 1} of {examQuestions.length}</span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-900">+{q.marks} Marks</span>
          </div>
          <p className="text-sm font-semibold text-white leading-relaxed">{q.question}</p>
          <div className="space-y-2.5">
            {q.type === 'SAQ' ? (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Type your short answer here..."
                  value={(answers[q.id] as string) || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-3.5 px-4 text-sm text-white outline-none placeholder-slate-600 transition-all focus:ring-2 focus:ring-accent/20"
                />
              </div>
            ) : (
              q.options.map((opt, oi) => {
                const isSelected = answers[q.id] === oi;
                return (
                  <button key={oi} onClick={() => handleAnswer(q.id, oi)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${isSelected ? 'bg-accent/15 border-accent text-white shadow-lg shadow-purple-500/10' : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-900/50'}`}>
                    <span className={`font-extrabold mr-2 ${isSelected ? 'text-accent' : 'text-slate-500'}`}>
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    {opt}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex gap-3">
          <button onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))} disabled={currentIdx === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-slate-800">
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          {isLast ? (
            <button onClick={() => handleSubmit(false)}
              className="flex-2 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-lg shadow-purple-500/25">
              <Trophy className="w-4 h-4" /> Submit Live Test
            </button>
          ) : (
            <button onClick={() => setCurrentIdx(prev => Math.min(examQuestions.length - 1, prev + 1))}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-slate-800">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── LOBBY VIEW (ACTIVE, UPCOMING & RESULTS) ───
  return (
    <div className="space-y-5 pb-20 animate-form-fade text-left select-none">
      {/* Intro Header */}
      <div className="glass-panel p-5 space-y-2 relative overflow-hidden bg-gradient-to-br from-accent/5 to-transparent border border-slate-800/80">
        <h3 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent animate-pulse" /> Live Exams Portal
        </h3>
        <p className="text-xs text-slate-400 font-medium">Schedule simulated tests under high-pressure timers and real-time grading gates.</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-900/60 p-1 bg-slate-950/60 rounded-xl gap-1">
        <button
          onClick={() => { setActiveTab('live'); bridge.vibrate(8); }}
          className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${activeTab === 'live' ? 'bg-red-500/10 border border-red-500/20 text-red-400 shadow-lg' : 'text-slate-400 hover:text-slate-300'
            }`}
        >
          🔴 Active ({liveTestsList.length})
        </button>
        <button
          onClick={() => { setActiveTab('upcoming'); bridge.vibrate(8); }}
          className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${activeTab === 'upcoming' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-lg' : 'text-slate-400 hover:text-slate-300'
            }`}
        >
          📅 Upcoming ({upcomingTestsList.length})
        </button>
        <button
          onClick={() => { setActiveTab('completed'); bridge.vibrate(8); }}
          className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${activeTab === 'completed' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-lg' : 'text-slate-400 hover:text-slate-300'
            }`}
        >
          🏆 Completed ({completedTestsList.length})
        </button>
      </div>

      {/* TABS CONTAINER PANELS */}

      {/* TAB 1: ACTIVE LIVE TESTS */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {liveTestsList.length === 0 ? (
            <div className="glass-panel p-10 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-extrabold text-white">No Live Exams Active</h3>
              <p className="text-xs text-slate-400">There are no live tests active right now. Check your Scheduled tests or Completed results!</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {liveTestsList.map(exam => {
                const qs = liveTestQuestions.filter(q => q.examId === exam.id);
                const totalMarks = qs.reduce((s, q) => s + q.marks, 0);
                const hasPdf = !!exam.pdfUrl;
                const hasQuestions = qs.length > 0;
                return (
                  <div key={exam.id} className="glass-panel p-4.5 space-y-4 border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent relative overflow-hidden animate-fade-scale">
                    {/* Urgency tag */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                        Live Now
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {exam.durationMinutes} min · {hasQuestions ? `${qs.length} Qs` : 'PDF Test'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-white">{exam.title}</h4>
                      {exam.description && <p className="text-[10px] text-slate-400 mt-1">{exam.description}</p>}
                    </div>

                    {hasQuestions && (
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-accent" /> {qs.length} Questions</span>
                        <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> {totalMarks} Marks</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.durationMinutes} min</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {hasQuestions && (
                        <button onClick={() => startQuiz(exam)}
                          className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-500/15 active:scale-95">
                          <Play className="w-3.5 h-3.5 fill-white" /> Start Live Test
                        </button>
                      )}
                      {hasPdf && (
                        <button onClick={() => { setPdfExam(exam); setShowPdf(true); bridge.vibrate(15); }}
                          className={`${hasQuestions ? 'px-4' : 'flex-1'} border border-slate-700 bg-slate-900 text-slate-300 hover:text-white py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2`}>
                          <FileText className="w-3.5 h-3.5" /> {hasQuestions ? 'PDF' : 'View Exam PDF'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UPCOMING TESTS (COUNTDOWN ACTIVE) */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingTestsList.length === 0 ? (
            <div className="glass-panel p-10 text-center space-y-3">
              <Clock className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-extrabold text-white">No Scheduled Tests</h3>
              <p className="text-xs text-slate-400">There are no upcoming scheduled tests on the dashboard. Ask your teacher/admin!</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {upcomingTestsList.map(exam => {
                const qs = liveTestQuestions.filter(q => q.examId === exam.id);
                const totalMarks = qs.reduce((s, q) => s + q.marks, 0);

                // Countdown calculation
                const startTime = exam.scheduledStart ? new Date(exam.scheduledStart).getTime() : Date.now();
                const remainingMs = startTime - currentTime;

                return (
                  <div key={exam.id} className="glass-panel p-4.5 space-y-4 border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent relative overflow-hidden animate-fade-scale">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400">
                        Scheduled
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {exam.durationMinutes} min · {qs.length} Qs
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-white">{exam.title}</h4>
                      {exam.description && <p className="text-[10px] text-slate-400 mt-1">{exam.description}</p>}
                    </div>

                    {exam.scheduledStart && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold bg-slate-950/80 p-2.5 rounded-xl border border-slate-900 w-fit">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Starts on: {new Date(exam.scheduledStart).toLocaleString()}</span>
                      </div>
                    )}

                    {/* COUNTDOWN WIDGET */}
                    <div className="bg-slate-950/80 border border-slate-900/60 rounded-xl p-4.5 text-center space-y-1 bg-gradient-to-b from-slate-900 to-transparent">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Starts In</span>
                      <p className="text-xl font-mono font-extrabold text-blue-400 tracking-wider">
                        {formatCountdown(remainingMs)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {remainingMs <= 0 ? (
                        <button onClick={() => startQuiz(exam)}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 animate-pulse active:scale-95">
                          <Play className="w-3.5 h-3.5 fill-white" /> Unlock & Start Test
                        </button>
                      ) : (
                        <button disabled
                          className="flex-1 border border-slate-800 bg-slate-900/40 text-slate-500 py-2.5 rounded-xl text-xs font-bold text-center cursor-not-allowed">
                          🔒 Locked (Awaiting Start Time)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETED & RESULTS (GRADE SHEETS & GRAPHS) */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedTestsList.length === 0 ? (
            <div className="glass-panel p-10 text-center space-y-3">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-extrabold text-white">No Completed Tests</h3>
              <p className="text-xs text-slate-400">You haven't submitted or finished any live tests yet. Join an active test to begin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedTestsList.map(exam => {
                const qs = liveTestQuestions.filter(q => q.examId === exam.id);
                const totalMarks = qs.reduce((s, q) => s + q.marks, 0);
                const localProgress = getSavedRecord(exam.id);
                const hasScore = localProgress !== null && localProgress.score !== undefined;

                return (
                  <div key={exam.id} className="glass-panel p-4 space-y-3 border border-slate-800 bg-slate-950/20 relative overflow-hidden animate-fade-scale">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        Completed
                      </span>
                      {hasScore && (
                        <span className="text-xs font-mono font-extrabold text-emerald-400">
                          Score: {localProgress.score}/{localProgress.maxScore}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">{exam.title}</h4>
                      <p className="text-[9px] text-slate-500 mt-0.5">Duration: {exam.durationMinutes} min · {qs.length} Questions</p>
                    </div>

                    {/* Score preview indicator */}
                    {hasScore && (
                      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.round((localProgress.score / Math.max(1, localProgress.maxScore)) * 100)}%` }} />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedExam(exam);
                          setExamQuestions(qs);
                          setAnswers(localProgress?.answers || {});
                          setScore(localProgress?.score || 0);
                          setMaxScore(localProgress?.maxScore || totalMarks);
                          setTimeTaken(localProgress?.timeTaken || 0);
                          setMode('result');
                          bridge.vibrate(15);
                          loadLeaderboardData(exam.id);
                        }}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-200 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Trophy className="w-3.5 h-3.5 text-yellow-500" /> View Performance & Ranks
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
