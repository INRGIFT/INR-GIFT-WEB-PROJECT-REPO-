import Link from 'next/link';
import { SESSION_LABEL } from '@/lib/calendar';
import { cn, hhmm } from '@/lib/format';
import { directoryHref, marketHref } from '@/lib/routes';
import type { AssetClass, MarketView } from '@/lib/types';
import { HomeSection, SectionHeading } from './home-ui';
import { SessionCta } from './session-cta';
import type { HomeSnapshot } from './snapshot';

/** Regions in the order their trading day reaches India time: India first, then the sun westwards. */
export const REGIONS: { label: string; test: (m: MarketView) => boolean }[] = [
  { label: 'India', test: (m) => m.countryCode === 'IN' },
  { label: 'Asia-Pacific', test: (m) => m.region === 'Asia-Pacific' && m.countryCode !== 'IN' },
  { label: 'Middle East & Africa', test: (m) => m.region === 'Middle East' || m.region === 'Africa' },
  { label: 'Europe', test: (m) => m.region === 'Europe' },
  { label: 'Americas', test: (m) => m.region === 'North America' || m.region === 'Latin America' },
];
type Span = [number, number];
/** A market's regular session as IST spans on a 0–24 axis (a session crossing midnight IST becomes two spans). */
export const spansOf = (m: Pick<MarketView, 'istOpen' | 'istClose'>): Span[] => (m.istClose < m.istOpen ? [[m.istOpen, 24], [0, m.istClose]] : [[m.istOpen, m.istClose]]);
/** Union of spans, sorted and merged, so a region bar shows when any of its markets is in its regular session. */
export function unionSpans(spans: Span[]): Span[] {
  const out: Span[] = [];
  for (const [a, b] of [...spans].sort((x, y) => x[0] - y[0])) {
    const last = out[out.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b); else out.push([a, b]);
  }
  return out;
}
export function istHours(iso: string): { hours: number; label: string } {
  const label = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
  return { hours: Number(label.slice(0, 2)) + Number(label.slice(3)) / 60, label };
}
function MarketLists({ regions }: { regions: { label: string; markets: MarketView[] }[] }) {
  return (
    <>
      {regions.map((r) => (
        <div key={r.label} className="bg-white px-5 py-5">
          <h4 className="text-[11px] font-semibold uppercase tracking-[.16em] text-faint">{r.label}</h4>
          <ul className="mt-3 space-y-1.5">
            {r.markets.map((m) => (
              <li key={m.id}>
                <Link href={marketHref(m.slug)} className="group flex items-baseline justify-between gap-2 text-[13px]">
                  <span className="truncate text-navy group-hover:text-brand-ink"><span aria-hidden className={cn('mr-1.5 text-[9px]', m.session === 'OPEN' ? 'text-brand' : 'text-faint')}>{m.session === 'OPEN' ? '●' : '○'}</span>{m.name}</span>
                  <span className={cn('num shrink-0 text-[11.5px]', m.session === 'OPEN' ? 'text-navy' : 'text-faint')}>{SESSION_LABEL[m.session]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
const CLASSES: [AssetClass, string][] = [['stock', 'Stocks'], ['etf', 'ETFs'], ['index', 'Indices'], ['fx', 'Currencies'], ['commodity', 'Commodities'], ['bond', 'Bonds'], ['reit', 'REITs']];
const pctOf = (h: number) => `${(h / 24) * 100}%`;

/**
 * "Every market. Every asset. One research view." The trading day on India time: one bar per region (the union of its
 * markets' regular sessions, from each exchange's calendar), the current time, and every covered market with its
 * session state. Sessions are reference data from calendars, not prices, so they show whatever the data mode.
 */
export function WorldMarkets({ snap }: { snap: HomeSnapshot }) {
  const markets = snap.markets.ok ? snap.markets.value : [];
  const now = istHours(snap.at);
  const regions = REGIONS.map((r) => ({ ...r, markets: markets.filter(r.test) })).filter((r) => r.markets.length);
  const openNow = markets.filter((m) => m.session === 'OPEN').length;
  return (
    <HomeSection id="coverage" surface="tint">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
        <SectionHeading id="coverage" eyebrow="Global coverage" title={<>Every market. Every asset.<br className="hidden sm:block" /> One research view.</>}
          lead="Exchanges across India, Asia-Pacific, the Middle East, Africa, Europe and the Americas. Every session is read on India time, with the exchange's own calendar, holidays and currency." />
        <nav aria-label="Asset classes" data-reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-faint">Asset classes</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {CLASSES.map(([cls, label]) => <li key={cls}><Link href={directoryHref(cls)} className="inline-flex h-9 items-center rounded-full border border-line2 bg-white px-4 text-[13.5px] font-medium text-navy transition-colors duration-micro hover:border-brand hover:text-brand-ink">{label}</Link></li>)}
          </ul>
        </nav>
      </div>

      {!snap.markets.ok || !regions.length ? (
        <p role="status" className="mt-12 rounded-card border border-line bg-white px-5 py-6 text-[14px] text-slate2">Market sessions could not load just now. Nothing is estimated in their place.</p>
      ) : (
        <div data-reveal className="mt-12 rounded-card border border-line bg-white shadow-card">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-5 py-4 md:px-7">
            <h3 className="font-display text-[17px] font-bold">The trading day on India time</h3>
            <p className="text-[13px] text-slate2"><span className="num font-semibold text-navy">{now.label} IST</span> · {openNow === 1 ? '1 market' : `${openNow} markets`} in regular session now</p>
          </div>
          <div className="px-5 pb-6 pt-5 md:px-7">
            {/* Axis */}
            <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-4 sm:grid-cols-[150px_minmax(0,1fr)_88px]">
              <span />
              <div aria-hidden className="relative h-5 text-[11px] text-faint">
                {[0, 6, 12, 18, 24].map((h) => <span key={h} className={cn('num absolute', h === 0 ? '' : h === 24 ? '-translate-x-full' : '-translate-x-1/2', (h === 6 || h === 18) && 'hidden sm:inline')} style={{ left: pctOf(h) }}>{String(h % 24).padStart(2, '0')}:00</span>)}
              </div>
              <span className="hidden sm:block" />
            </div>
            <ul className="space-y-3">
              {regions.map((r) => {
                const open = r.markets.filter((m) => m.session === 'OPEN').length;
                const spans = unionSpans(r.markets.flatMap(spansOf));
                return (
                  <li key={r.label} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-x-4 sm:grid-cols-[150px_minmax(0,1fr)_88px]">
                    <span className="text-[13px] font-semibold leading-tight text-navy sm:text-[13.5px]">{r.label}</span>
                    <span className="relative block h-6 rounded-md bg-hover">
                      {spans.map(([a, b], i) => <span key={i} aria-hidden className={cn('absolute inset-y-1 rounded', open ? 'bg-brand' : 'bg-line2')} style={{ left: pctOf(a), width: pctOf(b - a) }} />)}
                      <span aria-hidden className="absolute -inset-y-1.5 w-0.5 rounded bg-saffron" style={{ left: pctOf(now.hours) }} />
                      <span className="sr-only">Regular sessions {spans.map(([a, b]) => `${hhmm(a)} to ${hhmm(b)}`).join(' and ')} IST.</span>
                    </span>
                    <span className={cn('col-start-2 text-[12px] sm:col-start-auto sm:text-right', open ? 'font-semibold text-navy' : 'text-faint')}>{open} of {r.markets.length} open</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-5 text-[12px] text-faint">Bars span the regular trading hours of each region's markets, converted to India Standard Time; the saffron line marks now. Holidays, half days and breaks come from each exchange's calendar.</p>
          </div>
          {/* Every covered market by region: a grid from sm up; on phones the same list sits behind one disclosure. */}
          <div className="hidden gap-px overflow-hidden rounded-b-card border-t border-line bg-line sm:grid sm:grid-cols-2 lg:grid-cols-5"><MarketLists regions={regions} /></div>
          <details className="group border-t border-line sm:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[14px] font-semibold text-navy [&::-webkit-details-marker]:hidden">All {markets.length} markets by region<span aria-hidden className="text-faint transition-transform duration-micro group-open:rotate-45">+</span></summary>
            <div className="grid gap-px border-t border-line bg-line"><MarketLists regions={regions} /></div>
          </details>
        </div>
      )}
      <div data-reveal className="mt-10 flex flex-wrap items-center gap-3">
        <SessionCta out={['Explore Markets', '/markets']} inside={['Explore Markets', '/markets']} arrow />
        <p className="text-[13px] text-slate2">Prices stay in their own currency; read them in rupees when you choose.</p>
      </div>
    </HomeSection>
  );
}
