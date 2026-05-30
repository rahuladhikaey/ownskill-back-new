import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAndroidBridge } from '../../hooks/useAndroidBridge';
import { 
  Bookmark, BookOpen, Trash2, User, 
  Flame, Coins, BookOpenCheck
} from 'lucide-react';

export function ProfileManager() {
  const { state, updateState } = useApp();
  const bridge = useAndroidBridge();

  const lvl = Math.floor((state.xp || 0) / 100) + 1;
  const pct = (state.xp || 0) % 100;
  const avatarInit = state.username ? state.username.slice(0, 2).toUpperCase() : 'OS';

  const toggleFormulaBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateState(prev => {
      const isBookmarked = prev.savedFormulas.includes(id);
      const nextSaved = isBookmarked 
        ? prev.savedFormulas.filter(form => form !== id)
        : [...prev.savedFormulas, id];
      
      bridge.showToast(isBookmarked ? "Formula bookmark removed." : "Formula bookmarked!");
      return {
        ...prev,
        savedFormulas: nextSaved
      };
    });
    bridge.vibrate(15);
  };

  // ── Curated High-Value Science & Study Articles ──
  const libraryArticles = [
    { 
      id: "a-1", 
      title: "Secret Curves of Calculus", 
      desc: "How derivatives and slopes power state-of-the-art Machine Learning models and optimization algorithms.",
      category: "Mathematics",
      readTime: "4 min read",
      author: "Dr. Evelyn Vance",
      content: `Calculus isn't just a classroom exercise—it is the mathematics that powers the modern AI revolution. At the heart of training neural networks lies an algorithm called Gradient Descent, which relies entirely on derivatives.

By finding the derivative of a cost function, we can determine the exact direction and slope to adjust weights to minimize errors. Understanding optimization conceptually allows students to build strong foundations for future STEM pathways, whether they are building aerospace models or training the next generation of neural networks.`
    },
    { 
      id: "a-2", 
      title: "Low-Code Architecture & MVP Testing", 
      desc: "Constructing modular software architectures that test features quickly without bloated engineering overhead.",
      category: "Computer Science",
      readTime: "6 min read",
      author: "Marcus Chen",
      content: `In the world of product design, speed is everything. Building a Minimum Viable Product (MVP) shouldn't take months. Modern software engineering relies heavily on modular, highly isolated API integrations and low-code micro-services to test user hypotheses.

By separating database layers (like Supabase PostgreSQL) from decoupled frontends (like React/Vite), developers can rapidly swap components, iterate on design aesthetics, and gather real telemetries without redeploying massive backends. Build small, validate early, and scale organically.`
    },
    { 
      id: "a-3", 
      title: "Mastering Active Recall & Spaced Repetition", 
      desc: "Scientific learning techniques to shift complex physics and chemical formulas from short-term memory to permanent storage.",
      category: "Cognitive Science",
      readTime: "5 min read",
      author: "Prof. Sarah Jenkins",
      content: `Re-reading textbooks is one of the least effective ways to study. Cognitive research proves that Active Recall—forcing your brain to retrieve answers without looking—strengthens neural pathways far more effectively.

Combine this with Spaced Repetition (reviewing concepts at expanding intervals: 1 day, 3 days, 7 days), and your retention rate triples. Use smart tools, create targeted dynamic mock flashcards, and test yourself under timed exam stress to build ultimate confidence.`
    },
    { 
      id: "a-4", 
      title: "The Elegant Chemistry of Battery Technologies", 
      desc: "A conceptual dive into redox reactions, electron transfer, and the next-generation solid-state lithium grids.",
      category: "Chemistry",
      readTime: "5 min read",
      author: "Dr. Alan Mercer",
      content: `Every smartphone and electric vehicle on the planet relies on the elegant transfer of electrons between anode and cathode chambers. Through redox reactions, chemical energy is converted to electrical energy.

Next-generation Solid-State batteries aim to replace volatile liquid electrolytes with solid ceramics, promising double the energy density and charging speeds. Exploring chemical engineering from the molecular level helps students appreciate the deep connections between basic chemistry and global sustainability.`
    }
  ];

  // ── Curated bookmarked formula catalog ──
  const savedFormulasList = [
    { id: "f-1", title: "Quadratic Roots formula", eq: "x = [-b ± √(b² - 4ac)] / 2a" },
    { id: "f-2", title: "Euler Identity formula", eq: "e^(iπ) + 1 = 0" },
    { id: "f-3", title: "Snell's Law of Refraction", eq: "n₁ sin(θ₁) = n₂ sin(θ₂)" }
  ];

  const toggleArticleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    bridge.vibrate(15);
    
    updateState(prev => {
      const isBookmarked = prev.savedArticles.includes(id);
      const nextSaved = isBookmarked 
        ? prev.savedArticles.filter(artId => artId !== id)
        : [...prev.savedArticles, id];
      
      bridge.showToast(isBookmarked ? "Removed from saved bookmarks" : "Article bookmarked successfully!");
      return {
        ...prev,
        savedArticles: nextSaved
      };
    });
  };

  const handleRemoveFormula = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateState(prev => ({
      ...prev,
      savedFormulas: prev.savedFormulas.filter(form => form !== id)
    }));
    bridge.vibrate(15);
    bridge.showToast("Formula bookmark removed.");
  };

  return (
    <div className="space-y-5 pb-20 animate-form-fade">
      
      {/* ════════════════════════════════════════ */}
      {/*              MY PROFILE VIEW             */}
      {/* ════════════════════════════════════════ */}
      <div className="space-y-5 animate-form-fade">
        
        {/* PROFILE USER DETAILS CARD */}
        <div className="glass-panel p-5 flex flex-col xs:flex-row items-center gap-4.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center font-extrabold text-2xl text-white shadow-lg shrink-0 border border-accent/20">
            {avatarInit}
          </div>
          <div className="text-center xs:text-left flex-1 min-w-0 w-full">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 w-full">
              <h3 className="text-base font-extrabold text-white truncate">{state.username}</h3>
              <span className="text-[10px] self-center xs:self-start bg-accent/15 border border-accent/20 text-accent font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Goal: {state.userGoal.replace('-', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {state.xp > 0 ? `Level ${lvl} — Mastery Scholar` : 'Complete DPPs or tests to earn XP and level up'}
            </p>
            
            {/* Level Progress */}
            {state.xp > 0 && (
              <div className="w-full mt-3">
                <div className="w-full h-2 bg-slate-950/60 rounded-full overflow-hidden border border-slate-900">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300 shadow-glow"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide">Foundation track</span>
                  <span className="text-[9px] font-bold text-slate-400">{pct} / 100 XP to Level {lvl + 1}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DYNAMIC TELEMETRY STATS GRID */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400/10 animate-pulse" />
            </div>
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Daily Streak</span>
              <span className="text-lg font-extrabold text-white leading-none mt-0.5 block">{state.streak} Days</span>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/15 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-yellow-400 fill-yellow-400/10" />
            </div>
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Earned Coins</span>
              <span className="text-lg font-extrabold text-white leading-none mt-0.5 block">{state.coins} Balance</span>
            </div>
          </div>
        </div>

        {/* TWO COLUMN BOOKMARKS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* BOOKMARKED ARTICLES */}
          <div className="glass-panel p-5 space-y-4 text-left">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" /> Bookmarked Articles
            </h3>

            <div className="space-y-2.5">
              {state.savedArticles.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic py-4">No bookmarked articles saved yet.</p>
              ) : (
                libraryArticles.map(art => {
                  if (!state.savedArticles.includes(art.id)) return null;
                  return (
                    <div
                      key={art.id}
                      className="bg-slate-950/30 border border-slate-900 rounded-xl p-3 flex justify-between items-start gap-2 hover:border-slate-800/80 transition-colors"
                    >
                      <div className="text-left min-w-0 flex-1">
                        <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {art.category}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate mt-1.5">{art.title}</h4>
                        <p className="text-[9px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{art.desc}</p>
                      </div>
                      <button
                        onClick={(e) => toggleArticleBookmark(art.id, e)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 active:scale-95 transition-all cursor-pointer shrink-0"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* BOOKMARKED FORMULAS */}
          <div className="glass-panel p-5 space-y-4 text-left">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-accent" /> Saved Formulas
            </h3>

            <div className="space-y-2.5">
              {state.savedFormulas.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic py-4">No bookmarked formulas saved yet.</p>
              ) : (
                savedFormulasList.map(f => {
                  if (!state.savedFormulas.includes(f.id)) return null;
                  return (
                    <div
                      key={f.id}
                      className="bg-slate-950/30 border border-slate-900 rounded-xl p-3 flex justify-between items-start gap-2 hover:border-slate-800/80 transition-colors"
                    >
                      <div className="text-left min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-accent truncate">{f.title}</h4>
                        <p className="font-mono text-xs font-extrabold text-white mt-1.5 truncate bg-slate-950/60 p-2 rounded-lg border border-slate-900">{f.eq}</p>
                      </div>
                      <button
                        onClick={(e) => handleRemoveFormula(f.id, e)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 active:scale-95 transition-all cursor-pointer shrink-0"
                        title="Remove formula"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
