import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/button';
import { Badge, PageContainer, PageHeader } from '@/components/ui/primitives';
import { SaveButton, TrackView } from '@/features/workspace/action-buttons';
import { dateShort } from '@/lib/format';
import { assetHref, marketHref } from '@/lib/routes';
import type { ResearchKind } from '@/lib/types';
import * as md from '@/services/market-data';

type Props = { params: Promise<{ kind: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { kind, slug } = await params; const d = await md.getResearchDoc(kind as ResearchKind, slug); return d ? { title: d.title, description: d.summary, openGraph: { type: 'article', title: d.title, description: d.summary, publishedTime: d.publishedAt } } : { title: 'Not found' }; }
export default async function ResearchDocPage({ params }: Props) {
  const { kind, slug } = await params;
  const d = await md.getResearchDoc(kind as ResearchKind, slug);
  if (!d) notFound();
  const market = d.marketId ? await md.getMarket(d.marketId) : null;
  const href = `/research/${d.kind}/${d.slug}`;
  return (
    <PageContainer className="max-w-[860px]">
      <TrackView kind="research" title={d.title} href={href} />
      <PageHeader crumbs={[['Research', '/research'], [d.kind[0].toUpperCase() + d.kind.slice(1), `/research/${d.kind}`], [d.assetSymbol ?? d.topic]]} title={d.title} lead={d.summary} actions={<SaveButton refType="document" refId={d.id} title={d.title} href={href} />} />
      <p className="flex flex-wrap items-center gap-1.5 text-xs text-faint">{d.assetSymbol && <Badge tone="brand">{d.assetSymbol}</Badge>}{market && <Badge>{market.name}</Badge>}<Badge>{d.type}</Badge><Badge>{d.topic}</Badge>Published {dateShort(d.publishedAt)}</p>
      <article className="prose-doc rounded-card border border-line bg-white px-6 py-5">
        {d.sections.map((s) => <section key={s.heading}><h2>{s.heading}</h2><p>{s.body}</p></section>)}
        <p className="!mb-0 mt-6 border-t border-line pt-4 !text-xs !text-faint">This note describes data available at the time of writing. It is not a recommendation to transact in any security and does not consider your circumstances. Figures come from the active data provider; see <Link className="link" href="/resources/data">data and methodology</Link>.</p>
      </article>
      <div className="flex flex-wrap gap-2">
        {d.assetSlug && d.assetCls && <ButtonLink variant="primary" href={assetHref({ cls: d.assetCls, slug: d.assetSlug })}>Open {d.assetSymbol} chart and data</ButtonLink>}
        {market && <ButtonLink href={marketHref(market.slug)}>{market.name} market</ButtonLink>}
        {d.themeId && <ButtonLink variant="primary" href={`/discover/collections/${d.themeId}`}>Open collection</ButtonLink>}
      </div>
    </PageContainer>
  );
}
