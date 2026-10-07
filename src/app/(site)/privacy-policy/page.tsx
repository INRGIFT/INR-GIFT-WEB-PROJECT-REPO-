import { notFound } from 'next/navigation';
import { LegalDocumentView } from '@/features/legal/legal-document';
import { pageMetadata } from '@/lib/seo';
import { getLegalDoc, getLegalUpdated } from '@/services/content';

export const metadata = pageMetadata({ title: 'Privacy Policy', description: 'How INRGIFT collects, uses and protects personal information, the providers involved and your choices.', path: '/privacy-policy' });
export default async function Page() {
  const [doc, updated] = await Promise.all([getLegalDoc('privacy-policy'), getLegalUpdated()]);
  if (!doc) notFound();
  return <LegalDocumentView doc={doc} updated={updated} />;
}
