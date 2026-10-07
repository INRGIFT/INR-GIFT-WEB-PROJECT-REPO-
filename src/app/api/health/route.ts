import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { authMode, config, publicSetting, smsSecondFactor } from '@/lib/config';
import { googleSignInAvailable } from '@/features/auth/google';
import { supportPhone } from '@/lib/company-server';
import { configured } from '@/lib/server-env';
import { getProvider } from '@/providers';

export const dynamic = 'force-dynamic';
const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);

/**
 * Liveness and dependency health for uptime checks. Reports configuration flags and a provider probe; never returns
 * secrets, keys or user data. 200 when the provider answers, 503 when it does not.
 */
/** The commit this deployment was packaged from (release.json, written by scripts/package-godaddy.sh), if present. */
async function release(): Promise<{ commit: string | null; committedAt: string | null }> {
  try {
    const r = JSON.parse(await readFile(`${process.cwd()}/release.json`, 'utf8')) as { commit?: unknown; committedAt?: unknown };
    const commit = typeof r.commit === 'string' && /^[0-9a-f]{7,40}$/.test(r.commit) ? r.commit : null;
    return { commit, committedAt: typeof r.committedAt === 'string' ? r.committedAt.slice(0, 40) : null };
  } catch { return { commit: null, committedAt: null }; }
}

export async function GET() {
  const started = Date.now();
  let provider: { name: string; ok: boolean; latencyMs: number; error?: string };
  try {
    const sessions = await withTimeout(getProvider().getMarketSessions(), 3000);
    provider = { name: config.provider, ok: sessions.length > 0, latencyMs: Date.now() - started };
  } catch (e) {
    provider = { name: config.provider, ok: false, latencyMs: Date.now() - started, error: e instanceof Error ? e.message : 'error' };
  }
  // Integrations report configuration only: this endpoint never sends an SMS or email and never spends news quota.
  const integrations = {
    supabase: { auth: authMode, secretKey: configured.supabaseAdmin() },
    resend: { configured: configured.email(), sendEmailHook: configured.emailHook() },
    twofactor: { configured: configured.sms(), secondFactor: smsSecondFactor ? 'on' : 'off' },
    news: { provider: configured.news() ? 'newsdata.io' : 'demo', configured: configured.news() },
    google: { signIn: (await googleSignInAvailable()) ? 'enabled' : 'disabled' },
    support: { phoneConfigured: Boolean(supportPhone()), inbox: process.env.SUPPORT_INBOX_EMAIL ? 'custom' : 'support@inrgift.com' },
  };
  // Booleans only: which settings the running server received. Values are never returned.
  const configuration = {
    authMode,
    siteUrlConfigured: Boolean(publicSetting('NEXT_PUBLIC_SITE_URL')),
    siteUrl: config.siteUrl === 'https://inrgift.com' || config.siteUrl.startsWith('http://localhost') ? config.siteUrl : 'custom',
    supabaseUrlConfigured: Boolean(publicSetting('NEXT_PUBLIC_SUPABASE_URL')),
    supabasePublishableKeyConfigured: Boolean(publicSetting('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || publicSetting('NEXT_PUBLIC_SUPABASE_ANON_KEY')),
    // The browser receives these from the server at request time (src/app/layout.tsx), so a build without them is fine.
    browserSettings: 'runtime',
  };
  const body = { status: provider.ok ? 'ok' : 'degraded', time: new Date().toISOString(), release: await release(), provider, fallback: config.fallbackProvider, auth: authMode, configuration, logos: config.logoProvider, integrations };
  return NextResponse.json(body, { status: provider.ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
