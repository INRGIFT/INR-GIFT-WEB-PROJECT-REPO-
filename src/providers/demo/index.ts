import { dataStatusFor, istHours, lastClose, localTime, sessionState, statusTimestamp } from '@/lib/calendar';
import { hash, rng, walk } from '@/lib/rng';
import type { Allocations, Asset, AssetClass, CalendarEvent, Candle, ChartRange, DataMeta, DataStatus, Dividend, Exchange, Fundamentals, Holding, Market, MarketView, MetricKey, NewsItem, ResearchDoc, Technicals, Theme, InstrumentIdentity, Issuer, Listing, Security } from '@/lib/types';
import type { AssetQuery, MarketDataProvider, NewsQuery, Quote } from '../provider';
import { ProviderError } from '../provider';
import { BONDS, COMMODITIES, ETFS, ETF_COUNTRIES, ETF_SECTORS, DR_RATIOS, FX_PAIRS, INDICES, INR_PER, IPOS, MACRO, MARKETS, NEWS, NO_FUNDAMENTALS, NO_HOLDINGS, REFERENCE_LISTINGS, REITS, SHARE_CLASS, STOCKS, THEMES } from './seed';

const SOURCE = 'demo-provider';
const M = new Map(MARKETS.map((m) => [m.id, m]));
const r2 = (v: number) => Math.round(v * 100) / 100;
/** Always-open venue used for FX and commodities, which trade around the clock on weekdays. */
const GLOBAL_EX: Exchange = { mic: 'XGLB', name: 'Global OTC', timezone: 'UTC', open: '00:00', close: '23:59', tradingDays: [1, 2, 3, 4, 5], holidays: {} };

type Base = Omit<Asset, 'status' | 'meta'> & { forced?: DataStatus };

function perf(seed: string, beta: number, d1?: number): Partial<Record<MetricKey, number>> {
  const r = rng(seed);
  const s = (lo: number, hi: number) => r2(lo + (hi - lo) * r());
  const k = Math.min(Math.max(beta, 0.25), 1.8);
  return { d1: d1 ?? r2(s(-2.4, 2.7) * k), w1: r2(s(-4, 5) * k), m1: r2(s(-7, 9) * k), m3: r2(s(-9, 15) * k), m6: r2(s(-12, 24) * k), ytd: r2(s(-14, 36) * k), y1: r2(s(-18, 48) * k), y3: r2(s(-8, 120) * k), y5: r2(s(4, 220) * k), volatility: r2(9 + k * 14 + r() * 7), maxDrawdown: -r2(6 + k * 14 + r() * 12), rsi: Math.round(28 + r() * 46), sma50Gap: s(-8, 9) };
}

