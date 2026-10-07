import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { StatusBadge, STATUS_LABEL } from '@/components/ui/data-status';
import { Badge, EmptyState, PageContainer, PageHeader, Panel, Section } from '@/components/ui/primitives';
import { GlossaryList } from '@/features/site/glossary';
import { cn, dateShort } from '@/lib/format';
import { assetHref, marketHref } from '@/lib/routes';
import type { CalendarEvent, DataStatus } from '@/lib/types';
import { TutorialDisclosure, VideoModule } from '@/features/media/video-module';
import { learnHref } from '@/lib/routes';
import { definedTermSet, JsonLd } from '@/lib/structured-data';
import { getGlossary, getLearnArticles, getVideoFor, getVideos } from '@/services/content';
import * as md from '@/services/market-data';
import { NewsFeed } from '@/features/news/news-feed';
import { parseNewsQuery } from '@/services/news/news-query';
import { getNews } from '@/services/news/news-service';

const TITLES: Record<string, [string, string]> = {
  news: ['Global market news', 'Market-moving news, macro developments, company events and financial intelligence.'], earnings: ['Earnings calendar', 'Upcoming results with estimates where the source provides them.'], dividends: ['Dividend calendar', 'Ex-dates, pay dates and amounts.'], ipo: ['IPO calendar', 'Upcoming, priced and recently listed offerings.'],
  calendar: ['Market calendar', 'Holidays, earnings, dividends, listings and macro events on one timeline.'], learn: ['Learn', 'Short explanations of how markets, funds and valuation work.'], glossary: ['Glossary', 'Definitions, formulas and why each term matters.'], data: ['Data and methodology', 'Where INRGIFT data comes from and how to read it.'],
};
type Props = { params: Promise<{ kind: string }>; searchParams: Promise<Record<string, string | undefined>> };
/** Benchmarks in the news page's market pulse. Instruments the data source does not carry are left out. */
const PULSE = ['NIFTY-50', 'SENSEX', 'SP-500', 'NASDAQ-COMPOSITE', 'FTSE-100', 'NIKKEI-225', 'USD-INR', 'GOLD', 'BRENT', 'US-10Y'];
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> { const [{ kind }, sp] = await Promise.all([params, searchParams]); const t = TITLES[kind]; return t ? pageMetadata({ title: t[0], description: t[1], path: `/resources/${kind}`, index: Object.keys(sp).length ? 'faceted' : 'index' }) : notFound(); }

