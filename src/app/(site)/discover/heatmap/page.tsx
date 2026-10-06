import type { Metadata } from 'next';
import { PageContainer, PageHeader } from '@/components/ui/primitives';
import { Heatmap } from '@/features/heatmap/heatmap';

export const metadata: Metadata = { title: 'Global heatmap', description: 'A treemap of global stocks, ETFs and REITs. Drill from region to country to sector to industry to asset.', alternates: { canonical: '/discover/heatmap' } };
const GROUPS = ['region', 'country', 'exchange', 'sector', 'industry', 'cls'] as const;
export default async function HeatmapPage({ searchParams }: { searchParams: Promise<{ group?: string; path?: string }> }) {
  const sp = await searchParams;
  const group = GROUPS.find((g) => g === sp.group);
  return (
    <PageContainer wide>
      <PageHeader crumbs={[['Discover', '/discover'], ['Heatmap']]} title="Global heatmap" lead="Drill from region to country to sector to industry. Select a tile for a quick view, or double-click to open its research page." />
      <Heatmap key={`${group}-${sp.path}`} initial={{ group, path: sp.path ? sp.path.split('|').slice(0, 4) : [] }} />
    </PageContainer>
  );
}
