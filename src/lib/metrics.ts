import type { Asset, AssetClass, MetricKey } from './types';
import { compact, DASH, num, pct, usdCompact } from './format';

export type MetricCategory = 'Market' | 'Performance' | 'Valuation' | 'Fundamental' | 'Growth' | 'Dividend' | 'Risk' | 'Technical' | 'Fund' | 'Fixed income';
type Fmt = 'signedPct' | 'pct' | 'x' | 'num2' | 'int' | 'usd' | 'compact';
export interface MetricDef { label: string; short: string; category: MetricCategory; fmt: Fmt; better?: 'high' | 'low' }

/** Registry that drives table columns, screener fields and compare rows. Add a metric here and it appears everywhere. */
export const METRICS: Record<MetricKey, MetricDef> = {
  d1: { label: '1 day change', short: '1D', category: 'Performance', fmt: 'signedPct', better: 'high' },
  w1: { label: '1 week change', short: '1W', category: 'Performance', fmt: 'signedPct', better: 'high' },
  m1: { label: '1 month change', short: '1M', category: 'Performance', fmt: 'signedPct', better: 'high' },
  m3: { label: '3 month change', short: '3M', category: 'Performance', fmt: 'signedPct', better: 'high' },
  m6: { label: '6 month change', short: '6M', category: 'Performance', fmt: 'signedPct', better: 'high' },
  ytd: { label: 'Year to date', short: 'YTD', category: 'Performance', fmt: 'signedPct', better: 'high' },
  y1: { label: '1 year return', short: '1Y', category: 'Performance', fmt: 'signedPct', better: 'high' },
  y3: { label: '3 year return', short: '3Y', category: 'Performance', fmt: 'signedPct', better: 'high' },
  y5: { label: '5 year return', short: '5Y', category: 'Performance', fmt: 'signedPct', better: 'high' },
  volume: { label: 'Volume', short: 'Volume', category: 'Market', fmt: 'compact' },
  marketCap: { label: 'Market cap (USD)', short: 'Mkt cap', category: 'Market', fmt: 'usd' },
  aum: { label: 'Assets under management (USD)', short: 'AUM', category: 'Fund', fmt: 'usd' },
  pe: { label: 'Price / earnings', short: 'P/E', category: 'Valuation', fmt: 'x', better: 'low' },
  fpe: { label: 'Forward P/E', short: 'Fwd P/E', category: 'Valuation', fmt: 'x', better: 'low' },
  pb: { label: 'Price / book', short: 'P/B', category: 'Valuation', fmt: 'x', better: 'low' },
  evEbitda: { label: 'EV / EBITDA', short: 'EV/EBITDA', category: 'Valuation', fmt: 'x', better: 'low' },
  revenueGrowth: { label: 'Revenue growth', short: 'Rev growth', category: 'Growth', fmt: 'signedPct', better: 'high' },
  epsGrowth: { label: 'EPS growth', short: 'EPS growth', category: 'Growth', fmt: 'signedPct', better: 'high' },
  grossMargin: { label: 'Gross margin', short: 'Gross mgn', category: 'Fundamental', fmt: 'pct', better: 'high' },
  netMargin: { label: 'Net margin', short: 'Net mgn', category: 'Fundamental', fmt: 'pct', better: 'high' },
  roe: { label: 'Return on equity', short: 'ROE', category: 'Fundamental', fmt: 'pct', better: 'high' },
  roic: { label: 'Return on invested capital', short: 'ROIC', category: 'Fundamental', fmt: 'pct', better: 'high' },
  debtEquity: { label: 'Debt / equity', short: 'D/E', category: 'Fundamental', fmt: 'num2', better: 'low' },
  dividendYield: { label: 'Dividend yield', short: 'Div yield', category: 'Dividend', fmt: 'pct', better: 'high' },
  beta: { label: 'Beta', short: 'Beta', category: 'Risk', fmt: 'num2', better: 'low' },
  volatility: { label: '30-day volatility', short: 'Volatility', category: 'Risk', fmt: 'pct', better: 'low' },
  maxDrawdown: { label: 'Max drawdown (3Y)', short: 'Max DD', category: 'Risk', fmt: 'signedPct', better: 'high' },
  rsi: { label: 'RSI (14)', short: 'RSI', category: 'Technical', fmt: 'int' },
  sma50Gap: { label: 'Distance from 50-day average', short: 'vs 50D', category: 'Technical', fmt: 'signedPct' },
  expenseRatio: { label: 'Expense ratio', short: 'Expense', category: 'Fund', fmt: 'pct', better: 'low' },
  holdingsCount: { label: 'Number of holdings', short: 'Holdings', category: 'Fund', fmt: 'int', better: 'high' },
  yield: { label: 'Yield to maturity', short: 'Yield', category: 'Fixed income', fmt: 'pct', better: 'high' },
  duration: { label: 'Duration (years)', short: 'Duration', category: 'Fixed income', fmt: 'num2', better: 'low' },
  coupon: { label: 'Coupon', short: 'Coupon', category: 'Fixed income', fmt: 'pct' },
  ffoYield: { label: 'FFO yield', short: 'FFO yld', category: 'Fundamental', fmt: 'pct', better: 'high' },
  occupancy: { label: 'Occupancy', short: 'Occupancy', category: 'Fundamental', fmt: 'pct', better: 'high' },
};
export const METRIC_KEYS = Object.keys(METRICS) as MetricKey[];

export function fmtValue(fmt: Fmt, v: number): string {
  switch (fmt) {
    case 'signedPct': return pct(v);
    case 'pct': return num(v, 2) + '%';
    case 'x': return num(v, 1) + '×';
    case 'num2': return num(v, 2);
    case 'int': return num(v, 0);
    case 'usd': return usdCompact(v);
    case 'compact': return compact(v);
  }
}
/** `undefined` → not applicable, `null` → unavailable, otherwise formatted. Never renders a fake zero. */
export function fmtMetric(key: MetricKey, v: number | null | undefined): { text: string; state: 'ok' | 'unavailable' | 'na' } {
  if (v === undefined) return { text: 'n/a', state: 'na' };
  if (v === null) return { text: DASH, state: 'unavailable' };
  return { text: fmtValue(METRICS[key].fmt, v), state: 'ok' };
}
export const isDirectional = (key: MetricKey) => METRICS[key].fmt === 'signedPct';

export const DEFAULT_COLUMNS: Record<AssetClass, MetricKey[]> = {
  stock: ['d1', 'w1', 'y1', 'marketCap', 'pe', 'revenueGrowth', 'dividendYield'],
  etf: ['d1', 'y1', 'y5', 'aum', 'expenseRatio', 'dividendYield', 'holdingsCount'],
  fund: ['d1', 'y1', 'aum', 'expenseRatio'],
  index: ['d1', 'w1', 'm1', 'ytd', 'y1', 'volatility'],
  fx: ['d1', 'w1', 'm1', 'y1', 'volatility'],
  commodity: ['d1', 'w1', 'm1', 'y1', 'volatility'],
  bond: ['yield', 'coupon', 'duration', 'd1', 'y1'],
  reit: ['d1', 'y1', 'marketCap', 'dividendYield', 'ffoYield', 'occupancy'],
};
export const size = (a: Pick<Asset, 'm'>) => a.m.marketCap ?? a.m.aum ?? null;
