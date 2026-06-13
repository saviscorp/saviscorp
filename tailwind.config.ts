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
        'success':        '#1D9E75',
        'success-light':  '#E1F5EE',
        'warning':        '#9C6B00',
        'gold-light':     '#FFF8E1',
        'error':          '#A32D2D',
        'surface-gray':   '#F5F6F8',
        'border':         '#E8E2E8',
        'primary':        '#1A0A1A',
        'secondary':      '#6B5C6B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
};

export default config;
