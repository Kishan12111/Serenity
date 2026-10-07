'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useConvexStats } from '@/lib/useConvexStats';

interface DayStat {
  date: string;
  totalMinutes: number;
  sessions: number;
}

interface MonthlyCalendarProps {
  onDayClick?: (date: string) => void;
}

export function MonthlyCalendar({ onDayClick }: MonthlyCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const { statsRange } = useConvexStats();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const totalDays = lastDay.getDate();

  // Build stats map
  const statsMap: Record<string, DayStat> = {};
  (statsRange as DayStat[]).forEach(d => { statsMap[d.date] = d; });

  // Max minutes in the month for fill calculation
  const maxMinutes = Math.max(
    ...Object.values(statsMap).map(d => d.totalMinutes),
    60 // minimum scale of 1 hour = 100%
  );

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const monthlyTotal = Object.values(statsMap)
    .filter(d => d.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`))
    .reduce((sum, d) => sum + d.totalMinutes, 0);

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Build calendar grid cells
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-2xl font-semibold text-white">{monthNames[month]} {year}</h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all">
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setViewDate(new Date())}
            className="px-3 py-1 text-xs font-medium rounded-full bg-white/8 border border-white/10 text-white/60 hover:text-white hover:bg-white/12 transition-all"
          >
            Today
          </button>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-xs">This month</p>
          <p className="text-white font-semibold">{formatMinutes(monthlyTotal)} focused</p>
        </div>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 mb-2">
        {dayNames.map(d => (
          <div key={d} className="text-center text-white/30 text-xs font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;

          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const stat = statsMap[dateStr];
          const isToday = dateStr === todayStr;
          const isFuture = new Date(dateStr + 'T12:00:00') > today;
          const fillPct = stat ? Math.min((stat.totalMinutes / maxMinutes) * 100, 100) : 0;
          const isMissed = !isFuture && !stat && new Date(dateStr + 'T12:00:00') < today;

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onDayClick?.(dateStr)}
              disabled={isFuture}
              className={`
                relative aspect-square rounded-2xl overflow-hidden transition-all duration-200
                border text-left
                ${ isToday
                  ? 'border-white/40 shadow-[0_0_12px_rgba(196,181,253,0.15)]'
                  : isMissed
                  ? 'border-red-900/20 bg-red-950/10'
                  : 'border-white/6 bg-white/[0.02]'
                }
                ${ isFuture ? 'opacity-20 cursor-default' : 'hover:border-white/20 hover:bg-white/5 cursor-pointer' }
              `}
            >
              {/* Liquid fill from bottom */}
              {fillPct > 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-b-2xl transition-all duration-700"
                  style={{
                    height: `${fillPct}%`,
                    background: 'linear-gradient(to top, rgba(167,139,250,0.55), rgba(244,164,196,0.25))',
                  }}
                />
              )}

              {/* Day number */}
              <div className="relative z-10 p-2">
                <span className={`text-sm font-medium ${ isToday ? 'text-white' : isFuture ? 'text-white/30' : 'text-white/70' }`}>
                  {day}
                </span>
              </div>

              {/* Time label at bottom of fill */}
              {stat && stat.totalMinutes > 5 && (
                <div className="absolute bottom-1.5 left-0 right-0 z-10 text-center">
                  <span className="text-[9px] font-medium text-white/60">{formatMinutes(stat.totalMinutes)}</span>
                </div>
              )}

              {/* Today indicator */}
              {isToday && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white/80" />
              )}

              {/* Missed indicator */}
              {isMissed && (
                <div className="absolute inset-0 flex items-end justify-center pb-1.5">
                  <span className="text-[9px] text-red-400/50">missed</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom activity strip */}
      <div className="mt-4 flex gap-0.5">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const stat = statsMap[dateStr];
          const fillPct = stat ? Math.min((stat.totalMinutes / maxMinutes) * 100, 100) : 0;
          const isToday = dateStr === todayStr;
          return (
            <div
              key={day}
              className={`flex-1 h-1.5 rounded-full transition-all ${ isToday ? 'ring-1 ring-white/50' : '' }`}
              style={{ background: fillPct > 0 ? `rgba(167,139,250,${0.2 + fillPct/100*0.7})` : 'rgba(255,255,255,0.06)' }}
            />
          );
        })}
      </div>
    </div>
  );
}
