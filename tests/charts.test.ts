import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { sessionOn, zoned } from '@/lib/calendar';
import { aggregateBars, barOpenTimes, GLOBAL_VENUE, inferResolution, supportedResolutions } from '@/lib/charts/bars';
import { alignRebased, periodFor, rebaseBars, staticDataLoader, symbolFor, toKLineData } from '@/lib/charts/klinechart/adapter';
import { formatBarTime } from '@/lib/charts/klinechart/formatting';
import { INDICATORS } from '@/lib/charts/klinechart/indicators';
import type { ChartBar, ChartSeries } from '@/lib/charts/types';
import { macd } from '@/lib/indicators';
import { classifyPath } from '@/lib/route-registry';
import type { Exchange } from '@/lib/types';
import { MARKETS } from '@/providers/demo/seed';

/**
 * Financial charts: the KLineChart dependency and its notices, the venue-calendar bar model, the chart data contract
 * served from the demo provider, the KLineChart adapter, and the public/private boundary. Time is pinned to
 * Tue 6 Oct 2026 14:12 UTC (19:42 IST) so sessions and holidays are deterministic.
 */
beforeAll(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-06T14:12:00Z')); });
afterAll(() => vi.useRealTimers());

const venue = (marketId: string, mic?: string): Exchange => { const m = MARKETS.find((x) => x.id === marketId)!; return m.exchanges.find((e) => e.mic === mic) ?? m.exchanges[0]; };
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');

describe('KLineChart dependency, licence and notices', () => {
  const pkg = JSON.parse(readFileSync('node_modules/klinecharts/package.json', 'utf8'));
  it('is the official package, pinned to an exact version, Apache-2.0', () => {
    expect(JSON.parse(readFileSync('package.json', 'utf8')).dependencies.klinecharts).toBe('10.0.3');
    expect(pkg.version).toBe('10.0.3');
    expect(pkg.license).toBe('Apache-2.0');
    expect(pkg.repository.url).toContain('github.com/klinecharts/KLineChart');
    expect(pkg.dependencies ?? {}).toEqual({});
  });
  it('ships its LICENSE, NOTICE and bundled licence unchanged in public/licenses/klinecharts', () => {
    expect(sha('public/licenses/klinecharts/LICENSE.txt')).toBe(sha('node_modules/klinecharts/LICENSE'));
    expect(sha('public/licenses/klinecharts/NOTICE.txt')).toBe(sha('node_modules/klinecharts/NOTICE'));
    expect(sha('public/licenses/klinecharts/LICENSE-lightweight-charts.txt')).toBe(sha('node_modules/klinecharts/licenses/LICENSE-lightweight-charts'));
    expect(readFileSync('public/licenses/klinecharts/LICENSE.txt', 'utf8')).toContain('Apache License');
  });
  it('reproduces the NOTICE verbatim in THIRD_PARTY_NOTICES.md and on /legal/open-source', async () => {
    const notice = readFileSync('node_modules/klinecharts/NOTICE', 'utf8').replace(/\n+$/, '');
    expect(readFileSync('THIRD_PARTY_NOTICES.md', 'utf8')).toContain(notice);
    const { getLegalDoc } = await import('@/services/content');
    const doc = (await getLegalDoc('open-source'))!;
    expect(doc.path).toBe('/legal/open-source');
    const pre = doc.sections.find((s) => s.preformatted)!.preformatted!.join('\n');
    expect(pre).toBe(notice);
    expect(JSON.stringify(doc)).toMatch(/do not endorse or sponsor INRGIFT/);
    expect(JSON.stringify(doc)).not.toMatch(/partner|official TradingView|powered by TradingView/i);
  });
  it('licence files and the notices page are public; the chart API is not', () => {
    expect(classifyPath('/licenses/klinecharts/LICENSE.txt')).toBe('file');
    expect(classifyPath('/licenses/klinecharts/NOTICE.txt')).toBe('file');
    expect(classifyPath('/legal/open-source')).toBe('public');
    expect(classifyPath('/api/v1/assets/AAPL/chart')).toBe('protected');
    expect(classifyPath('/stocks/AAPL')).toBe('protected');
  });
});

describe('bars on the venue calendar', () => {
  const nse = venue('in');
  it('daily bars fall on trading days only (no weekends, no NSE holidays), one per session, none after the as-of time', () => {
    const until = new Date('2026-10-06T14:12:00Z');
    const times = barOpenTimes(nse, '1D', new Date('2026-09-01T00:00:00Z'), until);
    const dates = times.map((t) => zoned('Asia/Kolkata', t).date);
    expect(new Set(dates).size).toBe(dates.length);
    expect(dates).not.toContain('2026-10-02'); // Gandhi Jayanti
    expect(dates.every((d) => { const w = new Date(`${d}T00:00:00Z`).getUTCDay(); return w !== 0 && w !== 6; })).toBe(true);
    expect(times.every((t) => t <= until)).toBe(true);
    expect(dates.at(-1)).toBe('2026-10-06');
    expect(zoned('Asia/Kolkata', times[0]).minutes).toBe(9 * 60 + 15); // the session's open, 09:15 IST
  });
  it('intraday bars sit inside the session, skip breaks and stop at the last completed bar', () => {
    const tokyo = venue('jp');
    const day = sessionOn(tokyo, '2026-10-06')!;
    const bars = barOpenTimes(tokyo, '5m', day.open, day.close);
    const mins = bars.map((t) => zoned('Asia/Tokyo', t).minutes);
    expect(Math.min(...mins)).toBe(9 * 60);
    expect(Math.max(...mins)).toBe(15 * 60 + 25);
    expect(mins.some((m) => m >= 11 * 60 + 30 && m < 12 * 60 + 30)).toBe(false); // lunch break
    const midSession = barOpenTimes(tokyo, '5m', day.open, new Date(day.open.getTime() + 62 * 60000));
    expect(midSession).toHaveLength(12); // 09:00 … 09:55, the 10:00 bar is not complete
  });
  it('follows the exchange week: Tadawul trades Sunday to Thursday', () => {
    const tadawul = venue('sa');
    const dates = barOpenTimes(tadawul, '1D', new Date('2026-09-01T00:00:00Z'), new Date('2026-10-06T14:00:00Z')).map((t) => new Date(`${zoned('Asia/Riyadh', t).date}T00:00:00Z`).getUTCDay());
    expect(dates).toContain(0);
    expect(dates.some((w) => w === 5 || w === 6)).toBe(false);
  });
  it('a holiday market gets no new bar', () => {
    const shanghai = venue('cn');
    const dates = barOpenTimes(shanghai, '1D', new Date('2026-09-20T00:00:00Z'), new Date('2026-10-06T14:12:00Z')).map((t) => zoned('Asia/Shanghai', t).date);
    expect(dates.at(-1)).toBe('2026-09-30'); // 1–7 Oct: National Day
  });
});

describe('resolutions and aggregation', () => {
  const bar = (t: number, o: number, h: number, l: number, c: number, v: number | null = 10): ChartBar => ({ t, o, h, l, c, v });
  it('infers the resolution from bar spacing', () => {
    const at = (min: number, n: number) => Array.from({ length: n }, (_, i) => ({ t: i * min * 60000 }));
    expect(inferResolution(at(5, 20))).toBe('5m');
    expect(inferResolution(at(30, 20))).toBe('30m');
    expect(inferResolution(at(1440, 20))).toBe('1D');
    expect(inferResolution(at(1440 * 7, 20))).toBe('1W');
    expect(inferResolution(at(1440 * 30, 20))).toBe('1M');
  });
  it('offers only the native resolution and whole-bar aggregations, never finer ones', () => {
    expect(supportedResolutions('5m', 78)).toEqual(['5m', '15m', '30m', '1h']);
    expect(supportedResolutions('1D', 250)).toEqual(['1D', '1W', '1M']);
    expect(supportedResolutions('1D', 22)).toEqual(['1D']);
    expect(supportedResolutions('1M', 120)).toEqual(['1M']);
    expect(supportedResolutions('1D', 250)).not.toContain('1m');
  });
  it('aggregates daily bars into the exchange week: first open, highest high, lowest low, last close, summed volume', () => {
    const nse = venue('in');
    const days = barOpenTimes(nse, '1D', new Date('2026-09-14T00:00:00Z'), new Date('2026-09-26T00:00:00Z'));
    const daily = days.map((t, i) => bar(t.getTime(), 100 + i, 110 + i, 90 - i, 105 + i, 1000));
    const weekly = aggregateBars(daily, '1W', nse);
    expect(weekly).toHaveLength(2);
    expect(weekly[0]).toEqual({ t: daily[0].t, o: 100, h: 114, l: 86, c: 109, v: 5000 });
    expect(aggregateBars(daily.map((b, i) => (i === 1 ? { ...b, v: null } : b)), '1W', nse)[0].v).toBeNull();
  });
  it('intraday aggregation never crosses sessions', () => {
    const nse = venue('in');
    const s1 = sessionOn(nse, '2026-10-05')!, s2 = sessionOn(nse, '2026-10-06')!;
    const five = [...barOpenTimes(nse, '5m', s1.open, s1.close), ...barOpenTimes(nse, '5m', s2.open, s2.close)].map((t, i) => bar(t.getTime(), i, i + 1, i - 1, i + 0.5));
    const hourly = aggregateBars(five, '1h', nse);
    const sessionsOf = hourly.map((b) => zoned('Asia/Kolkata', new Date(b.t)).date);
    expect(sessionsOf.filter((d) => d === '2026-10-05')).toHaveLength(7); // 09:15–15:30 → 7 hourly groups
    expect(hourly.every((b) => zoned('Asia/Kolkata', new Date(b.t)).minutes >= 9 * 60 + 15)).toBe(true);
  });
});

describe('chart data service (demo provider)', () => {
  const load = async (id: string, range: Parameters<typeof import('@/services/chart-data')['getChartSeries']>[1] = '1Y', res?: Parameters<typeof import('@/services/chart-data')['getChartSeries']>[2]) => (await import('@/services/chart-data')).getChartSeries(id, range, res);
  const ok = async (...a: Parameters<typeof load>) => { const r = await load(...a); if (!r.ok) throw new Error(r.error.message); return r.series; };
  it('resolves by slug or immutable id to the same instrument, with listing, native currency and venue time zone', async () => {
    const bySlug = await ok('AAPL');
    const byId = await ok(bySlug.instrumentId);
    expect(bySlug.instrumentId).toMatch(/^ins_\d{6}$/);
    expect(byId.instrumentId).toBe(bySlug.instrumentId);
    expect(bySlug).toMatchObject({ symbol: 'AAPL', currency: 'USD', unit: 'price', timezone: 'America/New_York', listing: { mic: 'XNAS', marketId: 'us' }, source: 'demo-provider', realtime: false });
  });
  it('labels demo data DEMO, never LIVE, and keeps the market session separate', async () => {
    const s = await ok('AAPL');
    expect(s.status).toBe('DEMO');
    expect(s.session).toBe('OPEN'); // 10:12 New York time
    expect((await ok('7203')).status).toBe('DEMO');
    expect((await ok('7203')).session).toBe('CLOSED');
    const shanghai = await ok('SSE-COMPOSITE');
    expect(shanghai.session).toBe('HOLIDAY');
    expect(shanghai.holidayName).toMatch(/National Day/);
  });
  it('bars are ordered, validated, end on the quote (last close = price, previous close = quote previous close)', async () => {
    const s = await ok('AAPL');
    expect(s.bars.length).toBeGreaterThan(200);
    expect(s.bars.every((b, i) => i === 0 || b.t > s.bars[i - 1].t)).toBe(true);
    expect(s.bars.every((b) => b.h >= Math.max(b.o, b.c) && b.l <= Math.min(b.o, b.c))).toBe(true);
    expect(s.bars.at(-1)!.c).toBeCloseTo(s.last.price!, 6);
    expect(s.bars.at(-2)!.c).toBeCloseTo(s.last.prevClose!, 6);
    expect(s.resolution).toBe('1D');
    expect(s.supported).toEqual(['1D', '1W', '1M']);
    expect(s.bars.every((b) => b.v != null && b.v > 0)).toBe(true);
  });
  it('indices are points without volume; spot FX has no venue session and keeps its quote currency', async () => {
    const nifty = await ok('NIFTY-50');
    expect(nifty).toMatchObject({ unit: 'points', currency: 'INR', timezone: 'Asia/Kolkata' });
    expect(nifty.bars.every((b) => b.v === null)).toBe(true);
    const usdinr = await ok('USD-INR');
    expect(usdinr).toMatchObject({ unit: 'rate', currency: 'INR', session: null, timezone: 'UTC', pricePrecision: 2 });
    expect((await ok('EUR-USD')).pricePrecision).toBe(4);
  });
  it('multiple listings of one issuer stay separate instruments with their own currency, exchange and time zone', async () => {
    const adr = await ok('TSM'), local = await ok('2330');
    expect(adr.instrumentId).not.toBe(local.instrumentId);
    expect([adr.currency, adr.listing.mic, adr.timezone]).toEqual(['USD', 'XNYS', 'America/New_York']);
    expect([local.currency, local.listing.mic, local.timezone]).toEqual(['TWD', 'XTAI', 'Asia/Taipei']);
  });
  it('intraday ranges use intraday bars; unsupported resolutions are refused with the alternatives', async () => {
    const day = await ok('AAPL', '1D');
    expect(day.resolution).toBe('5m');
    expect(day.bars.every((b) => { const m = zoned('America/New_York', new Date(b.t)).minutes; return m >= 9 * 60 + 30 && m < 16 * 60; })).toBe(true);
    const r = await load('AAPL', '1Y', '5m');
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.error.code).toBe('UNSUPPORTED_RESOLUTION'); expect(r.error.supported).toEqual(['1D', '1W', '1M']); }
    const weekly = await ok('AAPL', '1Y', '1W');
    expect(weekly.resolution).toBe('1W');
    expect(weekly.bars.length).toBeLessThan(60);
  });
  it('provider failure, stale and unavailable states come through honestly', async () => {
    const failed = await load('NATGAS');
    expect(failed.ok).toBe(false);
    if (!failed.ok) { expect(failed.error.code).toBe('PROVIDER_ERROR'); expect(failed.error.message).not.toMatch(/stack|Error:|demo-provider/i); }
    expect((await ok('PETR4')).status).toBe('STALE');
    expect((await ok('2222')).status).toBe('UNAVAILABLE');
    expect((await load('NO-SUCH-THING')).ok).toBe(false);
  });
  it('never carries secrets, keys or a vendor endpoint', async () => {
    vi.stubEnv('NEWSIO_API_KEY', 'pub_secret_value_123'); vi.stubEnv('RESEND_API_KEY', 're_secret_value_456');
    const text = JSON.stringify(await ok('AAPL'));
    expect(text).not.toMatch(/pub_secret_value_123|re_secret_value_456|apikey|api_key|secret|token|https?:\/\//i);
    vi.unstubAllEnvs();
  });
});

