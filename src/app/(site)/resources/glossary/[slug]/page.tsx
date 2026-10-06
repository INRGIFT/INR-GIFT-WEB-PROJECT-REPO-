import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/button';
import { PageContainer, PageHeader, Panel } from '@/components/ui/primitives';
import { AssetTable } from '@/features/assets/asset-table';
import { ModuleFoot, freshest } from '@/features/markets/widgets';
import { encodeTree } from '@/features/screener/logic';
import { METRICS } from '@/lib/metrics';
import { glossaryHref, learnHref } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbs, definedTerm, JsonLd } from '@/lib/structured-data';
import type { MetricKey } from '@/lib/types';
import { getGlossary, getLearnArticles, getTerm, termSlug } from '@/services/content';
import * as md from '@/services/market-data';

/** Glossary term → the metric it describes, so a definition links to live data. */
const TERM_METRIC: Record<string, MetricKey> = { 'p-e-ratio': 'pe', 'dividend-yield': 'dividendYield', beta: 'beta', volatility: 'volatility', 'expense-ratio': 'expenseRatio', 'market-capitalisation': 'marketCap', 'maximum-drawdown': 'maxDrawdown', roic: 'roic', rsi: 'rsi', duration: 'duration', 'yield-to-maturity': 'yield', 'ev-ebitda': 'evEbitda', 'assets-under-management': 'aum', ffo: 'ffoYield' };
type Props = { params: Promise<{ slug: string }> };
export async function generateStaticParams() { return (await getGlossary()).map((t) => ({ slug: t.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const t = await getTerm((await params).slug); return t ? pageMetadata({ title: `${t.term}: definition${t.formula ? ', formula' : ''} and why it matters`, description: `${t.definition} ${t.why}`, path: glossaryHref(t.slug) }) : { title: 'Not found' }; }
export default async function TermPage({ params }: Props) {
  const { slug } = await params;
  const [t, all, learn] = await Promise.all([getTerm(slug), getGlossary(), getLearnArticles()]);
  if (!t) notFound();
  const metric = TERM_METRIC[t.slug];
  const rows = metric ? (await md.getAssets()).filter((a) => a.m[metric] != null) : [];
  const sorted = metric ? [...rows].sort((a, b) => (b.m[metric] as number) - (a.m[metric] as number)) : [];
  const articles = learn.filter((a) => [a.title, a.summary, ...a.body].join(' ').toLowerCase().includes(t.term.toLowerCase().replace(/ \(.*\)/, ''))).slice(0, 3);
  const idx = all.findIndex((x) => x.slug === t.slug);
  const [prev, next] = [all[idx - 1], all[idx + 1]];
  const screen = metric ? `/discover/screener?q=${encodeTree({ op: 'AND', rules: [{ field: metric, op: METRICS[metric].better === 'low' ? 'lte' : 'gte', value: '' }] })}` : null;
  return (
    <PageContainer className="max-w-[1000px]">
      <JsonLd data={[definedTerm(t, glossaryHref(t.slug)), breadcrumbs([['Resources', '/resources'], ['Glossary', '/resources/glossary'], [t.term]])]} />
      <PageHeader crumbs={[['Resources', '/resources'], ['Glossary', '/resources/glossary'], [t.term]]} title={t.term} lead={t.definition} />
      <div className="grid gap-4 md:grid-cols-2">
        {t.formula && <Panel title="Formula"><p className="num rounded-lg bg-soft px-3 py-2 text-[15px]">{t.formula}</p></Panel>}
        <Panel title="Why it matters"><p className="text-slate2">{t.why}</p></Panel>
      </div>
      {metric && sorted.length > 0 && (
        <Panel flush title={`${METRICS[metric].label} across covered assets`} sub={`${rows.length} assets report it`} footer={<ModuleFoot meta={freshest(rows)} more={screen ? ['Screen on this metric', screen] : undefined} />}>
          <div className="grid gap-px bg-line lg:grid-cols-2">
            <div className="bg-white"><p className="border-b border-line px-4 py-2 text-xs font-semibold text-faint">Highest</p><AssetTable rows={sorted.slice(0, 5)} columns={[metric]} initialSort={null} showStatus={false} actions={false} /></div>
            <div className="bg-white"><p className="border-b border-line px-4 py-2 text-xs font-semibold text-faint">Lowest</p><AssetTable rows={sorted.slice(-5).reverse()} columns={[metric]} initialSort={null} showStatus={false} actions={false} /></div>
          </div>
        </Panel>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {t.related.length > 0 && <Panel title="Related terms" flush><ul>{t.related.map((r) => <li key={r}><Link href={glossaryHref(termSlug(r))} className="row-link py-2.5 font-semibold">{r}</Link></li>)}</ul></Panel>}
        {articles.length > 0 && <Panel title="Learn more" flush><ul>{articles.map((a) => <li key={a.slug}><Link href={learnHref(a.slug)} className="row-link py-2.5"><span className="block font-semibold">{a.title}</span><span className="text-xs text-faint">{a.summary}</span></Link></li>)}</ul></Panel>}
      </div>
      <nav aria-label="More terms" className="flex flex-wrap justify-between gap-2">{prev ? <ButtonLink href={glossaryHref(prev.slug)}>← {prev.term}</ButtonLink> : <span />}<ButtonLink href="/resources/glossary" variant="ghost">All terms</ButtonLink>{next ? <ButtonLink href={glossaryHref(next.slug)}>{next.term} →</ButtonLink> : <span />}</nav>
    </PageContainer>
  );
}
