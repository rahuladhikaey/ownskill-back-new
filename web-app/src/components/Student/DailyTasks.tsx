import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAndroidBridge } from '../../hooks/useAndroidBridge';
import { CheckCircle2, Circle } from 'lucide-react';

export function DailyTasks() {
  const { state, updateState, addCoinsAndXp } = useApp();
  const bridge = useAndroidBridge();

  const mockTasks = [
    { id: 1, title: "Solve Vector DPP set", desc: "Mechanics concepts • 5 questions", reward: 20 },
    { id: 2, title: "Formula Visualizer curves", desc: "Interactive geometry plot checks", reward: 10 },
    { id: 3, title: "Read Calculus Articles", desc: "High readability Math feeds", reward: 15 }
  ];

  const dailyMissions = [
    { id: 101, title: "Challenge a student in Battle Arena", desc: "Complete 1 Speed Battle match", reward: 40, xp: 80, progress: "0 / 1", done: false },
    { id: 102, title: "Maintain high precision", desc: "Achieve 80% score in a Mock Test", reward: 50, xp: 100, progress: "1 / 1", done: true }
  ];

  const handleCompleteTask = (tid: number, reward: number) => {
    if (state.tasksCompleted.includes(tid)) return;
    
    updateState(prev => ({
      ...prev,
      tasksCompleted: [...prev.tasksCompleted, tid]
    }));
    
    addCoinsAndXp(reward, reward * 2);
    bridge.vibrate(40);
    bridge.showToast(`Task finished! +${reward} Coins & +${reward * 2} XP earned.`);
  };

  return (
    <div className="space-y-6">
      {/* TODAY'S TASKS */}
      <div className="glass-panel p-5">
        <h3 className="text-base font-bold text-white tracking-wide mb-1">🔥 Today's Learning Deck</h3>
        <p className="text-xs text-slate-400 mb-4">Daily assignments curated by your goal blueprint</p>
        
        <div className="space-y-3">
          {mockTasks.map(task => {
            const isDone = state.tasksCompleted.includes(task.id);
            return (
              <div
                key={task.id}
                onClick={() => handleCompleteTask(task.id, task.reward)}
                className={`flex items-center gap-3 bg-slate-950/20 border rounded-xl p-3 cursor-pointer transition-all ${
                  isDone ? 'border-accent/30 bg-purple-500/5 opacity-60' : 'border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                <div className="flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-accent stroke-[2.5]" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600 hover:text-accent transition-colors" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-bold text-white truncate ${isDone ? 'line-through text-slate-500' : ''}`}>
                    {task.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{task.desc}</p>
                </div>
                <span className="text-xs font-bold text-accent">+{task.reward}🪙</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DAILY MISSIONS */}
      <div className="glass-panel p-5">
        <h3 className="text-base font-bold text-white tracking-wide mb-1">🎯 Daily Missions</h3>
        <p className="text-xs text-slate-400 mb-4">Complete goals to unlock additional XP & Rewards</p>

        <div className="space-y-3">
          {dailyMissions.map(m => (
            <div
              key={m.id}
              className={`flex items-center gap-3 bg-slate-950/20 border rounded-xl p-3 ${
                m.done ? 'border-accent/30 bg-purple-500/5 opacity-60' : 'border-slate-800/80'
              }`}
            >
              <div className="flex-shrink-0">
                {m.done ? (
                  <CheckCircle2 className="w-5 h-5 text-accent stroke-[2.5]" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-xs font-bold text-white truncate ${m.done ? 'line-through text-slate-500' : ''}`}>
                  {m.title}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{m.desc} • Progress: {m.progress}</p>
              </div>
              <span className="text-xs font-bold text-accent">+{m.reward}🪙</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
