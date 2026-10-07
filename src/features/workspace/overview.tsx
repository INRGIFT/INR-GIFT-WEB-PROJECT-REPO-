'use client';
import { ArrowRight, Bell, Bookmark, Columns2, Compass, ExternalLink, FileText, Newspaper, Search, SlidersHorizontal, Star } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/data-status';
import { ModuleBoundary } from '@/components/ui/module-boundary';
import { Badge, Callout, Change, EmptyState, ErrorState, PageContainer, Panel, RetryButton, SkeletonRows, UnavailableState } from '@/components/ui/primitives';
import { useAccount } from '@/features/account/account-context';
import { AssetIdentity } from '@/features/assets/asset-table';
import { useSession } from '@/features/auth/session-context';
import { useOpenSearch } from '@/features/search/search-command';
import { alertLabel } from '@/lib/alerts';
import { SESSION_LABEL } from '@/lib/calendar';
import { cn, dateShort, dateTimeIST, num, priceDp, timeIST } from '@/lib/format';
import { assetHref } from '@/lib/routes';
import type { Asset, MarketView } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import type { NewsArticle, NewsResult } from '@/services/news/news-types';
import { greeting } from './greeting';
import { ModuleFootClient } from './module-foot';
import { useAssets } from './ws-ui';
import { useWorkspace } from './workspace-context';


/**
 * /app: the signed-in research home. Six independent modules (market overview, quick research, news, watchlist,
 * saved research, alerts). Each loads, fails and retries on its own, behind its own error boundary, so one failing
 * source never blanks the page. Everything shown is real: provider data with its status and timestamp, or the
 * person's own saved rows. No sample counts, no invented notifications.
 */
export function OverviewPage() {
  const { user } = useSession();
  const { profile } = useAccount();
  const ws = useWorkspace();
  const openSearch = useOpenSearch();
  return (
    <PageContainer>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold md:text-[34px]">{greeting(profile?.name ?? user?.name)}</h1>
          <p className="mt-1.5 max-w-[70ch] text-[15px] text-slate2">Welcome back to your global market research workspace.</p>
        </div>
        <button type="button" onClick={openSearch} className="inline-flex h-ctl items-center gap-2 rounded-ctl border border-line2 bg-white px-4 font-medium text-navy transition-colors hover:border-brand hover:text-brand-ink"><Search size={16} aria-hidden />Search assets and markets</button>
      </header>
      {ws.ready && !ws.failed.length && !ws.prefs.onboardedAt && (
        <Callout tone="info" title="Finish setting up your workspace" action={<ButtonLink size="sm" variant="primary" href="/onboarding">Continue setup</ButtonLink>}>Choose a display currency, the regions you follow and a starter watchlist. It takes a minute.</Callout>
      )}
      <ModuleBoundary name="Global market overview"><MarketOverview /></ModuleBoundary>
      <ModuleBoundary name="Quick research"><QuickResearch /></ModuleBoundary>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <ModuleBoundary name="Market news"><NewsModule /></ModuleBoundary>
        <ModuleBoundary name="Watchlist"><WatchlistModule /></ModuleBoundary>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ModuleBoundary name="Saved research"><SavedResearchModule /></ModuleBoundary>
        <ModuleBoundary name="Alerts"><AlertsModule /></ModuleBoundary>
      </div>
      <p className="text-xs text-faint">INRGIFT is a research and information platform. It is not a broker or an investment adviser, and nothing here is a recommendation.</p>
    </PageContainer>
  );
}

/* ------------------------------------------ A. Global market overview ------------------------------------------ */

/** The benchmarks on the overview, in display order. Instruments the data source does not carry are left out. */
const OVERVIEW: { group: string; slugs: string[] }[] = [
  { group: 'Equity indices', slugs: ['NIFTY-50', 'SENSEX', 'GIFT-NIFTY', 'SP-500', 'NASDAQ-COMPOSITE', 'FTSE-100', 'DAX', 'NIKKEI-225', 'HANG-SENG'] },
  { group: 'Currencies', slugs: ['USD-INR', 'EUR-USD'] },
  { group: 'Commodities', slugs: ['GOLD', 'BRENT'] },
  { group: 'Government bonds', slugs: ['IN-10Y', 'US-10Y'] },
];
const OVERVIEW_URL = `/api/v1/assets?ids=${OVERVIEW.flatMap((g) => g.slugs).join(',')}&pageSize=50`;

