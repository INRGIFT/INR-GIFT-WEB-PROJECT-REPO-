import type { DataStatus, Exchange, Market, SessionState } from './types';

/** Market calendar service. All session logic reads exchange metadata; nothing assumes Monday to Friday or fixed hours. */
const toMin = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const ISO_DOW: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** One formatter per time zone: constructing Intl.DateTimeFormat is far slower than using one. */
const FORMATTERS = new Map<string, Intl.DateTimeFormat>();
const formatter = (tz: string) => {
  let f = FORMATTERS.get(tz);
  if (!f) { f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' }); FORMATTERS.set(tz, f); }
  return f;
};
export function zoned(tz: string, at: Date): { date: string; minutes: number; dow: number } {
  const parts = formatter(tz).formatToParts(at);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { date: `${g('year')}-${g('month')}-${g('day')}`, minutes: Number(g('hour')) * 60 + Number(g('minute')), dow: ISO_DOW[g('weekday')] ?? 1 };
}
/** Minutes that `tz` is ahead of UTC at the given instant. */
export function tzOffsetMin(tz: string, at: Date): number {
  const z = zoned(tz, at);
  const [y, mo, d] = z.date.split('-').map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, Math.floor(z.minutes / 60), z.minutes % 60);
  return Math.round((asUtc - Math.floor(at.getTime() / 60000) * 60000) / 60000);
}
const closeFor = (ex: Exchange, date: string) => toMin(ex.halfDays?.[date] ?? ex.close);
const isTradingDate = (ex: Exchange, date: string, dow: number) => ex.tradingDays.includes(dow) && !ex.holidays[date];

export function sessionState(ex: Exchange, at: Date): { state: SessionState; holidayName?: string } {
  const z = zoned(ex.timezone, at);
  if (ex.holidays[z.date]) return { state: 'HOLIDAY', holidayName: ex.holidays[z.date] };
  if (!ex.tradingDays.includes(z.dow)) return { state: 'CLOSED' };
  const open = toMin(ex.open), close = closeFor(ex, z.date);
  if (z.minutes >= open && z.minutes < close) {
    if (ex.breakStart && ex.breakEnd && z.minutes >= toMin(ex.breakStart) && z.minutes < toMin(ex.breakEnd)) return { state: 'BREAK' };
    return { state: 'OPEN' };
  }
  if (ex.preOpen && z.minutes >= toMin(ex.preOpen) && z.minutes < open) return { state: 'PRE_MARKET' };
  if (ex.postClose && z.minutes >= close && z.minutes < toMin(ex.postClose)) return { state: 'POST_MARKET' };
  return { state: 'CLOSED' };
}
/** Instant of the most recent regular-session close at or before `at`. */
export function lastClose(ex: Exchange, at: Date): Date {
  for (let k = 0; k < 14; k++) {
    const probe = new Date(at.getTime() - k * 86400000);
    const z = zoned(ex.timezone, probe);
    if (!isTradingDate(ex, z.date, z.dow)) continue;
    const close = closeFor(ex, z.date);
    if (k === 0 && z.minutes < close) continue;
    const [y, mo, d] = z.date.split('-').map(Number);
    return new Date(Date.UTC(y, mo - 1, d, 0, close) - tzOffsetMin(ex.timezone, probe) * 60000);
  }
  return at;
}
/** Regular hours as decimal hours in IST. */
export function istHours(ex: Exchange, at: Date): { open: number; close: number } {
  const shift = (tzOffsetMin('Asia/Kolkata', at) - tzOffsetMin(ex.timezone, at)) / 60;
  const wrap = (h: number) => ((h % 24) + 24) % 24;
  return { open: wrap(toMin(ex.open) / 60 + shift), close: wrap(toMin(ex.close) / 60 + shift) };
}
export function localTime(tz: string, at: Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
}
/** Maps session + entitlement to the data status a quote from this market should carry. */
export function dataStatusFor(market: Pick<Market, 'feed' | 'statusOverride'>, state: SessionState): DataStatus {
  if (market.statusOverride) return market.statusOverride;
  if (state === 'HOLIDAY') return 'CLOSED';
  if (state === 'OPEN' || state === 'BREAK') return market.feed;
  return 'END_OF_DAY';
}
export function statusTimestamp(status: DataStatus, ex: Exchange, at: Date): Date {
  switch (status) {
    case 'LIVE': case 'ERROR': return at;
    case 'DELAYED': return new Date(at.getTime() - 15 * 60000);
    case 'STALE': return new Date(at.getTime() - 3 * 3600000);
    case 'UNAVAILABLE': return new Date(lastClose(ex, at).getTime() - 86400000);
    default: return lastClose(ex, at);
  }
}
/* ------------------------------------ Sessions as instants ------------------------------------ */

