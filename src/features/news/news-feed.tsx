import { ExternalLink, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/data-status';
import { Badge, Callout, Change, EmptyState, NoResults, Panel, UnavailableState } from '@/components/ui/primitives';
import { ModuleFoot } from '@/features/markets/widgets';
import { SESSION_LABEL } from '@/lib/calendar';
import { cn, dateTimeIST, num, priceDp } from '@/lib/format';
import { assetHref, CLASS_LABEL } from '@/lib/routes';
import type { Asset, DataMeta, Market, MarketView, Region } from '@/lib/types';
import { SECTIONS } from '@/services/news/news-provider';
import { NEWS_TOPICS } from '@/services/news/news-query';
import { freshness, rankScore } from '@/services/news/news-ranking';
import type { NewsArticle, NewsQuery, NewsResult, NewsSection, NewsTopic } from '@/services/news/news-types';
import { NewsFilters } from './news-filters';

export const TOPIC_LABEL: Record<NewsTopic, string> = {
  markets: 'Markets', business: 'Business', equities: 'Stocks', macro: 'Economy & macro', fx: 'FX', commodities: 'Commodities', bonds: 'Bonds & rates', etfs: 'ETFs', indices: 'Indices',
  earnings: 'Earnings', ipo: 'IPO', 'corporate-actions': 'Corporate actions', 'central-banks': 'Central banks', 'politics-markets': 'Politics & markets', geopolitics: 'Geopolitics', trade: 'Trade', regulation: 'Regulation',
};
/** The category rail, in reading order. Each maps to a section the news service supports (news-provider.ts). */
export const CATEGORIES: NewsSection[] = ['most-relevant', 'global-markets', 'stocks', 'macro', 'central-banks', 'fx', 'commodities', 'bonds', 'etfs', 'indices', 'companies', 'earnings', 'dividends', 'ipo', 'mergers', 'geopolitics', 'regulation', 'trade', 'supply-chain', 'country-risk'];
const REGIONS: Region[] = ['North America', 'Europe', 'Asia-Pacific', 'Middle East', 'Latin America', 'Africa'];
const STATUS: Record<NewsResult['status'], [string, 'up' | 'neutral' | 'warn' | 'down' | 'brand']> = { FRESH: ['Fresh from provider', 'up'], CACHED: ['Cached', 'neutral'], STALE: ['Stale: last good result', 'warn'], DEMO: ['Demo headlines', 'warn'], UNAVAILABLE: ['Unavailable', 'down'] };
const FRESH_LABEL = { recent: 'Recent', today: 'Today', older: 'Older' } as const;

const href = (q: NewsQuery, patch: Partial<NewsQuery>) => {
  const p = new URLSearchParams();
  Object.entries({ ...q, cursor: undefined, ...patch }).forEach(([k, v]) => { if (v !== undefined && v !== '' && !(k === 'section' && v === 'most-relevant')) p.set(k, String(v)); });
  const s = p.toString();
  return `/news${s ? `?${s}` : ''}`;
};
const external = (url: string) => /^https?:/.test(url);
const linkProps = (url: string) => (external(url) ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {});

/** Benchmarks beside the feed, with their own data status. */
export interface MarketPulse { assets: Asset[]; markets: MarketView[]; meta: DataMeta | null }

/**
 * /news: GLOBAL MARKET NEWS. Server rendered from the news service (NewsData.io when its key is set on the
 * server, demo headlines otherwise). Three areas on large screens: category rail, feed (featured story by INRGIFT's
 * relevance ranking, then stories), and a market pulse with data statuses. Every story links to its publisher; nothing
 * is rewritten or invented, and INRGIFT's own classifications are labelled as such.
 */
export function NewsFeed({ query, result, markets, pulse }: { query: NewsQuery; result: NewsResult; markets: Market[]; pulse: MarketPulse }) {
  const [statusLabel, tone] = STATUS[result.status];
  const featured = result.articles.length ? [...result.articles].sort((a, b) => rankScore(b) - rankScore(a))[0] : null;
  const rest = result.articles.filter((a) => a !== featured);
  const filtered = Boolean(query.q || query.market || query.region || query.assetClass || query.hours || query.source || query.topic || query.company);
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[26px] font-extrabold uppercase tracking-[.04em] md:text-[32px]">Global market news</h1>
        <p className="mt-1.5 max-w-[70ch] text-[15px] text-slate2">Market-moving news, macro developments, company events and financial intelligence.</p>
      </header>
      <NewsFilters
        values={{ section: query.section, q: query.q, market: query.market, region: query.region, assetClass: query.assetClass, hours: query.hours, source: query.source, topic: query.topic, company: query.company }}
        markets={markets.map((m) => ({ value: m.slug, label: m.name }))} regions={REGIONS.map((r) => ({ value: r, label: r }))}
        assets={(['stock', 'etf', 'index', 'fx', 'commodity', 'bond'] as const).map((c) => ({ value: c, label: CLASS_LABEL[c].many }))}
        topics={NEWS_TOPICS.filter((t) => t !== 'business' && t !== 'markets').map((t) => ({ value: t, label: TOPIC_LABEL[t] }))} />
      <nav aria-label="News categories" className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6 lg:hidden">
        {CATEGORIES.map((id) => <Link key={id} href={href(query, { section: id })} aria-current={query.section === id ? 'page' : undefined} className={cn('chip shrink-0', query.section === id && 'border-brand bg-brand-soft text-brand-ink')}>{SECTIONS[id].label}</Link>)}
      </nav>
      <div className="grid items-start gap-5 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_300px]">
        <aside className="hidden lg:block">
          <nav aria-label="News categories" className="sticky top-[calc(var(--header-h)+16px)]">
            <p className="px-3 pb-1.5 text-micro font-semibold uppercase tracking-[.1em] text-faint">Categories</p>
            <ul className="space-y-0.5">{CATEGORIES.map((id) => <li key={id}><Link href={href(query, { section: id })} aria-current={query.section === id ? 'page' : undefined} className={cn('block rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors', query.section === id ? 'bg-brand-soft text-brand-ink' : 'text-slate2 hover:bg-hover hover:text-navy')}>{SECTIONS[id].label}</Link></li>)}</ul>
          </nav>
        </aside>
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate2" aria-live="polite">
            <h2 className="mr-1 text-[15px] font-bold text-navy">{SECTIONS[query.section].label}</h2>
            <Badge tone={tone}>{statusLabel}</Badge>
            <span>Source: {result.provider === 'newsdata.io' ? 'NewsData.io' : 'INRGIFT demo headlines (no news key configured)'}</span>
            {result.retrievedAt && <span>· Retrieved {dateTimeIST(result.retrievedAt)}</span>}
            {result.excluded > 0 && <span>· {result.excluded} low-relevance {result.excluded === 1 ? 'story' : 'stories'} hidden</span>}
          </div>
          {result.notice && result.status !== 'UNAVAILABLE' && <Callout tone="warn" title={result.notice}>{result.status === 'STALE' ? 'Showing the last stories INRGIFT retrieved. They may be out of date.' : 'Try again in a few minutes.'}</Callout>}
          {result.status === 'UNAVAILABLE' ? (
            <div className="rounded-card border border-line bg-white shadow-card">
              <UnavailableState title="News is unavailable">{result.notice ?? 'The news provider did not answer.'} Market data, research and your workspace are not affected.</UnavailableState>
              <p className="-mt-6 pb-8 text-center"><Link href={href(query, {})} className="link text-[13px] font-semibold">Try again</Link></p>
            </div>
          ) : !featured ? (
            <div className="rounded-card border border-line bg-white shadow-card">
              {query.q
                ? <NoResults query={query.q} action={<Link href="/news" className="link text-[13px] font-semibold">Clear search and filters</Link>}>No market stories matched your filters. Try a company or market name, or a broader word.</NoResults>
                : <EmptyState icon={<Newspaper size={22} strokeWidth={1.75} />} title="No market stories matched your filters." action={<>{filtered && <Link href={href({ section: query.section }, {})} className="link text-[13px] font-semibold">Clear filters</Link>}{query.section !== 'most-relevant' && <Link href="/news" className="link text-[13px] font-semibold">Top stories</Link>}</>}>
                    {query.hours && query.hours < 48 ? 'Widen the time range to 48 hours, ' : 'Try '}another category, or remove a filter such as source or market.
                  </EmptyState>}
            </div>
          ) : (
            <>
              <FeaturedStory a={featured} />
              {rest.length > 0 && <ul className="grid gap-3 md:grid-cols-2">{rest.map((a) => <li key={a.article_id} className="min-w-0"><StoryCard a={a} /></li>)}</ul>}
            </>
          )}
          {result.nextCursor && result.status !== 'UNAVAILABLE' && <p><Link href={href(query, { cursor: result.nextCursor })} className="link font-semibold">More stories</Link></p>}
          <p className="text-xs text-faint">Headlines, short descriptions and links come from {result.provider === 'newsdata.io' ? 'NewsData.io and the original publishers' : 'INRGIFT demo data'}. INRGIFT does not republish articles: open the original to read it. Topics, entities and relevance are INRGIFT classifications, a ranking aid and not investment advice.</p>
        </div>
        <aside className="min-w-0 space-y-4 lg:col-start-2 xl:col-start-auto" aria-label="Market pulse">
          <PulsePanel pulse={pulse} />
        </aside>
      </div>
    </div>
  );
}

