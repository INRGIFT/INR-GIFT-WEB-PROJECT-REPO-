/** Central runtime configuration. Provider selection lives here and nowhere else. */
export type ProviderKind = 'demo' | 'nse' | 'real';
export const config = {
  provider: (process.env.MARKET_DATA_PROVIDER ?? 'demo') as ProviderKind,
  fallbackProvider: (process.env.MARKET_DATA_FALLBACK || null) as ProviderKind | null,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  /** Stock/ETF logo source: "logo.dev" or "none" (ticker tiles only). See src/lib/logos. */
  logoProvider: (process.env.NEXT_PUBLIC_LOGO_PROVIDER || 'none') as 'logo.dev' | 'none',
  /** Logo.dev publishable key (pk_…). Browser-safe by design; restrict it to the production domain at Logo.dev. */
  logoDevKey: process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY ?? '',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  /** Client-safe Supabase key. The publishable key (`sb_publishable_…`) is current; the legacy anon key still works. */
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};
export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseKey);
// A demo fallback behind a live provider can serve demo values, so the site is treated as demo (not indexable).
export const isDemoData = config.provider === 'demo' || config.fallbackProvider === 'demo';
/**
 * Search engines may index the site only with live data or an explicit opt-in (SITE_INDEXABLE=true).
 * Demo prices must never be presented to crawlers as market data (docs/SEO.md).
 */
export const isIndexable = process.env.SITE_INDEXABLE === 'true' || (!isDemoData && process.env.SITE_INDEXABLE !== 'false');
export const DEMO_SESSION_COOKIE = 'inrgift_demo_session';
