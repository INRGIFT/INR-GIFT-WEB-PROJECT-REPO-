import { isTradingDay, sessionOn, shiftDate, tradingDates, zoned } from '@/lib/calendar';
import type { Exchange } from '@/lib/types';
import { INTRADAY_MINUTES, isIntraday, type ChartBar, type ChartResolution } from './types';

/**
 * Bar timing and aggregation on an exchange's own calendar: trading days, holidays, half days and breaks come from the
 * exchange metadata (src/lib/calendar.ts); nothing assumes Monday to Friday or fixed hours.
 */

/** Spot FX and commodity references: no single exchange; quoted on weekdays around the clock (UTC). */
export const GLOBAL_VENUE: Exchange = { mic: 'XGLB', name: 'Global OTC', timezone: 'UTC', open: '00:00', close: '23:59', tradingDays: [1, 2, 3, 4, 5], holidays: {} };

const isoDow = (date: string) => { const [y, m, d] = date.split('-').map(Number); const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return w === 0 ? 7 : w; };
/** First day of the exchange's trading week (Monday for most; Sunday for a Sunday-to-Thursday exchange). */
const weekStartDow = (ex: Exchange) => ex.tradingDays[0] ?? 1;
/** Period key of a local trading date: the date itself, its trading week (by the exchange's week start) or its month. */
export function periodKey(ex: Exchange, date: string, resolution: '1D' | '1W' | '1M'): string {
  if (resolution === '1D') return date;
  if (resolution === '1M') return date.slice(0, 7);
  return shiftDate(date, -((isoDow(date) - weekStartDow(ex) + 7) % 7));
}

/**
 * Open times of the bars between `since` and `until` at `resolution`, on the venue's calendar. Intraday bars lie inside
 * regular sessions (breaks skipped) and only completed bars are returned; daily, weekly and monthly bars open at their
 * first session. No bar ever starts after `until`, so a closed market never gets a new candle.
 */
export function barOpenTimes(ex: Exchange, resolution: ChartResolution, since: Date, until: Date): Date[] {
  const dates = tradingDates(ex, zoned(ex.timezone, since).date, zoned(ex.timezone, until).date);
  const out: Date[] = [];
  if (isIntraday(resolution)) {
    const step = INTRADAY_MINUTES[resolution]! * 60000;
    for (const d of dates) {
      const s = sessionOn(ex, d)!;
      for (let t = s.open.getTime(); t + step <= s.close.getTime(); t += step) {
        if (s.breakStart && s.breakEnd && t >= s.breakStart.getTime() && t < s.breakEnd.getTime()) continue;
        if (t >= since.getTime() && t + step <= until.getTime()) out.push(new Date(t));
      }
    }
    return out;
  }
  let last = '';
  for (const d of dates) {
    const k = periodKey(ex, d, resolution as '1D' | '1W' | '1M');
    if (k === last) continue;
    last = k;
    const s = sessionOn(ex, d)!;
    if (s.open.getTime() >= since.getTime() && s.open.getTime() <= until.getTime()) out.push(s.open);
  }
  return out;
}

/** The resolution of a series, from the typical spacing of its bars (median gap). */
export function inferResolution(bars: Pick<ChartBar, 't'>[]): ChartResolution {
  if (bars.length < 2) return '1D';
  const gaps = bars.slice(1).map((b, i) => b.t - bars[i].t).filter((g) => g > 0).sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)] ?? 86400000;
  const min = median / 60000;
  if (min < 3) return '1m';
  if (min < 10) return '5m';
  if (min < 22) return '15m';
  if (min < 45) return '30m';
  if (min < 120) return '1h';
  if (min < 600) return '4h';
  if (median < 4 * 86400000) return '1D';
  if (median < 20 * 86400000) return '1W';
  return '1M';
}

const ORDER: ChartResolution[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M'];
/**
 * What a series can honestly be shown in: its own resolution and coarser ones that aggregate whole bars (5m → 15m,
 * 30m, 1h; 30m → 1h, 4h; daily → weekly, monthly). Finer resolutions are never invented from coarser bars.
 */
export function supportedResolutions(native: ChartResolution, bars: number): ChartResolution[] {
  const out: ChartResolution[] = [native];
  const nativeMin = INTRADAY_MINUTES[native];
  for (const r of ORDER.slice(ORDER.indexOf(native) + 1)) {
    const m = INTRADAY_MINUTES[r];
    if (nativeMin !== undefined && m !== undefined) { if (m % nativeMin === 0 && bars / (m / nativeMin) >= 6) out.push(r); continue; }
    if (nativeMin === undefined && (r === '1W' || r === '1M') && native !== '1M') { const per = r === '1W' ? (native === '1W' ? 1 : 5) : native === '1W' ? 4 : 21; if (bars / per >= 6) out.push(r); }
  }
  return out;
}

/**
 * Combines bars into a coarser resolution: open of the first, high and low of all, close of the last, volume summed
 * (null if any bar has none). Intraday groups never cross a session; weekly and monthly groups follow the venue's
 * trading weeks and months in its own time zone.
 */
export function aggregateBars(bars: ChartBar[], target: ChartResolution, ex: Exchange): ChartBar[] {
  const opens = new Map<string, number>();
  const sessionOpen = (date: string) => {
    let o = opens.get(date);
    if (o === undefined) { const s = isTradingDay(ex, date) ? sessionOn(ex, date) : null; o = s ? s.open.getTime() : Date.UTC(1970, 0, 1); opens.set(date, o); }
    return o;
  };
  const key = (b: ChartBar): string => {
    const local = zoned(ex.timezone, new Date(b.t));
    if (isIntraday(target)) {
      const origin = sessionOpen(local.date);
      const step = INTRADAY_MINUTES[target]! * 60000;
      return `${local.date}|${Math.floor((b.t - origin) / step)}`;
    }
    return periodKey(ex, local.date, target as '1D' | '1W' | '1M');
  };
  const out: ChartBar[] = [];
  let current: ChartBar | null = null, currentKey = '', volumeKnown = true;
  for (const b of bars) {
    const k = key(b);
    if (current && k === currentKey) {
      current.h = Math.max(current.h, b.h); current.l = Math.min(current.l, b.l); current.c = b.c;
      if (b.v == null) volumeKnown = false; else if (current.v != null) current.v += b.v;
      if (!volumeKnown) current.v = null;
      continue;
    }
    if (current) out.push(current);
    current = { ...b }; currentKey = k; volumeKnown = b.v != null;
  }
  if (current) out.push(current);
  return out;
}