function Meta({ a }: { a: NewsArticle }) {
  const fresh = freshness(a.published_at);
  const region = a.derived.regions[0] ?? a.derived.markets[0]?.name;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
      <span className="font-medium text-slate2">{a.source_name ?? 'Unknown source'}</span>
      {a.published_at ? <time dateTime={a.published_at}>{dateTimeIST(a.published_at)}</time> : <span>Publish time not provided</span>}
      {fresh && <Badge tone={fresh === 'recent' ? 'brand' : 'neutral'}>{FRESH_LABEL[fresh]}</Badge>}
      {region && <span>{region}</span>}
      <Badge tone={a.derived.market_relevance === 'high' ? 'up' : 'neutral'}>INRGIFT relevance: {a.derived.market_relevance === 'high' ? 'High' : a.derived.market_relevance === 'medium' ? 'Medium' : 'Low'}</Badge>
    </p>
  );
}
function Topics({ a }: { a: NewsArticle }) {
  const topics = a.derived.topics.filter((t) => t !== 'markets' && t !== 'business').slice(0, 2);
  return topics.length ? <p className="flex flex-wrap gap-1.5">{topics.map((t) => <Badge key={t} tone="brand">{TOPIC_LABEL[t]}</Badge>)}</p> : null;
}
/** Entities INRGIFT matched conservatively (canonical companies and markets with a page), never guessed tickers. */
function Entities({ a }: { a: NewsArticle }) {
  const linked = a.derived.entities.filter((e) => e.href).slice(0, 4);
  return linked.length ? <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs"><span className="sr-only">Mentions: </span>{linked.map((e) => <Link key={`${e.kind}-${e.id}`} href={e.href!} className="link">{e.name}</Link>)}</p> : null;
}
function OpenAction({ a }: { a: NewsArticle }) {
  // The headline is the accessible link; this is the same destination as a visible affordance, kept out of the tab order.
  return <a href={a.url} {...linkProps(a.url)} tabIndex={-1} aria-hidden="true" className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-ink hover:underline">{external(a.url) ? `Read at ${a.source_name ?? 'the source'}` : 'Open'}{external(a.url) && <ExternalLink size={13} />}</a>;
}
function Headline({ a, className }: { a: NewsArticle; className?: string }) {
  return <h3 className={cn('font-bold leading-snug text-navy', className)}><a href={a.url} {...linkProps(a.url)} className="hover:text-brand-ink hover:underline">{a.title}{external(a.url) && <span className="sr-only"> (opens the original article in a new tab)</span>}</a></h3>;
}

