import { describe, expect, it } from 'vitest';
import { DemoProvider } from '@/providers/demo';

describe('instrument identity', () => {
  const p = new DemoProvider(() => new Date('2026-10-06T10:00:00Z'));
  it('links an ADR to its ordinary shares with the depositary ratio', async () => {
    const id = (await p.getIdentity('TSM'))!;
    expect(id.issuer.name).toBe('TSMC');
    const adr = id.securities.find((s) => s.kind === 'adr')!;
    const ordinary = id.listings.find((l) => l.securityKey === adr.underlyingKey)!;
    expect(adr.ratio).toBe('1 ADR = 5 ordinary shares');
    expect(ordinary).toMatchObject({ ticker: '2330', mic: 'XTAI', primary: true, covered: true });
    expect(id.listings.every((l) => l.instrumentId === null || /^ins_\d{6}$/.test(l.instrumentId))).toBe(true);
  });
  it('models multiple share classes and reference-only listings without inventing identifiers', async () => {
    const id = (await p.getIdentity('GOOGL'))!;
    expect(id.securities.map((s) => s.shareClass).sort()).toEqual(['Class A', 'Class C']);
    const goog = id.listings.find((l) => l.ticker === 'GOOG')!;
    expect(goog).toMatchObject({ covered: false, instrumentId: null, providerSymbols: [] });
    expect(id.securities.every((s) => s.isin === null)).toBe(true);
    const infy = (await p.getIdentity('INFY'))!;
    expect(infy.listings.map((l) => `${l.ticker}:${l.mic}`).sort()).toEqual(['INFY:XNSE', 'INFY:XNYS']);
  });
  it('returns one fund-unit security for an ETF and nothing for an index', async () => {
    const etf = (await p.getIdentity('SPY'))!;
    expect(etf.securities).toHaveLength(1);
    expect(etf.securities[0].kind).toBe('fund_unit');
    const index = (await p.getIndexData())[0];
    expect(index.cls).toBe('index');
    expect(await p.getIdentity(index.id)).toBeNull();
  });
});
