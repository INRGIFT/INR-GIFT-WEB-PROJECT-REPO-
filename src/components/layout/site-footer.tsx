import Link from 'next/link';
import { BrandMark } from '@/components/brand/brand-logo';
import { CompanyContact } from '@/components/layout/company-contact';
import { COMPANY, LEGAL_PATHS } from '@/lib/company';
import { getLogoProvider } from '@/lib/logos';

/** Footer columns. Product and Account pages are behind sign-in; Support, Legal and Company pages are public. */
export const FOOTER_COLUMNS: [string, [string, string][]][] = [
  ['Product', [['Markets', '/markets'], ['Discover', '/discover'], ['Screeners', '/discover/screener'], ['Compare', '/discover/compare'], ['Research', '/research'], ['News', '/resources/news']]],
  ['Account', [['Profile', '/account/profile'], ['Security', '/account/security'], ['Sessions', '/account/sessions'], ['Preferences', '/account/settings']]],
  ['Support', [['Support', LEGAL_PATHS.support], ['Grievance Redressal', LEGAL_PATHS.grievance], ['Account Closure', LEGAL_PATHS.accountClosure]]],
  ['Legal', [['Terms and Conditions', LEGAL_PATHS.terms], ['Privacy Policy', LEGAL_PATHS.privacy], ['Legal', LEGAL_PATHS.legal], ['Risk Disclaimer', LEGAL_PATHS.risk], ['Cookie Policy', LEGAL_PATHS.cookies], ['Open-source notices', LEGAL_PATHS.openSource]]],
  ['Company', [['About', LEGAL_PATHS.about]]],
];

/** Site footer: brand, the research-only statement, five link columns and the published contact details only (no phone unless SUPPORT_PHONE is set). */
export function SiteFooter() {
  const credit = getLogoProvider().attribution;
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-page px-4 pb-10 pt-16 md:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <div>
            <Link href="/" aria-label="INRGIFT home" className="inline-block"><BrandMark lockup="horizontal" height={64} decorative /></Link>
            <p className="mt-4 text-[12px] font-semibold uppercase tracking-[.2em] text-brand-ink">{COMPANY.descriptor}</p>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-slate2">INRGIFT is a research and information platform. It is not a broker, an exchange or an investment adviser; it does not execute transactions or hold client funds, and nothing on it is a recommendation.</p>
            <CompanyContact compact title={null} className="mt-6" />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 xl:grid-cols-5">
            {FOOTER_COLUMNS.map(([title, links]) => (
              <nav key={title} aria-label={title}>
                <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-faint">{title}</p>
                <ul className="mt-4 space-y-2.5">{links.map(([l, h]) => <li key={h}><Link href={h} className="text-[13.5px] text-slate2 transition-colors hover:text-brand-ink">{l}</Link></li>)}</ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-xs text-faint md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} INRGIFT. {COMPANY.tagline}.</p>
          <p>Every data module shows its source, status and time. Demo data is labelled as demo.{credit && <> <a href={credit.href} className="underline hover:text-brand-ink">{credit.text}</a>.</>}</p>
        </div>
      </div>
    </footer>
  );
}
