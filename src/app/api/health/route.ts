import { NextResponse } from 'next/server';
import { authMode, config } from '@/lib/config';
import { configured } from '@/lib/server-env';
import { getProvider } from '@/providers';

export const dynamic = 'force-dynamic';
const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);

/**
 * Liveness and dependency health for uptime checks. Reports configuration flags and a provider probe; never returns
 * secrets, keys or user data. 200 when the provider answers, 503 when it does not.
 */
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
    twofactor: { configured: configured.sms() },
    news: { provider: configured.news() ? 'newsdata.io' : 'demo', configured: configured.news() },
  };
  const body = { status: provider.ok ? 'ok' : 'degraded', time: new Date().toISOString(), provider, fallback: config.fallbackProvider, auth: authMode, logos: config.logoProvider, integrations };
  return NextResponse.json(body, { status: provider.ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
