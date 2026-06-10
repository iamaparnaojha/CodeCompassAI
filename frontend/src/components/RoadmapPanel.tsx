'use client';

import React from 'react';
import { Code2, GitFork, Target, Zap } from 'lucide-react';
import { cn, getDifficultyColor } from '@/lib/utils';
import type { GeminiAnalysis, HealthMetrics } from '@/types';

interface RoadmapPanelProps {
  analysis: GeminiAnalysis;
  healthMetrics: HealthMetrics[];
  repoName: string;
}

export function RoadmapPanel({ analysis, healthMetrics, repoName }: RoadmapPanelProps) {
  const getHealthForFile = (file: string) => {
    return healthMetrics.find((m) => m.file === file);
  };

  return (
    <div className="bg-hacker-bg-secondary border border-hacker-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-hacker-border bg-hacker-bg-tertiary">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-hacker-primary" />
          <h2 className="font-semibold text-hacker-text">Contribution Roadmap</h2>
        </div>
        <p className="mt-1 text-sm text-hacker-text-muted terminal-text">
          {repoName}
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Tech Stack */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-hacker-secondary" />
            <h3 className="text-sm font-medium text-hacker-text-muted uppercase tracking-wide">
              Tech Stack
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.techStack.map((tech, index) => (
              <span
                key={index}
                className={cn(
                  'px-3 py-1 text-sm rounded-full terminal-text',
                  'bg-hacker-primary/10 text-hacker-primary border border-hacker-primary/30'
                )}
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Entry Points */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <GitFork className="w-4 h-4 text-hacker-secondary" />
            <h3 className="text-sm font-medium text-hacker-text-muted uppercase tracking-wide">
              Entry Points for New Contributors
            </h3>
          </div>
          <div className="space-y-3">
            {analysis.entryPoints.map((entry, index) => {
              const health = getHealthForFile(entry.file);
              return (
                <div
                  key={index}
                  className={cn(
                    'p-4 rounded-lg border transition-all duration-200',
                    'bg-hacker-bg-tertiary border-hacker-border',
                    'hover:border-hacker-primary/50 card-hover'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="terminal-text text-hacker-secondary text-sm truncate">
                          {entry.file}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs rounded-full',
                            getDifficultyColor(entry.difficulty),
                            entry.difficulty === 'beginner' && 'bg-hacker-success/10',
                            entry.difficulty === 'intermediate' && 'bg-hacker-warning/10',
                            entry.difficulty === 'advanced' && 'bg-hacker-accent/10'
                          )}
                        >
                          {entry.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-hacker-text-muted line-clamp-2">
                        {entry.description}
                      </p>
                    </div>
                    
                    {health && (
                      <div className="flex flex-col items-end gap-1 text-xs">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded',
                              health.status === 'hot' && 'text-hacker-accent bg-hacker-accent/10',
                              health.status === 'stable' && 'text-hacker-success bg-hacker-success/10',
                              health.status === 'moderate' && 'text-hacker-warning bg-hacker-warning/10'
                            )}
                          >
                            {health.status}
                          </span>
                        </div>
                        <span className="text-hacker-text-dim terminal-text">
                          Churn: {health.fileChurn}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
