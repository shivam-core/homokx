import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        black: '#000000',
        card: '#0a0a0a',
        'card-border': '#1f1f1f',
        'border-ghost': '#2a2a2a',
        'border-badge': '#222222',
        muted: '#8a8a8a',
        dim: '#5c5c5c',
        status: {
          ok: '#4ade80',
          fail: '#f87171',
          warning: '#fbbf24',
        },
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
      },
    },
  },
  plugins: [],
} satisfies Config;
