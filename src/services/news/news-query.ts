import { z } from 'zod';
import type { NewsQuery, NewsSection, NewsTopic } from './news-types';
import { SECTIONS } from './news-provider';

/** The only way browser input becomes a NewsQuery: enumerated values, bounded strings, unknown keys dropped. */
const TOPICS: NewsTopic[] = ['markets', 'business', 'equities', 'macro', 'fx', 'commodities', 'bonds', 'etfs', 'indices', 'earnings', 'ipo', 'corporate-actions', 'central-banks', 'politics-markets', 'geopolitics', 'trade', 'regulation'];
const Schema = z.object({
  section: z.enum(Object.keys(SECTIONS) as [NewsSection, ...NewsSection[]]).catch('most-relevant'),
  topic: z.enum(TOPICS as [NewsTopic, ...NewsTopic[]]).optional().catch(undefined),
  region: z.enum(['North America', 'Latin America', 'Europe', 'Asia-Pacific', 'Middle East', 'Africa']).optional().catch(undefined),
  market: z.string().regex(/^[A-Za-z-]{2,30}$/).optional().catch(undefined),
  assetClass: z.enum(['stock', 'etf', 'index', 'fx', 'commodity', 'bond', 'reit']).optional().catch(undefined),
  company: z.string().regex(/^[A-Za-z0-9._-]{1,30}$/).optional().catch(undefined),
  source: z.string().regex(/^[a-z0-9_.-]{2,40}$/).optional().catch(undefined),
  hours: z.coerce.number().pipe(z.union([z.literal(6), z.literal(24), z.literal(48)])).optional().catch(undefined),
  relevance: z.enum(['high', 'medium']).optional().catch(undefined),
  q: z.string().max(100).optional().catch(undefined),
  cursor: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/).optional().catch(undefined),
});
export const NEWS_TOPICS = TOPICS;
export function parseNewsQuery(input: Record<string, string | string[] | undefined>): NewsQuery {
  const flat = Object.fromEntries(Object.entries(input).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]).filter(([, v]) => v !== undefined && v !== ''));
  return Schema.parse(flat) as NewsQuery;
}
