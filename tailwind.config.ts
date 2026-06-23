import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary':  '#640D5F',
        'brand-dark':     '#3D0739',
        'brand-light':    '#FDF0FC',
        'brand-action':   '#D91656',
        'brand-warm':     '#EB5B00',
        'brand-gold':     '#FFB200',
        'action-light':   '#FDEEF3',
        'warm-light':     '#FFF1E8',
        'error-light':    '#FDEAEA',
        'success':        '#1D9E75',
        'success-light':  '#E1F5EE',
        'warning':        '#9C6B00',
        'warning-light':  '#FFF8E1',
        'gold-light':     '#FFF8E1',
        'border-savis':   '#E8E2E8',
        'error':          '#A32D2D',
        'surface-gray':   '#F5F6F8',
        'border':         '#E8E2E8',
        'primary':        '#1A0A1A',
        'secondary':      '#6B5C6B',
        'text-primary':   '#1A0A1A',
        'text-secondary': '#6B5C6B',
        'disabled':       '#B8A8B8',
        'on-brand':       '#FFFFFF',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  safelist: [
    'bg-payout-gradient',
    'text-white/60',
    'text-white/70',
    'text-white/90',
    'border-white/20',
    'bg-brand-primary',
    'bg-brand-action',
    'bg-brand-light',
    'bg-brand-warm',
    'text-brand-primary',
    'text-brand-action',
    'border-brand-primary',
    'border-l-brand-primary',
    'border-l-warning',
    'bg-success-light',
    'text-success',
    'bg-warning-light',
    'text-warning',
    'bg-surface-gray',
    'border-border-savis',
  ],
  plugins: [require('tailwind-scrollbar-hide')],
};

export default config;
