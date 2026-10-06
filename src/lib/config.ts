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
export const DEMO_SESSION_COOKIE = 'inrgift_demo_session';
