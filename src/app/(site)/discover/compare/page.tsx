import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageContainer, PageHeader, SkeletonRows } from '@/components/ui/primitives';
import { Compare } from '@/features/compare/compare';

export const metadata: Metadata = { title: 'Compare assets', description: 'Compare up to four stocks, ETFs or indices on performance, risk, valuation, fundamentals and fees.', alternates: { canonical: '/discover/compare' } };
export default function ComparePage() {
  return (
    <PageContainer>
      <PageHeader crumbs={[['Discover', '/discover'], ['Compare']]} title="Compare" lead="Up to four stocks, ETFs, REITs or indices side by side." />
      <Suspense fallback={<SkeletonRows rows={8} />}><Compare /></Suspense>
    </PageContainer>
  );
}
