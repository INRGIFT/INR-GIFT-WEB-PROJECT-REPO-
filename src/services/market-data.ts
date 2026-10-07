import { isDemoData } from '@/lib/config';
import { getProvider, ProviderError } from '@/providers';
import { INR_PER } from '@/providers/demo/seed';
import { getLearnArticles } from '@/services/content';
import type { AssetQuery } from '@/providers/provider';
import { validateCandles } from '@/lib/validation';
import { assetHref, learnHref, marketHref } from '@/lib/routes';
import type { Asset, AssetClass, CalendarKind, ChartRange, DataMeta, Envelope, MarketView, Pagination, ResearchDoc, ResearchKind } from '@/lib/types';

/**
 * Data services. Pages and API routes call these; nothing else talks to a provider.
 * This is the layer that applies validation, aggregation and envelope metadata.
 */
const p = () => getProvider();
/** Meta for responses that are not market data (content, reference lists). Market-data responses pass their own. */
export const nowMeta = (dataStatus: DataMeta['dataStatus'] = isDemoData ? 'DEMO' : 'END_OF_DAY'): DataMeta => { const t = new Date().toISOString(); return { timestamp: t, ingestedAt: t, timezone: 'UTC', source: p().name, dataStatus }; };
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
export async function getResearch(kind?: ResearchKind) { const all = (await p().getResearch()).map(structureDoc); return kind ? all.filter((d) => d.kind === kind) : all; }

const DISCLOSURE = 'INRGIFT publishes research and information only. This note describes data and context; it is not investment advice, a recommendation, a rating or a price target, and it does not consider anyone’s circumstances. INRGIFT is not a broker or an investment adviser.';
/**
 * Gives every research note the full article structure. Explicit fields from the source win; otherwise defaults are
 * derived from the note itself (takeaways = each section's first sentence) or stated plainly (author = the desk,
 * reviewer = none). Nothing here invents a figure, a person or a source.
 */
export function structureDoc(d: ResearchDoc): ResearchDoc {
  const first = (t: string) => (t.match(/^.*?[.!?](\s|$)/)?.[0] ?? t).trim();
  const why = d.sections.find((s) => /why it matters/i.test(s.heading));
  return {
    ...d,
    keyTakeaways: d.keyTakeaways?.length ? d.keyTakeaways : d.sections.filter((s) => s !== why).slice(0, 3).map((s) => first(s.body)),
    whyItMatters: d.whyItMatters ?? why?.body,
    sections: why && !d.whyItMatters ? d.sections.filter((s) => s !== why) : d.sections,
    limitations: d.limitations?.length ? d.limitations : ['Figures are a snapshot at publication; the live table shows current values.', 'Coverage is a sample of listed instruments, not a complete market.'],
    methodology: d.methodology ?? 'Figures come from the active market-data source at publication. Medians use every covered asset of the same class. Returns are in each listing’s own currency unless stated. Narrative sections describe the data; they do not forecast.',
    sources: d.sources?.length ? d.sources : [{ label: 'Active market-data source (see each table’s status and timestamp)' }, { label: 'INRGIFT data and methodology', href: '/resources/data' }],
    author: d.author ?? 'INRGIFT Research',
    reviewer: d.reviewer ?? null,
    disclosure: d.disclosure ?? DISCLOSURE,
    charts: d.charts ?? [],
  };
}
export async function getResearchDoc(kind: ResearchKind, slug: string) { return (await getResearch(kind)).find((d) => d.slug === slug) ?? null; }
/** Calendar events with time zone, market, source and a related page attached, so every row is self-describing. */
export async function getCalendar(kind?: CalendarKind | CalendarKind[]) {
  const [raw, markets] = await Promise.all([p().getCalendar(), getMarkets()]);
  const byId = new Map(markets.map((m) => [m.id, m]));
  const all = raw.map((e) => { const m = e.marketId ? byId.get(e.marketId) : undefined; return { ...e, timezone: e.timezone ?? m?.exchanges[0]?.timezone ?? 'UTC', marketName: e.marketName ?? m?.name, source: e.source ?? p().name, href: e.href ?? (e.assetSlug && e.assetCls ? assetHref({ cls: e.assetCls, slug: e.assetSlug }) : m ? marketHref(m.slug) : '/resources/calendar') }; });
  const kinds = kind ? (Array.isArray(kind) ? kind : [kind]) : null;
  return kinds ? all.filter((e) => kinds.includes(e.kind)) : all;
}

