/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // ClearScan AI medical-grade palette
        bg: {
          base: '#0f172a',      // slate-900
          surface: '#1e293b',   // slate-800
          elevated: '#334155',  // slate-700
        },
        accent: {
          DEFAULT: '#3b82f6',   // blue-500
          hover: '#2563eb',     // blue-600
        },
        risk: {
          safe: '#22c55e',      // green-500
          warning: '#f59e0b',   // amber-500
          danger: '#ef4444',    // red-500
          critical: '#dc2626',  // red-600
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'border-pulse': 'border-pulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        'border-pulse': {
          '0%, 100%': { borderColor: 'rgba(59, 130, 246, 0.3)' },
          '50%': { borderColor: 'rgba(59, 130, 246, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}