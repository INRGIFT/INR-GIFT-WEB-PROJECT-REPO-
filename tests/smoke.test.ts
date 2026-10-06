import { describe, expect, it } from 'vitest';
import { sessionState } from '@/lib/calendar';
import { squarify } from '@/lib/treemap';
import { validateCandles } from '@/lib/validation';
import { DemoProvider } from '@/providers/demo';
import { MARKETS } from '@/providers/demo/seed';
import { decodeTree, DEFAULT_TREE, encodeTree, runScreen } from '@/features/screener/logic';

const at = (iso: string) => new DemoProvider(() => new Date(iso));

describe('DemoProvider', () => {
  it('covers every asset class and never exposes trading concepts', async () => {
    const all = await at('2026-10-06T14:12:00Z').listAssets();
    expect(new Set(all.map((a) => a.cls))).toEqual(new Set(['stock', 'etf', 'reit', 'index', 'fx', 'commodity', 'bond']));
    expect(all.every((a) => /^ins_\d{6}$/.test(a.id))).toBe(true);
    expect(JSON.stringify(all)).not.toMatch(/portfolio|order|position|brokerage/i);
  });
  it('produces the demo status cases', async () => {
    const p = at('2026-10-06T14:12:00Z'); // Tuesday 19:42 IST
    const status = async (s: string) => (await p.getAsset(s))!.status;
    expect(await status('AAPL')).toBe('LIVE');
    expect(await status('AZN')).toBe('DELAYED');
    expect(await status('7203')).toBe('END_OF_DAY');
    expect(await status('SSE-COMPOSITE')).toBe('CLOSED'); // National Day holiday
    expect(await status('2222')).toBe('UNAVAILABLE');
    expect(await status('PETR4')).toBe('STALE');
    expect(await status('NATGAS')).toBe('ERROR');
  });
  it('returns null rather than fake data when the source has none', async () => {
    const p = at('2026-10-06T14:12:00Z');
    expect(await p.getFundamentals((await p.getAsset('EMAAR'))!.id)).toBeNull();
    expect(await p.getETFHoldings((await p.getAsset('INDA'))!.id)).toBeNull();
    expect((await p.getAsset('TSM'))!.crossListings?.[0].slug).toBe('2330');
  });
  it('generates OHLCV that passes the quality gate', async () => {
    const p = at('2026-10-06T14:12:00Z');
    const c = (await p.getOHLCV('AAPL', '1Y'))!;
    expect(validateCandles(c).quarantined).toHaveLength(0);
  });
});
describe('calendar', () => {
  it('reads sessions from exchange metadata', () => {
    const ex = (id: string) => MARKETS.find((m) => m.id === id)!.exchanges[0];
    expect(sessionState(ex('jp'), new Date('2026-10-06T03:00:00Z')).state).toBe('BREAK');
    expect(sessionState(ex('sa'), new Date('2026-10-04T08:00:00Z')).state).toBe('OPEN'); // Sunday trades in Riyadh
    expect(sessionState(ex('us'), new Date('2026-11-26T15:00:00Z')).state).toBe('HOLIDAY');
  });
});
describe('screener and treemap', () => {
  it('evaluates nested groups and round-trips the share link', async () => {
    const all = await at('2026-10-06T14:12:00Z').listAssets({ cls: ['stock'] });
    const hits = runScreen(DEFAULT_TREE, all);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((a) => a.m.marketCap! >= 100e9 && ((a.m.revenueGrowth ?? -1) >= 10 || (a.m.dividendYield ?? -1) >= 3))).toBe(true);
    expect(decodeTree(encodeTree(DEFAULT_TREE))).toEqual(DEFAULT_TREE);
    expect(decodeTree('not-a-tree')).toBeNull();
  });
  it('tiles the full area', () => {
    const r = squarify([5, 3, 2], (v) => v, 0, 0, 100, 50);
    expect(r.reduce((s, x) => s + x.w * x.h, 0)).toBeCloseTo(5000, 3);
  });
});
