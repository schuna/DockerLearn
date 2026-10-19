/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        docker: {
          blue: '#0db7ed',
          dark: '#086dd7',
          navy: '#1d273b',
          terminal: '#181b20',
          canvas: '#0f172a',
        }
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(16, 185, 129, 0.6)' },
          '50%': { boxShadow: '0 0 25px rgba(16, 185, 129, 0.9)' },
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