/** One regular session of an exchange on a local date, as instants. Breaks are null when the exchange has none. */
export interface Session { date: string; open: Date; close: Date; breakStart: Date | null; breakEnd: Date | null }
/** `date` (YYYY-MM-DD) moved by whole days. Pure date arithmetic: no time zone involved. */
export const shiftDate = (date: string, days: number) => { const [y, m, d] = date.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10); };
const isoDowOf = (date: string) => { const [y, m, d] = date.split('-').map(Number); const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return w === 0 ? 7 : w; };
/** The instant of local wall-clock `minutes` after midnight on `date` in `tz` (checked twice across DST changes). */
export function instantAt(tz: string, date: string, minutes: number): Date {
  const [y, m, d] = date.split('-').map(Number);
  const wall = Date.UTC(y, m - 1, d, 0, minutes);
  let t = wall - tzOffsetMin(tz, new Date(wall)) * 60000;
  t = wall - tzOffsetMin(tz, new Date(t)) * 60000;
  return new Date(t);
}
/** Whether `date` is a trading day: the exchange's own trading days and holidays, never an assumed Monday to Friday. */
export const isTradingDay = (ex: Exchange, date: string) => isTradingDate(ex, date, isoDowOf(date));
/** The regular session on a local date, or null for a weekend, a non-trading weekday or a holiday. */
export function sessionOn(ex: Exchange, date: string): Session | null {
  if (!isTradingDay(ex, date)) return null;
  const close = closeFor(ex, date);
  const hasBreak = Boolean(ex.breakStart && ex.breakEnd && toMin(ex.breakEnd!) <= close);
  return {
    date, open: instantAt(ex.timezone, date, toMin(ex.open)), close: instantAt(ex.timezone, date, close),
    breakStart: hasBreak ? instantAt(ex.timezone, date, toMin(ex.breakStart!)) : null, breakEnd: hasBreak ? instantAt(ex.timezone, date, toMin(ex.breakEnd!)) : null,
  };
}
/**
 * Trading dates (local, YYYY-MM-DD) from `fromDate` to `toDate` inclusive, oldest first. Cheap: no instants are built,
 * so callers can scan years of calendar and only turn the dates they keep into sessions.
 */
export function tradingDates(ex: Exchange, fromDate: string, toDate: string): string[] {
  const out: string[] = [];
  for (let d = fromDate; d <= toDate; d = shiftDate(d, 1)) if (isTradingDay(ex, d)) out.push(d);
  return out;
}
/** The most recent `count` sessions that had opened by `until`, oldest first. */
export function recentSessions(ex: Exchange, until: Date, count: number): Session[] {
  const out: Session[] = [];
  let date = zoned(ex.timezone, until).date;
  for (let k = 0; k < count * 3 + 20 && out.length < count; k++, date = shiftDate(date, -1)) {
    const s = sessionOn(ex, date);
    if (s && s.open <= until) out.push(s);
  }
  return out.reverse();
}

export const SESSION_LABEL: Record<SessionState, string> = { OPEN: 'Open', CLOSED: 'Closed', PRE_MARKET: 'Pre-market', POST_MARKET: 'After hours', BREAK: 'Midday break', HOLIDAY: 'Holiday' };
