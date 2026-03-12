import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        tangent: {
          blue: '#00AEEF',
          'blue-light': '#33c1f3',
          'blue-dark': '#0098d4',
        },
        // Background Colors
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          elevated: 'var(--bg-elevated)',
          hover: 'var(--bg-hover)',
          active: 'var(--bg-active)',
        },
        // Text Colors
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
        // Border Colors
        border: {
          primary: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
          focus: 'var(--border-focus)',
        },
        // Status Colors
        status: {
          success: '#00c875',
          warning: '#fdab3d',
          danger: '#e2445c',
          info: '#0073ea',
        },
        // Priority Colors
        priority: {
          urgent: '#e2445c',
          high: '#fdab3d',
          medium: '#00c875',
          low: '#579bfc',
        },
        // Task Status Colors
        task: {
          todo: '#797e93',
          'in-progress': '#fdab3d',
          'in-review': '#a25ddc',
          blocked: '#e2445c',
          done: '#00c875',
        },
        // Activity Status Colors
        activity: {
          online: '#00c875',
          active: '#00c875',
          idle: '#fdab3d',
          break: '#579bfc',
          offline: '#797e93',
          locked: '#e2445c',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xs': '2px',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 174, 239, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 174, 239, 0.4)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'slide-left': 'slideLeft 0.25s ease-out',
        'slide-right': 'slideRight 0.25s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'spin-slow': 'spin 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
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
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 174, 239, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 174, 239, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass': 'linear-gradient(145deg, rgba(30, 30, 42, 0.8), rgba(18, 18, 26, 0.9))',
        'card': 'var(--card-bg)',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionDuration: {
        '400': '400ms',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      gridTemplateColumns: {
        'dashboard': 'repeat(12, minmax(0, 1fr))',
        'kanban': 'repeat(auto-fit, minmax(280px, 1fr))',
      },
      minHeight: {
        'screen-minus-header': 'calc(100vh - 64px)',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [
    // Custom plugin for CSS variables
    function({ addUtilities }: any) {
      addUtilities({
        '.text-gradient': {
          background: 'linear-gradient(135deg, #00AEEF, #33c1f3)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-none': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
};

export default config;