const Table = ({ head, children }: { head: string[]; children: ReactNode }) => <div className="overflow-x-auto"><table className="w-full border-collapse text-[13px]"><thead><tr>{head.map((h, i) => <th key={h} scope="col" className={cn('whitespace-nowrap border-b border-line px-4 py-2.5 text-xs font-semibold text-faint', i === 0 ? 'text-left' : 'text-right')}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
const cell = 'num whitespace-nowrap border-b border-line px-4 py-2 text-right';
const who = (e: CalendarEvent) => <td className="border-b border-line px-4 py-2">{e.assetSlug && e.assetCls ? <Link className="link font-semibold" href={assetHref({ cls: e.assetCls, slug: e.assetSlug })}>{e.title.replace(/ quarterly results| ex-dividend/, '')}</Link> : <span className="font-semibold">{e.title}</span>}</td>;
function group(events: CalendarEvent[]) { const today = new Date().toISOString().slice(0, 10); const add = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10); return ([['Today', (d: string) => d === today], ['Tomorrow', (d: string) => d === add(1)], ['This week', (d: string) => d > add(1) && d <= add(7)], ['Next week', (d: string) => d > add(7) && d <= add(14)], ['Later', (d: string) => d > add(14)]] as const).map(([label, test]) => [label, events.filter((e) => test(e.date))] as const).filter(([, l]) => l.length); }
const STATUS_HELP: [DataStatus, string, string][] = [['LIVE', 'Streaming or polled within seconds of the exchange.', 'Updated hh:mm IST'], ['DELAYED', 'Exchange-mandated delay, usually 15 minutes.', 'As of hh:mm IST'], ['END_OF_DAY', 'The session has ended; values are the official close.', 'Close, date and time in IST'], ['CLOSED', 'No session today, for example a market holiday.', 'Date of the last close'], ['UNAVAILABLE', 'The source has no value. The last available figure is shown, clearly labelled.', 'Last available timestamp'], ['STALE', 'A newer value is overdue, or the value came from the last-known-good cache after a provider failure.', 'Last updated timestamp'], ['ERROR', 'The request failed. Other modules on the page are unaffected.', 'A message and a retry'], ['DEMO', 'Values come from the demo provider: simulated for development and previews, never market prices. Shown instead of Live, Delayed or End of day while the demo provider is active.', 'Demo data, with the time the demo values were produced']];

export default async function ResourcePage({ params, searchParams }: Props) {
  const { kind } = await params;
  if (!TITLES[kind]) notFound();
  const [title, lead] = TITLES[kind];
  let body: ReactNode;
  if (kind === 'news') {
    const query = parseNewsQuery(await searchParams);
    const [result, markets, pulseAssets] = await Promise.all([getNews(query), md.getMarkets(), Promise.all(PULSE.map((slug) => md.getAsset(undefined, slug)))]);
    const assets = pulseAssets.filter((a): a is NonNullable<typeof a> => Boolean(a));
    // The news page carries its own header (GLOBAL MARKET NEWS) and three-area layout.
    return <PageContainer wide><NewsFeed query={query} result={result} markets={markets} pulse={{ assets, markets, meta: md.freshest(assets) }} /></PageContainer>;
  } else if (kind === 'earnings' || kind === 'dividends' || kind === 'ipo') {
    const events = await md.getCalendar(kind === 'earnings' ? 'earnings' : kind === 'dividends' ? 'dividend' : 'ipo');
    const markets = new Map((await md.getMarkets()).map((m) => [m.id, m]));
    const mk = (e: CalendarEvent) => { const m = e.marketId ? markets.get(e.marketId) : null; return <td className={cell}>{m ? <Link className="link" href={marketHref(m.slug)}>{m.name}</Link> : '—'}</td>; };
    body = kind === 'ipo' ? (['Upcoming', 'Priced', 'Listed'].map((stage) => { const l = events.filter((e) => e.extra?.stage === stage); return <Panel key={stage} title={stage} sub="Demo listings" flush>{l.length ? <Table head={['Company', 'Date', 'Market', 'Exchange', 'Sector']}>{l.map((e) => <tr key={e.id}>{who(e)}<td className={cell}>{dateShort(e.date)}</td>{mk(e)}<td className={cell}>{e.extra?.exchange}</td><td className={cell}>{e.extra?.sector}</td></tr>)}</Table> : <EmptyState title={`Nothing ${stage.toLowerCase()} right now`} />}</Panel>; }))
      : group(events).map(([label, l]) => <Panel key={label} title={label} sub={`${l.length} ${kind === 'earnings' ? 'reports' : 'ex-dates'}`} flush>{kind === 'earnings'
        ? <Table head={['Company', 'Date', 'Time', 'Market', 'EPS estimate', 'Previous EPS', 'Revenue estimate']}>{l.map((e) => <tr key={e.id}>{who(e)}<td className={cell}>{dateShort(e.date)}</td><td className={cell}>{e.detail}</td>{mk(e)}<td className={cell}>{e.extra?.epsEstimate} {e.extra?.currency}</td><td className={cell}>{e.extra?.previousEps}</td><td className={cell}>{e.extra?.revenueEstimate}</td></tr>)}</Table>
        : <Table head={['Company', 'Ex-date', 'Record date', 'Pay date', 'Amount', 'Yield', 'Frequency']}>{l.map((e) => <tr key={e.id}>{who(e)}<td className={cell}>{dateShort(e.date)}</td><td className={cell}>{dateShort(e.extra!.recordDate)}</td><td className={cell}>{dateShort(e.extra!.payDate)}</td><td className={cell}>{e.extra?.amount} {e.extra?.currency}</td><td className={cell}>{e.extra?.yield}</td><td className={cell}>{e.extra?.frequency}</td></tr>)}</Table>}</Panel>);
  } else if (kind === 'calendar') {
    const events = await md.getCalendar();
    const tone = { earnings: 'brand', dividend: 'up', ipo: 'warn', holiday: 'neutral', macro: 'down' } as const;
    body = group(events.filter((e) => e.date >= new Date().toISOString().slice(0, 10))).map(([label, l]) => <Panel key={label} title={label} sub={`${l.length} events`} flush>{l.map((e) => <div key={e.id} className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-0"><span className="num w-[86px] shrink-0 text-xs font-semibold text-slate2">{dateShort(e.date)}</span><Badge tone={tone[e.kind]} className="w-[68px] justify-center">{e.kind}</Badge><span className="min-w-0 flex-1"><Link className="font-medium hover:text-brand-ink" href={e.href ?? '/resources/calendar'}>{e.title}</Link><span className="block truncate text-xs text-faint">{e.detail}{e.marketName && ` · ${e.marketName}`} · {e.time ?? 'All day'} {e.timezone} · Source: {e.source}</span></span></div>)}</Panel>);
  } else if (kind === 'learn') {
    const [learn, videos] = await Promise.all([getLearnArticles(), getVideos()]);
    const sections = [...new Set(learn.map((l) => l.section))];
    body = (<>
      <Section title="Tutorials"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{videos.map((v) => <VideoModule key={v.id} video={v} compact />)}</div></Section>
      {sections.map((s) => <section key={s}><h2 className="mb-3 text-lg font-bold">{s}</h2><div className="grid gap-3 md:grid-cols-2">{learn.filter((l) => l.section === s).map((l) => <Link key={l.slug} href={learnHref(l.slug)} className="card-link p-4"><h3 className="text-base font-bold">{l.title}</h3><p className="mt-1 text-[13px] text-slate2">{l.summary}</p><p className="mt-2 text-xs font-semibold text-brand-ink">Read the explainer</p></Link>)}</div></section>)}
    </>);
  } else if (kind === 'glossary') {
    const terms = await getGlossary();
    body = <><JsonLd data={definedTermSet(terms)} /><GlossaryList terms={terms} /></>;
  } else {
    const [markets, video, learnAll] = await Promise.all([md.getMarkets(), getVideoFor('page:data'), getLearnArticles()]);
    const methods = learnAll.filter((l) => l.type === 'methodology');
    body = (<>
      {video && <TutorialDisclosure video={video} label="Watch: how to read data status" />}
      <Panel title="Methodology library" sub={`${methods.length} documents`} flush><ul className="grid md:grid-cols-2">{methods.map((l) => <li key={l.slug}><Link href={learnHref(l.slug)} className="row-link py-2.5"><span className="block font-semibold">{l.title}</span><span className="line-clamp-1 text-xs text-slate2">{l.summary}</span></Link></li>)}</ul></Panel>
      <Panel title="Data status" flush footer="Every market-data module carries one of these, with an exact timestamp. Hover or focus a status to see its source."><Table head={['Status', 'Meaning', 'What you see']}>{STATUS_HELP.map(([s, m, w]) => <tr key={s}><td className="border-b border-line px-4 py-2.5"><StatusBadge status={s} /><span className="sr-only">{STATUS_LABEL[s]}</span></td><td className="border-b border-line px-4 py-2.5 text-right text-slate2 sm:text-left">{m}</td><td className="border-b border-line px-4 py-2.5 text-right text-slate2">{w}</td></tr>)}</Table></Panel>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <article className="prose-doc rounded-card border border-line bg-white px-5 py-4">
          <h2 className="!mt-0" id="data-source">Current data source</h2><p>This environment runs on <b>{markets[0].meta.source}</b>. Demo values are realistic in shape and scale and do not reflect current market prices. A “Demo data” label appears in the header while the demo provider is active.</p>
          <h2>Architecture</h2><p>The interface reads normalized assets and markets from the INRGIFT API. Behind the API, a data service calls a provider through one interface, with a fallback chain of primary, secondary and last-known-good. No screen depends on a vendor’s field names.</p>
          <h2>Identity</h2><p>Every instrument has an immutable internal identifier. Tickers belong to listings, so a company listed on two exchanges, or as a depositary receipt, is linked through one issuer.</p>
          <h2>Quality checks</h2><p>Price series are checked for consistent open, high, low and close values, non-negative volume, valid and ordered timestamps, duplicates and unadjusted jumps. Rows that fail are quarantined and never shown.</p>
        </article>
        <article className="prose-doc rounded-card border border-line bg-white px-5 py-4">
          <h2 className="!mt-0">Unavailable and not applicable</h2><p>A dash means the source has no value for a metric. “n/a” means the metric does not apply to that asset class. INRGIFT does not substitute zeros.</p>
          <h2>Market hours</h2><p>Session status comes from each exchange’s own calendar: time zone, regular hours, breaks, holidays and early closes. Hours are converted to IST for display.</p>
          <h2>India context</h2><p>INR values use a reference rate per currency and are approximate. Market cap can be shown in lakh crore.</p>
          <h2>Research</h2><p>Research notes describe data. They contain no ratings and no price targets, and are not investment advice.</p>
        </article>
      </div>
      <Panel title="Coverage" sub={`${markets.length} markets`} flush><Table head={['Market', 'Exchanges (MIC)', 'Time zone', 'Entitlement', 'Status now']}>{markets.map((m) => <tr key={m.id}><td className="border-b border-line px-4 py-2"><Link className="link font-semibold" href={marketHref(m.slug)}>{m.name}</Link></td><td className={cell}>{m.exchanges.map((e) => e.mic).join(' · ')}</td><td className={cell}>{m.exchanges[0].timezone}</td><td className={cell}>{m.feed === 'LIVE' ? 'Real time' : '15 min delayed'}</td><td className={cell}><StatusBadge status={m.dataStatus} /></td></tr>)}</Table></Panel>
    </>);
  }
  return (<PageContainer><PageHeader crumbs={[['Resources', '/resources'], [title]]} title={title} lead={lead} />{body}</PageContainer>);
}
