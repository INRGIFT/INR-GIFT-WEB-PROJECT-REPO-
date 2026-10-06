/** One place for number, currency and date formatting so precision never varies between screens. */
export const DASH = '—';
const SYMBOL: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹' };

export function num(v: number | null | undefined, dp = 2): string {
  if (v == null || Number.isNaN(v)) return DASH;
  return v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
export function priceDp(v: number): number {
  const a = Math.abs(v);
  return a >= 10000 ? 0 : a >= 1000 ? 1 : a < 1 ? 4 : 2;
}
export function money(v: number | null | undefined, currency: string): string {
  if (v == null) return DASH;
  return (SYMBOL[currency] ?? currency + ' ') + num(v, priceDp(v));
}
export function pct(v: number | null | undefined, dp = 2): string {
  if (v == null || Number.isNaN(v)) return DASH;
  return (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), dp) + '%';
}
export function compact(v: number | null | undefined): string {
  if (v == null) return DASH;
  const a = Math.abs(v);
  if (a >= 1e12) return num(v / 1e12, 2) + 'T';
  if (a >= 1e9) return num(v / 1e9, 1) + 'B';
  if (a >= 1e6) return num(v / 1e6, 1) + 'M';
  if (a >= 1e3) return num(v / 1e3, 0) + 'K';
  return num(v, 0);
}
export const usdCompact = (v: number | null | undefined) => (v == null ? DASH : '$' + compact(v));
/** USD amount shown the Indian way: lakh crore (10^12 rupees). */
export function inrLakhCrore(usd: number | null | undefined, usdInr: number): string {
  if (usd == null) return DASH;
  const lc = (usd * usdInr) / 1e12;
  return '₹' + num(lc, lc >= 100 ? 0 : lc >= 1 ? 1 : 2) + ' L Cr';
}
const IST = 'Asia/Kolkata';
export function timeIST(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: IST, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso)) + ' IST';
}
export function dateShort(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: IST, day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}
export function dateTimeIST(iso: string): string {
  return `${dateShort(iso)}, ${timeIST(iso)}`;
}
export function hhmm(decimalHours: number): string {
  const h = ((decimalHours % 24) + 24) % 24;
  const m = Math.round((h % 1) * 60);
  return `${String(Math.floor(h) + (m === 60 ? 1 : 0)).padStart(2, '0')}:${String(m === 60 ? 0 : m).padStart(2, '0')}`;
}
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
