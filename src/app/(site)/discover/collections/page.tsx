import type { Metadata } from 'next';
import Link from 'next/link';
import { Change, PageContainer, PageHeader } from '@/components/ui/primitives';
import * as md from '@/services/market-data';

export const metadata: Metadata = { title: 'Collections', description: 'Curated themes and groups of related assets.', alternates: { canonical: '/discover/collections' } };
export default async function CollectionsPage() {
  const [themes, all] = await Promise.all([md.getThemes(), md.getAssets()]);
  return (
    <PageContainer>
      <PageHeader crumbs={[['Discover', '/discover'], ['Collections']]} title="Collections" lead="Curated groups you can open as a heatmap and a table. Averages are equal-weighted." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{themes.map((t) => { const l = all.filter((a) => t.assetIds.includes(a.id)); const avg = (k: 'm1' | 'y1') => l.reduce((s, a) => s + (a.m[k] ?? 0), 0) / (l.length || 1); return (
        <Link key={t.id} href={`/discover/collections/${t.id}`} className="rounded-card border border-line bg-white p-4 transition-[border-color,box-shadow] duration-150 hover:border-brand hover:shadow-card">
          <h2 className="text-base font-bold">{t.name}</h2><p className="mt-0.5 text-[13px] text-slate2">{t.description}</p>
          <p className="mt-3 flex gap-5 text-[13px]"><span><span className="block text-xs text-faint">1 month</span><Change value={avg('m1')} /></span><span><span className="block text-xs text-faint">1 year</span><Change value={avg('y1')} /></span><span><span className="block text-xs text-faint">Assets</span><span className="num font-medium">{l.length}</span></span></p>
        </Link>); })}</div>
    </PageContainer>
  );
}
