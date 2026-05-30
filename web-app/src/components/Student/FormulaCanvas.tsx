import React, { useState, useEffect, useRef } from 'react';
import { useAndroidBridge } from '../../hooks/useAndroidBridge';
import { Play, RotateCcw } from 'lucide-react';

export function FormulaCanvas() {
  const bridge = useAndroidBridge();
  const [animType, setAnimType] = useState<'circle' | 'projectile'>('circle');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  
  // Animation variables
  const thetaRef = useRef(0);
  const projTRef = useRef(0);
  const [angleDeg, setAngleDeg] = useState(0);
  const [projCoord, setProjCoord] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI retina screen scaling
    const dpr = window.devicePixelRatio || 1;
    const width = 320;
    const height = 220;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (animType === 'circle') {
        // Draw Coordinate Axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width / 2, 20);
        ctx.lineTo(width / 2, height - 20);
        ctx.moveTo(30, height / 2);
        ctx.lineTo(width - 30, height / 2);
        ctx.stroke();

        // Draw Reference Unit Circle (radius = 65)
        const cx = width / 2;
        const cy = height / 2;
        const r = 65;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // Calculate active coordinates
        thetaRef.current += 0.015;
        if (thetaRef.current > Math.PI * 2) thetaRef.current = 0;
        
        const deg = Math.round((thetaRef.current * 180) / Math.PI);
        setAngleDeg(deg);

        const px = cx + r * Math.cos(thetaRef.current);
        const py = cy - r * Math.sin(thetaRef.current); // Y-axis inverted in Canvas coordinates

        // Draw Cosine projection line (blue - along X-axis)
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, cy);
        ctx.stroke();

        // Draw Sine projection line (green - vertical from px to py)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px, cy);
        ctx.lineTo(px, py);
        ctx.stroke();

        // Draw rotating radius line (accent color)
        ctx.strokeStyle = 'rgb(139, 92, 246)'; // Accent HSL H=262
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.stroke();

        // Draw center dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw leading point dot
        ctx.fillStyle = 'rgb(139, 92, 246)';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Draw coordinate axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 20);
        ctx.lineTo(40, height - 30);
        ctx.moveTo(30, height - 30);
        ctx.lineTo(width - 30, height - 30);
        ctx.stroke();

        // Projectile Equation simulation
        // y = x*tan(theta) - (g * x^2)/(2 * u^2 * cos^2(theta))
        const launchX = 40;
        const launchY = height - 30;
        const g = 0.098;
        const u = 6.5; // velocity
        const angleRad = (45 * Math.PI) / 180;

        // Draw target parabolic trajectory guide path (dotted)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(launchX, launchY);
        for (let x = 0; x < width - 80; x += 2) {
          const y = x * Math.tan(angleRad) - (g * x * x) / (2 * u * u * Math.cos(angleRad) * Math.cos(angleRad));
          ctx.lineTo(launchX + x, launchY - y);
        }
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dashes

        // Animate particles
        projTRef.current += 0.45;
        const curX = projTRef.current;
        const curY = curX * Math.tan(angleRad) - (g * curX * curX) / (2 * u * u * Math.cos(angleRad) * Math.cos(angleRad));

        // Auto restart loop
        if (launchY - curY > height || curX > width - 80 || launchY - curY > launchY) {
          projTRef.current = 0;
          bridge.vibrate(10);
        }

        setProjCoord({ x: Math.round(curX), y: Math.round(Math.max(0, curY)) });

        // Draw launching point node
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(launchX, launchY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw moving particle indicator
        ctx.fillStyle = 'rgb(139, 92, 246)';
        ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(launchX + curX, launchY - curY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [animType, bridge]);

  const handleReset = () => {
    bridge.vibrate(15);
    thetaRef.current = 0;
    projTRef.current = 0;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Switch Control button */}
      <div className="flex gap-2 bg-slate-950/45 p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={() => { setAnimType('circle'); bridge.vibrate(10); }}
          className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            animType === 'circle' ? 'bg-accent text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Trigonometric Circle
        </button>
        <button
          onClick={() => { setAnimType('projectile'); bridge.vibrate(10); }}
          className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            animType === 'projectile' ? 'bg-accent text-white shadow-glow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Projectile Trajectory
        </button>
      </div>

      {/* HTML5 Canvas Render container */}
      <div className="relative w-full aspect-[320/220] rounded-2xl overflow-hidden bg-slate-950/60 border border-slate-800 flex items-center justify-center">
        <canvas ref={canvasRef} className="block" />
        
        {/* Dynamic coordinate indicators Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] sm:text-xs font-semibold tracking-wide space-y-0.5">
          {animType === 'circle' ? (
            <>
              <p className="text-white">θ = <span className="text-accent font-bold">{angleDeg}°</span></p>
              <p className="text-blue-400">cos(θ) = <span className="font-bold">{(Math.cos((angleDeg * Math.PI)/180)).toFixed(3)}</span></p>
              <p className="text-emerald-400">sin(θ) = <span className="font-bold">{(Math.sin((angleDeg * Math.PI)/180)).toFixed(3)}</span></p>
            </>
          ) : (
            <>
              <p className="text-white">launch: <span className="text-amber-400 font-bold">45°</span></p>
              <p className="text-accent">X = <span className="font-bold">{projCoord.x} m</span></p>
              <p className="text-accent">Y = <span className="font-bold">{projCoord.y} m</span></p>
            </>
          )}
        </div>

        {/* Action controllers */}
        <button
          onClick={handleReset}
          className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 active:scale-95 transition-all cursor-pointer"
          title="Reset Animation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
