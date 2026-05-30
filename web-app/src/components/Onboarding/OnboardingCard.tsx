import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAndroidBridge } from '../../hooks/useAndroidBridge';
import { BookOpen, Check } from 'lucide-react';

interface OnboardingCardProps {
  onFinish: () => void;
}

export function OnboardingCard({ onFinish }: OnboardingCardProps) {
  const { state, updateState, setAccentColor } = useApp();
  const bridge = useAndroidBridge();

  const [step, setStep] = useState(1);
  const [loadingStep, setLoadingStep] = useState(0);

  // Academic goal options
  const goals = [
    { id: "foundation", label: "Foundation", icon: "📘", desc: "Build strong fundamentals across all core subjects" },
    { id: "advanced-foundation", label: "Advanced Foundation", icon: "🚀", desc: "Deep conceptual mastery with advanced problem-solving" }
  ];

  const subjectsList = [
    { id: "physics", label: "Physics", icon: "📐" },
    { id: "chemistry", label: "Chemistry", icon: "🧪" },
    { id: "math", label: "Mathematics", icon: "➕" },
    { id: "biology", label: "Biology", icon: "🌿" }
  ];

  const themes = [
    { id: "default-violet", label: "Majestic Violet", color: "hsl(262, 80%, 55%)", bg: "bg-[#6c26f2]" },
    { id: "emerald", label: "Emerald Green", color: "hsl(142, 70%, 45%)", bg: "bg-[#10b981]" },
    { id: "gold", label: "Sunset Gold", color: "hsl(24, 85%, 50%)", bg: "bg-[#f59e0b]" },
    { id: "blue", label: "Oceanic Blue", color: "hsl(217, 90%, 50%)", bg: "bg-[#3b82f6]" }
  ];

  const handleSelectGoal = (gid: string) => {
    updateState({ userGoal: gid });
    bridge.vibrate(15);
  };

  const handleToggleSubject = (sid: string) => {
    const subs = [...state.userSubjects];
    const idx = subs.indexOf(sid);
    if (idx > -1) {
      subs.splice(idx, 1);
    } else {
      subs.push(sid);
    }
    updateState({ userSubjects: subs });
    bridge.vibrate(15);
  };

  const handleSelectTheme = (themeId: string, colorHsl: string) => {
    const unlocked = [...state.unlockedThemes];
    if (!unlocked.includes(themeId)) {
      unlocked.push(themeId);
    }
    updateState({ accentTheme: colorHsl, unlockedThemes: unlocked });
    setAccentColor(colorHsl);
    bridge.vibrate(20);
    bridge.showToast(`Active accent set to: ${themeId.replace('-', ' ').toUpperCase()}`);
  };

  const handleContinue = () => {
    bridge.vibrate(10);
    if (step === 1) {
      if (!state.userGoal) {
        bridge.showToast("Please choose an academic goal.");
        return;
      }
      // Preset standard prepare subjects automatically
      updateState({ userSubjects: ['physics', 'chemistry', 'math'] });
      setStep(2);
      simulatePlanGeneration();
    } else if (step === 3) {
      onFinish();
    }
  };

  const handleBack = () => {
    bridge.vibrate(10);
    if (step === 3) {
      // Skip the assembly loading step when backing out
      setStep(1);
    } else if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const simulatePlanGeneration = () => {
    setLoadingStep(1);

    setTimeout(() => {
      setLoadingStep(2);
      bridge.vibrate(15);

      setTimeout(() => {
        setLoadingStep(3);
        bridge.vibrate(15);

        setTimeout(() => {
          setLoadingStep(4);
          bridge.vibrate(20);
          // Auto transition to Step 3 (Theme Selection) after completion
          setTimeout(() => {
            setStep(3);
          }, 800);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="w-full flex items-start justify-center px-4 py-8 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[550px] glass-panel p-6 sm:p-8 my-auto animate-fade-scale flex flex-col gap-6">

        {/* Onboarding Wizard Progress Bar */}
        <div className="w-full h-1.5 bg-slate-950/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        {/* STEP 1: GOAL SELECT */}
        {step === 1 && (
          <div className="space-y-4 animate-form-fade">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">Choose Your Academic Goal</h2>
              <p className="text-xs text-slate-400 mt-1">We customize study planners and DPP practice problems for you</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {goals.map((g) => (
                <div
                  key={g.id}
                  onClick={() => handleSelectGoal(g.id)}
                  className={`glass-card-interactive p-4 border text-center flex flex-col items-center gap-2 cursor-pointer ${state.userGoal === g.id ? 'border-accent bg-purple-500/5 shadow-glow' : 'border-slate-800'
                    }`}
                >
                  <span className="text-3xl">{g.icon}</span>
                  <h3 className="font-bold text-sm text-white tracking-wide">{g.label}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 leading-normal">{g.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: AI STUDY PLANNER GENERATION */}
        {step === 2 && (
          <div className="space-y-5 animate-form-fade text-center py-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">Assembling AI Study Plan</h2>
              <p className="text-xs text-slate-400 mt-1">Our neural engine is structuring your customized syllabus</p>
            </div>

            <div className="space-y-3 max-w-[340px] mx-auto text-left pt-2">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${loadingStep > 1 ? 'bg-emerald-500 text-white' : 'bg-accent text-white animate-pulse'
                  }`}>
                  {loadingStep > 1 ? '✓' : '●'}
                </div>
                <span className={`text-xs font-semibold ${loadingStep >= 1 ? 'text-white' : 'text-slate-500'}`}>
                  Analyzing weak spots & goals...
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${loadingStep > 2 ? 'bg-emerald-500 text-white' : loadingStep === 2 ? 'bg-accent text-white animate-pulse' : 'border border-slate-800 bg-slate-950/40 text-transparent'
                  }`}>
                  {loadingStep > 2 ? '✓' : loadingStep === 2 ? '●' : ''}
                </div>
                <span className={`text-xs font-semibold ${loadingStep >= 2 ? 'text-white' : 'text-slate-500'}`}>
                  Compiling topic nodes blueprint...
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${loadingStep > 3 ? 'bg-emerald-500 text-white' : loadingStep === 3 ? 'bg-accent text-white animate-pulse' : 'border border-slate-800 bg-slate-950/40 text-transparent'
                  }`}>
                  {loadingStep > 3 ? '✓' : loadingStep === 3 ? '●' : ''}
                </div>
                <span className={`text-xs font-semibold ${loadingStep >= 3 ? 'text-white' : 'text-slate-500'}`}>
                  Synchronizing Supabase database...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: THEME SELECTION */}
        {step === 3 && (
          <div className="space-y-4 animate-form-fade">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">Personalize App Theme</h2>
              <p className="text-xs text-slate-400 mt-1">Select a premium color scheme representing your accent</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              {themes.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id, t.color)}
                  className={`glass-card-interactive p-4 border flex flex-col gap-3 cursor-pointer ${state.accentTheme === t.color ? 'border-accent bg-purple-500/5 shadow-glow' : 'border-slate-800'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-white tracking-wide">{t.label}</span>
                    <div className={`w-5 h-5 rounded-full ${t.bg} border border-white/20`} />
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {state.accentTheme === t.color ? "✓ Theme Active" : "Click to select"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wizard Footer controls */}
        {step !== 2 && (
          <div className="flex gap-3 pt-4 border-t border-slate-800/80">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800 text-slate-300 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              onClick={handleContinue}
              className="flex-[2] bg-accent hover:bg-accent-hover active:scale-[0.98] text-white py-2.5 rounded-xl font-bold tracking-wide shadow-lg shadow-purple-500/10 transition-all cursor-pointer text-center"
            >
              {step === 3 ? "Launch Suite" : "Continue"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
