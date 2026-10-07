import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/button';
import { DataStatus } from '@/components/ui/data-status';
import { Badge, Bar, DivergingBar, PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { AssetTable } from '@/features/assets/asset-table';
import { freshest } from '@/features/markets/widgets';
import { SaveButton, TrackView } from '@/features/workspace/action-buttons';
import { dateShort } from '@/lib/format';
import { assetHref, collectionHref, glossaryHref, marketHref, researchHref } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { article, breadcrumbs, JsonLd } from '@/lib/structured-data';
import type { Asset, ResearchChart, ResearchKind } from '@/lib/types';
import { termsMentionedIn } from '@/services/content';
import * as md from '@/services/market-data';

const KIND_LABEL: Record<ResearchKind, string> = { stocks: 'Stock research', etfs: 'ETF research', markets: 'Market research', themes: 'Theme research', sectors: 'Sector research', countries: 'Country research' };
const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
type Props = { params: Promise<{ kind: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { kind, slug } = await params; const d = await md.getResearchDoc(kind as ResearchKind, slug); return d ? pageMetadata({ title: d.title, description: d.summary, path: researchHref(d), type: 'article', publishedTime: d.publishedAt }) : notFound(); }

export default async function ResearchDocPage({ params }: Props) {
  const { kind, slug } = await params;
  const d = await md.getResearchDoc(kind as ResearchKind, slug);
  if (!d) notFound();
  const [market, all, theme] = await Promise.all([d.marketId ? md.getMarket(d.marketId) : null, md.getResearch(), d.themeId ? md.getTheme(d.themeId) : null]);
  const subject = d.assetSlug ? await md.getAsset(d.assetCls, d.assetSlug) : null;
  // Assets the note is about: the asset, the theme's constituents, or the market's largest covered names.
  let related: Asset[] = [];
  if (subject) related = [subject, ...(await md.getAssets({ cls: [subject.cls] })).filter((x) => x.id !== subject.id && (x.sector === subject.sector || x.etf?.strategy === subject.etf?.strategy)).slice(0, 4)];
  else if (theme) related = theme.assets;
  else if (d.sector) related = (await md.getAssets({ cls: ['stock'] })).filter((x) => x.sector === d.sector).sort((x, y) => (y.m.marketCap ?? 0) - (x.m.marketCap ?? 0)).slice(0, 8);
  else if (d.marketId) related = (await md.getAssets({ marketId: d.marketId, cls: ['stock', 'index'] })).sort((x, y) => (y.m.marketCap ?? 0) - (x.m.marketCap ?? 0)).slice(0, 8);
  const terms = await termsMentionedIn([d.whyItMatters ?? '', ...d.sections.map((s) => s.body), d.interpretation ?? ''].join(' '));
  const more = all.filter((x) => x.id !== d.id && (x.kind === d.kind || x.topic === d.topic)).slice(0, 4);
  const href = researchHref(d);
  const crumbs: [string, string?][] = [['Research', '/research'], [KIND_LABEL[d.kind], `/research/${d.kind}`], [d.assetSymbol ?? d.topic]];
  const asOf = freshest(related);
  return (
    <PageContainer className="max-w-[1180px]">
      <JsonLd data={[article(d, href), breadcrumbs(crumbs)]} />
      <TrackView kind="research" title={d.title} href={href} />
      <PageHeader crumbs={crumbs} title={d.title} lead={d.summary} actions={<SaveButton refType="document" refId={d.id} title={d.title} href={href} />} />
      <p className="flex flex-wrap items-center gap-1.5 text-xs text-faint">{d.assetSymbol && <Badge tone="brand">{d.assetSymbol}</Badge>}{market && <Badge>{market.name}</Badge>}<Badge>{d.type}</Badge><Badge>{d.topic}</Badge>Published {dateShort(d.publishedAt)} · By {d.author}{d.reviewer ? ` · Reviewed by ${d.reviewer}` : ' · Not separately reviewed'}</p>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {d.keyTakeaways && d.keyTakeaways.length > 0 && (
            <section aria-labelledby="takeaways" className="rounded-card border border-brand/20 bg-brand-soft/50 px-5 py-4">
              <h2 id="takeaways" className="text-lead font-bold">Key takeaways</h2>
              <ul className="mt-2 space-y-1.5 text-lead text-slate2">{d.keyTakeaways.map((t) => <li key={t} className="flex gap-2.5"><span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{t}</li>)}</ul>
            </section>
          )}
          {d.whyItMatters && <section aria-labelledby="why" className="rounded-card border border-line bg-white px-5 py-4"><h2 id="why" className="text-lead font-bold">Why it matters</h2><p className="mt-1 max-w-[72ch] text-lead leading-relaxed text-slate2">{d.whyItMatters}</p></section>}
          <nav aria-label="In this note" className="rounded-card border border-line bg-white px-4 py-3"><p className="mb-1.5 text-xs font-semibold text-faint">Analysis</p><ol className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">{d.sections.map((s, i) => <li key={s.heading}><a className="link" href={`#${anchor(s.heading)}`}><span className="num mr-1 text-faint">{i + 1}.</span>{s.heading}</a></li>)}</ol></nav>
          <article className="prose-doc rounded-card border border-line bg-white px-6 py-5">
            {d.sections.map((s) => <section key={s.heading} id={anchor(s.heading)} className="scroll-mt-24"><h2>{s.heading}</h2><p>{s.body}</p></section>)}
          </article>
          {d.charts?.map((c) => <ResearchChartPanel key={c.title} chart={c} />)}
          {related.length > 0 && <Panel flush title={subject ? `${subject.symbol} and closest peers` : theme ? 'Assets in this theme' : 'Largest covered names'} sub="Live from the active data source" footer={asOf && <DataStatus meta={asOf} />}><AssetTable rows={related} columns={subject?.cls === 'etf' ? ['d1', 'y1', 'expenseRatio', 'aum'] : ['d1', 'm1', 'y1', 'pe']} initialSort={null} /></Panel>}
          {d.interpretation && <section aria-labelledby="interpretation" className="rounded-card border border-line bg-white px-5 py-4"><h2 id="interpretation" className="text-lead font-bold">Interpretation</h2><p className="mt-1 max-w-[72ch] text-slate2">{d.interpretation}</p></section>}
          <section className="grid gap-4 rounded-card border border-line bg-soft px-5 py-4 text-[13px] text-slate2 md:grid-cols-2" aria-label="Limitations, methodology and sources">
            <div><h2 className="text-[15px] font-bold text-navy">Limitations</h2><ul className="mt-1 list-disc space-y-1 pl-4">{d.limitations?.map((l) => <li key={l}>{l}</li>)}</ul></div>
            <div><h2 className="text-[15px] font-bold text-navy">Methodology</h2><p className="mt-1">{d.methodology} Current source: {related[0]?.meta.source ?? 'the active data source'}.</p></div>
            <div className="md:col-span-2"><h2 className="text-[15px] font-bold text-navy">Sources</h2><ul className="mt-1 space-y-0.5">{d.sources?.map((s) => <li key={s.label}>{s.href ? <Link className="link" href={s.href}>{s.label}</Link> : s.label}</li>)}</ul></div>
          </section>
          <p className="rounded-card border border-line bg-white px-5 py-3 text-xs leading-relaxed text-faint"><b className="text-slate2">Disclosure.</b> {d.disclosure}</p>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24">
          <Panel title="Go deeper">
            <div className="flex flex-col gap-2">
              {subject && <ButtonLink variant="primary" href={assetHref(subject)}>Open {subject.symbol} chart and data</ButtonLink>}
              {subject?.cls === 'etf' && <ButtonLink href={`${assetHref(subject)}/review`}>Eight-step review</ButtonLink>}
              {related.length >= 2 && <ButtonLink href={`/discover/compare?s=${related.slice(0, 4).map((x) => x.slug).join(',')}`}>Compare {related.length >= 4 ? 'four' : related.length} side by side</ButtonLink>}
              {market && <ButtonLink href={marketHref(market.slug)}>{market.name} market</ButtonLink>}
              {d.themeId && <ButtonLink href={collectionHref(d.themeId)}>Open the collection</ButtonLink>}
            </div>
          </Panel>
          {terms.length > 0 && <Panel title="Terms used" flush><ul>{terms.map((t) => <li key={t.slug}><Link href={glossaryHref(t.slug)} className="row-link py-2"><span className="block font-semibold">{t.term}</span><span className="line-clamp-2 text-xs text-slate2">{t.definition}</span></Link></li>)}</ul></Panel>}
          {more.length > 0 && <Panel title="Related research" flush><ul>{more.map((x) => <li key={x.id}><Link href={researchHref(x)} className="row-link py-2.5"><span className="block font-semibold leading-snug">{x.title}</span><span className="text-xs text-faint">{dateShort(x.publishedAt)}</span></Link></li>)}</ul></Panel>}
        </aside>
      </div>
    </PageContainer>
  );
}

/** Bars drawn from figures computed for the note. Each bar prints its signed value, so colour is not the only cue. */
function ResearchChartPanel({ chart }: { chart: ResearchChart }) {
  const max = Math.max(1, ...chart.bars.map((b) => Math.abs(b.value)));
  const fmt = (v: number) => (chart.unit === '%' ? `${v.toFixed(chart.kind === 'diverging' ? 1 : 0)}%` : chart.unit === '×' ? `${v.toFixed(1)}×` : `${v.toFixed(0)} bn`);
  return (
    <Panel title={chart.title} footer={chart.note}>
      <figure aria-label={chart.title}>
        {chart.bars.map((b) => chart.kind === 'diverging'
          ? <DivergingBar key={b.label} label={b.label} value={b.value} scale={max} href={b.href} />
          : <Bar key={b.label} label={b.label} value={Math.abs(b.value)} max={max} href={b.href} suffix={fmt(b.value)} />)}
      </figure>
    </Panel>
  );
}
