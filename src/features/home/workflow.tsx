import { ArrowRight } from 'lucide-react';
import { COMPANY } from '@/lib/company';
import { METRIC_KEYS } from '@/lib/metrics';
import { HomeSection, SectionHeading } from './home-ui';

/** The research workflow in three phases. Every step names a feature that exists today; nothing is promised. */
export const PHASES: { name: string; steps: { title: (typeof COMPANY.workflow)[number]; body: string }[] }[] = [
  { name: 'Find', steps: [
    { title: 'Search', body: 'Press / on any page. Assets, markets, exchanges, sectors and research, grouped as you type.' },
    { title: 'Discover', body: 'A global heatmap from region to company, themes across markets, and what is moving.' },
    { title: 'Screen', body: `Filter stocks, ETFs and REITs on ${METRIC_KEYS.length} registered metrics, with match-all and match-any groups.` },
  ] },
  { name: 'Understand', steps: [
    { title: 'Compare', body: 'Up to four assets side by side, on the same metrics and one change-from-start chart.' },
    { title: 'Research', body: 'Structured notes with takeaways, limitations, method and sources. Description, never advice.' },
    { title: 'Visualize', body: 'Candles, indicators and drawing tools on charts that always state their source and status.' },
  ] },
  { name: 'Follow', steps: [
    { title: 'Save', body: 'Screens, comparisons, notes and research saved to a workspace only you can read.' },
    { title: 'Watch', body: 'Watchlists across markets and asset classes, in each listing’s own currency or in rupees.' },
    { title: 'Alert', body: 'Alerts on the levels and changes you choose, checked while INRGIFT is open. They notify you; they never act.' },
  ] },
];

/** "From discovery to decision-ready research": the nine steps as one line, then in three phases. */
export function Workflow() {
  let n = 0;
  return (
    <HomeSection id="workflow" surface="white">
      <SectionHeading id="workflow" eyebrow="Research workflow" title="From discovery to decision-ready research."
        lead="INRGIFT follows the way research actually happens: find what deserves attention, understand it, then keep watching. Each step hands its context to the next." />
      <ol data-reveal aria-label="The workflow in one line" className="mt-10 flex flex-wrap items-center gap-2">
        {COMPANY.workflow.map((w, i) => (
          <li key={w} className="flex shrink-0 items-center gap-2">
            <span className="rounded-full border border-line2 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[.12em] text-navy">{w}</span>
            {i < COMPANY.workflow.length - 1 && <ArrowRight size={14} aria-hidden className="text-faint" />}
          </li>
        ))}
      </ol>
      <div data-reveal className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-3">
        {PHASES.map((p) => (
          <section key={p.name} aria-label={p.name} className="bg-white">
            <h3 className="flex items-center gap-3 border-b border-line px-6 py-4 font-display text-[13px] font-bold uppercase tracking-[.18em] text-brand-ink"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-saffron" />{p.name}</h3>
            <ol className="divide-y divide-line">
              {p.steps.map((s) => {
                n += 1;
                return (
                  <li key={s.title} value={n} className="group relative px-6 py-5 transition-colors duration-panel hover:bg-bg">
                    <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-brand opacity-0 transition-opacity duration-panel group-hover:opacity-100" />
                    <p className="flex items-baseline gap-3"><span className="num text-[12px] font-semibold text-faint">{String(n).padStart(2, '0')}</span><span className="font-display text-[18px] font-bold text-navy">{s.title}</span></p>
                    <p className="mt-1.5 pl-[30px] text-[14px] leading-relaxed text-slate2">{s.body}</p>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </HomeSection>
  );
}
