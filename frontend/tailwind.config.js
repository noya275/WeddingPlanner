/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: {
          50:  '#fdf2f4',
          100: '#fce7eb',
          200: '#f8cfd6',
          300: '#f2a8b5',
          400: '#e8718a',
          500: '#d94464',
          600: '#bf2a4b',
          700: '#a01e3c',
          800: '#861a35',
          900: '#731830',
          950: '#400c1a',
        },
        gold: {
          50:  '#fdf8ee',
          100: '#faedce',
          200: '#f4d898',
          300: '#edbf60',
          400: '#e8a847',
          500: '#d4893a',
          600: '#c0702e',
          700: '#a05826',
          800: '#7d4420',
          900: '#5e331a',
        },
        // Warm-tinted grays to replace cool grays site-wide
        gray: {
          50:  '#faf8f6',
          100: '#f3ede8',
          200: '#e7ddd6',
          300: '#d2c5bb',
          400: '#b5a497',
          500: '#96857a',
          600: '#786960',
          700: '#5e5249',
          800: '#453d38',
          900: '#302b27',
          950: '#1c1815',
        },
      },
    },
  },
  plugins: [],
}
