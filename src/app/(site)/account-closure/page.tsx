import { Suspense } from 'react';
import { ComplianceForm } from '@/features/forms/compliance-form';
import { LegalShell } from '@/features/legal/legal-document';
import { COMPANY, LEGAL_PATHS } from '@/lib/company';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({ title: 'How to Close My Global Trading Account', description: 'How to request closure of your account: email support@inrgift.com from your registered email address, or submit the request form. The closure process takes 2 working days.', path: LEGAL_PATHS.accountClosure });

/*
 * Account-closure information required by the NSEIXGA white-label documentation (Section 3: hosted on the website and
 * publicly accessible). The title, process, checklist and residual-amount statement are the supplied text, reproduced
 * as given; they are third-party compliance wording and do not describe INRGIFT features. INRGIFT itself is research
 * only. The form below submits a request by email to support; it never closes or deletes anything itself.
 */
const CHECKLIST = [
  'Cleared any negative balance in the account',
  'Sold off any holdings in the account',
  'Withdrawn any cash balance from the account',
  'Downloaded all necessary reports (trade confirms, ledger, and P&L statements), as these will not be accessible once the account is closed',
  'If the customer wishes to move securities to another broker, transferred shares and cash prior to requesting account closure',
];
export default function AccountClosurePage() {
  return (
    <LegalShell title="How to Close My Global Trading Account" current={LEGAL_PATHS.accountClosure} crumbs={[['Home', '/'], ['Account Closure']]}>
      <article className="prose-doc rounded-card border border-line bg-white px-5 py-5 sm:px-6">
        <section>
          <h2>How to request closure</h2>
          <p>You can close your Global trading account by sending us an email request from your registered email address to <a className="link" href={`mailto:${COMPANY.supportEmail}?subject=${encodeURIComponent('INRGIFT Account Closure Request')}`}>{COMPANY.supportEmail}</a>. The closure process takes 2 working days once you submit your request.</p>
        </section>
        <section>
          <h2>Before closing the account</h2>
          <p>Before closing the account, ensure the customer has:</p>
          <ul>{CHECKLIST.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>
        <section>
          <h2>Residual amounts after closure</h2>
          <p>Upon submission of an account closure request, the client irrevocably agrees that residual amounts including, but not limited to, dividends, corporate action proceeds, or other entitlements arising from prior holdings and received post-closure will not be credited to the client account. Such amounts may be forfeited, and no claims shall lie against the Company in respect of the same.</p>
        </section>
      </article>
      <section aria-labelledby="closure-form" className="rounded-card border border-line bg-white px-5 py-5 sm:px-6">
        <h2 id="closure-form" className="text-h4 font-bold">Account closure request form</h2>
        <p className="mt-1 max-w-[72ch] text-[14px] text-slate2">Use this form or send the email described above. It submits a closure request to {COMPANY.supportEmail}; it does not close the account immediately. Use the email address registered on the account; support may reply to that address to confirm the request.</p>
        <div className="mt-4"><Suspense><ComplianceForm kind="account-closure" successTitle="Request submitted" successText="Your account closure request has been submitted. The closure process takes 2 working days once the request is submitted." /></Suspense></div>
      </section>
    </LegalShell>
  );
}
