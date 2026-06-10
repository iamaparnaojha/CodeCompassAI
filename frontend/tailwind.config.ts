import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Hacker Dark Theme
        'hacker': {
          bg: '#0a0a0f',
          'bg-secondary': '#12121a',
          'bg-tertiary': '#1a1a24',
          border: '#2a2a3a',
          'border-bright': '#3a3a4a',
          text: '#e4e4e7',
          'text-muted': '#a1a1aa',
          'text-dim': '#71717a',
          primary: '#00ff88',
          'primary-dim': '#00cc6a',
          secondary: '#00d4ff',
          accent: '#ff6b6b',
          warning: '#ffd93d',
          success: '#00ff88',
          error: '#ff4757',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan-line 6s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'terminal-cursor': 'terminal-cursor 1s step-end infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 40px rgba(0, 255, 136, 0.5)',
          },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'terminal-cursor': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-strong': '0 0 40px rgba(0, 255, 136, 0.5)',
        'glow-blue': '0 0 20px rgba(0, 212, 255, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
