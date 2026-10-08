import { authMode, config } from '@/lib/config';

/**
 * Which "Continue with …" buttons can work here (server only). Supabase publishes which providers are switched on at
 * GET <project>/auth/v1/settings (publishable key; no secrets). A button is shown only when its provider is enabled
 * there, so a visitor never reaches a Supabase "provider is not enabled" error page. Demo builds simulate both.
 * GOOGLE_SIGN_IN=off / APPLE_SIGN_IN=off hide a button without touching Supabase.
 */
export type OAuthProvider = 'google' | 'apple';
export const OAUTH_PROVIDERS: readonly OAuthProvider[] = ['google', 'apple'];
export const OAUTH_LABEL: Record<OAuthProvider, string> = { google: 'Google', apple: 'Apple' };
export type OAuthAvailability = Record<OAuthProvider, boolean>;

const NONE: OAuthAvailability = { google: false, apple: false };
let cache: { at: number; ok: boolean; value: OAuthAvailability } | null = null;
async function supabaseExternal(fetchImpl: typeof fetch): Promise<OAuthAvailability> {
  if (cache && Date.now() - cache.at < (cache.ok ? 5 * 60_000 : 30_000)) return cache.value;
  let value = NONE, ok = false;
  try {
    const r = await fetchImpl(`${config.supabaseUrl.replace(/\/$/, '')}/auth/v1/settings`, { headers: { apikey: config.supabaseKey }, signal: AbortSignal.timeout(2500), cache: 'no-store' });
    const j = (await r.json()) as { external?: Partial<Record<OAuthProvider, unknown>> };
    ok = r.ok;
    value = { google: ok && j?.external?.google === true, apple: ok && j?.external?.apple === true };
  } catch { value = NONE; ok = false; }
  cache = { at: Date.now(), ok, value };
  return value;
}
/** Both providers' availability in one Supabase call (cached: 5 minutes after an answer, 30 seconds after a failure). */
export async function oauthAvailability(fetchImpl: typeof fetch = fetch): Promise<OAuthAvailability> {
  const off = { google: process.env.GOOGLE_SIGN_IN === 'off', apple: process.env.APPLE_SIGN_IN === 'off' };
  if (authMode === 'demo') return { google: !off.google, apple: !off.apple };
  if (authMode !== 'supabase') return NONE;
  const v = await supabaseExternal(fetchImpl);
  return { google: v.google && !off.google, apple: v.apple && !off.apple };
}
export const googleSignInAvailable = async (fetchImpl: typeof fetch = fetch) => (await oauthAvailability(fetchImpl)).google;
export const appleSignInAvailable = async (fetchImpl: typeof fetch = fetch) => (await oauthAvailability(fetchImpl)).apple;
export const resetOAuthCache = () => { cache = null; };
/** Kept for older call sites. */
export const resetGoogleCache = resetOAuthCache;
