import type { Config } from 'tailwindcss'

/**
 * ShopNear design tokens.
 *
 * Brand purple stays the primary (it is the existing product identity, and it
 * is also what the quick-commerce category has converged on). Around it sit
 * two functional accents that carry meaning rather than decoration:
 *
 *   success  — "in stock", "confirmed", delivery ETA. Never decorative.
 *   accent   — urgency only: discounts, low stock, expiring reservations.
 *
 * Density is deliberately high (Zepto/Blinkit-class product grids), so the
 * radius and shadow scales are tight and the type scale bottoms out at 11px
 * for metadata only — never body copy.
 */
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
        ink: {
          DEFAULT: '#3D1270',
          muted: '#6B5B84',
          faint: '#9C8FB0',
        },
        canvas: {
          DEFAULT: '#F6F4FB',
          raised: '#FFFFFF',
          sunken: '#EDE8F7',
        },
        success: {
          DEFAULT: '#0D9488',
          50: '#EFFFFC',
          100: '#CCFBF1',
          600: '#0D9488',
          700: '#0F766E',
        },
        accent: {
          DEFAULT: '#EA580C',
          50: '#FFF4ED',
          100: '#FFE6D5',
          600: '#EA580C',
          700: '#C2410C',
        },
        teal: {
          DEFAULT: '#2DD4BF',
          50: '#EFFFFC',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#B45309',
          700: '#92400E',
        },
        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          500: '#F43F5E',
          600: '#BE123C',
          700: '#9F1239',
        },
      },
      fontFamily: {
        sans: [
          'Inter', 'Poppins', 'ui-sans-serif', 'system-ui', '-apple-system',
          'Segoe UI', 'Roboto', 'sans-serif',
        ],
        display: [
          'Poppins', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system',
          'Segoe UI', 'sans-serif',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        card: '16px',
        tile: '14px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0 2px 8px 0 rgb(61 18 112 / 0.06), 0 1px 2px 0 rgb(61 18 112 / 0.04)',
        pop: '0 8px 24px -4px rgb(61 18 112 / 0.18)',
        nav: '0 -2px 16px 0 rgb(61 18 112 / 0.08)',
        tile: '0 1px 2px 0 rgb(61 18 112 / 0.05), 0 0 0 1px rgb(61 18 112 / 0.04)',
        lift: '0 12px 32px -8px rgb(61 18 112 / 0.22)',
        header: '0 1px 0 0 rgb(61 18 112 / 0.06)',
      },
      spacing: {
        header: '3.5rem',
        'nav-h': '4rem',
      },
      maxWidth: {
        app: '80rem',
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
        'marquee-y': {
          '0%, 45%': { transform: 'translateY(0)' },
          '55%, 100%': { transform: 'translateY(-100%)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'pop-in': 'pop-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        press: 'press 0.28s ease',
      },
    },
  },
  plugins: [],
} satisfies Config
