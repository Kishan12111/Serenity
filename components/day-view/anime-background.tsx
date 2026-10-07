'use client';

import { useEffect, useState } from 'react';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

interface AnimeBackgroundProps {
  timeOfDay: TimeOfDay;
}

// Color palettes for each time of day
const palettes: Record<TimeOfDay, { sky: string[]; horizon: string; ground: string }> = {
  dawn: {
    sky: ['#1a1035', '#2d1b4e', '#4a2060', '#7b3f72'],
    horizon: '#e8927a',
    ground: '#1a1230',
  },
  day: {
    sky: ['#2c4a8c', '#3d6bc4', '#5b8fd9', '#87b4e8'],
    horizon: '#f4d4a8',
    ground: '#1e2d40',
  },
  dusk: {
    sky: ['#1a1535', '#3d2060', '#8b3a7a', '#d4704a'],
    horizon: '#f5a55a',
    ground: '#16121e',
  },
  night: {
    sky: ['#080b14', '#0d1225', '#111835', '#1a2045'],
    horizon: '#1f2a55',
    ground: '#06080f',
  },
};

const Star = ({ x, y, size, opacity }: { x: number; y: number; size: number; opacity: number }) => (
  <circle cx={x} cy={y} r={size} fill="white" opacity={opacity} />
);

function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (i * 137.508) % 100,
    y: (i * 73.137) % 60,
    size: 0.3 + (i % 5) * 0.15,
    opacity: 0.3 + (i % 4) * 0.175,
  }));
}

const STARS = generateStars(80);

export function AnimeBackground({ timeOfDay }: AnimeBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const palette = palettes[timeOfDay];
  const showStars = timeOfDay === 'night' || timeOfDay === 'dusk' || timeOfDay === 'dawn';
  const showMoon = timeOfDay === 'night' || timeOfDay === 'dawn';
  const showSun = timeOfDay === 'day' || timeOfDay === 'dusk';

  return (
    <div className="absolute inset-0 overflow-hidden transition-all duration-[2000ms]">
      {/* SVG scene */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 56"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            {palette.sky.map((color, i) => (
              <stop
                key={i}
                offset={`${(i / (palette.sky.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
          <linearGradient id="horizonGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.horizon} stopOpacity="0.6" />
            <stop offset="100%" stopColor={palette.horizon} stopOpacity="0" />
          </linearGradient>
          {/* Soft cloud gradients */}
          <radialGradient id="cloudGrad1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.12" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cloudGrad2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.08" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky */}
        <rect width="100" height="56" fill="url(#skyGrad)" />

        {/* Stars */}
        {showStars && mounted && STARS.map(s => (
          <Star key={s.id} x={s.x} y={s.y} size={s.size} opacity={s.opacity} />
        ))}

        {/* Horizon glow */}
        <rect x="0" y="38" width="100" height="18" fill="url(#horizonGrad)" />

        {/* Moon */}
        {showMoon && (
          <g>
            <circle cx="75" cy="10" r="6" fill="#d4cce8" opacity="0.9" />
            <circle cx="77.5" cy="9" r="5.2" fill={palette.sky[1]} />
            {/* Crescent highlight */}
            <circle cx="73" cy="9" r="1.5" fill="white" opacity="0.15" />
          </g>
        )}

        {/* Sun */}
        {showSun && (
          <g>
            <circle cx="72" cy="28" r="8" fill={palette.horizon} opacity="0.3" />
            <circle cx="72" cy="28" r="5" fill={palette.horizon} opacity="0.5" />
            <circle cx="72" cy="28" r="3" fill="#fde68a" opacity="0.8" />
          </g>
        )}

        {/* Clouds — painted, wispy */}
        <ellipse cx="20" cy="18" rx="14" ry="5" fill="url(#cloudGrad1)" />
        <ellipse cx="16" cy="16" rx="8" ry="4" fill="url(#cloudGrad1)" />
        <ellipse cx="26" cy="17" rx="9" ry="3.5" fill="url(#cloudGrad1)" />

        <ellipse cx="60" cy="12" rx="12" ry="4" fill="url(#cloudGrad2)" />
        <ellipse cx="55" cy="11" rx="7" ry="3" fill="url(#cloudGrad2)" />

        <ellipse cx="40" cy="28" rx="10" ry="3.5" fill="url(#cloudGrad1)" />

        {/* Distant hills silhouette */}
        <path
          d="M0 52 Q10 44 20 48 Q30 42 40 46 Q52 40 60 45 Q70 39 80 43 Q90 41 100 44 L100 56 L0 56 Z"
          fill={palette.ground}
          opacity="0.9"
        />
        {/* Second hill layer for depth */}
        <path
          d="M0 54 Q15 50 25 52 Q40 48 55 52 Q68 50 80 53 Q90 51 100 53 L100 56 L0 56 Z"
          fill={palette.ground}
        />
      </svg>

      {/* Overlay tint for readability */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
