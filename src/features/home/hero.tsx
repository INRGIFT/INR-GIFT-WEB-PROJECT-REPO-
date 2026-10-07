import { LineChart, Lock } from 'lucide-react';
import { STATUS_LABEL } from '@/components/ui/data-status';
import { FinancialChart } from '@/features/charts/financial-chart';
import { SESSION_LABEL } from '@/lib/calendar';
import { cn, DASH, hhmm, num, pct, priceDp } from '@/lib/format';
import { DemoNote } from './home-ui';
import { SessionCta } from './session-cta';
import type { HeroSnapshot, HomeSnapshot } from './snapshot';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
/** ISO weekdays (1 = Monday) as a short range: [1..5] → "Mon–Fri". */
export function weekdays(days: number[]): string {
  const d = [...days].sort((a, b) => a - b);
  if (!d.length) return DASH;
  const contiguous = d.every((x, i) => i === 0 || x === d[i - 1] + 1);
  return contiguous && d.length > 2 ? `${DAYS[d[0] - 1]}–${DAYS[d[d.length - 1] - 1]}` : d.map((x) => DAYS[x - 1]).join(', ');
}

/** The six facts under the hero chart, all from the same snapshot as the chart (status, session, calendar, metrics). */
export function heroFacts(h: HeroSnapshot, mode: HomeSnapshot['mode']): { label: string; value: string; sub: string; glyph?: string }[] {
  const { asset, market } = h;
  const year = h.series.find((s) => s.range === '1Y') ?? h.series[0];
  const lows = year.bars.map((b) => b.l), highs = year.bars.map((b) => b.h);
  const lo = Math.min(...lows), hi = Math.max(...highs);
  const ex = market?.exchanges.find((e) => e.mic === asset.mic) ?? market?.exchanges[0];
  const open = market?.session === 'OPEN';
  return [
    { label: 'Market status', glyph: open ? '●' : '○', value: market ? (market.session === 'HOLIDAY' ? `Holiday${market.holidayName ? `: ${market.holidayName}` : ''}` : SESSION_LABEL[market.session]) : 'No single session', sub: market ? `${market.name} · ${market.localTime} local time` : 'Reference rate' },
    { label: 'Exchange', value: asset.exchange, sub: `${asset.mic} · ${asset.country}` },
    { label: 'Currency', value: asset.currency, sub: year.unit === 'points' ? 'Index points, as published' : 'As quoted, never converted' },
    { label: 'Data source', value: mode === 'demo' ? 'Demo provider' : year.source, sub: mode === 'demo' ? 'Simulated values, labelled DEMO' : STATUS_LABEL[year.status] },
    { label: 'Session', value: market ? `${hhmm(market.istOpen)}–${hhmm(market.istClose)} IST` : DASH, sub: ex ? `${weekdays(ex.tradingDays)} · ${ex.open}–${ex.close} ${ex.timezone}` : 'No exchange session' },
    { label: 'Research snapshot', value: asset.m.y1 != null ? `1Y ${asset.m.y1 > 0 ? '▲' : asset.m.y1 < 0 ? '▼' : ''} ${pct(asset.m.y1)}` : '1Y —', sub: `52-week range ${num(lo, priceDp(lo))}–${num(hi, priceDp(hi))}${asset.m.volatility != null ? ` · 30-day volatility ${num(asset.m.volatility, 1)}%` : ''}` },
  ];
}

export function HomeHero({ snap }: { snap: HomeSnapshot }) {
  const hero = snap.hero.ok ? snap.hero.value : null;
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-navy text-white">
      {/* Longitude lines and a horizon: the only decoration, drawn in CSS, nothing to download. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px)] [background-size:calc(100%/12)_100%]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-white/10" />
      <div className="mx-auto max-w-wide px-4 pb-14 pt-14 md:px-6 md:pt-20 lg:px-8 lg:pb-16">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-16">
          <div className="animate-fade-up">
            <p className="eyebrow flex items-center gap-3 text-ice"><span aria-hidden className="h-px w-7 bg-saffron" />Global market intelligence from India</p>
            <h1 id="hero-title" className="mt-6 font-display text-[54px] font-extrabold uppercase leading-[.92] tracking-[-0.02em] sm:text-[76px] xl:text-[92px]">
              <span className="block">Invest</span><span className="block">beyond</span><span className="block">borders<span className="text-saffron">.</span></span>
            </h1>
            <p className="mt-7 max-w-[36ch] text-[18px] leading-relaxed text-white/80 md:text-[19px]">One research view for global markets, assets, companies and financial intelligence.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SessionCta out={['Explore Markets', '/markets']} inside={['Explore Markets', '/markets']} arrow />
              <SessionCta out={['Get Started', '/signup']} inside={['Open Your Workspace', '/app']} variant="inverse" />
            </div>
            <p className="mt-5 text-[14px] font-medium tracking-wide text-white/70">Research-first. Global by design.</p>
          </div>
          <div className="min-w-0 animate-fade-up [animation-delay:120ms]" data-nosnippet>
            {hero ? (
              <FinancialChart instrument={{ idOrSlug: hero.asset.slug, symbol: hero.asset.symbol, name: hero.asset.name }} preloaded={hero.series} defaultRange={hero.defaultRange} fetchable={false} variant="hero" height={300} className="text-navy shadow-pop" />
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-card border border-white/10 bg-white/[.03] px-8 text-center">
                {snap.mode === 'off' ? <Lock size={26} aria-hidden className="text-ice" /> : <LineChart size={26} aria-hidden className="text-ice" />}
                <p className="mt-4 font-display text-[20px] font-bold">{snap.mode === 'off' ? 'Market charts open after sign-in' : 'The market preview could not load'}</p>
                <p className="mt-2 max-w-[44ch] text-[14px] text-white/70">{snap.mode === 'off' ? 'Prices and charts are shown to signed-in members under INRGIFT’s data licences.' : 'Nothing is estimated in its place. The rest of the page is not affected; markets are one sign-in away.'}</p>
              </div>
            )}
          </div>
        </div>
        {hero && (
          <div className="mt-12 lg:mt-14" data-nosnippet>
            <dl aria-label={`${hero.asset.name} at a glance`} className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-white/10 bg-white/10 md:grid-cols-3 xl:grid-cols-6">
              {heroFacts(hero, snap.mode).map((f) => (
                <div key={f.label} className="min-w-0 bg-navy px-4 py-5">
                  <dt className="text-[11px] font-semibold uppercase tracking-[.16em] text-white/55">{f.label}</dt>
                  <dd className="mt-2 font-display text-[17px] font-bold leading-snug text-white">{f.glyph && <span aria-hidden className={cn('mr-1.5 text-[11px]', f.glyph === '●' ? 'text-ice' : 'text-white/50')}>{f.glyph}</span>}{f.value}</dd>
                  <dd className="mt-1 text-[12.5px] leading-snug text-white/60">{f.sub}</dd>
                </div>
              ))}
            </dl>
            {snap.mode === 'demo' && <DemoNote tone="dark" className="mt-4" />}
          </div>
        )}
        <p className="mt-6 max-w-[90ch] text-[12.5px] text-white/50">INRGIFT is a research and information platform. It is not a broker, an exchange or an investment adviser; it does not execute transactions or hold client funds, and nothing here is a recommendation.</p>
      </div>
    </section>
  );
}
