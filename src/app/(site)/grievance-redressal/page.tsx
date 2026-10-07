import Link from 'next/link';
import { Suspense } from 'react';
import { ComplianceForm } from '@/features/forms/compliance-form';
import { LegalShell } from '@/features/legal/legal-document';
import { ADDRESS_ONE_LINE, COMPANY, LEGAL_PATHS } from '@/lib/company';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({ title: 'Grievance Redressal', description: 'How to raise a grievance with INRGIFT: who can submit, how to submit, and what happens after you do.', path: LEGAL_PATHS.grievance });

/** Formal grievance mechanism. No officer name, statutory designation or response deadline is stated: none has been supplied. */
export default function GrievancePage() {
  return (
    <LegalShell title="Grievance Redressal" lead="A formal route for complaints about INRGIFT, its service or how we handled your information." current={LEGAL_PATHS.grievance} crumbs={[['Home', '/'], ['Grievance Redressal']]}>
      <article className="prose-doc rounded-card border border-line bg-white px-5 py-5 sm:px-6">
        <section>
          <h2>Purpose</h2>
          <p>This mechanism lets you raise a grievance about INRGIFT: access to your account, the accuracy of data or content, the availability of the service, how we handle personal data, or how an earlier support request was handled. INRGIFT is a research and information platform; it does not execute transactions or hold funds.</p>
        </section>
        <section>
          <h2>Who can submit</h2>
          <p>Anyone affected by INRGIFT can submit a grievance: account holders, people who have tried to create an account, and people whose personal data we may hold.</p>
        </section>
        <section>
          <h2>How to submit</h2>
          <ul>
            <li>Use the grievance form below, or</li>
            <li>email <a className="link" href={`mailto:${COMPANY.supportEmail}?subject=${encodeURIComponent('INRGIFT Grievance')}`}>{COMPANY.supportEmail}</a> with the subject “Grievance”, or</li>
            <li>write to {ADDRESS_ONE_LINE}.</li>
          </ul>
          <p>Include your name, the email address registered with INRGIFT (if any), a phone number, what happened and when, and the outcome you are asking for. Never send your password.</p>
        </section>
        <section>
          <h2>What happens next</h2>
          <p>When you submit the form, you receive a reference number on screen at once. Your grievance is sent to the INRGIFT support team, who review it and reply to the email address you gave, using that reference. If we need more information we will ask you by email.</p>
          <p>If you are not satisfied with the response, reply to that email and ask for your grievance to be reviewed again, quoting the reference. For questions that are not grievances, use <Link className="link" href={LEGAL_PATHS.support}>Support</Link>.</p>
        </section>
      </article>
      <section aria-labelledby="grievance-form" className="rounded-card border border-line bg-white px-5 py-5 sm:px-6">
        <h2 id="grievance-form" className="text-h4 font-bold">Grievance form</h2>
        <p className="mt-1 text-[14px] text-slate2">All fields except the reference ID are required. See the <Link className="link" href={LEGAL_PATHS.privacy}>Privacy Policy</Link> for how we use these details.</p>
        <div className="mt-4"><Suspense><ComplianceForm kind="grievance" successTitle="Grievance submitted" successText="Your grievance has been submitted to the INRGIFT support team. We will reply to the email address you gave, quoting the reference below." /></Suspense></div>
      </section>
    </LegalShell>
  );
}
