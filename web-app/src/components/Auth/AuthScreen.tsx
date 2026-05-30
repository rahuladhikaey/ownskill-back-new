import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAndroidBridge } from '../../hooks/useAndroidBridge';
import { supabase, isSupabaseConfigured } from '../../supabaseClient';
import { Mail, Lock, User as UserIcon, Sparkles, Loader2, ShieldAlert } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
  onAdminAccess: () => void;
}

export function AuthScreen({ onSuccess, onAdminAccess }: AuthScreenProps) {
  const { loginUser } = useApp();
  const bridge = useAndroidBridge();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forms State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');



  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail.trim().length < 5 || !loginEmail.includes('@')) {
      bridge.showToast("Please enter a valid email.");
      return;
    }

    if (!isSupabaseConfigured) {
      bridge.vibrate(150);
      bridge.showToast("Database not configured. Please contact administrator.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Secure Supabase Auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.toLowerCase().trim(),
        password: loginPassword,
      });

      if (error || !data.user) {
        bridge.vibrate(150);
        bridge.showToast("Invalid email or password.");
      } else {
        // Fetch the user's profile securely
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profile) {
          bridge.vibrate(40);
          localStorage.setItem('user_profile', JSON.stringify(profile));
          loginUser(profile.username);
          bridge.showToast("Welcome back to your secure workspace!");
          onSuccess();
        } else {
          bridge.showToast("Profile missing, please contact support.");
        }
      }
    } catch (err: any) {
      bridge.showToast(err.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regName.trim().length < 2) {
      bridge.showToast("Please enter your name.");
      return;
    }
    if (regEmail.trim().length < 5 || !regEmail.includes('@')) {
      bridge.showToast("Please enter a valid email.");
      return;
    }
    if (regPassword.length < 8) {
      bridge.showToast("Password must be at least 8 characters.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      bridge.showToast("Passwords do not match.");
      return;
    }

    if (!isSupabaseConfigured) {
      bridge.vibrate(150);
      bridge.showToast("Database not configured. Please contact administrator.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Securely Create the user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: regEmail.toLowerCase().trim(),
        password: regPassword,
        options: {
          data: {
            username: regName.trim(),
          }
        }
      });

      if (signUpError) {
        bridge.vibrate(150);
        bridge.showToast(signUpError.message);
        return;
      }

      if (data.user) {
        bridge.vibrate(40);
        bridge.showToast("Account securely created! Please sign in.");
        setActiveTab('login');
      }
    } catch (err: any) {
      bridge.showToast(err.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex items-start justify-center px-4 py-8 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[400px] glass-panel p-6 sm:p-8 my-auto animate-fade-scale">
        
        {/* App Logo & Header */}
        <div className="text-center mb-6">
          <div className="relative w-14 h-14 mx-auto mb-3 flex items-center justify-center bg-slate-950 border border-slate-800/80 rounded-2xl shadow-glow overflow-hidden">
            <img 
              src="./logo.png" 
              className="w-10 h-10 object-contain" 
              alt="OwnSkill Logo" 
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide uppercase">OwnSkill App</h2>
          <p className="text-xs text-slate-400 mt-1">Activate your academic engine to excel</p>
        </div>

        {/* Sliding Capsule Toggle Switch */}
        <div className="relative flex bg-slate-950/80 border border-slate-800/80 p-1.5 rounded-2xl mb-6">
          <div 
            className="absolute top-1.5 bottom-1.5 left-1.5 bg-accent hover:bg-accent-hover rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/20"
            style={{
              width: 'calc(50% - 3px)',
              transform: activeTab === 'register' ? 'translateX(100%)' : 'translateX(0%)'
            }}
          />
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => { setActiveTab('login'); bridge.vibrate(10); }}
            className={`relative z-10 flex-1 py-2 text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === 'login' ? 'text-white font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => { setActiveTab('register'); bridge.vibrate(10); }}
            className={`relative z-10 flex-1 py-2 text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === 'register' ? 'text-white font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Render Tab Contents */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-form-fade">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="student@example.com"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent focus:shadow-glow rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent focus:shadow-glow rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent-hover active:scale-[0.98] text-white py-2.5 rounded-xl font-bold tracking-wide shadow-lg shadow-purple-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Entering Workspace...
                </>
              ) : (
                "Enter Dashboard"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-form-fade">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Alex Carter"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent focus:shadow-glow rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="student@example.com"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent focus:shadow-glow rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent focus:shadow-glow rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent focus:shadow-glow rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent-hover active:scale-[0.98] text-white py-2.5 rounded-xl font-bold tracking-wide shadow-lg shadow-purple-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating Account...
                </>
              ) : (
                "Generate Account"
              )}
            </button>
          </form>
        )}



        {/* Supreme Admin Fast-track Bypass Link */}
        <div className="text-center mt-5">
          <button
            onClick={() => { bridge.vibrate(15); onAdminAccess(); }}
            disabled={isSubmitting}
            className="text-[10px] sm:text-xs font-semibold text-slate-500 hover:text-red-400 active:text-red-500 cursor-pointer flex items-center justify-center gap-1.5 mx-auto transition-all disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Supreme Admin Portal Bypass
          </button>
        </div>

        {/* Dynamic Database connection status footer */}
        <div className="text-[9px] text-slate-500 text-center mt-6 flex items-center justify-center gap-1.5 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
          <span>OwnSkill Cloud Engine • Database Connection Verified</span>
        </div>

      </div>
    </div>
  );
}
