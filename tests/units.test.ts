import { describe, expect, it } from 'vitest';
import { alertLabel, alertProblem, evaluateAlert, staysActive } from '@/lib/alerts';
import { istHours, lastClose, sessionState } from '@/lib/calendar';
import { compact, inrLakhCrore, money, pct, priceDp } from '@/lib/format';
import { bollinger, ema, rebase, rsi, sma } from '@/lib/indicators';
import { fmtMetric } from '@/lib/metrics';
import { rateLimit } from '@/lib/rate-limit';
import type { Asset, WorkspaceTables } from '@/lib/types';
import { validateCandles } from '@/lib/validation';
import { DemoProvider } from '@/providers/demo';
import { withFallback } from '@/providers';
import type { MarketDataProvider } from '@/providers/provider';
import { ProviderError } from '@/providers/provider';
import { MARKETS } from '@/providers/demo/seed';
import { toCsv, updateAt, type Group } from '@/features/screener/logic';
import { safeNext } from '@/features/auth/auth-ui';

describe('format', () => {
  it('formats money, percentages and sizes consistently', () => {
    expect(money(254.1, 'USD')).toBe('$254.10');
    expect(money(2915, 'JPY')).toBe('¥2,915.0');
    expect(money(null, 'USD')).toBe('—');
    expect(pct(2.666)).toBe('+2.67%');
    expect(pct(-1)).toBe('−1.00%');
    expect(compact(4.45e12)).toBe('4.45T');
    expect(priceDp(0.5)).toBe(4);
    expect(inrLakhCrore(1e12, 88.4)).toBe('₹88.4 L Cr');
    expect(inrLakhCrore(2e12, 88.4)).toBe('₹177 L Cr');
  });
  it('never renders a fake zero for missing metrics', () => {
    expect(fmtMetric('pe', undefined)).toEqual({ text: 'n/a', state: 'na' });
    expect(fmtMetric('pe', null).state).toBe('unavailable');
    expect(fmtMetric('pe', 33.4).text).toBe('33.4×');
  });
});

describe('calendar', () => {
  const ex = (id: string) => MARKETS.find((m) => m.id === id)!.exchanges[0];
  it('finds the last close before the open and after a weekend', () => {
    const monMorning = new Date('2026-10-05T08:00:00Z'); // Monday 04:00 New York
    expect(lastClose(ex('us'), monMorning).toISOString()).toBe('2026-10-02T20:00:00.000Z'); // Friday 16:00 EDT
  });
  it('converts hours to IST across daylight saving', () => {
    expect(istHours(ex('us'), new Date('2026-07-01T12:00:00Z'))).toEqual({ open: 19, close: 1.5 });
    expect(istHours(ex('us'), new Date('2026-12-01T12:00:00Z'))).toEqual({ open: 20, close: 2.5 });
  });
  it('honours half days and pre-market', () => {
    expect(sessionState(ex('us'), new Date('2026-11-27T18:30:00Z')).state).toBe('POST_MARKET'); // 13:30 New York, after the 13:00 early close
    expect(sessionState(ex('us'), new Date('2026-11-24T18:30:00Z')).state).toBe('OPEN'); // same time on a normal day
    expect(sessionState(ex('us'), new Date('2026-10-06T12:00:00Z')).state).toBe('PRE_MARKET');
  });
});

describe('data quality gate', () => {
  const ok = { t: '2026-01-01T00:00:00Z', o: 10, h: 11, l: 9, c: 10.5, v: 100 };
  it('quarantines each kind of bad row', () => {
    const r = validateCandles([ok, { ...ok, t: 'nope' }, { ...ok }, { ...ok, t: '2026-01-02T00:00:00Z', h: 8 }, { ...ok, t: '2026-01-03T00:00:00Z', v: -1 }, { ...ok, t: '2026-01-04T00:00:00Z', c: 100, h: 101 }]);
    expect(r.clean).toHaveLength(1);
    expect(r.issues.map((i) => i.code).sort()).toEqual(['BAD_TIMESTAMP', 'DUPLICATE', 'NEGATIVE_VOLUME', 'OHLC_INCONSISTENT', 'UNADJUSTED_JUMP']);
  });
});

