'use client';

import React, { useState, FormEvent } from 'react';
import { Search, Loader2, Github } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (url: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  isLoading = false,
  placeholder = 'Enter GitHub repository URL...',
}: SearchBarProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (input: string): boolean => {
    if (!input.trim()) {
      setError('Please enter a GitHub URL');
      return false;
    }

    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    if (!githubPattern.test(input.trim())) {
      setError('Please enter a valid GitHub repository URL');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateUrl(url) && !isLoading) {
      onSearch(url.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            'relative flex items-center bg-hacker-bg-secondary border rounded-lg overflow-hidden transition-all duration-300',
            error ? 'border-hacker-error' : 'border-hacker-border',
            !error && 'focus-within:border-hacker-primary focus-within:shadow-glow'
          )}
        >
          <div className="pl-4 pr-2">
            <Github className="w-5 h-5 text-hacker-text-muted" />
          </div>
          
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn(
              'flex-1 py-4 px-2 bg-transparent text-hacker-text placeholder-hacker-text-dim',
              'focus:outline-none terminal-text text-sm',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
          
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className={cn(
              'mr-2 px-6 py-2 rounded-md font-medium text-sm transition-all duration-300',
              'bg-hacker-primary text-hacker-bg hover:bg-hacker-primary-dim',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'btn-glow'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span>Analyze</span>
              </div>
            )}
          </button>
        </div>
        
        {error && (
          <p className="mt-2 text-sm text-hacker-error terminal-text">
            {`> Error: ${error}`}
          </p>
        )}
      </form>
      
      <div className="mt-4 text-center text-hacker-text-dim text-sm">
        <span className="terminal-text">
          Example: https://github.com/vercel/next.js
        </span>
      </div>
    </div>
  );
}
