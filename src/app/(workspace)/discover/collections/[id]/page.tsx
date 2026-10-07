import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Change, Metric, MetricGrid, PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { AssetTable } from '@/features/assets/asset-table';
import { Heatmap } from '@/features/heatmap/heatmap';
import { ModuleFoot, freshest } from '@/features/markets/widgets';
import { dateShort } from '@/lib/format';
import * as md from '@/services/market-data';

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const t = await md.getTheme((await params).id); return t ? pageMetadata({ title: `${t.theme.name}: theme and collection`, description: `${t.theme.description}. ${t.assets.length} assets across ${new Set(t.assets.map((a) => a.country)).size} markets, with heatmap, performance and research.`, path: `/discover/collections/${t.theme.id}` }) : notFound(); }
export default async function CollectionPage({ params }: Props) {
  const { id } = await params;
  const t = await md.getTheme(id);
  if (!t) notFound();
  const { theme, assets } = t;
  const docs = (await md.getResearch('themes')).filter((d) => d.themeId === id);
  const avg = (k: 'd1' | 'm1' | 'ytd' | 'y1') => assets.reduce((s, a) => s + (a.m[k] ?? 0), 0) / (assets.length || 1);
  return (
    <PageContainer>
      <PageHeader crumbs={[['Discover', '/discover'], ['Collections', '/discover/collections'], [theme.name]]} title={theme.name} lead={`${theme.description}.`} />
      <MetricGrid><Metric label="1 day" value={<Change value={avg('d1')} />} /><Metric label="1 month" value={<Change value={avg('m1')} />} /><Metric label="Year to date" value={<Change value={avg('ytd')} />} /><Metric label="1 year" value={<Change value={avg('y1')} />} /><Metric label="Markets" value={new Set(assets.map((a) => a.country)).size} /><Metric label="Assets" value={assets.length} /></MetricGrid>
      <Panel title="Heatmap" sub="By country, coloured by 1M change" footer={<ModuleFoot meta={freshest(assets)} />}><Heatmap compact assets={assets} initial={{ group: 'country', colour: 'm1' }} /></Panel>
      <Panel title="Assets" flush footer={<ModuleFoot meta={freshest(assets)} />}><AssetTable rows={assets} columns={['d1', 'm1', 'y1', 'marketCap', 'pe', 'dividendYield']} /></Panel>
      {docs.length > 0 && <Panel title="Research" flush>{docs.map((d) => <Link key={d.id} href={`/research/${d.kind}/${d.slug}`} className="block border-b border-line px-4 py-3 last:border-0 hover:bg-bg"><span className="block font-semibold">{d.title}</span><span className="mt-1 flex gap-1.5 text-xs text-faint"><Badge>{d.type}</Badge>{dateShort(d.publishedAt)}</span></Link>)}</Panel>}
    </PageContainer>
  );
}
