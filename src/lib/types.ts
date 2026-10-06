/** Domain types shared by providers, services, the API and the UI. Nothing here is provider-specific. */

export type DataStatus = 'LIVE' | 'DELAYED' | 'END_OF_DAY' | 'CLOSED' | 'UNAVAILABLE' | 'STALE' | 'ERROR';
export type AssetClass = 'stock' | 'etf' | 'index' | 'fx' | 'commodity' | 'bond' | 'reit' | 'fund';
export type SessionState = 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'POST_MARKET' | 'BREAK' | 'HOLIDAY';
export type Region = 'North America' | 'Latin America' | 'Europe' | 'Asia-Pacific' | 'Middle East' | 'Africa';
export type ChartRange = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '3Y' | '5Y' | 'MAX';

/** Provenance carried by every market-data payload. */
export interface DataMeta {
  timestamp: string;
  timezone: string;
  ingestedAt: string;
  source: string;
  dataStatus: DataStatus;
}

export interface Exchange {
  mic: string;
  name: string;
  timezone: string;
  /** Local wall-clock times, HH:MM. */
  open: string;
  close: string;
  breakStart?: string;
  breakEnd?: string;
  preOpen?: string;
  postClose?: string;
  /** ISO weekday numbers that trade, 1 = Monday. */
  tradingDays: number[];
  /** YYYY-MM-DD → holiday name. */
  holidays: Record<string, string>;
  /** YYYY-MM-DD → early close HH:MM. */
  halfDays?: Record<string, string>;
}

export interface Market {
  id: string;
  slug: string;
  name: string;
  region: Region;
  countryCode: string;
  currency: string;
  exchanges: Exchange[];
  /** What the data entitlement delivers while the market is open. */
  feed: 'LIVE' | 'DELAYED';
  /** Forces a status regardless of session, e.g. a source outage. */
  statusOverride?: DataStatus;
}

export interface MarketView extends Market {
  session: SessionState;
  holidayName?: string;
  dataStatus: DataStatus;
  localTime: string;
  /** Regular hours expressed as decimal hours in IST, for the session rail. */
  istOpen: number;
  istClose: number;
  assetCount: number;
  meta: DataMeta;
}

export type MetricKey =
  | 'd1' | 'w1' | 'm1' | 'm3' | 'm6' | 'ytd' | 'y1' | 'y3' | 'y5'
  | 'volume' | 'marketCap' | 'aum'
  | 'pe' | 'fpe' | 'pb' | 'evEbitda'
  | 'revenueGrowth' | 'epsGrowth' | 'grossMargin' | 'netMargin' | 'roe' | 'roic' | 'debtEquity'
  | 'dividendYield' | 'beta' | 'volatility' | 'maxDrawdown' | 'rsi' | 'sma50Gap'
  | 'expenseRatio' | 'holdingsCount' | 'yield' | 'duration' | 'coupon' | 'ffoYield' | 'occupancy';

/**
 * Normalized instrument. `id` is the immutable internal instrument_id; `slug` is the URL symbol.
 * In `m`, a missing key means "not applicable to this asset class"; `null` means "unavailable from source".
 */
export interface Asset {
  id: string;
  slug: string;
  symbol: string;
  name: string;
  cls: AssetClass;
  marketId: string;
  country: string;
  region: Region | 'Global';
  mic: string;
  exchange: string;
  currency: string;
  sector?: string;
  industry?: string;
  issuerId?: string;
  description: string;
  price: number | null;
  prevClose: number | null;
  m: Partial<Record<MetricKey, number | null>>;
  status: DataStatus;
  meta: DataMeta;
  crossListings?: { slug: string; symbol: string; exchange: string; cls: AssetClass }[];
  etf?: { strategy: string; benchmark: string; issuer: string; inception: string; assetMix: [string, number][] };
  bond?: { issuer: string; maturity: string; rating: string };
  reit?: { propertyType: string; geography: string };
  fx?: { base: string; quote: string };
  commodity?: { unit: string; reference: string };
  index?: { constituents: number };
}

/**
 * Instrument identity: Issuer → Security (share class or depositary receipt) → Listing (exchange MIC + ticker) →
 * provider symbols. Mirrors market.issuers / market.instruments / market.listings (migration 0002). Internal ids
 * (`ins_…`) are immutable; tickers live on listings and may change. Unknown identifiers are null, never guessed.
 */
export interface Issuer { id: string; name: string; country: string; sector?: string; industry?: string }
export interface Security {
  key: string; instrumentId: string | null; issuerId: string; name: string;
  /** e.g. "Class A", "Ordinary", "ADR". */
  shareClass: string; kind: 'ordinary' | 'adr' | 'gdr' | 'fund_unit';
  /** For depositary receipts: the ordinary share it represents and how many. */
  underlyingKey?: string; ratio?: string; isin: string | null;
}
export interface Listing {
  securityKey: string; instrumentId: string | null; mic: string; exchange: string; ticker: string; currency: string;
  primary: boolean; slug?: string; cls?: AssetClass;
  /** Whether the active data source prices this listing. Uncovered listings are shown as reference only. */
  covered: boolean; providerSymbols: { source: string; symbol: string }[];
}
export interface InstrumentIdentity { issuer: Issuer; securities: Security[]; listings: Listing[]; source: string }

