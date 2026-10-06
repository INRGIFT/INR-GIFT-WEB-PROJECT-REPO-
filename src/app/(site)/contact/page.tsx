import { Suspense } from 'react';
import { PageContainer, PageHeader, Panel, SkeletonRows } from '@/components/ui/primitives';
import { ContactForm } from '@/features/site/contact-form';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbs, JsonLd } from '@/lib/structured-data';

export const metadata = pageMetadata({ title: 'Contact INRGIFT', description: 'Questions about data, your account, plans or partnerships. Write to the INRGIFT team.', path: '/contact' });
export default function ContactPage() {
  return (
    <PageContainer className="max-w-[1000px]">
      <JsonLd data={breadcrumbs([['Home', '/'], ['Contact']])} />
      <PageHeader crumbs={[['Home', '/'], ['Contact']]} title="Contact us" lead="We read every message. Data questions are fastest when they name the asset, the figure and where you saw it." />
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <Panel title="Send a message"><Suspense fallback={<SkeletonRows rows={6} />}><ContactForm /></Suspense></Panel>
        <aside className="space-y-3 text-[13px] text-slate2">
          <p className="font-semibold text-navy">Before you write</p>
          <p>Most answers are in the <a className="link" href="/faq">FAQ</a> and <a className="link" href="/support">support guides</a>.</p>
          <p>We cannot give investment advice or comment on whether to invest in any security.</p>
          <p>Grievances follow the process on the <a className="link" href="/legal/grievance">grievance page</a>.</p>
        </aside>
      </div>
    </PageContainer>
  );
}
