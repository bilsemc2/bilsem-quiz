/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Chivo"', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        syne: ['"Syne"', 'sans-serif'],
        nunito: ['"Nunito"', 'sans-serif'],
        chivo: ['"Chivo"', 'sans-serif'],
      },
      colors: {
        purple: {
          brand: '#7E30E1',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        secondary: {
          50: '#f0fdf4',
          500: '#10b981',
          600: '#059669',
        },
        accent: {
          500: '#f59e0b',
          600: '#d97706',
        },
        cyber: {
          yellow: '#dcf126',
          blue: '#1e40af',
          pink: '#f43f5e',
          obsidian: '#0B0C10',
          paper: '#FAF9F6',
          emerald: '#14F195',
          purple: '#B026FF',
          orange: '#FF9500',
          cyan: '#06b6d4',
          gold: '#FFD700',
          red: '#FF2745',
          green: '#14F195',
        },
        background: '#FAF9F6',
        // Müzik Konservatuarı palette
        konser: {
          bg: '#06050f',
          surface: '#0d0b1e',
          card: '#13112a',
          border: 'rgba(139, 92, 246, 0.15)',
        },
        neon: {
          violet: '#8b5cf6',
          cyan: '#06b6d4',
          gold: '#f59e0b',
          rose: '#f43f5e',
          emerald: '#10b981',
        },
      },
      boxShadow: {
        'neo-xs': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'neo-sm': '0 2px 6px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'neo-md': '0 4px 12px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)',
        'neo-lg': '0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
        'neo-xl': '0 12px 36px rgba(0,0,0,0.10), 0 6px 12px rgba(0,0,0,0.05)',
        'neo-hover': '0 2px 8px rgba(0,0,0,0.08)',
        'glow-violet': '0 0 30px rgba(139, 92, 246, 0.3)',
        'glow-cyan': '0 0 30px rgba(6, 182, 212, 0.3)',
        'glow-gold': '0 0 30px rgba(245, 158, 11, 0.3)',
        'glow-rose': '0 0 30px rgba(244, 63, 94, 0.3)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'gradient': 'gradient 3s linear infinite',
        'fadeIn': 'fadeIn 0.5s ease-in',
        'slideUp': 'slideUp 0.5s ease-out',
        'bounce-slow': 'bounce-slow 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'pop': 'pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        gradient: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
      scale: {
        '102': '1.02',
      },
      backgroundSize: {
        '200%': '200%',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
