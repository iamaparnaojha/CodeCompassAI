'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { generateMentorVoice } from '@/lib/api';

interface UseVoiceReturn {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  generateAndPlay: (summary: string, repoName: string) => Promise<void>;
  togglePlayPause: () => void;
  stop: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioDataRef = useRef<string | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio();
    
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setError('Failed to play audio');
      setIsPlaying(false);
    };

    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('error', handleError);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.pause();
      }
    };
  }, []);

  const generateAndPlay = useCallback(async (summary: string, repoName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateMentorVoice(summary, repoName);

      if (response.success && response.data?.audioBase64) {
        audioDataRef.current = response.data.audioBase64;
        
        if (audioRef.current) {
          audioRef.current.src = `data:audio/mpeg;base64,${response.data.audioBase64}`;
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } else {
        setError(response.error || 'Failed to generate voice');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !audioDataRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  return {
    isPlaying,
    isLoading,
    error,
    generateAndPlay,
    togglePlayPause,
    stop,
  };
}
