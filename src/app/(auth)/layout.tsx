import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandMark, Logo } from '@/components/brand/brand-logo';
import { hhmm } from '@/lib/format';
import { getMarkets } from '@/services/market-data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Two-column auth shell: navy brand panel with a live session read-out on the left, the form on the right. */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const markets = (await getMarkets()).filter((m) => ['us', 'uk', 'jp', 'in'].includes(m.id));
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-navy px-10 py-9 text-white lg:flex">
        <Link href="/" aria-label="INRGIFT home" className="self-start"><BrandMark lockup="stacked" tone="dark" height={144} decorative /></Link>
        <div>
          <p className="text-[13px] font-semibold text-[#9DB7FF]">Global market intelligence from India</p>
          <p className="mt-2 max-w-md font-display text-[34px] font-extrabold leading-[1.1]">Every market. Every asset. One research view.</p>
          <ul className="mt-6 space-y-2.5 text-[15px] text-white/80">
            {['Watchlists, alerts and notes that stay private to you', 'Screens and comparisons saved with a shareable link', 'Research and information only, never advice'].map((t) => <li key={t} className="flex gap-2.5"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron" />{t}</li>)}
          </ul>
        </div>
        <figure className="rounded-card border border-white/10 bg-white/[.04] p-4" aria-label="Trading sessions on India time">
          <figcaption className="mb-3 text-xs font-semibold text-white/60">Trading sessions on India time</figcaption>
          {markets.map((m) => {
            const segs = m.istClose < m.istOpen ? [[m.istOpen, 24], [0, m.istClose]] : [[m.istOpen, m.istClose]];
            return (
              <div key={m.id} className="mb-2 grid grid-cols-[110px_1fr_70px] items-center gap-3 text-xs last:mb-0">
                <span className="truncate text-white/80">{m.name}</span>
                <span className="relative h-2 rounded bg-white/10">{segs.map(([a, b], i) => <span key={i} className={`absolute inset-y-0 rounded ${m.session === 'OPEN' ? 'bg-[#5B8BFF]' : 'bg-white/25'}`} style={{ left: `${(a / 24) * 100}%`, width: `${((b - a) / 24) * 100}%` }} />)}</span>
                <span className="num text-right text-white/60">{hhmm(m.istOpen)} IST</span>
              </div>
            );
          })}
        </figure>
      </aside>
      <div className="flex min-w-0 flex-col bg-white">
        <div className="flex h-16 items-center justify-between px-5 sm:px-8"><span className="lg:hidden"><Logo /></span><span className="hidden lg:block" /><Link href="/" className="text-[13px] font-medium text-slate2 hover:text-navy">Back to INRGIFT</Link></div>
        <main id="main" className="flex flex-1 items-start justify-center px-5 pb-16 pt-6 sm:px-8 lg:items-center lg:pt-0">{children}</main>
        <p className="px-5 pb-5 text-center text-xs text-faint sm:px-8">INRGIFT is a research and information platform. It is not a broker or an investment adviser. <Link className="link" href="/terms-and-conditions">Terms and Conditions</Link> · <Link className="link" href="/privacy-policy">Privacy Policy</Link> · <Link className="link" href="/support">Support</Link></p>
      </div>
    </div>
  );
}
