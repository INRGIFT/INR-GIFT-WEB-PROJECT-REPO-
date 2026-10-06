# Connecting a real market-data provider

**NSE is the designated provider** (`MARKET_DATA_PROVIDER=nse`, `src/providers/nse`). The NSE source adapter
(`NseSource`: searchSymbols, getSecurity, getQuote, getHistoricalData, getIntradayData, getMarketStatus,
getExchangeInfo, subscribeRealtime) is implemented against the licensed product once it is supplied; until then it
fails with `NOT_CONFIGURED`. `NSEMarketDataProvider` maps it to the contract below and returns empty results for data
NSE does not supply. Licence questions and the full status: `docs/CONNECTORS.md`. Do not substitute another vendor.
`src/providers/real` remains as a generic stub.

Note: editorial research, themes and the calendar currently come from the DemoProvider. A live provider returns
none, so they should move to a content service before switching providers.

Nothing in the UI or API changes. Work happens in three places.

1. **`src/providers/real/index.ts`** — replace the stub with a class that `implements MarketDataProvider`
   (`src/providers/provider.ts`). Read the vendor's credentials from server-only `process.env` (never `NEXT_PUBLIC_*`).
   Map vendor payloads to the normalized types in `src/lib/types.ts`.
2. **Symbol mapping** — resolve vendor symbols to internal `ins_######` ids via `market.listings.provider_symbol`
   (`supabase/migrations/0002_market_data.sql`). Never expose vendor ids or use tickers as identity.
3. **Config** — set `MARKET_DATA_PROVIDER=real`. During migration set `MARKET_DATA_FALLBACK=demo`.

Rules every provider must follow:
- Return `null` when the source has no data; throw `ProviderError` for failures (`DATA_UNAVAILABLE`,
  `PROVIDER_ERROR`, `NOT_CONFIGURED`, `NOT_ENTITLED`).
- Attach `DataMeta` (source, timestamp, timezone, ingestedAt, dataStatus) to assets and quotes.
- In `Asset.m`, omit keys that do not apply to the class; use `null` for unavailable.
- Run OHLCV through `validateCandles()` (the service layer already does on read).
- Session/holiday metadata should come from the vendor's calendar and populate `Exchange`.
- Respect `market.data_entitlements` before returning a dataset at a given freshness.

Methods: searchAssets, listAssets, getAsset, getQuote, getOHLCV, getFundamentals, getValuation, getTechnicals,
getDividends, getCorporateActions, getETFProfile, getETFHoldings, getETFAllocations, getIndexData, getFX,
getCommodities, getBonds, getREITs, getNews, getMarket, getMarketSessions, getResearch, getThemes, getCalendar.

Ingestion: `POST /api/internal/ingest` (header `x-ingest-secret`) validates OHLCV batches today; persisting accepted
rows to `market.ohlcv` and rejects to `market.data_quarantine` with the service-role client is still to do.
