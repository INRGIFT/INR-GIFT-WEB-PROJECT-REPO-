import Link from 'next/link';
import { getLogoProvider } from '@/lib/logos';
import { Logo } from './site-header';

const COLS: [string, [string, string][]][] = [
  ['Product', [['Markets', '/markets'], ['Assets', '/assets'], ['Screener', '/discover/screener'], ['Heatmap', '/discover/heatmap'], ['Compare', '/discover/compare'], ['Research', '/research']]],
  ['Resources', [['News', '/resources/news'], ['Calendar', '/resources/calendar'], ['Learn', '/resources/learn'], ['Glossary', '/resources/glossary'], ['Data and methodology', '/resources/data']]],
  ['Company', [['About', '/about'], ['Pricing', '/pricing'], ['FAQ', '/faq'], ['Support', '/support'], ['Contact', '/contact']]],
  ['Legal', [['Privacy', '/legal/privacy'], ['Terms', '/legal/terms'], ['Cookies', '/legal/cookies'], ['Risk disclosure', '/legal/risk-disclosure'], ['Refunds', '/legal/refund'], ['Grievance', '/legal/grievance']]],
];
export function SiteFooter() {
  const credit = getLogoProvider().attribution;
  return (
    <footer className="mt-10 border-t border-line bg-white pb-20 md:pb-0">
      <div className="mx-auto grid max-w-page gap-8 px-4 py-10 md:grid-cols-[1.6fr_repeat(4,1fr)] md:px-6 lg:px-8">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-slate2">Global markets, understood from India.</p>
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-faint">INRGIFT is a research and information platform. It is not a broker or an investment adviser and does not hold client funds. Nothing here is a recommendation.</p>
        </div>
        {COLS.map(([title, links]) => (
          <nav key={title} aria-label={title}>
            <p className="mb-2 font-display text-[13px] font-bold">{title}</p>
            <ul className="space-y-1.5">{links.map(([l, h]) => <li key={h}><Link href={h} className="text-[13px] text-slate2 transition-colors hover:text-brand-ink">{l}</Link></li>)}</ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line"><p className="mx-auto max-w-page px-4 py-4 text-xs text-faint md:px-6 lg:px-8">© {new Date().getFullYear()} INRGIFT. Market data may be delayed. See each module for its status and timestamp.{credit && <> <a href={credit.href} className="underline hover:text-brand-ink">{credit.text}</a>.</>}</p></div>
    </footer>
  );
}
