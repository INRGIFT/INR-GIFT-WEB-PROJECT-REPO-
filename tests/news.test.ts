import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as md from '@/services/market-data';
import { ProviderError } from '@/services/providers/http';
import { buildEntityIndex, classify, type EntityIndex } from '@/services/news/news-filter';
import { normalize } from '@/services/news/news-normalizer';
import { providerParams, safeSearch, setNewsSource } from '@/services/news/news-provider';
import { parseNewsQuery } from '@/services/news/news-query';
import { dedupe, freshness, rank } from '@/services/news/news-ranking';
import { clearNewsCache, getNews } from '@/services/news/news-service';
import { newsData, parseNewsData, toIsoUtc, type ProviderParams, type RawNewsSource } from '@/services/news/newsio';
import type { RawArticle } from '@/services/news/news-types';

let idx: EntityIndex;
beforeAll(async () => { idx = buildEntityIndex(await md.getAssets(), await md.getMarkets()); });
afterEach(() => { setNewsSource(null); clearNewsCache(); });
const NOW = Date.parse('2026-10-07T10:00:00Z');
const raw = (title: string, over: Partial<RawArticle> = {}): RawArticle => ({ provider: 'newsdata.io', id: title.slice(0, 20), title, description: null, url: `https://news.example.com/${encodeURIComponent(title)}`, image_url: null, source_id: 'example', source_name: 'Example', source_url: null, source_priority: 1000, published_at: '2026-10-07T08:00:00.000Z', provider_fetched_at: null, language: 'english', countries: [], categories: [], keywords: [], provider_duplicate: false, ...over });
const rel = (title: string, over: Partial<RawArticle> = {}) => classify({ ...raw(title, over), title }, idx);
const KEY = 'pub_newsdata_secret';
const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const SAMPLE = { status: 'success', totalResults: 2, nextPage: '1791217792003844960', results: [
  { article_id: 'a1', title: 'RBI holds repo rate; rupee steadies as bond yields ease', link: 'https://www.cnbc.com/a1?utm_source=x', description: 'The Reserve Bank of India kept rates unchanged.', pubDate: '2026-10-06 02:29:06', pubDateTZ: 'UTC', fetched_at: '2026-10-06 02:33:20', image_url: 'https://image.cnbcfm.com/a1.jpg', source_id: 'cnbc', source_name: 'Cnbc', source_url: 'http://cnbc.com', source_priority: 554, country: ['india'], category: ['business'], language: 'english', keywords: ['economy'], duplicate: false },
  { article_id: 'a2', title: 'Film star announces wedding date', link: 'https://celeb.example.com/a2', description: null, pubDate: '2026-10-06 03:00:00', pubDateTZ: 'UTC', source_id: 'celeb', source_name: 'Celeb', category: ['entertainment'], country: ['india'], language: 'english' },
] };

