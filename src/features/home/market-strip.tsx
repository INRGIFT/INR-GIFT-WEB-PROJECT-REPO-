import { ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { DataStatus, StatusBadge } from '@/components/ui/data-status';
import { Change } from '@/components/ui/primitives';
import { cn, num } from '@/lib/format';
import { assetHref } from '@/lib/routes';
import type { Asset } from '@/lib/types';
import { pricePrecisionFor } from '@/services/chart-data';
import { freshest } from '@/services/market-data';
import type { HomeSnapshot } from './snapshot';

/** What a value is measured in, in words: never a currency the source did not quote. */
export function unitOf(a: Asset): string {
  if (a.cls === 'index') return 'Index points';
  if (a.cls === 'fx' && a.fx) return `${a.fx.quote} per ${a.fx.base}`;
  if (a.cls === 'commodity' && a.commodity) return a.commodity.unit;
  if (a.cls === 'bond') return a.m.yield != null ? `Yield ${num(a.m.yield, 2)}% · ${a.currency}` : a.currency;
  return `${a.symbol} · ${a.currency}`;
}
function Row({ a, dominant }: { a: Asset; dominant: Asset['status'] | null }) {
  const dp = pricePrecisionFor(a);
  const change = a.price != null && a.prevClose != null ? a.price - a.prevClose : null;
  return (
    <li>
      <Link href={assetHref(a)} title={a.name} className="group block rounded-lg px-2 py-2.5 transition-colors duration-micro hover:bg-bg">
        <span className="flex items-start justify-between gap-3">
          <span className="line-clamp-2 min-w-0 text-[13.5px] font-semibold leading-snug text-navy group-hover:text-brand-ink">{a.name}</span>
          <span className="num shrink-0 text-[14px] font-semibold text-navy">{num(a.price, dp)}</span>
        </span>
        <span className="mt-0.5 flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-[11.5px] text-faint">{unitOf(a)}{a.exchange && !unitOf(a).includes(a.exchange) ? ` · ${a.exchange}` : ''}</span>
          <span className="num shrink-0 text-[11.5px]">
            {change != null && <span className={cn('mr-1.5', change > 0 ? 'text-up' : change < 0 ? 'text-down' : 'text-slate2')}>{change > 0 ? '+' : change < 0 ? '−' : ''}{num(Math.abs(change), dp)}</span>}
            <Change value={a.m.d1} />
          </span>
        </span>
        {a.status !== dominant && <StatusBadge status={a.status} className="mt-1" />}
      </Link>
    </li>
  );
}

/**
 * The global market strip under the hero: indices, equities, FX, commodities, bonds and ETFs, each in its own
 * currency or unit, with the module's status and exact time. Demo values say so; nothing here ever reads "Live"
 * unless a licensed real-time source says it is. When public display is off, the strip says where prices are.
 */
export function MarketStrip({ snap }: { snap: HomeSnapshot }) {
  const groups = snap.strip.ok ? snap.strip.value : [];
  const rows = groups.flatMap((g) => g.rows);
  const meta = freshest(rows);
  return (
    <section aria-labelledby="strip-title" className="border-b border-line bg-white">
      <div className="mx-auto max-w-wide px-4 py-10 md:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <h2 id="strip-title" className="eyebrow flex items-center gap-3 text-brand-ink"><span aria-hidden className="h-px w-7 bg-saffron" />Global market snapshot</h2>
            <p className="mt-2 text-[14px] text-slate2">Indices, equities, FX, commodities, bonds and ETFs, each in its own currency or unit.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {meta && <DataStatus meta={meta} />}
            {meta && <span className="text-xs text-faint">Source: {meta.source}</span>}
            <Link href="/markets" className="group inline-flex items-center gap-1 text-[13px] font-semibold text-brand-ink">All markets<ArrowRight size={14} aria-hidden className="transition-transform duration-micro group-hover:translate-x-0.5" /></Link>
          </div>
        </div>
        {snap.mode === 'off' ? (
          <p className="mt-6 flex items-center gap-2 rounded-card border border-line bg-bg px-4 py-4 text-[14px] text-slate2"><Lock size={16} aria-hidden className="text-faint" />Prices are shown to signed-in members. <Link href="/markets" className="link">Sign in to see markets</Link></p>
        ) : !snap.strip.ok || !groups.length ? (
          <p role="status" className="mt-6 rounded-card border border-line bg-bg px-4 py-4 text-[14px] text-slate2">The market snapshot could not load just now. Nothing is estimated in its place; the rest of the page is not affected.</p>
        ) : (
          <>
            <div data-nosnippet className="scrollbar-none -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-x-0 lg:gap-y-6 lg:overflow-visible lg:px-0 xl:grid-cols-6">
              {groups.map((g, i) => (
                <div key={g.label} className={cn('w-[256px] shrink-0 snap-start rounded-card border border-line p-2 lg:w-auto lg:rounded-none lg:border-0 lg:py-0', i === 0 ? 'lg:pl-0 lg:pr-3' : i === 3 ? 'lg:pl-0 lg:pr-3 xl:border-l xl:pl-3' : 'lg:border-l lg:px-3')}>
                  <h3 className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[.16em] text-faint"><Link href={g.href} className="hover:text-brand-ink">{g.label}</Link></h3>
                  <ul>{g.rows.map((a) => <Row key={a.id} a={a} dominant={meta?.dataStatus ?? null} />)}</ul>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
