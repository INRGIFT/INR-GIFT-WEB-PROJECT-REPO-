import { getProvider, ProviderError } from '@/providers';
import { INR_PER } from '@/providers/demo/seed';
import type { AssetQuery } from '@/providers/provider';
import { validateCandles } from '@/lib/validation';
import type { Asset, AssetClass, CalendarKind, ChartRange, DataMeta, Envelope, MarketView, Pagination, ResearchKind } from '@/lib/types';

/**
 * Data services. Pages and API routes call these; nothing else talks to a provider.
 * This is the layer that applies validation, aggregation and envelope metadata.
 */
const p = () => getProvider();
export const nowMeta = (dataStatus: DataMeta['dataStatus'] = 'DELAYED'): DataMeta => { const t = new Date().toISOString(); return { timestamp: t, ingestedAt: t, timezone: 'UTC', source: p().name, dataStatus }; };
export function envelope<T>(data: T, meta?: Partial<DataMeta>, pagination?: Pagination): Envelope<T> { return { data, meta: { ...nowMeta(), ...meta }, ...(pagination ? { pagination } : {}) }; }
export function paginate<T>(rows: T[], page = 1, pageSize = 25): { rows: T[]; pagination: Pagination } {
  const total = rows.length, totalPages = Math.max(1, Math.ceil(total / pageSize)), pg = Math.min(Math.max(1, page), totalPages);
  return { rows: rows.slice((pg - 1) * pageSize, pg * pageSize), pagination: { page: pg, pageSize, total, totalPages } };
}

export const getMarkets = (): Promise<MarketView[]> => p().getMarketSessions();
export const getMarket = (slug: string) => p().getMarket(slug);
export const getAssets = (q?: AssetQuery) => p().listAssets(q);
export const getAsset = (cls: AssetClass | undefined, slug: string) => p().getAsset(decodeURIComponent(slug), cls);
export const getThemes = () => p().getThemes();
export const getNews = (q?: Parameters<ReturnType<typeof p>['getNews']>[0]) => p().getNews(q);
/** Units of INR per unit of each currency. With a real provider this comes from the FX feed. */
export async function fxRates(): Promise<Record<string, number>> { return INR_PER; }

export async function getOHLCV(id: string, range: ChartRange) {
  const raw = await p().getOHLCV(id, range);
  if (!raw) return null;
  const { clean, quarantined } = validateCandles(raw);
  return { candles: clean, quarantined: quarantined.length };
}
export async function getTheme(id: string) {
  const theme = (await getThemes()).find((t) => t.id === id);
  if (!theme) return null;
  return { theme, assets: await getAssets({ ids: theme.assetIds }) };
}
export async function getResearch(kind?: ResearchKind) { const all = await p().getResearch(); return kind ? all.filter((d) => d.kind === kind) : all; }
export async function getResearchDoc(kind: ResearchKind, slug: string) { return (await getResearch(kind)).find((d) => d.slug === slug) ?? null; }
export async function getCalendar(kind?: CalendarKind | CalendarKind[]) { const all = await p().getCalendar(); const kinds = kind ? (Array.isArray(kind) ? kind : [kind]) : null; return kinds ? all.filter((e) => kinds.includes(e.kind)) : all; }

export const EQUITY_LIKE: AssetClass[] = ['stock', 'etf', 'reit'];
const tradable = (a: Asset) => a.status !== 'CLOSED' && a.m.d1 != null;
export function movers(list: Asset[], n = 5) {
  const live = list.filter(tradable);
  const by = (f: (a: Asset) => number, dir: 1 | -1) => [...live].sort((a, b) => (f(b) - f(a)) * dir).slice(0, n);
  return { gainers: by((a) => a.m.d1!, 1), losers: by((a) => a.m.d1!, -1), active: by((a) => a.m.volume ?? 0, 1) };
}
/** Cap-weighted one-day change by sector. */
export function sectors(list: Asset[]) {
  const g = new Map<string, { w: number; s: number; n: number }>();
  for (const a of list) { if (a.cls !== 'stock' || !a.sector || a.m.d1 == null || !a.m.marketCap) continue; const x = g.get(a.sector) ?? { w: 0, s: 0, n: 0 }; x.w += a.m.marketCap; x.s += a.m.d1 * a.m.marketCap; x.n += 1; g.set(a.sector, x); }
  return [...g].map(([sector, x]) => ({ sector, change: x.s / x.w, count: x.n })).sort((a, b) => b.change - a.change);
}
export function breadth(list: Asset[]) { const l = list.filter((a) => a.cls === 'stock' && a.m.d1 != null); return { advancing: l.filter((a) => a.m.d1! > 0).length, declining: l.filter((a) => a.m.d1! < 0).length, unchanged: l.filter((a) => a.m.d1 === 0).length }; }

export interface SearchResults { assets: Asset[]; markets: MarketView[]; research: { title: string; href: string; kind: string }[]; themes: { id: string; name: string }[] }
export async function search(query: string): Promise<SearchResults> {
  const q = query.trim().toLowerCase();
  if (!q) return { assets: [], markets: [], research: [], themes: [] };
  const [assets, markets, research, themes] = await Promise.all([p().searchAssets(q, 10), getMarkets(), getResearch(), getThemes()]);
  return {
    assets,
    markets: markets.filter((m) => `${m.name} ${m.slug} ${m.region} ${m.currency} ${m.exchanges.map((e) => `${e.name} ${e.mic}`).join(' ')}`.toLowerCase().includes(q)).slice(0, 4),
    research: research.filter((d) => `${d.title} ${d.assetSymbol ?? ''} ${d.topic}`.toLowerCase().includes(q)).slice(0, 4).map((d) => ({ title: d.title, href: `/research/${d.kind}/${d.slug}`, kind: d.type })),
    themes: themes.filter((t) => `${t.name} ${t.description}`.toLowerCase().includes(q)).slice(0, 4).map((t) => ({ id: t.id, name: t.name })),
  };
}
export function toApiError(e: unknown): { status: number; body: { error: { code: string; message: string } } } {
  if (e instanceof ProviderError) return { status: e.code === 'NOT_CONFIGURED' ? 503 : e.code === 'NOT_ENTITLED' ? 403 : 502, body: { error: { code: e.code, message: e.message } } };
  return { status: 500, body: { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong while loading this data.' } } };
}