function buildBase(): Base[] {
  let seq = 0;
  const id = () => `ins_${String(++seq).padStart(6, '0')}`;
  const out: Base[] = [];
  const place = (mk: string, mic?: string) => { const m = M.get(mk)!; const e = m.exchanges.find((x) => x.mic === mic) ?? m.exchanges[0]; return { marketId: m.id, country: m.name, region: m.region, mic: e.mic, exchange: e.name, currency: m.currency }; };

  for (const [symbol, name, mk, mic, sector, industry, price, cap, pe, fpe, revG, roic, dy, beta, issuer] of STOCKS) {
    const r = rng(symbol + 'f');
    const s = (lo: number, hi: number) => r2(lo + (hi - lo) * r());
    const p = place(mk, mic);
    const has = !NO_FUNDAMENTALS.has(symbol);
    const f = <T,>(v: T) => (has ? v : null);
    out.push({
      id: id(), slug: symbol, symbol, name, cls: 'stock', ...p, sector, industry, issuerId: `iss_${(issuer ?? name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      description: `${name} is a ${industry.toLowerCase()} company in the ${sector.toLowerCase()} sector, listed on ${p.exchange}.`,
      price, prevClose: null,
      m: { ...perf(symbol, beta), marketCap: cap * 1e9, volume: Math.round((cap * 1e9 * (0.002 + r() * 0.005)) / ((price * INR_PER[p.currency]) / INR_PER.USD)), pe: f(pe), fpe: f(fpe), pb: f(s(1.2, 14)), evEbitda: f(s(6, 32)), revenueGrowth: f(revG), epsGrowth: f(r2(revG * s(0.7, 1.6))), grossMargin: f(s(28, 74)), netMargin: f(s(7, 34)), roe: f(r2(roic * s(1.1, 1.7))), roic: f(roic), debtEquity: f(s(0.05, 1.8)), dividendYield: dy, beta },
    });
  }
  for (const [symbol, name, strategy, benchmark, price, aum, er, yld, holdings, issuer, inception] of ETFS) {
    const beta = symbol === 'GLD' ? 0.2 : symbol === 'SOXX' ? 1.5 : 1;
    const r = rng(symbol + 'f');
    out.push({
      id: id(), slug: symbol, symbol, name, cls: 'etf', ...place('us', 'ARCX'), sector: 'ETFs', industry: strategy, description: `${name} seeks to track the ${benchmark} index before fees and expenses.`,
      price, prevClose: null, m: { ...perf(symbol, beta), aum: aum * 1e9, volume: Math.round((aum * 1e9 * (0.004 + r() * 0.01)) / price), expenseRatio: er, dividendYield: yld, holdingsCount: holdings, beta },
      etf: { strategy, benchmark, issuer, inception, assetMix: symbol === 'GLD' ? [['Commodities', 100]] : [['Equities', 99.6], ['Cash', 0.4]] },
    });
  }
  for (const [symbol, name, mk, mic, price, cap, yld, ffo, occ, propertyType, geography] of REITS) {
    const r = rng(symbol + 'f');
    const p = place(mk, mic);
    out.push({
      id: id(), slug: symbol, symbol, name, cls: 'reit', ...p, sector: 'Real Estate', industry: 'REITs', description: `${name} is a real estate investment trust focused on ${propertyType.toLowerCase()} property.`,
      price, prevClose: null, m: { ...perf(symbol, 0.8), marketCap: cap * 1e9, volume: Math.round((cap * 1e9 * 0.003) / ((price * INR_PER[p.currency]) / INR_PER.USD)), dividendYield: yld, ffoYield: ffo, occupancy: occ, pb: r2(0.7 + r() * 0.9), debtEquity: r2(0.5 + r() * 0.6), beta: 0.8 },
      reit: { propertyType, geography },
    });
  }
  for (const [slug, name, mk, level, d1, constituents] of INDICES) {
    const { d1: _d, ...rest } = perf(slug, 0.9);
    out.push({ id: id(), slug, symbol: slug.replace(/-/g, ' '), name, cls: 'index', ...place(mk), description: `${name} is a headline equity benchmark for ${M.get(mk)!.name}.`, price: level, prevClose: null, m: { d1, ...rest }, index: { constituents } });
  }
  for (const [base, quote, rate] of FX_PAIRS) {
    const slug = `${base}-${quote}`;
    out.push({ id: id(), slug, symbol: `${base}/${quote}`, name: `${base} / ${quote}`, cls: 'fx', marketId: '', country: 'Global', region: 'Global', mic: GLOBAL_EX.mic, exchange: 'Spot reference rate', currency: quote, description: `Spot reference rate: units of ${quote} per one ${base}.`, price: rate, prevClose: null, m: perf(slug, 0.3), fx: { base, quote } });
  }
  for (const [slug, name, price, unit, reference, forced] of COMMODITIES) {
    out.push({ id: id(), slug, symbol: slug, name, cls: 'commodity', marketId: '', country: 'Global', region: 'Global', mic: GLOBAL_EX.mic, exchange: reference, currency: 'USD', description: `${name} benchmark price, quoted in ${unit}.`, price, prevClose: null, m: perf(slug, 0.9), commodity: { unit, reference }, forced });
  }
  for (const [slug, name, mk, price, yld, coupon, duration, maturity, rating, issuer] of BONDS) {
    out.push({ id: id(), slug, symbol: slug, name, cls: 'bond', ...place(mk), exchange: 'Government bond market', description: `${name}, issued by ${issuer}. Matures ${maturity}.`, price, prevClose: null, m: { d1: perf(slug, 0.25).d1, w1: perf(slug, 0.25).w1, m1: perf(slug, 0.25).m1, y1: perf(slug, 0.25).y1, yield: yld, coupon, duration }, bond: { issuer, maturity, rating } });
  }
  const bySlug = new Map(out.map((a) => [a.slug, a]));
  // Cross-listings: instruments that share an issuer are linked both ways.
  for (const a of out) {
    if (!a.issuerId) continue;
    const others = out.filter((b) => b.issuerId === a.issuerId && b.id !== a.id);
    if (others.length) a.crossListings = others.map((b) => ({ slug: b.slug, symbol: b.symbol, exchange: b.exchange, cls: b.cls }));
  }
  for (const a of out) if (a.price != null && a.m.d1 != null) a.prevClose = a.price / (1 + a.m.d1 / 100);
  void bySlug;
  return out;
}
const BASE = buildBase();
const BY_ID = new Map(BASE.map((a) => [a.id, a]));
const find = (idOrSlug: string, cls?: AssetClass) => BY_ID.get(idOrSlug) ?? BASE.find((a) => a.slug.toLowerCase() === idOrSlug.toLowerCase() && (!cls || a.cls === cls || (cls === 'etf' && a.cls === 'fund')));

const RANGE: Record<ChartRange, [points: number, key: MetricKey, stepMin: number]> = { '1D': [78, 'd1', 5], '5D': [65, 'w1', 30], '1M': [22, 'm1', 1440 * 1.4], '3M': [64, 'm3', 1440 * 1.4], '6M': [126, 'm6', 1440 * 1.45], YTD: [190, 'ytd', 1440 * 1.45], '1Y': [252, 'y1', 1440 * 1.45], '3Y': [156, 'y3', 1440 * 7], '5Y': [260, 'y5', 1440 * 7], MAX: [300, 'y5', 1440 * 12] };

export class DemoProvider implements MarketDataProvider {
  readonly name = SOURCE;
  /** `clock` is injectable so tests can pin time. */
  constructor(private clock: () => Date = () => new Date()) {}

  private marketView(m: Market, now: Date): MarketView {
    const ex = m.exchanges[0];
    const s = sessionState(ex, now);
    const dataStatus = dataStatusFor(m, s.state);
    const h = istHours(ex, now);
    return { ...m, session: s.state, holidayName: s.holidayName, dataStatus, localTime: localTime(ex.timezone, now), istOpen: h.open, istClose: h.close, assetCount: BASE.filter((a) => a.marketId === m.id).length, meta: this.meta(dataStatus, ex, now) };
  }
  private meta(status: DataStatus, ex: Exchange, now: Date): DataMeta {
    return { timestamp: statusTimestamp(status, ex, now).toISOString(), timezone: ex.timezone, ingestedAt: now.toISOString(), source: SOURCE, dataStatus: status };
  }
  private hydrate(b: Base, now: Date): Asset {
    const m = M.get(b.marketId);
    const ex = m?.exchanges.find((e) => e.mic === b.mic) ?? m?.exchanges[0] ?? GLOBAL_EX;
    const state = sessionState(ex, now).state;
    const status: DataStatus = b.forced ?? (m ? dataStatusFor(m, state) : state === 'OPEN' ? 'LIVE' : 'END_OF_DAY');
    const { forced: _f, ...rest } = b;
    const errored = status === 'ERROR';
    return { ...rest, price: errored ? null : b.price, m: errored ? { ...b.m, d1: null } : b.m, status, meta: this.meta(status, ex, now) };
  }
  async listAssets(q: AssetQuery = {}): Promise<Asset[]> {
    const now = this.clock();
    return BASE.filter((a) => (!q.cls || q.cls.includes(a.cls)) && (!q.marketId || a.marketId === q.marketId) && (!q.region || a.region === q.region) && (!q.sector || a.sector === q.sector) && (!q.ids || q.ids.includes(a.id))).map((a) => this.hydrate(a, now));
  }
  async searchAssets(query: string, limit = 8): Promise<Asset[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const rank = (a: Base) => { const t = a.symbol.toLowerCase(), n = a.name.toLowerCase(); return t === q || a.slug.toLowerCase() === q ? 0 : n === q ? 1 : t.startsWith(q) ? 2 : n.startsWith(q) ? 3 : `${n} ${t} ${a.exchange} ${a.country}`.toLowerCase().includes(q) ? 4 : `${a.sector ?? ''} ${a.industry ?? ''}`.toLowerCase().includes(q) ? 5 : 9; };
    const now = this.clock();
    return BASE.map((a) => [rank(a), a] as const).filter(([k]) => k < 9).sort((x, y) => x[0] - y[0] || (y[1].m.marketCap ?? y[1].m.aum ?? 0) - (x[1].m.marketCap ?? x[1].m.aum ?? 0)).slice(0, limit).map(([, a]) => this.hydrate(a, now));
  }
  async getAsset(idOrSlug: string, cls?: AssetClass) { const b = find(idOrSlug, cls); return b ? this.hydrate(b, this.clock()) : null; }
  async getQuote(id: string): Promise<Quote | null> {
    const a = await this.getAsset(id);
    if (!a) return null;
    if (a.status === 'ERROR') throw new ProviderError('PROVIDER_ERROR', `Quote request failed for ${a.symbol}.`);
    const change = a.price != null && a.prevClose != null ? a.price - a.prevClose : null;
    return { instrumentId: a.id, price: a.price, prevClose: a.prevClose, change, changePct: a.m.d1 ?? null, currency: a.currency, meta: a.meta };
  }
  async getOHLCV(id: string, range: ChartRange): Promise<Candle[] | null> {
    const b = find(id);
    if (!b || b.price == null) return null;
    if (b.forced === 'ERROR') throw new ProviderError('PROVIDER_ERROR', `Price history request failed for ${b.symbol}.`);
    const [n, key, stepMin] = RANGE[range];
    const chg = (b.m[key] ?? b.m.y1 ?? 5) * (range === 'MAX' ? 1.6 : 1);
    const sd = Math.abs(chg) / 100 / Math.sqrt(n) * 1.2 + 0.004;
    const closes = walk(b.id + range, n, chg, sd).map((x) => x * b.price!);
    const r = rng(b.id + range + 'o');
    const end = (await this.getAsset(id))!.meta.timestamp;
    const endMs = Date.parse(end);
    const baseVol = (b.m.volume ?? 1e6) / (range === '1D' ? 78 : 1);
    return closes.map((c, i) => {
      const o = i ? closes[i - 1] : c * (1 + (r() - 0.5) * sd);
      return { t: new Date(endMs - (n - 1 - i) * stepMin * 60000).toISOString(), o, h: Math.max(o, c) * (1 + r() * sd * 0.7), l: Math.min(o, c) * (1 - r() * sd * 0.7), c, v: Math.round(baseVol * (0.5 + r())) };
    });
  }
  async getFundamentals(id: string): Promise<Fundamentals | null> {
    const b = find(id);
    if (!b || b.cls !== 'stock' || NO_FUNDAMENTALS.has(b.slug) || b.m.marketCap == null) return null;
    const r = rng(b.id + 'fin');
    const capUsd = b.m.marketCap / 1e9, growth = (b.m.revenueGrowth ?? 5) / 100, margin = (b.m.netMargin ?? 15) / 100;
    const rev0 = capUsd / (2 + r() * 6);
    const shares = b.m.marketCap / ((b.price! * INR_PER[b.currency]) / INR_PER.USD);
    const yearNow = this.clock().getUTCFullYear();
    const years = [4, 3, 2, 1, 0].map((back) => { const revenue = (rev0 / Math.pow(1 + growth * (0.6 + r() * 0.5), back)) * 1e9; const netIncome = revenue * margin * (1 - back * 0.03 * r()); const operatingCashFlow = netIncome * (1.05 + r() * 0.35); return { year: yearNow - back, revenue, netIncome, eps: netIncome / shares, operatingCashFlow, capex: revenue * (0.03 + r() * 0.09) }; });
    return { currency: 'USD', years, nextEarnings: new Date(this.clock().getTime() + (5 + (hash(b.id) % 40)) * 86400000).toISOString().slice(0, 10) };
  }
  async getValuation(id: string) { const b = find(id); if (!b) return null; const { pe, fpe, pb, evEbitda, dividendYield } = b.m; return { pe, fpe, pb, evEbitda, dividendYield }; }
  async getTechnicals(id: string): Promise<Technicals | null> {
    const year = await this.getOHLCV(id, '1Y').catch(() => null);
    if (!year) return null;
    const c = year.map((x) => x.c), avg = (n: number) => c.slice(-n).reduce((a, b) => a + b, 0) / n;
    const last = c[c.length - 1], sma50 = avg(50), sma200 = avg(200);
    return { rsi: find(id)?.m.rsi ?? null, sma50, sma200, high52: Math.max(...year.map((x) => x.h)), low52: Math.min(...year.map((x) => x.l)), trend: last > sma50 && last > sma200 ? 'Above both averages' : last < sma50 && last < sma200 ? 'Below both averages' : 'Between averages' };
  }
  async getDividends(id: string): Promise<Dividend[] | null> {
    const b = find(id);
    if (!b || b.price == null || b.m.dividendYield === undefined) return null;
    const dy = b.m.dividendYield ?? 0;
    if (dy <= 0) return [];
    const perYear = b.marketId === 'us' ? 4 : 2, now = this.clock().getTime();
    return Array.from({ length: perYear * 2 }, (_, i) => { const exD = new Date(now - (20 + i * (365 / perYear)) * 86400000); return { exDate: exD.toISOString().slice(0, 10), payDate: new Date(exD.getTime() + 14 * 86400000).toISOString().slice(0, 10), amount: (b.price! * dy) / 100 / perYear * (1 - i * 0.015), currency: b.currency }; });
  }
  async getCorporateActions(id: string) {
    const b = find(id);
    if (!b || b.cls !== 'stock') return null;
    const y = this.clock().getUTCFullYear();
    return hash(b.id) % 3 === 0 ? [{ date: `${y - 2}-06-10`, type: 'Split' as const, detail: `${2 + (hash(b.id) % 9)}-for-1 share split` }, { date: `${y - 1}-02-04`, type: 'Buyback' as const, detail: 'Board authorised a new share repurchase programme' }] : [];
  }
  async getETFProfile(id: string) { return find(id)?.etf ?? null; }
  async getETFHoldings(id: string): Promise<Holding[] | null> {
    const b = find(id);
    if (!b?.etf || NO_HOLDINGS.has(b.slug)) return null;
    if (b.slug === 'GLD') return [{ name: 'Physical gold bullion', weight: 100 }];
    const row = ETFS.find((e) => e[0] === b.slug)![11];
    return Object.entries(row).map(([slug, weight]) => { const h = find(slug, 'stock'); return { name: h?.name ?? slug, symbol: h?.symbol, slug: h?.slug, weight }; });
  }
  async getETFAllocations(id: string): Promise<Allocations | null> { const b = find(id); return b && ETF_SECTORS[b.slug] ? { sectors: ETF_SECTORS[b.slug], countries: ETF_COUNTRIES[b.slug] } : null; }
  getIndexData() { return this.listAssets({ cls: ['index'] }); }
  getFX() { return this.listAssets({ cls: ['fx'] }); }
  getCommodities() { return this.listAssets({ cls: ['commodity'] }); }
  getBonds() { return this.listAssets({ cls: ['bond'] }); }
  getREITs() { return this.listAssets({ cls: ['reit'] }); }
  async getNews(q: NewsQuery = {}): Promise<NewsItem[]> {
    const now = this.clock().getTime();
    const sectors = new Set(BASE.map((a) => a.sector).filter(Boolean));
    const company = NEWS.map(([slug, category, text], i): NewsItem => { const a = find(slug)!; const kind = a.cls === 'etf' ? 'etf' : sectors.has(category) ? 'sector' : 'company'; return { id: `news_${i + 1}`, kind, headline: `${a.name}: ${text}`, summary: `${text}. Price ${(a.m.d1 ?? 0) >= 0 ? 'up' : 'down'} ${Math.abs(a.m.d1 ?? 0).toFixed(1)}% on the day in the demo dataset; see the ${a.symbol} page for the data behind the story.`, publisher: 'INRGIFT Demo Wire', publishedAt: new Date(now - (i * 97 + 23) * 60000).toISOString(), category, assetSlug: a.slug, assetCls: a.cls, assetSymbol: a.symbol, marketId: a.marketId, url: `/${a.cls === 'etf' ? 'etfs' : 'stocks'}/${a.slug}` }; });
    // Market wraps are computed from the demo index moves, so the headline always matches the data on screen.
    const wraps = MARKETS.map((m) => ({ m, idx: BASE.find((a) => a.cls === 'index' && a.marketId === m.id) })).filter((x) => x.idx).slice(0, 8).map(({ m, idx }, i): NewsItem => {
      const list = BASE.filter((a) => a.marketId === m.id && a.cls === 'stock'); const up = list.filter((a) => (a.m.d1 ?? 0) > 0).length; const d = idx!.m.d1 ?? 0;
      return { id: `news_m${i}`, kind: 'market', headline: `${m.name}: ${idx!.name} ${d >= 0 ? 'higher' : 'lower'} by ${Math.abs(d).toFixed(2)}%`, summary: `${up} of ${list.length} covered ${m.name} stocks rose on the session. Local-currency figures from the demo dataset.`, publisher: 'INRGIFT Demo Wire', publishedAt: new Date(now - (i * 61 + 11) * 60000).toISOString(), category: 'Markets', marketId: m.id, url: `/markets/${m.slug}` };
    });
    const macro = MACRO.map(([days, title, detail, marketId], i): NewsItem => ({ id: `news_x${i}`, kind: 'macro', headline: `On the calendar: ${title}`, summary: `${detail}, scheduled in ${days} day${days === 1 ? '' : 's'}. Dates come from the INRGIFT calendar.`, publisher: 'INRGIFT Demo Wire', publishedAt: new Date(now - (i * 173 + 47) * 60000).toISOString(), category: 'Macro', marketId, url: '/resources/calendar' }));
    const all = [...company, ...wraps, ...macro].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const assetSlug = q.assetId ? find(q.assetId)?.slug : undefined;
    return all.filter((n) => (!q.assetId || n.assetSlug === assetSlug) && (!q.marketId || n.marketId === q.marketId) && (!q.category || n.category === q.category) && (!q.kind || n.kind === q.kind)).slice(0, q.limit ?? 50);
  }
  async getMarket(idOrSlug: string) { const m = MARKETS.find((x) => x.id === idOrSlug.toLowerCase() || x.slug.toLowerCase() === idOrSlug.toLowerCase()); return m ? this.marketView(m, this.clock()) : null; }
  async getMarketSessions() { const now = this.clock(); return MARKETS.map((m) => this.marketView(m, now)); }
  async getThemes(): Promise<Theme[]> { return THEMES.map(([id, name, description, slugs]) => ({ id, name, description, assetIds: slugs.map((s) => find(s)?.id).filter((x): x is string => Boolean(x)) })); }

  async getResearch(): Promise<ResearchDoc[]> {
    const now = this.clock().getTime();
    const day = (n: number) => new Date(now - n * 86400000).toISOString();
    const med = (k: MetricKey) => { const v = BASE.filter((a) => a.cls === 'stock' && a.m[k] != null).map((a) => a.m[k] as number).sort((x, y) => x - y); return v[v.length >> 1]; };
    const dir = (v: number) => (v >= 0 ? 'up' : 'down');
    const docs: ResearchDoc[] = [];
    for (const [i, slug] of ['NVDA', 'AAPL', 'RELIANCE', 'ASML', '7203', 'HDFCBANK', 'SAP', '2330'].entries()) {
      const a = find(slug)!;
      const m = a.m as Record<MetricKey, number>;
      docs.push({ id: `res_s${i}`, slug: slug.toLowerCase(), kind: 'stocks', type: 'Structured research', title: `${a.name}: what changed, and what to monitor next`, summary: `Price, valuation and profitability for ${a.name} in context.`, topic: a.sector!, publishedAt: day(i + 1), assetSlug: a.slug, assetCls: 'stock', assetSymbol: a.symbol, marketId: a.marketId,
        sections: [
          { heading: 'What changed', body: `The share price is ${dir(m.m1)} ${Math.abs(m.m1).toFixed(1)}% over one month and ${dir(m.y1)} ${Math.abs(m.y1).toFixed(1)}% over one year. Revenue growth is running at ${m.revenueGrowth}%.` },
          { heading: 'Why it matters', body: `At ${m.pe} times trailing earnings against a covered-universe median of ${med('pe')}, the market is pricing ${m.pe > med('pe') ? 'above' : 'below'}-median expectations. A forward multiple of ${m.fpe} implies earnings ${m.fpe < m.pe ? 'growth' : 'pressure'} over the coming year.` },
          { heading: 'Profitability and risk', body: `Return on invested capital is ${m.roic}% and net margin is ${m.netMargin}%. Beta of ${m.beta} and 30-day volatility of ${m.volatility}% describe how far the price has tended to move relative to its home index.` },
          { heading: 'What to monitor', body: `The next earnings date, the direction of margins, and for rupee-based readers the ${a.currency === 'INR' ? 'domestic rate path' : a.currency + '/INR exchange rate'}, which changes the return an Indian investor experiences.` },
        ] });
    }
    for (const [i, slug] of ['SPY', 'QQQ', 'VWO', 'GLD'].entries()) {
      const a = find(slug)!;
      docs.push({ id: `res_e${i}`, slug: slug.toLowerCase(), kind: 'etfs', type: 'Structured research', title: `${a.symbol}: an eight-step review of cost, liquidity and holdings`, summary: `${a.name} examined against the INRGIFT ETF framework.`, topic: a.etf!.strategy, publishedAt: day(i + 2), assetSlug: a.slug, assetCls: 'etf', assetSymbol: a.symbol, marketId: a.marketId,
        sections: [
          { heading: 'Objective and cost', body: `The fund tracks the ${a.etf!.benchmark} index. Its expense ratio is ${a.m.expenseRatio}%, which is about ₹${Math.round((a.m.expenseRatio ?? 0) * 1000)} a year for every ₹10,00,000 held, before transaction and currency costs.` },
          { heading: 'Size and liquidity', body: `Assets of $${((a.m.aum ?? 0) / 1e9).toFixed(0)} billion and average volume of ${((a.m.volume ?? 0) / 1e6).toFixed(1)} million shares a day. Larger funds are less likely to close and usually trade with tighter spreads.` },
          { heading: 'Holdings and allocation', body: `${a.m.holdingsCount} holdings. ${ETF_SECTORS[slug] ? `The largest sector weight is ${ETF_SECTORS[slug][0][0]} at ${ETF_SECTORS[slug][0][1]}%.` : ''} Concentration above 30% in one sector deserves a closer look.` },
          { heading: 'Performance and risk', body: `One-year return of ${a.m.y1}% with 30-day volatility of ${a.m.volatility}% and a three-year maximum drawdown of ${a.m.maxDrawdown}%.` },
        ] });
    }
    for (const [i, id] of ['us', 'in', 'jp', 'de'].entries()) {
      const m = M.get(id)!;
      const list = BASE.filter((a) => a.marketId === id && a.cls === 'stock');
      const lead = [...list].sort((x, y) => (y.m.m1 ?? 0) - (x.m.m1 ?? 0))[0];
      const idx = BASE.find((a) => a.marketId === id && a.cls === 'index')!;
      docs.push({ id: `res_m${i}`, slug: m.slug.toLowerCase(), kind: 'markets', type: 'Market commentary', title: `${m.name}: trend, leadership and the currency angle`, summary: `Where ${m.name} stands this month, read from the data.`, topic: 'Market', publishedAt: day(i + 1), marketId: id,
        sections: [
          { heading: 'Current trend', body: `${idx.name} is ${dir(idx.m.m1 ?? 0)} ${Math.abs(idx.m.m1 ?? 0).toFixed(1)}% over one month and ${dir(idx.m.ytd ?? 0)} ${Math.abs(idx.m.ytd ?? 0).toFixed(1)}% for the year to date.` },
          { heading: 'Leadership', body: `${lead.name} leads covered names over one month at ${lead.m.m1}%. ${list.filter((a) => (a.m.m1 ?? 0) > 0).length} of ${list.length} covered companies are higher over the period.` },
          { heading: 'Currency', body: m.currency === 'INR' ? 'Returns are already in rupees, so there is no currency translation for an Indian reader.' : `Assets are priced in ${m.currency}. One ${m.currency} is about ₹${INR_PER[m.currency]} at the demo reference rate, so rupee returns also depend on how ${m.currency}/INR moves.` },
          { heading: 'Key risks and events', body: 'Central bank decisions, the earnings calendar and index concentration. See the market calendar for dates.' },
        ] });
    }
    for (const [i, [id, name, description, slugs]] of THEMES.slice(0, 4).entries()) {
      const list = slugs.map((s) => find(s)!).filter(Boolean);
      const avg = (k: MetricKey) => list.reduce((s, a) => s + (a.m[k] ?? 0), 0) / list.length;
      docs.push({ id: `res_t${i}`, slug: id, kind: 'themes', type: 'Data insight', title: `${name}: who is in it and how it has moved`, summary: description + '.', topic: 'Theme', publishedAt: day(i + 3), themeId: id,
        sections: [
          { heading: 'Definition', body: `${description}. This collection holds ${list.length} assets across ${new Set(list.map((a) => a.country)).size} markets.` },
          { heading: 'Performance', body: `Equal-weighted, the group is ${dir(avg('m1'))} ${Math.abs(avg('m1')).toFixed(1)}% over one month and ${dir(avg('y1'))} ${Math.abs(avg('y1')).toFixed(1)}% over one year.` },
          { heading: 'Constituents', body: list.map((a) => `${a.name} (${a.symbol})`).join(', ') + '.' },
        ] });
    }
    // Sector research: every covered stock in the sector, across markets. All figures are computed from the dataset.
    const median = (xs: number[]) => { const v = [...xs].sort((x, y) => x - y); return v.length ? v[v.length >> 1] : null; };
    const fx = (v: number | null, dp = 1) => (v == null ? 'n/a' : v.toFixed(dp));
    for (const [i, sector] of ['Technology', 'Financials', 'Energy', 'Healthcare'].entries()) {
      const list = BASE.filter((a) => a.cls === 'stock' && a.sector === sector);
      const byRegion = new Map<string, typeof list>();
      list.forEach((a) => byRegion.set(a.region, [...(byRegion.get(a.region) ?? []), a]));
      const pe = median(list.map((a) => a.m.pe).filter((v): v is number => v != null));
      const y1 = median(list.map((a) => a.m.y1).filter((v): v is number => v != null));
      const allPe = median(BASE.filter((a) => a.cls === 'stock' && a.m.pe != null).map((a) => a.m.pe as number));
      const ranked = [...list].sort((x, y) => (y.m.y1 ?? -1e9) - (x.m.y1 ?? -1e9));
      const slug = sector.toLowerCase().replace(/[^a-z]+/g, '-');
      docs.push({ id: `res_sec${i}`, slug, kind: 'sectors', type: 'Data insight', title: `${sector} across markets: valuation, returns and where it is listed`, summary: `${list.length} covered ${sector.toLowerCase()} companies in ${byRegion.size} regions, compared on one basis.`, topic: sector, sector, publishedAt: day(i + 2),
        keyTakeaways: [
          `${list.length} covered companies across ${byRegion.size} regions; ${ranked.filter((a) => (a.m.y1 ?? 0) > 0).length} are higher over one year.`,
          `Median trailing P/E is ${fx(pe)}× against ${fx(allPe)}× for all covered stocks.`,
          `Median one-year return is ${fx(y1)}% in local currency.`,
        ],
        whyItMatters: 'Sector exposure often explains more of a stock’s move than the company itself. Seeing the same sector priced in several markets shows where valuations differ for similar businesses.',
        sections: [
          { heading: 'Where the sector is listed', body: [...byRegion].map(([r, xs]) => `${r}: ${xs.length} (${xs.map((a) => a.symbol).join(', ')})`).join('. ') + '.' },
          { heading: 'Valuation', body: `The median trailing P/E of ${fx(pe)}× is ${pe != null && allPe != null && pe > allPe ? 'above' : 'below'} the all-stock median of ${fx(allPe)}×. Multiples are not adjusted for accounting differences between countries.` },
          { heading: 'Returns', body: `Over one year the strongest covered name is ${ranked[0]?.name} at ${fx(ranked[0]?.m.y1 ?? null)}% and the weakest is ${ranked[ranked.length - 1]?.name} at ${fx(ranked[ranked.length - 1]?.m.y1 ?? null)}%, each in its own currency.` },
        ],
        charts: [
          { title: 'One-year return by company (local currency)', unit: '%', kind: 'diverging', bars: ranked.slice(0, 10).map((a) => ({ label: a.symbol, value: a.m.y1 ?? 0, href: `/stocks/${a.slug}` })), note: 'Ten largest moves shown; returns are not converted to INR.' },
          { title: 'Covered companies by region', unit: '%', kind: 'bar', bars: [...byRegion].map(([r, xs]) => ({ label: r, value: Math.round((xs.length / list.length) * 100) })) },
        ],
        interpretation: 'Differences in multiples across regions can reflect growth expectations, interest rates, currency and listing composition as much as company quality. Treat the comparison as a starting point for asset-level research.',
        limitations: ['Coverage is a sample of large listed companies, not the full sector.', 'Medians ignore company size; one large company can dominate a region.', 'Returns are in each listing’s own currency.'],
      });
    }
    // Country research: listings, sector mix, index and currency for one country.
    for (const [i, id] of ['in', 'us', 'jp', 'uk'].entries()) {
      const mk = M.get(id); if (!mk) continue;
      const list = BASE.filter((a) => a.marketId === id && a.cls === 'stock');
      const idx = BASE.find((a) => a.marketId === id && a.cls === 'index');
      const cap = list.reduce((s, a) => s + (a.m.marketCap ?? 0), 0);
      const bySector = new Map<string, number>();
      list.forEach((a) => bySector.set(a.sector ?? 'Other', (bySector.get(a.sector ?? 'Other') ?? 0) + (a.m.marketCap ?? 0)));
      const mix = [...bySector].sort((x, y) => y[1] - x[1]);
      docs.push({ id: `res_c${i}`, slug: mk.slug.toLowerCase(), kind: 'countries', type: 'Data insight', title: `${mk.name}: what the covered market is made of`, summary: `Sector mix, largest listings, index trend and currency for ${mk.name}.`, topic: mk.name, country: mk.name, marketId: id, publishedAt: day(i + 3),
        keyTakeaways: [
          `${list.length} covered companies with a combined market value of $${(cap / 1e12).toFixed(2)} trillion.`,
          mix[0] ? `${mix[0][0]} is the largest sector at ${Math.round((mix[0][1] / (cap || 1)) * 100)}% of covered market value.` : 'No sector data is available.',
          idx ? `${idx.name} is ${(idx.m.ytd ?? 0) >= 0 ? 'up' : 'down'} ${Math.abs(idx.m.ytd ?? 0).toFixed(1)}% year to date.` : 'No index is covered for this market.',
        ],
        whyItMatters: 'A country index is a bet on its sector mix and currency as much as on its economy. Knowing the mix explains why two markets can move differently on the same day.',
        sections: [
          { heading: 'Largest covered listings', body: [...list].sort((x, y) => (y.m.marketCap ?? 0) - (x.m.marketCap ?? 0)).slice(0, 5).map((a) => `${a.name} (${a.symbol})`).join(', ') + '.' },
          { heading: 'Trading hours for an Indian reader', body: `${mk.exchanges[0].name} trades ${mk.exchanges[0].open}–${mk.exchanges[0].close} local time (${mk.exchanges[0].timezone}). See the market page for the session converted to IST and today’s status.` },
          { heading: 'Currency', body: mk.currency === 'INR' ? 'Prices are in rupees; there is no currency translation for an Indian reader.' : `Prices are in ${mk.currency}. Rupee returns also depend on ${mk.currency}/INR, at about ₹${INR_PER[mk.currency]} per ${mk.currency} at the demo reference rate.` },
        ],
        charts: [{ title: 'Covered market value by sector', unit: '%', kind: 'bar', bars: mix.map(([s, v]) => ({ label: s, value: Math.round((v / (cap || 1)) * 100) })) }],
        interpretation: 'A concentrated sector mix means the index behaves like that sector. Compare with the sector research to separate country effects from sector effects.',
        limitations: ['Covered companies are a sample, not the full exchange.', 'Market values use the demo reference exchange rates.'],
      });
    }
    return docs.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  async getIdentity(idOrSlug: string): Promise<InstrumentIdentity | null> {
    const a = find(idOrSlug);
    if (!a || !['stock', 'etf', 'reit', 'fund'].includes(a.cls)) return null;
    const exName = (mic: string) => MARKETS.flatMap((m) => m.exchanges).find((e) => e.mic === mic)?.name ?? mic;
    const listingOf = (b: typeof a, primary: boolean): Listing => ({ securityKey: b.id, instrumentId: b.id, mic: b.mic, exchange: b.exchange, ticker: b.symbol, currency: b.currency, primary, slug: b.slug, cls: b.cls, covered: true, providerSymbols: [{ source: SOURCE, symbol: `${b.symbol}:${b.mic}` }] });
    if (!a.issuerId) {
      // Funds and REITs: the fund (or trust) is the issuer of one class of units.
      const issuer: Issuer = { id: `iss_${a.slug.toLowerCase()}`, name: a.etf?.issuer ?? a.name, country: a.country };
      return { issuer, securities: [{ key: a.id, instrumentId: a.id, issuerId: issuer.id, name: a.name, shareClass: a.cls === 'reit' ? 'Units' : 'Fund units', kind: 'fund_unit', isin: null }], listings: [listingOf(a, true)], source: SOURCE };
    }
    const family = BASE.filter((b) => b.issuerId === a.issuerId);
    const ordinary = family.find((b) => !DR_RATIOS[b.symbol]) ?? a;
    const issuer: Issuer = { id: a.issuerId, name: ordinary.name.replace(/ \(ADR\)$/, ''), country: ordinary.country, sector: ordinary.sector, industry: ordinary.industry };
    const securities: Security[] = family.map((b) => DR_RATIOS[b.symbol]
      ? { key: b.id, instrumentId: b.id, issuerId: issuer.id, name: b.name, shareClass: 'ADR', kind: 'adr', underlyingKey: family.find((x) => x.symbol === DR_RATIOS[b.symbol][1])?.id, ratio: DR_RATIOS[b.symbol][0], isin: null }
      : { key: b.id, instrumentId: b.id, issuerId: issuer.id, name: b.name, shareClass: SHARE_CLASS[b.symbol] ?? 'Ordinary', kind: 'ordinary', isin: null });
    const listings: Listing[] = family.map((b) => listingOf(b, b === ordinary));
    for (const [key, name, shareClass, kind, mic, ticker, currency, ratio, under] of REFERENCE_LISTINGS) {
      if (`iss_${key}` !== a.issuerId) continue;
      const skey = `ref_${ticker}_${mic}`;
      securities.push({ key: skey, instrumentId: null, issuerId: issuer.id, name, shareClass, kind, ...(ratio ? { ratio } : {}), ...(under ? { underlyingKey: family.find((x) => x.symbol === under)?.id } : {}), isin: null });
      listings.push({ securityKey: skey, instrumentId: null, mic, exchange: exName(mic), ticker, currency, primary: false, covered: false, providerSymbols: [] });
    }
    return { issuer, securities, listings, source: SOURCE };
  }

  async getCalendar(): Promise<CalendarEvent[]> {
    const now = this.clock();
    const day = (n: number) => new Date(now.getTime() + n * 86400000).toISOString().slice(0, 10);
    const today = day(0), horizon = day(60);
    const ev: CalendarEvent[] = [];
    for (const a of BASE.filter((x) => x.cls === 'stock' && !NO_FUNDAMENTALS.has(x.slug))) {
      const r = rng(a.id + 'cal');
      const eps = (a.price! / (a.m.pe ?? 20)) / 4;
      ev.push({ id: `cal_e_${a.id}`, kind: 'earnings', date: day(1 + (hash(a.id) % 40)), title: `${a.name} quarterly results`, detail: r() > 0.5 ? 'After market close' : 'Before market open', marketId: a.marketId, assetSlug: a.slug, assetCls: a.cls, extra: { epsEstimate: eps.toFixed(2), previousEps: (eps * (0.85 + r() * 0.2)).toFixed(2), revenueEstimate: `$${(((a.m.marketCap ?? 0) / 1e9 / (3 + r() * 5)) / 4).toFixed(1)}B`, currency: a.currency } });
      if ((a.m.dividendYield ?? 0) > 0) { const d = 3 + (hash(a.id + 'd') % 50); ev.push({ id: `cal_d_${a.id}`, kind: 'dividend', date: day(d), title: `${a.name} ex-dividend`, detail: `Pay date ${day(d + 14)}`, marketId: a.marketId, assetSlug: a.slug, assetCls: a.cls, extra: { amount: ((a.price! * (a.m.dividendYield ?? 0)) / 100 / (a.marketId === 'us' ? 4 : 2)).toFixed(3), currency: a.currency, yield: `${a.m.dividendYield}%`, frequency: a.marketId === 'us' ? 'Quarterly' : 'Semi-annual', recordDate: day(d + 1), payDate: day(d + 14) } }); }
    }
    for (const [offset, name, mk, sector, stage] of IPOS) ev.push({ id: `cal_i_${hash(name)}`, kind: 'ipo', date: day(offset), title: name, detail: `${sector} · ${M.get(mk)!.exchanges[0].name}`, marketId: mk, extra: { stage, sector, exchange: M.get(mk)!.exchanges[0].name } });
    for (const [offset, title, detail, mk] of MACRO) ev.push({ id: `cal_m_${hash(title)}`, kind: 'macro', date: day(offset), title, detail, marketId: mk });
    for (const m of MARKETS) for (const [date, name] of Object.entries(m.exchanges[0].holidays)) if (date >= today && date <= horizon) ev.push({ id: `cal_h_${m.id}_${date}`, kind: 'holiday', date, title: `${m.name}: ${name}`, detail: `${m.exchanges[0].name} closed`, marketId: m.id });
    return ev.sort((a, b) => a.date.localeCompare(b.date));
  }
}
export { INR_PER } from './seed';
export const demoLastClose = lastClose;
