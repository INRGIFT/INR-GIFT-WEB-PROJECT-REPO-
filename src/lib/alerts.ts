import { money, num, pct } from './format';
import type { Asset, CalendarEvent, NewsItem, ResearchDoc, Technicals, WorkspaceTables } from './types';

/**
 * Alert rules and their evaluation. Pure: the caller supplies current data, this decides whether an alert fires.
 * Alerts notify only; nothing here can place an order (INRGIFT has no such capability).
 */
export type AlertKind = 'price_above' | 'price_below' | 'pct_move' | 'high_52w' | 'low_52w' | 'valuation' | 'earnings' | 'dividend' | 'news' | 'research';
export const ALERT_KINDS: readonly (readonly [AlertKind, string, boolean, string])[] = [
  ['price_above', 'Price rises above', true, 'price'], ['price_below', 'Price falls below', true, 'price'], ['pct_move', 'One-day move exceeds (%)', true, '%'],
  ['high_52w', 'Reaches a 52-week high', false, ''], ['low_52w', 'Reaches a 52-week low', false, ''], ['valuation', 'P/E falls below', true, '×'],
  ['earnings', 'Results date is within 7 days', false, ''], ['dividend', 'Ex-dividend date is within 7 days', false, ''], ['news', 'News is published', false, ''], ['research', 'INRGIFT research is published', false, ''],
] as const;
export const needsThreshold = (kind: string) => ALERT_KINDS.find((k) => k[0] === kind)?.[2] ?? false;
export const alertLabel = (kind: string, threshold: number | null) => { const k = ALERT_KINDS.find((x) => x[0] === kind); if (!k) return kind; return threshold == null || !k[2] ? k[1] : `${k[1]} ${k[3] === '%' ? `${num(threshold, 1)}%` : k[3] === '×' ? `${num(threshold, 1)}×` : num(threshold, threshold < 1 ? 4 : 2)}`; };

/** Validation for the create/edit form. Returns a message or null. */
export function alertProblem(kind: string, raw: string, asset?: Pick<Asset, 'price' | 'm'>): string | null {
  if (!ALERT_KINDS.some((k) => k[0] === kind)) return 'Choose a condition.';
  if (!needsThreshold(kind)) return null;
  const n = Number(raw);
  if (!raw.trim() || !Number.isFinite(n) || n <= 0) return 'Enter a number greater than zero.';
  if (kind === 'pct_move' && n > 50) return 'Use a move of 50% or less.';
  if (kind === 'valuation' && asset && asset.m.pe === undefined) return 'P/E does not apply to this asset.';
  if (asset?.price != null && kind === 'price_above' && n <= asset.price) return `Already above that: the last price is ${num(asset.price, 2)}. Choose a higher level.`;
  if (asset?.price != null && kind === 'price_below' && n >= asset.price) return `Already below that: the last price is ${num(asset.price, 2)}. Choose a lower level.`;
  return null;
}

export interface AlertContext { asset: Asset; technicals?: Technicals | null; events?: CalendarEvent[]; news?: NewsItem[]; research?: ResearchDoc[]; now: Date }
export interface AlertResult { fired: boolean; title?: string; body?: string }
type Alert = WorkspaceTables['alerts'];
const DAY = 86400000;

/** Decides whether an active alert fires now. Event-style alerts fire once per new item since the alert was created or last fired. */
export function evaluateAlert(alert: Alert, ctx: AlertContext): AlertResult {
  if (alert.status !== 'active') return { fired: false };
  const { asset: a, now } = ctx;
  const since = Date.parse(alert.last_triggered_at ?? alert.created_at);
  const t = alert.threshold;
  const name = `${a.symbol}`;
  const price = a.price;
  const quoteOk = a.status !== 'ERROR' && a.status !== 'UNAVAILABLE' && price != null;
  switch (alert.kind as AlertKind) {
    case 'price_above': return quoteOk && t != null && price! >= t ? { fired: true, title: `${name} rose above ${num(t, 2)}`, body: `Last price ${money(price, a.currency)}, ${pct(a.m.d1)} today.` } : { fired: false };
    case 'price_below': return quoteOk && t != null && price! <= t ? { fired: true, title: `${name} fell below ${num(t, 2)}`, body: `Last price ${money(price, a.currency)}, ${pct(a.m.d1)} today.` } : { fired: false };
    case 'pct_move': return quoteOk && t != null && a.m.d1 != null && Math.abs(a.m.d1) >= t ? { fired: true, title: `${name} moved ${pct(a.m.d1)} today`, body: `Your threshold was ${num(t, 1)}%. Last price ${money(price, a.currency)}.` } : { fired: false };
    case 'high_52w': return quoteOk && ctx.technicals?.high52 != null && price! >= ctx.technicals.high52 * 0.999 ? { fired: true, title: `${name} is at a 52-week high`, body: `Last price ${money(price, a.currency)}.` } : { fired: false };
    case 'low_52w': return quoteOk && ctx.technicals?.low52 != null && price! <= ctx.technicals.low52 * 1.001 ? { fired: true, title: `${name} is at a 52-week low`, body: `Last price ${money(price, a.currency)}.` } : { fired: false };
    case 'valuation': return a.m.pe != null && t != null && a.m.pe <= t ? { fired: true, title: `${name} P/E fell to ${num(a.m.pe, 1)}×`, body: `Your threshold was ${num(t, 1)}×.` } : { fired: false };
    case 'earnings':
    case 'dividend': {
      const kind = alert.kind === 'earnings' ? 'earnings' : 'dividend';
      const e = (ctx.events ?? []).find((x) => x.kind === kind && x.assetSlug === a.slug && Date.parse(x.date) - now.getTime() <= 7 * DAY && Date.parse(x.date) >= now.getTime() - DAY);
      if (!e || (alert.last_triggered_at && Date.parse(alert.last_triggered_at) > Date.parse(e.date) - 8 * DAY)) return { fired: false };
      return { fired: true, title: kind === 'earnings' ? `${name} reports on ${e.date}` : `${name} goes ex-dividend on ${e.date}`, body: e.detail };
    }
    case 'news': { const n = (ctx.news ?? []).find((x) => x.assetSlug === a.slug && Date.parse(x.publishedAt) > since); return n ? { fired: true, title: `News on ${name}`, body: n.headline } : { fired: false }; }
    case 'research': { const d = (ctx.research ?? []).find((x) => x.assetSlug === a.slug && Date.parse(x.publishedAt) > since); return d ? { fired: true, title: `New research on ${name}`, body: d.title } : { fired: false }; }
    default: return { fired: false };
  }
}
/** Event-style alerts stay active after firing (they watch for the next item); level alerts move to "triggered". */
export const staysActive = (kind: string) => ['news', 'research', 'earnings', 'dividend'].includes(kind);
