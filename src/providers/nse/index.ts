import type { Asset, AssetClass, Candle, ChartRange, DataMeta, DataStatus, MarketView } from '@/lib/types';
import { validateCandles } from '@/lib/validation';
import type { MarketDataProvider, Quote } from '../provider';
import { ProviderError } from '../provider';
import type { NseBar, NseMarketStatus, NseQuote, NseSecurity, NseSource, NseSymbol } from './source';

/**
 * Maps INRGIFT's immutable instrument ids to NSE symbols. Backed by `market.listings` (mic = 'XNSE',
 * source_id = 'nse', provider_symbol = 'SYMBOL:SERIES') once the instrument registry is loaded from the licensed
 * NSE security master. Never keyed on ticker alone.
 */
export interface NseInstrumentMap {
  toNse(instrumentId: string): Promise<NseSymbol | null>;
  fromNse(sym: NseSymbol): Promise<{ id: string; slug: string } | null>;
}
export class UnloadedInstrumentMap implements NseInstrumentMap {
  async toNse(): Promise<NseSymbol | null> { throw new ProviderError('NOT_CONFIGURED', 'The NSE instrument registry (market.listings) has not been loaded.'); }
  async fromNse(): Promise<{ id: string; slug: string } | null> { throw new ProviderError('NOT_CONFIGURED', 'The NSE instrument registry (market.listings) has not been loaded.'); }
}

const SOURCE = 'NSE';
const TZ = 'Asia/Kolkata';
const CLS: Record<NseSecurity['kind'], AssetClass | null> = { equity: 'stock', etf: 'etf', index: 'index', reit: 'reit', invit: 'reit', other: null };
const DAYS: Partial<Record<ChartRange, number>> = { '1M': 31, '3M': 92, '6M': 183, '1Y': 366, '3Y': 1096, '5Y': 1827, MAX: 365 * 30 };

/** Status from the quote's own timing: real-time entitlement while open → LIVE, delayed product → DELAYED. */
export function nseStatus(q: Pick<NseQuote, 'last' | 'delayMinutes'>, session: NseMarketStatus['status'] | null): DataStatus {
  if (q.last == null) return 'UNAVAILABLE';
  if (session && session !== 'OPEN') return 'CLOSED';
  return q.delayMinutes > 0 ? 'DELAYED' : 'LIVE';
}
export function nseMeta(exchangeTime: string, status: DataStatus, now = new Date()): DataMeta {
  return { timestamp: exchangeTime, timezone: TZ, ingestedAt: now.toISOString(), source: SOURCE, dataStatus: status };
}
export function toCandles(bars: NseBar[]): Candle[] {
  // Quarantined rows are dropped from display, never repaired or invented.
  return validateCandles(bars.map((b) => ({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v }))).clean;
}

/**
 * MarketDataProvider backed by NSE. Coverage is NSE-listed instruments only: methods for data NSE does not supply
 * (FX spot, global commodities, global bonds, news, editorial research) return empty results, which the UI shows
 * as unavailable. Nothing here substitutes another vendor or fabricates a value.
 */
export class NSEMarketDataProvider implements MarketDataProvider {
  readonly name = 'nse';
  constructor(private src: NseSource, private ids: NseInstrumentMap = new UnloadedInstrumentMap(), private clock: () => Date = () => new Date()) {}

