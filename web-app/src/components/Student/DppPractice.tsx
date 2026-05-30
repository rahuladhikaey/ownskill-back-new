import React, { useState, useEffect, useRef } from 'react';
import { useApp, DppQuestion } from '../../context/AppContext';
import { useAndroidBridge } from '../../hooks/useAndroidBridge';
import { BookOpen, AlertCircle, Compass, Calculator, X, Trophy, FileText, Play, Clock, ChevronLeft, Zap, Target } from 'lucide-react';
import { DppPdfViewer } from './DppPdfViewer';

export function DppPractice() {
  const { state, updateState, subjects, chapters, dppQuestions, addCoinsAndXp } = useApp();
  const bridge = useAndroidBridge();

  const [mode, setMode] = useState<'select' | 'list' | 'quiz' | 'report' | 'live'>('select');
  
  // Selection States
  const [selectedSubj, setSelectedSubj] = useState('');
  const [selectedChap, setSelectedChap] = useState('');


  // PDF Viewer State
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  const [currentPdfTitle, setCurrentPdfTitle] = useState('');

  // Quiz States
  const [quizQuestions, setQuizQuestions] = useState<DppQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [timer, setTimer] = useState(300); // 5 mins
  const timerIntervalRef = useRef<number | null>(null);

  // Calculator Widget State
  const [showCalc, setShowCalc] = useState(false);
  const [calcExpression, setCalcExpression] = useState('');
  const [calcDisplay, setCalcDisplay] = useState('0');

  // Report States
  const [reportScore, setReportScore] = useState(0);
  const [reportTotal, setReportTotal] = useState(0);

  // Filter lists based on cascades
  const activeChapters = chapters.filter(c => c.subjectId === selectedSubj);


  // Show list of available DPPs for selected chapter
  const handleShowDppList = () => {
    if (!selectedChap) {
      bridge.showToast("Please select both Subject and Chapter.");
      return;
    }

    const qs = dppQuestions.filter(q => q.chapterId === selectedChap);
    if (qs.length === 0) {
      bridge.showToast("No DPP questions available for this chapter.");
      return;
    }

    setMode('list');
    bridge.vibrate(20);
  };

  // Attempt a specific DPP
  const handleAttemptDpp = (selectedDpps: DppQuestion[]) => {
    if (selectedDpps.length === 0) {
      bridge.showToast("No questions selected.");
      return;
    }

    // Check if there are live practice questions
    const liveQuestions = selectedDpps.filter(q => q.isLivePractice);
    if (liveQuestions.length > 0) {
      setQuizQuestions(liveQuestions);
      setMode('live');
      bridge.vibrate(40);
      bridge.showToast("🔴 Live Practice Mode Activated!");
      return;
    }

    // Start timed quiz
    setQuizQuestions(selectedDpps);
    setAnswers({});
    setCurrentIdx(0);
    setMode('quiz');
    setTimer(300);
    bridge.vibrate(40);
    
    // Start countdown timer
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  };

  const handleViewPdf = (question: DppQuestion) => {
    if (question.pdfUrl) {
      setCurrentPdfUrl(question.pdfUrl);
      setCurrentPdfTitle(question.question);
      setShowPdfViewer(true);
      bridge.vibrate(15);
    } else {
      bridge.showToast("No PDF available for this question");
    }
  };

  const handleClosePdfViewer = () => {
    setShowPdfViewer(false);
    setCurrentPdfUrl('');
    setCurrentPdfTitle('');
  };

  const handleOptionSelect = (optionIdx: number) => {
    const q = quizQuestions[currentIdx];
    setAnswers(prev => ({
      ...prev,
      [q.id]: optionIdx
    }));
    bridge.vibrate(10);
  };

  const handleMsqSelect = (optionIdx: number) => {
    const q = quizQuestions[currentIdx];
    const prevAns = (answers[q.id] as string) || "";
    let selectedArr = prevAns ? prevAns.split(',') : [];
    const val = optionIdx.toString();

    const existIdx = selectedArr.indexOf(val);
    if (existIdx > -1) {
      selectedArr.splice(existIdx, 1);
    } else {
      selectedArr.push(val);
    }
    
    selectedArr.sort();
    setAnswers(prev => ({
      ...prev,
      [q.id]: selectedArr.join(',')
    }));
    bridge.vibrate(10);
  };

  const handleSubmitQuiz = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    // Calculate Score
    let correct = 0;
    quizQuestions.forEach(q => {
      const userAns = answers[q.id];
      if (userAns !== undefined && userAns.toString() === q.answer.toString()) {
        correct++;
      }
    });

    setReportScore(correct);
    setReportTotal(quizQuestions.length);
    setMode('report');
    bridge.vibrate(150); // Completed double buzz

    // Add Rewards
    const coinsReward = correct * 10;
    const xpReward = correct * 20;
    addCoinsAndXp(coinsReward, xpReward);
    
    // Registercompleted chapter in state
    if (!state.completedDppChapters.includes(selectedChap)) {
      updateState(prev => ({
        ...prev,
        completedDppChapters: [...prev.completedDppChapters, selectedChap]
      }));
    }

    bridge.showToast(`DPP Finished! Score: ${correct}/${quizQuestions.length}. Reward: +${coinsReward} Coins!`);
  };

  // Scientific Calculator Logic
  const handleCalcPress = (char: string) => {
    bridge.vibrate(10);
    if (char === 'C') {
      setCalcExpression('');
      setCalcDisplay('0');
    } else if (char === '=') {
      try {
        let clean = calcExpression
          .replace(/sin/g, "Math.sin")
          .replace(/cos/g, "Math.cos")
          .replace(/sqrt/g, "Math.sqrt");
        const val = eval(clean);
        setCalcDisplay(val.toString());
        setCalcExpression(val.toString());
      } catch (e) {
        setCalcDisplay('ERR');
        setCalcExpression('');
      }
    } else {
      const nextExp = calcExpression + char;
      setCalcExpression(nextExp);
      setCalcDisplay(nextExp);
    }
  };

  // Clean timer loops
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  return (
    <div className="relative min-h-full">
      
      {/* 1. SELECTION FORM */}
      {mode === 'select' && (
        <div className="space-y-6 pb-20 animate-form-fade">
          <div className="glass-panel p-5 space-y-4 text-left">
            <h3 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
              <Compass className="w-5 h-5 text-accent" /> DPP Practice Selection
            </h3>
            <p className="text-xs text-slate-400">Filter topics dynamically to launch your timed mock questionnaire sets.</p>

            <div className="space-y-4 pt-2">
              {/* Subject Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Select Subject</label>
                <select
                  value={selectedSubj}
                  onChange={(e) => { setSelectedSubj(e.target.value); setSelectedChap(''); }}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-3 text-xs text-white outline-none transition-all cursor-pointer"
                >
                  <option value="" className="bg-slate-950">-- Click to choose Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id} className="bg-slate-950">{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Select Chapter</label>
                <select
                  value={selectedChap}
                  disabled={!selectedSubj}
                  onChange={(e) => setSelectedChap(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent disabled:opacity-40 rounded-xl py-2.5 px-3 text-xs text-white outline-none transition-all cursor-pointer"
                >
                  <option value="" className="bg-slate-950">-- Click to choose Chapter --</option>
                  {activeChapters.map(c => <option key={c.id} value={c.id} className="bg-slate-950">{c.name}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleShowDppList}
              disabled={!selectedChap}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 active:scale-[0.98] text-white py-2.5 rounded-xl font-bold tracking-wide shadow-lg shadow-purple-500/10 transition-all cursor-pointer text-center"
            >
              View Available DPPs
            </button>
          </div>
        </div>
      )}

      {/* 2. DPP LIST VIEW - Show all available DPPs for selected chapter */}
      {mode === 'list' && (
        <div className="space-y-4 pb-20 animate-form-fade">
          
          {/* Header with back button */}
          <div className="glass-panel p-4 flex items-center justify-between bg-gradient-to-r from-accent/10 to-purple-500/10 border border-accent/20">
            <button
              onClick={() => setMode('select')}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
              title="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 ml-3">
              <h2 className="text-sm font-extrabold text-white">Available DPP Sets</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Select and attempt any DPP to practice</p>
            </div>
          </div>

          {/* DPP List */}
          <div className="space-y-3">
            {dppQuestions
              .filter(q => q.chapterId === selectedChap)
              .reduce((acc: any[], dpp, idx) => {
                // Group by date and create DPP sets
                const date = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
                const dppTitle = `DPP ${String(idx + 1).padStart(2, '0')}`;
                const totalQs = dppQuestions.filter(q => q.chapterId === selectedChap).length;
                const totalMarks = totalQs * 1.5; // Assume 1.5 marks per question
                const xpReward = totalQs * 10; // 10 XP per correct answer (matches report calculation)
                
                // Create unique DPP set (one per filtered result batch)
                if (idx === 0 || acc.length === 0) {
                  acc.push({
                    setId: `dpp-set-${selectedChap}`,
                    title: dppTitle,
                    date: date,
                    totalQuestions: totalQs,
                    totalMarks: Math.round(totalMarks),
                    xpReward: xpReward,
                    questions: dppQuestions.filter(q => q.chapterId === selectedChap)
                  });
                }
                return acc;
              }, [])
              .map((dppSet) => (
                <div
                  key={dppSet.setId}
                  className="glass-panel p-5 space-y-4 border border-slate-800/60 hover:border-accent/40 transition-all"
                >
                  {/* DPP Card Header */}
                  <div className="flex items-start gap-4">
                    {/* DPP Icon */}
                    <div className="w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400/20 to-yellow-400/10 border border-amber-500/20 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-xs font-extrabold text-amber-400">OBJ</span>
                        <div className="text-2xl font-extrabold text-white mt-1">DPP</div>
                      </div>
                    </div>

                    {/* DPP Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-400">DPP</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">{dppSet.date}</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-white tracking-wide mb-2">
                        {dppSet.title}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-300">
                          {dppSet.totalQuestions} Qs
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-sm font-bold text-slate-300">
                          {dppSet.totalMarks} Marks
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                          Earn {dppSet.xpReward} <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 rounded text-emerald-400">XP</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attempt Button */}
                  <button
                    onClick={() => handleAttemptDpp(dppSet.questions)}
                    className="w-full bg-slate-950/40 hover:bg-accent/10 border border-accent/20 active:scale-[0.98] text-accent py-3 rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    {state.completedDppChapters?.includes(selectedChap) ? 'Re-attempt' : 'Attempt'}
                  </button>
                </div>
              ))}

            {dppQuestions.filter(q => q.chapterId === selectedChap).length === 0 && (
              <div className="glass-panel p-8 text-center space-y-3 border border-slate-800/40">
                <AlertCircle className="w-12 h-12 text-slate-500 mx-auto opacity-50" />
                <div>
                  <p className="text-sm font-bold text-slate-400">No DPPs Available</p>
                  <p className="text-xs text-slate-500 mt-1">Admin hasn't created DPPs for this chapter yet.</p>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Attempt Button - Attempt All */}
          {dppQuestions.filter(q => q.chapterId === selectedChap).length > 0 && (
            <div className="glass-panel p-4 border border-amber-500/20 bg-amber-500/5">
              <button
                onClick={() => handleAttemptDpp(
                  dppQuestions.filter(q => q.chapterId === selectedChap)
                )}
                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white py-3 rounded-xl font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Zap className="w-4 h-4" />
                {state.completedDppChapters?.includes(selectedChap) ? 'Re-attempt All' : 'Attempt All'} Questions for this Chapter ({dppQuestions.filter(q => q.chapterId === selectedChap).length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. LIVE PRACTICE MODE */}
      {mode === 'live' && quizQuestions.length > 0 && (
        <div className="space-y-4 pb-20 animate-form-fade text-left">
          
          {/* Live Practice Header */}
          <div className="glass-panel p-4 flex items-center justify-between bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center animate-pulse">
                <Play className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Live Practice Mode</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Real-time practice with PDF support</p>
              </div>
            </div>
            <button
              onClick={() => setMode('select')}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live Practice Questions */}
          <div className="space-y-4">
            {quizQuestions.map((q, idx) => (
              <div key={q.id} className="glass-panel p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-extrabold bg-red-500/15 border border-red-500/25 text-red-400 px-2 py-0.5 rounded-full uppercase">
                        Live Practice
                      </span>
                      <span className="text-[9px] font-extrabold bg-purple-500/15 border border-purple-500/25 text-accent px-2 py-0.5 rounded-full uppercase">
                        {q.type}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white mb-2">{q.question}</h4>
                    
                    {/* Options */}
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className="bg-slate-950/40 border border-slate-800 rounded-lg p-3 flex items-center gap-3 hover:border-slate-700 transition-colors cursor-pointer"
                          onClick={() => handleOptionSelect(oIdx)}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            answers[q.id] === oIdx ? 'border-accent bg-accent' : 'border-slate-600'
                          }`}>
                            {answers[q.id] === oIdx && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs font-semibold text-white">{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PDF View Button */}
                  {q.pdfUrl && (
                    <button
                      onClick={() => handleViewPdf(q)}
                      className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:text-blue-300 cursor-pointer active:scale-95 transition-all shrink-0"
                      title="View PDF"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TIMED QUIZ VIEW */}
      {mode === 'quiz' && quizQuestions.length > 0 && (
        <div className="space-y-4 pb-20 animate-form-fade text-left">
          
          {/* Top Info Bar */}
          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800/80 rounded-2xl px-4 py-3">
            <span className="text-xs font-bold text-slate-400">
              Question {currentIdx + 1} of {quizQuestions.length}
            </span>
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
              timer <= 30 ? 'bg-red-500/25 border-red-500/35 text-red-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              ⏱️ {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </span>
            
            {/* Scientific calculator widget toggler */}
            <button
              onClick={() => { setShowCalc(true); bridge.vibrate(15); }}
              className="p-1.5 bg-accent/10 border border-accent/20 text-accent rounded-xl active:scale-90 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <Calculator className="w-3.5 h-3.5" /> Calc
            </button>
          </div>

          {/* Question panel card */}
          <div className="glass-panel p-5 space-y-4">
            
            {/* Tag borders */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[9px] font-extrabold uppercase bg-purple-500/15 border border-purple-500/25 text-accent px-2 py-0.5 rounded-full">
                {quizQuestions[currentIdx].type} Question
              </span>
              {quizQuestions[currentIdx].tags?.map((t, index) => (
                <span
                  key={index}
                  className="text-[9px] font-extrabold uppercase bg-amber-500/15 border border-amber-500/25 text-amber-400 px-2 py-0.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>

            <p className="text-sm sm:text-base font-bold text-white leading-relaxed select-text whitespace-pre-line">
              {quizQuestions[currentIdx].question}
            </p>

            {/* Render options coordinate selectors */}
            <div className="space-y-2.5 pt-2">
              {quizQuestions[currentIdx].options.map((opt, oIdx) => {
                const q = quizQuestions[currentIdx];
                let isSelected = false;
                
                if (q.type === 'MSQ') {
                  const ansStr = (answers[q.id] as string) || "";
                  isSelected = ansStr.split(',').includes(oIdx.toString());
                } else {
                  isSelected = answers[q.id] === oIdx;
                }

                return (
                  <div
                    key={oIdx}
                    onClick={() => q.type === 'MSQ' ? handleMsqSelect(oIdx) : handleOptionSelect(oIdx)}
                    className={`glass-card-interactive p-3.5 border flex items-center justify-between cursor-pointer ${
                      isSelected ? 'border-accent bg-purple-500/5 shadow-glow' : 'border-slate-800/80'
                    }`}
                  >
                    <span className="text-xs sm:text-sm text-slate-200 select-text leading-normal">{opt}</span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                      isSelected ? 'bg-accent border-accent text-white' : 'border-slate-700 bg-slate-950/40 text-transparent'
                    }`}>
                      {oIdx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { if (currentIdx > 0) { setCurrentIdx(prev => prev - 1); bridge.vibrate(10); } }}
              disabled={currentIdx === 0}
              className="flex-1 bg-slate-950/60 hover:bg-slate-950/90 disabled:opacity-30 border border-slate-800 text-slate-300 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer text-center"
            >
              Previous
            </button>
            
            {currentIdx < quizQuestions.length - 1 ? (
              <button
                onClick={() => { setCurrentIdx(prev => prev + 1); bridge.vibrate(10); }}
                className="flex-1 bg-accent hover:bg-accent-hover text-white py-2.5 rounded-xl font-bold tracking-wide shadow-lg shadow-purple-500/10 transition-all cursor-pointer text-center"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold tracking-wide shadow-lg shadow-emerald-500/10 transition-all cursor-pointer text-center"
              >
                Submit Answers
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. FINAL RESULTS PERFORMANCE REPORT CARD */}
      {mode === 'report' && (
        <div className="space-y-6 pb-20 animate-form-fade text-center max-w-[440px] mx-auto">
          <div className="glass-panel p-5 space-y-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
              <Trophy className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">🧪 Performance Analysis</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Your DPP response is analyzed by our automated evaluators.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-slate-950/40 p-3 border border-slate-800/80 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-500">Accuracy</span>
                <p className="text-sm sm:text-base font-extrabold text-white mt-1">
                  {reportTotal > 0 ? Math.round((reportScore / reportTotal) * 100) : 0}%
                </p>
              </div>
              <div className="bg-slate-950/40 p-3 border border-slate-800/80 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total Score</span>
                <p className="text-sm sm:text-base font-extrabold text-white mt-1">
                  {reportScore} / {reportTotal}
                </p>
              </div>
              <div className="bg-slate-950/40 p-3 border border-slate-800/80 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-500">Rank Impact</span>
                <p className="text-sm sm:text-base font-extrabold text-emerald-400 mt-1">
                  +{reportScore * 10} XP
                </p>
              </div>
            </div>

            {/* Accuracies list breakdown */}
            <div className="glass-panel p-4 text-left space-y-3">
              <h4 className="text-xs font-bold text-white tracking-wide">Subject Accuracy Index</h4>
              <div className="flex justify-between items-center text-xs border-b border-slate-800/40 pb-2">
                <span className="text-slate-400">
                  {chapters.find(c => c.id === selectedChap)?.name || 'Chapter'}
                </span>
                <span className="font-bold text-white">{reportTotal > 0 ? Math.round((reportScore / reportTotal) * 100) : 0}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Daily Solved Streak</span>
                <span className="font-bold text-accent">+1 Multiplier</span>
              </div>
            </div>

            <button
              onClick={() => { setMode('select'); bridge.vibrate(10); }}
              className="w-full bg-accent hover:bg-accent-hover text-white py-2.5 rounded-xl font-bold tracking-wide shadow-lg shadow-purple-500/10 transition-all cursor-pointer text-center"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 4. MOCK SCIENTIFIC CALCULATOR DRAWER OVERLAY */}
      {showCalc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end justify-center z-[9999] p-4">
          <div className="w-full max-w-[320px] bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-fade-scale">
            
            {/* Header controls */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-accent" /> Scientific Calculator
              </h4>
              <button
                onClick={() => { setShowCalc(false); bridge.vibrate(15); }}
                className="p-1 rounded-full bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Display screen */}
            <div className="w-full bg-slate-950/70 border border-slate-850 rounded-2xl p-4 text-right">
              <p className="text-slate-500 font-mono text-[10px] min-h-[14px] truncate">{calcExpression || '0'}</p>
              <h2 className="text-white font-mono text-2xl font-extrabold select-all mt-1 truncate">{calcDisplay}</h2>
            </div>

            {/* Calculator coordinates pad */}
            <div className="grid grid-cols-4 gap-2 text-xs font-bold font-mono">
              {['sin(', 'cos(', 'sqrt(', 'C'].map(c => (
                <button
                  key={c}
                  onClick={() => handleCalcPress(c)}
                  className={`py-3 rounded-xl cursor-pointer ${
                    c === 'C' ? 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25' : 'bg-slate-950/40 border border-slate-800 hover:bg-slate-850 text-slate-300'
                  }`}
                >
                  {c === 'C' ? 'C' : c.replace('(', '')}
                </button>
              ))}

              {['7', '8', '9', '/'].map(c => (
                <button key={c} onClick={() => handleCalcPress(c)} className="py-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:bg-slate-850 text-slate-300 cursor-pointer">{c}</button>
              ))}

              {['4', '5', '6', '*'].map(c => (
                <button key={c} onClick={() => handleCalcPress(c)} className="py-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:bg-slate-850 text-slate-300 cursor-pointer">{c}</button>
              ))}

              {['1', '2', '3', '-'].map(c => (
                <button key={c} onClick={() => handleCalcPress(c)} className="py-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:bg-slate-850 text-slate-300 cursor-pointer">{c}</button>
              ))}

              {['0', '.', '=', '+'].map(c => (
                <button
                  key={c}
                  onClick={() => handleCalcPress(c)}
                  className={`py-3 rounded-xl cursor-pointer ${
                    c === '=' ? 'bg-accent hover:bg-accent-hover text-white shadow-glow' : 'bg-slate-950/40 border border-slate-800 hover:bg-slate-850 text-slate-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPdfViewer && (
        <DppPdfViewer
          pdfUrl={currentPdfUrl}
          questionTitle={currentPdfTitle}
          onClose={handleClosePdfViewer}
        />
      )}

    </div>
  );
}
