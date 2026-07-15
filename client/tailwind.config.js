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
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#22c55e',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #14b8a6 100%)',
        'gradient-card': 'linear-gradient(135deg, #eff6ff 0%, #f0fdfa 100%)',
      }
    },
  },
  plugins: [],
}
