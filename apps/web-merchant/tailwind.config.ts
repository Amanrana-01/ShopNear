import type { Config } from 'tailwindcss'

// Same palette as web-customer (they must read as siblings): brand purple
// #7B2FBE, lavender #F3EEFF, ink #3D1270, teal #2DD4BF.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7B2FBE',
          50: '#F3EEFF',
          100: '#EAE0FC',
          200: '#D6C2F7',
          300: '#BE9AF0',
          400: '#A56EE6',
          500: '#7B2FBE',
          600: '#6B27A3',
          700: '#571F85',
          800: '#3D1270',
          900: '#2B0C52',
        },
        ink: '#3D1270',
        teal: {
          DEFAULT: '#2DD4BF',
          50: '#EFFFFC',
          100: '#CCFBF1',
          600: '#0D9488',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          600: '#B45309',
          700: '#92400E',
        },
        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          600: '#BE123C',
          700: '#9F1239',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        soft: '0 2px 8px 0 rgb(61 18 112 / 0.06), 0 1px 2px 0 rgb(61 18 112 / 0.04)',
        pop: '0 8px 24px -4px rgb(61 18 112 / 0.18)',
        nav: '0 -2px 16px 0 rgb(61 18 112 / 0.08)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        press: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.94)' },
          '100%': { transform: 'scale(1)' },
        },
        pulse-ring: {
          '0%': { boxShadow: '0 0 0 0 rgb(123 47 190 / 0.35)' },
          '100%': { boxShadow: '0 0 0 14px rgb(123 47 190 / 0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'pop-in': 'pop-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        press: 'press 0.28s ease',
        'pulse-ring': 'pulse-ring 1.4s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