export interface Candle { t: string; o: number; h: number; l: number; c: number; v: number }
export interface FinancialYear { year: number; revenue: number; netIncome: number; eps: number }
export interface Fundamentals { currency: string; years: FinancialYear[]; nextEarnings: string | null }
export interface Dividend { exDate: string; payDate: string; amount: number; currency: string }
export interface CorporateAction { date: string; type: 'Split' | 'Dividend' | 'Buyback' | 'Name change'; detail: string }
export interface Holding { name: string; symbol?: string; slug?: string; weight: number }
export interface Allocations { sectors: [string, number][]; countries: [string, number][] }
export interface Technicals { rsi: number | null; sma50: number | null; sma200: number | null; high52: number | null; low52: number | null; trend: 'Above both averages' | 'Between averages' | 'Below both averages' | null }

export interface NewsItem { id: string; headline: string; publisher: string; publishedAt: string; category: string; assetSlug?: string; assetCls?: AssetClass; assetSymbol?: string; marketId?: string; url: string }
export type ResearchKind = 'stocks' | 'etfs' | 'markets' | 'themes' | 'sectors' | 'countries';
/** A chart drawn from figures in the note itself (bars or diverging bars). Values are computed, never typed in. */
export interface ResearchChart { title: string; unit: '%' | '×' | 'bn USD'; kind: 'bar' | 'diverging'; bars: { label: string; value: number; href?: string }[]; note?: string }
export interface ResearchSource { label: string; href?: string }
/**
 * Research article. `sections` carry the analysis; the structured fields frame it. Fields marked optional are filled
 * with explicit defaults by the service layer (services/market-data.ts → structureDoc) so every article renders the
 * full structure: takeaways, why it matters, analysis, charts, tables, interpretation, limitations, methodology,
 * sources, author, reviewer, related assets/research, glossary and disclosure.
 * `author` is the desk, never an invented person; `reviewer` is null unless a named human reviewer exists.
 */
export interface ResearchDoc {
  id: string; slug: string; kind: ResearchKind; type: 'Structured research' | 'Market commentary' | 'Data insight' | 'Educational note';
  title: string; summary: string; topic: string; publishedAt: string;
  assetSlug?: string; assetCls?: AssetClass; assetSymbol?: string; marketId?: string; themeId?: string; sector?: string; country?: string;
  sections: { heading: string; body: string }[];
  keyTakeaways?: string[]; whyItMatters?: string; interpretation?: string; limitations?: string[]; methodology?: string;
  sources?: ResearchSource[]; charts?: ResearchChart[]; author?: string; reviewer?: string | null; disclosure?: string;
}
export interface Theme { id: string; name: string; description: string; assetIds: string[] }
export type CalendarKind = 'earnings' | 'dividend' | 'ipo' | 'holiday' | 'macro';
export interface CalendarEvent { id: string; kind: CalendarKind; date: string; title: string; detail: string; marketId?: string; assetSlug?: string; assetCls?: AssetClass; extra?: Record<string, string> }

export interface Pagination { page: number; pageSize: number; total: number; totalPages: number }
export interface Envelope<T> { data: T; meta: Pick<DataMeta, 'timestamp' | 'source' | 'dataStatus'> & Partial<DataMeta>; pagination?: Pagination }
export interface ErrorEnvelope { error: { code: string; message: string } }

/* ---- Private workspace rows (mirror supabase/migrations/0001_user_workspace.sql) ---- */
export interface WorkspaceTables {
  watchlists: { id: string; name: string; position: number; created_at: string };
  watchlist_items: { id: string; watchlist_id: string; instrument_id: string; position: number; created_at: string };
  alerts: { id: string; instrument_id: string; kind: string; threshold: number | null; status: 'active' | 'paused' | 'triggered'; channel: 'in_app' | 'email'; last_triggered_at: string | null; created_at: string; note?: string | null };
  saved_screens: { id: string; name: string; definition: string; universe: string; created_at: string };
  saved_comparisons: { id: string; name: string; instrument_ids: string[]; created_at: string };
  saved_research: { id: string; ref_type: 'document' | 'asset'; ref_id: string; title: string; href: string; tags: string[]; created_at: string };
  notes: { id: string; title: string; body: string; tags: string[]; instrument_id: string | null; created_at: string; updated_at: string };
  recent_history: { id: string; kind: 'asset' | 'screen' | 'comparison' | 'research'; title: string; href: string; created_at: string };
  notifications: { id: string; category: 'market' | 'research' | 'account' | 'system'; title: string; body: string; href: string | null; read: boolean; created_at: string; ref_id?: string | null };
  collections: { id: string; name: string; description: string; instrument_ids: string[]; created_at: string };
}
export type TableName = keyof WorkspaceTables;
export interface UserPrefs { currency: 'LOCAL' | 'INR'; timezone: string; locale: string; regions: string[]; assetClasses: string[]; themes: string[]; notifyEmail: boolean; notifyInApp: boolean; onboardedAt?: string | null }
