import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { AssetDirectory } from '@/features/assets/asset-directory';
import { ModuleFoot, freshest } from '@/features/markets/widgets';
import { CLASS_LABEL, DIRECTORY_CLASS } from '@/lib/routes';
import * as md from '@/services/market-data';

type Props = { params: Promise<{ cls: string }> };
const LEAD: Record<string, string> = { stocks: 'Listed companies across every covered market. Filter by region, market or sector, then open any row for research.', etfs: 'Exchange-traded funds with cost, size, yield and holdings.', indices: 'Headline equity benchmarks, grouped by the market they describe.', fx: 'Spot reference rates. INR pairs first, then the majors.', commodities: 'Benchmark prices for metals and energy, with their reference contracts.', bonds: 'Ten-year government benchmarks: price, yield, coupon and duration.', reits: 'Listed property trusts with yield, FFO yield and occupancy.', funds: 'Mutual funds and other pooled vehicles.' };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { cls } = await params; const c = DIRECTORY_CLASS[cls]; return c ? pageMetadata({ title: `Global ${CLASS_LABEL[c].many.toLowerCase()} directory`, description: LEAD[cls], path: `/assets/${cls}` }) : notFound(); }

export default async function DirectoryPage({ params }: Props) {
  const { cls: seg } = await params;
  const cls = DIRECTORY_CLASS[seg];
  if (!cls) notFound();
  const rows = await md.getAssets({ cls: [cls] });
  return (
    <PageContainer wide>
      <PageHeader crumbs={[['Assets', '/assets'], [CLASS_LABEL[cls].many]]} title={CLASS_LABEL[cls].many} lead={LEAD[seg]} actions={['stock', 'etf', 'reit'].includes(cls) ? <ButtonLink href={`/discover/screener?u=${cls}`} variant="primary">Open in screener</ButtonLink> : undefined} />
      {rows.length ? <AssetDirectory rows={rows} cls={cls} footer={<ModuleFoot meta={freshest(rows)} />} /> : <Panel title={CLASS_LABEL[cls].many}><EmptyState title="No coverage from the current source" action={<ButtonLink href="/assets/etfs" variant="primary">Browse ETFs</ButtonLink>}>The current data provider does not supply {CLASS_LABEL[cls].many.toLowerCase()}. The directory, filters and detail pages are ready and will fill in when a source is connected.</EmptyState></Panel>}
    </PageContainer>
  );
}
