'use client';

import React, { useState } from 'react';
import { Github, Zap, ExternalLink } from 'lucide-react';
import {
  SearchBar,
  RoadmapPanel,
  CodeMap,
  MentorInsights,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components';
import { analyzeRepository } from '@/lib/api';
import type { Roadmap } from '@/types';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchedUrl, setLastSearchedUrl] = useState<string>('');

  const handleSearch = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setLastSearchedUrl(url);

    try {
      const response = await analyzeRepository(url);

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
  };

  const handleRetry = () => {
    if (lastSearchedUrl) {
      handleSearch(lastSearchedUrl);
    }
  };

  const highlightedFiles = roadmap?.analysis.entryPoints.map((ep) => ep.file) || [];

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="border-b border-hacker-border bg-hacker-bg-secondary/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-hacker-primary/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-hacker-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-hacker-text flex items-center gap-2">
                  OpenRoad Agent
                  <span className="text-xs px-2 py-0.5 rounded-full bg-hacker-primary/20 text-hacker-primary">
                    v1.0
                  </span>
                </h1>
                <p className="text-xs text-hacker-text-muted">
                  Hacker Onboarding Platform
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                  'text-hacker-text-muted hover:text-hacker-text hover:bg-hacker-bg-tertiary',
                  'transition-colors'
                )}
              >
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-hacker-text mb-4">
            Start Your Open Source Journey
          </h2>
          <p className="text-hacker-text-muted max-w-2xl mx-auto mb-8">
            Enter any GitHub repository URL and get a personalized contribution roadmap
            powered by AI analysis, health metrics, and voice-guided mentorship.
          </p>
          
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4">
        <div className="container mx-auto">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={handleRetry} />
          ) : roadmap ? (
            <div className="fade-in">
              {/* Repo Info Bar */}
              <div className="mb-6 p-4 bg-hacker-bg-secondary border border-hacker-border rounded-lg">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Github className="w-6 h-6 text-hacker-text-muted" />
                    <div>
                      <h3 className="font-semibold text-hacker-text">
                        {roadmap.owner}/{roadmap.repoName}
                      </h3>
                      <p className="text-sm text-hacker-text-muted">
                        Analyzed {new Date(roadmap.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={roadmap.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm',
                      'bg-hacker-bg-tertiary border border-hacker-border',
                      'hover:border-hacker-primary transition-colors'
                    )}
                  >
                    <span>View Repository</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Three Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Roadmap */}
                <div className="lg:col-span-1 fade-in stagger-1 opacity-0">
                  <RoadmapPanel
                    analysis={roadmap.analysis}
                    healthMetrics={roadmap.healthMetrics}
                    repoName={roadmap.repoName}
                  />
                </div>

                {/* Middle: Code Map */}
                <div className="lg:col-span-1 fade-in stagger-2 opacity-0">
                  <div className="h-[600px]">
                    <CodeMap
                      fileTree={roadmap.fileTree}
                      highlightedFiles={highlightedFiles}
                    />
                  </div>
                </div>

                {/* Right: Mentor Insights */}
                <div className="lg:col-span-1 fade-in stagger-3 opacity-0">
                  <MentorInsights
                    architectureSummary={roadmap.analysis.architectureSummary}
                    dataFlow={roadmap.analysis.dataFlow}
                    repoName={roadmap.repoName}
                  />
                </div>
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 py-6 border-t border-hacker-border">
        <div className="container mx-auto px-4 text-center text-sm text-hacker-text-dim">
          <p className="terminal-text">
            {'// '}Built with Next.js, Hono.js, Gemini AI, and ElevenLabs
          </p>
        </div>
      </footer>
    </div>
  );
}