describe('KLineChart adapter', () => {
  const s = (bars: ChartBar[], extra: Partial<ChartSeries> = {}) => ({ bars, resolution: '1D' as const, timezone: 'Asia/Kolkata', ...extra });
  it('maps bars one to one; volume is omitted, not zero, when the source has none', () => {
    const k = toKLineData([{ t: 1, o: 1, h: 2, l: 0.5, c: 1.5, v: 10 }, { t: 2, o: 1.5, h: 2, l: 1, c: 1.8, v: null }]);
    expect(k[0]).toEqual({ timestamp: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 });
    expect('volume' in k[1]).toBe(false);
  });
  it('maps every resolution to a KLineChart period', () => {
    expect(periodFor('5m')).toEqual({ type: 'minute', span: 5 });
    expect(periodFor('1h')).toEqual({ type: 'hour', span: 1 });
    expect(periodFor('1D')).toEqual({ type: 'day', span: 1 });
    expect(periodFor('1W')).toEqual({ type: 'week', span: 1 });
    expect(periodFor('1M')).toEqual({ type: 'month', span: 1 });
  });
  it('the data loader serves the initial bars once and nothing more (no realtime, no subscription)', () => {
    const loader = staticDataLoader(() => toKLineData([{ t: 1, o: 1, h: 1, l: 1, c: 1, v: null }]));
    expect(loader.subscribeBar).toBeUndefined();
    const calls: [number, unknown][] = [];
    for (const type of ['init', 'forward', 'backward'] as const) void loader.getBars({ type, timestamp: null, symbol: { ticker: 'X', pricePrecision: 2, volumePrecision: 0 }, period: { type: 'day', span: 1 }, callback: (d, more) => calls.push([d.length, more]) });
    expect(calls).toEqual([[1, false], [0, false], [0, false]]);
    expect(symbolFor({ symbol: 'AAPL', instrumentId: 'ins_000001', pricePrecision: 2, volumePrecision: 0 }, '1Y').ticker).toBe('AAPL|1Y');
  });
  it('rebases to percent change from the first close, and aligns other venues by trading date with gaps', () => {
    const d = (date: string) => Date.parse(`${date}T04:00:00Z`);
    expect(rebaseBars([{ t: 1, o: 100, h: 110, l: 90, c: 100, v: null }, { t: 2, o: 100, h: 130, l: 100, c: 125, v: null }]).map((b) => b.c)).toEqual([0, 25]);
    const main = s([{ t: d('2026-10-01'), o: 1, h: 1, l: 1, c: 1, v: null }, { t: d('2026-10-02'), o: 1, h: 1, l: 1, c: 1, v: null }, { t: d('2026-10-05'), o: 1, h: 1, l: 1, c: 1, v: null }]);
    const other = s([{ t: Date.parse('2026-10-01T14:00:00Z'), o: 50, h: 50, l: 50, c: 50, v: null }, { t: Date.parse('2026-10-05T14:00:00Z'), o: 55, h: 55, l: 55, c: 55, v: null }], { timezone: 'America/New_York' });
    const aligned = alignRebased(main, other);
    expect([...aligned.entries()]).toEqual([[d('2026-10-01'), 0], [d('2026-10-05'), 10.000000000000009]]);
    expect(aligned.has(d('2026-10-02'))).toBe(false); // no bar that day in the other series: a gap, not an invented value
  });
  it('formats bar times in the venue time zone', () => {
    const t = Date.parse('2026-10-06T03:45:00Z'); // 09:15 IST
    expect(formatBarTime(t, '5m', 'Asia/Kolkata', 'xAxis')).toBe('09:15');
    expect(formatBarTime(t, '1D', 'Asia/Kolkata', 'tooltip')).toBe('Tue, 06 Oct 2026');
    expect(formatBarTime(t, '1D', 'America/New_York', 'tooltip')).toBe('Mon, 05 Oct 2026');
  });
  it('offers only implemented indicators; volume ones need volume', () => {
    expect(INDICATORS.map((i) => i.id)).toEqual(['MA', 'EMA', 'BOLL', 'VOL', 'OBV', 'RSI', 'MACD']);
    expect(INDICATORS.filter((i) => i.needsVolume).map((i) => i.id)).toEqual(['VOL', 'OBV']);
    expect(INDICATORS.find((i) => i.id === 'MACD')!.name).toBe('INRGIFT_MACD');
  });
});

