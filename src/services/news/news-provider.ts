import type { Region } from '@/lib/types';
import { configured, serverEnv } from '@/lib/server-env';
import * as md from '@/services/market-data';
import { ProviderError } from '@/services/providers/http';
import { newsData, type ProviderParams, type RawNewsSource, type RawPage } from './newsio';
import type { NewsArticle, NewsQuery, NewsSection, NewsTopic, RawArticle } from './news-types';

/**
 * Maps a validated INRGIFT NewsQuery to bounded provider parameters, and chooses the source: NewsData.io when
 * NEWSIO_API_KEY is set, otherwise a demo fixture (labelled DEMO in the UI). Browser input never reaches the provider
 * unvalidated: sections, regions and markets map to fixed parameter sets; search text is reduced to a safe charset.
 */
export const SECTIONS: Record<NewsSection, { label: string; params: Omit<ProviderParams, 'size'>; topics?: NewsTopic[]; needsCompany?: boolean; sort: 'relevance' | 'latest'; terms?: string[] }> = {
  'most-relevant': { label: 'Top stories', params: { category: ['business'] }, sort: 'relevance' },
  latest: { label: 'Latest', params: { category: ['business'] }, sort: 'latest' },
  'global-markets': { label: 'Markets', params: { category: ['business'], q: 'stocks OR markets OR equities' }, topics: ['equities', 'indices', 'markets'], sort: 'relevance' },
  stocks: { label: 'Stocks', params: { category: ['business'], q: 'stocks OR shares OR equities' }, topics: ['equities'], sort: 'relevance' },
  india: { label: 'India markets', params: { category: ['business'], country: ['in'] }, sort: 'relevance' },
  us: { label: 'US markets', params: { category: ['business'], country: ['us'] }, sort: 'relevance' },
  europe: { label: 'Europe', params: { category: ['business'], country: ['gb', 'de', 'fr', 'it', 'es'] }, sort: 'relevance' },
  'asia-pacific': { label: 'Asia-Pacific', params: { category: ['business'], country: ['jp', 'cn', 'hk', 'sg', 'au'] }, sort: 'relevance' },
  fx: { label: 'FX', params: { q: 'currency OR rupee OR forex OR "exchange rate"' }, topics: ['fx'], sort: 'relevance' },
  commodities: { label: 'Commodities', params: { q: 'oil OR gold OR crude OR commodities OR copper' }, topics: ['commodities'], sort: 'relevance' },
  bonds: { label: 'Bonds & rates', params: { q: 'bond OR yields OR treasury' }, topics: ['bonds'], sort: 'relevance' },
  etfs: { label: 'ETFs', params: { q: 'ETF OR "exchange-traded fund" OR "index fund"' }, topics: ['etfs'], sort: 'relevance' },
  indices: { label: 'Indices', params: { q: 'Sensex OR Nifty OR "S&P 500" OR Nasdaq OR "stock index"' }, topics: ['indices'], sort: 'relevance' },
  companies: { label: 'Companies', params: { category: ['business'] }, needsCompany: true, sort: 'relevance' },
  earnings: { label: 'Earnings', params: { q: 'earnings OR "quarterly results" OR profit' }, topics: ['earnings'], sort: 'relevance' },
  dividends: { label: 'Dividends', params: { q: 'dividend OR dividends OR payout' }, topics: ['corporate-actions'], terms: ['dividend', 'dividends', 'payout', 'payouts'], sort: 'relevance' },
  ipo: { label: 'IPO', params: { q: 'IPO OR listing' }, topics: ['ipo'], sort: 'relevance' },
  mergers: { label: 'M&A', params: { q: 'merger OR acquisition OR takeover' }, topics: ['corporate-actions'], terms: ['merger', 'mergers', 'acquisition', 'acquisitions', 'acquire', 'acquires', 'acquired', 'takeover', 'm&a', 'buyout'], sort: 'relevance' },
  macro: { label: 'Economy & macro', params: { q: 'inflation OR GDP OR economy' }, topics: ['macro'], sort: 'relevance' },
  'central-banks': { label: 'Central banks', params: { q: '"central bank" OR "interest rate" OR RBI OR "Federal Reserve" OR ECB' }, topics: ['central-banks'], sort: 'relevance' },
  'politics-markets': { label: 'Politics & markets', params: { category: ['politics', 'business'] }, topics: ['politics-markets'], sort: 'relevance' },
  geopolitics: { label: 'Geopolitics & markets', params: { category: ['world', 'politics'], q: 'sanctions OR tariffs OR oil OR trade OR shipping' }, topics: ['geopolitics'], sort: 'relevance' },
  regulation: { label: 'Regulation', params: { q: 'regulator OR SEBI OR SEC OR regulation' }, topics: ['regulation'], sort: 'relevance' },
  trade: { label: 'Trade & tariffs', params: { q: 'tariff OR tariffs OR trade' }, topics: ['trade'], sort: 'relevance' },
  'supply-chain': { label: 'Supply chain', params: { q: '"supply chain" OR shipping OR freight' }, topics: ['trade'], terms: ['supply chain', 'supply chains', 'shipping', 'freight', 'logistics', 'shortage', 'shortages'], sort: 'relevance' },
  'trade-regulation': { label: 'Trade & regulation', params: { q: 'tariff OR trade OR regulator OR SEBI' }, topics: ['trade', 'regulation'], sort: 'relevance' },
  'country-risk': { label: 'Sovereign & country risk', params: { q: '"credit rating" OR sovereign OR downgrade OR default' }, topics: ['bonds', 'geopolitics'], sort: 'relevance' },
};
/** Whole-word check for the sections that narrow a broad topic (dividends and M&A within corporate actions, supply chain within trade). */
const hasTerm = (text: string, terms: string[]) => terms.some((t) => new RegExp(`(?:^|[^a-z0-9&])${t.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?=$|[^a-z0-9&])`, 'i').test(text));
const REGION_COUNTRIES: Partial<Record<Region, string[]>> = { 'North America': ['us', 'ca'], Europe: ['gb', 'de', 'fr', 'it', 'es'], 'Asia-Pacific': ['jp', 'cn', 'hk', 'sg', 'au'], 'Middle East': ['ae', 'sa'], 'Latin America': ['br', 'mx'], Africa: ['za'] };
/** INRGIFT market id → NewsData.io country code. */
const MARKET_COUNTRY: Record<string, string> = { uk: 'gb' };

