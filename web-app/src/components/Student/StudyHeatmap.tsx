import React, { useMemo } from 'react';

export function StudyHeatmap() {
  // Generates 28 static colored grids representing learning intensity
  const boxes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 28; i++) {
      const r = Math.random();
      let level = "bg-slate-900/60 border border-slate-950/20";
      if (r > 0.85) level = "bg-accent/90 shadow-[0_0_8px_rgba(139,92,246,0.5)]";
      else if (r > 0.7) level = "bg-accent/65";
      else if (r > 0.5) level = "bg-accent/40";
      else if (r > 0.3) level = "bg-accent/15";
      arr.push({ id: i, level });
    }
    return arr;
  }, []);

  return (
    <div className="grid grid-cols-7 gap-1.5 pt-2 max-w-[280px] mx-auto sm:mx-0">
      {boxes.map((b) => (
        <div
          key={b.id}
          className={`w-6 h-6 rounded ${b.level} transition-all duration-300 hover:scale-110 hover:border-accent/45`}
        />
      ))}
    </div>
  );
}
