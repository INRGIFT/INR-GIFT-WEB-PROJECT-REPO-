import { ProviderError } from '../provider';

/**
 * NSE source adapter: the only code that talks to NSE (or to an NSE-authorised data vendor).
 *
 * NSE publishes no public REST API. Market data is licensed as products — real-time multicast feeds (leased line from
 * an NSE POP, or through an authorised vendor), periodic snapshot files over SFTP, 15-minute delayed snapshots over
 * FTP, and end-of-day / historical files — each under an agreement that fixes where and how the data may be displayed
 * (docs/CONNECTORS.md). The transport and wire format therefore depend on the product INRGIFT licenses, and no
 * endpoint, field name or credential is assumed here.
 *
 * To connect: implement `NseSource` against the licensed product's specification, return the normalised records
 * below, and construct it in `createNseSource()`. Credentials are read from server-only environment variables named
 * after that product; never `NEXT_PUBLIC_*`. Data flow: NSE → this adapter → NSEMarketDataProvider (normalisation,
 * validation) → fallback cache → services → /api/v1 → browser. The browser never contacts NSE.
 */

/** NSE trading symbol plus series (EQ, BE, …). Symbols are not unique without the series. */
export interface NseSymbol { symbol: string; series: string }
export interface NseSecurity extends NseSymbol {
  isin: string | null;
  name: string;
  /** Instrument type as classified by the licensed security master. */
  kind: 'equity' | 'etf' | 'index' | 'reit' | 'invit' | 'other';
  industry?: string | null;
}
export interface NseQuote extends NseSymbol {
  last: number | null;
  prevClose: number | null;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  volume?: number | null;
  /** Exchange timestamp of the last update (ISO 8601). Never the time INRGIFT received it. */
  exchangeTime: string;
  /** 0 for a real-time entitlement; 15 for the delayed product, etc. */
  delayMinutes: number;
}
export interface NseBar { t: string; o: number; h: number; l: number; c: number; v: number }
export type NseSessionStatus = 'PRE_OPEN' | 'OPEN' | 'CLOSED' | 'POST_CLOSE' | 'HALTED';
/** `getMarketStatus()` returns the equity (capital market) segment first. */
export interface NseMarketStatus { segment: string; status: NseSessionStatus; asOf: string }
export interface NseExchangeInfo { mic: 'XNSE'; timezone: 'Asia/Kolkata'; open: string; close: string; preOpen?: string; holidays: Record<string, string> }
export interface NseTick extends NseQuote { seq: number }

/** Capability set requested for the NSE integration. */
export interface NseSource {
  searchSymbols(query: string, limit: number): Promise<NseSecurity[]>;
  getSecurity(sym: NseSymbol): Promise<NseSecurity | null>;
  getQuote(sym: NseSymbol): Promise<NseQuote | null>;
  getHistoricalData(sym: NseSymbol, from: string, to: string): Promise<NseBar[]>;
  getIntradayData(sym: NseSymbol, intervalMinutes: number, from: string): Promise<NseBar[]>;
  getMarketStatus(): Promise<NseMarketStatus[]>;
  getExchangeInfo(): Promise<NseExchangeInfo>;
  /** Server-side only (a long-lived process, not a request handler). Returns an unsubscribe function. */
  subscribeRealtime(symbols: NseSymbol[], onTick: (t: NseTick) => void): Promise<() => void>;
}

const NOT_CONNECTED = 'NSE market data is not connected. The licensed NSE product, its specification and credentials have not been provided.';

/** Used until a licensed NSE product is wired in. Every call fails with NOT_CONFIGURED; nothing is fabricated. */
export class UnconnectedNseSource implements NseSource {
  private fail(): never { throw new ProviderError('NOT_CONFIGURED', NOT_CONNECTED); }
  async searchSymbols(): Promise<NseSecurity[]> { return this.fail(); }
  async getSecurity(): Promise<NseSecurity | null> { return this.fail(); }
  async getQuote(): Promise<NseQuote | null> { return this.fail(); }
  async getHistoricalData(): Promise<NseBar[]> { return this.fail(); }
  async getIntradayData(): Promise<NseBar[]> { return this.fail(); }
  async getMarketStatus(): Promise<NseMarketStatus[]> { return this.fail(); }
  async getExchangeInfo(): Promise<NseExchangeInfo> { return this.fail(); }
  async subscribeRealtime(): Promise<() => void> { return this.fail(); }
}

export function createNseSource(): NseSource {
  return new UnconnectedNseSource();
}
