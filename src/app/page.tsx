'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useRef } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ReadingHistory } from '@/components/ReadingHistory';
import { StreakBadge } from '@/components/StreakBadge';
import { AudioControls } from '@/components/AudioControls';
import { Notification } from '@/components/Notification';
import { extractTextFromPDF, Word, PDFMetadata, HistoryItem, StreakData } from '@/lib/pdf-utils';
import { useTTS } from '@/hooks/useTTS';
import { useReading } from '@/lib/reading-context';
import { Book, ChevronLeft, Layout, Type, LogOut, ArrowRight } from 'lucide-react';

const ReaderView = dynamic(() => import('@/components/ReaderView').then(mod => mod.ReaderView), { ssr: false });
const PDFViewer = dynamic(() => import('@/components/PDFViewer').then(mod => mod.PDFViewer), { ssr: false });

const HISTORY_KEY = 'audiobook_reading_history';
const STREAK_KEY = 'audiobook_reading_streak';

export default function Home() {
  const {
    file, setFile,
    paragraphs, setParagraphs,
    fullText, setFullText,
    metadata, setMetadata,
    currentIndex, setCurrentIndex,
    rate, setRate,
    pitch, setPitch,
    voiceGender, setVoiceGender,
    resetReading,
    notification, setNotification
  } = useReading();

  const [isLoading, setIsLoading] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, lastReadDate: '', bestStreak: 0 });
  const hasAutoPlayed = useRef(false);

  const { isPlaying, isPaused, currentCharIndex, voices, play, pause, resume, stop } = useTTS();

  // Sync TTS progress to context
  useEffect(() => {
    if (currentCharIndex >= 0) {
      setCurrentIndex(currentCharIndex);
    }
  }, [currentCharIndex, setCurrentIndex]);

  const getVoiceForGender = useCallback((gender: 'male' | 'female', isUrdu: boolean = false) => {
    const maleHints = isUrdu ? ['urdu', 'pakistan'] : ['male', 'guy', 'david', 'mark', 'james', 'thomas', 'microsoft david', 'google uk english male'];
    const femaleHints = isUrdu ? ['urdu', 'pakistan'] : ['female', 'samantha', 'victoria', 'zira', 'amy', 'heather', 'microsoft zira', 'google uk english female'];
    const qualityHints = ['natural', 'google', 'premium', 'neural'];
    
    const hints = gender === 'male' ? maleHints : femaleHints;
    
    // 1. Try to find a high-quality voice for the requested gender/language
    const qualityGenderVoice = voices.find(v => 
      hints.some(hint => v.name.toLowerCase().includes(hint)) &&
      (isUrdu ? v.lang.startsWith('ur') : true) &&
      qualityHints.some(q => v.name.toLowerCase().includes(q))
    );
    if (qualityGenderVoice) return qualityGenderVoice;

    // 2. Try to find any voice for the requested gender/language
    const genderVoice = voices.find(v => 
      hints.some(hint => v.name.toLowerCase().includes(hint)) &&
      (isUrdu ? v.lang.startsWith('ur') : true)
    );
    if (genderVoice) return genderVoice;

    // 3. Try any voice of that language
    if (isUrdu) {
      const urduVoice = voices.find(v => v.lang.startsWith('ur'));
      if (urduVoice) return urduVoice;
    }

    // 4. Try to find any high-quality voice
    const qualityVoice = voices.find(v => qualityHints.some(q => v.name.toLowerCase().includes(q)));
    if (qualityVoice) return qualityVoice;

    return voices[0] || null;
  }, [voices]);

  // Load history and streak from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }

    const savedStreak = localStorage.getItem(STREAK_KEY);
    if (savedStreak) {
      try {
        const parsedStreak = JSON.parse(savedStreak);
        // Check if streak is broken
        const lastDate = new Date(parsedStreak.lastReadDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        lastDate.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
          // Streak broken
          const resetStreak = { ...parsedStreak, currentStreak: 0 };
          setStreak(resetStreak);
          localStorage.setItem(STREAK_KEY, JSON.stringify(resetStreak));
        } else {
          setStreak(parsedStreak);
        }
      } catch (e) {
        console.error('Failed to parse streak', e);
      }
    }
  }, []);

  const updateStreak = useCallback(() => {
    setStreak(prev => {
      const today = new Date().toISOString().split('T')[0];
      if (prev.lastReadDate === today) return prev; // Already updated today

      const lastDate = prev.lastReadDate ? new Date(prev.lastReadDate) : null;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreakCount = 1;
      if (prev.lastReadDate === yesterdayStr) {
        newStreakCount = prev.currentStreak + 1;
      }

      const newStreakData: StreakData = {
        currentStreak: newStreakCount,
        lastReadDate: today,
        bestStreak: Math.max(newStreakCount, prev.bestStreak),
      };

      localStorage.setItem(STREAK_KEY, JSON.stringify(newStreakData));
      return newStreakData;
    });
  }, []);

  const saveToHistory = useCallback((newMetadata: PDFMetadata) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item.metadata.title !== newMetadata.title);
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(7),
        metadata: newMetadata,
        lastRead: Date.now(),
      };
      const updated = [newItem, ...filtered].slice(0, 20); // Keep more history
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
    updateStreak();
  }, [updateStreak]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setIsLoading(true);
    setExtractionProgress(0);
    setCurrentIndex(-1); // Reset index to avoid carry-over from previous book
    hasAutoPlayed.current = false;
    try {
      const result = await extractTextFromPDF(selectedFile, { skipFirstPage: false }, (progress) => {
        setExtractionProgress(progress);
      });

      if (!result.text || result.text.trim().length < 10) {
        alert('Could not extract enough text from this PDF. It might be a scanned image or an empty document.');
        setIsLoading(false);
        setExtractionProgress(0);
        return;
      }

      // Simple heuristic for English detection
      const textSample = result.text.substring(0, 3000).toLowerCase();
      const commonEnglishWords = [' the ', ' and ', ' that ', ' have ', ' for ', ' with ', ' was ', ' this ', ' of ', ' to '];
      const englishWordCount = commonEnglishWords.filter(word => textSample.includes(word)).length;
      
      // Check for non-Latin scripts (Arabic/Urdu, Hindi, Cyrillic, Chinese, Japanese, Korean)
      const hasNonLatinScript = /[\u0600-\u06FF\u0900-\u097F\u0400-\u04FF\u4E00-\u9FFF\u3040-\u309F\uAC00-\uD7AF]/.test(result.text.substring(0, 1000));

      // Be a bit more lenient but still warn
      if (hasNonLatinScript || englishWordCount < 2) {
        const proceed = confirm('This PDF doesn\'t seem to be in English. The text-to-speech might not work correctly. Do you want to try anyway?');
        if (!proceed) {
          setIsLoading(false);
          setExtractionProgress(0);
          return;
        }
      }

      setFile(selectedFile);
      setParagraphs(result.paragraphs);
      setFullText(result.text);
      setMetadata(result.metadata);
      saveToHistory(result.metadata);
      
      // Auto-play will be handled by useEffect when fullText and currentIndex are ready
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Failed to process PDF. Technical error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
      setExtractionProgress(0);
    }
  }, [saveToHistory, setFile, setParagraphs, setFullText, setMetadata]);

  const handlePlay = useCallback((startIndex?: number) => {
    const startFrom = startIndex !== undefined ? startIndex : (currentIndex > 0 ? currentIndex : 0);
    if (fullText) {
      const isUrdu = /[\u0600-\u06FF]/.test(fullText);
      const voice = getVoiceForGender(voiceGender, isUrdu);
      play(fullText, { 
        rate, 
        pitch, 
        voice: voice ?? undefined,
        lang: isUrdu ? 'ur-PK' : 'en-US',
        startIndex: startFrom
      });
    }
  }, [fullText, play, rate, pitch, voiceGender, getVoiceForGender, currentIndex]);

  const handlePageChange = useCallback((pageNumber: number) => {
    const targetParagraph = paragraphs.find(p => p.pageNumber === pageNumber);
    if (targetParagraph) {
      setCurrentIndex(targetParagraph.startIndex);
    }
  }, [paragraphs, setCurrentIndex]);

  const jumpToPage = useCallback((pageNumber: number) => {
    const targetParagraph = paragraphs.find(p => p.pageNumber === pageNumber);
    if (targetParagraph) {
      setCurrentIndex(targetParagraph.startIndex);
      handlePlay(targetParagraph.startIndex);
    }
  }, [paragraphs, setCurrentIndex, handlePlay]);

  // Auto-play when file is loaded
  useEffect(() => {
    if (fullText && currentIndex >= 0 && !isPlaying && !isPaused && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      // Small delay to ensure voices are loaded and state is settled
      const timer = setTimeout(() => {
        handlePlay(currentIndex);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [fullText, currentIndex, handlePlay, isPlaying, isPaused]);

  const handleHistorySelect = useCallback((item: HistoryItem) => {
    console.log('Home: History item selected', item);
    setMetadata(item.metadata);
    if (metadata?.title === item.metadata.title) {
      // Already loaded
    } else {
      setFile(null);
      setParagraphs([]);
      setFullText('');
      console.log('Home: Setting notification message');
      setNotification("Upload this book in PDF Form to start listening where you left off");
    }
  }, [metadata, setFile, setParagraphs, setFullText, setMetadata, setNotification]);

  const handleRateChange = useCallback((newRate: number) => {
    setRate(newRate);
    if (isPlaying && !isPaused) {
      stop();
    }
  }, [isPlaying, isPaused, stop, setRate]);

  const handlePitchChange = useCallback((newPitch: number) => {
    setPitch(newPitch);
    if (isPlaying && !isPaused) {
      stop();
    }
  }, [isPlaying, isPaused, stop, setPitch]);

  const reset = useCallback(() => {
    stop();
    resetReading();
  }, [stop, resetReading]);

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[80vh] relative">
        <div className="w-full max-w-2xl flex flex-col items-center">
          <div className="mb-12 text-center">
            <div className="inline-block bg-accent/10 p-3 rounded-2xl mb-4">
              <Book className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight font-heading">Start Reading</h1>
            <p className="text-foreground/60">Upload your PDF to begin the narration</p>
          </div>

          <div className="w-full">
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
            
            {isLoading && extractionProgress > 0 && (
              <div className="mt-6 w-full">
                <div className="flex justify-between text-xs font-bold text-accent mb-2 px-1">
                  <span>Processing Content...</span>
                  <span>{extractionProgress}%</span>
                </div>
                <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-border">
                  <div 
                    className="h-full bg-accent transition-all duration-300 ease-out" 
                    style={{ width: `${extractionProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <Notification message={notification} onClose={() => setNotification(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={reset}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
              {metadata?.title}
            </h1>
            <p className="text-xs text-foreground/70">
              {metadata?.author} • {metadata?.pageCount} pages
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-secondary p-1 rounded-lg border border-border">
            <div className="px-2 py-1.5 border-r border-border text-xs font-bold text-foreground/60">
              Page {paragraphs.find(p => currentIndex >= p.startIndex && currentIndex < p.endIndex)?.pageNumber || 1}
            </div>
            <input 
              type="number" 
              placeholder="Page..."
              className="w-16 px-2 py-1.5 bg-background border border-border rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseInt((e.target as HTMLInputElement).value, 10);
                  if (!isNaN(val)) jumpToPage(val);
                }
              }}
            />
            <span className="text-[10px] font-bold text-foreground/50 px-1 uppercase">Jump</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative pb-44">
        {file && (
          <PDFViewer 
            file={file} 
            currentPage={paragraphs.find(p => currentIndex >= p.startIndex && currentIndex < p.endIndex)?.pageNumber || 1} 
            onPageChange={handlePageChange}
          />
        )}
      </main>

      {/* Controls */}
      <div className="fixed bottom-0 lg:left-64 left-0 right-0 z-20 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
        <AudioControls
          isPlaying={isPlaying}
          isPaused={isPaused}
          onPlay={handlePlay}
          onPause={pause}
          onResume={resume}
          rate={rate}
          onRateChange={handleRateChange}
        />
      </div>
      <Notification message={notification} onClose={() => setNotification(null)} />
    </div>
  );
}
