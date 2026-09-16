/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E65100',
          light: '#F97316',
          dark: '#C2410C',
        },
        secondary: {
          DEFAULT: '#881337',
          light: '#9F1239',
          dark: '#4C0519',
        },
        warm: {
          bg: '#FAF8F5',
          paper: '#F5EFE6',
        },
        charcoal: {
          DEFAULT: '#1C1917',
          muted: '#78716C',
        },
        gold: {
          DEFAULT: '#D97706',
          light: '#FBBF24',
          bg: '#FEF3C7',
        }
      }
    },
  },
  plugins: [],
}
