import { json, ProviderError, request, statusCode, type Fetch } from '@/services/providers/http';
import type { RawArticle } from './news-types';

/**
 * "News IO" provider = NewsData.io (newsdata.io/documentation). Server only.
 *   Endpoint  GET https://newsdata.io/api/1/latest   (the latest 48 hours)
 *   Auth      header X-ACCESS-KEY: <NEWSIO_API_KEY>   (documented alternative to ?apikey=, keeps the key out of URLs)
 *   Params    q (≤512 chars), country (≤5 codes), category (≤5), language, timeframe (1–48 h), domain (≤5),
 *             size (1–50; free plans 10), page (the previous response's nextPage), removeduplicate=1
 *   Response  { status: "success", totalResults, results: [...], nextPage }
 *   Errors    400 parameter missing · 401 unauthorized key · 403 IP/domain restricted · 409 duplicate parameter ·
 *             415 unsupported type · 422 unprocessable · 429 too many requests · 500 server error
 * INRGIFT never forwards browser parameters directly: NewsQuery is validated and mapped in news-provider.ts.
 */
export interface ProviderParams { q?: string; category?: string[]; country?: string[]; timeframeHours?: number; domain?: string; page?: string; size: number }
export interface RawPage { items: RawArticle[]; nextPage: string | null }
export interface RawNewsSource { readonly name: 'newsdata.io' | 'demo'; latest(p: ProviderParams): Promise<RawPage> }
const NAME = 'newsdata.io';
const BASE = 'https://newsdata.io/api/1/latest';

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && Boolean(x.trim())).map((x) => x.trim()) : []);
/** NewsData.io pubDate is "YYYY-MM-DD HH:MM:SS" in pubDateTZ (UTC unless a timezone parameter is sent; INRGIFT sends none). */
export function toIsoUtc(pubDate: unknown, tz: unknown): string | null {
  const s = str(pubDate);
  if (!s || !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s)) return null;
  if (tz !== undefined && tz !== null && tz !== 'UTC') return null; // unknown offset: do not guess
  const d = new Date(`${s.replace(' ', 'T')}Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
export function parseNewsData(body: unknown): RawPage {
  const b = body as { status?: unknown; results?: unknown; nextPage?: unknown } | null;
  if (!b || b.status !== 'success' || !Array.isArray(b.results)) throw new ProviderError(NAME, 'MALFORMED');
  const items = b.results.map((r): RawArticle => {
    const a = (r ?? {}) as Record<string, unknown>;
    return {
      provider: 'newsdata.io',
      id: str(a.article_id), title: str(a.title), description: str(a.description), url: str(a.link), image_url: str(a.image_url),
      source_id: str(a.source_id), source_name: str(a.source_name), source_url: str(a.source_url),
      source_priority: typeof a.source_priority === 'number' ? a.source_priority : null,
      published_at: toIsoUtc(a.pubDate, a.pubDateTZ), provider_fetched_at: toIsoUtc(a.fetched_at, 'UTC'),
      language: str(a.language), countries: arr(a.country), categories: arr(a.category), keywords: arr(a.keywords),
      provider_duplicate: typeof a.duplicate === 'boolean' ? a.duplicate : null,
    };
  });
  return { items, nextPage: str(b.nextPage) };
}

export function newsData(opts: { apiKey: string; fetchImpl?: Fetch; timeoutMs?: number }): RawNewsSource {
  if (!opts.apiKey) throw new ProviderError(NAME, 'NOT_CONFIGURED');
  return {
    name: 'newsdata.io',
    async latest(p) {
      const u = new URL(BASE);
      u.searchParams.set('language', 'en');
      u.searchParams.set('removeduplicate', '1');
      u.searchParams.set('size', String(Math.min(50, Math.max(1, p.size))));
      if (p.q) u.searchParams.set('q', p.q.slice(0, 512));
      if (p.category?.length) u.searchParams.set('category', p.category.slice(0, 5).join(','));
      if (p.country?.length) u.searchParams.set('country', p.country.slice(0, 5).join(','));
      if (p.timeframeHours) u.searchParams.set('timeframe', String(Math.min(48, Math.max(1, Math.round(p.timeframeHours)))));
      if (p.domain) u.searchParams.set('domain', p.domain);
      if (p.page) u.searchParams.set('page', p.page);
      const res = await request(NAME, u.toString(), { method: 'GET', headers: { 'X-ACCESS-KEY': opts.apiKey, Accept: 'application/json' }, fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 8000 });
      const code = statusCode(res.status);
      if (code) {
        let quota = false;
        try { const e = (await res.json()) as { results?: { message?: string; code?: string } }; quota = /credit|quota/i.test(`${e?.results?.message ?? ''} ${e?.results?.code ?? ''}`); } catch { /* body is optional */ }
        throw new ProviderError(NAME, quota ? 'QUOTA' : code, res.status);
      }
      return parseNewsData(await json(NAME, res));
    },
  };
}
