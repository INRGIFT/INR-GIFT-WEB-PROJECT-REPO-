import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { AssetTable } from '@/features/assets/asset-table';
import { ModuleFoot, Movers, freshest } from '@/features/markets/widgets';
import type { Asset } from '@/lib/types';
import * as md from '@/services/market-data';

export const metadata: Metadata = pageMetadata({ title: 'Trending', description: 'Movers, most active and momentum leaders across global stocks, ETFs and REITs.', path: '/discover/trending' });
export default async function TrendingPage() {
  const all = await md.getAssets({ cls: md.EQUITY_LIKE });
  const top = (f: (a: Asset) => number | null | undefined, n = 8) => [...all].filter((a) => f(a) != null).sort((a, b) => f(b)! - f(a)!).slice(0, n);
  const foot = <ModuleFoot meta={freshest(all)} />;
  return (
    <PageContainer>
      <PageHeader crumbs={[['Discover', '/discover'], ['Trending']]} title="Trending" lead="Every ranking on this page is measured from price and volume data. None is an editorial pick." />
      <Movers list={all} />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title="Momentum leaders" sub="Ranked by 1 month change" flush footer={foot}><AssetTable rows={top((a) => a.m.m1)} columns={['m1', 'm3', 'rsi']} initialSort={null} showStatus={false} /></Panel>
        <Panel title="Strongest over one year" sub="Ranked by 1 year return" flush footer={foot}><AssetTable rows={top((a) => a.m.y1)} columns={['y1', 'sma50Gap', 'volatility']} initialSort={null} showStatus={false} /></Panel>
        <Panel title="Deepest drawdowns" sub="Largest 3 year peak-to-trough fall" flush footer={foot}><AssetTable rows={top((a) => -(a.m.maxDrawdown ?? 0))} columns={['maxDrawdown', 'y1', 'beta']} initialSort={null} showStatus={false} /></Panel>
        <Panel title="Highest volatility" sub="30-day annualised" flush footer={foot}><AssetTable rows={top((a) => a.m.volatility)} columns={['volatility', 'beta', 'd1']} initialSort={null} showStatus={false} /></Panel>
      </div>
    </PageContainer>
  );
}
