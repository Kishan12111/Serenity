'use client';

import { useState } from 'react';
import { AnimeBackground, TimeOfDay } from './anime-background';
import { ClockRing, SessionArc } from './clock-ring';

interface DayViewProps {
  dateStr: string;
  sessions: SessionArc[];
  onBack: () => void;
}

export function DayView({ dateStr, sessions, onBack }: DayViewProps) {
  const [scrollHour, setScrollHour] = useState<number>(new Date().getHours());
  const [hoveredArc, setHoveredArc] = useState<SessionArc | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const getTimeOfDay = (hour: number): TimeOfDay => {
    if (hour >= 5 && hour < 9) return 'dawn';
    if (hour >= 9 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'dusk';
    return 'night';
  };

  const faceHours = scrollHour >= 18 || scrollHour < 6 ? 'pm' : 'am';
  const timeOfDay = getTimeOfDay(scrollHour);

  // Parse total focus time today
  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <AnimeBackground timeOfDay={timeOfDay} />
      
      {/* Top Bar */}
      <div className="absolute top-6 left-6 z-20">
        <button onClick={onBack} className="text-white/70 hover:text-white flex items-center gap-2">
          ← Back
        </button>
      </div>
      
      {/* Scroll control mock - normally handled by scroll event */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <input 
          type="range" 
          min="0" max="23" 
          value={scrollHour} 
          onChange={e => setScrollHour(+e.target.value)}
          className="h-32 -rotate-90 appearance-none bg-white/10 rounded-full"
        />
        <div className="text-center text-white/50 text-xs mt-16">{scrollHour}:00</div>
      </div>

      {/* Main Clock */}
      <div className="relative z-10 w-full max-w-lg">
        <ClockRing 
          sessions={sessions} 
          faceHours={faceHours}
          onArcHover={(arc, x, y) => { setHoveredArc(arc); setHoverPos({x, y}); }}
          onArcClick={() => {}}
        />
      </div>

      {/* Hover Tooltip */}
      {hoveredArc && (
        <div 
          className="fixed z-50 pointer-events-none p-3 rounded-xl bg-black/40 backdrop-blur-xl border border-white/20 transition-all duration-200"
          style={{ 
            left: hoverPos.x + 20, 
            top: hoverPos.y - 40,
            transform: 'scale(1)',
            opacity: 1 
          }}
        >
          <div className="font-semibold text-white/90 text-sm">{hoveredArc.label || 'Focus Session'}</div>
          <div className="text-white/60 text-xs mt-1">
            {hoveredArc.startHour}:{String(hoveredArc.startMinute).padStart(2, '0')} → {hoveredArc.endHour}:{String(hoveredArc.endMinute).padStart(2, '0')}
          </div>
          <div className="text-white/80 text-xs mt-2 font-medium">
            {hoveredArc.durationMinutes}m
          </div>
        </div>
      )}

      {/* Floating Stats */}
      <div className="absolute right-12 top-20 z-20 flex flex-col items-end">
        <h2 className="text-4xl font-thin text-[#f0ede8] mb-1">
          {new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
        </h2>
        <p className="text-[#f0ede8]/50 text-sm mb-12">
          {new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="flex items-start gap-4 mb-8">
          <div className="text-7xl font-serif text-[#f0ede8]">
            {Math.min(100, Math.round((totalMinutes / 120) * 100))}
          </div>
          <div className="mt-2 text-right">
            <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400" style={{ width: `${Math.min(100, Math.round((totalMinutes / 120) * 100))}%` }} />
            </div>
            <div className="text-[#f0ede8]/50 text-xs mt-1">Focus Score</div>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-end">
          <div className="flex items-center gap-3">
            <div className="text-[#f0ede8] font-bold text-xl">{Math.floor(totalMinutes/60)}h {totalMinutes%60}m</div>
            <div className="text-[#f0ede8]/50 text-sm w-24 text-right">focused {dateStr === new Date().toISOString().split('T')[0] ? 'today' : ''}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[#f0ede8] font-bold text-xl">{sessions.length}</div>
            <div className="text-[#f0ede8]/50 text-sm w-24 text-right">sessions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
