import Link from 'next/link';
import { Badge, Callout, EmptyState, NoResults, Panel, UnavailableState } from '@/components/ui/primitives';
import { cn, dateTimeIST } from '@/lib/format';
import { CLASS_LABEL } from '@/lib/routes';
import type { Asset, Market, Region } from '@/lib/types';
import { SECTIONS } from '@/services/news/news-provider';
import { NEWS_TOPICS } from '@/services/news/news-query';
import { freshness } from '@/services/news/news-ranking';
import type { NewsArticle, NewsQuery, NewsResult, NewsSection, NewsTopic } from '@/services/news/news-types';

export const TOPIC_LABEL: Record<NewsTopic, string> = {
  markets: 'Markets', business: 'Business', equities: 'Equities', macro: 'Macro', fx: 'FX', commodities: 'Commodities', bonds: 'Bonds', etfs: 'ETFs', indices: 'Indices',
  earnings: 'Earnings', ipo: 'IPO', 'corporate-actions': 'Corporate actions', 'central-banks': 'Central banks', 'politics-markets': 'Politics & markets', geopolitics: 'Geopolitics', trade: 'Trade', regulation: 'Regulation',
};
const REGIONS: Region[] = ['North America', 'Europe', 'Asia-Pacific', 'Middle East', 'Latin America', 'Africa'];
const STATUS: Record<NewsResult['status'], [string, 'up' | 'neutral' | 'warn' | 'down' | 'brand']> = { FRESH: ['Fresh from provider', 'up'], CACHED: ['Cached', 'neutral'], STALE: ['Stale: last good result', 'warn'], DEMO: ['Demo headlines', 'warn'], UNAVAILABLE: ['Unavailable', 'down'] };
const FRESH_LABEL = { recent: 'Recent', today: 'Today', older: 'Older' } as const;

const href = (q: NewsQuery, patch: Partial<NewsQuery>) => {
  const p = new URLSearchParams();
  Object.entries({ ...q, cursor: undefined, ...patch }).forEach(([k, v]) => { if (v !== undefined && v !== '' && !(k === 'section' && v === 'most-relevant')) p.set(k, String(v)); });
  const s = p.toString();
  return `/resources/news${s ? `?${s}` : ''}`;
};

