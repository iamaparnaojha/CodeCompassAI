'use client';

import React from 'react';
import { Loader2, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export function LoadingState({
  message = 'Analyzing repository...',
  subMessage = 'This may take a moment',
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-hacker-border animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-hacker-primary animate-spin" />
        </div>
      </div>
      <div className="mt-6 text-center">
        <p className="text-lg font-medium text-hacker-text">{message}</p>
        <p className="mt-1 text-sm text-hacker-text-muted">{subMessage}</p>
      </div>
      
      {/* Terminal-style loading animation */}
      <div className="mt-8 w-full max-w-md">
        <div className="bg-hacker-bg-secondary border border-hacker-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-hacker-primary" />
            <span className="text-xs text-hacker-text-muted terminal-text">
              openroad-agent
            </span>
          </div>
          <div className="space-y-2 terminal-text text-sm">
            <LoadingLine text="Fetching repository data" delay={0} />
            <LoadingLine text="Parsing file structure" delay={200} />
            <LoadingLine text="Analyzing with Gemini AI" delay={400} />
            <LoadingLine text="Generating contribution roadmap" delay={600} active />
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoadingLineProps {
  text: string;
  delay?: number;
  active?: boolean;
}

function LoadingLine({ text, delay = 0, active = false }: LoadingLineProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-hacker-primary">{'>'}</span>
      <span className={cn('text-hacker-text-muted', active && 'text-hacker-text')}>
        {text}
      </span>
      {active && (
        <span className="animate-terminal-cursor text-hacker-primary">_</span>
      )}
      {!active && <span className="text-hacker-success">✓</span>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Analysis Failed',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-full bg-hacker-error/10 flex items-center justify-center">
        <span className="text-4xl">⚠️</span>
      </div>
      <div className="mt-6 text-center">
        <p className="text-lg font-medium text-hacker-error">{title}</p>
        <p className="mt-2 text-sm text-hacker-text-muted max-w-md">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            'mt-6 px-6 py-2 rounded-md font-medium text-sm transition-all',
            'bg-hacker-bg-secondary border border-hacker-border',
            'hover:border-hacker-primary hover:text-hacker-primary'
          )}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-hacker-bg-secondary border border-hacker-border flex items-center justify-center">
        <Terminal className="w-12 h-12 text-hacker-text-dim" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-hacker-text">
        Ready to Explore
      </h3>
      <p className="mt-2 text-hacker-text-muted max-w-md">
        Enter a GitHub repository URL above to generate a personalized
        contribution roadmap with AI-powered insights.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        {['React', 'TypeScript', 'Node.js', 'Python', 'Go'].map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 text-sm rounded-full bg-hacker-bg-tertiary text-hacker-text-dim border border-hacker-border"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
