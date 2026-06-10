import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const iconMap: Record<string, string> = {
    ts: '📘',
    tsx: '⚛️',
    js: '📒',
    jsx: '⚛️',
    json: '📋',
    md: '📝',
    css: '🎨',
    scss: '🎨',
    html: '🌐',
    py: '🐍',
    go: '🔵',
    rs: '🦀',
    java: '☕',
    rb: '💎',
    php: '🐘',
    vue: '💚',
    svelte: '🔥',
    yaml: '⚙️',
    yml: '⚙️',
    toml: '⚙️',
    env: '🔐',
    sh: '🐚',
    bash: '🐚',
    dockerfile: '🐳',
    sql: '🗃️',
  };

  return iconMap[ext || ''] || '📄';
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'text-hacker-success';
    case 'intermediate':
      return 'text-hacker-warning';
    case 'advanced':
      return 'text-hacker-accent';
    default:
      return 'text-hacker-text-muted';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'hot':
      return 'text-hacker-accent bg-hacker-accent/10';
    case 'stable':
      return 'text-hacker-success bg-hacker-success/10';
    case 'moderate':
      return 'text-hacker-warning bg-hacker-warning/10';
    default:
      return 'text-hacker-text-muted bg-hacker-bg-tertiary';
  }
}