describe('provider fallback', () => {
  it('serves the last good value as STALE when the provider fails', async () => {
    const demo = new DemoProvider(() => new Date('2026-10-06T14:12:00Z'));
    let fail = false;
    const flaky = new Proxy(demo, { get: (t, p) => (p === 'getAsset' ? async (...a: [string]) => { if (fail) throw new ProviderError('PROVIDER_ERROR', 'down'); return t.getAsset(...a); } : (t as unknown as Record<string | symbol, unknown>)[p]) }) as MarketDataProvider;
    const p = withFallback(flaky, null);
    expect((await p.getAsset('AAPL'))!.status).toBe('LIVE');
    fail = true;
    const stale = await p.getAsset('AAPL');
    expect(stale!.status).toBe('STALE');
    expect(stale!.meta.dataStatus).toBe('STALE');
    await expect(p.getAsset('MSFT')).rejects.toBeInstanceOf(ProviderError);
  });
});

describe('rate limit', () => {
  it('allows the limit, then blocks until the window resets', () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 1000, 0).ok).toBe(true);
    expect(rateLimit(key, 3, 1000, 10).ok).toBe(false);
    expect(rateLimit(key, 3, 1000, 1001).ok).toBe(true);
  });
});

describe('indicators', () => {
  const c = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i / 3) * 5 + i * 0.2);
  it('computes windows and leaves gaps before they fill', () => {
    expect(sma([1, 2, 3, 4], 2)).toEqual([null, 1.5, 2.5, 3.5]);
    expect(ema(c, 10).slice(0, 9).every((x) => x === null)).toBe(true);
    const bb = bollinger(c, 20);
    expect(bb.upper[25]! > bb.mid[25]! && bb.mid[25]! > bb.lower[25]!).toBe(true);
    const r = rsi(c);
    expect(r[13]).toBeNull();
    expect(r.slice(14).every((x) => x! >= 0 && x! <= 100)).toBe(true);
    expect(rebase([50, 55])).toEqual([0, 10.000000000000009]);
  });
});

describe('screener tree edits and export', () => {
  const tree: Group = { op: 'AND', rules: [{ field: 'pe', op: 'lte', value: '30' }, { op: 'OR', rules: [{ field: 'y1', op: 'gte', value: '20' }] }] };
  it('edits and removes nodes by path without mutating', () => {
    const next = updateAt(tree, [1, 0], () => ({ field: 'y1', op: 'gte', value: '25' }));
    expect(((next.rules[1] as Group).rules[0] as { value: string }).value).toBe('25');
    expect(((tree.rules[1] as Group).rules[0] as { value: string }).value).toBe('20');
    expect(updateAt(tree, [0], () => null).rules).toHaveLength(1);
  });
  it('escapes CSV fields', () => {
    const a = { symbol: 'X', name: 'A, "B"', cls: 'stock', exchange: 'E', country: 'C', currency: 'USD', price: 1, m: { pe: 2 } } as unknown as Asset;
    expect(toCsv([a], ['pe']).split('\n')[1]).toBe('X,"A, ""B""",Stock,E,C,USD,1,2');
  });
});

