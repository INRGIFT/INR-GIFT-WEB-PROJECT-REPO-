import { FileText, Lock } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { DataStatus, StatusBadge } from '@/components/ui/data-status';
import { Change } from '@/components/ui/primitives';
import { DEFAULT_TREE, fieldKind, fieldLabel, isGroup, OPS, runScreen, type Field, type Node } from '@/features/screener/logic';
import { cn } from '@/lib/format';
import { fmtMetric, isDirectional, METRIC_KEYS, METRICS } from '@/lib/metrics';
import { loginHref } from '@/lib/return-url';
import { assetHref } from '@/lib/routes';
import type { MetricKey } from '@/lib/types';
import { freshest } from '@/services/market-data';
import { DemoNote, HomeSection, SectionHeading } from './home-ui';
import { SessionCta } from './session-cta';
import type { HomeSnapshot } from './snapshot';

function Unavailable({ children }: { children: ReactNode }) {
  return <p role="status" className="rounded-card border border-line bg-white px-5 py-6 text-[14px] text-slate2">{children}</p>;
}
function SignedOutOnly() {
  return <p className="flex items-center gap-2 rounded-card border border-line bg-white px-5 py-6 text-[14px] text-slate2"><Lock size={16} aria-hidden className="text-faint" />Results are shown to signed-in members.</p>;
}

/** A screener rule in the screener's own words: field label, operator label and value with its unit. */
export function ruleText(r: { field: Field; op: string; value: string }): string {
  const op = OPS[fieldKind(r.field)].find(([o]) => o === r.op)?.[1] ?? r.op;
  const def = r.field in METRICS ? METRICS[r.field as MetricKey] : null;
  const unit = !def ? '' : def.fmt === 'usd' ? ' bn USD' : def.fmt === 'pct' || def.fmt === 'signedPct' ? '%' : '';
  return `${fieldLabel(r.field)} ${op} ${r.value}${unit}`;
}
function RuleTree({ node, depth = 0 }: { node: Node; depth?: number }) {
  if (!isGroup(node)) return <li className="flex items-center gap-2.5 rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] text-navy"><span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{ruleText(node)}</li>;
  return (
    <li className={cn(depth > 0 && 'rounded-lg border border-dashed border-line2 p-2.5')}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.14em] text-faint">{node.op === 'AND' ? 'Match all' : 'Match any'}</p>
      <ul className="space-y-2">{node.rules.map((r, i) => <RuleTree key={i} node={r} depth={depth + 1} />)}</ul>
    </li>
  );
}

