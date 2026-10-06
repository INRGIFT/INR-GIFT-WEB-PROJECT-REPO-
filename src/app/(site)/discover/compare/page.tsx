import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { Suspense } from 'react';
import { PageContainer, PageHeader, SkeletonRows } from '@/components/ui/primitives';
import { Compare } from '@/features/compare/compare';

/** Filtered or shared states are kept out of the index; the canonical stays on the base page. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ s?: string }> }): Promise<Metadata> { const sp = await searchParams; return pageMetadata({ title: 'Compare assets', description: 'Compare up to four stocks, ETFs or indices on performance, risk, valuation, fundamentals and fees.', path: '/discover/compare', index: sp.s ? 'faceted' : 'index' }); }
export default function ComparePage() {
  return (
    <PageContainer>
      <PageHeader crumbs={[['Discover', '/discover'], ['Compare']]} title="Compare" lead="Up to four stocks, ETFs, REITs or indices side by side." />
      <Suspense fallback={<SkeletonRows rows={8} />}><Compare /></Suspense>
    </PageContainer>
  );
}
