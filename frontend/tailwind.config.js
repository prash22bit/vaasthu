/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand
        brand: {
          50: '#f0f4ff',
          100: '#dde6ff',
          200: '#c2d1ff',
          300: '#9ab4ff',
          400: '#718cff',
          500: '#4d64ff',
          600: '#3444f5',
          700: '#2932e0',
          800: '#252ab5',
          900: '#222a8f',
          950: '#161856',
        },
        // Canvas background
        canvas: {
          bg: '#0f1117',
          grid: '#1e2130',
          'grid-major': '#252840',
        },
        // Panel backgrounds
        panel: {
          bg: '#141820',
          border: '#1f2438',
          'bg-hover': '#1a2030',
          header: '#0d1018',
        },
        // Surface
        surface: {
          DEFAULT: '#1a2030',
          raised: '#202538',
          overlay: '#252b40',
        },
        // Text
        text: {
          primary: '#e8eaf2',
          secondary: '#8b93b0',
          muted: '#5a6280',
          accent: '#718cff',
        },
        // Semantic
        success: { DEFAULT: '#22c55e', light: '#16a34a' },
        warning: { DEFAULT: '#f59e0b', light: '#d97706' },
        error: { DEFAULT: '#ef4444', light: '#dc2626' },
        // Vastu zone colors (for future phases)
        vastu: {
          good: '#22c55e',
          neutral: '#94a3b8',
          warning: '#f59e0b',
          bad: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'slide-in-left': 'slideInLeft 0.2s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spin: 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4)',
        modal: '0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.6)',
        glow: '0 0 12px rgba(77,100,255,0.3)',
      },
    },
  },
  plugins: [],
};
