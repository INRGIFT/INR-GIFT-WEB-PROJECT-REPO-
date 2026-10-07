/** Central runtime configuration. Provider selection lives here and nowhere else. */
export type ProviderKind = 'demo' | 'nse' | 'real';

/**
 * Browser-safe settings (`NEXT_PUBLIC_*`). Next.js compiles these into the browser bundle at `next build`, but a host
 * may only provide them to the running server (GoDaddy's Node.js hosting does: its variables reached the server but
 * not the build, so the browser saw no Supabase settings and sign-in was "off"). So:
 *   server   reads the running process (`process.env[name]`, never inlined), falling back to the build value;
 *   browser  uses the build value when there was one, otherwise the copy the server rendered into the page
 *            (`window.__INRGIFT_ENV__`, written by src/app/layout.tsx from `publicEnv()`).
 * Only names in this list ever reach the browser, and none of them is a secret.
 */
export const PUBLIC_ENV_KEYS = ['NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_AUTH_MODE', 'NEXT_PUBLIC_SMS_SECOND_FACTOR', 'NEXT_PUBLIC_LOGO_PROVIDER', 'NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY'] as const;
export type PublicEnvKey = (typeof PUBLIC_ENV_KEYS)[number];
declare global { interface Window { __INRGIFT_ENV__?: Partial<Record<PublicEnvKey, string>> } }
// Literal reads, so Next can inline whatever existed at build time.
const BUILT: Record<PublicEnvKey, string | undefined> = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE,
  NEXT_PUBLIC_SMS_SECOND_FACTOR: process.env.NEXT_PUBLIC_SMS_SECOND_FACTOR,
  NEXT_PUBLIC_LOGO_PROVIDER: process.env.NEXT_PUBLIC_LOGO_PROVIDER,
  NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY,
};
const isBrowser = typeof window !== 'undefined';
/** One browser-safe setting, as described above. Empty string when unset. */
export function publicSetting(name: PublicEnvKey): string {
  if (isBrowser) return BUILT[name] || window.__INRGIFT_ENV__?.[name] || '';
  return (process.env as Record<string, string | undefined>)[name] || BUILT[name] || '';
}
/** The browser-safe settings the server hands to the page (server only; values, never secrets). */
export function publicEnv(): Partial<Record<PublicEnvKey, string>> {
  return Object.fromEntries(PUBLIC_ENV_KEYS.map((k) => [k, publicSetting(k)]).filter(([, v]) => v));
}

export const config = {
  provider: (process.env.MARKET_DATA_PROVIDER ?? 'demo') as ProviderKind,
  fallbackProvider: (process.env.MARKET_DATA_FALLBACK || null) as ProviderKind | null,
  /** Canonical origin. Set NEXT_PUBLIC_SITE_URL before the build; production falls back to https://inrgift.com, development to localhost. */
  siteUrl: publicSetting('NEXT_PUBLIC_SITE_URL') || (process.env.NODE_ENV === 'production' ? 'https://inrgift.com' : 'http://localhost:3000'),
  /** Stock/ETF logo source: "logo.dev" or "none" (ticker tiles only). See src/lib/logos. */
  logoProvider: (publicSetting('NEXT_PUBLIC_LOGO_PROVIDER') || 'none') as 'logo.dev' | 'none',
  /** Logo.dev publishable key (pk_…). Browser-safe by design; restrict it to the production domain at Logo.dev. */
  logoDevKey: publicSetting('NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY'),
  supabaseUrl: publicSetting('NEXT_PUBLIC_SUPABASE_URL'),
  /** Client-safe Supabase key. The publishable key (`sb_publishable_…`) is current; the legacy anon key still works. */
  supabaseKey: publicSetting('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || publicSetting('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
};
/**
 * Supabase auth and workspace storage are used whenever both values are set. NEXT_PUBLIC_AUTH_MODE=demo forces the
 * built-in demo account (browser-local data) for automated test builds; never set it on a public deployment.
 */
export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseKey) && publicSetting('NEXT_PUBLIC_AUTH_MODE') !== 'demo';
/**
 * Which sign-in system runs:
 *   supabase  Supabase is configured (production).
 *   demo      browser-only simulation, for `npm run dev` without configuration and for builds that set
 *             NEXT_PUBLIC_AUTH_MODE=demo (automated tests). Never on a public deployment.
 *   off       a production build with no Supabase configuration and no explicit demo opt-in: sign-in is unavailable,
 *             so a misconfigured deployment can never fall back to the demo account.
 */
/**
 * Base for absolute redirects. In production the configured site URL (https://inrgift.com), so a proxy in front of the
 * Node app (GoDaddy) can never turn a redirect into an internal host or http; elsewhere the request's own URL.
 */
export const redirectBase = (requestUrl: string) => (process.env.NODE_ENV === 'production' && publicSetting('NEXT_PUBLIC_SITE_URL') ? publicSetting('NEXT_PUBLIC_SITE_URL') : requestUrl);
/**
 * SMS second factor (2Factor.in). Off until the sender/template DLT approval, the 2Factor key and migration 0007 are in
 * place; then set NEXT_PUBLIC_SMS_SECOND_FACTOR=on (and rebuild). While off, accounts still give email + phone +
 * password, email confirmation and a password sign-in are still required, and no SMS is ever attempted.
 */
export const smsSecondFactor = publicSetting('NEXT_PUBLIC_SMS_SECOND_FACTOR') === 'on';
export const authMode: 'supabase' | 'demo' | 'off' = isSupabaseConfigured ? 'supabase'
  : publicSetting('NEXT_PUBLIC_AUTH_MODE') === 'demo' || process.env.NODE_ENV !== 'production' ? 'demo' : 'off';
// A demo fallback behind a live provider can serve demo values, so the site is treated as demo (not indexable).
export const isDemoData = config.provider === 'demo' || config.fallbackProvider === 'demo';
/**
 * Search engines may index the site only with live data or an explicit opt-in (SITE_INDEXABLE=true).
 * Demo prices must never be presented to crawlers as market data (docs/SEO.md).
 */
export const isIndexable = process.env.SITE_INDEXABLE === 'true' || (!isDemoData && process.env.SITE_INDEXABLE !== 'false');
export const DEMO_SESSION_COOKIE = 'inrgift_demo_session';