export const EQUITY_LIKE: AssetClass[] = ['stock', 'etf', 'reit'];
const tradable = (a: Asset) => a.status !== 'CLOSED' && a.m.d1 != null;
/** Price × volume in US dollars, so activity is comparable across currencies. */
export const turnoverUsd = (a: Pick<Asset, 'price' | 'currency' | 'm'>) => (a.price == null || a.m.volume == null ? 0 : (a.price * a.m.volume * (INR_PER[a.currency] ?? 0)) / INR_PER.USD);
/** Status for a module or response that mixes rows: the freshest row wins, matching how the UI labels mixed modules. */
const FRESHNESS: DataMeta['dataStatus'][] = ['LIVE', 'DELAYED', 'DEMO', 'STALE', 'END_OF_DAY', 'CLOSED', 'UNAVAILABLE', 'ERROR'];
export const freshest = (list: { meta: DataMeta }[]): DataMeta | null => [...list].sort((a, b) => FRESHNESS.indexOf(a.meta.dataStatus) - FRESHNESS.indexOf(b.meta.dataStatus))[0]?.meta ?? null;
export function movers(list: Asset[], n = 5) {
  const live = list.filter(tradable);
  const by = (f: (a: Asset) => number, dir: 1 | -1) => [...live].sort((a, b) => (f(b) - f(a)) * dir).slice(0, n);
  return { gainers: by((a) => a.m.d1!, 1), losers: by((a) => a.m.d1!, -1), active: by(turnoverUsd, 1) };
}
/** Cap-weighted one-day change by sector. */
export function sectors(list: Asset[]) {
  const g = new Map<string, { w: number; s: number; n: number }>();
  for (const a of list) { if (a.cls !== 'stock' || !a.sector || a.m.d1 == null || !a.m.marketCap) continue; const x = g.get(a.sector) ?? { w: 0, s: 0, n: 0 }; x.w += a.m.marketCap; x.s += a.m.d1 * a.m.marketCap; x.n += 1; g.set(a.sector, x); }
  return [...g].map(([sector, x]) => ({ sector, change: x.s / x.w, count: x.n })).sort((a, b) => b.change - a.change);
}
export function breadth(list: Asset[]) { const l = list.filter((a) => a.cls === 'stock' && a.m.d1 != null); return { advancing: l.filter((a) => a.m.d1! > 0).length, declining: l.filter((a) => a.m.d1! < 0).length, unchanged: l.filter((a) => a.m.d1 === 0).length }; }

