import type { Metadata } from 'next';
import { Columns2, Filter, Flame, LayoutGrid, Map as MapIcon } from 'lucide-react';
import Link from 'next/link';
import { Change, PageContainer, PageHeader, Panel, Section } from '@/components/ui/primitives';
import { AssetTable } from '@/features/assets/asset-table';
import { Heatmap } from '@/features/heatmap/heatmap';
import { ModuleFoot, Movers, SectorPanel, freshest } from '@/features/markets/widgets';
import * as md from '@/services/market-data';

export const metadata: Metadata = { title: 'Discover', description: 'Screener, heatmap, compare, trending and collections: the tools for finding what to research next.', alternates: { canonical: '/discover' } };
const TOOLS = [['Screener', 'Filter the global universe with AND, OR and nested groups', '/discover/screener', Filter], ['Heatmap', 'Drill from region to country to sector to company', '/discover/heatmap', MapIcon], ['Compare', 'Up to four assets, rebased and side by side', '/discover/compare', Columns2], ['Trending', 'Movers, activity and 52-week extremes', '/discover/trending', Flame], ['Collections', 'Themes and curated groups', '/discover/collections', LayoutGrid]] as const;

export default async function DiscoverPage() {
  const [all, themes, markets] = await Promise.all([md.getAssets(), md.getThemes(), md.getMarkets()]);
  const eq = all.filter((a) => md.EQUITY_LIKE.includes(a.cls)), stocks = all.filter((a) => a.cls === 'stock');
  const regions = [...new Set(markets.map((m) => m.region))];
  return (
    <PageContainer>
      <PageHeader title="Discover" lead="Start broad, then narrow. Each tool here hands off to research, compare, watchlist and alerts." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{TOOLS.map(([t, d, h, Icon]) => <Link key={h} href={h} className="rounded-card border border-line bg-white p-4 transition-[border-color,box-shadow] duration-150 hover:border-brand hover:shadow-card"><Icon size={20} strokeWidth={1.75} className="text-brand" /><h2 className="mt-2.5 text-base font-bold">{t}</h2><p className="mt-0.5 text-[13px] text-slate2">{d}</p></Link>)}</div>
      <Panel title="Heatmap" sub="Stocks by sector, coloured by 1M change" footer={<ModuleFoot meta={freshest(stocks)} more={['Open full heatmap', '/discover/heatmap?group=sector']} />}><Heatmap compact assets={stocks} initial={{ group: 'sector', colour: 'm1' }} /></Panel>
      <Movers list={eq} />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SectorPanel list={stocks} />
        <Panel title="Regions" flush>{regions.map((r) => { const l = stocks.filter((a) => a.region === r); const w = l.reduce((s, a) => s + (a.m.marketCap ?? 0), 0); const v = w ? l.reduce((s, a) => s + (a.m.d1 ?? 0) * (a.m.marketCap ?? 0), 0) / w : null; return <Link key={r} href={`/discover/heatmap?group=region&path=${encodeURIComponent(r)}`} className="flex items-center justify-between border-b border-line px-4 py-2.5 last:border-0 hover:bg-bg"><span><span className="block font-semibold">{r}</span><span className="text-xs text-faint">{l.length} companies</span></span><Change value={v} /></Link>; })}</Panel>
      </div>
      <Section title="Themes" link={['All collections', '/discover/collections']}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{themes.slice(0, 4).map((t) => <Link key={t.id} href={`/discover/collections/${t.id}`} className="rounded-card border border-line bg-white p-4 transition-colors hover:border-brand"><h3 className="text-[15px] font-bold">{t.name}</h3><p className="mt-0.5 text-[13px] text-slate2">{t.description}</p></Link>)}</div></Section>
      <Panel title="Popular assets" sub="Largest covered names" flush footer={<ModuleFoot meta={freshest(eq)} />}><AssetTable rows={[...eq].sort((a, b) => (b.m.marketCap ?? b.m.aum ?? 0) - (a.m.marketCap ?? a.m.aum ?? 0)).slice(0, 8)} columns={['d1', 'm1', 'y1', 'marketCap']} initialSort={null} /></Panel>
    </PageContainer>
  );
}