/** Search text: letters, digits, spaces and a few symbols; 2–100 characters; quoted as a phrase for the provider. */
export function safeSearch(q: string | undefined): string | null {
  const s = (q ?? '').normalize('NFKC').replace(/[^\p{L}\p{N} &.'-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
  return s.length >= 2 ? s : null;
}
export async function providerParams(q: NewsQuery, pageSize: number): Promise<ProviderParams> {
  const s = SECTIONS[q.section];
  const p: ProviderParams = { ...s.params, size: pageSize };
  if (q.region && REGION_COUNTRIES[q.region]) p.country = REGION_COUNTRIES[q.region];
  if (q.market) { const m = await md.getMarket(q.market); if (m) p.country = [MARKET_COUNTRY[m.id] ?? m.id]; }
  if (q.company) { const a = await md.getAsset(undefined, q.company); if (a) p.q = `"${a.name.replace(/"/g, '')}"`; }
  const search = safeSearch(q.q);
  if (search) { p.q = `"${search}"`; delete p.category; }
  if (q.source && /^[a-z0-9_.-]{2,40}$/.test(q.source)) p.domain = q.source;
  if (q.hours) p.timeframeHours = q.hours;
  if (q.cursor && /^[A-Za-z0-9_-]{1,100}$/.test(q.cursor)) p.page = q.cursor;
  return p;
}
/** Local filters applied after classification (provider filters are coarse). */
export function matches(a: NewsArticle, q: NewsQuery): boolean {
  const s = SECTIONS[q.section];
  if (s.topics && !s.topics.some((t) => a.derived.topics.includes(t))) return false;
  if (s.needsCompany && !a.derived.companies.length) return false;
  if (s.terms && !hasTerm(`${a.title} ${a.description ?? ''}`, s.terms)) return false;
  if (q.topic && !a.derived.topics.includes(q.topic)) return false;
  if (q.assetClass && !a.derived.asset_classes.includes(q.assetClass)) return false;
  if (q.company && !a.derived.companies.some((c) => c.slug === q.company)) return false;
  if (q.relevance === 'high' && a.derived.market_relevance !== 'high') return false;
  return true;
}

/* ------------------------------------------- Sources ------------------------------------------- */
/**
 * Demo source: DemoProvider headlines plus three clearly irrelevant fixture items, so the relevance filter can be seen
 * working without a key. The query "provider-outage-test" simulates a provider failure (demo only).
 */
const OFF_TOPIC_FIXTURES: [string, string, string][] = [
  ['Demo: Cricket league final draws record television audience', 'A sports result with no market or company link.', 'sports'],
  ['Demo: Film star announces wedding date', 'Celebrity news with no market relevance.', 'entertainment'],
  ['Demo: Ten weekend recipes for the monsoon', 'Lifestyle content with no market relevance.', 'food'],
];
export const demoSource: RawNewsSource = {
  name: 'demo',
  async latest(p): Promise<RawPage> {
    if (p.q && p.q.includes('provider-outage-test')) throw new ProviderError('demo', 'UNAVAILABLE');
    const items = await md.getNews();
    const now = Date.now();
    const raw: RawArticle[] = [
      ...items.map((n): RawArticle => ({ provider: 'demo', id: `demo_${n.id}`, title: n.headline, description: n.summary ?? null, url: n.url, image_url: null, source_id: 'inrgift-demo', source_name: `${n.publisher} (demo)`, source_url: null, source_priority: null, published_at: n.publishedAt, provider_fetched_at: null, language: 'english', countries: [], categories: ['business'], keywords: [n.category], provider_duplicate: null })),
      ...OFF_TOPIC_FIXTURES.map(([title, description, cat], i): RawArticle => ({ provider: 'demo', id: `demo_off_${i}`, title, description, url: `/news?demo=off-topic-${i}`, image_url: null, source_id: 'inrgift-demo', source_name: 'Demo fixture', source_url: null, source_priority: null, published_at: new Date(now - (i + 1) * 3600_000).toISOString(), provider_fetched_at: null, language: 'english', countries: [], categories: [cat], keywords: [], provider_duplicate: null })),
    ];
    const term = p.q?.replace(/"/g, '').toLowerCase();
    return { items: term ? raw.filter((r) => `${r.title} ${r.description}`.toLowerCase().includes(term)) : raw, nextPage: null };
  },
};
let override: RawNewsSource | null = null;
/** Tests inject a mocked provider here. */
export const setNewsSource = (s: RawNewsSource | null) => { override = s; };
export function newsSource(): RawNewsSource {
  if (override) return override;
  return configured.news() ? newsData({ apiKey: serverEnv.newsApiKey() }) : demoSource;
}
export const newsPageSize = () => Math.min(50, Math.max(1, Number(process.env.NEWSIO_PAGE_SIZE) || 10));
