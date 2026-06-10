'use client';

import { useState, useCallback } from 'react';
import { analyzeRepository } from '@/lib/api';
import type { Roadmap } from '@/types';

interface UseAnalyzeReturn {
  roadmap: Roadmap | null;
  isLoading: boolean;
  error: string | null;
  analyze: (url: string, forceRefresh?: boolean) => Promise<void>;
  reset: () => void;
}

export function useAnalyze(): UseAnalyzeReturn {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (url: string, forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await analyzeRepository(url, forceRefresh);

      if (response.success && response.data) {
        setRoadmap(response.data);
      } else {
        setError(response.error || 'Failed to analyze repository');
        setRoadmap(null);
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setRoadmap(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setRoadmap(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    roadmap,
    isLoading,
    error,
    analyze,
    reset,
  };
}
