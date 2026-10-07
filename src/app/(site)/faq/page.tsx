import Link from 'next/link';
import { PageContainer, PageHeader } from '@/components/ui/primitives';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbs, faqPage, JsonLd } from '@/lib/structured-data';
import { getFaq } from '@/services/content';

export const metadata = pageMetadata({ title: 'Frequently asked questions', description: 'Answers about INRGIFT accounts, data freshness, market coverage, research and privacy.', path: '/faq' });
export default async function FaqPage() {
  const faq = await getFaq();
  const cats = [...new Set(faq.map((f) => f.category))];
  return (
    <PageContainer className="max-w-[860px]">
      <JsonLd data={[faqPage(faq), breadcrumbs([['Home', '/'], ['FAQ']])]} />
      <PageHeader crumbs={[['Home', '/'], ['FAQ']]} title="Frequently asked questions" lead={<>Can’t find it here? <Link className="link" href="/support">Visit support</Link> or <Link className="link" href="/support#support-form">contact us</Link>.</>} />
      {cats.map((c) => (
        <section key={c}>
          <h2 className="mb-2 text-lg font-bold">{c}</h2>
          <div className="divide-y divide-line rounded-card border border-line bg-white">
            {faq.filter((f) => f.category === c).map((f) => (
              <details key={f.q} className="group px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{f.q}<span aria-hidden className="text-faint transition-transform duration-micro group-open:rotate-45">+</span></summary>
                <p className="mt-2 max-w-[70ch] text-slate2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </PageContainer>
  );
}
