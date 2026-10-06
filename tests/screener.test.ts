import { describe, expect, it } from 'vitest';
import { decodeTree, encodeTree, evaluate, matchRule, runScreen, type Group, type Rule } from '@/features/screener/logic';
import type { Asset } from '@/lib/types';

/** Deterministic fixtures: hand-written, independent of the demo dataset. */
const asset = (id: string, over: Partial<Asset>, m: Asset['m']): Asset => ({
  id, slug: id, symbol: id, name: `${id} Corp`, cls: 'stock', marketId: 'x', country: 'India', region: 'Asia-Pacific', mic: 'XNSE', exchange: 'NSE', currency: 'INR',
  sector: 'Technology', industry: 'Software', description: '', price: 100, prevClose: 99, status: 'LIVE',
  meta: { timestamp: '2026-10-06T00:00:00Z', timezone: 'Asia/Kolkata', ingestedAt: '2026-10-06T00:00:00Z', source: 'fixture', dataStatus: 'LIVE' }, ...over, m,
});
const A = asset('AAA', {}, { pe: 20, fpe: 18, dividendYield: 1.5, marketCap: 250e9, revenueGrowth: 12 });
const B = asset('BBB', { country: 'Japan', region: 'Asia-Pacific', currency: 'JPY', sector: 'Financials', industry: 'Banks' }, { pe: 9, fpe: 10, dividendYield: 4.2, marketCap: 80e9, revenueGrowth: 3 });
const C = asset('CCC', { country: 'United States', region: 'North America', currency: 'USD', cls: 'etf' }, { pe: null, dividendYield: 0, aum: 30e9 });
const D = asset('DDD', { name: 'Delta Bank', sector: 'Financials' }, { pe: 2.5000000001, fpe: undefined, dividendYield: 2.5, marketCap: 100e9 });
const ALL = [A, B, C, D];
const ids = (t: Group) => runScreen(t, ALL).map((a) => a.id);
const rule = (r: Rule) => (a: Asset) => matchRule(a, r);

describe('screener rules', () => {
  it('applies inclusive and strict numeric comparisons', () => {
    expect(ALL.filter(rule({ field: 'pe', op: 'gte', value: '20' })).map((a) => a.id)).toEqual(['AAA']);
    expect(ALL.filter(rule({ field: 'pe', op: 'gt', value: '20' }))).toHaveLength(0);
    expect(ALL.filter(rule({ field: 'pe', op: 'lt', value: '9' })).map((a) => a.id)).toEqual(['DDD']);
    expect(ALL.filter(rule({ field: 'pe', op: 'lte', value: '9' })).map((a) => a.id)).toEqual(['BBB', 'DDD']);
    expect(ALL.filter(rule({ field: 'pe', op: 'eq', value: '2.5' })).map((a) => a.id)).toEqual(['DDD']);
  });
  it('handles ranges, open ranges and market cap in billions', () => {
    expect(ALL.filter(rule({ field: 'dividendYield', op: 'between', value: '1', value2: '3' })).map((a) => a.id)).toEqual(['AAA', 'DDD']);
    expect(ALL.filter(rule({ field: 'dividendYield', op: 'between', value: '2', value2: '' })).map((a) => a.id)).toEqual(['BBB', 'DDD']);
    expect(ALL.filter(rule({ field: 'marketCap', op: 'gte', value: '100' })).map((a) => a.id)).toEqual(['AAA', 'DDD']);
  });
  it('compares one field with another and skips assets missing either side', () => {
    expect(ALL.filter(rule({ field: 'pe', op: 'gtf', value: 'fpe' })).map((a) => a.id)).toEqual(['AAA']);
    expect(ALL.filter(rule({ field: 'pe', op: 'ltf', value: 'fpe' })).map((a) => a.id)).toEqual(['BBB']);
    expect(ALL.filter(rule({ field: 'pe', op: 'gtf', value: '' }))).toHaveLength(3); // unfinished: does not filter, but null P/E never matches
  });
  it('never matches unavailable or not-applicable values', () => {
    expect(matchRule(C, { field: 'pe', op: 'lte', value: '100' })).toBe(false); // null
    expect(matchRule(D, { field: 'fpe', op: 'gte', value: '0' })).toBe(false); // undefined
    expect(matchRule(C, { field: 'dividendYield', op: 'eq', value: '0' })).toBe(true); // a real zero is a value
  });
  it('filters categories and text', () => {
    expect(ALL.filter(rule({ field: 'country', op: 'is', value: 'Japan' })).map((a) => a.id)).toEqual(['BBB']);
    expect(ALL.filter(rule({ field: 'country', op: 'not', value: 'India' })).map((a) => a.id)).toEqual(['BBB', 'CCC']);
    expect(ALL.filter(rule({ field: 'currency', op: 'in', value: 'USD|JPY' })).map((a) => a.id)).toEqual(['BBB', 'CCC']);
    expect(ALL.filter(rule({ field: 'cls', op: 'is', value: 'ETFs' })).map((a) => a.id)).toEqual(['CCC']);
    expect(ALL.filter(rule({ field: 'name', op: 'contains', value: 'bank' })).map((a) => a.id)).toEqual(['DDD']);
  });
});

describe('screener groups', () => {
  it('evaluates nested AND/OR trees', () => {
    const t: Group = { op: 'AND', rules: [{ field: 'region', op: 'is', value: 'Asia-Pacific' }, { op: 'OR', rules: [{ field: 'dividendYield', op: 'gte', value: '4' }, { field: 'revenueGrowth', op: 'gte', value: '10' }] }] };
    expect(ids(t)).toEqual(['AAA', 'BBB']);
    expect(ids({ op: 'OR', rules: [] })).toEqual(['AAA', 'BBB', 'CCC', 'DDD']);
    expect(evaluate({ op: 'OR', rules: [{ field: 'pe', op: 'gt', value: '100' }, { field: 'sector', op: 'is', value: 'Financials' }] }, D)).toBe(true);
  });
  it('round-trips through a share link and rejects tampered rules', () => {
    const t: Group = { op: 'AND', rules: [{ field: 'pe', op: 'ltf', value: 'fpe' }, { field: 'dividendYield', op: 'between', value: '1', value2: '5' }] };
    expect(decodeTree(encodeTree(t))).toEqual(t);
    const bad = encodeTree({ op: 'AND', rules: [{ field: 'pe', op: 'exec', value: '1' } as unknown as Rule, { field: '__proto__', op: 'gte', value: '1' } as unknown as Rule] });
    expect(decodeTree(bad)).toEqual({ op: 'AND', rules: [] });
  });
});
