import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/data-status';
import { Change, PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { AssetTable } from '@/features/assets/asset-table';
import { ModuleFoot, freshest } from '@/features/markets/widgets';
import { encodeTree } from '@/features/screener/logic';
import { HomeSearch } from '@/features/site/home-search';
import { CLASS_LABEL, DIRECTORY_CLASS, marketHref } from '@/lib/routes';
import * as md from '@/services/market-data';

export const metadata: Metadata = pageMetadata({ title: 'Explore global assets', description: 'Stocks, ETFs, indices, currencies, commodities, bonds and REITs across global markets.', path: '/assets' });
const BLURB: Record<string, string> = { stocks: 'Fundamentals, valuation, charts and research', etfs: 'Cost, holdings, allocation and tracking', indices: 'Headline benchmarks for every market', fx: 'INR pairs and the major crosses', commodities: 'Metals and energy benchmarks', bonds: 'Government yields, coupons and duration', reits: 'Yield, FFO and occupancy', funds: 'Mutual funds, where a source supports them' };
const screen = (field: 'dividendYield' | 'revenueGrowth' | 'volatility', op: 'gte' | 'lte', value: string) => `/discover/screener?q=${encodeTree({ op: 'AND', rules: [{ field, op, value }] })}`;
const BEHAVIOUR: [string, string][] = [['Top gainers and losers', '/discover/trending'], ['High dividend', screen('dividendYield', 'gte', '3.5')], ['High growth', screen('revenueGrowth', 'gte', '15')], ['Low volatility', screen('volatility', 'lte', '22')]];

export default async function AssetsHub() {
  const [all, markets, themes] = await Promise.all([md.getAssets(), md.getMarkets(), md.getThemes()]);
  const stocks = all.filter((a) => a.cls === 'stock');
  return (
    <PageContainer>
      <PageHeader title="Explore global assets" lead="Every market. Every asset class. One research layer." />
      <HomeSearch />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Object.entries(DIRECTORY_CLASS).map(([seg, cls]) => { const n = all.filter((a) => a.cls === cls).length; return <Link key={seg} href={`/assets/${seg}`} className="rounded-card border border-line bg-white p-4 transition-[border-color,box-shadow] duration-150 hover:border-brand hover:shadow-card"><h2 className="text-base font-bold">{CLASS_LABEL[cls].many}</h2><p className="mt-0.5 text-[13px] text-slate2">{BLURB[seg]}</p><p className="mt-2.5 text-xs text-faint">{n ? `${n} covered` : 'No coverage from current source'}</p></Link>; })}
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Panel title="By market" flush><div className="max-h-[420px] overflow-auto">{markets.map((m) => <Link key={m.id} href={marketHref(m.slug)} className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 last:border-0 hover:bg-bg"><span><span className="block font-semibold">{m.name}</span><span className="text-xs text-faint">{m.assetCount} assets · {m.currency} · {m.region}</span></span><StatusBadge status={m.dataStatus} /></Link>)}</div></Panel>
        <Panel title="By sector" flush>{md.sectors(stocks).map((s) => <Link key={s.sector} href={`/discover/screener?sector=${encodeURIComponent(s.sector)}`} className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 last:border-0 hover:bg-bg"><span><span className="block font-semibold">{s.sector}</span><span className="text-xs text-faint">{s.count} companies</span></span><Change value={s.change} /></Link>)}</Panel>
        <div className="space-y-4">
          <Panel title="By theme" flush>{themes.map((t) => <Link key={t.id} href={`/discover/collections/${t.id}`} className="block border-b border-line px-4 py-2.5 last:border-0 hover:bg-bg"><span className="block font-semibold">{t.name}</span><span className="text-xs text-faint">{t.description}</span></Link>)}</Panel>
          <Panel title="By behaviour"><div className="flex flex-wrap gap-2">{BEHAVIOUR.map(([l, h]) => <Link key={l} href={h} className="rounded-lg border border-line2 px-2.5 py-1 text-[13px] font-medium transition-colors hover:border-brand hover:text-brand-ink">{l}</Link>)}</div></Panel>
        </div>
      </div>
      <Panel title="Largest by market value" flush footer={<ModuleFoot meta={freshest(stocks)} more={['Open in screener', '/discover/screener']} />}><AssetTable rows={[...stocks].sort((a, b) => (b.m.marketCap ?? 0) - (a.m.marketCap ?? 0)).slice(0, 10)} columns={['d1', 'y1', 'marketCap', 'pe', 'dividendYield']} initialSort={null} /></Panel>
    </PageContainer>
  );
}
