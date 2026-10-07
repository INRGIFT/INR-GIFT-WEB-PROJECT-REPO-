import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { ResearchList } from '@/features/site/research-list';
import type { ResearchKind } from '@/lib/types';
import * as md from '@/services/market-data';

const KINDS: Record<ResearchKind, [string, string]> = { stocks: ['Stock research', 'Company notes structured as what changed, why it matters, profitability and risk, and what to monitor.'], etfs: ['ETF research', 'Fund reviews against the eight-step framework: objective, cost, size, liquidity, holdings, allocation, performance and risk.'], markets: ['Market research', 'Country-level commentary: trend, leadership, currency and upcoming events.'], themes: ['Themes', 'Data insights on groups of related assets across markets.'], sectors: ['Sector research', 'One sector compared across markets: where it is listed, how it is valued and how it has moved.'], countries: ['Country research', 'What a covered market is made of: sector mix, largest listings, index trend, trading hours in IST and currency.'] };
type Props = { params: Promise<{ kind: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const k = KINDS[(await params).kind as ResearchKind]; return k ? pageMetadata({ title: k[0], description: k[1], path: `/research/${(await params).kind}` }) : notFound(); }
export default async function ResearchKindPage({ params }: Props) {
  const kind = (await params).kind as ResearchKind;
  if (!KINDS[kind]) notFound();
  const docs = await md.getResearch(kind);
  return (
    <PageContainer>
      <PageHeader crumbs={[['Research', '/research'], [KINDS[kind][0]]]} title={KINDS[kind][0]} lead={KINDS[kind][1]} />
      <Panel title={`${docs.length} notes`} flush><ResearchList docs={docs} /></Panel>
    </PageContainer>
  );
}
