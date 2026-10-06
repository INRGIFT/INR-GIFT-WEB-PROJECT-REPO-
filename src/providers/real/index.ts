import type { MarketDataProvider } from '../provider';
import { ProviderError } from '../provider';

/**
 * Connection point for a licensed market-data vendor. See docs/PROVIDERS.md.
 *
 * To connect a vendor:
 *  1. Read the vendor's credentials from server-only environment variables (never NEXT_PUBLIC_*) and add them to .env.example.
 *  2. Implement each method below by calling the vendor and mapping its payload to the
 *     normalized types in src/lib/types.ts. Map vendor symbols to internal instrument ids
 *     through the `listings.provider_symbol` column (supabase/migrations/0002_market_data.sql).
 *  3. Run every OHLCV series through validateCandles() and set DataMeta from the vendor's timestamps.
 *  4. Set MARKET_DATA_PROVIDER=real. Optionally set MARKET_DATA_FALLBACK=demo while migrating.
 *
 * Until then every call fails with NOT_CONFIGURED, which the fallback chain and the UI handle.
 */
const notConfigured = (): never => { throw new ProviderError('NOT_CONFIGURED', 'No live market-data provider is configured. Set MARKET_DATA_PROVIDER=demo or implement RealProvider.'); };

export const RealProvider: new () => MarketDataProvider = class {
  readonly name = 'real-provider';
  constructor() {
    return new Proxy(this, { get: (target, prop) => (prop === 'name' ? target.name : async () => notConfigured()) });
  }
} as unknown as new () => MarketDataProvider;
