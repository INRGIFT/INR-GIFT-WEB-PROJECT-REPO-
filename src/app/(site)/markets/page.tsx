import type { Metadata } from 'next';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/data-status';
import { Badge, Metric, MetricGrid, PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { AssetTable } from '@/features/assets/asset-table';
import { Heatmap } from '@/features/heatmap/heatmap';
import { ModuleFoot, Movers, SectorPanel, SessionRail, freshest } from '@/features/markets/widgets';
import { SESSION_LABEL } from '@/lib/calendar';
import { cn, dateShort, timeIST } from '@/lib/format';
import { marketHref } from '@/lib/routes';
import * as md from '@/services/market-data';

export const metadata: Metadata = { title: 'Global markets', description: 'Sessions, indices, sectors, movers and currencies across every covered market, shown in IST.', alternates: { canonical: '/markets' } };

export default async function MarketsPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const { region } = await searchParams;
  const [allMarkets, all, calendar] = await Promise.all([md.getMarkets(), md.getAssets(), md.getCalendar(['macro', 'holiday'])]);
  const regions = [...new Set(allMarkets.map((m) => m.region))];
  const active = regions.find((r) => r === region);
  const markets = active ? allMarkets.filter((m) => m.region === active) : allMarkets;
  const ids = new Set(markets.map((m) => m.id));
  const scoped = all.filter((a) => ids.has(a.marketId));
  const stocks = scoped.filter((a) => a.cls === 'stock');
  const indices = scoped.filter((a) => a.cls === 'index');
  const b = md.breadth(scoped);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const chip = (label: string, href: string, on: boolean) => <Link key={label} href={href} scroll={false} className={cn('rounded-lg px-2.5 py-1 text-[13px] font-medium transition-colors', on ? 'bg-white text-navy shadow-card' : 'text-slate2 hover:text-navy')}>{label}</Link>;
  return (
    <PageContainer wide>
      <PageHeader title="Global markets" lead={`${allMarkets.filter((m) => m.session === 'OPEN').length} of ${allMarkets.length} markets are open at ${timeIST(now.toISOString())}.`} actions={<ButtonLink href="/markets/all">Markets directory</ButtonLink>} />
      <nav aria-label="Region" className="inline-flex flex-wrap gap-0.5 rounded-ctl bg-hover p-[3px]">{chip('All regions', '/markets', !active)}{regions.map((r) => chip(r, `/markets?region=${encodeURIComponent(r)}`, r === active))}</nav>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Market sessions" sub="Regular hours in IST"><SessionRail markets={markets} now={now} /></Panel>
        <div className="space-y-4">
          <Panel title="Market breadth" sub="Covered stocks, 1D" footer={<ModuleFoot meta={freshest(stocks)} />}><MetricGrid className="!grid-cols-3"><Metric label="Advancing" value={<span className="text-up">▲ {b.advancing}</span>} /><Metric label="Declining" value={<span className="text-down">▼ {b.declining}</span>} /><Metric label="Unchanged" value={b.unchanged} /></MetricGrid></Panel>
          <Panel title="Key events" flush footer={<Link href="/resources/calendar" className="link ml-auto">Full calendar</Link>}>{calendar.filter((e) => e.date >= today && (!e.marketId || ids.has(e.marketId))).slice(0, 5).map((e) => <div key={e.id} className="flex gap-3 border-b border-line px-4 py-2.5 last:border-0"><span className="num w-[52px] shrink-0 text-xs font-semibold text-slate2">{dateShort(e.date).slice(0, 6)}</span><span className="min-w-0"><span className="block truncate font-medium">{e.title}</span><span className="text-xs text-faint"><Badge>{e.kind}</Badge> {e.detail}</span></span></div>)}</Panel>
        </div>
      </div>
      <Panel title="Indices" flush footer={<ModuleFoot meta={freshest(indices)} more={['All indices', '/assets/indices']} />}><AssetTable rows={indices} columns={['d1', 'w1', 'm1', 'ytd', 'y1']} initialSort={null} actions={false} pageSize={30} /></Panel>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Heatmap" sub="By country" footer={<ModuleFoot meta={freshest(stocks)} more={['Open full heatmap', '/discover/heatmap?group=country']} />}><Heatmap compact assets={stocks} initial={{ group: 'country' }} /></Panel>
        <SectorPanel list={stocks} />
      </div>
      <Movers list={scoped.filter((a) => md.EQUITY_LIKE.includes(a.cls))} />
      <Panel title="Currencies" sub="INR pairs and majors" flush footer={<ModuleFoot meta={freshest(all.filter((a) => a.cls === 'fx'))} more={['All FX', '/assets/fx']} />}><AssetTable rows={all.filter((a) => a.cls === 'fx')} columns={['d1', 'w1', 'm1', 'y1']} initialSort={null} actions={false} /></Panel>
      <Panel title="Markets" sub={`${markets.length} covered`} flush>
        <div className="overflow-x-auto"><table className="w-full border-collapse text-[13px]"><thead><tr>{['Market', 'Exchanges', 'Currency', 'Local time', 'Session', 'Data'].map((h, i) => <th key={h} scope="col" className={cn('border-b border-line px-4 py-2.5 text-xs font-semibold text-faint', i < 2 ? 'text-left' : 'text-right')}>{h}</th>)}</tr></thead><tbody>
          {markets.map((m) => <tr key={m.id} className="border-b border-line last:border-0 hover:bg-bg"><td className="px-4 py-2"><Link href={marketHref(m.slug)} className="link font-semibold">{m.name}</Link></td><td className="px-4 py-2 text-slate2">{m.exchanges.map((e) => e.name).join(' · ')}</td><td className="px-4 py-2 text-right">{m.currency}</td><td className="num px-4 py-2 text-right">{m.localTime}</td><td className="px-4 py-2 text-right">{SESSION_LABEL[m.session]}</td><td className="px-4 py-2 text-right"><StatusBadge status={m.dataStatus} /></td></tr>)}
        </tbody></table></div>
      </Panel>
    </PageContainer>
  );
}
