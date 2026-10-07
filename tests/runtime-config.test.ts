import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Production incident (7 Oct 2026): GoDaddy gave NEXT_PUBLIC_* values to the running server but not to `next build`,
 * so the browser bundle had no Supabase settings and sign-in fell to the "off" adapter. These tests pin the fix in
 * src/lib/config.ts: the server reads the running process, and the browser reads what the server put in the page.
 */
const load = async () => { vi.resetModules(); return import('@/lib/config'); };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('runtime public settings', () => {
  it('server: Supabase settings present only at runtime select Supabase auth (never off, never demo)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_AUTH_MODE', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example-project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    const c = await load();
    expect(c.authMode).toBe('supabase');
    expect(c.publicEnv()).toMatchObject({ NEXT_PUBLIC_SUPABASE_URL: 'https://example-project.supabase.co' });
  });
  it('browser: settings rendered by the server into window.__INRGIFT_ENV__ select Supabase auth', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_AUTH_MODE', '');
    vi.stubGlobal('window', { __INRGIFT_ENV__: { NEXT_PUBLIC_SUPABASE_URL: 'https://example-project.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', NEXT_PUBLIC_SITE_URL: 'https://inrgift.com' } });
    const c = await load();
    expect(c.isSupabaseConfigured).toBe(true);
    expect(c.authMode).toBe('supabase');
    expect(c.config.siteUrl).toBe('https://inrgift.com');
  });
  it('production with no Supabase settings anywhere is off (fails clearly), never demo', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_AUTH_MODE', '');
    vi.stubGlobal('window', { __INRGIFT_ENV__: {} });
    expect((await load()).authMode).toBe('off');
  });
  it('only browser-safe NEXT_PUBLIC_* names can reach the page, never server secrets', async () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_must_not_leak');
    vi.stubEnv('RESEND_API_KEY', 're_must_not_leak');
    const c = await load();
    const page = JSON.stringify(c.publicEnv());
    expect(page).not.toContain('must_not_leak');
    expect(c.PUBLIC_ENV_KEYS.every((k) => k.startsWith('NEXT_PUBLIC_'))).toBe(true);
  });
});
