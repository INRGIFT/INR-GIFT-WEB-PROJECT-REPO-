import { aggregateBars, GLOBAL_VENUE, inferResolution, supportedResolutions } from '@/lib/charts/bars';
import type { ChartBar, ChartError, ChartResolution, ChartSeries } from '@/lib/charts/types';
import type { Asset, ChartRange, Exchange } from '@/lib/types';
import * as md from '@/services/market-data';

/**
 * Chart data service: the only way any chart (KLineChart through the INRGIFT chart adapter) gets bars.
 *   UI chart → INRGIFT chart adapter → /api/v1/assets/:id/chart (or a server component) → this service →
 *   market-data service → provider adapter → DemoProvider today, a licensed provider later.
 * It resolves the instrument by its immutable id (or URL slug), keeps the listing's exchange, time zone and native
 * currency, carries the provider's status and timestamps through unchanged, and only aggregates whole bars into coarser
 * resolutions. It never converts currency, never fills gaps and never streams: there is no realtime feed.
 */
export type ChartResult = { ok: true; series: ChartSeries } | { ok: false; error: ChartError };

async function venueOf(asset: Asset): Promise<Exchange> {
  if (!asset.marketId) return GLOBAL_VENUE;
  const market = await md.getMarket(asset.marketId).catch(() => null);
  return market?.exchanges.find((e) => e.mic === asset.mic) ?? market?.exchanges[0] ?? GLOBAL_VENUE;
}
/** Decimal places for prices on the chart's axis and tooltip: four for sub-10 FX rates, otherwise two. */
export const pricePrecisionFor = (asset: Pick<Asset, 'cls' | 'price'>) => (asset.cls === 'fx' && (asset.price ?? 0) < 10 ? 4 : 2);

export async function getChartSeries(idOrSlug: string, range: ChartRange, resolution?: ChartResolution, now = new Date()): Promise<ChartResult> {
  const asset = await md.getAsset(undefined, idOrSlug).catch(() => null);
  if (!asset) return { ok: false, error: { code: 'NOT_FOUND', message: 'No such instrument.' } };
  let history: Awaited<ReturnType<typeof md.getOHLCV>>;
  try { history = await md.getOHLCV(asset.id, range); }
  catch { return { ok: false, error: { code: 'PROVIDER_ERROR', message: 'The price history could not be loaded from the data provider.' } }; }
  const [venue, market] = await Promise.all([venueOf(asset), asset.marketId ? md.getMarket(asset.marketId).catch(() => null) : Promise.resolve(null)]);
  // Volume only where the instrument has one (its metric map says so): indices, spot FX, commodity references and
  // bonds carry none, so no volume is shown for them even if a source sends a number.
  const hasVolume = asset.m.volume !== undefined;
  const raw: ChartBar[] = (history?.candles ?? []).map((c) => ({ t: Date.parse(c.t), o: c.o, h: c.h, l: c.l, c: c.c, v: hasVolume && Number.isFinite(c.v) ? c.v : null }));
  const native = inferResolution(raw);
  const supported = raw.length ? supportedResolutions(native, raw.length) : [native];
  const target = resolution ?? native;
  if (raw.length && !supported.includes(target)) {
    return { ok: false, error: { code: 'UNSUPPORTED_RESOLUTION', message: `${target} bars are not available for ${asset.symbol} over ${range}.`, supported } };
  }
  const bars = target === native ? raw : aggregateBars(raw, target, venue);
  const change = asset.price != null && asset.prevClose != null ? asset.price - asset.prevClose : null;
  return {
    ok: true,
    series: {
      instrumentId: asset.id, slug: asset.slug, symbol: asset.symbol, name: asset.name, cls: asset.cls,
      listing: { exchange: asset.exchange, mic: asset.mic, marketId: asset.marketId || null, country: asset.country, timezone: venue.timezone },
      currency: asset.currency, unit: asset.cls === 'index' ? 'points' : asset.cls === 'fx' ? 'rate' : 'price',
      range, resolution: target, supported, bars,
      // No bars from the source is "unavailable", whatever the quote's status.
      status: bars.length ? asset.status : 'UNAVAILABLE',
      session: market?.session ?? null, holidayName: market?.holidayName ?? null,
      source: asset.meta.source, timezone: venue.timezone, asOf: asset.meta.timestamp, retrievedAt: now.toISOString(),
      last: { price: asset.price, prevClose: asset.prevClose, change, changePct: asset.m.d1 ?? null },
      pricePrecision: pricePrecisionFor(asset), volumePrecision: 0, quarantined: history?.quarantined ?? 0, realtime: false,
    },
  };
}
