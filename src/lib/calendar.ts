import type { DataStatus, Exchange, Market, SessionState } from './types';

/** Market calendar service. All session logic reads exchange metadata; nothing assumes Monday to Friday or fixed hours. */
const toMin = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const ISO_DOW: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function zoned(tz: string, at: Date): { date: string; minutes: number; dow: number } {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' }).formatToParts(at);
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
export const SESSION_LABEL: Record<SessionState, string> = { OPEN: 'Open', CLOSED: 'Closed', PRE_MARKET: 'Pre-market', POST_MARKET: 'After hours', BREAK: 'Midday break', HOLIDAY: 'Holiday' };
