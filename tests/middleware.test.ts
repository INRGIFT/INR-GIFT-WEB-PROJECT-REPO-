import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { middleware } from '@/middleware';

/** Runs in demo auth mode (no Supabase in tests): the access rules, CSRF guard and cache headers are the same. */
const req = (path: string, init: { method?: string; headers?: Record<string, string>; cookie?: string } = {}) =>
  new NextRequest(`http://localhost${path}`, { method: init.method ?? 'GET', headers: { ...(init.cookie ? { cookie: init.cookie } : {}), ...init.headers } });

describe('middleware', () => {
  it('protected API: 401 JSON, private and uncacheable, no data', async () => {
    const r = await middleware(req('/api/v1/assets'));
    expect(r.status).toBe(401);
    expect(r.headers.get('cache-control')).toContain('no-store');
    expect((await r.json()).error.code).toBe('UNAUTHENTICATED');
  });
  it('protected page: redirect to /login with a safe next, marked private no-store', async () => {
    const r = await middleware(req('/app/watchlist?x=1'));
    expect(r.status).toBe(307);
    expect(r.headers.get('location')).toBe('http://localhost/login?next=%2Fapp%2Fwatchlist%3Fx%3D1');
    expect(r.headers.get('cache-control')).toBe('private, no-store');
  });
  it('demo mode: pages opened by the demo cookie are still private and uncacheable', async () => {
    const r = await middleware(req('/app', { cookie: 'inrgift_demo_session=1' }));
    expect([200, 307]).toContain(r.status); // in Supabase mode this cookie is never read (src/middleware.ts)
    if (r.status === 200) expect(r.headers.get('cache-control')).toBe('private, no-store');
  });
  it('public compliance pages and auth pages pass without a session', async () => {
    for (const p of ['/', '/account-closure', '/terms-and-conditions', '/support', '/login', '/complete-profile']) expect((await middleware(req(p))).status, p).toBe(200);
  });
  it('CSRF: cross-site writes to any API are refused before a handler runs; same-origin and webhooks pass', async () => {
    const evil = await middleware(req('/api/forms/account-closure', { method: 'POST', headers: { origin: 'https://evil.example' } }));
    expect(evil.status).toBe(403);
    expect((await middleware(req('/api/auth/password', { method: 'POST', headers: { 'sec-fetch-site': 'cross-site' } }))).status).toBe(403);
    expect((await middleware(req('/api/auth/sms/start', { method: 'POST', headers: { origin: 'null' } }))).status).toBe(403);
    expect((await middleware(req('/api/forms/support', { method: 'POST', headers: { origin: 'http://localhost', 'sec-fetch-site': 'same-origin' } }))).status).toBe(200);
    expect((await middleware(req('/api/hooks/send-email', { method: 'POST', headers: { 'sec-fetch-site': 'cross-site' } }))).status).toBe(200);
    expect((await middleware(req('/api/v1/assets', { headers: { origin: 'https://evil.example' } }))).status).toBe(401); // reads still need a session
  });
});

describe('session cookie attributes and demo guard', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
  it('Supabase cookies: Path=/, SameSite=Lax, Secure on HTTPS production, never HttpOnly-forced', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://inrgift.com');
    const { supabaseCookieOptions } = await import('@/lib/config');
    expect(supabaseCookieOptions).toEqual({ path: '/', sameSite: 'lax', secure: true });
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
    expect((await import('@/lib/config')).supabaseCookieOptions.secure).toBe(false);
  });
  it('the live site never runs demo auth, even if NEXT_PUBLIC_AUTH_MODE=demo is set by mistake', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://inrgift.com');
    vi.stubEnv('NEXT_PUBLIC_AUTH_MODE', 'demo');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example-project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    expect((await import('@/lib/config')).authMode).toBe('supabase');
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect((await import('@/lib/config')).authMode).toBe('off');
  });
});
