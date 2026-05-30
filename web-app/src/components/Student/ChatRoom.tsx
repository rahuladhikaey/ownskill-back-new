import React, { useState, useRef, useEffect } from 'react';
import { useApp, ChatMessage } from '../../context/AppContext';
import { useAndroidBridge } from '../../hooks/useAndroidBridge';
import { Send, Bot, MessageSquare } from 'lucide-react';

export function ChatRoom() {
  const { state, updateState } = useApp();
  const bridge = useAndroidBridge();

  const [inputVal, setInputVal] = useState('');
  const deckRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (deckRef.current) {
      deckRef.current.scrollTop = deckRef.current.scrollHeight;
    }
  }, [state.chatMessages]);

  const handleSendMessage = () => {
    if (inputVal.trim().length === 0) return;
    const msg = inputVal.trim();
    setInputVal('');

    const playerMsg: ChatMessage = { sender: state.username || "You", text: msg, type: 'sent' };
    
    updateState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, playerMsg]
    }));
    bridge.vibrate(15);

    // AI Doubt Helper Simulation: if message contains "?"
    if (msg.includes('?')) {
      setTimeout(() => {
        const aiReply: ChatMessage = {
          sender: "🤖 AI Doubt Solver",
          text: `Doubt identified! Reevaluating vector fields: W = F • dr integration solves it. Try using Cartesian coordinates.`,
          type: 'received'
        };
        updateState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages, aiReply]
        }));
        bridge.vibrate(50);
      }, 3500);
    } else {
      // Normal buddy motivational reply
      setTimeout(() => {
        const replies = [
          "Superb effort! Let's schedule another study round tonight.",
          "Awesome! I'm reviewing chapter 3 right now.",
          "Perfect! Let's solve the math DPP sets next!"
        ];
        const oppMsg: ChatMessage = {
          sender: "Priya Patel",
          text: replies[Math.floor(Math.random() * replies.length)],
          type: 'received'
        };
        updateState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages, oppMsg]
        }));
        bridge.vibrate(20);
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="glass-panel p-4 flex flex-col h-[380px] animate-fade-scale">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80 mb-3">
        <MessageSquare className="w-5 h-5 text-accent" />
        <div className="text-left">
          <h3 className="text-xs font-bold text-white tracking-wide">Physics Wizards Guild</h3>
          <p className="text-[10px] text-slate-400">12,450 members • 2 active</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={deckRef}
        className="flex-1 overflow-y-auto space-y-3 pr-1 webkit-overflow-scrolling mb-4"
      >
        {state.chatMessages.map((m, idx) => {
          const isSent = m.type === 'sent';
          const isAi = m.sender.includes('🤖');
          return (
            <div
              key={idx}
              className={`flex flex-col max-w-[85%] ${isSent ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <span className="text-[9px] font-bold text-slate-500 mb-1">{m.sender}</span>
              <div className={`p-3 rounded-2xl text-xs leading-normal select-text ${
                isSent 
                  ? 'bg-accent text-white rounded-tr-none' 
                  : isAi 
                    ? 'bg-purple-950/40 border border-purple-500/20 text-purple-200 rounded-tl-none'
                    : 'bg-slate-950/40 border border-slate-800/80 text-slate-300 rounded-tl-none'
              }`}>
                {m.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input controls */}
      <div className="flex gap-2 pt-2 border-t border-slate-800/80">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a doubt or send a message..."
          className="flex-1 bg-slate-950/60 border border-slate-800 focus:border-accent rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 outline-none transition-all"
        />
        <button
          onClick={handleSendMessage}
          className="bg-accent hover:bg-accent-hover p-2.5 rounded-xl text-white active:scale-95 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
