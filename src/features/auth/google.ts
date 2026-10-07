import { authMode, config } from '@/lib/config';

/**
 * Whether "Continue with Google" can work here (server only). Supabase publishes which providers are switched on at
 * GET <project>/auth/v1/settings (publishable key; no secrets). The button is shown only when Google is enabled there,
 * so a visitor never reaches a Supabase "provider is not enabled" error page. Demo builds simulate Google.
 * GOOGLE_SIGN_IN=off hides it without touching Supabase.
 */
let cache: { at: number; ok: boolean } | null = null;
export async function googleSignInAvailable(fetchImpl: typeof fetch = fetch): Promise<boolean> {
  if (process.env.GOOGLE_SIGN_IN === 'off') return false;
  if (authMode === 'demo') return true;
  if (authMode !== 'supabase') return false;
  if (cache && Date.now() - cache.at < (cache.ok ? 5 * 60_000 : 30_000)) return cache.ok;
  let ok = false;
  try {
    const r = await fetchImpl(`${config.supabaseUrl.replace(/\/$/, '')}/auth/v1/settings`, { headers: { apikey: config.supabaseKey }, signal: AbortSignal.timeout(2500), cache: 'no-store' });
    const j = (await r.json()) as { external?: { google?: unknown } };
    ok = r.ok && j?.external?.google === true;
  } catch { ok = false; }
  cache = { at: Date.now(), ok };
  return ok;
}
export const resetGoogleCache = () => { cache = null; };
