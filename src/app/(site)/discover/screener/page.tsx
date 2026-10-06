import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageContainer, PageHeader, SkeletonRows } from '@/components/ui/primitives';
import { Screener } from '@/features/screener/screener';

export const metadata: Metadata = { title: 'Global screener', description: 'Screen global stocks, ETFs and REITs on fundamentals, valuation, growth, risk and technicals with nested AND/OR filters.', alternates: { canonical: '/discover/screener' } };
export default function ScreenerPage() {
  return (
    <PageContainer wide>
      <PageHeader crumbs={[['Discover', '/discover'], ['Screener']]} title="Global screener" lead="Combine filters with “match all”, “match any” and nested groups. The address bar always holds a shareable link to the current screen." />
      <Suspense fallback={<SkeletonRows rows={8} />}><Screener /></Suspense>
    </PageContainer>
  );
}
