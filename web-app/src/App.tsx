import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { useApp } from './context/AppContext';
import { useAndroidBridge } from './hooks/useAndroidBridge';
import { AuthScreen } from './components/Auth/AuthScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingCard } from './components/Onboarding/OnboardingCard';
import { DashboardTab } from './components/Student/DashboardTab';
import { DppPractice } from './components/Student/DppPractice';
import { LiveTests } from './components/Student/LiveTests';
import { FormulaCanvas } from './components/Student/FormulaCanvas';
import { ProfileManager } from './components/Student/ProfileManager';
import { ArticleView } from './components/Student/ArticleView';
import { AdminPanel } from './components/Admin/AdminPanel';
import { 
  LayoutDashboard, BookOpen, Swords, Activity, User, 
  ShieldAlert, Shield, Flame, Coins, Award, LogOut, Loader2, Sparkles,
  Menu, X, Palette, Moon, Sun, Database, BookOpenCheck, Bell
} from 'lucide-react';

function App() {
  const { state, updateState, logoutUser } = useApp();
  const bridge = useAndroidBridge();

  // App Phase States: 'splash' | 'user-type' | 'admin-pin' | 'auth' | 'onboarding' | 'main' | 'admin-panel'
  const [phase, setPhase] = useState<'splash' | 'user-type' | 'admin-pin' | 'auth' | 'onboarding' | 'main' | 'admin-panel'>('splash');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'about' | 'privacy' | 'contact' | null>(null);
  
  // Splash Messages Sequence
  const [splashMsg, setSplashMsg] = useState('Checking local storage memory...');
  const [splashProgress, setSplashProgress] = useState(10);
  
  // Admin passcode lock state
  const [adminPin, setAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  // Dynamic Online/Offline connection state tracking
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Splash Screen Loader Sequence
  useEffect(() => {
    const splashStages = [
      { text: 'Checking local storage memory...', delay: 600, progress: 30 },
      { text: 'Initializing secure Supabase connection...', delay: 1200, progress: 65 },
      { text: 'Loading Syllabus catalogue...', delay: 1800, progress: 90 },
      { text: 'Handshake finalized.', delay: 2300, progress: 100 }
    ];

    splashStages.forEach((stage) => {
      setTimeout(() => {
        setSplashMsg(stage.text);
        setSplashProgress(stage.progress);
      }, stage.delay);
    });

    // Auto transition to Auth screen (force authentication)
    setTimeout(() => {
      bridge.vibrate(30);
      
      // If user is already logged in, bypass auth checks
      if (state.user) {
        // If onboarded (we'll assume having goal & subjects constitutes onboarded)
        if (state.userGoal && state.userSubjects && state.userSubjects.length > 0) {
          setPhase('main');
        } else {
          setPhase('onboarding');
        }
      } else {
        // Force authentication - go directly to auth screen
        setPhase('auth');
      }
    }, 2500);
  }, []);

  // Handle Admin Passcode Submit
  const handleAdminPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === 'rahuladmin@988') {
      bridge.vibrate(40);
      
      if (isSupabaseConfigured) {
        // Authenticate silently as a super admin to pass RLS checks
        const { error } = await supabase.auth.signInWithPassword({
          email: 'admin@ownskill.com',
          password: 'rahuladmin@988'
        });
        
        // If the admin system user doesn't exist yet, create it instantly
        if (error && error.message.includes('Invalid login')) {
          await supabase.auth.signUp({
            email: 'admin@ownskill.com',
            password: 'rahuladmin@988'
          });
          await supabase.auth.signInWithPassword({
            email: 'admin@ownskill.com',
            password: 'rahuladmin@988'
          });
        }
      }

      bridge.showToast('Access Granted! Welcome Supreme Admin.');
      setAdminPin('');
      setAdminPinError('');
      setPhase('admin-panel');
    } else {
      bridge.vibrate(80);
      setAdminPinError('Invalid Supreme Passcode. Access Denied.');
      bridge.showToast('Invalid Pin.');
    }
  };

  // Safe Header Theme triggers
  const getThemeAccentClass = () => {
    if (state.accentTheme.includes('142')) return 'text-emerald-400 border-emerald-500/20';
    if (state.accentTheme.includes('24')) return 'text-amber-400 border-amber-500/20';
    if (state.accentTheme.includes('217')) return 'text-blue-400 border-blue-500/20';
    return 'text-accent border-accent/20';
  };

  const getThemeBgClass = () => {
    if (state.accentTheme.includes('142')) return 'bg-emerald-500';
    if (state.accentTheme.includes('24')) return 'bg-amber-500';
    if (state.accentTheme.includes('217')) return 'bg-blue-500';
    return 'bg-accent';
  };

  // Bottom Navigation Handler
  const handleTabChange = (tab: 'dashboard' | 'dpp' | 'tests' | 'visualizer' | 'more') => {
    bridge.vibrate(10);
    updateState({ activeTab: tab });
  };

  // Master Maintenance interceptor
  if (state.isMaintenanceMode && phase !== 'admin-panel' && phase !== 'admin-pin') {
    return (
      <div className="relative w-full min-h-screen bg-[#070913] text-left flex items-center justify-center p-6 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))]">
        <div className="w-full max-w-[480px] glass-panel p-6 sm:p-8 text-center animate-fade-scale space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">Shield Active</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              System is currently undergoing essential backend calibrations. Our Supreme Admin is rebuilding the core syllabus tables. Access will resume shortly.
            </p>
          </div>
          
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 font-mono text-[10px] text-slate-400">
            [STATUS] Maintenance mode triggered in settings.
          </div>

          <button
            onClick={() => { bridge.vibrate(20); setPhase('admin-pin'); }}
            className="w-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer"
          >
            Authenticate Admin Gateway
          </button>
        </div>
      </div>
    );
  }

  // Phase Router
  return (
    <div className="relative w-full min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans select-none">
      
      {/* 1. Splash Screen phase */}
      {phase === 'splash' && (
        <div className="relative w-full min-h-screen bg-[#070913] flex flex-col items-center justify-center p-6 animate-fade-scale">
          <div className="relative mb-8">
            {/* Pulsing Outer Glow */}
            <div className="absolute inset-0 rounded-full bg-accent/20 blur-3xl scale-125 animate-pulse" />
            <img 
              src="./logo.png" 
              alt="OwnSkill App Logo" 
              className="w-24 h-24 object-contain relative z-10 animate-flicker"
            />
          </div>
          
          <div className="text-center space-y-4 max-w-[280px]">
            <h1 className="text-2xl font-extrabold text-white tracking-widest uppercase">OwnSkill</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{splashMsg}</p>
            
            {/* Premium Loader line progress bar */}
            <div className="w-full h-1 bg-slate-950/80 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-300 ease-out rounded-full shadow-glow"
                style={{ width: `${splashProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. User Type Selection Phase */}
      {phase === 'user-type' && (
        <div className="relative w-full min-h-screen bg-[#070913] flex items-center justify-center p-4 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))]">
          <div className="w-full max-w-[450px] glass-panel p-6 sm:p-8 my-auto animate-fade-scale text-center space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">Enter the Gateway</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">Select your credentials module to boot the engine</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => { bridge.vibrate(25); setPhase('auth'); }}
                className="glass-card-interactive p-5 border border-slate-800 text-center flex flex-col items-center gap-3 cursor-pointer group active:scale-95"
              >
                <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-sm text-white tracking-wide">🎓 Student Module</h3>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Unlock active DPPs, trigonometry canvases, and speed arenas.
                </p>
              </button>

              <button
                onClick={() => { bridge.vibrate(25); setPhase('admin-pin'); }}
                className="glass-card-interactive p-5 border border-slate-800 text-center flex flex-col items-center gap-3 cursor-pointer group active:scale-95"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-sm text-white tracking-wide">🛡️ Admin Console</h3>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Configure live exams, edit syllabi tables, and view growth metrics.
                </p>
              </button>
            </div>
            
            <div className="text-[10px] text-slate-500 pt-2 flex items-center justify-center gap-1.5 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
              <span>OwnSkill Cloud Engine v4.2.1 • Online Database Connection Active</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Admin PIN passcode portal screen */}
      {phase === 'admin-pin' && (
        <div className="relative w-full min-h-screen bg-[#070913] flex items-center justify-center p-4">
          <div className="w-full max-w-[380px] glass-panel p-6 sm:p-8 my-auto animate-fade-scale text-left space-y-5">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                🔑 Admin Passcode Lock
              </h2>
              <p className="text-xs text-slate-400 mt-1">Please enter the supreme credentials</p>
            </div>

            <form onSubmit={handleAdminPinSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin PIN Code</label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2.5 px-4 text-sm text-center text-white tracking-widest placeholder-slate-700 outline-none transition-all"
                  required
                />
              </div>

              {adminPinError && (
                <p className="text-[10px] font-semibold text-red-400 text-center animate-pulse">{adminPinError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { bridge.vibrate(10); setPhase('user-type'); }}
                  className="flex-1 bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-accent hover:bg-accent-hover text-white py-2 rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg cursor-pointer"
                >
                  Verify Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Student Authentications portal */}
      {phase === 'auth' && (
        <AuthScreen 
          onSuccess={() => {
            // Check onboarding
            if (state.userGoal && state.userSubjects && state.userSubjects.length > 0) {
              setPhase('main');
            } else {
              setPhase('onboarding');
            }
          }}
          onAdminAccess={() => {
            setPhase('admin-pin');
          }}
        />
      )}

      {/* 5. Student Onboardings Wizard */}
      {phase === 'onboarding' && (
        <OnboardingCard 
          onFinish={() => {
            bridge.vibrate(40);
            bridge.showToast('Engine fully booted! Loading dashboard...');
            setPhase('main');
          }}
        />
      )}

      {/* 6. Supreme Admin CMS Panel */}
      {phase === 'admin-panel' && (
        <ErrorBoundary><AdminPanel onClose={() => setPhase('user-type')} /></ErrorBoundary>
      )}

      {/* 7. Student App Shell Workspace */}
      {phase === 'main' && (
        <div className="fixed inset-0 w-full h-full flex flex-col pt-[calc(8px+env(safe-area-inset-top))] overflow-hidden bg-slate-950">
          
          {/* SLIDING LEFT NAVIGATION DRAWER OVERLAY */}
          <div 
            className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] transition-all duration-300 ${
              isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsDrawerOpen(false)}
          >
            <div 
              className={`absolute top-0 bottom-0 left-0 w-[280px] sm:w-[320px] bg-slate-950 border-r border-slate-900/80 p-6 flex flex-col gap-6 shadow-2xl transition-all duration-300 transform ${
                isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-900">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 flex items-center justify-center bg-accent/15 border border-accent/20 rounded-xl shadow-glow">
                    <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                  </div>
                  <span className="text-sm font-extrabold text-white tracking-widest uppercase">OwnSkill App</span>
                </div>
                <button
                  onClick={() => { bridge.vibrate(10); setIsDrawerOpen(false); }}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Identity Profile Badge */}
              <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-900 p-3 rounded-2xl">
                <img 
                  src="./logo.png" 
                  className="w-10 h-10 rounded-full border border-slate-800 object-contain p-1 bg-slate-950 shadow-glow" 
                  alt="OwnSkill App Logo" 
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold text-white truncate">OwnSkill App</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase truncate">Goal: {state.userGoal.replace('-', ' ').toUpperCase()}</p>
                </div>
              </div>

              {/* Academic Progress Stats */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Performance</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/30 border border-slate-900 p-2.5 rounded-xl flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500 fill-amber-500/10" />
                    <div>
                      <p className="text-[9px] font-semibold text-slate-400">Streak</p>
                      <p className="text-xs font-bold text-white">{state.streak} Days</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/30 border border-slate-900 p-2.5 rounded-xl flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-500 fill-yellow-500/10" />
                    <div>
                      <p className="text-[9px] font-semibold text-slate-400">Coins</p>
                      <p className="text-xs font-bold text-white">{state.coins}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900/30 border border-slate-900 p-2.5 rounded-xl flex items-center gap-2.5 justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-[9px] font-semibold text-slate-400">XP Progress</p>
                      <p className="text-xs font-bold text-white">{state.xp} XP</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-md uppercase">Lvl {Math.floor(state.xp / 100) + 1}</span>
                </div>
              </div>

              {/* Dynamic Theme Customizer */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-slate-400" /> Color Accent Theme
                </h4>
                <div className="flex gap-2.5">
                  <button 
                    onClick={() => { bridge.vibrate(10); updateState({ accentTheme: "hsl(262, 80%, 55%)" }); }}
                    className={`w-6 h-6 rounded-full bg-purple-600 border ${state.accentTheme.includes('262') ? 'border-white scale-110' : 'border-transparent'} transition-all cursor-pointer`}
                    title="Violet Theme"
                  />
                  <button 
                    onClick={() => { bridge.vibrate(10); updateState({ accentTheme: "hsl(142, 70%, 45%)" }); }}
                    className={`w-6 h-6 rounded-full bg-emerald-600 border ${state.accentTheme.includes('142') ? 'border-white scale-110' : 'border-transparent'} transition-all cursor-pointer`}
                    title="Emerald Theme"
                  />
                  <button 
                    onClick={() => { bridge.vibrate(10); updateState({ accentTheme: "hsl(24, 85%, 50%)" }); }}
                    className={`w-6 h-6 rounded-full bg-amber-600 border ${state.accentTheme.includes('24') ? 'border-white scale-110' : 'border-transparent'} transition-all cursor-pointer`}
                    title="Amber Theme"
                  />
                  <button 
                    onClick={() => { bridge.vibrate(10); updateState({ accentTheme: "hsl(217, 85%, 55%)" }); }}
                    className={`w-6 h-6 rounded-full bg-blue-600 border ${state.accentTheme.includes('217') ? 'border-white scale-110' : 'border-transparent'} transition-all cursor-pointer`}
                    title="Blue Theme"
                  />
                </div>
              </div>

              {/* Quick Preferences Toggles */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Device Settings</h4>
                <div className="flex justify-between items-center bg-slate-900/30 border border-slate-900 px-3 py-2 rounded-xl">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    {state.isDarkMode ? <Moon className="w-3.5 h-3.5 text-slate-400" /> : <Sun className="w-3.5 h-3.5 text-yellow-400" />}
                    Dark Theme Mode
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={state.isDarkMode} 
                      onChange={(e) => { bridge.vibrate(15); updateState({ isDarkMode: e.target.checked }); }}
                      className="sr-only peer switch-input" 
                    />
                    <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 switch-bg" />
                  </label>
                </div>
              </div>

              {/* App General Information Modals section */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Information & Support</h4>
                <div className="flex flex-col gap-1 bg-slate-900/30 border border-slate-900 p-2 rounded-xl">
                  <button 
                    onClick={() => { bridge.vibrate(10); setActiveModal('about'); setIsDrawerOpen(false); }}
                    className="w-full text-left text-xs font-semibold text-slate-300 hover:text-white py-1.5 px-2 rounded-lg hover:bg-slate-900/80 transition-all cursor-pointer"
                  >
                    ℹ️ About Us
                  </button>
                  <button 
                    onClick={() => { bridge.vibrate(10); setActiveModal('privacy'); setIsDrawerOpen(false); }}
                    className="w-full text-left text-xs font-semibold text-slate-300 hover:text-white py-1.5 px-2 rounded-lg hover:bg-slate-900/80 transition-all cursor-pointer"
                  >
                    🔒 Privacy Policy
                  </button>
                  <button 
                    onClick={() => { bridge.vibrate(10); setActiveModal('contact'); setIsDrawerOpen(false); }}
                    className="w-full text-left text-xs font-semibold text-slate-300 hover:text-white py-1.5 px-2 rounded-lg hover:bg-slate-900/80 transition-all cursor-pointer"
                  >
                    📞 Contact Us
                  </button>
                </div>
              </div>

              {/* System Admin Portal Gateway Button */}
              <div className="space-y-2 mt-auto">
                <button
                  onClick={() => {
                    bridge.vibrate(20);
                    setIsDrawerOpen(false);
                    setPhase('admin-pin');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-red-500/20 hover:text-red-400 text-slate-400 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-red-500" />
                  Supreme Admin Gateway
                </button>

                {/* Log Out */}
                <button
                  onClick={() => {
                    bridge.vibrate(30);
                    setIsDrawerOpen(false);
                    logoutUser();
                    setPhase('auth');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out of Account
                </button>
              </div>

              {/* Connection Status & Credits */}
              <div className="text-[9px] text-slate-500 border-t border-slate-900 pt-3 flex items-center gap-1.5 justify-center select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                <span>Cloud Sync Active • v4.2.1</span>
              </div>

            </div>
          </div>

          {/* Main App Container Header */}
          <header className="flex justify-between items-center bg-slate-950/40 border-b border-slate-800/40 px-4 py-3 mx-4 rounded-2xl glass-panel relative z-25 shrink-0 animate-fade-scale">
            <div className="flex items-center gap-3">
              {/* Mobile Drawer Hamburger Button */}
              <button
                onClick={() => { bridge.vibrate(20); setIsDrawerOpen(true); }}
                className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all flex items-center justify-center"
                title="Open Navigation Drawer"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
              </button>

              <img 
                src="./logo.png" 
                className="hidden xs:flex w-8 h-8 rounded-full border border-slate-800 object-contain p-1 bg-slate-950 shadow-glow" 
                alt="OwnSkill Logo" 
              />
              
              <div>
                <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-wide truncate max-w-[90px] sm:max-w-none">
                  {(() => {
                    if (state.activeArticleId) return "Article";
                    if (state.activeTab === 'dashboard') return "OwnSkill";
                    if (state.activeTab === 'dpp') return "Smart DPP";
                    if (state.activeTab === 'tests') return "Live Tests";
                    if (state.activeTab === 'visualizer') return "Formula Lab";
                    if (state.activeTab === 'more') {
                      if (state.activeProfileSubTab === 'profile') return "My Profile";
                      if (state.activeProfileSubTab === 'articles') return "Articles Hub";
                    }
                    return "OwnSkill";
                  })()}
                </h2>
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1 truncate max-w-[90px] sm:max-w-none">
                  {(() => {
                    if (state.activeArticleId) return "Reading Mode";
                    if (state.activeTab === 'dashboard') return `Goal: ${state.userGoal.replace('-', ' ').toUpperCase()}`;
                    if (state.activeTab === 'dpp') return "Daily Practice";
                    if (state.activeTab === 'tests') return "Scheduled Exams";
                    if (state.activeTab === 'visualizer') return "Visual Equations";
                    if (state.activeTab === 'more') {
                      if (state.activeProfileSubTab === 'profile') return "Account Settings";
                      if (state.activeProfileSubTab === 'articles') return "Curated Reading";
                    }
                    return `Goal: ${state.userGoal.replace('-', ' ').toUpperCase()}`;
                  })()}
                </p>
              </div>
            </div>

            {/* Streak, Coins, XP status meters */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full text-amber-400 text-[10px] font-bold">
                <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
                <span>{state.streak}</span>
              </div>
              <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full text-yellow-400 text-[10px] font-bold">
                <Coins className="w-3.5 h-3.5 fill-yellow-400/20" />
                <span>{state.coins}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full text-emerald-400 text-[10px] font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>{state.xp} XP</span>
              </div>

              {/* Notification bell */}
              <button
                onClick={() => {
                  bridge.vibrate(15);
                  bridge.showToast('No new notifications');
                }}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all relative"
                title="Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                {/* Notification dot indicator */}
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full border border-slate-950 animate-pulse" />
              </button>
            </div>
          </header>

          {/* Dynamic Tab Workspace Container */}
          <main className="flex-1 overflow-y-auto px-4 py-5 webkit-overflow-touch scrollbar-none">
            {state.activeArticleId ? (
              <ArticleView />
            ) : (
              <>
                {state.activeTab === 'dashboard' && <DashboardTab />}
                {state.activeTab === 'dpp' && <DppPractice />}
                {state.activeTab === 'tests' && <LiveTests />}
                {state.activeTab === 'visualizer' && <FormulaCanvas />}
                {state.activeTab === 'more' && <ProfileManager />}
              </>
            )}
          </main>

          {/* Anchored Android app-style bottom navigation tabs bar */}
          <nav className="shrink-0 bg-slate-950 border-t border-slate-900 px-2 py-2.5 mx-0 mb-0 rounded-none relative z-25 flex justify-around select-none pb-[calc(8px+env(safe-area-inset-bottom))]">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
                state.activeTab === 'dashboard' ? `${getThemeAccentClass()} bg-accent/5 font-extrabold` : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9px] font-bold tracking-wide">Portal</span>
            </button>

            <button
              onClick={() => handleTabChange('dpp')}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
                state.activeTab === 'dpp' ? `${getThemeAccentClass()} bg-accent/5 font-extrabold` : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9px] font-bold tracking-wide">DPPs</span>
            </button>

            <button
              onClick={() => handleTabChange('tests')}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
                state.activeTab === 'tests' ? `${getThemeAccentClass()} bg-accent/5 font-extrabold` : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9px] font-bold tracking-wide">Tests</span>
            </button>

            <button
              onClick={() => handleTabChange('visualizer')}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
                state.activeTab === 'visualizer' ? `${getThemeAccentClass()} bg-accent/5 font-extrabold` : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9px] font-bold tracking-wide">Equations</span>
            </button>

            <button
              onClick={() => handleTabChange('more')}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
                state.activeTab === 'more' ? `${getThemeAccentClass()} bg-accent/5 font-extrabold` : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9px] font-bold tracking-wide">Profile</span>
            </button>
          </nav>
        </div>
      )}

      {/* 8. Full-screen Premium Modal Sheets (About, Privacy, Contact) */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[50000] flex items-center justify-center p-4 pt-[calc(20px+env(safe-area-inset-top))] pb-[calc(20px+env(safe-area-inset-bottom))] animate-fade-scale">
          <div className="w-full max-w-[500px] h-full max-h-[600px] glass-panel p-6 flex flex-col gap-5 overflow-hidden text-left">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white tracking-wide uppercase">
                {activeModal === 'about' && "About OwnSkill Engine"}
                {activeModal === 'privacy' && "Privacy & Compliance Policy"}
                {activeModal === 'contact' && "Academic Support Center"}
              </h3>
              <button
                onClick={() => { bridge.vibrate(10); setActiveModal(null); }}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto pr-1 text-slate-300 text-xs sm:text-sm space-y-4 font-normal leading-relaxed scrollbar-thin">
              {activeModal === 'about' && (
                <div className="space-y-4">
                  <div className="text-center py-4 bg-accent/5 border border-accent/15 rounded-2xl">
                    <Sparkles className="w-10 h-10 text-accent mx-auto mb-2 animate-pulse" />
                    <h4 className="text-sm font-extrabold text-white uppercase">OwnSkill v4.2.1</h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">The Supreme Academic Engine</p>
                  </div>
                  <p>
                    OwnSkill is a state-of-the-art hybrid mobile application engineered to help high-achieving STEM candidates maximize their cognitive performance.
                  </p>
                  <p>
                    By merging advanced gamification principles (streaks, rewarding coins, and level-ups) with practical workspace modules (interactive DPP canvas boards, trigonometry visualizers, and simulated test series arenas), OwnSkill accelerates your mastery of complex syllabus requirements.
                  </p>
                  <h5 className="font-extrabold text-white uppercase mt-4">Core Pillars:</h5>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-400 font-medium">
                    <li><strong>Daily Practice Problems (DPP)</strong>: Real-time custom-tailored worksheets focusing on core conceptual subjects.</li>
                    <li><strong>Battle Arenas</strong>: High-fidelity mock examination gates simulating All-India ranking patterns.</li>
                    <li><strong>Dynamic Equation Canvas</strong>: Hands-on mathematical tools to experiment with core Calculus limits and Newtonian forces.</li>
                  </ul>
                </div>
              )}

              {activeModal === 'privacy' && (
                <div className="space-y-4">
                  <p>
                    Your academic security and data sovereignty are our absolute top priority. This statement outlines our compliance rules and local hardware integration settings.
                  </p>
                  <h5 className="font-extrabold text-white uppercase">1. Data Storage & Sync</h5>
                  <p className="text-slate-400">
                    All user progress metrics, coins, and custom Syllabus changes are securely backed up in your dedicated Supabase database container profile. Client sessions are stored in local offline encrypted caches for absolute data resilience.
                  </p>
                  <h5 className="font-extrabold text-white uppercase">2. Native Hardware Bridge permissions</h5>
                  <p className="text-slate-400">
                    Our Android native WebView container accesses standard device vibration components (`vibratorService`) to transmit physical micro-haptic clicks during interactive button presses. No ambient background, geolocation, or media files are ever monitored or shared.
                  </p>
                  <h5 className="font-extrabold text-white uppercase">3. Tracking & Analysis</h5>
                  <p className="text-slate-400">
                    OwnSkill records absolute completion rates on DPP questions and battle challenges to compile local progress telemetry reports. We deploy zero external tracking trackers or commercial advertising scripts.
                  </p>
                </div>
              )}

              {activeModal === 'contact' && (
                <div className="space-y-4">
                  <p>
                    Encountered a server calibration issue or need assistance with your database profile? Submit a direct ticket below or reach out to our administration desk.
                  </p>
                  
                  <div className="bg-slate-900/50 border border-slate-900 p-3 rounded-2xl space-y-2">
                    <p className="font-semibold text-white">📧 Direct Support Email</p>
                    <p className="text-accent text-[11px] font-bold">support@ownskill.com</p>
                    <p className="font-semibold text-white mt-3">📍 Administration Desk</p>
                    <p className="text-slate-400 text-[11px]">Sector 62, Academic High-Performance Hub, Noida, UP, India</p>
                  </div>

                  <div className="border-t border-slate-800/80 pt-4 space-y-3">
                    <h5 className="font-extrabold text-white uppercase">Submit Direct Support Ticket</h5>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        bridge.vibrate(50);
                        bridge.showToast("Support ticket successfully submitted!");
                        setActiveModal(null);
                      }}
                      className="space-y-3"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Describe Your Issue</label>
                        <textarea 
                          className="w-full bg-slate-950/60 border border-slate-900 focus:border-accent rounded-xl p-2.5 text-xs text-white placeholder-slate-700 outline-none resize-none h-20"
                          placeholder="e.g. Supabase session synchronization error, custom DPP not compiling..."
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-accent hover:bg-accent-hover text-white py-2 rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg cursor-pointer"
                      >
                        Submit Ticket
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
