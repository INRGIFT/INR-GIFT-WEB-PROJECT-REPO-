import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { PageContainer, PageHeader } from '@/components/ui/primitives';
import { Heatmap } from '@/features/heatmap/heatmap';
import { VideoModule } from '@/features/media/video-module';
import { getVideoFor } from '@/services/content';

/** Filtered or shared states are kept out of the index; the canonical stays on the base page. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ group?: string, path?: string }> }): Promise<Metadata> { const sp = await searchParams; return pageMetadata({ title: 'Global heatmap', description: 'A treemap of global stocks, ETFs and REITs. Drill from region to country to sector to industry to asset.', path: '/discover/heatmap', index: sp.group || sp.path ? 'faceted' : 'index' }); }
const GROUPS = ['region', 'country', 'exchange', 'sector', 'industry', 'cls'] as const;
export default async function HeatmapPage({ searchParams }: { searchParams: Promise<{ group?: string; path?: string }> }) {
  const [sp, video] = await Promise.all([searchParams, getVideoFor('page:heatmap')]);
  const group = GROUPS.find((g) => g === sp.group);
  return (
    <PageContainer wide>
      <PageHeader crumbs={[['Discover', '/discover'], ['Heatmap']]} title="Global heatmap" lead="Drill from region to country to sector to industry. Select a tile for a quick view, or double-click to open its research page." />
      <Heatmap key={`${group}-${sp.path}`} initial={{ group, path: sp.path ? sp.path.split('|').slice(0, 4) : [] }} />
      {video && <details className="group rounded-card border border-line bg-white px-4 py-3"><summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">New to the heatmap? Watch a 30-second tour <span aria-hidden className="text-faint group-open:hidden">+</span></summary><div className="mt-3 max-w-2xl"><VideoModule video={video} compact /></div></details>}
    </PageContainer>
  );
}
