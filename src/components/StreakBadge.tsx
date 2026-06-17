'use client';

import { Flame, Trophy } from 'lucide-react';
import { StreakData } from '@/lib/pdf-utils';

interface StreakBadgeProps {
  streak: StreakData;
  className?: string;
}

export function StreakBadge({ streak, className = "" }: StreakBadgeProps) {
  if (streak.currentStreak === 0) return null;

  return (
    <div className={`flex items-center gap-3 bg-secondary border border-border px-4 py-2 rounded-2xl shadow-sm ${className}`}>
      <div className="flex items-center gap-1.5">
        <div className="bg-accent/10 p-1.5 rounded-lg">
          <Flame className="w-4 h-4 text-accent fill-accent" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground leading-none">
            {streak.currentStreak} Day Streak
          </span>
        </div>
      </div>
      
      {streak.bestStreak > streak.currentStreak && (
        <div className="h-4 w-px bg-border mx-1" />
      )}

      {streak.bestStreak > streak.currentStreak && (
        <div className="flex items-center gap-1.5 text-foreground/50">
          <Trophy className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{streak.bestStreak}</span>
        </div>
      )}
    </div>
  );
}
