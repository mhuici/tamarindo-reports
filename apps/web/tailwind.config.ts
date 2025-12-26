import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        // TamarindoReports brand colors
        tamarindo: {
          50: '#fdf8f6',
          100: '#f9ebe4',
          200: '#f3d5c8',
          300: '#e9b8a3',
          400: '#dc9275',
          500: '#d17a5a', // Primary brand color
          600: '#c2623f',
          700: '#a14e33',
          800: '#85422f',
          900: '#6e3a2b',
          950: '#3b1c14',
        },
        // Semantic colors
        primary: {
          50: '#fdf8f6',
          100: '#f9ebe4',
          200: '#f3d5c8',
          300: '#e9b8a3',
          400: '#dc9275',
          500: '#d17a5a',
          600: '#c2623f',
          700: '#a14e33',
          800: '#85422f',
          900: '#6e3a2b',
          950: '#3b1c14',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