describe('alerts', () => {
  const base = (over: Partial<WorkspaceTables['alerts']>): WorkspaceTables['alerts'] => ({ id: 'a', instrument_id: 'ins_000001', kind: 'price_above', threshold: 100, status: 'active', channel: 'in_app', last_triggered_at: null, created_at: '2026-10-01T00:00:00Z', ...over });
  const asset = (over: Partial<Asset> = {}) => ({ slug: 'AAPL', symbol: 'AAPL', price: 120, currency: 'USD', status: 'LIVE', m: { d1: 3.2, pe: 18 }, ...over }) as Asset;
  const now = new Date('2026-10-06T10:00:00Z');
  it('fires level and move alerts only when crossed', () => {
    expect(evaluateAlert(base({}), { asset: asset(), now }).fired).toBe(true);
    expect(evaluateAlert(base({ threshold: 130 }), { asset: asset(), now }).fired).toBe(false);
    expect(evaluateAlert(base({ kind: 'pct_move', threshold: 3 }), { asset: asset(), now }).fired).toBe(true);
    expect(evaluateAlert(base({ kind: 'valuation', threshold: 15 }), { asset: asset(), now }).fired).toBe(false);
  });
  it('never fires on a failed or unavailable quote, or when paused', () => {
    expect(evaluateAlert(base({}), { asset: asset({ status: 'ERROR' }), now }).fired).toBe(false);
    expect(evaluateAlert(base({}), { asset: asset({ status: 'UNAVAILABLE' }), now }).fired).toBe(false);
    expect(evaluateAlert(base({ status: 'paused' }), { asset: asset(), now }).fired).toBe(false);
  });
  it('fires event alerts once per new item', () => {
    const news = [{ id: 'n', headline: 'H', publisher: 'P', publishedAt: '2026-10-05T00:00:00Z', category: 'x', assetSlug: 'AAPL', url: '/' }];
    expect(evaluateAlert(base({ kind: 'news', threshold: null }), { asset: asset(), news, now }).fired).toBe(true);
    expect(evaluateAlert(base({ kind: 'news', threshold: null, last_triggered_at: '2026-10-05T12:00:00Z' }), { asset: asset(), news, now }).fired).toBe(false);
    expect(staysActive('news') && !staysActive('price_above')).toBe(true);
  });
  it('validates thresholds against the current price', () => {
    expect(alertProblem('price_above', '110', { price: 120, m: {} })).toMatch(/Already above/);
    expect(alertProblem('price_above', '', { price: 120, m: {} })).toMatch(/greater than zero/);
    expect(alertProblem('news', '')).toBeNull();
    expect(alertLabel('pct_move', 3)).toBe('One-day move exceeds (%) 3.0%');
  });
});

describe('auth redirects', () => {
  it('only allows same-origin paths', () => {
    expect(safeNext('/stocks/AAPL')).toBe('/stocks/AAPL');
    expect(safeNext('//evil.com')).toBe('/app');
    expect(safeNext('https://evil.com')).toBe('/app');
    expect(safeNext('/\\evil.com')).toBe('/app');
    expect(safeNext('/login?next=/x')).toBe('/app');
    expect(safeNext(null, '/onboarding')).toBe('/onboarding');
  });
});

describe('authenticated navigation', () => {
  it('has the Workspace, Account and Support groups in order, and nothing that trades', async () => {
    const { APP_NAV, APP_NAV_MORE, appTitle } = await import('@/lib/routes');
    const { classifyPath } = await import('@/lib/route-registry');
    expect(APP_NAV.map((g) => [g.group, g.items.map((i) => i.label)])).toEqual([
      ['Workspace', ['Home', 'Discover', 'Markets', 'Screeners', 'Compare', 'Research', 'News', 'Watchlists', 'Alerts', 'Saved Research']],
      ['Account', ['Profile', 'Security', 'Sessions', 'Preferences']],
      ['Support', ['Support', 'Grievance Redressal', 'Account Closure']],
    ]);
    const all = [...APP_NAV.flatMap((g) => g.items), ...APP_NAV_MORE];
    expect(JSON.stringify(all.map((i) => [i.label, i.href]))).not.toMatch(/portfolio|holding|order|position|broker|trade now|buy|sell|deposit|withdraw|p&l/i);
    // Every product link is protected; the support links are the public compliance pages.
    for (const i of all) expect(classifyPath(i.href), i.href).toBe(['/support', '/grievance-redressal', '/account-closure'].includes(i.href) ? 'public' : 'protected');
    expect(appTitle('/news')).toBe('News');
    expect(appTitle('/account/sessions')).toBe('Sessions');
    expect(appTitle('/stocks/AAPL')).toBe('Markets');
    expect(appTitle('/app')).toBe('Home');
  });
});
