import { config } from '@/lib/config';
import type { Asset, MarketView, ResearchDoc } from '@/lib/types';
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

export interface StripGroup { label: string; href: string; rows: Asset[] }
export interface HomeSnapshot {
  mode: PublicDataMode;
  /** When the snapshot was assembled (ISO, UTC). */
  at: string;
  strip: Settled<StripGroup[]>;
  /** Market sessions come from exchange calendars (hours, holidays), not from priced data: shown in every mode. */
  markets: Settled<MarketView[]>;
  /** Stocks, ETFs and REITs for the screen and compare previews (not loaded when the mode is off). */
  equities: Settled<Asset[]>;
  compare: Settled<Asset[]>;
  research: Settled<ResearchDoc[]>;
}

async function bySlugs(slugs: string[]): Promise<Asset[]> {
  const rows = await Promise.all(slugs.map((s) => md.getAsset(undefined, s).catch(() => null)));
  return rows.filter((a): a is Asset => Boolean(a));
}

/**
 * The homepage hero holds no chart (owner decision, 8 Oct 2026: the NIFTY 50 chart was removed); the market strip
 * below it is the first data on the page. KLineChart stays on asset pages.
 */
export async function getHomeSnapshot(now = new Date(), mode: PublicDataMode = publicDataMode()): Promise<HomeSnapshot> {
  const off = <T,>(): Promise<Settled<T>> => Promise.resolve({ ok: false });
  const priced = mode !== 'off';
  const [strip, markets, equities, compare, research] = await Promise.all([
    priced ? settle(async () => (await Promise.all(STRIP.map(async (g) => ({ label: g.label, href: g.href, rows: await bySlugs(g.slugs) })))).filter((g) => g.rows.length)) : off<StripGroup[]>(),
    settle(() => md.getMarkets()),
    priced ? settle(() => md.getAssets({ cls: ['stock', 'etf', 'reit'] })) : off<Asset[]>(),
    priced ? settle(() => bySlugs(COMPARE_SLUGS)) : off<Asset[]>(),
    settle(() => md.getResearch()),
  ]);
  return { mode, at: now.toISOString(), strip, markets, equities, compare, research };
}
