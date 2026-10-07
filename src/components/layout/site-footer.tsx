import Link from 'next/link';
import { getLogoProvider } from '@/lib/logos';
import { BrandMark } from '@/components/brand/brand-logo';
import { CompanyContact } from '@/components/layout/company-contact';
import { COMPANY, LEGAL_PATHS } from '@/lib/company';

const COLS: [string, [string, string][]][] = [
  ['Product', [['Markets', '/markets'], ['Assets', '/assets'], ['Screener', '/discover/screener'], ['Heatmap', '/discover/heatmap'], ['Compare', '/discover/compare'], ['Research', '/research']]],
  ['Company', [['About', LEGAL_PATHS.about], ['Support', LEGAL_PATHS.support], ['Pricing', '/pricing'], ['FAQ', '/faq']]],
  ['Legal', [['Terms and Conditions', LEGAL_PATHS.terms], ['Privacy Policy', LEGAL_PATHS.privacy], ['Risk Disclaimer', LEGAL_PATHS.risk], ['Cookie Policy', LEGAL_PATHS.cookies], ['Grievance Redressal', LEGAL_PATHS.grievance], ['Account Closure', LEGAL_PATHS.accountClosure]]],
];
/** Site footer: brand, research-only disclaimer, navigation, legal links and the published contact details. */
export function SiteFooter() {
  const credit = getLogoProvider().attribution;
  return (
    <footer className="mt-10 border-t border-line bg-white pb-20 md:pb-0">
      <div className="mx-auto grid max-w-page gap-8 px-4 py-10 md:grid-cols-2 md:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)_1.3fr] lg:px-8">
        <div>
          <Link href="/" aria-label="INRGIFT home" className="inline-block"><BrandMark lockup="horizontal" height={72} decorative /></Link>
          <p className="mt-3 text-[13px] font-semibold uppercase tracking-[.18em] text-brand-ink">{COMPANY.tagline}</p>
          <p className="mt-1 max-w-xs text-slate2">{COMPANY.descriptor}.</p>
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-faint">INRGIFT is a research and information platform. It is not a broker, an exchange or an investment adviser, it does not execute transactions or hold client funds, and nothing here is a recommendation.</p>
        </div>
        {COLS.map(([title, links]) => (
          <nav key={title} aria-label={title}>
            <p className="mb-2 font-display text-[13px] font-bold">{title}</p>
            <ul className="space-y-1.5">{links.map(([l, h]) => <li key={h}><Link href={h} className="text-[13px] text-slate2 transition-colors hover:text-brand-ink">{l}</Link></li>)}</ul>
          </nav>
        ))}
        <CompanyContact compact />
      </div>
      <div className="border-t border-line"><p className="mx-auto max-w-page px-4 py-4 text-xs text-faint md:px-6 lg:px-8">© {new Date().getFullYear()} INRGIFT. Market data may be delayed. See each module for its status and timestamp.{credit && <> <a href={credit.href} className="underline hover:text-brand-ink">{credit.text}</a>.</>}</p></div>
    </footer>
  );
}
