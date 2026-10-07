import { NextResponse } from 'next/server';
import { config, isSupabaseConfigured } from '@/lib/config';
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
  const body = { status: provider.ok ? 'ok' : 'degraded', time: new Date().toISOString(), provider, fallback: config.fallbackProvider, auth: isSupabaseConfigured ? 'supabase' : 'demo', logos: config.logoProvider };
  return NextResponse.json(body, { status: provider.ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
