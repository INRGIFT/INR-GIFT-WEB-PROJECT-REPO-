import { AnalyticsConsent } from '@/components/layout/analytics-consent';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Callout, PageContainer, PageHeader } from '@/components/ui/primitives';
import { cn } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbs, JsonLd } from '@/lib/structured-data';
import { getLegalDoc, getLegalDocs } from '@/services/content';

type Props = { params: Promise<{ doc: string }> };
export async function generateStaticParams() { return (await getLegalDocs()).map((d) => ({ doc: d.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const d = await getLegalDoc((await params).doc); return d ? pageMetadata({ title: d.title, description: `${d.title} for INRGIFT, the global market research platform.`, path: `/legal/${d.slug}` }) : { title: 'Not found' }; }
export default async function LegalPage({ params }: Props) {
  const { doc } = await params;
  const [d, all] = await Promise.all([getLegalDoc(doc), getLegalDocs()]);
  if (!d) notFound();
  const [status, ...sections] = d.sections;
  return (
    <PageContainer className="max-w-[1000px]">
      <JsonLd data={breadcrumbs([['Home', '/'], ['Legal'], [d.title]])} />
      <PageHeader crumbs={[['Home', '/'], ['Legal'], [d.title]]} title={d.title} />
      <div className="grid items-start gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Legal documents" className="md:sticky md:top-24"><ul className="space-y-0.5 text-[13px]">{all.map((x) => <li key={x.slug}><Link href={`/legal/${x.slug}`} aria-current={x.slug === d.slug ? 'page' : undefined} className={cn('block rounded-lg px-2.5 py-1.5', x.slug === d.slug ? 'bg-brand-soft font-semibold text-brand-ink' : 'text-slate2 hover:bg-hover hover:text-navy')}>{x.title}</Link></li>)}</ul></nav>
        <div className="space-y-4">
          {status && <Callout tone="warn" title="Working draft">{status[1]}</Callout>}
          <article className="prose-doc rounded-card border border-line bg-white px-6 py-5">{sections.map(([h, body]) => <section key={h}><h2>{h}</h2><p>{body}</p></section>)}</article>
          {d.slug === 'cookies' && <section aria-label="Analytics choice" className="rounded-card border border-line bg-white px-6 py-5"><h2 className="mb-2 text-h4 font-bold">Your analytics choice</h2><AnalyticsConsent /></section>}
        </div>
      </div>
    </PageContainer>
  );
}
