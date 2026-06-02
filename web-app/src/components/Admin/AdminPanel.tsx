import React, { useState } from 'react';
import { useApp, Subject, Chapter, DppQuestion, MockTest, LiveExam, LiveTestQuestion, User } from '../../context/AppContext';
import { useAndroidBridge } from '../../hooks/useAndroidBridge';
import { 
  BarChart, BookOpen, Layers, Target, ClipboardList, TestTube, Activity, 
  BookMarked, Users, Trophy, Bell, HardDrive, Settings, Plus, Trash2, Edit2, ShieldAlert
} from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const { 
    state, updateState, logs, subjects, chapters, dppQuestions, mockTests, liveExams, liveTestQuestions, usersList, storageFiles,
    addSubject, deleteSubject, addChapter, deleteChapter, addDppQuestion, updateDppQuestion, deleteDppQuestion,
    addMockTest, addLiveExam, deleteLiveExam, toggleLiveExamActive, updateLiveExamStatus, addLiveTestQuestion, updateLiveTestQuestion, deleteLiveTestQuestion,
    updateUserRole, toggleUserBan, uploadStorageFile, deleteStorageFile, addSystemLog, clearSystemLogs,
    archiveDppQuestions, archiveLiveExams, archiveLiveTestQuestions,
    softDeletedDppQuestions, softDeletedLiveExams, softDeletedLiveTestQuestions,
    restoreDppQuestion, restoreLiveExam, restoreLiveTestQuestion, fetchArchives
  } = useApp();
  const bridge = useAndroidBridge();

  const [activeTab, setActiveTab] = useState<string>('metrics');
  const [recycleSubTab, setRecycleSubTab] = useState<'dpp' | 'live' | 'ltq'>('dpp');

  // Input states for CRUD additions
  const [subName, setSubName] = useState('');
  const [chapSubjId, setChapSubjId] = useState('');
  const [chapName, setChapName] = useState('');

  // DPP Add state
  const [dppSubj, setDppSubj] = useState('');
  const [dppChap, setDppChap] = useState('');

  const [dppType, setDppType] = useState<'MCQ' | 'MSQ' | 'AssertionReason' | 'MatrixMatch'>('MCQ');
  const [dppBody, setDppBody] = useState('');
  const [dppOpts, setDppOpts] = useState<string[]>(['', '', '', '']);
  const [dppAns, setDppAns] = useState<string>('0');
  const [dppExplanation, setDppExplanation] = useState('');
  const [dppTag, setDppTag] = useState('');
  const [dppPdfUrl, setDppPdfUrl] = useState('');
  const [dppIsLivePractice, setDppIsLivePractice] = useState(false);
  const [editingDppId, setEditingDppId] = useState<string | null>(null);
  const [dppDrafts, setDppDrafts] = useState<DppQuestion[]>([]);

  // Mock Test Add state
  const [mockTitle, setMockTitle] = useState('');
  const [mockDur, setMockDur] = useState(180);
  const [mockMarks, setMockMarks] = useState(360);

  // Live Exam Add state
  const [liveTitle, setLiveTitle] = useState('');
  const [liveDesc, setLiveDesc] = useState('');
  const [liveDurMins, setLiveDurMins] = useState(60);
  const [liveSubj, setLiveSubj] = useState('');
  const [liveChap, setLiveChap] = useState('');

  // Live Test Question Add state
  const [ltqExamId, setLtqExamId] = useState('');
  const [ltqType, setLtqType] = useState<'MCQ' | 'SAQ'>('MCQ');
  const [ltqQuestion, setLtqQuestion] = useState('');
  const [ltqOpts, setLtqOpts] = useState(['', '', '', '']);
  const [ltqCorrect, setLtqCorrect] = useState('0');
  const [ltqExplanation, setLtqExplanation] = useState('');
  const [ltqMarks, setLtqMarks] = useState(4);
  const [ltqTag, setLtqTag] = useState('');
  const [ltqPdfUrl, setLtqPdfUrl] = useState('');
  const [ltqIsLivePractice, setLtqIsLivePractice] = useState(false);
  const [showLtqForm, setShowLtqForm] = useState(false);
  const [selectedExamForQ, setSelectedExamForQ] = useState('');
  const [editingLtqId, setEditingLtqId] = useState<string | null>(null);

  // Article Add state
  const [artTitle, setArtTitle] = useState('');
  const [artDesc, setArtDesc] = useState('');

  // Scheduled Start Time Pickers per exam ID
  const [schTimes, setSchTimes] = useState<Record<string, string>>({});

  // Notification state
  const [notifMsg, setNotifMsg] = useState('');

  // File Upload state
  const [fileUploadName, setFileUploadName] = useState('');

  // Master settings
  const [maintenance, setMaintenance] = useState(state.isMaintenanceMode);
  const [themeColor, setThemeColor] = useState(state.accentTheme);

  // Sidebar list mapping
  const sidebarTabs = [
    { id: 'metrics', label: '📊 System Metrics', icon: BarChart },
    { id: 'subjects', label: '📚 Manage Subjects', icon: BookOpen },
    { id: 'chapters', label: '📘 Manage Chapters', icon: Layers },
    { id: 'dpp', label: '📝 DPP Management', icon: ClipboardList },
    { id: 'mock', label: '🧪 Mock Test Config', icon: TestTube },
    { id: 'live', label: '🔴 Live Exam Room', icon: Activity },
    { id: 'articles', label: '📖 Article CMS Feed', icon: BookMarked },
    { id: 'alerts', label: '📢 Notifications', icon: Bell },
    { id: 'storage', label: '📂 Cloud Storage', icon: HardDrive },
    { id: 'settings', label: '⚙️ Settings Console', icon: Settings },
    { id: 'recycle', label: '♻️ Recycle Bin', icon: Trash2 },
  ];

  // Helper handles
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;
    addSubject(subName.trim());
    setSubName('');
    bridge.vibrate(15);
  };

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapSubjId || !chapName.trim()) return;
    addChapter(chapSubjId, chapName.trim());
    setChapName('');
    bridge.vibrate(15);
  };


  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dppChap || !dppBody.trim() || !dppAns.trim()) {
      bridge.showToast('Please fill all required question fields');
      return;
    }

    if (editingDppId) {
      if (editingDppId.startsWith('draft-')) {
        // Update draft
        setDppDrafts(prev => prev.map(draft => 
          draft.id === editingDppId 
            ? {
                ...draft,
                type: dppType as any,
                question: dppBody.trim(),
                options: dppOpts.map(o => o.trim()),
                answer: dppAns,
                explanation: dppExplanation.trim() || 'Pending explanation',
                tags: dppTag.trim() ? [dppTag.trim()] : undefined,
                pdfUrl: dppPdfUrl.trim() || undefined,
                isLivePractice: dppIsLivePractice
              }
            : draft
        ));
      } else {
        // Update published question
        updateDppQuestion(editingDppId, {
          type: dppType as any,
          question: dppBody.trim(),
          options: dppOpts.map(o => o.trim()),
          answer: dppAns,
          explanation: dppExplanation.trim() || 'Pending explanation',
          tags: dppTag.trim() ? [dppTag.trim()] : undefined,
          pdfUrl: dppPdfUrl.trim() || undefined,
          isLivePractice: dppIsLivePractice
        });
      }
      setEditingDppId(null);
    } else {
      // Add new draft
      const newDraft: DppQuestion = {
        id: `draft-${Date.now()}`,
        chapterId: dppChap,
        type: dppType as any,
        question: dppBody.trim(),
        options: dppOpts.map(o => o.trim()),
        answer: dppAns,
        explanation: dppExplanation.trim() || 'Pending explanation',
        tags: dppTag.trim() ? [dppTag.trim()] : undefined,
        pdfUrl: dppPdfUrl.trim() || undefined,
        isLivePractice: dppIsLivePractice
      };
      setDppDrafts(prev => [...prev, newDraft]);
    }

    setDppBody('');
    setDppOpts(['', '', '', '']);
    setDppExplanation('');
    setDppTag('');
    setDppPdfUrl('');
    setDppIsLivePractice(false);
    bridge.vibrate(15);
  };

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockTitle.trim()) return;
    addMockTest({
      title: mockTitle.trim(),
      duration: mockDur,
      totalMarks: mockMarks
    });
    setMockTitle('');
    bridge.vibrate(15);
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveTitle.trim()) return;
    addLiveExam({
      title: liveTitle.trim(),
      description: liveDesc.trim(),
      durationMinutes: liveDurMins,
      isActive: false,
      pdfUrl: undefined,
      subjectId: liveSubj || undefined,
      chapterId: liveChap || undefined
    });
    setLiveTitle('');
    setLiveDesc('');
    setLiveDurMins(60);
    setLiveSubj('');
    setLiveChap('');
    bridge.vibrate(15);
  };

  const handleAddLiveTestQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ltqExamId || !ltqQuestion.trim() || (ltqType === 'MCQ' && ltqOpts.some(o => !o.trim())) || (ltqType === 'SAQ' && !ltqCorrect.toString().trim())) {
      bridge.showToast('Please fill all required question fields');
      return;
    }

    if (editingLtqId) {
      updateLiveTestQuestion(editingLtqId, {
        type: ltqType,
        question: ltqQuestion.trim(),
        options: ltqType === 'MCQ' ? ltqOpts.map(o => o.trim()) : [],
        correctAnswer: ltqType === 'MCQ' ? Number(ltqCorrect) : ltqCorrect.toString().trim(),
        explanation: ltqExplanation.trim(),
        marks: ltqMarks,
        tags: ltqTag.trim() ? [ltqTag.trim()] : undefined,
        pdfUrl: ltqPdfUrl.trim() || undefined,
        isLivePractice: ltqIsLivePractice
      });
      setEditingLtqId(null);
    } else {
      const existingQs = liveTestQuestions.filter(q => q.examId === ltqExamId);
      addLiveTestQuestion({
        examId: ltqExamId,
        type: ltqType,
        question: ltqQuestion.trim(),
        options: ltqType === 'MCQ' ? ltqOpts.map(o => o.trim()) : [],
        correctAnswer: ltqType === 'MCQ' ? Number(ltqCorrect) : ltqCorrect.toString().trim(),
        explanation: ltqExplanation.trim(),
        marks: ltqMarks,
        questionOrder: existingQs.length,
        tags: ltqTag.trim() ? [ltqTag.trim()] : undefined,
        pdfUrl: ltqPdfUrl.trim() || undefined,
        isLivePractice: ltqIsLivePractice
      });
    }

    setLtqType('MCQ');
    setLtqQuestion('');
    setLtqOpts(['', '', '', '']);
    setLtqCorrect('0');
    setLtqExplanation('');
    setLtqTag('');
    setLtqPdfUrl('');
    setLtqIsLivePractice(false);
    bridge.vibrate(15);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifMsg.trim()) return;
    addSystemLog(`[Broadcast Alert] Fired alert: ${notifMsg}`);
    bridge.showToast("Push notification broadcasted successfully!");
    setNotifMsg('');
    bridge.vibrate(50);
  };

  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUploadName.trim()) return;
    uploadStorageFile(fileUploadName.trim());
    setFileUploadName('');
    bridge.vibrate(15);
  };

  const handleToggleMaintenance = (checked: boolean) => {
    setMaintenance(checked);
    updateState({ isMaintenanceMode: checked });
    addSystemLog(`[Maintenance Console] Maintenance mode set: ${checked ? 'ACTIVE' : 'INACTIVE'}`);
    bridge.vibrate(40);
  };

  return (
    <div className="flex-1 w-full bg-[#070913] flex flex-col text-left">
      {/* Top Header Controls */}
      <header className="flex justify-between items-center bg-slate-950/60 border-b border-slate-800/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { onClose(); bridge.vibrate(10); }}
            className="text-xs font-bold text-accent hover:text-accent-hover active:scale-95 transition-all bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-xl cursor-pointer"
          >
            ← Leave CMS
          </button>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide flex items-center gap-1.5">
              🛡️ Supreme CMS Console
            </h2>
            <p className="text-[10px] text-slate-400">Manage and configure database catalog tables</p>
          </div>
        </div>
        <button 
          onClick={() => { onClose(); bridge.vibrate(10); }}
          className="text-[10px] font-extrabold bg-accent hover:bg-accent-hover text-white px-4 py-1.5 rounded-full cursor-pointer shadow-lg shadow-accent/20 active:scale-95 transition-all flex items-center gap-1.5"
        >
          🎓 Student Portal
        </button>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Scrollable Sidebar Navigation */}
        <div className="w-[85px] sm:w-[220px] bg-slate-950/40 border-r border-slate-800/60 overflow-y-auto px-2 py-4 flex flex-col gap-1 select-none">
          {sidebarTabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { 
                  setActiveTab(t.id); 
                  if (t.id === 'recycle') {
                    fetchArchives();
                  }
                  bridge.vibrate(10); 
                }}
                className={`w-full flex flex-col sm:flex-row items-center gap-2 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-accent text-white shadow-glow' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[8px] sm:text-xs font-semibold tracking-wide block sm:inline text-center sm:text-left truncate">
                  {t.label.split(' ').slice(1).join(' ')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Active Panel Display */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-950/20">
          
          {/* TAB 1: SYSTEM METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-6 animate-form-fade">
              {/* KPI cards grid - Real data from state */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950/45 p-4 border border-slate-800/80 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total Users</span>
                  <p className="text-base sm:text-lg font-extrabold text-white mt-1">{usersList.length}</p>
                </div>
                <div className="bg-slate-950/45 p-4 border border-slate-800/80 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total Subjects</span>
                  <p className="text-base sm:text-lg font-extrabold text-white mt-1">{subjects.length}</p>
                </div>
                <div className="bg-slate-950/45 p-4 border border-slate-800/80 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total DPPs</span>
                  <p className="text-base sm:text-lg font-extrabold text-white mt-1">{dppQuestions.length}</p>
                </div>

              </div>

              {/* Revenue - Coming Soon */}
              <div className="glass-panel p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto animate-pulse">
                  <Settings className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-extrabold text-white">Revenue Analytics</h3>
                <p className="text-sm text-slate-400">Coming soon - Track your earnings and subscription metrics</p>
              </div>

              {/* Real data growth chart based on actual content */}
              <div className="glass-panel p-5 space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">📈 Content Growth</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-4">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Chapters</p>
                    <p className="text-2xl font-extrabold text-white">{chapters.length}</p>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-4">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Mock Tests</p>
                    <p className="text-2xl font-extrabold text-white">{mockTests.length}</p>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-4">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Live Exams</p>
                    <p className="text-2xl font-extrabold text-white">{liveExams.length}</p>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-4">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Storage Files</p>
                    <p className="text-2xl font-extrabold text-white">{storageFiles.length}</p>
                  </div>
                </div>
              </div>

              {/* Dynamic telemetry activity logs */}
              <div className="glass-panel p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">📜 Realtime telemetry Logs</h3>
                  <button
                    onClick={() => { clearSystemLogs(); bridge.vibrate(10); }}
                    className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Clear log
                  </button>
                </div>
                <div className="bg-slate-950/70 border border-slate-900 rounded-xl p-4 font-mono text-[10px] text-slate-300 leading-normal space-y-1.5 h-[140px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-slate-500 italic">No logs generated.</p>
                  ) : (
                    logs.map((logStr, lIdx) => <p key={lIdx} className="truncate">{logStr}</p>)
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE SUBJECTS */}
          {activeTab === 'subjects' && (
            <div className="space-y-6 animate-form-fade">
              {/* Add form */}
              <form onSubmit={handleAddSubject} className="glass-panel p-5 flex gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add Subject</label>
                  <input
                    type="text"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder="e.g. Advanced Biology"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none"
                    required
                  />
                </div>
                <button type="submit" className="bg-accent hover:bg-accent-hover text-white p-2.5 rounded-xl active:scale-95 transition-all cursor-pointer">
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Subject lists grid */}
              <div className="glass-panel p-5 space-y-3">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Active Subjects Catalog</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-500 font-bold">
                        <th className="py-2.5">ID</th>
                        <th className="py-2.5">Subject Name</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(s => (
                        <tr key={s.id} className="border-b border-slate-900/60 hover:bg-slate-950/15">
                          <td className="py-3 font-semibold text-slate-400">{s.id}</td>
                          <td className="py-3 font-bold text-white">{s.name}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => { deleteSubject(s.id); bridge.vibrate(15); }}
                              className="p-1 rounded bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 active:scale-90 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE CHAPTERS */}
          {activeTab === 'chapters' && (
            <div className="space-y-6 animate-form-fade">
              {/* Add form */}
              <form onSubmit={handleAddChapter} className="glass-panel p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Parent Subject</label>
                  <select
                    value={chapSubjId}
                    onChange={(e) => setChapSubjId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chapter Title</label>
                    <input
                      type="text"
                      value={chapName}
                      onChange={(e) => setChapName(e.target.value)}
                      placeholder="e.g. Kinematics"
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none"
                      required
                    />
                  </div>
                  <button type="submit" className="bg-accent hover:bg-accent-hover text-white p-2.5 rounded-xl active:scale-95 transition-all cursor-pointer">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Chapters lists */}
              <div className="glass-panel p-5 space-y-3">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Chapters Database catalog</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-500 font-bold">
                        <th className="py-2.5">ID</th>
                        <th className="py-2.5">Parent Subject</th>
                        <th className="py-2.5">Chapter Title</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chapters.map(c => {
                        const parent = subjects.find(s => s.id === c.subjectId)?.name || 'Unknown';
                        return (
                          <tr key={c.id} className="border-b border-slate-900/60 hover:bg-slate-950/15">
                            <td className="py-3 font-semibold text-slate-400">{c.id}</td>
                            <td className="py-3 text-slate-300 font-semibold">{parent}</td>
                            <td className="py-3 font-bold text-white">{c.name}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => { deleteChapter(c.id); bridge.vibrate(15); }}
                                className="p-1 rounded bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 active:scale-90 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* TAB 5: DPP MANAGEMENT */}
          {activeTab === 'dpp' && (
            <div className="space-y-6 animate-form-fade">
              <div className="glass-panel p-5 space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
                  📝 DPP Questions Builder
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[800px]">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">Select Subject</label>
                    <select
                      value={dppSubj}
                      onChange={(e) => { 
                        setDppSubj(e.target.value); 
                        setDppChap(''); 
                        setEditingDppId(null);
                        setDppBody('');
                        setDppOpts(['', '', '', '']);
                        setDppAns('0');
                        setDppExplanation('');
                        setDppTag('');
                        setDppPdfUrl('');
                        setDppIsLivePractice(false);
                      }}
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-3 text-xs text-white cursor-pointer outline-none"
                    >
                      <option value="" className="bg-slate-950">-- Select Subject --</option>
                      {subjects.map(s => <option key={s.id} value={s.id} className="bg-slate-950">{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">Select Chapter</label>
                    <select
                      value={dppChap}
                      disabled={!dppSubj}
                      onChange={(e) => {
                        setDppChap(e.target.value);
                        setEditingDppId(null);
                        setDppBody('');
                        setDppOpts(['', '', '', '']);
                        setDppAns('0');
                        setDppExplanation('');
                        setDppTag('');
                        setDppPdfUrl('');
                        setDppIsLivePractice(false);
                      }}
                      className="w-full bg-slate-950/60 border border-slate-800 disabled:opacity-30 focus:border-accent rounded-xl py-2.5 px-3 text-xs text-white cursor-pointer outline-none"
                    >
                      <option value="" className="bg-slate-950">-- Select Chapter --</option>
                      {chapters.filter(c => c.subjectId === dppSubj).map(c => {
                        const qCount = dppQuestions.filter(q => q.chapterId === c.id).length;
                        return (
                          <option key={c.id} value={c.id} className="bg-slate-950">{c.name} ({qCount} Qs)</option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {dppChap && (() => {
                  const targetQs = dppQuestions.filter(q => q.chapterId === dppChap);
                  
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 border-t border-slate-900 animate-form-fade">
                      {/* Left Form: Add/Edit Question */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                            {editingDppId ? '✏️ Edit DPP Question' : '➕ Add New DPP Question'}
                          </h4>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-accent/15 border border-accent/25 text-accent">
                            {targetQs.length} Questions Configured
                          </span>
                        </div>

                        <form onSubmit={handleAddQuestion} className="space-y-4 bg-slate-950/20 border border-slate-900 rounded-xl p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5 sm:col-span-2">
                              <label className="text-[10px] font-bold text-slate-400 block">Question Type</label>
                              <select
                                value={dppType}
                                onChange={(e) => setDppType(e.target.value as any)}
                                className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-3 text-xs text-white cursor-pointer outline-none"
                              >
                                <option value="MCQ" className="bg-slate-950">Multiple Choice (MCQ)</option>
                                <option value="MSQ" className="bg-slate-950">Multiple Select (MSQ)</option>
                                <option value="AssertionReason" className="bg-slate-950">Assertion & Reason</option>
                                <option value="MatrixMatch" className="bg-slate-950">Matrix Match</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 block">Question Text *</label>
                            <textarea 
                              value={dppBody} 
                              onChange={e => setDppBody(e.target.value)}
                              placeholder="Enter the question text..." 
                              rows={3}
                              className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none resize-none" 
                              required 
                            />
                          </div>

                          {/* Options Input Block */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 block">Answer Options *</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {dppOpts.map((opt, i) => (
                                <div key={i} className="relative flex items-center">
                                  <span className="absolute left-3 text-[10px] font-extrabold text-slate-500 bg-slate-900 border border-slate-800 w-5 h-5 rounded-full flex items-center justify-center">
                                    {String.fromCharCode(65 + i)}
                                  </span>
                                  <input 
                                    type="text" 
                                    value={opt}
                                    onChange={e => { 
                                      const n = [...dppOpts]; 
                                      n[i] = e.target.value; 
                                      setDppOpts(n); 
                                    }}
                                    placeholder={`Option ${i + 1}`}
                                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 pl-10 pr-3 text-xs text-white outline-none" 
                                    required 
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 block">Correct Answer Option *</label>
                              <select 
                                value={dppAns} 
                                onChange={e => setDppAns(e.target.value)}
                                className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-3 text-xs text-white outline-none cursor-pointer"
                              >
                                {dppOpts.map((_, i) => (
                                  <option key={i} value={i} className="bg-slate-950">
                                    Option {String.fromCharCode(65 + i)} (Index {i})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 block">Explanation (optional)</label>
                            <textarea 
                              value={dppExplanation} 
                              onChange={e => setDppExplanation(e.target.value)}
                              placeholder="Why is this the correct answer?" 
                              rows={2}
                              className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none resize-none" 
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 block">Exam Tag (glowing border alert)</label>
                              <input
                                type="text"
                                value={dppTag}
                                onChange={(e) => setDppTag(e.target.value)}
                                placeholder="e.g. JEE MAIN 2024, Olympiad Tag"
                                className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 block">PDF URL (Optional)</label>
                              <input
                                type="url"
                                value={dppPdfUrl}
                                onChange={(e) => setDppPdfUrl(e.target.value)}
                                placeholder="https://example.com/question.pdf"
                                className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-slate-950/30 border border-slate-800 rounded-xl">
                            <input
                              type="checkbox"
                              id="dppLivePractice"
                              checked={dppIsLivePractice}
                              onChange={(e) => setDppIsLivePractice(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-accent focus:ring-accent cursor-pointer"
                            />
                            <label htmlFor="dppLivePractice" className="text-xs font-bold text-white cursor-pointer select-none">
                              Enable Live Practice Mode
                            </label>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              type="submit" 
                              className="flex-1 bg-accent hover:bg-accent-hover text-white py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-lg active:scale-[0.99] flex items-center justify-center gap-1.5"
                            >
                              {editingDppId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} 
                              {editingDppId ? (editingDppId.startsWith('draft-') ? 'Update Draft' : 'Update Published Question') : 'Save to Drafts'}
                            </button>
                            {editingDppId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDppId(null);
                                  setDppBody('');
                                  setDppOpts(['', '', '', '']);
                                  setDppAns('0');
                                  setDppExplanation('');
                                  setDppTag('');
                                  setDppPdfUrl('');
                                  setDppIsLivePractice(false);
                                }}
                                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      {/* Right Side: Questions Preview List */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                            📋 Questions Catalog
                          </h4>
                          {dppDrafts.filter(d => d.chapterId === dppChap).length > 0 && (
                            <button
                              onClick={() => {
                                const chapterDrafts = dppDrafts.filter(d => d.chapterId === dppChap);
                                chapterDrafts.forEach(draft => {
                                  // Call context function (removing the temporary draft ID)
                                  addDppQuestion({
                                    chapterId: draft.chapterId,
                                    type: draft.type,
                                    question: draft.question,
                                    options: draft.options,
                                    answer: draft.answer,
                                    explanation: draft.explanation,
                                    tags: draft.tags,
                                    pdfUrl: draft.pdfUrl,
                                    isLivePractice: draft.isLivePractice
                                  });
                                });
                                // Clear published drafts
                                setDppDrafts(prev => prev.filter(d => d.chapterId !== dppChap));
                                bridge.showToast(`Published ${chapterDrafts.length} questions successfully!`);
                                bridge.vibrate(50);
                              }}
                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse transition-all flex items-center gap-1 cursor-pointer"
                            >
                              🚀 Publish All {dppDrafts.filter(d => d.chapterId === dppChap).length} Drafts
                            </button>
                          )}
                        </div>

                        {dppDrafts.filter(q => q.chapterId === dppChap).length > 0 && (
                          <div className="space-y-3 mb-6 animate-form-fade">
                            <h5 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider border-b border-amber-500/20 pb-1">Unpublished Drafts</h5>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                              {dppDrafts.filter(q => q.chapterId === dppChap).map((q, idx) => (
                                <div 
                                  key={q.id} 
                                  className={`bg-amber-950/20 border ${editingDppId === q.id ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'border-amber-500/30 hover:border-amber-500/50'} rounded-xl p-3.5 space-y-2.5 transition-all relative group`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[10px] font-extrabold bg-amber-950 border border-amber-800 px-2 py-0.5 rounded text-amber-500">
                                        Draft {idx + 1}
                                      </span>
                                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                                        {q.type}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => {
                                          setEditingDppId(q.id);
                                          setDppType(q.type || 'MCQ');
                                          setDppBody(q.question);
                                          setDppOpts(q.options.length >= 4 ? q.options : [...q.options, ...Array(4 - q.options.length).fill('')]);
                                          setDppAns(q.answer.toString());
                                          setDppExplanation(q.explanation || '');
                                          setDppTag(q.tags && q.tags.length > 0 ? q.tags[0] : '');
                                          setDppPdfUrl(q.pdfUrl || '');
                                          setDppIsLivePractice(!!q.isLivePractice);
                                          bridge.vibrate(10);
                                        }}
                                        className="p-1.5 rounded-lg bg-amber-900/30 border border-amber-800 text-amber-400 hover:text-amber-300 hover:border-amber-500 transition-all cursor-pointer"
                                        title="Edit Draft"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setDppDrafts(prev => prev.filter(d => d.id !== q.id));
                                          if (editingDppId === q.id) setEditingDppId(null);
                                          bridge.vibrate(15);
                                        }}
                                        className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                                        title="Delete Draft"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium line-clamp-2">
                                    {q.question}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-1">Published Questions</h5>
                        {targetQs.length === 0 ? (
                          <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500 italic">
                            No published questions for this chapter yet.
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                            {targetQs.map((q, idx) => (
                              <div 
                                key={q.id} 
                                className={`bg-slate-950/40 border ${editingDppId === q.id ? 'border-accent shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'border-slate-900 hover:border-slate-800'} rounded-xl p-3.5 space-y-2.5 transition-all relative group animate-form-fade`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] font-extrabold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-accent">
                                      Q{idx + 1}
                                    </span>
                                    <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                                      {q.type}
                                    </span>
                                    {q.tags && q.tags.length > 0 && (
                                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
                                        🏷️ {q.tags.join(', ')}
                                      </span>
                                    )}
                                    {q.pdfUrl && (
                                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
                                        📄 PDF
                                      </span>
                                    )}
                                    {q.isLivePractice && (
                                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse">
                                        🔴 Live Mode
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => {
                                        setEditingDppId(q.id);
                                        setDppType(q.type || 'MCQ');
                                        setDppBody(q.question);
                                        setDppOpts(q.options.length >= 4 ? q.options : [...q.options, ...Array(4 - q.options.length).fill('')]);
                                        setDppAns(q.answer.toString());
                                        setDppExplanation(q.explanation || '');
                                        setDppTag(q.tags && q.tags.length > 0 ? q.tags[0] : '');
                                        setDppPdfUrl(q.pdfUrl || '');
                                        setDppIsLivePractice(!!q.isLivePractice);
                                        bridge.vibrate(10);
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 active:scale-95 transition-all cursor-pointer"
                                      title="Edit Question"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        deleteDppQuestion(q.id);
                                        if (editingDppId === q.id) {
                                          setEditingDppId(null);
                                        }
                                        bridge.vibrate(15);
                                      }}
                                      className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer"
                                      title="Delete Question"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                
                                <p className="text-[11px] text-slate-300 leading-relaxed font-medium line-clamp-3">
                                  {q.question}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {q.options.map((opt, oIdx) => (
                                    <div 
                                      key={oIdx} 
                                      className={`text-[9px] px-2 py-1.5 rounded border ${q.answer.toString() === oIdx.toString() ? 'bg-green-500/10 border-green-500/30 text-green-400 font-bold' : 'bg-slate-900/50 border-slate-800/50 text-slate-500'} truncate`}
                                    >
                                      {String.fromCharCode(65 + oIdx)}. {opt}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 6: MOCK TEST CONFIG */}
          {activeTab === 'mock' && (
            <div className="space-y-6 animate-form-fade">
              <div className="glass-panel p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto animate-pulse">
                  <Target className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-extrabold text-white">Mock Test Config</h3>
                <p className="text-sm text-slate-400">Coming soon - Compile and publish full-length mock exams for students</p>
              </div>
            </div>
          )}

          {/* TAB 7: LIVE EXAM ROOM */}
          {activeTab === 'live' && (
            <div className="space-y-6 animate-form-fade">
              {/* CREATE EXAM FORM */}
              <form onSubmit={handleAddExam} className="glass-panel p-5 space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-accent" /> Create Live Test
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">Test Title *</label>
                    <input type="text" value={liveTitle} onChange={e => setLiveTitle(e.target.value)}
                      placeholder="e.g. JEE Advanced Full Syllabus Test 1"
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">Duration (minutes) *</label>
                    <input type="number" value={liveDurMins} onChange={e => setLiveDurMins(Number(e.target.value))}
                      min={5} max={360}
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none" required />
                  </div>
                  
                  {/* Subject and Chapter selections */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">Syllabus Subject (optional)</label>
                    <select
                      value={liveSubj}
                      onChange={(e) => { setLiveSubj(e.target.value); setLiveChap(''); }}
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-950">-- Select Subject --</option>
                      {subjects.map(s => <option key={s.id} value={s.id} className="bg-slate-950">{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">Syllabus Chapter (optional)</label>
                    <select
                      value={liveChap}
                      disabled={!liveSubj}
                      onChange={(e) => setLiveChap(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent disabled:opacity-30 rounded-xl py-2 px-3 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-950">-- Select Chapter --</option>
                      {chapters.filter(c => c.subjectId === liveSubj).map(c => (
                        <option key={c.id} value={c.id} className="bg-slate-950">{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block">Description (optional)</label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <input type="text" value={liveDesc} onChange={e => setLiveDesc(e.target.value)}
                        placeholder="e.g. Full syllabus test covering Physics, Chemistry, Mathematics"
                        className="flex-1 w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-3 text-xs text-white outline-none" />
                      <button type="submit" className="bg-accent hover:bg-accent-hover text-white w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-[0.98]">
                        <Plus className="w-3.5 h-3.5" /> Create Test
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* ADD QUESTION WORKSPACE */}
              {liveExams.length > 0 && (
                <div className="glass-panel p-5 space-y-4">
                  <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
                    📝 Exam Questions Builder
                  </h3>
                  
                  <div className="space-y-1.5 max-w-[400px]">
                    <label className="text-[10px] font-bold text-slate-400 block">Select Target Exam</label>
                    <select 
                      value={ltqExamId} 
                      onChange={e => {
                        setLtqExamId(e.target.value);
                        setEditingLtqId(null);
                        setLtqType('MCQ');
                        setLtqQuestion('');
                        setLtqOpts(['', '', '', '']);
                        setLtqCorrect('0');
                        setLtqExplanation('');
                        setLtqTag('');
                        setLtqPdfUrl('');
                        setLtqIsLivePractice(false);
                        bridge.vibrate(10);
                      }}
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-3 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-950">-- Select a Test to Manage Questions --</option>
                      {liveExams.map(ex => {
                        const qCount = liveTestQuestions.filter(q => q.examId === ex.id).length;
                        return (
                          <option key={ex.id} value={ex.id} className="bg-slate-950">
                            {ex.title} ({qCount} Qs · {ex.durationMinutes}m)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {ltqExamId && (() => {
                    const selectedExam = liveExams.find(ex => ex.id === ltqExamId);
                    if (!selectedExam) return null;
                    
                    const isDraft = !selectedExam.status || selectedExam.status === 'Draft';
                    const targetQs = liveTestQuestions.filter(q => q.examId === ltqExamId);
                    
                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-slate-900 animate-form-fade">
                        {/* Left Form: Add Question */}
                        <div className="lg:col-span-7 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                              {editingLtqId ? '✏️ Edit Question' : '➕ Add New Question'}
                            </h4>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-accent/15 border border-accent/25 text-accent">
                              {targetQs.length} Questions Configured
                            </span>
                          </div>

                          {!isDraft ? (
                            <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 text-center text-xs text-amber-400 font-bold flex items-center justify-center gap-1.5">
                              🔒 Questions locked. Status is "{selectedExam.status}". Transition back to Draft to modify questions.
                            </div>
                          ) : (
                            <form onSubmit={handleAddLiveTestQuestion} className="space-y-4 bg-slate-950/20 border border-slate-900 rounded-xl p-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 block">Question Type *</label>
                                <select 
                                  value={ltqType} 
                                  onChange={e => {
                                    setLtqType(e.target.value as 'MCQ' | 'SAQ');
                                    setLtqCorrect(e.target.value === 'MCQ' ? '0' : '');
                                  }}
                                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none cursor-pointer"
                                >
                                  <option value="MCQ" className="bg-slate-950">Multiple Choice (MCQ)</option>
                                  <option value="SAQ" className="bg-slate-950">Short Answer (SAQ)</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 block">Question Text *</label>
                                <textarea 
                                  value={ltqQuestion} 
                                  onChange={e => setLtqQuestion(e.target.value)}
                                  placeholder="Enter the question text..." 
                                  rows={3}
                                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none resize-none" 
                                  required 
                                />
                              </div>

                              {/* Options Input Block */}
                              {ltqType === 'MCQ' && (
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 block">Answer Options *</label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {ltqOpts.map((opt, i) => (
                                      <div key={i} className="relative flex items-center">
                                        <span className="absolute left-3 text-[10px] font-extrabold text-slate-500 bg-slate-900 border border-slate-800 w-5 h-5 rounded-full flex items-center justify-center">
                                          {String.fromCharCode(65 + i)}
                                        </span>
                                        <input 
                                          type="text" 
                                          value={opt}
                                          onChange={e => { 
                                            const n = [...ltqOpts]; 
                                            n[i] = e.target.value; 
                                            setLtqOpts(n); 
                                          }}
                                          placeholder={`Option ${i + 1}`}
                                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 pl-10 pr-3 text-xs text-white outline-none" 
                                          required={ltqType === 'MCQ'}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-400 block">Correct Answer Option *</label>
                                  {ltqType === 'MCQ' ? (
                                    <select 
                                      value={ltqCorrect} 
                                      onChange={e => setLtqCorrect(e.target.value)}
                                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-3 text-xs text-white outline-none cursor-pointer"
                                    >
                                      {ltqOpts.map((_, i) => (
                                        <option key={i} value={i} className="bg-slate-950">
                                          Option {String.fromCharCode(65 + i)} (Index {i})
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input 
                                      type="text"
                                      value={ltqCorrect}
                                      onChange={e => setLtqCorrect(e.target.value)}
                                      placeholder="e.g. 42 or Newton"
                                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-3 text-xs text-white outline-none"
                                      required
                                    />
                                  )}
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-400 block">Marks per Question</label>
                                  <input 
                                    type="number" 
                                    value={ltqMarks} 
                                    onChange={e => setLtqMarks(Number(e.target.value))}
                                    min={1} 
                                    max={10}
                                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none" 
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 block">Explanation (optional)</label>
                                <textarea 
                                  value={ltqExplanation} 
                                  onChange={e => setLtqExplanation(e.target.value)}
                                  placeholder="Why is this the correct answer?" 
                                  rows={2}
                                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none resize-none" 
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 block">Exam Tag (glowing border alert)</label>
                                  <input
                                    type="text"
                                    value={ltqTag}
                                    onChange={(e) => setLtqTag(e.target.value)}
                                    placeholder="e.g. JEE MAIN 2024, Olympiad Tag"
                                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 block">PDF URL (Optional)</label>
                                  <input
                                    type="url"
                                    value={ltqPdfUrl}
                                    onChange={(e) => setLtqPdfUrl(e.target.value)}
                                    placeholder="https://example.com/question.pdf"
                                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-slate-950/30 border border-slate-800 rounded-xl">
                                <input
                                  type="checkbox"
                                  id="ltqLivePractice"
                                  checked={ltqIsLivePractice}
                                  onChange={(e) => setLtqIsLivePractice(e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-accent focus:ring-accent cursor-pointer"
                                />
                                <label htmlFor="ltqLivePractice" className="text-xs font-bold text-white cursor-pointer select-none">
                                  Enable Live Practice Mode
                                </label>
                              </div>

                              <div className="flex items-center gap-2">
                                <button 
                                  type="submit" 
                                  className="flex-1 bg-accent hover:bg-accent-hover text-white py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-lg active:scale-[0.99] flex items-center justify-center gap-1.5"
                                >
                                  {editingLtqId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} 
                                  {editingLtqId ? 'Update Question' : 'Publish & Add Question'}
                                </button>
                                {editingLtqId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingLtqId(null);
                                      setLtqType('MCQ');
                                      setLtqQuestion('');
                                      setLtqOpts(['', '', '', '']);
                                      setLtqCorrect('0');
                                      setLtqExplanation('');
                                      setLtqTag('');
                                      setLtqPdfUrl('');
                                      setLtqIsLivePractice(false);
                                    }}
                                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </form>
                          )}
                        </div>

                        {/* Right Side: Live Questions Preview */}
                        <div className="lg:col-span-5 space-y-4">
                          <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                            📋 Questions List Preview
                          </h4>
                          
                          {targetQs.length === 0 ? (
                            <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500 italic">
                              No questions added to this test yet. Use the left form to build questions!
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                              {targetQs.map((q, idx) => (
                                <div 
                                  key={q.id} 
                                  className="bg-slate-950/40 border border-slate-900 hover:border-slate-800 rounded-xl p-3.5 space-y-2.5 transition-all relative group animate-form-fade"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[10px] font-extrabold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-accent">
                                        Q{idx + 1} ({q.marks}M)
                                      </span>
                                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                                        {q.type || 'MCQ'}
                                      </span>
                                      {q.tags && q.tags.length > 0 && (
                                        <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
                                          🏷️ {q.tags.join(', ')}
                                        </span>
                                      )}
                                      {q.pdfUrl && (
                                        <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
                                          📄 PDF
                                        </span>
                                      )}
                                      {q.isLivePractice && (
                                        <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse">
                                          🟢 Live
                                        </span>
                                      )}
                                    </div>
                                    {isDraft && (
                                      <div className="flex items-center gap-1">
                                        <button 
                                          type="button"
                                          onClick={() => { 
                                            setEditingLtqId(q.id);
                                            setLtqType(q.type || 'MCQ');
                                            setLtqQuestion(q.question);
                                            setLtqOpts(q.options || ['', '', '', '']);
                                            setLtqCorrect(q.correctAnswer.toString());
                                            setLtqExplanation(q.explanation || '');
                                            setLtqMarks(q.marks || 4);
                                            setLtqTag(q.tags && q.tags.length ? q.tags[0] : '');
                                            setLtqPdfUrl(q.pdfUrl || '');
                                            setLtqIsLivePractice(q.isLivePractice || false);
                                            bridge.vibrate(10); 
                                          }}
                                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-1.5 rounded-lg transition-all border border-transparent hover:border-blue-500/20 cursor-pointer"
                                          title="Edit Question"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                          onClick={() => { 
                                            deleteLiveTestQuestion(q.id); 
                                            bridge.vibrate(15); 
                                          }}
                                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-all border border-transparent hover:border-red-500/20 cursor-pointer"
                                          title="Delete Question"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs font-semibold text-white leading-relaxed break-words">{q.question}</p>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-950/20 p-2 rounded-lg border border-slate-900/60">
                                    {q.options.map((opt, oIdx) => {
                                      const isCorrect = q.correctAnswer === oIdx;
                                      return (
                                        <div 
                                          key={oIdx} 
                                          className={`truncate py-1 px-1.5 rounded flex items-center gap-1.5 ${
                                            isCorrect 
                                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold' 
                                              : ''
                                          }`}
                                        >
                                          <span className="font-extrabold opacity-60">
                                            {String.fromCharCode(65 + oIdx)}.
                                          </span>
                                          <span className="truncate">{opt}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {q.explanation && (
                                    <p className="text-[9px] text-slate-500 leading-normal italic mt-1.5 border-t border-slate-900/60 pt-1.5">
                                      💡 Explanation: {q.explanation}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* LIVE EXAMS LISTING */}
              <div className="glass-panel p-5 space-y-3">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Live Tests Catalog</h3>
                {liveExams.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No live tests created yet.</p>
                ) : (
                  <div className="space-y-3">
                    {liveExams.map(ex => {
                      const qs = liveTestQuestions.filter(q => q.examId === ex.id);
                      const totalMarks = qs.reduce((s, q) => s + q.marks, 0);
                      const status = ex.status || 'Draft';
                      
                      // Status colors
                      let statusBadge = "bg-slate-900 border-slate-800 text-slate-500";
                      if (status === 'Scheduled') statusBadge = "bg-blue-500/15 border-blue-500/25 text-blue-400";
                      if (status === 'Published') statusBadge = "bg-indigo-500/15 border-indigo-500/25 text-indigo-400";
                      if (status === 'Live') statusBadge = "bg-red-500/15 border-red-500/25 text-red-400 animate-pulse";
                      if (status === 'Completed') statusBadge = "bg-emerald-500/15 border-emerald-500/25 text-emerald-400";

                      return (
                        <div key={ex.id} className={`border rounded-xl p-3.5 space-y-3 transition-all ${status === 'Live' ? 'border-red-500/30 bg-red-500/5' : status === 'Completed' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-800 bg-slate-950/20'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${statusBadge}`}>
                                  ● {status.toUpperCase()}
                                </span>
                                <span className="text-[9px] text-slate-500 font-semibold">{ex.durationMinutes} min · {qs.length} Questions · {totalMarks} Marks</span>
                                {ex.scheduledStart && (
                                  <span className="text-[9px] text-slate-400 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                    📅 {new Date(ex.scheduledStart).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-extrabold text-white">{ex.title}</h4>
                              {ex.description && <p className="text-[10px] text-slate-400">{ex.description}</p>}
                            </div>
                            <button onClick={() => { deleteLiveExam(ex.id); bridge.vibrate(15); }}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20 cursor-pointer transition-all shrink-0">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* ACTION SWITCH ROW */}
                          <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-900">
                            {status === 'Draft' && (
                              <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900/60 my-1">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">📅 Schedule Test:</span>
                                <input 
                                  type="datetime-local" 
                                  value={schTimes[ex.id] || ex.scheduledStart || ''} 
                                  onChange={e => setSchTimes(prev => ({ ...prev, [ex.id]: e.target.value }))}
                                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:border-accent cursor-pointer"
                                />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const t = schTimes[ex.id];
                                    if (!t) { bridge.showToast("Select date and time first."); return; }
                                    updateLiveExamStatus(ex.id, 'Scheduled', t);
                                    bridge.vibrate(20);
                                  }}
                                  className="bg-accent hover:bg-accent-hover text-white font-bold px-3 py-1.5 rounded-lg text-[9px] cursor-pointer transition-all active:scale-95"
                                >
                                  Lock Schedule
                                </button>
                              </div>
                            )}

                            {(status === 'Draft' || status === 'Scheduled') && (
                              <button 
                                onClick={() => {
                                  const t = ex.scheduledStart || schTimes[ex.id];
                                  if (!t) { bridge.showToast("Please schedule a time first."); return; }
                                  updateLiveExamStatus(ex.id, 'Published', t);
                                  bridge.vibrate(20);
                                }}
                                className="text-[9px] font-bold px-2.5 py-1 rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 cursor-pointer transition-all"
                              >
                                Publish Test
                              </button>
                            )}

                            {(status === 'Published' || status === 'Scheduled') && (
                              <button 
                                onClick={() => {
                                  updateLiveExamStatus(ex.id, 'Live');
                                  bridge.vibrate(30);
                                }}
                                className="text-[9px] font-bold px-2.5 py-1 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer transition-all"
                              >
                                🔴 Force Go Live
                              </button>
                            )}

                            {status === 'Live' && (
                              <button 
                                onClick={() => {
                                  updateLiveExamStatus(ex.id, 'Completed');
                                  bridge.vibrate(40);
                                }}
                                className="text-[9px] font-bold px-2.5 py-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer transition-all"
                              >
                                🏁 End Exam & Evaluate
                              </button>
                            )}

                            {status !== 'Draft' && (
                              <button 
                                onClick={() => {
                                  updateLiveExamStatus(ex.id, 'Draft');
                                  bridge.vibrate(15);
                                }}
                                className="text-[9px] font-bold px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-white cursor-pointer transition-all"
                              >
                                Reset to Draft
                              </button>
                            )}
                          </div>
                          {qs.length > 0 && (
                            <div className="border-t border-slate-800/60 pt-2 space-y-1">
                              {qs.map((q, i) => (
                                <div key={q.id} className="flex items-center justify-between bg-slate-950/30 rounded-lg px-2.5 py-1.5">
                                  <span className="text-[10px] text-slate-300 truncate flex-1 mr-2">Q{i+1}. {q.question.substring(0, 55)}{q.question.length > 55 ? '...' : ''}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[9px] text-accent font-bold">{q.marks}M</span>
                                    <button onClick={() => { deleteLiveTestQuestion(q.id); bridge.vibrate(10); }}
                                      className="text-red-400 hover:text-red-300 cursor-pointer">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: ARTICLE CMS */}
          {activeTab === 'articles' && (
            <div className="space-y-6 animate-form-fade">
              {/* Coming Soon */}
              <div className="glass-panel p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto animate-pulse">
                  <BookMarked className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-extrabold text-white">Article CMS</h3>
                <p className="text-sm text-slate-400">Coming soon - Create and manage educational articles for students</p>
              </div>
            </div>
          )}

          {/* TAB 11: NOTIFICATIONS SYSTEM */}
          {activeTab === 'alerts' && (
            <div className="space-y-6 animate-form-fade">
              {/* Broadcast */}
              <form onSubmit={handleBroadcast} className="glass-panel p-5 space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Broadcasting alerts</h3>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block">Alert message body</label>
                  <input
                    type="text"
                    value={notifMsg}
                    onChange={(e) => setNotifMsg(e.target.value)}
                    placeholder="e.g. National Mock Test 1 is now active! Launch DPP."
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="bg-accent hover:bg-accent-hover text-white py-2 px-6 rounded-xl font-bold text-xs tracking-wide shadow-lg cursor-pointer">
                    Broadcast Notification
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 12: CLOUD STORAGE */}
          {activeTab === 'storage' && (
            <div className="space-y-6 animate-form-fade">
              {/* Upload form */}
              <form onSubmit={handleUploadFile} className="glass-panel p-5 flex gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Upload Mock File to Cloud Bucket</label>
                  <input
                    type="text"
                    value={fileUploadName}
                    onChange={(e) => setFileUploadName(e.target.value)}
                    placeholder="e.g. organic_chemistry_cheatsheet.pdf"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white outline-none"
                    required
                  />
                </div>
                <button type="submit" className="bg-accent hover:bg-accent-hover text-white p-2.5 rounded-xl active:scale-95 transition-all cursor-pointer">
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Bucket listing */}
              <div className="glass-panel p-5 space-y-3">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Cloud Storage Bucket files</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-500 font-bold">
                        <th className="py-2.5">Filename</th>
                        <th className="py-2.5">Storage Class</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storageFiles.map(f => (
                        <tr key={f} className="border-b border-slate-900/60 hover:bg-slate-950/15">
                          <td className="py-3 font-bold text-white">{f}</td>
                          <td className="py-3 text-slate-400 font-semibold">Supabase Standard S3</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => { deleteStorageFile(f); bridge.vibrate(15); }}
                              className="p-1 rounded bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 active:scale-90 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: SETTINGS CONSOLE */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-form-fade">
              <div className="glass-panel p-5 space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Administrative Settings console</h3>
                
                {/* Maintenance switch */}
                <div className="flex items-center justify-between py-2 border-b border-slate-800/40">
                  <div className="text-left space-y-0.5">
                    <h4 className="text-xs font-bold text-white">Global Maintenance Mode Lock</h4>
                    <p className="text-[10px] text-slate-500">Toggling this blocks student logins, displaying an upgrade screen.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={maintenance}
                      onChange={(e) => handleToggleMaintenance(e.target.checked)}
                      className="sr-only switch-input"
                    />
                    <div className="w-11 h-6 bg-slate-950/70 border border-slate-800 rounded-full switch-bg transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-slate-500 rounded-full transition-transform switch-dot" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: RECYCLE BIN */}
          {activeTab === 'recycle' && (
            <div className="space-y-6 animate-form-fade">
              <div className="glass-panel p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="text-left">
                    <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                      ♻️ Admin Recycle Bin
                    </h3>
                    <p className="text-[10px] text-slate-400">View and restore soft-deleted contents and database-archived items.</p>
                  </div>
                  <button
                    onClick={async () => {
                      await fetchArchives();
                      bridge.showToast("Recycle bin refreshed!");
                      bridge.vibrate(10);
                    }}
                    className="text-[10px] font-bold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl cursor-pointer active:scale-95 transition-all"
                  >
                    Refresh Bin
                  </button>
                </div>

                {/* Sub tabs selector */}
                <div className="flex gap-2 border-b border-slate-900 pb-3">
                  {(['dpp', 'live', 'ltq'] as const).map((tab) => {
                    const count = tab === 'dpp' 
                      ? (softDeletedDppQuestions.length + archiveDppQuestions.length)
                      : tab === 'live'
                      ? (softDeletedLiveExams.length + archiveLiveExams.length)
                      : (softDeletedLiveTestQuestions.length + archiveLiveTestQuestions.length);

                    return (
                      <button
                        key={tab}
                        onClick={() => { setRecycleSubTab(tab); bridge.vibrate(10); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          recycleSubTab === tab
                            ? 'bg-accent/15 border border-accent/30 text-accent'
                            : 'bg-slate-950/40 border border-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab === 'dpp' ? '📝 DPP Questions' : tab === 'live' ? '🔴 Live Exams' : '📋 Live Questions'}
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-400 font-extrabold">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* SUB TAB 1: DPP QUESTIONS */}
                {recycleSubTab === 'dpp' && (() => {
                  const combined = [
                    ...softDeletedDppQuestions.map(q => ({ ...q, isHardDeleted: false, archive_id: undefined as number | undefined, archivedAt: undefined as string | undefined })),
                    ...archiveDppQuestions.map(q => ({
                      id: q.id,
                      chapterId: q.topic_id,
                      type: q.type,
                      question: q.question,
                      options: q.options,
                      answer: q.answer,
                      explanation: q.explanation,
                      tags: q.tags,
                      archive_id: q.archive_id,
                      archivedAt: q.archived_at,
                      isHardDeleted: true
                    }))
                  ];

                  return (
                    <div className="space-y-4">
                      {combined.length === 0 ? (
                        <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center text-xs text-slate-500 italic">
                          No deleted DPP questions found.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                          {combined.map((item, idx) => (
                            <div key={item.isHardDeleted ? `hard-${item.archive_id}` : `soft-${item.id}`} className="bg-slate-950/40 border border-slate-900 hover:border-slate-800/80 rounded-xl p-4 space-y-3 relative group transition-all animate-form-fade">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] font-extrabold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-accent">
                                    Q{idx + 1}
                                  </span>
                                  <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                                    {item.type}
                                  </span>
                                  {item.isHardDeleted ? (
                                    <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400" title="Direct DB deletion backup">
                                      🛡️ Hard Deleted Backup
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400" title="Soft deleted from Admin Panel">
                                      ♻️ Soft Deleted
                                    </span>
                                  )}
                                  {item.archivedAt && (
                                    <span className="text-[8px] text-slate-500">
                                      Deleted: {new Date(item.archivedAt).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={async () => {
                                    await restoreDppQuestion(item, item.isHardDeleted);
                                    bridge.showToast("DPP Question restored successfully!");
                                    bridge.vibrate(20);
                                  }}
                                  className="text-[9px] font-bold bg-green-500/10 border border-green-500/20 hover:bg-green-500/25 text-green-400 px-3 py-1 rounded-lg active:scale-95 transition-all cursor-pointer"
                                >
                                  Restore
                                </button>
                              </div>
                              <p className="text-xs text-slate-300 font-semibold leading-relaxed">{item.question}</p>
                              {item.options && item.options.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                                  {item.options.map((opt, oIdx) => (
                                    <div key={oIdx} className={`truncate py-1 px-1.5 rounded bg-slate-900/50 border border-slate-900 ${item.answer.toString() === oIdx.toString() ? 'border-green-500/30 text-green-400 font-bold' : ''}`}>
                                      {String.fromCharCode(65 + oIdx)}. {opt}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* SUB TAB 2: LIVE EXAMS */}
                {recycleSubTab === 'live' && (() => {
                  const combined = [
                    ...softDeletedLiveExams.map(e => ({ ...e, isHardDeleted: false, archive_id: undefined as number | undefined, archivedAt: undefined as string | undefined })),
                    ...archiveLiveExams.map(e => ({
                      id: e.id,
                      title: e.title,
                      description: e.description,
                      durationMinutes: e.duration_minutes || 60,
                      isActive: e.is_active || false,
                      pdfUrl: e.pdf_url,
                      scheduledStart: e.scheduled_start,
                      status: e.status || 'Draft',
                      subjectId: e.subject_id,
                      chapterId: e.chapter_id,
                      archive_id: e.archive_id,
                      archivedAt: e.archived_at,
                      isHardDeleted: true
                    }))
                  ];

                  return (
                    <div className="space-y-4">
                      {combined.length === 0 ? (
                        <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center text-xs text-slate-500 italic">
                          No deleted live exams found.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                          {combined.map((item) => (
                            <div key={item.isHardDeleted ? `hard-${item.archive_id}` : `soft-${item.id}`} className="bg-slate-950/40 border border-slate-900 hover:border-slate-800/80 rounded-xl p-4 space-y-3 relative group transition-all animate-form-fade">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    {item.isHardDeleted ? (
                                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400">
                                        🛡️ Hard Deleted Backup
                                      </span>
                                    ) : (
                                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400">
                                        ♻️ Soft Deleted
                                      </span>
                                    )}
                                    <span className="text-[9px] text-slate-500 font-semibold">{item.durationMinutes} min · {item.status}</span>
                                    {item.archivedAt && (
                                      <span className="text-[8px] text-slate-500">
                                        Deleted: {new Date(item.archivedAt).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-xs font-extrabold text-white">{item.title}</h4>
                                  {item.description && <p className="text-[10px] text-slate-400 mt-0.5">{item.description}</p>}
                                </div>
                                <button
                                  onClick={async () => {
                                    await restoreLiveExam(item, item.isHardDeleted);
                                    bridge.showToast("Live Exam restored successfully!");
                                    bridge.vibrate(20);
                                  }}
                                  className="text-[9px] font-bold bg-green-500/10 border border-green-500/20 hover:bg-green-500/25 text-green-400 px-3 py-1 rounded-lg active:scale-95 transition-all cursor-pointer shrink-0"
                                >
                                  Restore
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* SUB TAB 3: LIVE TEST QUESTIONS */}
                {recycleSubTab === 'ltq' && (() => {
                  const combined = [
                    ...softDeletedLiveTestQuestions.map(q => ({ ...q, isHardDeleted: false, archive_id: undefined as number | undefined, archivedAt: undefined as string | undefined })),
                    ...archiveLiveTestQuestions.map(q => ({
                      id: q.id,
                      examId: q.exam_id,
                      type: q.type || 'MCQ',
                      question: q.question,
                      options: q.options,
                      correctAnswer: q.correct_answer,
                      explanation: q.explanation,
                      marks: q.marks || 4,
                      questionOrder: q.question_order || 0,
                      tags: q.tags,
                      pdfUrl: q.pdf_url,
                      isLivePractice: q.is_live_practice || false,
                      archive_id: q.archive_id,
                      archivedAt: q.archived_at,
                      isHardDeleted: true
                    }))
                  ];

                  return (
                    <div className="space-y-4">
                      {combined.length === 0 ? (
                        <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center text-xs text-slate-500 italic">
                          No deleted live test questions found.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                          {combined.map((item, idx) => (
                            <div key={item.isHardDeleted ? `hard-${item.archive_id}` : `soft-${item.id}`} className="bg-slate-950/40 border border-slate-900 hover:border-slate-800/80 rounded-xl p-4 space-y-3 relative group transition-all animate-form-fade">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] font-extrabold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-accent">
                                    Q{idx + 1} ({item.marks}M)
                                  </span>
                                  <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                                    {item.type}
                                  </span>
                                  {item.isHardDeleted ? (
                                    <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400">
                                      🛡️ Hard Deleted Backup
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400">
                                      ♻️ Soft Deleted
                                    </span>
                                  )}
                                  {item.archivedAt && (
                                    <span className="text-[8px] text-slate-500">
                                      Deleted: {new Date(item.archivedAt).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={async () => {
                                    await restoreLiveTestQuestion(item, item.isHardDeleted);
                                    bridge.showToast("Question restored successfully!");
                                    bridge.vibrate(20);
                                  }}
                                  className="text-[9px] font-bold bg-green-500/10 border border-green-500/20 hover:bg-green-500/25 text-green-400 px-3 py-1 rounded-lg active:scale-95 transition-all cursor-pointer"
                                >
                                  Restore
                                </button>
                              </div>
                              <p className="text-xs text-slate-300 font-semibold leading-relaxed">{item.question}</p>
                              {item.options && item.options.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                                  {item.options.map((opt, oIdx) => (
                                    <div key={oIdx} className={`truncate py-1 px-1.5 rounded bg-slate-900/50 border border-slate-900 ${item.correctAnswer.toString() === oIdx.toString() ? 'border-green-500/30 text-green-400 font-bold' : ''}`}>
                                      {String.fromCharCode(65 + oIdx)}. {opt}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {item.type === 'SAQ' && (
                                <div className="text-[10px] text-emerald-400 font-bold">
                                  Correct Answer: {item.correctAnswer}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
