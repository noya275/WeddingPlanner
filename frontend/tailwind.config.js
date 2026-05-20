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
      },
    },
  },
  plugins: [],
}
