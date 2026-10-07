import type { DataLoader, KLineData, Period } from 'klinecharts';
import { zoned } from '@/lib/calendar';
import { isIntraday, type ChartBar, type ChartResolution, type ChartSeries } from '../types';

/**
 * INRGIFT chart adapter: maps the INRGIFT chart contract (src/lib/charts/types.ts) to KLineChart's data model. Pure
 * functions with type-only imports from klinecharts, so they run (and are tested) on the server; the library itself is
 * loaded only in the browser (lifecycle.ts).
 */

/** One INRGIFT bar → one KLineChart bar. Volume is left out (not zero) when the source has none. */
export function toKLineData(bars: ChartBar[]): KLineData[] {
  return bars.map((b) => (b.v == null ? { timestamp: b.t, open: b.o, high: b.h, low: b.l, close: b.c } : { timestamp: b.t, open: b.o, high: b.h, low: b.l, close: b.c, volume: b.v }));
}

const PERIOD: Record<ChartResolution, Period> = {
  '1m': { type: 'minute', span: 1 }, '5m': { type: 'minute', span: 5 }, '15m': { type: 'minute', span: 15 }, '30m': { type: 'minute', span: 30 },
  '1h': { type: 'hour', span: 1 }, '4h': { type: 'hour', span: 4 }, '1D': { type: 'day', span: 1 }, '1W': { type: 'week', span: 1 }, '1M': { type: 'month', span: 1 },
};
export const periodFor = (r: ChartResolution): Period => PERIOD[r];

/** KLineChart symbol for a series: its ticker and the precision its prices and volumes are shown with. */
export const symbolFor = (s: Pick<ChartSeries, 'symbol' | 'instrumentId' | 'pricePrecision' | 'volumePrecision'>, key = '') => ({ ticker: `${s.symbol}${key ? `|${key}` : ''}`, instrumentId: s.instrumentId, pricePrecision: s.pricePrecision, volumePrecision: s.volumePrecision });

/**
 * A data loader that serves bars INRGIFT already fetched. It answers the initial load only and reports that there is
 * nothing more in either direction; it has no subscribeBar, so KLineChart never receives a tick: the current providers
 * do not stream, and nothing is simulated.
 */
export function staticDataLoader(bars: () => KLineData[]): DataLoader {
  return { getBars: ({ type, callback }) => { callback(type === 'init' ? bars() : [], false); } };
}

/**
 * Relative performance: every bar of a series as percent change from the first close of the period (0% at the start).
 * Used when lines are compared, so instruments in different currencies and price levels share one axis.
 */
export function rebaseBars(bars: ChartBar[]): ChartBar[] {
  const base = bars.find((b) => b.c > 0)?.c;
  if (!base) return [];
  const p = (v: number) => (v / base - 1) * 100;
  return bars.map((b) => ({ ...b, o: p(b.o), h: p(b.h), l: p(b.l), c: p(b.c) }));
}

/** ISO week of a date (YYYY-MM-DD) as "YYYY-Www". */
function isoWeek(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const week = Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${week}`;
}
/**
 * The key two series are matched on: the exact bar time (intraday), the trading date (daily), the ISO week (weekly) or
 * the month (monthly), each read in the series' own venue time zone.
 */
const matchKey = (s: Pick<ChartSeries, 'resolution' | 'timezone'>, t: number) => {
  if (isIntraday(s.resolution)) return String(t);
  const date = zoned(s.timezone, new Date(t)).date;
  return s.resolution === '1W' ? isoWeek(date) : s.resolution === '1M' ? date.slice(0, 7) : date;
};

/**
 * Another series' rebased closes, placed on the main series' bars. A main bar with no matching bar in the other
 * series (a holiday on one exchange, a missing day) gets no value, so the line has a gap rather than an invented point.
 * The other line starts at 0% on its first bar that falls on the main series' bars.
 */
export function alignRebased(main: Pick<ChartSeries, 'bars' | 'resolution' | 'timezone'>, other: Pick<ChartSeries, 'bars' | 'resolution' | 'timezone'>): Map<number, number> {
  const closes = new Map(other.bars.map((b) => [matchKey(other, b.t), b.c]));
  const out = new Map<number, number>();
  let base: number | null = null;
  for (const b of main.bars) {
    const c = closes.get(matchKey(main, b.t));
    if (c == null || c <= 0) continue;
    base ??= c;
    out.set(b.t, (c / base - 1) * 100);
  }
  return out;
}
