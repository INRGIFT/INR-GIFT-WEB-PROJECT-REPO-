# Connecting a real market-data provider

Nothing in the UI or API changes. Work happens in three places.

1. **`src/providers/real/index.ts`** — replace the stub with a class that `implements MarketDataProvider`
   (`src/providers/provider.ts`). Read `MARKET_DATA_API_KEY` / `MARKET_DATA_BASE_URL` from `process.env` (server only).
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
