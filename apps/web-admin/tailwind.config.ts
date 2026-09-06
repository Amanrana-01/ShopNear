import type { Config } from 'tailwindcss'

// Same palette/tokens as apps/web-customer, copied rather than imported
// (each app is a separate workspace, see coordination note in the report).
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
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.35s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
