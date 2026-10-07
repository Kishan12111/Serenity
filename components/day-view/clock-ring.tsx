'use client';

import { useMemo } from 'react';

export interface SessionArc {
  startHour: number;    // 0–23
  startMinute: number;  // 0–59
  endHour: number;
  endMinute: number;
  label?: string;
  labelCategory?: string;
  durationMinutes: number;
  mode: string;
  sessionIndex: number;
}

interface ClockRingProps {
  sessions: SessionArc[];
  faceHours: 'am' | 'pm'; // am = 0–12, pm = 12–24
  onArcHover: (arc: SessionArc | null, x: number, y: number) => void;
  onArcClick: (arc: SessionArc) => void;
}

const SIZE = 200; // SVG viewBox size
const CX = 100;
const CY = 100;
const RING_R = 88;       // outer ring radius
const ARC_WIDTH = 6;     // arc stroke width
const TICK_R = 84;       // tick marks

// Category → color
const categoryColor: Record<string, string> = {
  study:    '#c4b5fd', // lavender
  work:     '#f9a8d4', // dusty rose
  creative: '#a5b4fc', // periwinkle
  exercise: '#86efac', // sage
  reading:  '#fcd34d', // amber
  default:  '#a78bfa', // muted purple
};

function getCategoryColor(cat?: string) {
  return categoryColor[cat ?? 'default'] ?? categoryColor.default;
}

// Convert hour:minute on a 12h face to angle in degrees (0° = 12 o'clock = top)
// Face covers 12 hours. faceStart = 0 (am) means hours 0–12 map to 0°–360°
function timeToAngle(hour: number, minute: number, faceStart: number): number {
  const relH = ((hour - faceStart) % 12 + 12) % 12;
  return ((relH + minute / 60) / 12) * 360;
}

function polarToXY(angleDeg: number, r: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad),
  };
}

function describeArc(startAngle: number, endAngle: number, r: number) {
  // Handle wrap-around (e.g. 350° → 10°)
  const start = polarToXY(startAngle, r);
  const end = polarToXY(endAngle, r);
  const largeArc = ((endAngle - startAngle + 360) % 360) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function ClockRing({ sessions, faceHours, onArcHover, onArcClick }: ClockRingProps) {
  const faceStart = faceHours === 'am' ? 0 : 12;

  const arcs = useMemo(() => sessions.map(session => {
    const startAngle = timeToAngle(session.startHour, session.startMinute, faceStart);
    const endH = session.endHour;
    const endM = session.endMinute;
    let endAngle = timeToAngle(endH, endM, faceStart);

    // Ensure end > start (same or next day wrapping)
    if (endAngle <= startAngle) endAngle += 360;
    // Cap at 360 degrees total
    if (endAngle - startAngle > 355) endAngle = startAngle + 355;

    const path = describeArc(startAngle, endAngle, RING_R);
    const color = getCategoryColor(session.labelCategory);
    const midAngle = (startAngle + endAngle) / 2;
    const labelPos = polarToXY(midAngle, RING_R + 14);

    return { ...session, startAngle, endAngle, path, color, labelPos };
  }), [sessions, faceStart]);

  // Clock hand angles
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const hourAngle = timeToAngle(currentHour, currentMinute, faceStart);
  const minAngle = (currentMinute / 60) * 360;

  const hourHandEnd = polarToXY(hourAngle, 48);
  const minHandEnd  = polarToXY(minAngle, 65);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full h-full"
      style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.4))' }}
    >
      <defs>
        {/* Frosted glass inner circle */}
        <filter id="blur-bg" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Frosted glass face */}
      <circle cx={CX} cy={CY} r={RING_R - ARC_WIDTH/2 - 1}
        fill="rgba(10,12,25,0.35)"
        style={{ backdropFilter: 'blur(8px)' }}
      />

      {/* Base ring (dim, full circle) */}
      <circle
        cx={CX} cy={CY} r={RING_R}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={ARC_WIDTH}
      />

      {/* Hour tick marks — 12 dots */}
      {Array.from({ length: 12 }, (_, i) => {
        const ang = (i / 12) * 360;
        const pos = polarToXY(ang, TICK_R);
        return (
          <circle
            key={i}
            cx={pos.x} cy={pos.y} r={1.2}
            fill="rgba(255,255,255,0.2)"
          />
        );
      })}

      {/* Session arcs */}
      {arcs.map((arc) => (
        <g key={arc.sessionIndex}>
          {/* Glow layer */}
          <path
            d={arc.path}
            fill="none"
            stroke={arc.color}
            strokeWidth={ARC_WIDTH + 4}
            strokeLinecap="round"
            opacity={0.15}
          />
          {/* Main arc */}
          <path
            d={arc.path}
            fill="none"
            stroke={arc.color}
            strokeWidth={ARC_WIDTH}
            strokeLinecap="round"
            opacity={0.85}
            className="cursor-pointer transition-opacity hover:opacity-100"
            onMouseEnter={(e) => {
              const rect = (e.currentTarget as SVGElement).closest('svg')?.getBoundingClientRect();
              onArcHover(arc, e.clientX, e.clientY);
            }}
            onMouseLeave={() => onArcHover(null, 0, 0)}
            onClick={() => onArcClick(arc)}
          />
        </g>
      ))}

      {/* Clock hands */}
      {/* Hour hand */}
      <line
        x1={CX} y1={CY}
        x2={hourHandEnd.x} y2={hourHandEnd.y}
        stroke="rgba(240,237,232,0.9)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <line
        x1={CX} y1={CY}
        x2={minHandEnd.x} y2={minHandEnd.y}
        stroke="rgba(240,237,232,0.7)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* Center cap */}
      <circle cx={CX} cy={CY} r={4} fill="rgba(240,237,232,0.8)" />
    </svg>
  );
}
