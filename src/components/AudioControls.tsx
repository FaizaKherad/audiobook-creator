'use client';

import React from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  rate: number;
  onRateChange: (rate: number) => void;
}

export function AudioControls({
  isPlaying,
  isPaused,
  onPlay,
  onPause,
  onResume,
  rate,
  onRateChange,
}: AudioControlsProps) {
  return (
    <div className="flex flex-col items-center gap-3 md:gap-4 p-4 md:p-6 bg-secondary/95 backdrop-blur-md border-t border-border">
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
        {isPlaying && !isPaused ? (
          <button
            onClick={onPause}
            className="p-4 md:p-5 rounded-full bg-accent text-white hover:opacity-90 transition-all scale-105 md:scale-110 shadow-lg"
            title="Pause"
          >
            <Pause className="w-6 h-6 md:w-8 md:h-8 fill-current" />
          </button>
        ) : (
          <button
            onClick={isPaused ? onResume : onPlay}
            className="p-4 md:p-5 rounded-full bg-accent text-white hover:opacity-90 transition-all scale-105 md:scale-110 shadow-lg"
            title="Play"
          >
            <Play className="w-6 h-6 md:w-8 md:h-8 fill-current" />
          </button>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs font-bold text-foreground/70 uppercase tracking-wider">Speed</span>
            <select
              value={rate}
              onChange={(e) => onRateChange(Number(e.target.value))}
              className="bg-background border-none rounded-lg px-2 py-1 text-xs md:text-sm font-medium focus:ring-2 focus:ring-accent outline-none"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2.0x</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="hidden md:flex items-center gap-2 text-foreground/50 italic text-[10px]">
        <Volume2 className="w-3.5 h-3.5" />
        <span>Web Speech API Active</span>
      </div>
    </div>
  );
}
