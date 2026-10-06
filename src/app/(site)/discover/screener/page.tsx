import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { Suspense } from 'react';
import { PageContainer, PageHeader, SkeletonRows } from '@/components/ui/primitives';
import { TutorialDisclosure } from '@/features/media/video-module';
import { Screener } from '@/features/screener/screener';
import { getVideoFor } from '@/services/content';

/** Filtered or shared states are kept out of the index; the canonical stays on the base page. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string, u?: string, sector?: string, country?: string, region?: string }> }): Promise<Metadata> { const sp = await searchParams; return pageMetadata({ title: 'Global screener', description: 'Screen global stocks, ETFs and REITs on fundamentals, valuation, growth, risk and technicals with nested AND/OR filters.', path: '/discover/screener', index: sp.q || sp.u || sp.sector || sp.country || sp.region ? 'faceted' : 'index' }); }
export default async function ScreenerPage() {
  const video = await getVideoFor('page:screener');
  return (
    <PageContainer wide>
      <PageHeader crumbs={[['Discover', '/discover'], ['Screener']]} title="Global screener" lead="Combine filters with “match all”, “match any” and nested groups. The address bar always holds a shareable link to the current screen." />
      <Suspense fallback={<SkeletonRows rows={8} />}><Screener /></Suspense>
      {video && <TutorialDisclosure video={video} label="How the screener works" />}
    </PageContainer>
  );
}
