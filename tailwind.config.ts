import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tangent: {
          blue: '#00AEEF',
          'blue-dark': '#0095d0',
          'blue-light': '#33c1f5',
          black: '#1a1a1a',
        },
        dark: {
          bg: '#0a0a0f',
          card: '#12121a',
          'card-hover': '#1a1a25',
          border: 'rgba(0, 174, 239, 0.15)',
        },
        priority: {
          critical: '#ff5252',
          high: '#ff9800',
          medium: '#ffc107',
          low: '#00c853',
        },
        status: {
          done: '#00c853',
          progress: '#00AEEF',
          tbc: '#ffc107',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-tangent': 'linear-gradient(135deg, #00AEEF 0%, #0077b6 100%)',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(0, 174, 239, 0.2)',
        'glow-lg': '0 0 60px rgba(0, 174, 239, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 174, 239, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 174, 239, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
