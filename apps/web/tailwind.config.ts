import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#0F4C75',
        secondary: '#1B9CFC',
        success:   '#10B981',
        danger:    '#EF4444',
        warning:   '#F59E0B',
        info:      '#3B82F6',
        income:    '#10B981',
        expense:   '#EF4444',
        background:'#F8FAFC',
        surface:   '#FFFFFF',
        border:    '#E2E8F0',
        divider:   '#F1F5F9',
        'text-primary':   '#1E293B',
        'text-secondary': '#64748B',
        'text-muted':     '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
