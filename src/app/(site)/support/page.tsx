import Link from 'next/link';
import { Suspense } from 'react';
import { CompanyContact } from '@/components/layout/company-contact';
import { PageContainer, PageHeader } from '@/components/ui/primitives';
import { ComplianceForm } from '@/features/forms/compliance-form';
import { COMPANY, LEGAL_PATHS } from '@/lib/company';
import { pageMetadata } from '@/lib/seo';
import { breadcrumbs, JsonLd } from '@/lib/structured-data';

export const metadata = pageMetadata({ title: 'Support', description: 'Help with signing in, email verification, password reset, account security, data questions, technical issues, account closure, grievances and privacy requests.', path: LEGAL_PATHS.support });

const TOPICS: [string, React.ReactNode][] = [
  ['Signing in', <>Sign in with your email and password, or with Google if you used it before. If a sign-in fails, check the email address and try <Link className="link" href="/forgot-password">resetting your password</Link>.</>],
  ['Email verification', <>Your email must be verified before you can sign in. The link expires after one hour; request a new one from the <Link className="link" href="/verify">verification page</Link>, and check your spam folder.</>],
  ['Password reset', <>Use <Link className="link" href="/forgot-password">Forgot password</Link>. We email a link that works once and expires in one hour. Afterwards, other sessions are signed out.</>],
  ['Account security', <>Use a strong password you do not use elsewhere. If you think someone else used your account, reset your password at once and tell us using the form below.</>],
  ['Data and content questions', <>Every data module shows its status and a timestamp. If a figure looks wrong, tell us the asset, the figure and where you saw it.</>],
  ['Technical issues', <>Tell us your browser and device, the page address and what you expected to happen. Screenshots help; never include your password.</>],
  ['Account closure', <>See <Link className="link" href={LEGAL_PATHS.accountClosure}>How to close your account</Link>. You can email {COMPANY.supportEmail} from your registered address or use the request form there.</>],
  ['Grievances', <>For a formal complaint, use the <Link className="link" href={LEGAL_PATHS.grievance}>grievance redressal</Link> process.</>],
  ['Privacy requests', <>To access, correct or delete personal information, choose “Privacy request” below. The <Link className="link" href={LEGAL_PATHS.privacy}>Privacy Policy</Link> explains what we hold.</>],
  ['Legal requests', <>Choose “Legal request” below, or write to us at the address on this page. Our policies are listed under <Link className="link" href={LEGAL_PATHS.legal}>Legal</Link>.</>],
];
export default function SupportPage() {
  return (
    <PageContainer className="max-w-[1100px]">
      <JsonLd data={breadcrumbs([['Home', '/'], ['Support']])} />
      <PageHeader crumbs={[['Home', '/'], ['Support']]} title="Support" lead="Help with your INRGIFT account and the service. INRGIFT is a research and information platform; we cannot give investment advice." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="help-topics" className="rounded-card border border-line bg-white px-5 py-5 sm:px-6">
            <h2 id="help-topics" className="text-h4 font-bold">Help topics</h2>
            <dl className="mt-3 divide-y divide-line">{TOPICS.map(([t, d]) => <div key={t} className="py-3"><dt className="font-semibold text-navy">{t}</dt><dd className="mt-1 text-[14px] text-slate2">{d}</dd></div>)}</dl>
          </section>
          <section aria-labelledby="support-form" className="rounded-card border border-line bg-white px-5 py-5 sm:px-6">
            <h2 id="support-form" className="text-h4 font-bold">Contact support</h2>
            <p className="mt-1 text-[14px] text-slate2">We reply by email. Fields marked optional can be left empty.</p>
            <div className="mt-4"><Suspense><ComplianceForm kind="support" successTitle="Message sent" successText={`Your message has been sent to ${COMPANY.supportEmail}. We will reply to the email address you gave.`} /></Suspense></div>
          </section>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24">
          <CompanyContact title="Contact INRGIFT" className="rounded-card border border-line bg-white p-5" />
          <nav aria-label="Policies" className="rounded-card border border-line bg-white p-5 text-[14px]">
            <p className="mb-2 font-display font-bold text-navy">Policies</p>
            <ul className="space-y-1.5">{[['Terms and Conditions', LEGAL_PATHS.terms], ['Privacy Policy', LEGAL_PATHS.privacy], ['Risk Disclaimer', LEGAL_PATHS.risk], ['Grievance Redressal', LEGAL_PATHS.grievance], ['Account Closure', LEGAL_PATHS.accountClosure]].map(([l, h]) => <li key={h}><Link className="link" href={h}>{l}</Link></li>)}</ul>
          </nav>
        </aside>
      </div>
    </PageContainer>
  );
}