/** "Find what matters": the screener's own starting screen, run on the server against the active data source. */
export function ScreenPreview({ snap }: { snap: HomeSnapshot }) {
  const universe = snap.equities.ok ? snap.equities.value : [];
  const hits = runScreen(DEFAULT_TREE, universe).sort((a, b) => (b.m.marketCap ?? 0) - (a.m.marketCap ?? 0));
  const meta = freshest(hits);
  const cols: MetricKey[] = ['marketCap', 'revenueGrowth', 'dividendYield'];
  return (
    <HomeSection id="screen" surface="white">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <SectionHeading id="screen" eyebrow="Screeners" title="Find what matters."
            lead={`Start from a question, not a ticker. Combine filters on ${METRIC_KEYS.length} registered metrics across stocks, ETFs and REITs, group them, and save the screen to your workspace.`} />
          <div data-reveal className="mt-8">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-faint">The screener's starting example</p>
            <ul className="mt-3"><RuleTree node={DEFAULT_TREE} /></ul>
            <div className="mt-8"><SessionCta out={['Sign In to Screen', loginHref('/discover/screener')]} inside={['Explore Screeners', '/discover/screener']} arrow /></div>
          </div>
        </div>
        <div data-reveal className="min-w-0 self-start">
          {snap.mode === 'off' ? <SignedOutOnly /> : !snap.equities.ok ? <Unavailable>Screen results could not load just now. Nothing is estimated in their place.</Unavailable> : (
            <div className="overflow-hidden rounded-card border border-line bg-white shadow-card" data-nosnippet>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
                <p className="font-display text-[16px] font-bold"><span className="num">{hits.length}</span> {hits.length === 1 ? 'match' : 'matches'} <span className="text-[13px] font-medium text-faint">of {universe.length} stocks, ETFs and REITs</span></p>
                {meta && <DataStatus meta={meta} showTime={false} />}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] sm:text-[13.5px]">
                  <caption className="sr-only">Top matches of the example screen by market cap</caption>
                  <thead><tr className="border-b border-line text-left text-[10.5px] uppercase tracking-[.06em] text-faint sm:text-[11px] sm:tracking-[.12em]"><th scope="col" className="py-2.5 pl-4 pr-2 font-semibold sm:px-5">Company</th>{cols.map((c) => <th key={c} scope="col" className="px-2 py-2.5 text-right font-semibold sm:px-3">{METRICS[c].short}</th>)}</tr></thead>
                  <tbody>
                    {hits.slice(0, 6).map((a) => (
                      <tr key={a.id} className="border-b border-line last:border-0">
                        <th scope="row" className="py-3 pl-4 pr-2 text-left font-normal sm:px-5"><Link href={assetHref(a)} className="font-semibold text-navy hover:text-brand-ink">{a.name}</Link>{meta && a.status !== meta.dataStatus && <StatusBadge status={a.status} className="ml-2 align-middle" />}<span className="block text-[11.5px] text-faint">{a.symbol}<span className="hidden sm:inline"> · {a.exchange} · {a.country}</span></span></th>
                        {cols.map((c) => <td key={c} className="num px-2 py-3 text-right text-navy sm:px-3">{fmtMetric(c, a.m[c]).text}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta?.dataStatus === 'DEMO' && <DemoNote className="border-t border-line px-5 py-3" />}
            </div>
          )}
        </div>
      </div>
    </HomeSection>
  );
}

const COMPARE_ROWS: MetricKey[] = ['y1', 'ytd', 'pe', 'revenueGrowth', 'netMargin', 'dividendYield', 'beta', 'volatility', 'marketCap'];
/** "Compare before you conclude": three listings on the same registered metrics, each in its own market and currency. */
export function ComparePreview({ snap }: { snap: HomeSnapshot }) {
  const assets = snap.compare.ok ? snap.compare.value : [];
  const meta = freshest(assets);
  const slugs = assets.map((a) => a.slug).join(',');
  return (
    <HomeSection id="compare" surface="tint">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div data-reveal className="order-2 min-w-0 self-start lg:order-1">
          {snap.mode === 'off' ? <SignedOutOnly /> : !snap.compare.ok || assets.length < 2 ? <Unavailable>The comparison could not load just now. Nothing is estimated in its place.</Unavailable> : (
            <div className="overflow-hidden rounded-card border border-line bg-white shadow-card" data-nosnippet>
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px] sm:text-[13.5px]">
                  <caption className="sr-only">Registered metrics for {assets.map((a) => a.name).join(', ')}</caption>
                  <thead>
                    <tr className="border-b border-line align-bottom">
                      <th scope="col" className="py-4 pl-4 pr-2 text-left text-[11px] font-semibold uppercase tracking-[.12em] text-faint sm:px-5">Metric</th>
                      {assets.map((a) => <th key={a.id} scope="col" className="px-2 py-4 text-right sm:px-4"><Link href={assetHref(a)} className="font-display text-[13.5px] font-bold leading-snug text-navy hover:text-brand-ink sm:text-[15px]">{a.name}</Link><span className="block text-[11px] font-normal text-faint sm:text-[11.5px]">{a.symbol}<span className="hidden sm:inline"> · {a.exchange}</span> · {a.currency}</span></th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_ROWS.map((k) => (
                      <tr key={k} className="border-b border-line last:border-0">
                        <th scope="row" className="py-2.5 pl-4 pr-2 text-left font-medium text-slate2 sm:px-5">{METRICS[k].label}</th>
                        {assets.map((a) => {
                          const v = a.m[k];
                          return <td key={a.id} className="num px-2 py-2.5 text-right text-navy sm:px-4">{isDirectional(k) && v != null ? <Change value={v} /> : fmtMetric(k, v).text}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3">
                {meta && <DataStatus meta={meta} />}
                <span className="text-xs text-faint">n/a: not applicable · —: unavailable from source</span>
              </div>
            </div>
          )}
        </div>
        <div className="order-1 lg:order-2">
          <SectionHeading id="compare" eyebrow="Compare" title="Compare before you conclude."
            lead="Put up to four assets side by side on the same registered metrics, each in its own market and currency, with one change-from-start chart. Differences are shown; no verdict is drawn." />
          <div data-reveal className="mt-8"><SessionCta out={['Sign In to Compare', loginHref(`/discover/compare${slugs ? `?s=${slugs}` : ''}`)]} inside={['Open Compare', `/discover/compare${slugs ? `?s=${slugs}` : ''}`]} arrow /></div>
        </div>
      </div>
    </HomeSection>
  );
}

const OUTLINE = ['Key takeaways', 'Why it matters', 'Analysis', 'Charts and tables', 'Interpretation', 'Limitations', 'Methodology', 'Sources', 'Disclosure'];
const AREAS: [string, string][] = [['Stocks', 'stocks'], ['ETFs', 'etfs'], ['Markets', 'markets'], ['Themes', 'themes'], ['Sectors', 'sectors'], ['Countries', 'countries']];
/** "Turn market data into research": the anatomy every INRGIFT note follows, with one note from the library. */
export function ResearchPreview({ snap }: { snap: HomeSnapshot }) {
  const docs = snap.research.ok ? snap.research.value : [];
  const example = docs.find((d) => d.kind === 'stocks') ?? docs[0] ?? null;
  return (
    <HomeSection id="research" surface="white">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <SectionHeading id="research" eyebrow="Research" title="Turn market data into research."
            lead="Structured notes on stocks, ETFs, markets, themes, sectors and countries. Each one is built from data and states its sources, limitations and method. Notes describe; they carry no ratings, price targets or advice." />
          <nav data-reveal aria-label="Research areas" className="mt-8">
            <ul className="flex flex-wrap gap-2">{AREAS.map(([label, kind]) => <li key={kind}><Link href={`/research/${kind}`} className="inline-flex h-9 items-center rounded-full border border-line2 px-4 text-[13.5px] font-medium text-navy transition-colors duration-micro hover:border-brand hover:text-brand-ink">{label}</Link></li>)}</ul>
          </nav>
          <div data-reveal className="mt-8"><SessionCta out={['Sign In to Read Research', loginHref('/research')]} inside={['Open Research', '/research']} arrow /></div>
        </div>
        <article data-reveal aria-label="Anatomy of an INRGIFT research note" className="relative self-start overflow-hidden rounded-card border border-line bg-white shadow-raised">
          <div aria-hidden className="h-1 bg-gradient-to-r from-brand via-brand to-saffron" />
          <div className="px-6 py-6 md:px-8 md:py-7">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-faint"><FileText size={14} aria-hidden className="text-brand" /><span className="font-semibold uppercase tracking-[.12em] text-brand-ink">{example?.type ?? 'Structured research'}</span>{example && <span>· {AREAS.find(([, k]) => k === example.kind)?.[0]}</span>}<span>· INRGIFT Research</span></p>
            <h3 className="mt-3 font-display text-[22px] font-bold leading-snug text-navy md:text-[24px]">{example?.title ?? 'Every note follows the same structure'}</h3>
            {example?.summary && <p className="mt-2 text-[14px] leading-relaxed text-slate2" data-nosnippet>{example.summary}</p>}
            <ol className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {OUTLINE.map((s, i) => <li key={s} className="flex items-baseline gap-3 border-b border-line pb-2.5 text-[14px] text-navy"><span aria-hidden className="num text-[11.5px] font-semibold text-faint">{String(i + 1).padStart(2, '0')}</span><span>{s}</span></li>)}
            </ol>
            {snap.mode === 'demo' && example && <DemoNote className="mt-5" />}
          </div>
        </article>
      </div>
    </HomeSection>
  );
}