describe('NewsData.io adapter ("News IO")', () => {
  it('calls GET /api/1/latest with the key in the X-ACCESS-KEY header only, and bounded parameters', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const f = (async (url: string, init?: RequestInit) => { calls.push({ url, init }); return res(200, SAMPLE); }) as unknown as typeof fetch;
    const page = await newsData({ apiKey: KEY, fetchImpl: f }).latest({ size: 80, q: 'x'.repeat(600), country: ['in', 'us', 'gb', 'de', 'fr', 'jp'], category: ['business'], timeframeHours: 99, page: 'abc' });
    const u = new URL(calls[0].url);
    expect(`${u.origin}${u.pathname}`).toBe('https://newsdata.io/api/1/latest');
    expect(calls[0].url).not.toContain(KEY);
    expect((calls[0].init?.headers as Record<string, string>)['X-ACCESS-KEY']).toBe(KEY);
    expect(u.searchParams.get('size')).toBe('50');
    expect(u.searchParams.get('q')).toHaveLength(512);
    expect(u.searchParams.get('country')!.split(',')).toHaveLength(5);
    expect(u.searchParams.get('timeframe')).toBe('48');
    expect(u.searchParams.get('removeduplicate')).toBe('1');
    expect(u.searchParams.get('page')).toBe('abc');
    expect(page.nextPage).toBe('1791217792003844960');
    expect(page.items[0]).toMatchObject({ id: 'a1', source_name: 'Cnbc', published_at: '2026-10-06T02:29:06.000Z', countries: ['india'], categories: ['business'] });
  });
  it('maps documented errors (401, 403, 409, 422, 429, 500), quota, timeout and malformed responses, without the key', async () => {
    const cases: [number, unknown, string][] = [[401, {}, 'INVALID_KEY'], [403, {}, 'INVALID_KEY'], [409, {}, 'REJECTED'], [422, {}, 'REJECTED'], [429, { status: 'error', results: { message: 'Rate limit exceeded' } }, 'RATE_LIMITED'], [429, { status: 'error', results: { message: 'API credits exhausted' } }, 'QUOTA'], [500, {}, 'UNAVAILABLE'], [200, { status: 'success' }, 'MALFORMED'], [200, '<html>', 'MALFORMED']];
    for (const [status, body, code] of cases) {
      const f = (async () => (typeof body === 'string' ? new Response(body, { status }) : res(status, body))) as unknown as typeof fetch;
      const err = await newsData({ apiKey: KEY, fetchImpl: f }).latest({ size: 10 }).catch((e) => e);
      expect(err).toBeInstanceOf(ProviderError); expect(err.code).toBe(code); expect(String(err.message)).not.toContain(KEY);
    }
    const hang = (async (_u: string, init?: RequestInit) => new Promise((_, rej) => init?.signal?.addEventListener('abort', () => rej(Object.assign(new Error('x'), { name: 'AbortError' }))))) as unknown as typeof fetch;
    expect((await newsData({ apiKey: KEY, fetchImpl: hang, timeoutMs: 20 }).latest({ size: 10 }).catch((e) => e)).code).toBe('TIMEOUT');
  });
  it('empty results and unknown time zones are handled honestly', () => {
    expect(parseNewsData({ status: 'success', results: [], nextPage: null })).toEqual({ items: [], nextPage: null });
    expect(toIsoUtc('2026-10-06 02:29:06', 'Asia/Kolkata')).toBeNull();
    expect(toIsoUtc('yesterday', 'UTC')).toBeNull();
  });
});

describe('relevance engine', () => {
  it('market and macro stories are HIGH; entertainment and sport are LOW', () => {
    expect(rel('RBI holds repo rate; rupee steadies as bond yields ease', { categories: ['business'] }).market_relevance).toBe('high');
    expect(rel('Sensex and Nifty rally as IT stocks gain on strong earnings').market_relevance).toBe('high');
    expect(rel('Film star announces wedding date', { categories: ['entertainment'] }).market_relevance).toBe('low');
    expect(rel('Cricket league final draws record audience', { categories: ['sports'] }).market_relevance).toBe('low');
    expect(rel('Ten weekend recipes for the monsoon').market_relevance).toBe('low');
  });
  it('a sports business story with a strong market core is not blindly removed', () => {
    expect(rel('Football club files for IPO, plans listing on NYSE as shares priced', { categories: ['business'] }).market_relevance).not.toBe('low');
  });
  it('politics counts only with a market link', () => {
    const tariff = rel('Government raises tariffs on steel imports; metal stocks fall', { categories: ['politics'] });
    expect(tariff.market_relevance).not.toBe('low'); expect(tariff.topics).toContain('politics-markets');
    const gossip = rel('Minister trades insults with opposition leader at rally', { categories: ['politics'] });
    expect(gossip.market_relevance).toBe('low'); expect(gossip.reasons.join(' ')).toContain('politics without market link');
    expect(rel('Election result points to wider fiscal deficit, bond yields jump', { categories: ['politics'] }).market_relevance).not.toBe('low');
  });
  it('geopolitics counts only with an economic channel', () => {
    const oil = rel('Sanctions on exporter push crude oil and Brent prices higher', { categories: ['world'] });
    expect(oil.market_relevance).not.toBe('low'); expect(oil.topics).toContain('geopolitics');
    expect(rel('Military parade held in capital city', { categories: ['world'] }).market_relevance).toBe('low');
  });
  it('matches companies conservatively and never guesses tickers', () => {
    expect(rel('Reliance Industries quarterly profit beats estimates').companies.map((c) => c.symbol)).toContain('RELIANCE');
    expect(rel('Apple pie festival draws crowds').companies).toEqual([]);
    expect(rel('Apple Inc reports record revenue').companies.map((c) => c.symbol)).toContain('AAPL');
    const t = rel('Shares of (NASDAQ: AAPL) rose after the update');
    expect(t.tickers).toEqual(['AAPL']);
    expect(rel('The CEO said AI will change everything').tickers).toEqual([]);
  });
  it('detects markets and regions from canonical names', () => {
    const r = rel('Japan stocks slip as yen strengthens');
    expect(r.markets.map((m) => m.slug)).toContain('Japan'); expect(r.regions).toContain('Asia-Pacific'); expect(r.topics).toContain('fx');
  });
});

