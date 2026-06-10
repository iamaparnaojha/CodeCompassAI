'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateMentorVoice } from '@/lib/api';

interface MentorInsightsProps {
  architectureSummary: string;
  dataFlow: string;
  repoName: string;
}

export function MentorInsights({
  architectureSummary,
  dataFlow,
  repoName,
}: MentorInsightsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerateVoice = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateMentorVoice(architectureSummary, repoName);

      if (response.success && response.data?.audioBase64) {
        setAudioData(response.data.audioBase64);
      } else {
        setError(response.error || 'Failed to generate voice');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!audioData) {
      await handleGenerateVoice();
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    if (audioData && audioRef.current) {
      audioRef.current.src = `data:audio/mpeg;base64,${audioData}`;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioData]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, []);

  return (
    <div className="bg-hacker-bg-secondary border border-hacker-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-hacker-border bg-hacker-bg-tertiary">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-hacker-warning" />
          <h2 className="font-semibold text-hacker-text">Mentor Insights</h2>
        </div>
        <p className="mt-1 text-sm text-hacker-text-muted terminal-text">
          AI-powered analysis & voice guidance
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Audio Player */}
        <div
          className={cn(
            'p-4 rounded-lg border',
            'bg-gradient-to-br from-hacker-bg-tertiary to-hacker-bg-secondary',
            'border-hacker-border'
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-hacker-text-muted">
              🎙️ Senior Developer Voice
            </span>
            {audioData && (
              <button
                onClick={handleGenerateVoice}
                disabled={isLoading}
                className="p-1 text-hacker-text-dim hover:text-hacker-text transition-colors"
                title="Regenerate voice"
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPause}
              disabled={isLoading}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                'bg-hacker-primary text-hacker-bg hover:bg-hacker-primary-dim',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'shadow-glow hover:shadow-glow-strong'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            <div className="flex-1">
              <p className="text-sm text-hacker-text">
                {isLoading
                  ? 'Generating voice...'
                  : audioData
                  ? 'Listen to mentor introduction'
                  : 'Click play to hear your mentor'}
              </p>
              {error && (
                <p className="text-xs text-hacker-error mt-1">{error}</p>
              )}
            </div>

            <button
              onClick={handleMuteToggle}
              disabled={!audioData}
              className={cn(
                'p-2 rounded-md transition-colors',
                'hover:bg-hacker-bg-tertiary disabled:opacity-50'
              )}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-hacker-text-muted" />
              ) : (
                <Volume2 className="w-5 h-5 text-hacker-text-muted" />
              )}
            </button>
          </div>

          <audio ref={audioRef} className="hidden" />
        </div>

        {/* Architecture Summary */}
        <section>
          <h3 className="text-sm font-medium text-hacker-text-muted uppercase tracking-wide mb-2">
            Architecture Summary
          </h3>
          <div className="p-3 rounded-lg bg-hacker-bg-tertiary border border-hacker-border">
            <p className="text-sm text-hacker-text leading-relaxed">
              {architectureSummary}
            </p>
          </div>
        </section>

        {/* Data Flow */}
        <section>
          <h3 className="text-sm font-medium text-hacker-text-muted uppercase tracking-wide mb-2">
            Data Flow
          </h3>
          <div className="p-3 rounded-lg bg-hacker-bg-tertiary border border-hacker-border">
            <p className="text-sm text-hacker-text leading-relaxed terminal-text">
              {dataFlow}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
