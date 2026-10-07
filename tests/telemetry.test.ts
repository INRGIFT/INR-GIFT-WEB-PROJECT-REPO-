import { afterEach, describe, expect, it, vi } from 'vitest';
import { assetQuality, assetTitle, marketQuality } from '@/lib/indexability';
import { isNoindexPath, isPrivatePath, matchRoute, ROUTES } from '@/lib/route-registry';
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
  it('classifies access and indexing', () => {
    expect(isPrivatePath('/app/watchlist')).toBe(true);
    expect(isPrivatePath('/application')).toBe(false);
    expect(isNoindexPath('/login')).toBe(true);
    expect(isNoindexPath('/search')).toBe(true);
    expect(isNoindexPath('/stocks/AAPL')).toBe(false);
    expect(matchRoute('/markets/all')?.pattern).toBe('/markets/all');
    expect(matchRoute('/markets/India')?.pattern).toBe('/markets/[market]');
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
