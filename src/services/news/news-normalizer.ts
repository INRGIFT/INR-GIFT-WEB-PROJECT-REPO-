import { createHash } from 'node:crypto';
import type { EntityIndex } from './news-filter';
import { classify } from './news-filter';
import type { NewsArticle, RawArticle } from './news-types';

/** Only http(s) links leave INRGIFT; anything else from a provider is dropped, never rewritten. */
const safeUrl = (u: string | null) => { if (!u) return null; try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.toString() : null; } catch { return null; } };
const clean = (s: string | null, max: number) => (s ? s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max) || null : null);

/**
 * Provider article → INRGIFT article. Provider values pass through (cleaned of markup, truncated); missing values stay
 * null. The id is the provider's article_id, else a stable hash of URL + title (marked with "h_").
 * Returns null for unusable items (no title or no valid link).
 */
export function normalize(raw: RawArticle, idx: EntityIndex, retrievedAt: string): NewsArticle | null {
  // Demo fixture items link inside INRGIFT; real provider items must be absolute http(s) links.
  const title = clean(raw.title, 300), url = raw.provider === 'demo' && raw.url?.startsWith('/') && !raw.url.startsWith('//') ? raw.url : safeUrl(raw.url);
  if (!title || !url) return null;
  const article_id = raw.id ?? `h_${createHash('sha256').update(`${url}|${title}`).digest('hex').slice(0, 24)}`;
  const rest = { ...raw, title, description: clean(raw.description, 600), image_url: safeUrl(raw.image_url), source_url: safeUrl(raw.source_url) };
  const { id: _id, url: _url, ...provider } = rest;
  return { ...provider, article_id, title, url, retrieved_at: retrievedAt, derived: classify({ ...raw, title }, idx) };
}
