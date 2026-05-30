import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAndroidBridge } from '../../hooks/useAndroidBridge';
import { 
  ArrowLeft, Clock, Construction, Sparkles
} from 'lucide-react';

export function ArticleView() {
  const { state, updateState } = useApp();
  const bridge = useAndroidBridge();

  const handleBack = () => {
    updateState({ activeArticleId: null });
    bridge.vibrate(15);
  };

  return (
    <div className="space-y-5 pb-20 animate-form-fade">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-extrabold text-white tracking-wide">Articles</h2>
      </div>

      {/* Coming Soon Card */}
      <div className="glass-panel p-8 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto animate-pulse">
          <Construction className="w-10 h-10 text-accent" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold text-white">Coming Soon</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            We're working hard to bring you high-quality educational articles. Check back soon for amazing content!
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Clock className="w-4 h-4" />
          <span>Articles will be available shortly</span>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={handleBack}
            className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-xl text-sm font-bold tracking-wide shadow-lg shadow-purple-500/10 transition-all cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>

      {/* Placeholder for future article features */}
      <div className="glass-panel p-5 space-y-3">
        <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          What's Coming
        </h4>
        <div className="space-y-2 text-xs text-slate-400">
          <p>• In-depth subject articles</p>
          <p>• Exam preparation guides</p>
          <p>• Concept explanations</p>
          <p>• Study tips and strategies</p>
        </div>
      </div>
    </div>
  );
}
