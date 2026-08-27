/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyberdark: {
          900: '#0a0e1a',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
        },
        cyberblue: {
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
        cybercyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        cyberpurple: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
        cyberemerald: {
          400: '#34d399',
          500: '#10b981',
        },
        cyberamber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 20px rgba(59, 130, 246, 0.5)',
        'neon-cyan': '0 0 20px rgba(6, 182, 212, 0.5)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.5)',
        'neon-emerald': '0 0 20px rgba(16, 185, 129, 0.5)',
        'glow-blue': '0 8px 32px rgba(59, 130, 246, 0.25)',
        'glow-cyan': '0 8px 32px rgba(6, 182, 212, 0.25)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.35)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)',
        'radial-fade': 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.15), transparent 60%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'aurora': 'aurora 18s ease-in-out infinite',
        'grid-pan': 'grid-pan 20s linear infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.5' },
          '33%': { transform: 'translate(3%, -2%) scale(1.1)', opacity: '0.7' },
          '66%': { transform: 'translate(-2%, 3%) scale(0.95)', opacity: '0.6' },
        },
        'grid-pan': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 40px' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