function Select({ name, label, value, options }: { name: string; label: string; value?: string | number; options: [string, string][] }) {
  return (
    <label className="block text-[13px]"><span className="mb-1 block font-medium text-slate2">{label}</span>
      <select name={name} defaultValue={value === undefined ? '' : String(value)} className="field h-10 w-full">{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    </label>
  );
}

/** /resources/news: INRGIFT-filtered market and business news with sections, filters and search (server rendered). */
export function NewsFeed({ query, result, markets, companies }: { query: NewsQuery; result: NewsResult; markets: Market[]; companies: Asset[] }) {
  const sections = Object.entries(SECTIONS) as [NewsSection, (typeof SECTIONS)[NewsSection]][];
  const [statusLabel, tone] = STATUS[result.status];
  return (
    <div className="space-y-4">
      <nav aria-label="News sections" className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {sections.map(([id, s]) => <Link key={id} href={href({ section: id }, {})} aria-current={query.section === id ? 'page' : undefined} className={cn('chip shrink-0', query.section === id && 'border-brand bg-brand-soft text-brand-ink')}>{s.label}</Link>)}
      </nav>
      <form method="get" action="/resources/news" role="search" aria-label="Search and filter news" className="rounded-card border border-line bg-white p-3 sm:p-4">
        <input type="hidden" name="section" value={query.section} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-[13px] sm:col-span-2"><span className="mb-1 block font-medium text-slate2">Search news</span>
            <input type="search" name="q" defaultValue={query.q ?? ''} maxLength={100} placeholder="Company, market, policy or event" className="field h-10 w-full" />
          </label>
          <Select name="topic" label="Topic" value={query.topic} options={[['', 'All topics'], ...NEWS_TOPICS.map((t) => [t, TOPIC_LABEL[t]] as [string, string])]} />
          <Select name="region" label="Region" value={query.region} options={[['', 'All regions'], ...REGIONS.map((r) => [r, r] as [string, string])]} />
          <Select name="market" label="Country / market" value={query.market} options={[['', 'All markets'], ...markets.map((m) => [m.slug, m.name] as [string, string])]} />
          <Select name="assetClass" label="Asset class" value={query.assetClass} options={[['', 'All asset classes'], ...(['stock', 'etf', 'index', 'fx', 'commodity', 'bond'] as const).map((c) => [c, CLASS_LABEL[c].many] as [string, string])]} />
          <Select name="company" label="Company" value={query.company} options={[['', 'All companies'], ...companies.map((a) => [a.slug, `${a.name} (${a.symbol})`] as [string, string])]} />
          <Select name="hours" label="Date" value={query.hours} options={[['', 'Last 48 hours'], ['6', 'Last 6 hours'], ['24', 'Last 24 hours'], ['48', 'Last 48 hours']]} />
          <label className="block text-[13px]"><span className="mb-1 block font-medium text-slate2">Source id</span>
            <input name="source" defaultValue={query.source ?? ''} maxLength={40} pattern="[a-z0-9_.\-]{2,40}" placeholder="e.g. cnbc" className="field h-10 w-full" />
          </label>
          <Select name="relevance" label="Relevance" value={query.relevance} options={[['', 'High and medium'], ['high', 'High only']]} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="submit" className="inline-flex h-10 items-center rounded-ctl bg-brand px-4 font-medium text-white hover:bg-brand-ink">Apply</button>
          <Link href="/resources/news" className="link text-[13px]">Clear filters</Link>
        </div>
      </form>
      <p className="flex flex-wrap items-center gap-2 text-xs text-slate2" aria-live="polite">
        <Badge tone={tone}>{statusLabel}</Badge>
        <span>Source: {result.provider === 'newsdata.io' ? 'NewsData.io' : 'INRGIFT demo headlines (no news key configured)'}</span>
        {result.retrievedAt && <span>· Retrieved {dateTimeIST(result.retrievedAt)}</span>}
        {result.excluded > 0 && <span>· {result.excluded} low-relevance {result.excluded === 1 ? 'story' : 'stories'} hidden</span>}
      </p>
      {result.notice && <Callout tone="warn" title={result.notice}>{result.status === 'STALE' ? 'Showing the last results INRGIFT retrieved.' : 'Try again in a few minutes.'}</Callout>}
      {result.status === 'UNAVAILABLE' ? <UnavailableState title="News is unavailable">The news provider did not answer. Market data, research and your workspace are not affected.</UnavailableState>
        : !result.articles.length ? (query.q ? <NoResults query={query.q}>No market-relevant stories match. Try a company or market name.</NoResults> : <EmptyState title="No stories for these filters">Widen the date range or clear a filter.</EmptyState>)
        : (
          <Panel title={`${result.articles.length} ${result.articles.length === 1 ? 'story' : 'stories'}`} sub={SECTIONS[query.section].label} flush>
            <ul>{result.articles.map((a) => <li key={a.article_id}><ArticleCard a={a} /></li>)}</ul>
          </Panel>
        )}
      {result.nextCursor && <p><Link href={href(query, { cursor: result.nextCursor })} className="link font-semibold">More stories</Link></p>}
      <p className="text-xs text-faint">Headlines, short descriptions and links come from {result.provider === 'newsdata.io' ? 'NewsData.io and the original publishers' : 'INRGIFT demo data'}. INRGIFT does not republish articles: open the original to read it. Topics, entities and relevance are INRGIFT classifications, a ranking aid and not investment advice.</p>
    </div>
  );
}

export function ArticleCard({ a }: { a: NewsArticle }) {
  const fresh = freshness(a.published_at);
  const external = /^https?:/.test(a.url);
  return (
    <article className="flex gap-3 border-b border-line px-4 py-3 last:border-0">
      {a.image_url && <img src={a.image_url} alt="" loading="lazy" referrerPolicy="no-referrer" width={96} height={64} className="hidden h-16 w-24 shrink-0 rounded-lg border border-line object-cover sm:block" />}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug"><a href={a.url} {...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})} className="hover:underline">{a.title}{external && <span className="sr-only"> (opens the original article in a new tab)</span>}</a></h3>
        {a.description && <p className="mt-0.5 line-clamp-2 text-ui text-slate2">{a.description}</p>}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
          <span className="font-medium text-slate2">{a.source_name ?? 'Unknown source'}</span>
          {a.published_at ? <time dateTime={a.published_at}>Published {dateTimeIST(a.published_at)}</time> : <span>Publish time not provided</span>}
          {fresh && <Badge tone={fresh === 'recent' ? 'brand' : 'neutral'}>{FRESH_LABEL[fresh]}</Badge>}
          <Badge tone={a.derived.market_relevance === 'high' ? 'up' : 'neutral'}>INRGIFT relevance: {a.derived.market_relevance === 'high' ? 'High' : a.derived.market_relevance === 'medium' ? 'Medium' : 'Low'}</Badge>
          {a.derived.topics.filter((t) => t !== 'markets' && t !== 'business').slice(0, 3).map((t) => <Badge key={t}>{TOPIC_LABEL[t]}</Badge>)}
        </p>
        {(a.derived.companies.length > 0 || a.derived.markets.length > 0) && (
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">{a.derived.entities.filter((e) => e.href).slice(0, 5).map((e) => <Link key={`${e.kind}-${e.id}`} href={e.href!} className="link">{e.name}</Link>)}</p>
        )}
      </div>
    </article>
  );
}
