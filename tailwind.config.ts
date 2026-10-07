import type { Config } from 'tailwindcss';

/** Single source of design tokens. Pages never use raw hex values. */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    /** Breakpoints (mobile-first): phone < 640 ≤ large phone < 768 ≤ tablet < 1024 ≤ desktop < 1280 ≤ wide < 1536 ≤ ultra. */
    screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    extend: {
      colors: {
        brand: { DEFAULT: '#245BFE', ink: '#1B46C9', soft: '#EAF0FF' },
        navy: '#071A33', slate2: '#4A5770', faint: '#5F6B84',
        bg: '#F7F9FC', soft: '#F2F5F9', hover: '#EEF2F7', line: '#E5EAF1', line2: '#D7DEE8',
        up: '#0A7350', down: '#C2352B', warn: '#8A5A07', saffron: '#E8862A',
        /** Brand library colours (logo artwork itself is never recoloured; see docs/BRAND_ASSET_INVENTORY.md). */
        ice: '#DCE8FF', ink: '#0B0E14', focus: '#245BFE',
        /** Data-status tokens: one hue per status; every badge also carries a distinct glyph. */
        status: { live: '#0A7350', delayed: '#8A5A07', eod: '#1B46C9', closed: '#4A5770', unavailable: '#5F6B84', stale: '#8A5A07', error: '#C2352B' },
      },
      /** Type scale (px): micro 11 · caption 12 · ui 13 · body 14 · lead 15 · h4 17 · h3 20 · h2 24 · h1 34 · display 48. */
      fontSize: { micro: ['11px', '1.4'], caption: ['12px', '1.45'], ui: ['13px', '1.5'], body: ['14px', '1.55'], lead: ['15px', '1.6'], h4: ['17px', '1.35'], h3: ['20px', '1.3'], h2: ['24px', '1.25'], h1: ['34px', '1.15'], display: ['48px', '1.08'] },
      /** Control heights: compact 32–36, standard 40, primary/action 44, search 44–48. */
      height: { 'ctl-sm': '32px', 'ctl-cmp': '36px', ctl: '40px', 'ctl-lg': '44px', search: '44px', 'search-lg': '48px' },
      borderWidth: { hair: '1px' },
      ringColor: { focus: '#245BFE' },
      fontFamily: {
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { card: '13px', ctl: '10px' },
      boxShadow: { card: '0 1px 2px rgba(7,26,51,.05)', raised: '0 4px 14px rgba(7,26,51,.08)', pop: '0 14px 36px rgba(7,26,51,.16)' },
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
