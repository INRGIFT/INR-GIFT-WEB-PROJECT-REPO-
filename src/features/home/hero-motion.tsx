/**
 * The homepage hero's motion visual: a 12-second loop drawn in SVG and CSS (keyframes in src/app/globals.css), so it
 * downloads nothing, cannot shift the layout (fixed aspect ratio) and costs no LCP. It is an illustration, not data:
 * no prices, no values, no trading controls.
 *
 *   0–2 s   global markets (the globe, India at the centre of the arcs)
 *   2–4 s   exchanges around the world
 *   4–6 s   company and fund discovery
 *   6–8 s   research, comparison and screening
 *   8–10 s  charts and data
 *   10–12 s the INRGIFT brand, then the loop starts again
 *
 * With prefers-reduced-motion the loop does not run: the brand frame (data-poster) is shown still over the globe.
 */
const NODES: { x: number; y: number; label: string }[] = [
  { x: 150, y: 150, label: 'New York' }, { x: 214, y: 118, label: 'London' }, { x: 236, y: 128, label: 'Frankfurt' },
  { x: 348, y: 148, label: 'Tokyo' }, { x: 326, y: 186, label: 'Hong Kong' }, { x: 312, y: 218, label: 'Singapore' },
  { x: 356, y: 262, label: 'Sydney' }, { x: 178, y: 252, label: 'São Paulo' }, { x: 262, y: 160, label: 'Dubai' },
];
const HOME = { x: 290, y: 192 };
const EXCHANGES = ['NSE', 'BSE', 'NYSE', 'Nasdaq', 'LSE', 'Xetra', 'Euronext', 'TSE', 'HKEX', 'SGX', 'ASX', 'B3'];
const DISCOVER: [string, string][] = [['Reliance Industries', 'NSE · Stock'], ['Apple', 'Nasdaq · Stock'], ['SPDR S&P 500 ETF Trust', 'NYSE Arca · ETF']];
const arc = (x: number, y: number) => `M${HOME.x},${HOME.y} Q${(HOME.x + x) / 2},${Math.min(HOME.y, y) - 46} ${x},${y}`;

function Globe() {
  return (
    <svg viewBox="0 0 480 360" className="absolute inset-0 h-full w-full" aria-hidden focusable="false">
      <g className="stroke-white/[.12]" fill="none" strokeWidth={1}>
        <circle cx={240} cy={180} r={132} className="stroke-white/20" />
        {[34, 68, 100].map((ry) => <ellipse key={ry} cx={240} cy={180} rx={132} ry={ry} />)}
        <line x1={108} y1={180} x2={372} y2={180} />
        {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={240} cy={180} rx={132} ry={132} className="hero-meridian" style={{ animationDelay: `${-i * 3}s` }} />)}
      </g>
      <g fill="none" strokeWidth={1.25} className="stroke-ice/70">
        {NODES.map((n, i) => <path key={n.label} d={arc(n.x, n.y)} className="hero-arc" pathLength={1} style={{ animationDelay: `${i * 0.22}s` }} />)}
      </g>
      {NODES.map((n, i) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r={7} className="hero-pulse fill-ice/25" style={{ animationDelay: `${i * 0.3}s` }} />
          <circle cx={n.x} cy={n.y} r={2.6} className="fill-ice" />
        </g>
      ))}
      <circle cx={HOME.x} cy={HOME.y} r={11} className="hero-pulse fill-saffron/30" />
      <circle cx={HOME.x} cy={HOME.y} r={4} className="fill-saffron" />
    </svg>
  );
}

const scene = 'hero-scene absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6';
const caption = 'text-[11px] font-semibold uppercase tracking-[.18em] text-ice';

export function HeroMotion() {
  return (
    <figure role="img" aria-label="Animated illustration: global markets and exchanges connected to India, company and fund discovery, research, comparison and screening, charts, and the INRGIFT brand. It shows no market data."
      className="hero-motion relative isolate aspect-[4/3] w-full overflow-hidden rounded-card border border-white/10 bg-white/[.03] shadow-pop">
      <div aria-hidden className="absolute inset-0">
        <Globe />
        {/* 1. Global markets */}
        <div className={scene} style={{ animationDelay: '0s' }}>
          <p className={caption}>Global markets</p>
          <p className="mt-1 font-display text-[17px] font-bold sm:text-[20px]">Markets on every continent, read from India.</p>
        </div>
        {/* 2. Exchanges */}
        <div className={scene} style={{ animationDelay: '2s' }}>
          <p className={caption}>Exchanges</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">{EXCHANGES.map((e) => <li key={e} className="rounded-md border border-white/15 bg-navy/80 px-2 py-0.5 text-[11px] font-semibold text-white/90 sm:text-[12px]">{e}</li>)}</ul>
        </div>
        {/* 3. Discovery */}
        <div className={scene} style={{ animationDelay: '4s' }}>
          <p className={caption}>Discover</p>
          <div className="mt-2 max-w-[340px] rounded-lg border border-white/15 bg-navy/90 p-2 text-[12px]">
            <p className="rounded-md bg-white/[.06] px-2 py-1.5 text-white/60">Search companies, funds, indices…</p>
            <ul className="mt-1">{DISCOVER.map(([n, k]) => <li key={n} className="flex justify-between gap-3 px-2 py-1"><span className="truncate font-semibold text-white">{n}</span><span className="shrink-0 text-white/55">{k}</span></li>)}</ul>
          </div>
        </div>
        {/* 4. Research, compare, screen */}
        <div className={scene} style={{ animationDelay: '6s' }}>
          <p className={caption}>Research · Compare · Screen</p>
          <div className="mt-2 flex max-w-[340px] items-end gap-2 rounded-lg border border-white/15 bg-navy/90 p-3">
            {[['h-8', 'h-12', 'h-6'], ['h-10', 'h-7', 'h-12'], ['h-6', 'h-10', 'h-9']].map((g, i) => (
              <div key={i} className="flex flex-1 items-end gap-1">{g.map((h, j) => <span key={j} className={`${h} flex-1 rounded-sm ${j === 0 ? 'bg-ice/80' : j === 1 ? 'bg-brand' : 'bg-white/30'}`} />)}</div>
            ))}
          </div>
        </div>
        {/* 5. Charts */}
        <div className={scene} style={{ animationDelay: '8s' }}>
          <p className={caption}>Charts and data</p>
          <svg viewBox="0 0 320 90" className="mt-2 w-full max-w-[340px] rounded-lg border border-white/15 bg-navy/90" focusable="false">
            <g className="stroke-white/10" strokeWidth={1}>{[22, 45, 68].map((y) => <line key={y} x1={0} x2={320} y1={y} y2={y} />)}</g>
            <path d="M0,70 L30,62 L60,66 L90,50 L120,54 L150,40 L180,44 L210,30 L240,36 L270,22 L300,26 L320,16" fill="none" strokeWidth={2} className="hero-draw stroke-ice" pathLength={1} />
          </svg>
        </div>
        {/* 6. Brand (also the still frame for reduced motion) */}
        <div className={scene} style={{ animationDelay: '10s' }} data-poster>
          <p className="font-display text-[26px] font-extrabold tracking-[.04em] sm:text-[32px]">INRGIFT</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[.18em] text-ice">Global market intelligence from India</p>
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-white/70">Invest beyond borders</p>
          <p className="mt-2 text-[13px] text-white/80">Every market. Every asset. One research view.</p>
        </div>
      </div>
      <figcaption className="absolute right-3 top-3 rounded-md bg-navy/70 px-2 py-0.5 text-[10.5px] font-medium text-white/55">Illustration · not market data</figcaption>
    </figure>
  );
}
