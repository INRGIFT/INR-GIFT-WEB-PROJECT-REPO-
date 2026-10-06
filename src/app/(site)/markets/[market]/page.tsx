import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/button';
import { DataStatus, statusLine } from '@/components/ui/data-status';
import { Badge, EmptyState, PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { AssetTable } from '@/features/assets/asset-table';
import { Heatmap } from '@/features/heatmap/heatmap';
import { IndexStrip, ModuleFoot, Movers, SectorPanel, SessionRail } from '@/features/markets/widgets';
import { SESSION_LABEL } from '@/lib/calendar';
import { dateShort, hhmm, num } from '@/lib/format';
import { marketHref } from '@/lib/routes';
import * as md from '@/services/market-data';

type Props = { params: Promise<{ market: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await md.getMarket((await params).market);
  return m ? { title: `${m.name} market`, description: `Indices, sectors, movers and trading hours in IST for ${m.name}.`, alternates: { canonical: marketHref(m.slug) } } : { title: 'Market not found' };
}
export default async function MarketPage({ params }: Props) {
  const m = await md.getMarket((await params).market);
  if (!m) notFound();
  const [all, markets, news, calendar, rates] = await Promise.all([md.getAssets({ marketId: m.id }), md.getMarkets(), md.getNews({ marketId: m.id, limit: 5 }), md.getCalendar(), md.fxRates()]);
  const stocks = all.filter((a) => a.cls === 'stock');
  const listed = all.filter((a) => md.EQUITY_LIKE.includes(a.cls));
  const india = markets.find((x) => x.id === 'in')!;
  const today = new Date().toISOString().slice(0, 10);
  const events = calendar.filter((e) => e.marketId === m.id && e.date >= today).slice(0, 6);
  const foot = <ModuleFoot meta={m.meta} />;
  return (
    <PageContainer>
      <PageHeader crumbs={[['Markets', '/markets'], [m.region, `/markets?region=${encodeURIComponent(m.region)}`], [m.name]]} title={m.name}
        lead={<>{m.exchanges.map((e) => e.name).join(' · ')} · {m.currency} · {SESSION_LABEL[m.session]}{m.holidayName && ` (${m.holidayName})`} · {m.localTime} local</>}
        actions={<><ButtonLink href={`/discover/heatmap?group=country&path=${encodeURIComponent(m.name)}`}>Heatmap</ButtonLink><ButtonLink href={`/discover/screener?country=${encodeURIComponent(m.name)}`} variant="primary">Screen this market</ButtonLink></>} />
      <DataStatus meta={m.meta} />
      {m.dataStatus === 'UNAVAILABLE' && <div className="rounded-card border border-line2 bg-soft px-4 py-3"><b>Data unavailable from source.</b> <span className="text-slate2">Values below are the last available figures. {statusLine(m.meta)}.</span></div>}
      {m.dataStatus === 'STALE' && <div className="rounded-card border border-warn/30 bg-warn/5 px-4 py-3"><b>Quotes for this market are stale.</b> <span className="text-slate2">{statusLine(m.meta)}.</span></div>}
      {m.session === 'HOLIDAY' && <div className="rounded-card border border-line2 bg-soft px-4 py-3"><b>Market holiday: {m.holidayName}.</b> <span className="text-slate2">Exchanges are closed today.</span></div>}
      <IndexStrip indices={all.filter((a) => a.cls === 'index')} markets={[m]} />
      <Panel title="Trading hours" footer={foot}>
        <SessionRail markets={m.id === 'in' ? [m] : [m, india]} now={new Date()} />
        <p className="mt-3 text-slate2">Regular session {hhmm(m.istOpen)} to {hhmm(m.istClose)} IST{m.exchanges[0].breakStart && `, with a midday break from ${m.exchanges[0].breakStart} to ${m.exchanges[0].breakEnd} local time`}.{m.currency !== 'INR' && ` Reference rate: 1 ${m.currency} ≈ ₹${num(rates[m.currency], rates[m.currency] < 1 ? 3 : 2)}.`}</p>
      </Panel>
      {stocks.length > 1 && <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><Panel title="Market heatmap" sub="By sector" footer={foot}><Heatmap compact assets={listed} initial={{ group: 'sector' }} /></Panel><SectorPanel list={stocks} title="Sectors" /></div>}
      {stocks.length > 2 && <Movers list={listed} />}
      <Panel title="Stocks, ETFs and REITs" sub={`${listed.length} covered`} flush footer={foot}><AssetTable rows={listed} columns={['d1', 'w1', 'y1', 'marketCap', 'pe', 'dividendYield']} empty={<EmptyState title="No instruments covered yet">Coverage for this market is being added. Headline indices are available above.</EmptyState>} /></Panel>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title="News" flush>{news.length ? news.map((n) => <Link key={n.id} href={n.url} className="block border-b border-line px-4 py-2.5 last:border-0 hover:bg-bg"><span className="block font-semibold">{n.headline}</span><span className="mt-1 flex gap-1.5 text-xs text-faint"><Badge>{n.category}</Badge>{dateShort(n.publishedAt)}</span></Link>) : <EmptyState title="No recent news for this market" />}</Panel>
        <Panel title="Calendar" flush footer={<Link href="/resources/calendar" className="link ml-auto">Full calendar</Link>}>{events.length ? events.map((e) => <div key={e.id} className="flex gap-3 border-b border-line px-4 py-2.5 last:border-0"><span className="num w-[52px] shrink-0 text-xs font-semibold text-slate2">{dateShort(e.date).slice(0, 6)}</span><span className="min-w-0"><span className="block truncate font-medium">{e.title}</span><span className="text-xs text-faint"><Badge>{e.kind}</Badge> {e.detail}</span></span></div>) : <EmptyState title="Nothing scheduled in the next 60 days" />}</Panel>
      </div>
      <section><h2 className="mb-3 text-lg font-bold">Related markets</h2><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{markets.filter((x) => x.region === m.region && x.id !== m.id).slice(0, 4).map((x) => <Link key={x.id} href={marketHref(x.slug)} className="rounded-card border border-line bg-white p-3.5 transition-colors hover:border-brand"><span className="font-display font-bold">{x.name}</span><span className="block text-xs text-faint">{SESSION_LABEL[x.session]} · {x.currency}</span></Link>)}</div></section>
    </PageContainer>
  );
}
