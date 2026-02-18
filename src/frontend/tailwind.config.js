module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          100: 'rgba(255, 255, 255, 0.1)',
          200: 'rgba(255, 255, 255, 0.2)',
          300: 'rgba(255, 255, 255, 0.3)',
          400: 'rgba(255, 255, 255, 0.4)',
          500: 'rgba(255, 255, 255, 0.5)',
          600: 'rgba(255, 255, 255, 0.6)',
          700: 'rgba(255, 255, 255, 0.7)',
          800: 'rgba(255, 255, 255, 0.8)',
          900: 'rgba(255, 255, 255, 0.9)',
        },
        dark: {
          100: '#1a1a2e',
          200: '#16213e',
          300: '#0f3460',
          400: '#e94560',
          500: '#2d2d2d',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
