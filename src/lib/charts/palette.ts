/**
 * Chart palette: the design tokens of tailwind.config.ts as literal values, because canvas drawing needs colours, not
 * class names. The only place outside tailwind.config.ts that names colours; keep the two in step.
 */
export const PALETTE = {
  brand: '#245BFE', brandInk: '#1B46C9', brandSoft: '#EAF0FF',
  navy: '#071A33', slate: '#4A5770', faint: '#5F6B84',
  line: '#E5EAF1', line2: '#D7DEE8', bg: '#F7F9FC', white: '#FFFFFF',
  up: '#0A7350', down: '#C2352B', warn: '#8A5A07', saffron: '#E8862A',
} as const;
/** Comparison lines: colour and dash pattern pairs, so lines stay distinguishable without colour. */
export const SERIES_STYLES: { color: string; dash: number[] }[] = [
  { color: PALETTE.brand, dash: [] }, { color: PALETTE.saffron, dash: [7, 4] }, { color: PALETTE.up, dash: [2, 3] }, { color: PALETTE.navy, dash: [10, 3, 2, 3] }, { color: PALETTE.faint, dash: [1, 4] },
];
/** Indicator line colours, in the order KLineChart assigns them to an indicator's lines. */
export const INDICATOR_COLORS = [PALETTE.saffron, PALETTE.brand, PALETTE.navy, PALETTE.up, PALETTE.down];
