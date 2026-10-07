import Link from 'next/link';
import { LegalShell } from '@/features/legal/legal-document';
import { LEGAL_PATHS } from '@/lib/company';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({ title: 'Legal', description: 'INRGIFT terms, privacy policy, risk disclaimer, cookie notice, grievance redressal and account closure.', path: '/legal' });
const DOCS: [string, string, string][] = [
  ['Terms and Conditions', LEGAL_PATHS.terms, 'The terms that apply when you use INRGIFT.'],
  ['Privacy Policy', LEGAL_PATHS.privacy, 'What we collect, why, who processes it and your choices.'],
  ['Risk and Research Disclaimer', LEGAL_PATHS.risk, 'INRGIFT is research and information only and guarantees no outcome.'],
  ['Cookie and Tracking Notice', LEGAL_PATHS.cookies, 'The cookies and browser storage we use, and your analytics choice.'],
  ['Grievance Redressal', LEGAL_PATHS.grievance, 'How to raise a complaint and what happens next.'],
  ['Account Closure', LEGAL_PATHS.accountClosure, 'How to close your account.'],
  ['Refund Policy', '/legal/refund', 'INRGIFT is free today; no charges to refund.'],
  ['Support', LEGAL_PATHS.support, 'Help with sign-in, your account, data and technical issues.'],
];
export default function LegalIndex() {
  return (
    <LegalShell title="Legal" lead="Policies and notices for INRGIFT, a global market research and intelligence platform." current="/legal" crumbs={[['Home', '/'], ['Legal']]}>
      <ul className="grid gap-3 sm:grid-cols-2">{DOCS.map(([t, h, d]) => (
        <li key={h}><Link href={h} className="block h-full rounded-card border border-line bg-white p-4 transition-colors hover:border-brand"><span className="font-bold text-navy">{t}</span><span className="mt-1 block text-[14px] text-slate2">{d}</span></Link></li>
      ))}</ul>
    </LegalShell>
  );
}
