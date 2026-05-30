import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAndroidBridge } from '../../hooks/useAndroidBridge';
import { 
  Plus, Trash2, TrendingUp, Award, Coins, BarChart3, 
  X, ChevronDown, ChevronUp, Sparkles, Target, Flame
} from 'lucide-react';

export function DataManager() {
  const { state, updateState, addAchievement, deleteAchievement, addCoinTransaction, deleteCoinTransaction, addPerformanceGraph, deletePerformanceGraph } = useApp();
  const bridge = useAndroidBridge();
  const [activeSection, setActiveSection] = useState<'achievements' | 'coins' | 'graphs'>('achievements');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Achievement Form State
  const [achievementForm, setAchievementForm] = useState({
    title: '',
    description: '',
    icon: '🏆',
    category: 'academic' as const,
    xpReward: 50,
    coinReward: 10
  });

  // Coin Transaction Form State
  const [coinForm, setCoinForm] = useState({
    type: 'earned' as const,
    amount: 10,
    reason: ''
  });

  // Graph Form State
  const [graphForm, setGraphForm] = useState({
    title: '',
    type: 'line' as const,
    color: '#8b5cf6'
  });

  const handleAddAchievement = () => {
    if (!achievementForm.title || !achievementForm.description) return;
    addAchievement({
      ...achievementForm,
      unlockedAt: new Date().toISOString()
    });
    setAchievementForm({
      title: '',
      description: '',
      icon: '🏆',
      category: 'academic',
      xpReward: 50,
      coinReward: 10
    });
  };

  const handleAddCoinTransaction = () => {
    if (!coinForm.reason || coinForm.amount <= 0) return;
    addCoinTransaction({
      ...coinForm,
      timestamp: new Date().toISOString()
    });
    setCoinForm({
      type: 'earned',
      amount: 10,
      reason: ''
    });
  };

  const handleAddGraph = () => {
    if (!graphForm.title) return;
    // Generate empty graph structure - data will be added from real student performance
    const dataPoints = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        accuracy: 0,
        completion: 0,
        xpEarned: 0,
        dppsCompleted: 0
      };
    });
    addPerformanceGraph({
      ...graphForm,
      dataPoints
    });
    setGraphForm({
      title: '',
      type: 'line',
      color: '#8b5cf6'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'consistency': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'mastery': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'social': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-5 pb-20 animate-form-fade">
      
      {/* Section Tabs */}
      <div className="flex bg-slate-950/60 p-1.5 rounded-2xl border border-slate-900 mx-auto max-w-[400px]">
        <button
          onClick={() => setActiveSection('achievements')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSection === 'achievements'
              ? 'bg-accent text-white shadow-lg shadow-accent/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Achievements
        </button>
        <button
          onClick={() => setActiveSection('coins')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSection === 'coins'
              ? 'bg-accent text-white shadow-lg shadow-accent/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Coins className="w-4 h-4" />
          Coins
        </button>
        <button
          onClick={() => setActiveSection('graphs')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSection === 'graphs'
              ? 'bg-accent text-white shadow-lg shadow-accent/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Graphs
        </button>
      </div>

      {/* ═══════ ACHIEVEMENTS SECTION ═══════ */}
      {activeSection === 'achievements' && (
        <div className="space-y-4 animate-form-fade">
          
          {/* Add Achievement Form */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-white tracking-wide flex items-center gap-2">
              <Plus className="w-4 h-4 text-accent" />
              Create New Achievement
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Title</label>
                <input
                  type="text"
                  value={achievementForm.title}
                  onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })}
                  placeholder="e.g., First Steps"
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</label>
                <input
                  type="text"
                  value={achievementForm.description}
                  onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                  placeholder="e.g., Complete your first DPP"
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={achievementForm.category}
                    onChange={(e) => setAchievementForm({ ...achievementForm, category: e.target.value as any })}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-4 text-sm text-white outline-none transition-all"
                  >
                    <option value="academic">Academic</option>
                    <option value="consistency">Consistency</option>
                    <option value="mastery">Mastery</option>
                    <option value="social">Social</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Icon</label>
                  <input
                    type="text"
                    value={achievementForm.icon}
                    onChange={(e) => setAchievementForm({ ...achievementForm, icon: e.target.value })}
                    placeholder="🏆"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">XP Reward</label>
                  <input
                    type="number"
                    value={achievementForm.xpReward}
                    onChange={(e) => setAchievementForm({ ...achievementForm, xpReward: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-4 text-sm text-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Coin Reward</label>
                  <input
                    type="number"
                    value={achievementForm.coinReward}
                    onChange={(e) => setAchievementForm({ ...achievementForm, coinReward: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-4 text-sm text-white outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleAddAchievement}
                className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Create Achievement
              </button>
            </div>
          </div>

          {/* Achievements List */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-white tracking-wide flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" />
              Your Achievements ({state.achievements.length})
            </h3>

            {state.achievements.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No achievements created yet. Create your first one above!</p>
            ) : (
              <div className="space-y-2.5">
                {state.achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className="bg-slate-950/30 border border-slate-900 rounded-xl p-4 flex justify-between items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{ach.icon}</span>
                        <div>
                          <h4 className="text-xs font-extrabold text-white">{ach.title}</h4>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getCategoryColor(ach.category)}`}>
                            {ach.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">{ach.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                          <Target className="w-3 h-3" /> +{ach.xpReward} XP
                        </span>
                        <span className="text-[9px] font-bold text-yellow-400 flex items-center gap-1">
                          <Coins className="w-3 h-3" /> +{ach.coinReward} Coins
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAchievement(ach.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 active:scale-95 transition-all cursor-pointer shrink-0"
                      title="Delete achievement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ COIN TRANSACTIONS SECTION ═══════ */}
      {activeSection === 'coins' && (
        <div className="space-y-4 animate-form-fade">
          
          {/* Add Coin Transaction Form */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-white tracking-wide flex items-center gap-2">
              <Plus className="w-4 h-4 text-accent" />
              Add Coin Transaction
            </h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Type</label>
                  <select
                    value={coinForm.type}
                    onChange={(e) => setCoinForm({ ...coinForm, type: e.target.value as any })}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-4 text-sm text-white outline-none transition-all"
                  >
                    <option value="earned">Earned</option>
                    <option value="spent">Spent</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Amount</label>
                  <input
                    type="number"
                    value={coinForm.amount}
                    onChange={(e) => setCoinForm({ ...coinForm, amount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-4 text-sm text-white outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reason</label>
                <input
                  type="text"
                  value={coinForm.reason}
                  onChange={(e) => setCoinForm({ ...coinForm, reason: e.target.value })}
                  placeholder="e.g., Completed daily DPP"
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>

              <button
                onClick={handleAddCoinTransaction}
                className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" />
                Add Transaction
              </button>
            </div>
          </div>

          {/* Coin Transactions List */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-white tracking-wide flex items-center gap-2">
              <Coins className="w-4 h-4 text-accent" />
              Transaction History ({state.coinTransactions.length})
            </h3>

            {state.coinTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No transactions recorded yet. Add your first one above!</p>
            ) : (
              <div className="space-y-2.5">
                {state.coinTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-slate-950/30 border border-slate-900 rounded-xl p-4 flex justify-between items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          tx.type === 'earned' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {tx.type}
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white">{tx.reason}</p>
                      <p className={`text-sm font-extrabold mt-1 ${tx.type === 'earned' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.type === 'earned' ? '+' : '-'}{tx.amount} Coins
                      </p>
                    </div>
                    <button
                      onClick={() => deleteCoinTransaction(tx.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 active:scale-95 transition-all cursor-pointer shrink-0"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Balance Display */}
          <div className="glass-panel p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/15 flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-400 fill-yellow-400/10" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Current Balance</span>
                <span className="text-2xl font-extrabold text-white">{state.coins} Coins</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ PERFORMANCE GRAPHS SECTION ═══════ */}
      {activeSection === 'graphs' && (
        <div className="space-y-4 animate-form-fade">
          
          {/* Add Graph Form */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-white tracking-wide flex items-center gap-2">
              <Plus className="w-4 h-4 text-accent" />
              Create Performance Graph
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Graph Title</label>
                <input
                  type="text"
                  value={graphForm.title}
                  onChange={(e) => setGraphForm({ ...graphForm, title: e.target.value })}
                  placeholder="e.g., Weekly Performance"
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Graph Type</label>
                  <select
                    value={graphForm.type}
                    onChange={(e) => setGraphForm({ ...graphForm, type: e.target.value as any })}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-4 text-sm text-white outline-none transition-all"
                  >
                    <option value="line">Line Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="area">Area Chart</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Color</label>
                  <input
                    type="color"
                    value={graphForm.color}
                    onChange={(e) => setGraphForm({ ...graphForm, color: e.target.value })}
                    className="w-full h-10 bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl px-2 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleAddGraph}
                className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Create Graph Structure
              </button>
            </div>
          </div>

          {/* Graphs List */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-white tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Performance Graphs ({state.performanceGraphs.length})
            </h3>

            {state.performanceGraphs.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No graphs created yet. Create your first one above!</p>
            ) : (
              <div className="space-y-4">
                {state.performanceGraphs.map((graph) => {
                  const isExpanded = expandedSection === graph.id;
                  return (
                    <div
                      key={graph.id}
                      className="bg-slate-950/30 border border-slate-900 rounded-xl overflow-hidden"
                    >
                      <div
                        onClick={() => setExpandedSection(isExpanded ? null : graph.id)}
                        className="p-4 flex justify-between items-center gap-3 cursor-pointer hover:border-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: graph.color }}
                          />
                          <div>
                            <h4 className="text-xs font-extrabold text-white">{graph.title}</h4>
                            <span className="text-[9px] text-slate-500 font-semibold uppercase">{graph.type} Chart • {graph.dataPoints.length} days</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePerformanceGraph(graph.id);
                            }}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 active:scale-95 transition-all cursor-pointer"
                            title="Delete graph"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-900 pt-4 space-y-3">
                          {/* Simple Bar Visualization */}
                          <div className="space-y-2">
                            {graph.dataPoints.map((point, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-500 font-semibold w-16 shrink-0">
                                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <div className="flex-1 h-6 bg-slate-900 rounded-lg overflow-hidden flex gap-0.5">
                                  <div 
                                    className="h-full transition-all duration-300"
                                    style={{ 
                                      width: `${point.accuracy}%`,
                                      backgroundColor: graph.color,
                                      opacity: 0.8
                                    }}
                                    title={`Accuracy: ${point.accuracy}%`}
                                  />
                                  <div 
                                    className="h-full transition-all duration-300"
                                    style={{ 
                                      width: `${point.completion}%`,
                                      backgroundColor: graph.color,
                                      opacity: 0.5
                                    }}
                                    title={`Completion: ${point.completion}%`}
                                  />
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[9px] font-bold text-emerald-400">{point.accuracy}%</span>
                                  <span className="text-[9px] font-bold text-blue-400">{point.completion}%</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Summary Stats */}
                          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-900">
                            <div className="text-center">
                              <p className="text-[9px] text-slate-500 font-semibold">Avg Accuracy</p>
                              <p className="text-xs font-extrabold text-white">
                                {Math.round(graph.dataPoints.reduce((a, b) => a + b.accuracy, 0) / graph.dataPoints.length)}%
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] text-slate-500 font-semibold">Avg Completion</p>
                              <p className="text-xs font-extrabold text-white">
                                {Math.round(graph.dataPoints.reduce((a, b) => a + b.completion, 0) / graph.dataPoints.length)}%
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] text-slate-500 font-semibold">Total XP</p>
                              <p className="text-xs font-extrabold text-emerald-400">
                                {graph.dataPoints.reduce((a, b) => a + b.xpEarned, 0)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] text-slate-500 font-semibold">Total DPPs</p>
                              <p className="text-xs font-extrabold text-blue-400">
                                {graph.dataPoints.reduce((a, b) => a + b.dppsCompleted, 0)}
                              </p>
                            </div>
                          </div>
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
    </div>
  );
}
