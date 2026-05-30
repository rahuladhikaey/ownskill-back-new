import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAndroidBridge } from '../../hooks/useAndroidBridge';
import { 
  FileText, Download, ExternalLink, X, ZoomIn, ZoomOut, Maximize2,
  ArrowLeft, Sparkles, Clock, Target
} from 'lucide-react';

interface DppPdfViewerProps {
  pdfUrl: string;
  questionTitle: string;
  onClose: () => void;
}

export function DppPdfViewer({ pdfUrl, questionTitle, onClose }: DppPdfViewerProps) {
  const bridge = useAndroidBridge();

  const handleDownload = () => {
    bridge.vibrate(15);
    bridge.showToast("PDF download started...");
    // In a real app, this would trigger a download
    window.open(pdfUrl, '_blank');
  };

  const handleOpenExternal = () => {
    bridge.vibrate(15);
    bridge.showToast("Opening PDF in new tab...");
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col animate-fade-scale">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            <div>
              <h3 className="text-sm font-extrabold text-white">PDF Viewer</h3>
              <p className="text-[10px] text-slate-400 font-semibold">{questionTitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenExternal}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 cursor-pointer active:scale-95 transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full h-full bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title="PDF Viewer"
                loading="lazy"
              />
            ) : (
              <div className="text-center space-y-4">
                <FileText className="w-16 h-16 text-slate-600 mx-auto" />
                <h3 className="text-lg font-extrabold text-white">PDF Not Available</h3>
                <p className="text-sm text-slate-400">This question does not have a PDF attachment.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with info */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-accent" />
              PDF Viewer Active
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Real-time rendering
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => bridge.vibrate(10)}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => bridge.vibrate(10)}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => bridge.vibrate(10)}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
