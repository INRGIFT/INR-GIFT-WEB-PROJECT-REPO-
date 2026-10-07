import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AnalyticsConsent } from '@/components/layout/analytics-consent';
import { LegalDocumentView } from '@/features/legal/legal-document';
import { pageMetadata } from '@/lib/seo';
import { getLegalDoc, getLegalDocs, getLegalUpdated } from '@/services/content';

/** Documents published under /legal/* (risk disclaimer, cookie policy, refund). Terms and Privacy have their own URLs. */
type Props = { params: Promise<{ doc: string }> };
const underLegal = async (slug: string) => { const d = await getLegalDoc(slug); return d && d.path === `/legal/${slug}` ? d : null; };
export async function generateStaticParams() { return (await getLegalDocs()).filter((d) => d.path.startsWith('/legal/')).map((d) => ({ doc: d.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await underLegal((await params).doc);
  return d ? pageMetadata({ title: d.title, description: d.summary, path: d.path }) : notFound();
}
export default async function LegalPage({ params }: Props) {
  const [d, updated] = await Promise.all([underLegal((await params).doc), getLegalUpdated()]);
  if (!d) notFound();
  const consent = d.slug === 'cookie-policy' ? <section aria-label="Analytics choice" className="rounded-card border border-line bg-white px-5 py-5 sm:px-6"><h2 className="mb-2 text-h4 font-bold">Your analytics choice</h2><AnalyticsConsent /></section> : undefined;
  return <LegalDocumentView doc={d} updated={updated} after={consent} />;
}
