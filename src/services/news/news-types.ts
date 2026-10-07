/**
 * INRGIFT's own news model. Provider fields are kept as the provider gave them (or null when absent); everything under
 * `derived` is computed by INRGIFT (relevance, topics, entities) and is labelled as such in the UI. Nothing is invented:
 * no fake authors, sources, tickers or timestamps.
 */
import type { AssetClass, Region } from '@/lib/types';

export type NewsTopic =
  | 'markets' | 'business' | 'equities' | 'macro' | 'fx' | 'commodities' | 'bonds' | 'etfs' | 'indices' | 'earnings'
  | 'ipo' | 'corporate-actions' | 'central-banks' | 'politics-markets' | 'geopolitics' | 'trade' | 'regulation';
export type NewsRelevance = 'high' | 'medium' | 'low';
export type NewsFreshness = 'recent' | 'today' | 'older';

/** One article as a provider returned it, before INRGIFT's classification. */
export interface RawArticle {
  provider: 'newsdata.io' | 'demo';
  id: string | null;
  title: string | null;
  description: string | null;
  url: string | null;
  image_url: string | null;
  source_id: string | null;
  source_name: string | null;
  source_url: string | null;
  /** NewsData.io: lower is a higher-traffic, more authentic domain. */
  source_priority: number | null;
  /** ISO 8601 UTC, already converted from the provider's own format. */
  published_at: string | null;
  provider_fetched_at: string | null;
  language: string | null;
  countries: string[];
  categories: string[];
  keywords: string[];
  provider_duplicate: boolean | null;
}

export interface NewsEntity { kind: 'company' | 'market' | 'currency' | 'commodity' | 'index' | 'etf'; id: string; name: string; href?: string }

export interface NewsArticle extends Omit<RawArticle, 'id' | 'title' | 'url'> {
  article_id: string;
  title: string;
  url: string;
  /** When INRGIFT retrieved it from the provider. */
  retrieved_at: string;
  derived: {
    topics: NewsTopic[];
    primary_topic: NewsTopic | null;
    regions: Region[];
    markets: { id: string; name: string; slug: string }[];
    companies: { id: string; name: string; slug: string; symbol: string }[];
    /** Tickers only where written explicitly with an exchange (e.g. "NASDAQ: AAPL"), never guessed from names. */
    tickers: string[];
    asset_classes: AssetClass[];
    entities: NewsEntity[];
    /** INRGIFT relevance score: a ranking aid for this product, not a measure of financial importance. */
    relevance_score: number;
    market_relevance: NewsRelevance;
    /** Plain reasons behind the score, for transparency and tests. */
    reasons: string[];
  };
}

export type NewsSection =
  | 'most-relevant' | 'latest' | 'global-markets' | 'india' | 'us' | 'europe' | 'asia-pacific' | 'fx' | 'commodities'
  | 'bonds' | 'companies' | 'earnings' | 'ipo' | 'macro' | 'central-banks' | 'politics-markets' | 'geopolitics'
  | 'trade-regulation' | 'country-risk';

/** A validated request from INRGIFT's UI or API. Never forwarded to the provider as-is. */
export interface NewsQuery {
  section: NewsSection;
  topic?: NewsTopic;
  region?: Region;
  /** INRGIFT market slug, e.g. "India". */
  market?: string;
  assetClass?: AssetClass;
  /** INRGIFT asset slug of a company. */
  company?: string;
  source?: string;
  /** Hours back: 6, 24 or 48 (NewsData.io latest covers up to 48 hours). */
  hours?: 6 | 24 | 48;
  relevance?: 'high' | 'medium';
  q?: string;
  /** Opaque provider cursor (NewsData.io nextPage). */
  cursor?: string;
}

/** FRESH: fetched now · CACHED: served from INRGIFT's cache · STALE: provider failed, last good result · DEMO: fixture data. */
export type NewsStatus = 'FRESH' | 'CACHED' | 'STALE' | 'DEMO' | 'UNAVAILABLE';
export interface NewsResult {
  articles: NewsArticle[];
  nextCursor: string | null;
  status: NewsStatus;
  provider: 'newsdata.io' | 'demo';
  retrievedAt: string | null;
  /** Safe, user-facing text when the provider failed; never raw provider errors. */
  notice?: string;
  /** Articles dropped as low relevance (shown as a count for transparency). */
  excluded: number;
}
