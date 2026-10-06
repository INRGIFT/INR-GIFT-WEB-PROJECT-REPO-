import type { Allocations, Asset, AssetClass, CalendarEvent, Candle, ChartRange, CorporateAction, DataMeta, Dividend, Fundamentals, Holding, MarketView, MetricKey, NewsItem, ResearchDoc, Technicals, Theme } from '@/lib/types';

export interface AssetQuery { cls?: AssetClass[]; marketId?: string; region?: string; sector?: string; ids?: string[] }
export interface Quote { instrumentId: string; price: number | null; prevClose: number | null; change: number | null; changePct: number | null; currency: string; meta: DataMeta }
export interface NewsQuery { assetId?: string; marketId?: string; category?: string; limit?: number }

/**
 * The single contract between INRGIFT and any market-data vendor.
 * A real vendor is connected by implementing this interface in src/providers/real and
 * setting MARKET_DATA_PROVIDER=real. No page, component or API route changes.
 *
 * Conventions every implementation must follow:
 *  - identify instruments by the immutable internal id (`ins_…`), never by ticker;
 *  - return `null` when the source has no data, and throw ProviderError for failures;
 *  - attach DataMeta (source, timestamp, timezone, ingestedAt, dataStatus) to quotes and assets.
 */
export interface MarketDataProvider {
  readonly name: string;
  searchAssets(query: string, limit?: number): Promise<Asset[]>;
  listAssets(query?: AssetQuery): Promise<Asset[]>;
  getAsset(idOrSlug: string, cls?: AssetClass): Promise<Asset | null>;
  getQuote(id: string): Promise<Quote | null>;
  getOHLCV(id: string, range: ChartRange): Promise<Candle[] | null>;
  getFundamentals(id: string): Promise<Fundamentals | null>;
  getValuation(id: string): Promise<Partial<Record<MetricKey, number | null>> | null>;
  getTechnicals(id: string): Promise<Technicals | null>;
  getDividends(id: string): Promise<Dividend[] | null>;
  getCorporateActions(id: string): Promise<CorporateAction[] | null>;
  getETFProfile(id: string): Promise<Asset['etf'] | null>;
  getETFHoldings(id: string): Promise<Holding[] | null>;
  getETFAllocations(id: string): Promise<Allocations | null>;
  getIndexData(): Promise<Asset[]>;
  getFX(): Promise<Asset[]>;
  getCommodities(): Promise<Asset[]>;
  getBonds(): Promise<Asset[]>;
  getREITs(): Promise<Asset[]>;
  getNews(query?: NewsQuery): Promise<NewsItem[]>;
  getMarket(idOrSlug: string): Promise<MarketView | null>;
  getMarketSessions(): Promise<MarketView[]>;
  getResearch(): Promise<ResearchDoc[]>;
  getThemes(): Promise<Theme[]>;
  getCalendar(): Promise<CalendarEvent[]>;
}

export class ProviderError extends Error {
  constructor(public code: 'DATA_UNAVAILABLE' | 'PROVIDER_ERROR' | 'NOT_CONFIGURED' | 'NOT_ENTITLED', message: string) { super(message); }
}
