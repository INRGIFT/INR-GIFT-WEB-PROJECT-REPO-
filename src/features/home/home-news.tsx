import { ExternalLink, Newspaper } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { TOPIC_LABEL } from '@/features/news/news-feed';
import { dateTimeIST } from '@/lib/format';
import { loginHref } from '@/lib/return-url';
import { newsSource, SECTIONS } from '@/services/news/news-provider';
import { getNews } from '@/services/news/news-service';
import type { NewsArticle, NewsResult, NewsSection } from '@/services/news/news-types';
import { SessionCta } from './session-cta';

/** The categories the news service can filter honestly (the same sections as the News page). */
export const HOME_NEWS_SECTIONS: NewsSection[] = ['most-relevant', 'global-markets', 'stocks', 'macro', 'central-banks', 'fx', 'commodities', 'bonds', 'etfs', 'indices', 'earnings', 'ipo', 'mergers', 'geopolitics', 'regulation', 'trade'];
const LIMIT_MS = 6000;

/** Category, regions and the companies or markets INRGIFT matched with confidence (never guessed tickers). */
function Meta({ a }: { a: NewsArticle }) {
  const entities = [...a.derived.companies.map((c) => c.name), ...a.derived.markets.map((m) => m.name)].slice(0, 2);
  const parts = [a.source_name ?? 'Source not given', a.published_at ? dateTimeIST(a.published_at) : 'Time not given', a.derived.primary_topic ? TOPIC_LABEL[a.derived.primary_topic] : null, a.derived.regions.slice(0, 2).join(', ') || null, entities.join(', ') || null].filter(Boolean);
  return <p className="mt-2 flex flex-wrap gap-x-2 text-[12.5px] text-faint">{parts.map((p, i) => <span key={i} className={i === 0 ? 'font-semibold text-slate2' : ''}>{i > 0 && <span aria-hidden className="mr-2">·</span>}{p}</span>)}</p>;
}
function Headline({ a, featured }: { a: NewsArticle; featured?: boolean }) {
  return (
    <a href={a.url} target="_blank" rel="noopener noreferrer nofollow" className="group block">
      <span className={featured ? 'font-display text-[24px] font-bold leading-snug text-navy group-hover:text-brand-ink md:text-[28px]' : 'font-display text-[16px] font-bold leading-snug text-navy group-hover:text-brand-ink'}>{a.title}</span>
      <ExternalLink size={13} aria-hidden className="ml-1.5 inline-block align-baseline text-faint" /><span className="sr-only"> (opens the publisher's site)</span>
    </a>
  );
}

async function load(): Promise<NewsResult | 'demo' | null> {
  // Demo fixtures are never shown on the public page: they are not real news.
  if (newsSource().name === 'demo') return 'demo';
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([getNews({ section: 'most-relevant' }), new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), LIMIT_MS); })]); }
  catch { return null; }
  finally { clearTimeout(timer); }
}

/**
 * "Know what moved the market": headlines from NewsData.io through INRGIFT's news service (relevance filter, entity
 * matching, cache), streamed in its own Suspense boundary so a slow provider never holds up the page. Headline, source,
 * time, category, region and confidently matched entities only; each links to its publisher. Nothing is invented: a
 * failure, a timeout or demo fixtures show an honest state instead.
 */
export async function HomeNews() {
  const result = await load();
  const articles = result && result !== 'demo' ? result.articles.slice(0, 7) : [];
  const [lead, ...rest] = articles;
  return (
    <div>
      {result === 'demo' ? (
        <State>Headlines from NewsData.io appear here when the news service is connected. This build has no news key, and demo headlines are never shown publicly.</State>
      ) : !result || result.status === 'UNAVAILABLE' ? (
        <State>Headlines are unavailable right now{result?.notice ? `: ${result.notice.replace(/\.$/, '')}` : ''}. Nothing is shown in their place.</State>
      ) : !lead ? (
        <State>No market-relevant headlines from the last 48 hours right now.</State>
      ) : (
        <div className="grid gap-px overflow-hidden rounded-card border border-line bg-line lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <article className="bg-white px-6 py-7 md:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-brand-ink">Top story</p>
            <div className="mt-3"><Headline a={lead} featured /></div>
            <Meta a={lead} />
          </article>
          <ol className="divide-y divide-line bg-white">
            {rest.map((a) => <li key={a.article_id} className="px-6 py-4 md:px-8"><Headline a={a} /><Meta a={a} /></li>)}
          </ol>
        </div>
      )}
      {result && result !== 'demo' && result.retrievedAt && (
        <p className="mt-3 text-xs text-faint">
          {result.status === 'STALE' ? `${result.notice ?? 'The news provider did not respond.'} Showing headlines retrieved ${dateTimeIST(result.retrievedAt)}.` : `Retrieved ${dateTimeIST(result.retrievedAt)} from NewsData.io.`} INRGIFT ranks and links headlines; it does not write or edit them.
        </p>
      )}
    </div>
  );
}
function State({ children }: { children: ReactNode }) {
  return <p role="status" className="flex items-start gap-3 rounded-card border border-line bg-white px-6 py-6 text-[14px] text-slate2"><Newspaper size={18} aria-hidden className="mt-0.5 shrink-0 text-faint" />{children}</p>;
}
export function HomeNewsSkeleton() {
  return <div role="status" aria-label="Loading headlines" className="grid gap-3 rounded-card border border-line bg-white px-6 py-7">{[0, 1, 2, 3].map((i) => <div key={i} aria-hidden className="skeleton h-5" style={{ width: `${90 - i * 12}%` }} />)}</div>;
}
/** The news categories as entry points into the (protected) News page. */
export function NewsCategories() {
  return (
    <nav aria-label="News categories" className="mt-8">
      <ul className="flex flex-wrap gap-2">
        {HOME_NEWS_SECTIONS.map((id) => <li key={id}><Link href={`/resources/news?section=${id}`} className="inline-flex h-8 items-center rounded-full border border-line2 bg-white px-3.5 text-[13px] font-medium text-slate2 transition-colors duration-micro hover:border-brand hover:text-brand-ink">{SECTIONS[id].label}</Link></li>)}
      </ul>
    </nav>
  );
}
export function NewsCta() {
  return <SessionCta out={['Sign In for Market News', loginHref('/resources/news')]} inside={['Open News', '/resources/news']} arrow />;
}
