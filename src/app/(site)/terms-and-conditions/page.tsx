import { notFound } from 'next/navigation';
import { LegalDocumentView } from '@/features/legal/legal-document';
import { pageMetadata } from '@/lib/seo';
import { getLegalDoc, getLegalUpdated } from '@/services/content';

export const metadata = pageMetadata({ title: 'Terms and Conditions', description: 'The terms that apply when you use INRGIFT, a global market research and intelligence platform.', path: '/terms-and-conditions' });
export default async function Page() {
  const [doc, updated] = await Promise.all([getLegalDoc('terms-and-conditions'), getLegalUpdated()]);
  if (!doc) notFound();
  return <LegalDocumentView doc={doc} updated={updated} />;
}
