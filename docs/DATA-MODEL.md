# Data model

## TypeScript (src/lib/types.ts)
- `DataStatus`: LIVE | DELAYED | END_OF_DAY | CLOSED | UNAVAILABLE | STALE | ERROR
- `AssetClass`: stock | etf | index | fx | commodity | bond | reit | fund
- `DataMeta`: timestamp, timezone, ingestedAt, source, dataStatus — on every market-data payload.
- `Exchange`: mic, name, timezone, open, close, breakStart/End, preOpen, postClose, tradingDays, holidays, halfDays.
- `Market` / `MarketView`: id, slug, name, region, currency, exchanges, feed, statusOverride + session, dataStatus,
  localTime, istOpen/istClose, assetCount, meta.
- `Asset`: id (`ins_######`, immutable), slug (URL), symbol, name, cls, marketId, country, region, mic, exchange,
  currency, sector, industry, issuerId, description, price, prevClose, `m` (metric map), status, meta,
  crossListings, and class blocks `etf` / `bond` / `reit` / `fx` / `commodity` / `index`.
- `MetricKey` (36 keys) with definitions in `src/lib/metrics.ts`. Missing key = not applicable; `null` = unavailable.
- Also: Candle, Fundamentals, Dividend, CorporateAction, Holding, Allocations, Technicals, NewsItem, ResearchDoc,
  Theme, CalendarEvent, Envelope, Pagination, WorkspaceTables, UserPrefs.
- FX and commodities have `marketId: ''`, `region: 'Global'` and use an always-open weekday venue for status.

## Identity
Issuer → Instrument (security / share class) → Listing (exchange MIC + ticker + provider symbol).
Cross-listings and ADR/GDRs share an issuer (demo: TSM on NYSE and 2330 on TWSE).
TypeScript: `Issuer`, `Security` (share class or depositary receipt with ratio and underlying), `Listing` (MIC, ticker,
currency, primary, coverage, provider symbols) and `InstrumentIdentity` in `src/lib/types.ts`; served by
`provider.getIdentity` and `GET /api/v1/assets/:id/identity`; shown in the asset page's "Issuer, securities and listings"
panel. Demo reference listings (uncovered, no prices): GOOG (Class C), INFY ADR, HDB ADR, Reliance GDR. ISINs are null
until a licensed security master supplies them.

## SQL — private workspace (supabase/migrations/0001_user_workspace.sql)
profiles, user_preferences, watchlists, watchlist_items, alerts, saved_screens, saved_comparisons, saved_research,
notes, recent_history, notifications.
`user_id uuid default auth.uid()`; RLS enabled and forced on every table; owner-only select/insert/update/delete;
`watchlist_items` additionally checks parent ownership; trigger makes `user_id` immutable; `handle_new_user` creates
profile, preferences and a default watchlist. **No portfolio/order/position/brokerage tables, by design.**
Instruments are referenced by text `instrument_id` (no FK across schemas).

## SQL — market data (supabase/migrations/0002_market_data.sql, schema `market`)
regions, countries, exchanges, market_holidays, data_sources, issuers, instruments, listings, market_prices, ohlcv,
data_quarantine, fundamentals, valuation_metrics, technical_metrics, dividends, corporate_actions, etf_profiles,
etf_holdings, etf_allocations, index_profiles, fx_pairs, commodity_profiles, bond_profiles, reit_profiles,
news_articles, news_assets, research_documents, research_assets, themes, theme_assets, calendar_events,
data_entitlements. Public read via RLS, service-role write; quarantine is not readable.

**0003_workspace_collections.sql:** `collections` (owner-only, ≤100 instrument ids), `alerts.note`,
`notifications.ref_id` (links a notification to the alert that fired it).
**0004_support_requests.sql:** contact messages; insert-only for anon and authenticated, no read policy.
**0008_gift_id.sql:** `profiles.gift_id` (`GIFT-` + 8 Crockford base32 characters; not null, unique, immutable by
trigger, assigned on insert whatever a client sends) and `public.gift_id_registry` (every issued ID with its account,
assigned and retired times; never deleted, no client access). Functions `generate_gift_id`, `assign_gift_id` (bounded
retries), `account_by_gift_id` (service role only). Backfills existing accounts and verifies the result. Independent
of 0007. TypeScript: `AccountProfile` (`giftId`, name, email, phone, country, verification, providers, passwordSet,
dates, session) in `src/features/account/types.ts`, served by `GET /api/v1/me`.

**Status:** all four migrations are written and reviewed by eye only. They have never been run against a Postgres or
Supabase instance. Run them first thing and fix whatever surfaces.

## Demo seed (src/providers/demo/seed.ts)
19 markets, 35 stocks, 8 ETFs, 4 REITs, 23 indices, 9 FX pairs, 6 commodities, 5 bonds, 7 themes, news, macro events,
demo IPOs, reference INR rates. All values are invented and labelled as demo.