describe('normalisation, dedup and ranking', () => {
  it('drops unusable items and unsafe links, keeps provider values as given', () => {
    expect(normalize(raw(''), idx, 'now')).toBeNull();
    expect(normalize(raw('Stocks rally', { url: 'javascript:alert(1)' }), idx, 'now')).toBeNull();
    const a = normalize(raw('Stocks <b>rally</b>', { image_url: 'ftp://x/y.png' }), idx, '2026-10-07T10:00:00Z')!;
    expect(a.title).toBe('Stocks rally'); expect(a.image_url).toBeNull(); expect(a.retrieved_at).toBe('2026-10-07T10:00:00Z');
  });
  it('removes duplicates (provider id, tracking URL variants, syndicated headline) but keeps other sources', () => {
    const n = (r: RawArticle) => normalize(r, idx, 'now')!;
    const list = [
      n(raw('Nifty hits record high', { id: 'x1', url: 'https://a.com/nifty?utm_source=t' })),
      n(raw('Nifty hits record high', { id: 'x2', url: 'https://www.a.com/nifty' })),
      n(raw('Nifty hits record high', { id: 'x3', url: 'https://a.com/syndicated-copy', source_id: 'example' })),
      n(raw('Nifty hits record high', { id: 'x4', url: 'https://b.com/nifty', source_id: 'other', source_name: 'Other' })),
    ];
    expect(dedupe(list).map((a) => a.article_id).sort()).toEqual(['x1', 'x4']);
  });
  it('ranks by relevance then recency; freshness comes from timestamps only', () => {
    const a = normalize(raw('Sensex rallies as RBI cuts repo rate and bond yields fall', { published_at: '2026-10-06T10:00:00Z' }), idx, 'now')!;
    const b = normalize(raw('Company opens new office', { published_at: '2026-10-07T09:30:00Z' }), idx, 'now')!;
    expect(rank([b, a], 'relevance', NOW)[0]).toBe(a);
    expect(rank([a, b], 'latest', NOW)[0]).toBe(b);
    expect(freshness('2026-10-07T09:00:00Z', NOW)).toBe('recent');
    expect(freshness(null, NOW)).toBeNull();
  });
});

