import { DASH } from '@/lib/format';
import { HeroMotion } from './hero-motion';
import { SessionCta } from './session-cta';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
/** ISO weekdays (1 = Monday) as a short range: [1..5] → "Mon–Fri". */
export function weekdays(days: number[]): string {
  const d = [...days].sort((a, b) => a - b);
  if (!d.length) return DASH;
  const contiguous = d.every((x, i) => i === 0 || x === d[i - 1] + 1);
  return contiguous && d.length > 2 ? `${DAYS[d[0] - 1]}–${DAYS[d[d.length - 1] - 1]}` : d.map((x) => DAYS[x - 1]).join(', ');
}

/**
 * The homepage hero: the brand, the two calls to action and the motion visual (src/features/home/hero-motion.tsx). It
 * shows no market values; the global market snapshot directly below carries the data, with status, source and time.
 */
export function HomeHero() {
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
          <div className="min-w-0 animate-fade-up [animation-delay:120ms]">
            <HeroMotion />
          </div>
        </div>
        <p className="mt-6 max-w-[90ch] text-[12.5px] text-white/50">INRGIFT is a research and information platform. It is not a broker, an exchange or an investment adviser; it does not execute transactions or hold client funds, and nothing here is a recommendation.</p>
      </div>
    </section>
  );
}
