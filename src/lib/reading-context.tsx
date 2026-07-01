'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Word, PDFMetadata, Paragraph } from './pdf-utils';

interface ReadingState {
  file: File | null;
  paragraphs: Paragraph[];
  fullText: string;
  metadata: PDFMetadata | null;
  currentIndex: number;
  viewMode: 'reader' | 'pdf';
  rate: number;
  pitch: number;
  voiceGender: 'male' | 'female';
}

interface ReadingContextType extends ReadingState {
  setFile: (file: File | null) => void;
  setParagraphs: (paragraphs: Paragraph[]) => void;
  setFullText: (text: string) => void;
  setMetadata: (metadata: PDFMetadata | null) => void;
  setCurrentIndex: (index: number) => void;
  setViewMode: (mode: 'reader' | 'pdf') => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVoiceGender: (gender: 'male' | 'female') => void;
  resetReading: () => void;
  notification: string | null;
  setNotification: (message: string | null) => void;
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

const PROGRESS_KEY_PREFIX = 'audiobook_progress_';

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [fullText, setFullText] = useState('');
  const [metadata, setMetadata] = useState<PDFMetadata | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [viewMode, setViewMode] = useState<'reader' | 'pdf'>('reader');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  const [notification, setNotification] = useState<string | null>(null);

  // Load progress when metadata changes
  useEffect(() => {
    if (metadata?.title) {
      const savedProgress = localStorage.getItem(PROGRESS_KEY_PREFIX + metadata.title);
      if (savedProgress) {
        setCurrentIndex(parseInt(savedProgress, 10));
      } else {
        setCurrentIndex(-1);
      }
    }
  }, [metadata, setCurrentIndex]);

  // Save progress with debouncing
  useEffect(() => {
    if (!metadata?.title || currentIndex < 0) return;

    const timeoutId = setTimeout(() => {
      localStorage.setItem(PROGRESS_KEY_PREFIX + metadata.title, currentIndex.toString());
    }, 2000); // Only save every 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [currentIndex, metadata]);

  const resetReading = useCallback(() => {
    setFile(null);
    setParagraphs([]);
    setFullText('');
    setMetadata(null);
    setCurrentIndex(-1);
  }, []);

  const value = {
    file,
    paragraphs,
    fullText,
    metadata,
    currentIndex,
    viewMode,
    rate,
    pitch,
    voiceGender,
    setFile,
    setParagraphs,
    setFullText,
    setMetadata,
    setCurrentIndex,
    setViewMode,
    setRate,
    setPitch,
    setVoiceGender,
    resetReading,
    notification,
    setNotification,
  };

  return (
    <ReadingContext.Provider value={value}>
      {children}
    </ReadingContext.Provider>
  );
}

export function useReading() {
  const context = useContext(ReadingContext);
  if (context === undefined) {
    throw new Error('useReading must be used within a ReadingProvider');
  }
  return context;
}
