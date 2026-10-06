import type { Config } from 'tailwindcss';

/** Single source of design tokens. Pages never use raw hex values. */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#245BFE', ink: '#1B46C9', soft: '#EAF0FF' },
        navy: '#071A33', slate2: '#4A5770', faint: '#6F7C93',
        bg: '#F7F9FC', soft: '#F2F5F9', hover: '#EEF2F7', line: '#E5EAF1', line2: '#D7DEE8',
        up: '#0B7F56', down: '#C2352B', warn: '#9A6408', saffron: '#E8862A',
      },
      fontFamily: {
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { card: '13px', ctl: '10px' },
      boxShadow: { card: '0 1px 2px rgba(7,26,51,.05)', pop: '0 14px 36px rgba(7,26,51,.16)' },
      maxWidth: { page: '1360px', wide: '1560px' },
      transitionTimingFunction: { out: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      /** Motion tokens (docs/MOTION.md): micro interactions, panels and popovers, layout changes. */
      transitionDuration: { micro: '150ms', panel: '220ms', layout: '320ms' },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        'pop-in': { from: { opacity: '0', transform: 'translateY(-4px) scale(.98)' }, to: { opacity: '1', transform: 'none' } },
        shimmer: { to: { backgroundPosition: '-200% 0' } },
        confirm: { '0%': { transform: 'scale(1)' }, '45%': { transform: 'scale(1.18)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in .22s cubic-bezier(0.22,1,0.36,1) both',
        'fade-up': 'fade-up .3s cubic-bezier(0.22,1,0.36,1) both',
        'pop-in': 'pop-in .18s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 1.4s linear infinite',
        confirm: 'confirm .28s cubic-bezier(0.22,1,0.36,1)',
      },
    },
  },
  plugins: [],
};
export default config;
