import { describe, expect, it } from 'vitest';
import { fallbackLogo, LogoDevProvider, NoLogoProvider } from '@/lib/logos';
import { NSEMarketDataProvider, nseStatus, toCandles, type NseInstrumentMap } from '@/providers/nse';
import { UnconnectedNseSource, type NseSource } from '@/providers/nse/source';
import { ProviderError } from '@/providers/provider';

describe('logo provider', () => {
  const p = new LogoDevProvider('pk_test');
  it('builds Logo.dev ticker URLs with the exchange suffix and a 404 fallback', () => {
    const u = new URL(p.getCompanyLogo({ symbol: 'RELIANCE', mic: 'XNSE', cls: 'stock' })!);
    expect(u.origin + u.pathname).toBe('https://img.logo.dev/ticker/RELIANCE.NS');
    expect(Object.fromEntries(u.searchParams)).toMatchObject({ token: 'pk_test', format: 'png', fallback: '404', retina: 'true' });
    expect(p.getCompanyLogo({ symbol: 'AAPL', mic: 'XNAS', cls: 'stock' })).toMatch(/\/ticker\/AAPL\?/);
    expect(p.getEtfLogo({ symbol: 'INDA', mic: 'BATS', cls: 'etf' })).toMatch(/\/ticker\/INDA\?/);
  });
  it('returns no URL rather than guessing', () => {
    expect(p.getCompanyLogo({ symbol: '000001', mic: 'XSHE', cls: 'stock' })).toBeNull(); // suffix not documented
    expect(p.getCompanyLogo({ symbol: 'NIFTY', mic: 'XNSE', cls: 'index' })).toBeNull(); // indices have no issuer logo
    expect(p.getEtfLogo({ symbol: 'AAPL', mic: 'XNAS', cls: 'stock' })).toBeNull();
    expect(p.getLogoByTicker('../etc/passwd')).toBeNull();
    expect(new NoLogoProvider().getCompanyLogo()).toBeNull();
  });
  it('falls back to a ticker tile', () => {
    expect(fallbackLogo({ symbol: 'BRK.B', name: 'Berkshire' })).toEqual({ text: 'BRKB', label: 'Berkshire' });
  });
});

describe('NSE provider', () => {
  it('fails with NOT_CONFIGURED until a licensed NSE source is connected, never with fabricated data', async () => {
    const nse = new NSEMarketDataProvider(new UnconnectedNseSource());
    await expect(nse.searchAssets('RELIANCE')).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    await expect(nse.getQuote('ins_000001')).rejects.toBeInstanceOf(ProviderError);
  });
  // Test double: exercises normalisation only. It is not an NSE response format.
  const now = new Date('2026-10-06T06:00:00Z');
  const src = {
    getMarketStatus: async () => [{ segment: 'equity', status: 'OPEN' as const, asOf: now.toISOString() }],
    getQuote: async () => ({ symbol: 'RELIANCE', series: 'EQ', last: 1418, prevClose: 1400, exchangeTime: '2026-10-06T05:59:30Z', delayMinutes: 15 }),
    getHistoricalData: async () => [{ t: '2026-10-01', o: 10, h: 11, l: 9, c: 10, v: 5 }, { t: '2026-10-02', o: 10, h: 8, l: 9, c: 10, v: 5 }],
  } as unknown as NseSource;
  const ids: NseInstrumentMap = { toNse: async (id) => (id === 'ins_000001' ? { symbol: 'RELIANCE', series: 'EQ' } : null), fromNse: async () => ({ id: 'ins_000001', slug: 'RELIANCE' }) };
  it('normalises quotes with exchange time, IST and an honest status', async () => {
    const q = await new NSEMarketDataProvider(src, ids, () => now).getQuote('ins_000001');
    expect(q).toMatchObject({ price: 1418, prevClose: 1400, change: 18, currency: 'INR' });
    expect(q!.meta).toMatchObject({ source: 'NSE', timezone: 'Asia/Kolkata', timestamp: '2026-10-06T05:59:30Z', dataStatus: 'DELAYED' });
    expect(nseStatus({ last: 1, delayMinutes: 0 }, 'OPEN')).toBe('LIVE');
    expect(nseStatus({ last: 1, delayMinutes: 0 }, 'CLOSED')).toBe('CLOSED');
    expect(nseStatus({ last: null, delayMinutes: 0 }, 'OPEN')).toBe('UNAVAILABLE');
  });
  it('quarantines invalid bars and reports instruments outside NSE coverage', async () => {
    expect(toCandles([{ t: '2026-10-02', o: 10, h: 8, l: 9, c: 10, v: 5 }])).toHaveLength(0);
    const nse = new NSEMarketDataProvider(src, ids, () => now);
    expect(await nse.getOHLCV('ins_000001', '1M')).toHaveLength(1);
    await expect(nse.getQuote('ins_999999')).rejects.toMatchObject({ code: 'DATA_UNAVAILABLE' });
    expect(await nse.getFX()).toEqual([]);
  });
});
