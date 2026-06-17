'use client';

import React from 'react';
import { Play, Pause, Square, Volume2, User, UserRound } from 'lucide-react';

interface AudioControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  rate: number;
  onRateChange: (rate: number) => void;
  pitch: number;
  onPitchChange: (pitch: number) => void;
  voiceGender: 'male' | 'female';
  onVoiceGenderChange: (gender: 'male' | 'female') => void;
}

export function AudioControls({
  isPlaying,
  isPaused,
  onPlay,
  onPause,
  onResume,
  onStop,
  rate,
  onRateChange,
  pitch,
  onPitchChange,
  voiceGender,
  onVoiceGenderChange,
}: AudioControlsProps) {
  return (
    <div className="flex flex-col items-center gap-3 md:gap-4 p-4 md:p-6 bg-secondary/95 backdrop-blur-md border-t border-border">
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
        <button
          onClick={onStop}
          className="p-2 md:p-3 rounded-full hover:bg-background transition-colors"
          title="Stop"
        >
          <Square className="w-5 h-5 md:w-6 md:h-6 fill-foreground/70 text-foreground/70" />
        </button>

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

          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs font-bold text-foreground/70 uppercase tracking-wider">Pitch</span>
            <select
              value={pitch}
              onChange={(e) => onPitchChange(Number(e.target.value))}
              className="bg-background border-none rounded-lg px-2 py-1 text-xs md:text-sm font-medium focus:ring-2 focus:ring-accent outline-none"
            >
              <option value={0.5}>Low</option>
              <option value={1}>Normal</option>
              <option value={1.5}>High</option>
              <option value={2}>V. High</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-background p-1 rounded-xl">
            <button
              onClick={() => onVoiceGenderChange('female')}
              className={`flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${
                voiceGender === 'female'
                  ? 'bg-secondary shadow-sm text-foreground'
                  : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              <UserRound className="w-3 md:w-3.5 h-3 md:h-3.5" />
              <span className="hidden xs:inline">Female</span>
            </button>
            <button
              onClick={() => onVoiceGenderChange('male')}
              className={`flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${
                voiceGender === 'male'
                  ? 'bg-secondary shadow-sm text-foreground'
                  : 'text-foreground/70 hover:text-foreground'
              }`}
            >
              <User className="w-3 md:w-3.5 h-3 md:h-3.5" />
              <span className="hidden xs:inline">Male</span>
            </button>
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