function FeaturedStory({ a }: { a: NewsArticle }) {
  return (
    <article className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row">
        <div className="min-w-0 flex-1 space-y-2.5">
          <p className="flex flex-wrap items-center gap-2"><span className="text-micro font-semibold uppercase tracking-[.1em] text-brand-ink">Featured</span><Topics a={a} /></p>
          <Headline a={a} className="text-[20px] md:text-[22px]" />
          {a.description && <p className="line-clamp-3 text-[14px] text-slate2">{a.description}</p>}
          <Meta a={a} />
          <Entities a={a} />
          <OpenAction a={a} />
        </div>
        {a.image_url && <img src={a.image_url} alt="" loading="lazy" referrerPolicy="no-referrer" width={260} height={170} className="h-[170px] w-full shrink-0 rounded-lg border border-line object-cover md:w-[260px]" />}
      </div>
    </article>
  );
}
function StoryCard({ a }: { a: NewsArticle }) {
  return (
    <article className="flex h-full flex-col gap-2 rounded-card border border-line bg-white p-4 shadow-card">
      <Topics a={a} />
      <Headline a={a} className="text-[15px]" />
      {a.description && <p className="line-clamp-2 text-[13px] text-slate2">{a.description}</p>}
      <div className="mt-auto space-y-2 pt-1"><Meta a={a} /><Entities a={a} /><OpenAction a={a} /></div>
    </article>
  );
}

