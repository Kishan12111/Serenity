'use client';

import { useConvexStats } from '@/lib/useConvexStats';
import { Flame, Trophy } from 'lucide-react';

interface StreakIndicatorProps {
  variant?: 'minimal' | 'compact' | 'full';
}

export function StreakIndicator({ variant = 'compact' }: StreakIndicatorProps) {
  const { streak, isLoading } = useConvexStats();

  const currentStreak = streak.currentStreak;
  const bestStreak = streak.bestStreak;

  if (isLoading) return null;

  // Minimal: just fire + number
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-1.5 text-orange-400">
        <Flame className="h-4 w-4" />
        <span className="font-bold text-sm">{currentStreak}</span>
      </div>
    );
  }

  // Compact: horizontal pill with current + best
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 px-4 py-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-400" />
          <span className="font-bold text-white text-base">{currentStreak}</span>
          <span className="text-white/50 text-sm">day{currentStreak !== 1 ? 's' : ''}</span>
        </div>
        <div className="w-px h-5 bg-white/20" />
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="font-medium text-white/80 text-sm">{bestStreak}</span>
        </div>
      </div>
    );
  }

  // Full: larger display with labels
  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1">
          <Flame className="h-5 w-5 text-orange-400" />
          <span className="font-bold text-white text-lg">{currentStreak}</span>
        </div>
        <span className="text-white/50 text-xs">streak</span>
      </div>
      <div className="w-px h-8 bg-white/20" />
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="font-bold text-white/80 text-base">{bestStreak}</span>
        </div>
        <span className="text-white/50 text-xs">best</span>
      </div>
    </div>
  );
}