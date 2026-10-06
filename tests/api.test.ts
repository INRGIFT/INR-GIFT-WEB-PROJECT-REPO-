import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/v1/[...path]/route';
import { POST } from '@/app/api/contact/route';

/** Calls the /api/v1 router directly, the same way Next does. */
async function api(path: string, ip = `10.0.0.${Math.floor(Math.random() * 250)}`) {
  const url = new URL(`http://test/api/v1/${path}`);
  const req = new NextRequest(url, { headers: { 'x-forwarded-for': ip } });
  const res = await GET(req, { params: Promise.resolve({ path: url.pathname.replace('/api/v1/', '').split('/') }) });
  return { status: res.status, body: await res.json() };
}
// User-money and trading concepts. Central-bank terms such as "deposit rate" in macro events are legitimate data.
const FORBIDDEN = /portfolio|order_id|position_size|brokerage|\bdeposits?\b(?! rate)|withdraw|cash balance|buy now|sell now/i;

describe('/api/v1 contract', () => {
  it('returns envelopes with meta and pagination', async () => {
    const r = await api('assets?class=stocks&page=2&pageSize=5');
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(5);
    expect(r.body.pagination).toMatchObject({ page: 2, pageSize: 5 });
    expect(r.body.meta.dataStatus).toMatch(/LIVE|DELAYED|END_OF_DAY|CLOSED|STALE|UNAVAILABLE|ERROR/);
  });
  it('resolves an asset by slug or immutable id', async () => {
    const bySlug = await api('assets/AAPL');
    const byId = await api(`assets/${bySlug.body.data.id}`);
    expect(byId.body.data.slug).toBe('AAPL');
    expect(bySlug.body.data.id).toMatch(/^ins_\d{6}$/);
  });
  it('maps errors to codes and statuses', async () => {
    expect((await api('assets/does-not-exist')).body.error.code).toBe('NOT_FOUND');
    expect((await api('nothing-here')).status).toBe(404);
    expect((await api('assets?pageSize=9999')).body.error.code).toBe('INVALID_QUERY');
    expect((await api('assets/AAPL/ohlcv?range=2W')).status).toBe(400);
    const gas = await api('assets/NATGAS/ohlcv');
    expect(gas.status).toBe(502);
    expect(gas.body.error.code).toBe('PROVIDER_ERROR');
  });
  it('returns null, not fake data, when the source has none', async () => {
    const r = await api('etfs/INDA/holdings');
    expect(r.status).toBe(200);
    expect(r.body.data).toBeNull();
  });
  it('filters by ids for workspace lookups', async () => {
    const ids = (await api('assets?class=stocks&pageSize=3')).body.data.map((a: { id: string }) => a.id);
    const r = await api(`assets?ids=${ids.join(',')}&pageSize=500`);
    expect(r.body.data.map((a: { id: string }) => a.id).sort()).toEqual([...ids].sort());
  });
  it('rate limits per client', async () => {
    let last = 0;
    for (let i = 0; i < 242; i++) last = (await api('themes', '203.0.113.9')).status;
    expect(last).toBe(429);
  });
  it('exposes no trading concepts anywhere in core payloads', async () => {
    for (const p of ['markets', 'assets?pageSize=500', 'heatmap', 'movers', 'research', 'themes', 'calendar']) expect(JSON.stringify((await api(p)).body)).not.toMatch(FORBIDDEN);
  });
});

describe('/api/contact', () => {
  const post = (body: unknown) => POST(new NextRequest('http://test/api/contact', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'x-forwarded-for': `198.51.100.${Math.floor(Math.random() * 250)}` } }));
  it('validates input and reports when delivery is not configured', async () => {
    const bad = await post({ name: '', email: 'x', topic: 'support', message: 'hi' });
    expect(bad.status).toBe(400);
    const ok = await post({ name: 'Asha', email: 'asha@example.com', topic: 'data', message: 'The P/E for AAPL looks off.' });
    expect(ok.status).toBe(503);
    expect((await ok.json()).error.code).toBe('NOT_CONFIGURED');
  });
});
