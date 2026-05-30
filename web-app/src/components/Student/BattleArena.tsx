import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAndroidBridge } from '../../hooks/useAndroidBridge';
import { Sword, Loader2, Trophy, AlertTriangle, Play } from 'lucide-react';

export function BattleArena() {
  const { addCoinsAndXp } = useApp();
  const bridge = useAndroidBridge();

  const [mode, setMode] = useState<'lobby' | 'matching' | 'battle' | 'result'>('lobby');
  const [opponent, setOpponent] = useState({ name: 'Aarav Sharma', avatar: 'AS', score: 0 });
  const [playerScore, setPlayerScore] = useState(0);
  
  // Game states
  const [timer, setTimer] = useState(30);
  const [currentEquation, setCurrentEquation] = useState({ num1: 0, num2: 0, op: '+', ans: 0 });
  const [inputVal, setInputVal] = useState('');
  const [isVictory, setIsVictory] = useState(true);

  const gameTimerIntervalRef = useRef<number | null>(null);
  const opponentSolveIntervalRef = useRef<number | null>(null);

  // Generate random simple math equation
  const generateEquation = () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let num1 = 0;
    let num2 = 0;
    let ans = 0;

    if (op === '+') {
      num1 = Math.floor(Math.random() * 80) + 10;
      num2 = Math.floor(Math.random() * 80) + 10;
      ans = num1 + num2;
    } else if (op === '-') {
      num1 = Math.floor(Math.random() * 90) + 10;
      num2 = Math.floor(Math.random() * (num1 - 5)) + 5; // guarantee positive
      ans = num1 - num2;
    } else {
      num1 = Math.floor(Math.random() * 12) + 2;
      num2 = Math.floor(Math.random() * 12) + 2;
      ans = num1 * num2;
    }

    setCurrentEquation({ num1, num2, op, ans });
    setInputVal('');
  };

  const handleStartQueue = () => {
    setMode('matching');
    bridge.vibrate(40);
    
    // Simulate finding opponent in 2.5s
    setTimeout(() => {
      const opps = [
        { name: 'Priya Patel', avatar: 'PP', score: 0 },
        { name: 'Aarav Sharma', avatar: 'AS', score: 0 },
        { name: 'Rohan Gupta', avatar: 'RG', score: 0 }
      ];
      const match = opps[Math.floor(Math.random() * opps.length)];
      setOpponent(match);
      setMode('battle');
      setPlayerScore(0);
      setTimer(30);
      generateEquation();
      bridge.vibrate(150); // Match found buzz!
      
      // Start Game loop timers
      startGameTimers();
    }, 2500);
  };

  const startGameTimers = () => {
    // 1. Core game countdown
    if (gameTimerIntervalRef.current) clearInterval(gameTimerIntervalRef.current);
    gameTimerIntervalRef.current = window.setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (gameTimerIntervalRef.current !== null) {
            clearInterval(gameTimerIntervalRef.current);
          }
          endBattleGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2. Opponent solver increments randomly every 1.5 - 3.5s
    if (opponentSolveIntervalRef.current !== null) {
      clearTimeout(opponentSolveIntervalRef.current);
    }
    const tickOpponent = () => {
      const delay = Math.floor(Math.random() * 2000) + 1500;
      opponentSolveIntervalRef.current = window.setTimeout(() => {
        setOpponent(prev => {
          if (mode === 'battle') {
            const nextScore = prev.score + (Math.random() > 0.3 ? 1 : 0);
            tickOpponent();
            return { ...prev, score: nextScore };
          }
          return prev;
        });
      }, delay);
    };
    tickOpponent();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);

    // Auto verify as soon as they type the complete answer
    if (Number(val) === currentEquation.ans) {
      setPlayerScore(prev => prev + 1);
      bridge.vibrate(15);
      generateEquation();
    }
  };

  const endBattleGame = () => {
    // Clear loops
    if (gameTimerIntervalRef.current !== null) {
      clearInterval(gameTimerIntervalRef.current);
    }
    if (opponentSolveIntervalRef.current !== null) {
      clearTimeout(opponentSolveIntervalRef.current);
    }
    
    setMode('result');
    
    // Determine victory
    setPlayerScore(finalPlayer => {
      setOpponent(finalOpponent => {
        const win = finalPlayer >= finalOpponent.score;
        setIsVictory(win);
        if (win) {
          addCoinsAndXp(50, 100);
          bridge.vibrate(250);
        } else {
          addCoinsAndXp(10, 20);
          bridge.vibrate(100);
        }
        return finalOpponent;
      });
      return finalPlayer;
    });
  };

  // Safe clean-up
  useEffect(() => {
    return () => {
      if (gameTimerIntervalRef.current !== null) {
        clearInterval(gameTimerIntervalRef.current);
      }
      if (opponentSolveIntervalRef.current !== null) {
        clearTimeout(opponentSolveIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="glass-panel p-5 sm:p-6 animate-fade-scale text-center max-w-[480px] mx-auto">
      
      {/* 1. LOBBY VIEW */}
      {mode === 'lobby' && (
        <div className="space-y-6 py-4 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent animate-pulse">
            <Sword className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">⚔️ Speed Battle Arena</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-[320px] leading-relaxed mx-auto">
              Challenge live mock competitors in a 30-second rapid mathematics solving battle. Fast answers earn multipliers!
            </p>
          </div>
          
          <button
            onClick={handleStartQueue}
            className="w-full max-w-[260px] bg-accent hover:bg-accent-hover active:scale-[0.98] text-white py-3 rounded-xl font-bold tracking-wide shadow-lg shadow-purple-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sword className="w-4.5 h-4.5" /> Queue Speed Match
          </button>
        </div>
      )}

      {/* 2. MATCHMAKING LOBBY QUEUE */}
      {mode === 'matching' && (
        <div className="space-y-6 py-8 flex flex-col items-center animate-form-fade">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Searching Competitors...</h3>
            <p className="text-xs text-slate-400 mt-1">Checking active lobby matchmaking registers</p>
          </div>
        </div>
      )}

      {/* 3. BATTLE ARENA MAIN CONTEST */}
      {mode === 'battle' && (
        <div className="space-y-6 py-2 animate-form-fade">
          {/* Header Progress Bars */}
          <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-800/80">
            {/* Player Progress */}
            <div className="text-left space-y-1.5">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                <span className="truncate text-white">You</span>
                <span className="text-accent">{playerScore} pts</span>
              </div>
              <div className="w-full h-2 bg-slate-950/60 border border-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (playerScore / 15) * 100)}%` }}
                />
              </div>
            </div>

            {/* Opponent Progress */}
            <div className="text-right space-y-1.5">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                <span className="text-amber-400">{opponent.score} pts</span>
                <span className="truncate text-white">{opponent.name}</span>
              </div>
              <div className="w-full h-2 bg-slate-950/60 border border-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (opponent.score / 15) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Core countdown and display equations */}
          <div className="flex flex-col items-center gap-4 py-2">
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full border shadow-lg ${
              timer <= 5 ? 'bg-red-500/20 border-red-500/30 text-red-400 animate-bounce' : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}>
              ⏱️ {timer}s remaining
            </span>

            <div className="py-6 px-8 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-widest font-mono select-none">
                {currentEquation.num1} {currentEquation.op} {currentEquation.num2}
              </p>
            </div>

            <div className="w-full max-w-[200px]">
              <input
                type="number"
                pattern="[0-9]*"
                value={inputVal}
                onChange={handleInputChange}
                placeholder="?"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-accent text-center text-2xl font-extrabold text-white rounded-xl py-2 outline-none"
                autoFocus
              />
            </div>
          </div>

          <button
            onClick={endBattleGame}
            className="text-xs text-red-400 hover:text-red-300 underline font-medium cursor-pointer"
          >
            Forfeit Contest
          </button>
        </div>
      )}

      {/* 4. VICTORY / DEFEAT RESULT CARD MODAL */}
      {mode === 'result' && (
        <div className="space-y-6 py-4 animate-form-fade flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border shadow-xl ${
            isVictory 
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-emerald-500/10' 
              : 'bg-red-500/10 border-red-500/25 text-red-400 shadow-red-500/10'
          }`}>
            <Trophy className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              {isVictory ? '🏆 Match Victory!' : '💥 Defeat!'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-[300px]">
              {isVictory 
                ? `Sensational! You solved ${playerScore} equations correctly to beat ${opponent.name} (${opponent.score} pts).`
                : `So close! You solved ${playerScore} equations correctly, but ${opponent.name} scored ${opponent.score} pts.`
              }
            </p>
          </div>

          {/* Reward Indicators */}
          <div className="flex gap-4 bg-slate-950/40 p-4 border border-slate-800/80 rounded-2xl w-full max-w-[280px]">
            <div className="flex-1 text-center border-r border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500">Coins</span>
              <p className="text-lg font-extrabold text-accent mt-0.5">+{isVictory ? 50 : 10} 🪙</p>
            </div>
            <div className="flex-1 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">XP</span>
              <p className="text-lg font-extrabold text-accent mt-0.5">+{isVictory ? 100 : 20} ⚡</p>
            </div>
          </div>

          <button
            onClick={() => { setMode('lobby'); bridge.vibrate(10); }}
            className="w-full max-w-[200px] bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800 text-slate-300 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      )}

    </div>
  );
}