describe('news service', () => {
  const source = (pages: (() => Promise<{ items: RawArticle[]; nextPage: string | null }>)[]) => {
    const calls: ProviderParams[] = [];
    const s: RawNewsSource = { name: 'newsdata.io', async latest(p) { calls.push(p); const next = pages.shift(); if (!next) throw new ProviderError('newsdata.io', 'UNAVAILABLE'); return next(); } };
    setNewsSource(s); return calls;
  };
  const items = [raw('RBI holds repo rate as rupee steadies; bond yields ease', { id: 'n1', categories: ['business'] }), raw('Film star announces wedding date', { id: 'n2', categories: ['entertainment'] })];
  it('filters irrelevant content, reports how many were hidden, and passes the cursor', async () => {
    source([async () => ({ items, nextPage: 'cur1' })]);
    const r = await getNews(parseNewsQuery({}));
    expect(r.articles.map((a) => a.article_id)).toEqual(['n1']);
    expect(r.excluded).toBe(1); expect(r.nextCursor).toBe('cur1'); expect(r.status).toBe('FRESH');
  });
  it('caches repeated requests (one provider call), and serves STALE when the provider later fails', async () => {
    const calls = source([async () => ({ items, nextPage: null })]);
    await getNews(parseNewsQuery({}), NOW);
    const second = await getNews(parseNewsQuery({}), NOW + 1000);
    expect(calls).toHaveLength(1); expect(second.status).toBe('CACHED');
    const stale = await getNews(parseNewsQuery({}), NOW + 3600_000);
    expect(stale.status).toBe('STALE'); expect(stale.articles).toHaveLength(1); expect(stale.notice).toBeTruthy();
  });
  it('provider unavailable with no cache: safe notice, no raw error', async () => {
    source([async () => { throw new ProviderError('newsdata.io', 'INVALID_KEY', 401); }]);
    const r = await getNews(parseNewsQuery({ section: 'fx' }));
    expect(r.status).toBe('UNAVAILABLE'); expect(r.articles).toEqual([]); expect(r.notice).not.toMatch(/401|key|newsdata/i);
  });
  it('empty provider results give an empty feed', async () => {
    source([async () => ({ items: [], nextPage: null })]);
    expect((await getNews(parseNewsQuery({ section: 'bonds' }))).articles).toEqual([]);
  });
  it('maps sections, regions, markets and search to bounded provider parameters', async () => {
    expect(await providerParams(parseNewsQuery({ section: 'india' }), 10)).toMatchObject({ country: ['in'], category: ['business'], size: 10 });
    expect((await providerParams(parseNewsQuery({ region: 'Europe' }), 10)).country).toEqual(['gb', 'de', 'fr', 'it', 'es']);
    expect((await providerParams(parseNewsQuery({ market: 'UK' }), 10)).country).toEqual(['gb']);
    const s = await providerParams(parseNewsQuery({ q: 'Infosys <script>" OR 1=1', hours: '24' }), 10);
    expect(s.q).toBe('"Infosys script OR 1 1"'); expect(s.timeframeHours).toBe(24); expect(s.category).toBeUndefined();
    expect(safeSearch('a')).toBeNull();
  });
  it('rejects unknown and out-of-range query values instead of forwarding them', () => {
    const q = parseNewsQuery({ section: 'nope', hours: '999', source: 'https://evil', cursor: '../../x', topic: 'sports', company: 'AAPL', extra: 'x' });
    expect(q).toEqual({ section: 'most-relevant', company: 'AAPL' });
  });
  it('topic sections keep only matching stories; company filter uses canonical entities', async () => {
    source([async () => ({ items: [raw('Gold prices climb as dollar weakens', { id: 'g' }), raw('Reliance Industries quarterly profit beats estimates', { id: 'r' })], nextPage: null }), async () => ({ items: [raw('Reliance Industries quarterly profit beats estimates', { id: 'r' }), raw('Gold prices climb as dollar weakens', { id: 'g' })], nextPage: null })]);
    expect((await getNews(parseNewsQuery({ section: 'commodities' }))).articles.map((a) => a.article_id)).toEqual(['g']);
    expect((await getNews(parseNewsQuery({ company: 'RELIANCE' }))).articles.map((a) => a.article_id)).toEqual(['r']);
  });
});
