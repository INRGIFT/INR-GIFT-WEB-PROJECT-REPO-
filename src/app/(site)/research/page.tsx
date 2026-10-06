import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { ResearchList } from '@/features/site/research-list';
import { dateShort } from '@/lib/format';
import * as md from '@/services/market-data';

export const metadata: Metadata = { title: 'Research', description: 'Structured research on stocks, ETFs, markets and themes. Data and context, not recommendations.', alternates: { canonical: '/research' } };
const KINDS = [['stocks', 'Stock research', 'What changed, why it matters, what to monitor'], ['etfs', 'ETF research', 'Cost, liquidity, holdings and risk in eight steps'], ['markets', 'Market research', 'Trend, leadership and the currency angle'], ['themes', 'Themes', 'Who is in a theme and how it has moved']] as const;
export default async function ResearchHub() {
  const [docs, news] = await Promise.all([md.getResearch(), md.getNews({ limit: 5 })]);
  return (
    <PageContainer>
      <PageHeader title="Research" lead="Structured notes that describe data and context. INRGIFT publishes no buy or sell ratings and no price targets." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{KINDS.map(([k, t, d]) => <Link key={k} href={`/research/${k}`} className="rounded-card border border-line bg-white p-4 transition-[border-color,box-shadow] duration-150 hover:border-brand hover:shadow-card"><h2 className="text-base font-bold">{t}</h2><p className="mt-0.5 text-[13px] text-slate2">{d}</p><p className="mt-2.5 text-xs text-faint">{docs.filter((x) => x.kind === k).length} notes</p></Link>)}</div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Latest" flush><ResearchList docs={docs.slice(0, 10)} /></Panel>
        <div className="space-y-4">
          <Panel title="Market news" flush footer={<Link href="/resources/news" className="link ml-auto">All news</Link>}>{news.map((n) => <Link key={n.id} href={n.url} className="block border-b border-line px-4 py-2.5 last:border-0 hover:bg-bg"><span className="block font-semibold">{n.headline}</span><span className="mt-1 flex gap-1.5 text-xs text-faint"><Badge>{n.category}</Badge>{dateShort(n.publishedAt)}</span></Link>)}</Panel>
          <Panel title="How we write research"><p className="text-slate2">Each note names its asset, market, topic and date, and separates measured data from commentary. Methods are on the <Link className="link" href="/resources/data">data and methodology</Link> page.</p></Panel>
        </div>
      </div>
    </PageContainer>
  );
}
