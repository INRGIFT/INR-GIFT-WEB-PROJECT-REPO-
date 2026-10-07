import { log } from '@/lib/telemetry/log';
import * as md from '@/services/market-data';
import { ProviderError } from '@/services/providers/http';
import { TtlCache } from './news-cache';
import { buildEntityIndex, type EntityIndex } from './news-filter';
import { normalize } from './news-normalizer';
import { matches, newsPageSize, newsSource, providerParams, safeSearch, SECTIONS } from './news-provider';
import { dedupe, rank } from './news-ranking';
import type { RawPage } from './newsio';
import type { NewsQuery, NewsResult } from './news-types';

/**
 * INRGIFT news service: UI/API → this service → provider adapter → normalisation → relevance filter → dedup/rank →
 * cache. Provider failures never throw to pages: they return STALE (last good result) or UNAVAILABLE with a safe
 * notice. News failures are isolated from auth, email and market data.
 */
const TTL = () => Math.max(60, Number(process.env.NEWSIO_CACHE_SECONDS) || 900) * 1000;
const cache = new TtlCache<{ page: RawPage; retrievedAt: string }>(TTL(), 6 * 3600_000);
export const clearNewsCache = () => cache.clear();
let index: { at: number; idx: EntityIndex } | null = null;
async function entityIndex(): Promise<EntityIndex> {
  if (index && Date.now() - index.at < 3600_000) return index.idx;
  const [assets, markets] = await Promise.all([md.getAssets(), md.getMarkets()]);
  index = { at: Date.now(), idx: buildEntityIndex(assets, markets) };
  return index.idx;
}
const NOTICE: Record<string, string> = {
  INVALID_KEY: 'News is temporarily unavailable.', QUOTA: 'News is paused for today: the news provider quota is used up.',
  RATE_LIMITED: 'News is busy right now. Try again in a few minutes.', TIMEOUT: 'The news provider did not respond in time.',
  NETWORK: 'The news provider could not be reached.', UNAVAILABLE: 'The news provider is unavailable right now.', MALFORMED: 'The news provider sent an unreadable response.',
};

export async function getNews(query: NewsQuery, now = Date.now()): Promise<NewsResult> {
  const source = newsSource();
  const params = await providerParams(query, newsPageSize());
  const key = `${source.name}|${JSON.stringify(params)}`;
  let entry = cache.fresh(key, now);
  let status: NewsResult['status'] = source.name === 'demo' ? 'DEMO' : 'CACHED';
  let notice: string | undefined;
  if (!entry) {
    try {
      const page = await source.latest(params);
      entry = { value: { page, retrievedAt: new Date(now).toISOString() }, at: now };
      cache.set(key, entry.value, now);
      if (source.name !== 'demo') status = 'FRESH';
    } catch (e) {
      const code = e instanceof ProviderError ? e.code : 'UNAVAILABLE';
      log('warn', 'news_provider_failed', { provider: source.name, code });
      notice = NOTICE[code] ?? NOTICE.UNAVAILABLE;
      entry = cache.stale(key, now);
      if (!entry) return { articles: [], nextCursor: null, status: 'UNAVAILABLE', provider: source.name, retrievedAt: null, notice, excluded: 0 };
      status = 'STALE';
    }
  }
  const idx = await entityIndex();
  const all = entry.value.page.items.map((r) => normalize(r, idx, entry!.value.retrievedAt)).filter((a): a is NonNullable<typeof a> => Boolean(a));
  const unique = dedupe(all);
  // LOW relevance is hidden in feeds. In a search it is kept only when the searched words are in the headline.
  const term = safeSearch(query.q)?.toLowerCase();
  const visible = unique.filter((a) => a.derived.market_relevance !== 'low' || (term ? a.title.toLowerCase().includes(term) && a.derived.relevance_score > 0 : false));
  const shown = visible.filter((a) => matches(a, query));
  return {
    articles: rank(shown, SECTIONS[query.section].sort, now),
    nextCursor: entry.value.page.nextPage, status, provider: source.name, retrievedAt: entry.value.retrievedAt, notice,
    excluded: unique.length - visible.length,
  };
}
