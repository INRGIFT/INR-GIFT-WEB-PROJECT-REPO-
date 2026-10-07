import type { AssetClass, ChartRange, DataStatus, SessionState } from '@/lib/types';

/**
 * INRGIFT's chart-data contract: what the chart data service returns and every chart renders. Library-neutral (no
 * KLineChart types here) so the chart library can change without touching providers, services or the API.
 */

/** Every resolution the contract can carry. A provider exposes only the ones it really has (see `supported`). */
export const RESOLUTIONS = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M'] as const;
export type ChartResolution = (typeof RESOLUTIONS)[number];
/** Minutes per bar for intraday resolutions. */
export const INTRADAY_MINUTES: Partial<Record<ChartResolution, number>> = { '1m': 1, '5m': 5, '15m': 15, '30m': 30, '1h': 60, '4h': 240 };
export const isIntraday = (r: ChartResolution) => INTRADAY_MINUTES[r] !== undefined;
export const RESOLUTION_LABEL: Record<ChartResolution, string> = { '1m': '1 minute', '5m': '5 minutes', '15m': '15 minutes', '30m': '30 minutes', '1h': '1 hour', '4h': '4 hours', '1D': 'Daily', '1W': 'Weekly', '1M': 'Monthly' };
export const RANGES: ChartRange[] = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', 'MAX'];

/** One bar. `t` is the bar's open time in epoch milliseconds (UTC). Volume is null when the source has none. */
export interface ChartBar { t: number; o: number; h: number; l: number; c: number; v: number | null }

/** The listing the bars belong to: exchange, venue time zone and native currency, never inferred from a country. */
export interface ChartListing { exchange: string; mic: string; marketId: string | null; country: string; timezone: string }

export interface ChartSeries {
  /** Immutable INRGIFT instrument id (ins_######). The slug and symbol are for display and URLs only. */
  instrumentId: string;
  slug: string;
  symbol: string;
  name: string;
  cls: AssetClass;
  listing: ChartListing;
  /** ISO 4217 code of the prices in `bars`, exactly as the source quotes them. Never converted. */
  currency: string;
  /** Index levels are points, not money. */
  unit: 'price' | 'points' | 'rate';
  range: ChartRange;
  resolution: ChartResolution;
  /** Resolutions this instrument and range can be shown in: the source's own bars and honest aggregations of them. */
  supported: ChartResolution[];
  bars: ChartBar[];
  /** Data status of the series (DEMO for the demo provider, never LIVE). */
  status: DataStatus;
  /** The venue's session now; null for instruments without one venue (spot FX, commodity references). */
  session: SessionState | null;
  holidayName: string | null;
  source: string;
  /** Exchange time zone (IANA): bars, sessions and as-of times are shown in it. */
  timezone: string;
  /** When the latest value was valid, from the source. */
  asOf: string | null;
  /** When INRGIFT produced this response. */
  retrievedAt: string;
  last: { price: number | null; prevClose: number | null; change: number | null; changePct: number | null };
  pricePrecision: number;
  volumePrecision: number;
  /** Bars dropped by validation (bad OHLC, duplicates, out of order). */
  quarantined: number;
  /** The current provider streams nothing: no simulated ticks, no websocket. */
  realtime: false;
}

export type ChartErrorCode = 'NOT_FOUND' | 'UNSUPPORTED_RESOLUTION' | 'PROVIDER_ERROR';
export interface ChartError { code: ChartErrorCode; message: string; supported?: ChartResolution[] }