const valueDp = (a: Asset) => (a.price == null ? 2 : a.cls === 'fx' ? (a.price < 10 ? 4 : 2) : priceDp(a.price));
/** Index points and rates without a currency sign; prices with it. */
function value(a: Asset): string {
  if (a.price == null) return '—';
  const n = num(a.price, valueDp(a));
  return a.cls === 'commodity' ? `${a.currency === 'USD' ? '$' : `${a.currency} `}${n}` : n;
}
function absChange(a: Asset): number | null { return a.price != null && a.prevClose != null ? a.price - a.prevClose : null; }
/** Time only for today (IST), date and time otherwise. */
function asOf(iso: string): string {
  const day = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return day(new Date(iso)) === day(new Date()) ? timeIST(iso) : dateTimeIST(iso);
}

function SignedNumber({ v, dp }: { v: number | null; dp: number }) {
  if (v == null) return <span className="num text-faint" title="Unavailable from source">—</span>;
  const tone = v > 0 ? 'text-up' : v < 0 ? 'text-down' : 'text-slate2';
  return <span className={cn('num whitespace-nowrap', tone)}>{v > 0 ? '+' : v < 0 ? '−' : ''}{num(Math.abs(v), dp)}</span>;
}

function MarketOverview() {
  const assets = useApi<Asset[]>(OVERVIEW_URL);
  const markets = useApi<MarketView[]>('/api/v1/markets');
  const bySlug = useMemo(() => new Map((assets.data ?? []).map((a) => [a.slug, a])), [assets.data]);
  const marketById = useMemo(() => new Map((markets.data ?? []).map((m) => [m.id, m])), [markets.data]);
  const groups = OVERVIEW.map((g) => ({ group: g.group, rows: g.slugs.map((s) => bySlug.get(s)).filter((a): a is Asset => Boolean(a)) })).filter((g) => g.rows.length);
  const open = (markets.data ?? []).filter((m) => m.session === 'OPEN').length;
  const sources = [...new Set((assets.data ?? []).map((a) => a.meta.source))];
  const retry = () => { assets.reload(); markets.reload(); };
  const session = (a: Asset): ReactNode => {
    if (!a.marketId) return <span className="text-faint" title="Not tied to one exchange session">n/a</span>;
    if (markets.error) return <span className="text-faint" title="Session status could not load">—</span>;
    const m = marketById.get(a.marketId);
    if (!m) return markets.loading ? <span className="text-faint">…</span> : <span className="text-faint">—</span>;
    return <span className={cn('whitespace-nowrap', m.session === 'OPEN' ? 'font-semibold text-up' : 'text-slate2')} title={m.holidayName ? `${m.name}: ${m.holidayName}` : `${m.name}, local time ${m.localTime}`}>{m.name} · {SESSION_LABEL[m.session]}</span>;
  };
  return (
    <Panel flush title="Global market overview" sub={markets.data ? `${open} of ${markets.data.length} markets open now` : undefined} tools={<ButtonLink size="sm" href="/markets">All markets</ButtonLink>}
      footer={assets.data && assets.data.length > 0 ? <><ModuleFootClient meta={assets.meta} /><span>Source: {sources.join(', ')}</span></> : undefined}>
      {assets.error ? <ErrorState title="Market data could not load" action={<RetryButton onRetry={retry} label="Try again" />}>{assets.error}</ErrorState>
        : assets.loading && !assets.data ? <SkeletonRows rows={6} />
        : !groups.length ? <UnavailableState title="Market overview unavailable">The current data source does not provide these benchmarks yet. Nothing is estimated or filled in.</UnavailableState>
        : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <caption className="sr-only">Benchmark indices, currencies, commodities and government bonds with value, change, market session and data status</caption>
              <thead>
                <tr className="text-xs text-faint">
                  <th scope="col" className="px-4 py-2.5 text-left font-semibold">Instrument</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Value</th>
                  <th scope="col" className="hidden px-3 py-2.5 text-right font-semibold sm:table-cell">Change</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">% change</th>
                  <th scope="col" className="hidden px-3 py-2.5 text-left font-semibold lg:table-cell">Market</th>
                  <th scope="col" className="hidden px-3 py-2.5 text-left font-semibold md:table-cell">Data status</th>
                  <th scope="col" className="hidden px-4 py-2.5 text-right font-semibold xl:table-cell">As of</th>
                </tr>
              </thead>
              {groups.map((g) => (
                <tbody key={g.group}>
                  <tr><th scope="colgroup" colSpan={7} className="border-y border-line bg-soft/70 px-4 py-1.5 text-left text-micro font-semibold uppercase tracking-[.08em] text-faint">{g.group}</th></tr>
                  {g.rows.map((a) => (
                    <tr key={a.id} className="border-b border-line last:border-0 hover:bg-bg">
                      <th scope="row" className="px-4 py-2 text-left font-normal">
                        <Link href={assetHref(a)} className="font-semibold text-navy hover:text-brand-ink">{a.name}</Link>
                        <span className="block text-[11px] text-faint">{a.symbol}{a.cls === 'bond' && a.m.yield != null ? ` · Yield ${num(a.m.yield, 2)}%` : ''}{a.cls === 'commodity' && a.commodity ? ` · ${a.commodity.unit}` : ''}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 md:hidden"><StatusBadge status={a.status} /><span className="text-[11px] text-faint lg:hidden">{session(a)}</span></span>
                      </th>
                      <td className="num whitespace-nowrap px-3 py-2 text-right font-semibold">{value(a)}</td>
                      <td className="hidden px-3 py-2 text-right sm:table-cell"><SignedNumber v={absChange(a)} dp={valueDp(a)} /></td>
                      <td className="px-3 py-2 text-right"><Change value={a.m.d1} /></td>
                      <td className="hidden px-3 py-2 text-left text-[12px] lg:table-cell">{session(a)}</td>
                      <td className="hidden px-3 py-2 md:table-cell"><StatusBadge status={a.status} /></td>
                      <td className="hidden whitespace-nowrap px-4 py-2 text-right text-xs text-faint xl:table-cell"><time dateTime={a.meta.timestamp} title={`Source: ${a.meta.source}`}>{asOf(a.meta.timestamp)}</time></td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        )}
    </Panel>
  );
}

/* ---------------------------------------------- B. Quick research ---------------------------------------------- */

const QUICK: [string, string, string, typeof Compass][] = [
  ['Discover', '/discover', 'Markets, sectors, themes and what is moving, in one place.', Compass],
  ['Screen', '/discover/screener', 'Filter stocks, ETFs and REITs by valuation, growth, income and risk.', SlidersHorizontal],
  ['Compare', '/discover/compare', 'Line assets up side by side on the same metrics and charts.', Columns2],
  ['Research', '/research', 'Structured research on companies, funds, markets, themes and countries.', FileText],
];
const WORKFLOW = ['Search', 'Discover', 'Screen', 'Compare', 'Research', 'Visualize', 'Save', 'Watch', 'Alert'];

function QuickResearch() {
  return (
    <section aria-labelledby="quick-research" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="quick-research" className="text-lg font-bold">Quick research</h2>
        <p className="text-xs font-semibold uppercase tracking-[.08em] text-faint"><span className="sr-only">Research workflow: </span>{WORKFLOW.map((w, i) => <span key={w}>{i > 0 && <span aria-hidden className="mx-1 text-line2">→</span>}{w}</span>)}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK.map(([label, href, text, Icon]) => (
          <li key={href}>
            <Link href={href} className="card-link group flex h-full flex-col p-4">
              <span className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-ink"><Icon size={18} aria-hidden /></span><span className="font-display text-[16px] font-bold">{label}</span></span>
              <span className="mt-2 flex-1 text-[13px] text-slate2">{text}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-ink">Open {label.toLowerCase()}<ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* --------------------------------------------------- C. News --------------------------------------------------- */

type NewsMeta = { status: NewsResult['status']; provider: NewsResult['provider']; retrievedAt: string | null; notice: string | null };
const NEWS_STATUS: Record<NewsResult['status'], [string, 'up' | 'neutral' | 'warn' | 'down']> = { FRESH: ['Fresh', 'up'], CACHED: ['Cached', 'neutral'], STALE: ['Stale: last good result', 'warn'], DEMO: ['Demo headlines', 'warn'], UNAVAILABLE: ['Unavailable', 'down'] };

function useNews(url: string) {
  const [state, setState] = useState<{ data: NewsArticle[] | null; meta: NewsMeta | null; error: string | null; loading: boolean }>({ data: null, meta: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const ctl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fetch(url, { signal: ctl.signal, credentials: 'same-origin' })
      .then(async (r) => { const j = await r.json().catch(() => null); if (!r.ok || !j || 'error' in j) throw new Error(j?.error?.message ?? 'News could not load.'); return j as { data: NewsArticle[]; meta: NewsMeta }; })
      .then((j) => setState({ data: j.data, meta: j.meta, error: null, loading: false }))
      .catch((e: Error) => { if (e.name !== 'AbortError') setState({ data: null, meta: null, error: e.message || 'News could not load.', loading: false }); });
    return () => ctl.abort();
  }, [url, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

function NewsModule() {
  const news = useNews('/api/v1/news/feed?section=most-relevant');
  const stories = (news.data ?? []).slice(0, 6);
  const [label, tone] = news.meta ? NEWS_STATUS[news.meta.status] : ['', 'neutral' as const];
  return (
    <Panel flush title="Market news" sub={news.meta?.provider === 'newsdata.io' ? 'NewsData.io' : news.meta ? 'Demo headlines' : undefined} tools={<ButtonLink size="sm" href="/resources/news">All news</ButtonLink>}
      footer={news.meta ? <><Badge tone={tone}>{label}</Badge>{news.meta.retrievedAt && <span>Retrieved {dateTimeIST(news.meta.retrievedAt)}</span>}<span>Headlines link to the original publishers.</span></> : undefined}>
      {news.error ? <ErrorState title="News could not load" action={<RetryButton onRetry={news.reload} label="Try again" />}>Market data, research and your workspace are not affected.</ErrorState>
        : news.loading && !news.data ? <SkeletonRows rows={5} />
        : news.meta?.status === 'UNAVAILABLE' ? <ErrorState title="News is unavailable right now" action={<RetryButton onRetry={news.reload} label="Try again" />}>{news.meta.notice ?? 'The news provider did not answer.'} Market data, research and your workspace are not affected.</ErrorState>
        : !stories.length ? <EmptyState icon={<Newspaper size={22} />} title="No market stories right now" action={<ButtonLink href="/resources/news">Open the news page</ButtonLink>}>Nothing market-relevant came back from the news source. Try again later.</EmptyState>
        : (
          <>
            {news.meta?.status === 'STALE' && <p role="status" className="border-b border-line bg-warn/5 px-4 py-2 text-xs text-slate2">{news.meta.notice ?? 'The news provider did not answer.'} Showing the last stories INRGIFT retrieved.</p>}
            <ul>{stories.map((a, i) => <li key={a.article_id}><StoryRow a={a} lead={i === 0} /></li>)}</ul>
          </>
        )}
    </Panel>
  );
}

function StoryRow({ a, lead }: { a: NewsArticle; lead?: boolean }) {
  const external = /^https?:/.test(a.url);
  const topic = a.derived.primary_topic;
  return (
    <article className="border-b border-line px-4 py-3 last:border-0">
      <h3 className={cn('font-semibold leading-snug', lead && 'text-[16px]')}>
        <a href={a.url} {...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})} className="hover:text-brand-ink hover:underline">{a.title}{external && <><ExternalLink size={12} className="ml-1 inline align-baseline text-faint" aria-hidden /><span className="sr-only"> (opens the original article in a new tab)</span></>}</a>
      </h3>
      {lead && a.description && <p className="mt-1 line-clamp-2 text-[13px] text-slate2">{a.description}</p>}
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
        <span className="font-medium text-slate2">{a.source_name ?? 'Unknown source'}</span>
        {a.published_at ? <time dateTime={a.published_at}>{dateTimeIST(a.published_at)}</time> : <span>Publish time not provided</span>}
        {topic && topic !== 'markets' && topic !== 'business' && <Badge>{TOPIC_SHORT[topic] ?? topic}</Badge>}
        {a.derived.regions[0] && <span>{a.derived.regions[0]}</span>}
      </p>
    </article>
  );
}
const TOPIC_SHORT: Partial<Record<NonNullable<NewsArticle['derived']['primary_topic']>, string>> = {
  equities: 'Stocks', macro: 'Economy', fx: 'FX', commodities: 'Commodities', bonds: 'Bonds & rates', etfs: 'ETFs', indices: 'Indices', earnings: 'Earnings',
  ipo: 'IPO', 'corporate-actions': 'Corporate actions', 'central-banks': 'Central banks', 'politics-markets': 'Politics & markets', geopolitics: 'Geopolitics', trade: 'Trade', regulation: 'Regulation',
};

/* ------------------------------------------------- D. Watchlist ------------------------------------------------ */

/** A workspace module whose rows could not load: an error with Retry, never a false "empty". */
function WsError({ what }: { what: string }) {
  const ws = useWorkspace();
  return <ErrorState title={`Your ${what} could not load`} action={<RetryButton onRetry={ws.reload} label="Try again" />}>Nothing was lost. Check your connection and try again.</ErrorState>;
}

function WatchlistModule() {
  const ws = useWorkspace();
  const openSearch = useOpenSearch();
  const lists = useMemo(() => [...ws.data.watchlists].sort((a, b) => a.position - b.position), [ws.data.watchlists]);
  const first = lists[0];
  const ids = useMemo(() => ws.data.watchlist_items.filter((i) => i.watchlist_id === first?.id).sort((a, b) => a.position - b.position).map((i) => i.instrument_id), [ws.data.watchlist_items, first?.id]);
  const md = useAssets(ids);
  const rows = ids.map((id) => md.map.get(id)).filter((a): a is Asset => Boolean(a));
  const failed = ws.failed.includes('watchlists') || ws.failed.includes('watchlist_items');
  return (
    <Panel flush title={first ? first.name : 'Watchlist'} sub={ws.ready && !failed && lists.length ? `${lists.length} ${lists.length === 1 ? 'list' : 'lists'} · ${ws.data.watchlist_items.length} ${ws.data.watchlist_items.length === 1 ? 'asset' : 'assets'}` : undefined}
      tools={<ButtonLink size="sm" href="/app/watchlist">Manage</ButtonLink>} footer={rows.length ? <ModuleFootClient meta={md.meta} /> : undefined}>
      {!ws.ready ? <SkeletonRows rows={5} />
        : failed ? <WsError what="watchlists" />
        : !ids.length ? <EmptyState icon={<Star size={22} />} title="Your watchlists will appear here." action={<><button type="button" onClick={openSearch} className="inline-flex h-10 items-center gap-2 rounded-ctl bg-brand px-4 font-medium text-white hover:bg-brand-ink"><Search size={16} aria-hidden />Find an asset</button><ButtonLink href="/markets">Browse markets</ButtonLink></>}>Star any asset to follow its price, news and research here.</EmptyState>
        : md.error ? <ErrorState title="Prices could not load" action={<RetryButton onRetry={md.reload} label="Try again" />}>Your watchlist is saved. Only the market data failed.</ErrorState>
        : md.loading && !rows.length ? <SkeletonRows rows={Math.min(ids.length, 6)} />
        : (
          <ul>{rows.slice(0, 8).map((a) => (
            <li key={a.id} className="flex items-center gap-3 border-b border-line px-4 py-2 last:border-0 hover:bg-bg">
              <div className="min-w-0 flex-1"><AssetIdentity asset={a} /></div>
              <span className="text-right"><span className="num block text-[13px] font-medium">{ws.showPrice(a)}</span><span className="block text-[13px]"><Change value={a.m.d1} /></span></span>
              <span className="hidden w-[96px] text-right sm:block"><StatusBadge status={a.status} /></span>
            </li>
          ))}{ids.length > 8 && <li className="px-4 py-2 text-[13px]"><Link href="/app/watchlist" className="link">See all {ids.length} assets</Link></li>}</ul>
        )}
    </Panel>
  );
}

/* --------------------------------------------- E. Saved research --------------------------------------------- */

function SavedResearchModule() {
  const ws = useWorkspace();
  const saved = useMemo(() => [...ws.data.saved_research].sort((a, b) => b.created_at.localeCompare(a.created_at)), [ws.data.saved_research]);
  return (
    <Panel flush title="Saved research" sub={ws.ready && !ws.failed.includes('saved_research') && saved.length ? `${saved.length} saved` : undefined} tools={<ButtonLink size="sm" href="/app/research">Open</ButtonLink>}>
      {!ws.ready ? <SkeletonRows rows={4} />
        : ws.failed.includes('saved_research') ? <WsError what="saved research" />
        : !saved.length ? <EmptyState icon={<Bookmark size={22} />} title="Research you save will appear here." action={<ButtonLink href="/research">Browse research</ButtonLink>}>Use Save on any research note or asset page to keep it for later.</EmptyState>
        : (
          <ul>{saved.slice(0, 5).map((r) => (
            <li key={r.id}>
              <Link href={r.href} className="row-link py-2.5">
                <span className="block truncate font-semibold">{r.title}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-faint"><Badge tone={r.ref_type === 'document' ? 'brand' : 'neutral'}>{r.ref_type === 'document' ? 'Research' : 'Asset'}</Badge>{r.tags.slice(0, 3).map((t) => <Badge key={t}>{t}</Badge>)}Saved {dateShort(r.created_at)}</span>
              </Link>
            </li>
          ))}</ul>
        )}
    </Panel>
  );
}

/* --------------------------------------------------- F. Alerts -------------------------------------------------- */

function AlertsModule() {
  const ws = useWorkspace();
  const alerts = useMemo(() => [...ws.data.alerts].sort((a, b) => Number(b.status === 'triggered') - Number(a.status === 'triggered') || b.created_at.localeCompare(a.created_at)), [ws.data.alerts]);
  const ids = useMemo(() => alerts.slice(0, 5).map((a) => a.instrument_id), [alerts]);
  const md = useAssets(ids);
  const active = alerts.filter((a) => a.status === 'active').length;
  const triggered = alerts.filter((a) => a.status === 'triggered').length;
  return (
    <Panel flush title="Alerts" sub={ws.ready && !ws.failed.includes('alerts') && alerts.length ? `${active} active${triggered ? ` · ${triggered} triggered` : ''}` : undefined} tools={<ButtonLink size="sm" href="/app/alerts">All alerts</ButtonLink>}>
      {!ws.ready ? <SkeletonRows rows={4} />
        : ws.failed.includes('alerts') ? <WsError what="alerts" />
        : !alerts.length ? <EmptyState icon={<Bell size={22} />} title="Your alerts will appear here." action={<ButtonLink href="/markets">Find an asset</ButtonLink>}>Use the bell on any asset to be told when a price level, a move or an event happens. Alerts notify you; they never act for you.</EmptyState>
        : (
          <ul>{alerts.slice(0, 5).map((al) => {
            const a = md.map.get(al.instrument_id);
            return (
              <li key={al.id} className={cn('flex items-start gap-3 border-b border-line px-4 py-2.5 last:border-0', al.status === 'triggered' && 'bg-brand-soft/40')}>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{a ? <Link href={assetHref(a)} className="hover:text-brand-ink">{a.symbol}</Link> : md.error ? 'Asset' : '…'} · {alertLabel(al.kind, al.threshold)}</span>
                  <span className="text-xs text-faint">{al.status === 'triggered' && al.last_triggered_at ? `Triggered ${dateTimeIST(al.last_triggered_at)}` : al.status === 'paused' ? 'Paused' : 'Watching'} · {al.channel === 'email' ? 'Email' : 'In app'}</span>
                </span>
                <Badge tone={al.status === 'triggered' ? 'brand' : al.status === 'paused' ? 'neutral' : 'up'}>{al.status === 'triggered' ? '◆ Triggered' : al.status === 'paused' ? '○ Paused' : '● Active'}</Badge>
              </li>
            );
          })}</ul>
        )}
    </Panel>
  );
}

