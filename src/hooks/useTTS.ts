import { useState, useCallback, useRef, useEffect } from 'react';

interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  currentCharIndex: number;
}

export function useTTS() {
  const [state, setState] = useState<TTSState>({
    isPlaying: false,
    isPaused: false,
    currentCharIndex: -1,
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const stateRef = useRef(state);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chunksRef = useRef<{ text: string; offset: number }[]>([]);
  const currentChunkIndexRef = useRef(0);
  const optionsRef = useRef<any>({});
  const fullTextRef = useRef<string>("");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    chunksRef.current = [];
    currentChunkIndexRef.current = 0;
    setState({ isPlaying: false, isPaused: false, currentCharIndex: stateRef.current.currentCharIndex });
  }, []);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setState(prev => ({ ...prev, isPaused: true, isPlaying: false }));
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setState(prev => ({ ...prev, isPaused: false, isPlaying: true }));
  }, []);

  const playNextChunk = useCallback(() => {
    if (currentChunkIndexRef.current >= chunksRef.current.length) {
      setState({ isPlaying: false, isPaused: false, currentCharIndex: stateRef.current.currentCharIndex });
      return;
    }

    const chunk = chunksRef.current[currentChunkIndexRef.current];
    if (!chunk.text.trim()) {
      currentChunkIndexRef.current++;
      playNextChunk();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    const options = optionsRef.current;

    utterance.rate = options.rate ?? 1;
    utterance.volume = options.volume ?? 1;
    utterance.pitch = options.pitch ?? 1;
    if (options.voice) utterance.voice = options.voice;
    if (options.lang) utterance.lang = options.lang;

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        // We still track the index for progress saving, but we can debounce or just pass it up
        setState(prev => ({ ...prev, currentCharIndex: chunk.offset + event.charIndex }));
      }
    };

    utterance.onend = () => {
      if (currentChunkIndexRef.current < chunksRef.current.length) {
        currentChunkIndexRef.current++;
        playNextChunk();
      }
    };

    utterance.onerror = (event) => {
      if (event.error === 'interrupted' || event.error === 'canceled') return;
      console.error('TTS Chunk Error:', event.error, event);
      setState({ isPlaying: false, isPaused: false, currentCharIndex: stateRef.current.currentCharIndex });
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const play = useCallback((text: string, options: { rate?: number; volume?: number; pitch?: number; voice?: SpeechSynthesisVoice; lang?: string; startIndex?: number } = {}) => {
    window.speechSynthesis.cancel();
    optionsRef.current = options;
    fullTextRef.current = text;

    const startIndex = options.startIndex || 0;
    
    // Split text into larger, more manageable chunks (up to 3000 chars)
    // 1. Split by paragraphs
    const paragraphs = text.split(/\n\n+/);
    const finalChunks: { text: string; offset: number }[] = [];
    let currentOffset = 0;

    paragraphs.forEach(para => {
      if (para.length > 3000) {
        // 2. Split by sentences
        const sentences = para.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [para];
        let currentSentenceChunk = "";
        let chunkStartOffset = currentOffset;

        sentences.forEach(sentence => {
          if ((currentSentenceChunk + sentence).length > 3000) {
            if (currentSentenceChunk) {
              finalChunks.push({ text: currentSentenceChunk, offset: chunkStartOffset });
              chunkStartOffset += currentSentenceChunk.length;
            }
            currentSentenceChunk = sentence;
          } else {
            currentSentenceChunk += sentence;
          }
        });
        
        if (currentSentenceChunk) {
          finalChunks.push({ text: currentSentenceChunk, offset: chunkStartOffset });
        }
      } else {
        finalChunks.push({ text: para, offset: currentOffset });
      }
      currentOffset += para.length + 2; // +2 for the \n\n
    });

    chunksRef.current = finalChunks.filter(c => c.text.trim().length > 0);
    
    // Find the chunk that contains the startIndex
    let startChunkIndex = 0;
    for (let i = 0; i < chunksRef.current.length; i++) {
      const chunk = chunksRef.current[i];
      const nextChunk = chunksRef.current[i+1];
      if (startIndex >= chunk.offset && (!nextChunk || startIndex < nextChunk.offset)) {
        startChunkIndex = i;
        // Adjust the first chunk text to start from the exact word
        const relativeOffset = startIndex - chunk.offset;
        if (relativeOffset > 0) {
          chunksRef.current[i] = {
            text: chunk.text.substring(relativeOffset),
            offset: startIndex
          };
        }
        break;
      }
    }

    currentChunkIndexRef.current = startChunkIndex;
    setState({ isPlaying: true, isPaused: false, currentCharIndex: startIndex });
    
    // Tiny delay to ensure previous cancel() has propagated
    setTimeout(() => {
      playNextChunk();
    }, 50);
  }, [playNextChunk]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    ...state,
    voices,
    play,
    pause,
    resume,
    stop,
  };
}