  private async session(): Promise<NseMarketStatus['status'] | null> {
    // The source adapter lists the equity (capital market) segment first.
    return (await this.src.getMarketStatus())[0]?.status ?? null;
  }
  private async sym(id: string): Promise<NseSymbol> {
    const sym = await this.ids.toNse(id);
    if (!sym) throw new ProviderError('DATA_UNAVAILABLE', 'This instrument is not listed on NSE.');
    return sym;
  }
  private async toAsset(sec: NseSecurity, q: NseQuote | null, session: NseMarketStatus['status'] | null): Promise<Asset | null> {
    const cls = CLS[sec.kind];
    const ref = await this.ids.fromNse(sec);
    if (!cls || !ref) return null;
    const status = q ? nseStatus(q, session) : 'UNAVAILABLE';
    const d1 = q?.last != null && q.prevClose ? ((q.last - q.prevClose) / q.prevClose) * 100 : null;
    return {
      id: ref.id, slug: ref.slug, symbol: sec.symbol, name: sec.name, cls, marketId: 'in', country: 'India', region: 'Asia-Pacific',
      mic: 'XNSE', exchange: 'NSE', currency: 'INR', industry: sec.industry ?? undefined, description: '',
      price: q?.last ?? null, prevClose: q?.prevClose ?? null, m: { d1, volume: q?.volume ?? null },
      status, meta: nseMeta(q?.exchangeTime ?? this.clock().toISOString(), status, this.clock()),
    };
  }

  async searchAssets(query: string, limit = 10): Promise<Asset[]> {
    const [found, session] = await Promise.all([this.src.searchSymbols(query, limit), this.session()]);
    const out = await Promise.all(found.map(async (s) => this.toAsset(s, await this.src.getQuote(s), session)));
    return out.filter((a): a is Asset => a !== null);
  }
  async listAssets(): Promise<Asset[]> { return []; }
  async getAsset(idOrSlug: string): Promise<Asset | null> {
    const sym = await this.ids.toNse(idOrSlug);
    if (!sym) return null;
    const [sec, q, session] = await Promise.all([this.src.getSecurity(sym), this.src.getQuote(sym), this.session()]);
    return sec ? this.toAsset(sec, q, session) : null;
  }
  async getQuote(id: string): Promise<Quote | null> {
    const [q, session] = await Promise.all([this.src.getQuote(await this.sym(id)), this.session()]);
    if (!q) return null;
    const change = q.last != null && q.prevClose != null ? q.last - q.prevClose : null;
    return { instrumentId: id, price: q.last, prevClose: q.prevClose, change, changePct: change != null && q.prevClose ? (change / q.prevClose) * 100 : null, currency: 'INR', meta: nseMeta(q.exchangeTime, nseStatus(q, session), this.clock()) };
  }
  async getOHLCV(id: string, range: ChartRange): Promise<Candle[] | null> {
    const sym = await this.sym(id);
    const now = this.clock();
    if (range === '1D' || range === '5D') return toCandles(await this.src.getIntradayData(sym, range === '1D' ? 5 : 30, new Date(now.getTime() - (range === '1D' ? 1 : 7) * 864e5).toISOString()));
    const from = range === 'YTD' ? new Date(Date.UTC(now.getUTCFullYear(), 0, 1)) : new Date(now.getTime() - DAYS[range]! * 864e5);
    const bars = await this.src.getHistoricalData(sym, from.toISOString().slice(0, 10), now.toISOString().slice(0, 10));
    return bars.length ? toCandles(bars) : null;
  }
  async getMarketSessions(): Promise<MarketView[]> { return []; }
  async getMarket(): Promise<MarketView | null> { return null; }

  // Not supplied by the NSE market-data products in scope; each needs its own licensed source before it is wired.
  async getFundamentals() { return null; }
  async getValuation() { return null; }
  async getTechnicals() { return null; }
  async getDividends() { return null; }
  async getCorporateActions() { return null; }
  async getETFProfile() { return null; }
  async getETFHoldings() { return null; }
  async getETFAllocations() { return null; }
  async getIndexData(): Promise<Asset[]> { return []; }
  async getFX(): Promise<Asset[]> { return []; }
  async getCommodities(): Promise<Asset[]> { return []; }
  async getBonds(): Promise<Asset[]> { return []; }
  async getREITs(): Promise<Asset[]> { return []; }
  async getNews() { return []; }
  async getResearch() { return []; }
  async getThemes() { return []; }
  async getCalendar() { return []; }
  /** Comes from the licensed NSE security master once loaded into market.issuers/instruments/listings. */
  async getIdentity() { return null; }
}
