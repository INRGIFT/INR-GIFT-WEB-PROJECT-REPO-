/** Central runtime configuration. Provider selection lives here and nowhere else. */
export const config = {
  provider: (process.env.MARKET_DATA_PROVIDER ?? 'demo') as 'demo' | 'real',
  fallbackProvider: (process.env.MARKET_DATA_FALLBACK || null) as 'demo' | 'real' | null,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
};
export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
export const isDemoData = config.provider === 'demo';
/**
 * Search engines may index the site only with live data or an explicit opt-in (SITE_INDEXABLE=true).
 * Demo prices must never be presented to crawlers as market data (docs/SEO.md).
 */
export const isIndexable = process.env.SITE_INDEXABLE === 'true' || (!isDemoData && process.env.SITE_INDEXABLE !== 'false');
export const DEMO_SESSION_COOKIE = 'inrgift_demo_session';