function PulsePanel({ pulse }: { pulse: MarketPulse }) {
  const open = pulse.markets.filter((m) => m.session === 'OPEN');
  const sources = [...new Set(pulse.assets.map((a) => a.meta.source))];
  const market = new Map(pulse.markets.map((m) => [m.id, m]));
  return (
    <Panel flush title="Market pulse" sub={pulse.markets.length ? `${open.length} of ${pulse.markets.length} markets open` : undefined} footer={pulse.assets.length ? <><ModuleFoot meta={pulse.meta} /><span>Source: {sources.join(', ')}</span></> : undefined}>
      {!pulse.assets.length ? <UnavailableState title="Market pulse unavailable">The current data source does not provide these benchmarks.</UnavailableState> : (
        <ul>{pulse.assets.map((a) => {
          const m = a.marketId ? market.get(a.marketId) : undefined;
          return (
            <li key={a.id} className="flex items-center gap-2 border-b border-line px-4 py-2 last:border-0">
              <span className="min-w-0 flex-1">
                <Link href={assetHref(a)} className="block truncate text-[13px] font-semibold text-navy hover:text-brand-ink">{a.name}</Link>
                <span className="flex items-center gap-1.5 text-[11px] text-faint"><StatusBadge status={a.status} />{m ? SESSION_LABEL[m.session] : null}</span>
              </span>
              <span className="text-right"><span className="num block text-[13px] font-semibold">{a.price == null ? '—' : num(a.price, a.cls === 'fx' && a.price < 10 ? 4 : priceDp(a.price))}</span><span className="block text-[12px]"><Change value={a.m.d1} /></span></span>
            </li>
          );
        })}</ul>
      )}
      {open.length > 0 && <p className="border-t border-line px-4 py-2 text-xs text-slate2">Open now: {open.slice(0, 6).map((m) => m.name).join(', ')}{open.length > 6 ? ` and ${open.length - 6} more` : ''}. <Link href="/markets" className="link">Market hours</Link></p>}
    </Panel>
  );
}

