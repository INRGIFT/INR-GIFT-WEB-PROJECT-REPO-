import { afterEach, describe, expect, it, vi } from 'vitest';
import { assetQuality, assetTitle, marketQuality } from '@/lib/indexability';
import { classifyPath, isNoindexPath, isPrivatePath, matchRoute, ROUTES } from '@/lib/route-registry';
import { loginHref, safeReturnPath } from '@/lib/return-url';
import { DemoProvider } from '@/providers/demo';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

describe('route registry', () => {
  // Every page file in src/app maps to a registry entry, so no route ships without access and index rules.
  const pages: string[] = [];
  const walk = (dir: string) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (f === 'page.tsx') pages.push(p); } };
  walk('src/app');
  const toPattern = (file: string) => '/' + file.replace(/^src\/app\//, '').replace(/\/?page\.tsx$/, '').split('/').filter((s) => !/^\(.*\)$/.test(s)).join('/');
  it('registers every page', () => {
    const patterns = new Set(ROUTES.map((r) => r.pattern));
    const missing = pages.map(toPattern).map((p) => (p === '/' ? '/' : p.replace(/\/$/, ''))).filter((p) => !patterns.has(p));
    expect(missing).toEqual([]);
  });
  it('classifies access: homepage public, everything else protected by default', () => {
    for (const p of ['/', '/legal/privacy', '/support', '/contact']) expect(classifyPath(p), p).toBe('public');
    for (const p of ['/login', '/signup', '/verify', '/verify-phone', '/forgot-password', '/reset-password', '/auth/confirm', '/auth/callback']) expect(classifyPath(p), p).toBe('auth');
    for (const p of ['/api/health', '/api/auth/sms/start', '/api/hooks/send-email', '/api/contact']) expect(classifyPath(p), p).toBe('public-api');
    for (const p of ['/markets', '/markets/US', '/assets/stocks', '/stocks/AAPL', '/etfs/SPY/review', '/indices/NIFTY-50', '/fx/USD-INR', '/discover/screener', '/research/stocks', '/resources/news', '/resources/learn/etf-basics', '/search', '/about', '/pricing', '/faq', '/app', '/app/notes', '/account/profile', '/notifications', '/onboarding', '/api/v1/assets', '/api/v1/news/feed', '/some-future-route', '/stocks/AAPL.png', '/legalese', '/supportx'])
      expect(classifyPath(p), p).toBe('protected');
    for (const p of ['/robots.txt', '/sitemap.xml', '/sitemap/core.xml', '/brand/logo/INRGIFT_Emblem_NavyCobalt.svg', '/media/universal-search.webm', '/icon.svg', '/opengraph-image', '/_next/static/x.js']) expect(classifyPath(p), p).toBe('file');
    expect(isPrivatePath('/app/watchlist')).toBe(true);
    expect(isNoindexPath('/login')).toBe(true);
    expect(isNoindexPath('/stocks/AAPL')).toBe(true);
    expect(isNoindexPath('/')).toBe(false);
    expect(ROUTES.filter((r) => r.access === 'public').map((r) => r.pattern).sort()).toEqual(['/', '/contact', '/legal/[doc]', '/support']);
    expect(matchRoute('/markets/all')?.pattern).toBe('/markets/all');
    expect(matchRoute('/markets/India')?.pattern).toBe('/markets/[market]');
  });
  it('return URLs keep path and query, and never leave the site', () => {
    expect(safeReturnPath('/markets/US')).toBe('/markets/US');
    expect(safeReturnPath('/discover/screener?market=us&sector=technology')).toBe('/discover/screener?market=us&sector=technology');
    expect(safeReturnPath('/research/stocks/MSFT#method')).toBe('/research/stocks/MSFT#method');
    for (const bad of ['https://evil.com', '//evil.com', '/\\evil.com', '\\evil.com', 'javascript:alert(1)', '/%0d%0aSet-Cookie:x', '/x\u0000y', 'evil.com', '', '/login?next=/app', '/verify-phone', 'x'.repeat(3000)])
      expect(safeReturnPath(bad, '/app'), bad).toBe(bad === '/%0d%0aSet-Cookie:x' ? '/%0d%0aSet-Cookie:x' : '/app');
    expect(loginHref('/markets/US')).toBe('/login?next=%2Fmarkets%2FUS');
    expect(loginHref('https://evil.com')).toBe('/login?next=%2Fapp');
  });
});

describe('entity quality gate and titles', () => {
  const p = new DemoProvider(() => new Date('2026-10-06T10:00:00Z'));
  it('indexes complete entities and holds back thin or failing ones', async () => {
    const aapl = (await p.getAsset('AAPL'))!;
    expect(assetQuality(aapl).indexable).toBe(true);
    expect(assetTitle(aapl)).toBe('AAPL Stock: Price, Performance, Valuation & Research');
    expect(assetTitle((await p.getAsset('SPY'))!)).toBe('SPY ETF: Holdings, Expense Ratio, Performance & Research');
    expect(assetQuality({ ...aapl, price: null }).reasons).toContain('no current value');
    expect(assetQuality({ ...aapl, status: 'ERROR' }).indexable).toBe(false);
    const mx = (await p.getMarket('mx'))!;
    expect(marketQuality(mx, 0).indexable).toBe(false);
  });
});

describe('analytics', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
  it('records nothing without consent and only declared props with consent', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) });
    const a = await import('@/lib/telemetry/analytics');
    a.track('search', { queryLength: 4, results: 3 });
    expect(a.analyticsBuffer()).toHaveLength(0);
    a.setAnalyticsConsent('granted');
    const seen: string[] = [];
    a.setAnalyticsSink((e) => seen.push(e.name));
    a.track('watchlist_add', { instrumentId: 'ins_000001' });
    expect(seen).toEqual(['watchlist_add']);
    expect(JSON.stringify(a.analyticsBuffer())).not.toMatch(/@|email|phone/);
  });
});
