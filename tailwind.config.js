/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Cairo', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        obsidian: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0f172a', // standard slate-900 instead of pure black
        },
        electric: {
          50: '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6', // elegant standard blue
          600: '#2563eb',
        },
        steel: {
          50: '#f7f8fa',
          100: '#ebeef2',
          200: '#d8dee6',
          300: '#bcc6d3',
          400: '#8895a7',
          500: '#5d6a7c',
          600: '#445062',
          700: '#313a49',
          800: '#222a36',
          900: '#171d27',
        },
        primary: {
          50: '#eef5fb',
          100: '#d8e7f6',
          200: '#b7d0e9',
          300: '#8fb4d8',
          400: '#5f8fc0',
          500: '#225c97',
          600: '#1b4c7e',
          700: '#153d65',
          800: '#112f4d',
          900: '#0f2238',
        },
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(0,0,0,0.5)',
        'neon': 'none',
      },
    },
  },
  plugins: [],
}
