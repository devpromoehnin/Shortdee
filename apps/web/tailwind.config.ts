import type { Config } from 'tailwindcss'

/** ClipDee brand theme — see CLAUDE.md §Brand Guidelines. */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#FF4D6D', foreground: '#FFFFFF' },
        secondary: { DEFAULT: '#1F3A5F', foreground: '#FFFFFF' },
        accent: { DEFAULT: '#FFB800', foreground: '#1F3A5F' },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        bg: '#F8F9FA',
        ink: '#2D3748',
      },
      fontFamily: {
        sans: ['var(--font-sarabun)', 'var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
