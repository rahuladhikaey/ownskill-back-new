import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Target, CheckCircle2, BarChart3, Sparkles, Timer, FlaskConical, BookOpenText,
  ChevronRight, TrendingUp, TrendingDown, Minus, Flame, Trophy, Zap, Clock, Globe
} from 'lucide-react';

export function DashboardTab() {
  const { state, updateState } = useApp();

  // Digital clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Real performance metrics from actual student work ──
  const totalDpps = state.completedDppChapters?.length || 0;
  const totalTasks = state.tasksCompleted?.length || 0;
  const totalAttempted = totalDpps + totalTasks;

  // Only show accuracy if student has actually attempted questions
  const accuracy = totalAttempted > 0 ? Math.min(Math.round((state.xp / Math.max(totalAttempted * 12, 1)) * 100), 100) : 0;

  // Only show completion if student has completed DPPs
  const completionTarget = 50;
  const completion = totalDpps > 0 ? Math.min(Math.round((totalDpps / completionTarget) * 100), 100) : 0;

  // Only show percentile if student has attempted questions
  const rawPercentile = Math.min(Math.round(50 + (accuracy * 0.3) + (completion * 0.2)), 99);
  const percentile = totalAttempted > 0 ? rawPercentile : 0;

  // Quick action navigation
  const handleQuickAction = (tab: string) => {
    if (tab === 'more') {
      updateState({ activeTab: 'more', activeProfileSubTab: 'articles' });
    } else {
      updateState({ activeTab: tab as any });
    }
  };

  // Performance snapshot cards data - only show if student has done work
  const snapshots = totalAttempted > 0 ? [
    {
      label: 'Accuracy',
      value: `${accuracy}%`,
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/15',
      iconBg: 'bg-blue-500/15'
    },
    {
      label: 'Completion',
      value: `${completion}%`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/15',
      iconBg: 'bg-emerald-500/15'
    },
    {
      label: 'Percentile',
      value: `${percentile}%`,
      icon: BarChart3,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/15',
      iconBg: 'bg-teal-500/15'
    }
  ] : [];

  // Quick action cards
  const quickActions = [
    {
      id: 'dpp',
      label: 'Smart DPP',
      desc: 'Daily practice problems',
      icon: Sparkles,
      gradient: 'from-amber-500/20 to-yellow-500/10',
      borderAccent: 'border-amber-500/20',
      iconColor: 'text-amber-400'
    },
    {
      id: 'tests',
      label: 'Live Tests',
      desc: 'Timed mock exams',
      icon: Timer,
      gradient: 'from-blue-500/20 to-cyan-500/10',
      borderAccent: 'border-blue-500/20',
      iconColor: 'text-blue-400'
    },
    {
      id: 'visualizer',
      label: 'Formula Lab',
      desc: 'Visual equations tool',
      icon: FlaskConical,
      gradient: 'from-purple-500/20 to-violet-500/10',
      borderAccent: 'border-purple-500/20',
      iconColor: 'text-purple-400'
    },
    {
      id: 'more',
      label: 'Articles',
      desc: 'Curated reading',
      icon: BookOpenText,
      gradient: 'from-emerald-500/20 to-green-500/10',
      borderAccent: 'border-emerald-500/20',
      iconColor: 'text-emerald-400'
    }
  ];

  // Subject performance data from student activities
  const subjectPerformance = (state.userSubjects || []).map((subj: string) => {
    const subjectDpps = totalDpps > 0 ? Math.round(totalDpps / (state.userSubjects?.length || 1)) : 0;
    const subjectScore = Math.min(Math.round((subjectDpps / 15) * 100), 100);
    return {
      name: subj.charAt(0).toUpperCase() + subj.slice(1),
      progress: subjectScore,
      dpps: subjectDpps,
      trend: subjectScore > 50 ? 'up' : subjectScore > 20 ? 'stable' : 'down'
    };
  });

  // Streak, XP, Level summary
  const level = Math.floor((state.xp || 0) / 100) + 1;

  return (
    <div className="space-y-5 pb-6 animate-form-fade">

      {/* Digital Clock */}
      <div className="glass-panel p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-accent animate-pulse" />
          <div>
            <h3 className="text-xs font-extrabold text-white tracking-wide">Current Time</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Real-time clock</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-white tracking-wider font-mono">
            {currentTime.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* ═══════ PERFORMANCE SNAPSHOT ═══════ */}
      {totalAttempted > 0 && (
        <div>
          <h3 className="text-sm font-extrabold text-white tracking-wide mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" />
            Performance Snapshot
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {snapshots.map((s) => (
              <div
                key={s.label}
                className={`${s.bgColor} border ${s.borderColor} rounded-2xl p-3.5 flex flex-col items-start gap-2.5 relative overflow-hidden`}
              >
                <span className={`text-[10px] uppercase font-bold ${s.color} tracking-wider`}>
                  {s.label}
                </span>
                <div className="flex items-end justify-between w-full">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                    {s.value}
                  </span>
                  <div className={`w-8 h-8 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalAttempted === 0 && (
        <div className="glass-panel p-5 text-center">
          <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-extrabold text-white mb-1">No Performance Data Yet</h3>
          <p className="text-xs text-slate-400">Complete DPPs or tests to see your performance metrics</p>
        </div>
      )}

      {/* ═══════ QUICK ACTIONS ═══════ */}
      <div>
        <h3 className="text-sm font-extrabold text-white tracking-wide mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              className={`bg-gradient-to-br ${action.gradient} border ${action.borderAccent} rounded-2xl p-4 flex items-center justify-between gap-3 text-left group active:scale-[0.97] transition-all cursor-pointer`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-9 h-9 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-center shrink-0`}>
                  <action.icon className={`w-4.5 h-4.5 ${action.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-white tracking-wide truncate">{action.label}</h4>
                  <p className="text-[9px] text-slate-400 font-semibold truncate mt-0.5">{action.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ GROWTH DASHBOARD ═══════ */}
      <div className="glass-panel p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Growth Dashboard
          </h3>
          <span className="text-[9px] font-bold bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded-full">
            Level {level}
          </span>
        </div>

        {/* Active stats row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-slate-950/30 border border-slate-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            </div>
            <p className="text-lg font-extrabold text-white">{state.streak || 0}</p>
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Day Streak</span>
          </div>
          <div className="bg-slate-950/30 border border-slate-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className="text-lg font-extrabold text-white">{totalDpps}</p>
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">DPPs Done</span>
          </div>
          <div className="bg-slate-950/30 border border-slate-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-lg font-extrabold text-white">{state.xp || 0}</p>
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Total XP</span>
          </div>
          <div className="bg-slate-950/30 border border-slate-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <p className="text-lg font-extrabold text-white">{state.coins || 0}</p>
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Coins</span>
          </div>
        </div>

        {/* XP Level Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              XP to Level {level + 1}
            </span>
            <span className="text-[10px] font-bold text-accent">
              {(state.xp || 0) % 100} / 100
            </span>
          </div>
          <div className="w-full h-2 bg-slate-950/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${(state.xp || 0) % 100}%` }}
            />
          </div>
        </div>

        {/* Empty state if no DPPs completed yet */}
        {totalDpps === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-slate-500 italic">
              Attempt DPPs to build your stats and unlock rewards
            </p>
          </div>
        )}
      </div>

      {/* ═══════ EXTERNAL WEBSITE LINK ═══════ */}
      <button
        onClick={() => {
          if (window.OwnSkillAndroid && typeof window.OwnSkillAndroid.openUrl === 'function') {
            window.OwnSkillAndroid.openUrl("https://ownskill-back-new.onrender.com");
          } else {
            window.open("https://ownskill-back-new.onrender.com", "_blank");
          }
        }}
        className="glass-panel p-4 flex items-center justify-between group active:scale-[0.98] transition-all bg-gradient-to-r from-emerald-500/20 to-teal-500/5 border border-emerald-500/20 cursor-pointer w-full mt-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-extrabold text-white tracking-wide">Visit Website</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">ownskill-back-new.onrender.com</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-emerald-500/70 group-hover:text-emerald-400 transition-colors" />
      </button>

    </div>
  );
}