export interface SearchEntity { group: 'Exchanges' | 'Sectors' | 'Industries' | 'News' | 'Learn'; label: string; hint: string; href: string }
export interface SearchResults { assets: Asset[]; markets: MarketView[]; research: { title: string; href: string; kind: string }[]; themes: { id: string; name: string }[]; more: SearchEntity[] }
export async function search(query: string): Promise<SearchResults> {
  const q = query.trim().toLowerCase();
  if (!q) return { assets: [], markets: [], research: [], themes: [], more: [] };
  const [assets, markets, research, themes, universe, news, learn] = await Promise.all([p().searchAssets(q, 10), getMarkets(), getResearch(), getThemes(), getAssets(), p().getNews({ limit: 200 }), getLearnArticles()]);
  const has = (s: string | undefined) => Boolean(s && s.toLowerCase().includes(q));
  const exchanges = markets.flatMap((m) => m.exchanges.map((e) => ({ e, m }))).filter(({ e }) => has(e.name) || e.mic.toLowerCase() === q).slice(0, 3)
    .map(({ e, m }): SearchEntity => ({ group: 'Exchanges', label: e.name, hint: `${e.mic} · ${m.name} · ${e.timezone}`, href: marketHref(m.slug) }));
  const distinct = (k: 'sector' | 'industry') => [...new Set(universe.map((a) => a[k]).filter((v): v is string => has(v)))].slice(0, 3);
  const sectors = distinct('sector').map((s): SearchEntity => ({ group: 'Sectors', label: s, hint: `${universe.filter((a) => a.sector === s).length} covered assets · heatmap`, href: `/discover/heatmap?group=sector&path=${encodeURIComponent(s)}` }));
  const industries = distinct('industry').map((s): SearchEntity => ({ group: 'Industries', label: s, hint: `${universe.filter((a) => a.industry === s).length} covered assets · heatmap`, href: `/discover/heatmap?group=industry&path=${encodeURIComponent(s)}` }));
  const newsHits = news.filter((n) => has(n.headline) || n.assetSymbol?.toLowerCase() === q).slice(0, 3).map((n): SearchEntity => ({ group: 'News', label: n.headline, hint: `${n.publisher} · ${n.publishedAt.slice(0, 10)}`, href: n.url }));
  const learnHits = learn.filter((a) => has(a.title) || has(a.summary)).slice(0, 3).map((a): SearchEntity => ({ group: 'Learn', label: a.title, hint: a.section, href: learnHref(a.slug) }));
  return {
    more: [...exchanges, ...sectors, ...industries, ...newsHits, ...learnHits],
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

/* ------------------------------------------------------------------ connections (internal linking) */
export interface Connection { label: string; href: string; hint?: string }
export interface ConnectionGroup { title: string; items: Connection[] }
/**
 * Where an asset sits in the global map: market, exchange, sector, industry, home index, funds that hold it,
 * themes and research. Built only from covered data, so every link resolves to a real page.
 */
export async function getConnections(a: Asset): Promise<ConnectionGroup[]> {
  const [universe, themes, research, markets] = await Promise.all([getAssets(), getThemes(), getResearch(), getMarkets()]);
  const market = markets.find((m) => m.id === a.marketId);
  const groups: ConnectionGroup[] = [];
  const where: Connection[] = [];
  if (market) {
    where.push({ label: market.name, href: marketHref(market.slug), hint: 'Market' });
    const ex = market.exchanges.find((e) => e.mic === a.mic);
    if (ex) where.push({ label: ex.name, href: marketHref(market.slug), hint: `${ex.mic} · ${ex.timezone}` });
    const country = research.find((d) => d.kind === 'countries' && d.marketId === market.id);
    if (country) where.push({ label: `${market.name}: country research`, href: `/research/countries/${country.slug}`, hint: 'Research' });
  }
  if (a.sector) {
    where.push({ label: `${a.sector} on the heatmap`, href: `/discover/heatmap?group=sector&path=${encodeURIComponent(a.sector)}`, hint: 'Sector' });
    const sec = research.find((d) => d.kind === 'sectors' && d.sector === a.sector);
    if (sec) where.push({ label: `${a.sector} across markets`, href: `/research/sectors/${sec.slug}`, hint: 'Sector research' });
  }
  if (a.industry) where.push({ label: a.industry, href: `/discover/heatmap?group=industry&path=${encodeURIComponent(a.industry)}`, hint: 'Industry' });
  if (where.length) groups.push({ title: 'Where it sits', items: where });
  const index = universe.find((x) => x.cls === 'index' && x.marketId === a.marketId && x.id !== a.id);
  const funds: Connection[] = [];
  if (index && a.cls !== 'fx') funds.push({ label: index.name, href: assetHref(index), hint: 'Home market index' });
  if (a.cls === 'stock' || a.cls === 'reit') {
    const etfs = universe.filter((x) => x.cls === 'etf');
    const holders = await Promise.all(etfs.map(async (e) => ({ e, h: await p().getETFHoldings(e.id).catch(() => null) })));
    holders.filter(({ h }) => h?.some((x) => x.slug === a.slug)).slice(0, 5).forEach(({ e, h }) => funds.push({ label: `${e.name} (${e.symbol})`, href: assetHref(e), hint: `${h!.find((x) => x.slug === a.slug)!.weight.toFixed(1)}% weight` }));
  }
  if (a.cls === 'etf' && a.etf) {
    const bench = universe.find((x) => x.cls === 'index' && a.etf!.benchmark.toLowerCase().includes(x.name.toLowerCase().replace(/ composite| index/g, '')));
    if (bench) funds.push({ label: bench.name, href: assetHref(bench), hint: 'Benchmark index' });
    universe.filter((x) => x.cls === 'etf' && x.id !== a.id && x.etf?.strategy === a.etf!.strategy).slice(0, 4).forEach((x) => funds.push({ label: `${x.name} (${x.symbol})`, href: assetHref(x), hint: 'Same strategy' }));
  }
  if (funds.length) groups.push({ title: a.cls === 'etf' ? 'Benchmark and similar funds' : 'Indices and funds', items: funds });
  const inThemes = themes.filter((t) => t.assetIds.includes(a.id));
  if (inThemes.length) groups.push({ title: 'Themes', items: inThemes.map((t) => ({ label: t.name, href: `/discover/collections/${t.id}`, hint: `${t.assetIds.length} assets` })) });
  if (a.cls === 'fx' && a.fx) {
    const ms = markets.filter((m) => m.currency === a.fx!.base || m.currency === a.fx!.quote);
    if (ms.length) groups.push({ title: 'Markets priced in these currencies', items: ms.map((m) => ({ label: m.name, href: marketHref(m.slug), hint: m.currency })) });
  }
  return groups;
}
