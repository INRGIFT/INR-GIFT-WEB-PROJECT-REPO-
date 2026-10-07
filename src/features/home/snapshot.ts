import type { ChartSeries } from '@/lib/charts/types';
import { config } from '@/lib/config';
import type { Asset, ChartRange, MarketView, ResearchDoc } from '@/lib/types';
import { getChartSeries } from '@/services/chart-data';
import * as md from '@/services/market-data';

/**
 * What the public homepage may show, and the server-side snapshot it shows. The homepage never calls /api/v1 (those
 * routes need a verified session): this module runs on the server, through the same services as every other page,
 * and hands finished values to the page. Each part loads on its own, with a time limit, so one failure shows one
 * honest error state and never blanks the page.
 *
 * Public display policy (owner decision, homepage brief, 7 Oct 2026; docs/DECISIONS.md):
 *   demo      the demo provider is active: simulated values are shown, labelled DEMO everywhere (status badge,
 *             notices, `data-nosnippet` so search engines do not quote them as prices).
 *   licensed  a licensed provider is active and the owner has confirmed public display rights for its data by setting
 *             PUBLIC_MARKET_DATA=on (server-only). Its own statuses show (LIVE only with a real-time entitlement).
 *   off       a licensed provider without that confirmation: the homepage shows no prices, charts or screen results,
 *             only sessions (from exchange calendars), structure and sign-in prompts.
 */
export type PublicDataMode = 'demo' | 'licensed' | 'off';
export function publicDataMode(env: Record<string, string | undefined> = process.env, provider: string = config.provider): PublicDataMode {
  if (provider === 'demo') return 'demo';
  return env.PUBLIC_MARKET_DATA === 'on' ? 'licensed' : 'off';
}

export type Settled<T> = { ok: true; value: T } | { ok: false };
const LIMIT_MS = 4000;
/** Runs one part of the snapshot with a time limit; a failure or a timeout becomes `{ ok: false }`, never a throw. */
export async function settle<T>(work: () => Promise<T>, ms = LIMIT_MS): Promise<Settled<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const value = await Promise.race([work(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), ms); })]);
    return { ok: true, value };
  } catch { return { ok: false }; }
  finally { clearTimeout(timer); }
}

/** The hero instrument: India's benchmark index first; the next one is used only if a source lacks it. */
export const HERO_CANDIDATES = ['NIFTY-50', 'SENSEX', 'SP-500'];
/** Ranges prepared on the server so the hero chart can switch period without a (protected) API call. */
export const HERO_RANGES: ChartRange[] = ['1M', '1Y', '5Y'];
export const HERO_DEFAULT_RANGE: ChartRange = '1Y';

/** The market strip: three instruments per asset class, addressed by URL slug and resolved to instrument ids. */
export const STRIP: { label: string; href: string; slugs: string[] }[] = [
  { label: 'Global indices', href: '/assets/indices', slugs: ['NIFTY-50', 'SP-500', 'FTSE-100'] },
  { label: 'Equities', href: '/assets/stocks', slugs: ['RELIANCE', 'AAPL', 'ASML'] },
  { label: 'FX', href: '/assets/fx', slugs: ['USD-INR', 'EUR-USD', 'GBP-INR'] },
  { label: 'Commodities', href: '/assets/commodities', slugs: ['GOLD', 'BRENT', 'SILVER'] },
  { label: 'Bonds', href: '/assets/bonds', slugs: ['IN-10Y', 'US-10Y', 'DE-10Y'] },
  { label: 'ETFs', href: '/assets/etfs', slugs: ['SPY', 'INDA', 'QQQ'] },
];

/** The three product tours on the homepage (existing recordings in /public/media), the overview first. */
export const HOME_VIDEO_IDS = ['product-walkthrough', 'universal-search', 'heatmap-drill-down'] as const;

/** The comparison preview: one Indian and two global companies, read on the same registered metrics. */
export const COMPARE_SLUGS = ['RELIANCE', 'AAPL', 'SAP'];

export interface HeroSnapshot { asset: Asset; market: MarketView | null; series: ChartSeries[]; defaultRange: ChartRange }
export interface StripGroup { label: string; href: string; rows: Asset[] }
export interface HomeSnapshot {
  mode: PublicDataMode;
  /** When the snapshot was assembled (ISO, UTC). */
  at: string;
  hero: Settled<HeroSnapshot | null>;
  strip: Settled<StripGroup[]>;
  /** Market sessions come from exchange calendars (hours, holidays), not from priced data: shown in every mode. */
  markets: Settled<MarketView[]>;
  /** Stocks, ETFs and REITs for the screen and compare previews (not loaded when the mode is off). */
  equities: Settled<Asset[]>;
  compare: Settled<Asset[]>;
  research: Settled<ResearchDoc[]>;
}

/**
 * The hero's bars travel inside the page, so they are rounded to the precision the chart displays (two decimals for
 * NIFTY 50): the same candles, a fraction of the bytes. Volume is whole units. Nothing else in the series changes.
 */
export function compactBars(s: ChartSeries): ChartSeries {
  const f = 10 ** s.pricePrecision;
  const r = (v: number) => Math.round(v * f) / f;
  return { ...s, bars: s.bars.map((b) => ({ t: b.t, o: r(b.o), h: r(b.h), l: r(b.l), c: r(b.c), v: b.v == null ? null : Math.round(b.v) })) };
}

async function loadHero(now: Date): Promise<HeroSnapshot | null> {
  for (const slug of HERO_CANDIDATES) {
    const results = await Promise.all(HERO_RANGES.map((r) => getChartSeries(slug, r, undefined, now)));
    const series = results.flatMap((r) => (r.ok && r.series.bars.length > 1 ? [compactBars(r.series)] : []));
    if (!series.length) continue;
    const asset = await md.getAsset(undefined, slug);
    if (!asset) continue;
    const market = asset.marketId ? await md.getMarket(asset.marketId).catch(() => null) : null;
    return { asset, market, series, defaultRange: series.some((s) => s.range === HERO_DEFAULT_RANGE) ? HERO_DEFAULT_RANGE : series[0].range };
  }
  return null;
}
async function bySlugs(slugs: string[]): Promise<Asset[]> {
  const rows = await Promise.all(slugs.map((s) => md.getAsset(undefined, s).catch(() => null)));
  return rows.filter((a): a is Asset => Boolean(a));
}

export async function getHomeSnapshot(now = new Date(), mode: PublicDataMode = publicDataMode()): Promise<HomeSnapshot> {
  const off = <T,>(): Promise<Settled<T>> => Promise.resolve({ ok: false });
  const priced = mode !== 'off';
  const [hero, strip, markets, equities, compare, research] = await Promise.all([
    priced ? settle(() => loadHero(now)) : off<HeroSnapshot | null>(),
    priced ? settle(async () => (await Promise.all(STRIP.map(async (g) => ({ label: g.label, href: g.href, rows: await bySlugs(g.slugs) })))).filter((g) => g.rows.length)) : off<StripGroup[]>(),
    settle(() => md.getMarkets()),
    priced ? settle(() => md.getAssets({ cls: ['stock', 'etf', 'reit'] })) : off<Asset[]>(),
    priced ? settle(() => bySlugs(COMPARE_SLUGS)) : off<Asset[]>(),
    settle(() => md.getResearch()),
  ]);
  return { mode, at: now.toISOString(), hero, strip, markets, equities, compare, research };
}
