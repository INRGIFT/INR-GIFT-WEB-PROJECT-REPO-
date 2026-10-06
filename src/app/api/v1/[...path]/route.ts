import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { DIRECTORY_CLASS } from '@/lib/routes';
import type { AssetClass, CalendarKind, ChartRange, Envelope, ResearchKind } from '@/lib/types';
import { getProvider } from '@/providers';
import * as md from '@/services/market-data';

/**
 * INRGIFT public read API, version 1. One router keeps the contract in one readable table.
 * Every success is `{ data, meta, pagination? }`; every failure is `{ error: { code, message } }`.
 */
const Query = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(25),
  q: z.string().trim().max(80).default(''),
  class: z.string().max(40).optional(),
  market: z.string().max(40).optional(),
  region: z.string().max(40).optional(),
  sector: z.string().max(60).optional(),
  range: z.enum(['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', 'MAX']).default('1Y'),
  kind: z.string().max(20).optional(),
  universe: z.enum(['all', 'stock', 'etf', 'reit']).default('all'),
  ids: z.string().max(4000).optional(),
});
type Q = z.infer<typeof Query>;
const ID = /^[A-Za-z0-9._%-]{1,40}$/;
class NotFound extends Error {}
const classes = (v?: string): AssetClass[] | undefined => v ? (v.split(',').map((c) => DIRECTORY_CLASS[c] ?? (c as AssetClass)).filter(Boolean)) : undefined;
const list = async (q: Q, cls?: AssetClass[]): Promise<Envelope<unknown>> => {
  const market = q.market ? (await md.getMarket(q.market))?.id : undefined;
  let rows = await md.getAssets({ cls: cls ?? classes(q.class), marketId: market, region: q.region, sector: q.sector });
  if (q.ids) { const want = q.ids.split(','); rows = rows.filter((a) => want.includes(a.id) || want.includes(a.slug)); }
  const { rows: page, pagination } = md.paginate(rows, q.page, q.pageSize);
  return md.envelope(page, md.freshest(rows) ?? undefined, pagination);
};
const asset = async (id: string) => { if (!ID.test(id)) throw new NotFound(); const a = await md.getAsset(undefined, id); if (!a) throw new NotFound(); return a; };
const p = () => getProvider();

