'use client';

import React, { useRef } from 'react';
import { Word, Paragraph } from '@/lib/pdf-utils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ReaderViewProps {
  fullText: string;
  paragraphs: Paragraph[];
  onWordClick: (startIndex: number) => void;
  currentIndex: number;
  isPlaying: boolean;
}

export function ReaderView({ fullText, paragraphs, onWordClick, currentIndex, isPlaying }: ReaderViewProps) {
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // Simple scroll to active word using window scroll since we are using universal layout scroll
  React.useEffect(() => {
    if (activeWordRef.current) {
      const word = activeWordRef.current;
      const wordRect = word.getBoundingClientRect();
      
      const isVisible = (
        wordRect.top >= 150 &&
        wordRect.bottom <= window.innerHeight - 250
      );

      if (!isVisible) {
        word.scrollIntoView({
          behavior: 'auto',
          block: 'center',
        });
      }
    }
  }, [currentIndex]);

  const isRTL = /[\u0600-\u06FF]/.test(fullText);

  return (
    <div 
      dir={isRTL ? "rtl" : "ltr"}
      className={cn(
        "w-full p-6 md:p-12 leading-relaxed text-lg md:text-xl bg-background rounded-3xl shadow-sm border border-border transition-all duration-300 font-reader",
        isRTL ? "text-2xl md:text-3xl leading-[2]" : ""
      )}
    >
      <div className={cn(
        "max-w-3xl mx-auto space-y-6 md:space-y-8 text-foreground pb-32",
        isRTL ? "text-right" : "text-left"
      )}>
        {paragraphs.map((p, pIdx) => {
          const isParagraphActive = currentIndex >= p.startIndex && currentIndex < p.endIndex;
          
          return (
            <p 
              key={`p-${pIdx}`} 
              className={cn(
                "mb-6 transition-colors duration-500",
                isParagraphActive ? "opacity-100" : "opacity-80 hover:opacity-100"
              )}
              onClick={() => {
                if (!isParagraphActive) onWordClick(p.startIndex);
              }}
            >
              {isParagraphActive ? (
                p.words.map((word, wIdx) => {
                  const isCurrent = currentIndex >= word.startIndex && currentIndex < word.endIndex;
                  const shouldHighlight = isCurrent && !isPlaying;

                  return (
                    <span
                      key={`${word.startIndex}-${wIdx}`}
                      ref={isCurrent ? activeWordRef : null}
                      onClick={(e) => {
                        e.stopPropagation();
                        onWordClick(word.startIndex);
                      }}
                      className={cn(
                        "px-0.5 rounded-sm cursor-pointer transition-all duration-200 inline-block",
                        shouldHighlight 
                          ? "bg-accent text-white shadow-sm scale-110 font-bold" 
                          : "hover:bg-accent/10 hover:text-accent"
                      )}
                    >
                      {word.text}
                      {wIdx < p.words.length - 1 && " "}
                    </span>
                  );
                })
              ) : (
                <span className="cursor-pointer">{p.text}</span>
              )}
            </p>
          );
        })}
      </div>
    </div>
  );
}
