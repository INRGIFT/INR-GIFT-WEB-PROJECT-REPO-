import { BookOpen, CalendarDays, Coins, Database, Library, Newspaper, Rocket, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Badge, PageContainer, PageHeader, Panel, Section } from '@/components/ui/primitives';
import { VideoModule } from '@/features/media/video-module';
import { dateShort } from '@/lib/format';
import { glossaryHref, learnHref } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbs, JsonLd } from '@/lib/structured-data';
import { getGlossary, getLearnArticles, getVideos } from '@/services/content';
import * as md from '@/services/market-data';

export const metadata = pageMetadata({ title: 'Resources: news, calendars and learning', description: 'Market news, earnings, dividends and IPO calendars, plain-language explainers, a glossary and the INRGIFT data methodology.', path: '/resources' });
export default async function ResourcesHub() {
  const [news, calendar, learn, terms, videos] = await Promise.all([md.getNews({ limit: 5 }), md.getCalendar(), getLearnArticles(), getGlossary(), getVideos()]);
  const today = new Date().toISOString().slice(0, 10);
  const count = (k: string) => calendar.filter((e) => e.kind === k && e.date >= today).length;
  const CARDS = [['News', '/news', Newspaper, `${news.length ? 'Latest headlines' : 'Headlines'} by asset and market`], ['Earnings', '/resources/earnings', TrendingUp, `${count('earnings')} results dates ahead`], ['Dividends', '/resources/dividends', Coins, `${count('dividend')} ex-dates ahead`], ['IPOs', '/resources/ipo', Rocket, 'Upcoming, priced and listed'], ['Calendar', '/resources/calendar', CalendarDays, 'Holidays, macro and corporate events'], ['Learn', '/resources/learn', BookOpen, `${learn.length} explainers and ${videos.length} tutorials`], ['Glossary', '/resources/glossary', Library, `${terms.length} terms with formulas`], ['Data and methodology', '/resources/data', Database, 'Sources, statuses and quality checks']] as const;
  return (
    <PageContainer>
      <JsonLd data={breadcrumbs([['Resources']])} />
      <PageHeader title="Resources" lead="What is happening, what is coming up, and how to read it." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{CARDS.map(([t, h, Icon, d]) => <Link key={h} href={h} className="card-link p-4"><Icon size={20} strokeWidth={1.75} className="text-brand" aria-hidden /><h2 className="mt-2 text-base font-bold">{t}</h2><p className="mt-0.5 text-[13px] text-slate2">{d}</p></Link>)}</div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title="Latest news" flush footer={<Link href="/news" className="link ml-auto">All news</Link>}><ul>{news.map((n) => <li key={n.id}><Link href={n.url} className="row-link"><span className="block font-semibold">{n.headline}</span><span className="mt-1 flex flex-wrap gap-1.5 text-xs text-faint">{n.assetSymbol && <Badge tone="brand">{n.assetSymbol}</Badge>}<Badge>{n.category}</Badge>{dateShort(n.publishedAt)}</span></Link></li>)}</ul></Panel>
        <Panel title="Coming up" flush footer={<Link href="/resources/calendar" className="link ml-auto">Full calendar</Link>}><ul>{calendar.filter((e) => e.date >= today).slice(0, 6).map((e) => <li key={e.id} className="flex gap-3 border-b border-line px-4 py-2.5 last:border-0"><span className="num w-[52px] shrink-0 text-xs font-semibold text-slate2">{dateShort(e.date).slice(0, 6)}</span><span className="min-w-0"><span className="block truncate font-medium">{e.title}</span><span className="text-xs text-faint"><Badge>{e.kind}</Badge> {e.detail}</span></span></li>)}</ul></Panel>
      </div>
      <Section title="Tutorials" link={['All learning', '/resources/learn']}><div className="grid gap-4 md:grid-cols-3">{videos.map((v) => <VideoModule key={v.id} video={v} compact />)}</div></Section>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title="Learn" flush footer={<Link href="/resources/learn" className="link ml-auto">All explainers</Link>}><ul>{learn.slice(0, 5).map((a) => <li key={a.slug}><Link href={learnHref(a.slug)} className="row-link"><span className="block font-semibold">{a.title}</span><span className="text-[13px] text-slate2">{a.summary}</span></Link></li>)}</ul></Panel>
        <Panel title="Glossary" footer={<Link href="/resources/glossary" className="link ml-auto">All terms</Link>}><div className="flex flex-wrap gap-2">{terms.map((t) => <Link key={t.slug} href={glossaryHref(t.slug)} className="chip">{t.term}</Link>)}</div></Panel>
      </div>
    </PageContainer>
  );
}
