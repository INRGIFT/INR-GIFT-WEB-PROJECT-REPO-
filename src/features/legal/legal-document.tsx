import Link from 'next/link';
import { CompanyContact } from '@/components/layout/company-contact';
import { PageContainer, PageHeader } from '@/components/ui/primitives';
import { LEGAL_PATHS } from '@/lib/company';
import { cn } from '@/lib/format';
import { breadcrumbs, JsonLd } from '@/lib/structured-data';
import type { LegalDoc } from '@/services/content';
import type { ReactNode } from 'react';

/** Links shown beside every legal and compliance page. */
export const LEGAL_NAV: [string, string][] = [
  ['Terms and Conditions', LEGAL_PATHS.terms], ['Privacy Policy', LEGAL_PATHS.privacy], ['Risk Disclaimer', LEGAL_PATHS.risk],
  ['Cookie Policy', LEGAL_PATHS.cookies], ['Grievance Redressal', LEGAL_PATHS.grievance], ['Account Closure', LEGAL_PATHS.accountClosure],
  ['Refund Policy', '/legal/refund'], ['Open-source notices', LEGAL_PATHS.openSource], ['Support', LEGAL_PATHS.support],
];
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Two-column layout for legal and compliance pages: document navigation, then the content and the contact block. */
export function LegalShell({ title, lead, current, updated, crumbs, children }: { title: string; lead?: ReactNode; current: string; updated?: string; crumbs: [string, string?][]; children: ReactNode }) {
  return (
    <PageContainer className="max-w-[1100px]">
      <JsonLd data={breadcrumbs(crumbs)} />
      <PageHeader crumbs={crumbs} title={title} lead={<>{lead}{updated && <span className="mt-1 block text-[13px] text-faint">Last updated <time dateTime={updated}>{fmt(updated)}</time></span>}</>} />
      <div className="grid items-start gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Legal and support" className="md:sticky md:top-24">
          <ul className="space-y-0.5 text-[13px]">{LEGAL_NAV.map(([l, h]) => <li key={h}><Link href={h} aria-current={h === current ? 'page' : undefined} className={cn('block rounded-lg px-2.5 py-1.5', h === current ? 'bg-brand-soft font-semibold text-brand-ink' : 'text-slate2 hover:bg-hover hover:text-navy')}>{l}</Link></li>)}</ul>
          <CompanyContact compact social={false} className="mt-5 hidden rounded-card border border-line bg-white p-4 md:block" />
        </nav>
        <div className="min-w-0 space-y-4">
          {children}
          <CompanyContact social={false} className="rounded-card border border-line bg-white p-4 md:hidden" />
        </div>
      </div>
    </PageContainer>
  );
}

/** A legal document from the content service, rendered with semantic headings. */
export function LegalDocumentView({ doc, updated, after }: { doc: LegalDoc; updated: string; after?: ReactNode }) {
  const crumbs: [string, string?][] = doc.path.startsWith('/legal/') ? [['Home', '/'], ['Legal', '/legal'], [doc.title]] : [['Home', '/'], [doc.title]];
  return (
    <LegalShell title={doc.title} lead={doc.summary} current={doc.path} updated={updated} crumbs={crumbs}>
      <article className="prose-doc rounded-card border border-line bg-white px-5 py-5 sm:px-6">
        {doc.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
            {s.list && <ul>{s.list.map((li) => <li key={li}>{li}</li>)}</ul>}
            {s.preformatted && <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-line bg-soft px-4 py-3 font-mono text-[13px] leading-relaxed text-navy">{s.preformatted.join('\n')}</pre>}
            {s.links && <ul>{s.links.map((l) => <li key={l.href}><a href={l.href} className="link">{l.label}</a></li>)}</ul>}
          </section>
        ))}
      </article>
      {after}
    </LegalShell>
  );
}