describe('MACD (standard histogram)', () => {
  it('MACD line = EMA12 − EMA26, signal = EMA9 of MACD, histogram = MACD − signal (no ×2)', () => {
    const closes = Array.from({ length: 80 }, (_, i) => 100 + Math.sin(i / 5) * 8 + i * 0.3);
    const r = macd(closes, 12, 26, 9);
    expect(r.macd.findIndex((v) => v != null)).toBe(25);
    expect(r.signal.findIndex((v) => v != null)).toBe(33);
    for (let i = 33; i < 80; i++) expect(r.histogram[i]).toBeCloseTo(r.macd[i]! - r.signal[i]!, 10);
    // EMA seeded with the simple average (reference computed independently)
    const ema = (v: number[], n: number) => { const k = 2 / (n + 1); let e = v.slice(0, n).reduce((a, b) => a + b, 0) / n; const out: number[] = Array(n - 1).fill(NaN); out.push(e); for (let i = n; i < v.length; i++) { e = v[i] * k + e * (1 - k); out.push(e); } return out; };
    const e12 = ema(closes, 12), e26 = ema(closes, 26);
    expect(r.macd[60]).toBeCloseTo(e12[60] - e26[60], 10);
  });
});

describe('demo labelling at provider selection', () => {
  it('assets, quotes and markets from the demo provider are DEMO; simulated failures keep their status', async () => {
    const { getProvider } = await import('@/providers');
    const p = getProvider();
    expect((await p.getAsset('AAPL'))!.status).toBe('DEMO');
    expect((await p.getAsset('AAPL'))!.meta.dataStatus).toBe('DEMO');
    expect((await p.getQuote((await p.getAsset('AAPL'))!.id))!.meta.dataStatus).toBe('DEMO');
    const markets = await p.getMarketSessions();
    expect(markets.filter((m) => m.dataStatus === 'LIVE' || m.dataStatus === 'DELAYED' || m.dataStatus === 'END_OF_DAY')).toEqual([]);
    expect(markets.find((m) => m.id === 'us')!.session).toBe('OPEN');
    expect((await p.getAsset('2222'))!.status).toBe('UNAVAILABLE');
    expect((await p.getAsset('PETR4'))!.status).toBe('STALE');
    expect((await p.getAsset('NATGAS'))!.status).toBe('ERROR');
    expect(GLOBAL_VENUE.tradingDays).toEqual([1, 2, 3, 4, 5]);
  });
});
