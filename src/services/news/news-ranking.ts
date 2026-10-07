import type { NewsArticle, NewsFreshness } from './news-types';

/**
 * Deduplication and ranking.
 * Duplicates: same provider id, same normalised URL, or the same normalised headline from the same source within 36
 * hours (syndication and republishing). Different sources covering one event are kept: they are separate reports.
 * When duplicates collide the higher-relevance (then earlier) copy wins.
 */
const normUrl = (u: string) => { try { const x = new URL(u); x.hash = ''; ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid', 'gclid'].forEach((p) => x.searchParams.delete(p)); return `${x.hostname.replace(/^www\./, '')}${x.pathname.replace(/\/$/, '')}${x.search}`.toLowerCase(); } catch { return u.toLowerCase(); } };
export const normTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\b(the|a|an|live|update|updates|breaking)\b/g, ' ').replace(/\s+/g, ' ').trim();
const ms = (s: string | null) => (s ? new Date(s).getTime() : 0);

export function dedupe(list: NewsArticle[]): NewsArticle[] {
  const better = (a: NewsArticle, b: NewsArticle) => a.derived.relevance_score > b.derived.relevance_score || (a.derived.relevance_score === b.derived.relevance_score && ms(a.published_at) < ms(b.published_at));
  const keep = new Map<string, NewsArticle>();
  const alias = new Map<string, string>();
  for (const a of list) {
    const keys = [`id:${a.article_id}`, `url:${normUrl(a.url)}`, `t:${(a.source_id ?? a.source_name ?? '').toLowerCase()}|${normTitle(a.title)}`];
    const hit = keys.map((k) => alias.get(k)).find(Boolean);
    if (hit) {
      const prev = keep.get(hit)!;
      const sameStoryWindow = Math.abs(ms(prev.published_at) - ms(a.published_at)) <= 36 * 3600_000 || !prev.published_at || !a.published_at;
      if (keys.slice(0, 2).some((k) => alias.get(k) === hit) || sameStoryWindow) {
        if (better(a, prev)) keep.set(hit, a);
        keys.forEach((k) => alias.set(k, hit));
        continue;
      }
    }
    keep.set(a.article_id, a);
    keys.forEach((k) => alias.set(k, a.article_id));
  }
  return [...keep.values()];
}

/** INRGIFT ranking score: relevance first, then recency (half-life 12 h), then source priority where provided. */
export function rankScore(a: NewsArticle, now = Date.now()): number {
  const ageH = a.published_at ? Math.max(0, (now - ms(a.published_at)) / 3600_000) : 48;
  const recency = 4 * Math.pow(0.5, ageH / 12);
  const entities = Math.min(a.derived.companies.length + a.derived.markets.length, 3) * 0.5;
  const source = a.source_priority ? Math.max(0, 1 - Math.log10(a.source_priority) / 6) : 0;
  return a.derived.relevance_score + recency + entities + source;
}
export function rank(list: NewsArticle[], mode: 'relevance' | 'latest', now = Date.now()): NewsArticle[] {
  return [...list].sort((a, b) => (mode === 'latest' ? ms(b.published_at) - ms(a.published_at) : rankScore(b, now) - rankScore(a, now)) || a.article_id.localeCompare(b.article_id));
}
/** Based on the provider's publish time only. "Live" is never claimed: NewsData.io is a polled feed. */
export function freshness(publishedAt: string | null, now = Date.now()): NewsFreshness | null {
  if (!publishedAt) return null;
  const h = (now - ms(publishedAt)) / 3600_000;
  return h <= 2 ? 'recent' : h <= 24 ? 'today' : 'older';
}