type Handler = (m: string[], q: Q) => Promise<Envelope<unknown>>;
const ROUTES: [RegExp, Handler][] = [
  [/^markets$/, async () => { const m = await md.getMarkets(); return md.envelope(m, md.freshest(m) ?? undefined); }],
  [/^markets\/([^/]+)$/, async ([slug]) => { const m = await md.getMarket(slug); if (!m) throw new NotFound(); return md.envelope(m, m.meta); }],
  [/^exchanges$/, async () => md.envelope((await md.getMarkets()).flatMap((m) => m.exchanges.map((e) => ({ ...e, marketId: m.id, country: m.name }))))],
  [/^assets$/, (_, q) => list(q)],
  [/^(?:assets\/)?search$/, async (_, q) => md.envelope(await md.search(q.q))],
  [/^assets\/([^/]+)$/, async ([id]) => { const a = await asset(id); return md.envelope(a, a.meta); }],
  [/^assets\/([^/]+)\/price$/, async ([id]) => { const a = await asset(id); const quote = await p().getQuote(a.id); return md.envelope(quote, a.meta); }],
  [/^assets\/([^/]+)\/ohlcv$/, async ([id], q) => { const a = await asset(id); const r = await md.getOHLCV(a.id, q.range as ChartRange); return md.envelope(r?.candles ?? null, { ...a.meta, ...(r ? {} : { dataStatus: 'UNAVAILABLE' as const }) }); }],
  [/^assets\/([^/]+)\/fundamentals$/, async ([id]) => { const a = await asset(id); return md.envelope(await p().getFundamentals(a.id), a.meta); }],
  [/^assets\/([^/]+)\/valuation$/, async ([id]) => { const a = await asset(id); return md.envelope(await p().getValuation(a.id), a.meta); }],
  [/^assets\/([^/]+)\/technicals$/, async ([id]) => { const a = await asset(id); return md.envelope(await p().getTechnicals(a.id), a.meta); }],
  [/^assets\/([^/]+)\/dividends$/, async ([id]) => { const a = await asset(id); return md.envelope(await p().getDividends(a.id), a.meta); }],
  [/^assets\/([^/]+)\/news$/, async ([id]) => { const a = await asset(id); return md.envelope(await md.getNews({ assetId: a.id })); }],
  [/^assets\/([^/]+)\/research$/, async ([id]) => { const a = await asset(id); return md.envelope((await md.getResearch()).filter((d) => d.assetSlug === a.slug)); }],
  [/^etfs$/, (_, q) => list(q, ['etf'])],
  [/^assets\/([^/]+)\/identity$/, async ([id]) => { const a = await asset(id); return md.envelope(await p().getIdentity(a.id), a.meta); }],
  [/^etfs\/([^/]+)\/holdings$/, async ([id]) => { const a = await asset(id); return md.envelope(await p().getETFHoldings(a.id), a.meta); }],
  [/^etfs\/([^/]+)\/allocations$/, async ([id]) => { const a = await asset(id); return md.envelope(await p().getETFAllocations(a.id), a.meta); }],
  [/^indices$/, (_, q) => list(q, ['index'])],
  [/^fx$/, (_, q) => list(q, ['fx'])],
  [/^commodities$/, (_, q) => list(q, ['commodity'])],
  [/^bonds$/, (_, q) => list(q, ['bond'])],
  [/^reits$/, (_, q) => list(q, ['reit'])],
  [/^heatmap$/, async (_, q) => { const rows = await md.getAssets({ cls: q.universe === 'all' ? md.EQUITY_LIKE : [q.universe] }); return md.envelope(rows, md.freshest(rows) ?? undefined); }],
  [/^movers$/, async (_, q) => { const rows = await md.getAssets({ cls: md.EQUITY_LIKE, region: q.region }); return md.envelope(md.movers(rows, 10), md.freshest(rows) ?? undefined); }],
  [/^sectors$/, async (_, q) => { const rows = await md.getAssets({ cls: ['stock'], region: q.region }); return md.envelope(md.sectors(rows), md.freshest(rows) ?? undefined); }],
  [/^calendar$/, async (_, q) => md.envelope(await md.getCalendar(q.kind as CalendarKind | undefined))],
  [/^earnings$/, async () => md.envelope(await md.getCalendar('earnings'))],
  [/^dividends$/, async () => md.envelope(await md.getCalendar('dividend'))],
  [/^news$/, async (_, q) => { const { rows, pagination } = md.paginate(await md.getNews({ category: q.kind }), q.page, q.pageSize); return md.envelope(rows, undefined, pagination); }],
  [/^research$/, async (_, q) => md.envelope(await md.getResearch(q.kind as ResearchKind | undefined))],
  [/^themes$/, async () => md.envelope(await md.getThemes())],
  [/^fx-rates$/, async () => md.envelope(await md.fxRates())],
];

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const rl = rateLimit(`api:${ip}`, 240);
  if (!rl.ok) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again in a minute.' } }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } });
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_QUERY', message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') } }, { status: 400 });
  const path = (await ctx.params).path.join('/');
  for (const [re, handler] of ROUTES) {
    const m = path.match(re);
    if (!m) continue;
    try {
      return NextResponse.json(await handler(m.slice(1), parsed.data), { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' } });
    } catch (e) {
      if (e instanceof NotFound) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'No such resource.' } }, { status: 404 });
      const { status, body } = md.toApiError(e);
      return NextResponse.json(body, { status });
    }
  }
  return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Unknown endpoint.' } }, { status: 404 });
}
