import type { IndicatorTemplate, KLineData } from 'klinecharts';
import { macd } from '@/lib/indicators';
import { PALETTE } from '../palette';

/**
 * The indicators INRGIFT offers, and only these. MA, EMA, BOLL, VOL, OBV and RSI are KLineChart's built-ins, whose
 * formulas were checked against the standard definitions (simple average; EMA seeded with a simple average; Bollinger
 * with the population standard deviation; Wilder's RSI; cumulative OBV). MACD is INRGIFT's own (src/lib/indicators.ts)
 * because the built-in draws the histogram as 2 × (MACD − signal), not the usual MACD − signal.
 */
export interface IndicatorDef {
  id: 'MA' | 'EMA' | 'BOLL' | 'VOL' | 'OBV' | 'RSI' | 'MACD';
  /** KLineChart indicator name (built-in or registered below). */
  name: string;
  label: string;
  /** Short text for chips and the legend. */
  short: string;
  calcParams: number[];
  /** "main" overlays the price pane; "sub" gets its own pane below. */
  pane: 'main' | 'sub';
  /** Hidden when the instrument has no volume (indices, FX, commodities, bonds). */
  needsVolume?: boolean;
  description: string;
}
export const INDICATORS: IndicatorDef[] = [
  { id: 'MA', name: 'MA', label: 'Moving averages', short: 'MA 20 · 50', calcParams: [20, 50], pane: 'main', description: 'Simple moving averages of the close over 20 and 50 bars.' },
  { id: 'EMA', name: 'EMA', label: 'Exponential moving averages', short: 'EMA 20 · 50', calcParams: [20, 50], pane: 'main', description: 'Exponential moving averages of the close over 20 and 50 bars.' },
  { id: 'BOLL', name: 'BOLL', label: 'Bollinger Bands', short: 'BOLL 20 · 2', calcParams: [20, 2], pane: 'main', description: '20-bar simple average with bands two standard deviations above and below.' },
  { id: 'VOL', name: 'VOL', label: 'Volume', short: 'Volume', calcParams: [20], pane: 'sub', needsVolume: true, description: 'Volume per bar with its 20-bar average.' },
  { id: 'OBV', name: 'OBV', label: 'On-balance volume', short: 'OBV', calcParams: [30], pane: 'sub', needsVolume: true, description: 'Cumulative volume, added on up bars and subtracted on down bars, with a 30-bar average.' },
  { id: 'RSI', name: 'RSI', label: 'Relative strength index', short: 'RSI 14', calcParams: [14], pane: 'sub', description: "Wilder's 14-bar RSI, from 0 to 100." },
  { id: 'MACD', name: 'INRGIFT_MACD', label: 'MACD', short: 'MACD 12 · 26 · 9', calcParams: [12, 26, 9], pane: 'sub', description: 'MACD line (12 and 26-bar EMAs), 9-bar signal line and their difference.' },
];
export const indicatorById = (id: IndicatorDef['id']) => INDICATORS.find((i) => i.id === id)!;

type MacdRow = { macd?: number; signal?: number; hist?: number };
/** INRGIFT MACD for KLineChart: standard histogram (MACD − signal). */
export const MACD_TEMPLATE: IndicatorTemplate<MacdRow, number> = {
  name: 'INRGIFT_MACD',
  shortName: 'MACD',
  calcParams: [12, 26, 9],
  precision: 4,
  figures: [
    { key: 'macd', title: 'MACD: ', type: 'line' },
    { key: 'signal', title: 'Signal: ', type: 'line' },
    { key: 'hist', title: 'Histogram: ', type: 'bar', baseValue: 0, styles: ({ data }) => { const v = data.current?.hist ?? 0; return { style: 'fill', color: v > 0 ? 'rgba(10,115,80,0.55)' : v < 0 ? 'rgba(194,53,43,0.55)' : PALETTE.line2 }; } },
  ],
  calc: (dataList: KLineData[], indicator) => {
    const [fast = 12, slow = 26, signal = 9] = indicator.calcParams;
    const r = macd(dataList.map((d) => d.close), fast, slow, signal);
    return dataList.map((_, i) => {
      const row: MacdRow = {};
      if (r.macd[i] != null) row.macd = r.macd[i]!;
      if (r.signal[i] != null) row.signal = r.signal[i]!;
      if (r.histogram[i] != null) row.hist = r.histogram[i]!;
      return row;
    });
  },
};

type CompareRow = { value?: number };
/** Extra data a comparison line carries: its label and its rebased values keyed by the main series' bar time. */
export interface CompareData { label: string; values: Record<number, number> }
/**
 * A comparison line on the main pane: another instrument's change from the start of the period, placed on the main
 * series' bars (adapter.ts alignRebased). Bars without a value leave a gap.
 */
export const COMPARE_TEMPLATE: IndicatorTemplate<CompareRow, number, CompareData> = {
  name: 'INRGIFT_COMPARE',
  shortName: 'Compare',
  series: 'price',
  precision: 2,
  figures: [{ key: 'value', title: '', type: 'line' }],
  calc: (dataList: KLineData[], indicator) => dataList.map((d) => { const v = indicator.extendData?.values?.[d.timestamp]; return v == null ? {} : { value: v }; }),
  createTooltipDataSource: ({ indicator, crosshair }) => {
    const i = crosshair.dataIndex ?? indicator.result.length - 1;
    const v = indicator.result[i]?.value;
    const label = (indicator.extendData as CompareData | undefined)?.label ?? 'Compare';
    return { name: '', calcParamsText: '', features: [], legends: [{ title: `${label}: `, value: v == null ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}%` }] };
  },
};

/** A y-axis for rebased (percent) series: values are already percentages, the axis only adds the sign. */
export const REBASED_AXIS = { name: 'inrgift_rebased', displayValueToText: (value: number, precision: number) => `${value > 0 ? '+' : ''}${value.toFixed(Math.min(precision, 2))}%` };
