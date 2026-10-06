import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { DataStatus, statusLine } from '@/components/ui/data-status';
import { Bar, Callout, Change, EmptyState, Metric, MetricGrid, PageContainer, PageHeader } from '@/components/ui/primitives';
import { ModuleFoot } from '@/features/markets/widgets';
import { AlertButton, CompareButton, SaveButton, WatchButton } from '@/features/workspace/action-buttons';
import { compact, dateShort, num, usdCompact } from '@/lib/format';
import { fmtMetric, METRICS } from '@/lib/metrics';
import { assetHref } from '@/lib/routes';
import type { Asset, MetricKey } from '@/lib/types';
import { getProvider } from '@/providers';
import * as md from '@/services/market-data';

const median = (list: Asset[], k: MetricKey) => { const v = list.map((a) => a.m[k]).filter((x): x is number => x != null).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : null; };
/** Plain comparison against the covered-ETF median. Describes position only; it is not a judgement. */
function versus(v: number | null | undefined, med: number | null, k: MetricKey, lowerReads = 'lower', higherReads = 'higher') {
  if (v == null || med == null) return 'No peer comparison is available.';
  const diff = v - med;
  if (Math.abs(diff) < Math.abs(med) * 0.05) return `In line with the median of covered ETFs (${fmtMetric(k, med).text}).`;
  return `${diff < 0 ? lowerReads[0].toUpperCase() + lowerReads.slice(1) : higherReads[0].toUpperCase() + higherReads.slice(1)} than the median of covered ETFs (${fmtMetric(k, med).text}).`;
}
function Step({ n, id, title, question, children, reading }: { n: number; id: string; title: string; question: string; children: ReactNode; reading: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 rounded-card border border-line bg-white shadow-card">
      <header className="flex items-start gap-3 border-b border-line px-4 py-3">
        <span aria-hidden className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">{n}</span>
        <div><h2 id={`${id}-h`} className="text-base font-bold"><span className="sr-only">Step {n}: </span>{title}</h2><p className="text-[13px] text-slate2">{question}</p></div>
      </header>
      <div className="space-y-3 p-4">{children}<p className="rounded-lg bg-soft px-3 py-2 text-[13px] text-slate2"><b className="text-navy">Reading the data. </b>{reading}</p></div>
    </section>
  );
}

/** The eight-step ETF review: objective, cost, size, liquidity, holdings, allocation, performance, risk. */
export async function EtfReview({ slug }: { slug: string }) {
  const a = await md.getAsset('etf', slug);
  if (!a || !a.etf) notFound();
  const p = getProvider();
  const safe = <T,>(x: Promise<T>) => x.catch(() => null);
  const [holdings, allocations, etfs, rates] = await Promise.all([safe(p.getETFHoldings(a.id)), safe(p.getETFAllocations(a.id)), md.getAssets({ cls: ['etf'] }), md.fxRates()]);
  const peers = etfs.filter((x) => x.id !== a.id);
  const foot = <ModuleFoot meta={a.meta} />;
  const er = a.m.expenseRatio ?? null;
  const top10 = holdings ? holdings.slice(0, 10).reduce((s, h) => s + h.weight, 0) : null;
  const topSector = allocations?.sectors[0];
  const tradedUsd = a.price != null && a.m.volume != null ? (a.price * a.m.volume * (rates[a.currency] ?? 0)) / rates.USD : null;
  const lite = { id: a.id, symbol: a.symbol, name: a.name, slug: a.slug, cls: a.cls, price: a.price, currency: a.currency };
  const STEPS = ['Objective', 'Cost', 'Size', 'Liquidity', 'Holdings', 'Allocation', 'Performance', 'Risk'];
  return (
    <PageContainer className="max-w-[1180px]">
      <PageHeader crumbs={[['Assets', '/assets'], ['ETFs', '/assets/etfs'], [a.symbol, assetHref(a)], ['Eight-step review']]} title={`${a.symbol}: eight-step ETF review`} lead={`${a.name}, examined step by step against the other ${peers.length} ETFs INRGIFT covers. This describes the fund; it does not say whether to hold it.`}
        actions={<><WatchButton asset={lite} /><AlertButton asset={lite} /><CompareButton asset={lite} /><SaveButton refType="asset" refId={`${a.id}:review`} title={`${a.symbol} eight-step review`} href={`${assetHref(a)}/review`} /></>} />
      <p className="flex flex-wrap items-center gap-3"><DataStatus meta={a.meta} /><Link href={assetHref(a)} className="link text-[13px]">Open the full {a.symbol} page with chart</Link></p>
      {a.status !== 'LIVE' && a.status !== 'DELAYED' && a.status !== 'END_OF_DAY' && <Callout tone="warn" title="Figures may be out of date">{statusLine(a.meta)}.</Callout>}
      <div className="grid items-start gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Review steps" className="lg:sticky lg:top-24"><ol className="scrollbar-none flex gap-1 overflow-x-auto lg:block lg:space-y-0.5">{STEPS.map((s, i) => <li key={s} className="shrink-0"><a href={`#step-${i + 1}`} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate2 hover:bg-hover hover:text-navy"><span className="num w-4 text-faint">{i + 1}</span>{s}</a></li>)}</ol></nav>
        <div className="space-y-4">
          <Step n={1} id="step-1" title="Objective" question="What does the fund try to do?" reading={<>A clear, rules-based benchmark makes the fund predictable. Check that the benchmark matches the exposure you are researching.</>}>
            <MetricGrid className="xl:grid-cols-4"><Metric label="Benchmark" value={a.etf.benchmark} /><Metric label="Strategy" value={a.etf.strategy} /><Metric label="Issuer" value={a.etf.issuer} /><Metric label="Inception" value={dateShort(a.etf.inception)} /></MetricGrid>
            <p className="text-slate2">{a.description}</p>
          </Step>
          <Step n={2} id="step-2" title="Cost" question="What does it cost to hold each year?" reading={<>{versus(er, median(peers, 'expenseRatio'), 'expenseRatio', 'cheaper', 'more expensive')} Costs compound, so small differences add up over many years.</>}>
            <MetricGrid className="xl:grid-cols-3"><Metric label="Expense ratio" value={fmtMetric('expenseRatio', er).text} /><Metric label="Cost per ₹10,00,000 a year" value={er == null ? '—' : `₹${num(er * 10000, 0)}`} /><Metric label="Tracking difference (est.)" value={er == null ? '—' : `${num(-(er + 0.02), 2)}%`} hint="Estimated from the expense ratio in demo mode" /></MetricGrid>
          </Step>
          <Step n={3} id="step-3" title="Size" question="Is the fund large enough to be durable?" reading={<>{versus(a.m.aum, median(peers, 'aum'), 'aum', 'smaller', 'larger')} Very small funds are more likely to close or merge.</>}>
            <MetricGrid className="xl:grid-cols-3"><Metric label="Assets under management" value={usdCompact(a.m.aum)} /><Metric label="Number of holdings" value={fmtMetric('holdingsCount', a.m.holdingsCount).text} /><Metric label="Age" value={`${Math.max(0, new Date().getFullYear() - new Date(a.etf.inception).getFullYear())} years`} /></MetricGrid>
          </Step>
          <Step n={4} id="step-4" title="Liquidity" question="How easily does it trade?" reading={<>Higher daily turnover usually means tighter bid-ask spreads. Spreads also depend on the liquidity of the underlying holdings.</>}>
            <MetricGrid className="xl:grid-cols-3"><Metric label="Average daily volume" value={compact(a.m.volume)} /><Metric label="Average traded value" value={usdCompact(tradedUsd)} /><Metric label="Listing" value={`${a.exchange} · ${a.currency}`} /></MetricGrid>
          </Step>
          <Step n={5} id="step-5" title="Holdings" question="What does it actually own, and how concentrated is it?" reading={holdings ? <>The top {Math.min(10, holdings.length)} holdings make up {num(top10, 1)}% of the fund. {top10 != null && top10 > 50 ? 'That is concentrated: a few companies drive most of the return.' : 'Weight is spread across many positions in the index.'}</> : 'Holdings are not available from the current source, so concentration cannot be assessed here.'}>
            {!holdings ? <EmptyState title="Holdings unavailable">The current data source does not supply holdings for this fund.</EmptyState> : <div>{holdings.slice(0, 10).map((h) => <Bar key={h.name} label={h.name} value={h.weight} max={Math.max(...holdings.map((x) => x.weight)) * 1.1} href={h.slug ? `/stocks/${h.slug}` : undefined} suffix={`${num(h.weight, 1)}%`} />)}</div>}
          </Step>
          <Step n={6} id="step-6" title="Allocation" question="Which sectors and countries does it depend on?" reading={topSector ? <>The largest sector is {topSector[0]} at {num(topSector[1], 0)}%. {topSector[1] > 30 ? 'Above 30% in one sector deserves a closer look.' : 'No single sector dominates.'} Country weights show how much of the return depends on one economy and currency.</> : 'Allocation data is not available from the current source.'}>
            {allocations ? <div className="grid gap-4 md:grid-cols-2"><div><p className="mb-1 text-xs font-semibold text-faint">Sectors</p>{allocations.sectors.map(([l, w]) => <Bar key={l} label={l} value={w} suffix={`${num(w, 0)}%`} />)}</div><div><p className="mb-1 text-xs font-semibold text-faint">Countries</p>{allocations.countries.map(([l, w]) => <Bar key={l} label={l} value={w} suffix={`${num(w, 0)}%`} />)}</div></div> : <EmptyState title="Allocation unavailable" />}
          </Step>
          <Step n={7} id="step-7" title="Performance" question="How has it done, in its own currency and for a rupee investor?" reading={<>Returns are in {a.currency}. {a.currency !== 'INR' ? `For a rupee-based holder, ${a.currency}/INR moves add to or subtract from these figures.` : ''} Past returns do not indicate future results.</>}>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-ctl border border-line bg-line sm:grid-cols-6">{(['m1', 'ytd', 'y1', 'y3', 'y5', 'dividendYield'] as MetricKey[]).map((k) => <div key={k} className="bg-white px-3 py-2.5 text-center"><p className="text-xs text-faint">{k === 'dividendYield' ? 'Yield' : METRICS[k].short}</p><p className="text-[13px] font-semibold">{k === 'dividendYield' ? fmtMetric(k, a.m[k]).text : <Change value={a.m[k]} dp={1} />}</p></div>)}</div>
          </Step>
          <Step n={8} id="step-8" title="Risk" question="How rough has the ride been?" reading={<>{versus(a.m.volatility, median(peers, 'volatility'), 'volatility', 'calmer', 'more volatile')} Maximum drawdown is the worst peak-to-trough fall a holder would have sat through.</>}>
            <MetricGrid className="xl:grid-cols-4"><Metric label="30-day volatility" value={fmtMetric('volatility', a.m.volatility).text} /><Metric label="Beta" value={fmtMetric('beta', a.m.beta).text} /><Metric label="Max drawdown (3Y)" value={fmtMetric('maxDrawdown', a.m.maxDrawdown).text} /><Metric label="RSI (14)" value={fmtMetric('rsi', a.m.rsi).text} /></MetricGrid>
          </Step>
          <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-line bg-white px-4 py-3 text-xs text-faint">{foot}<span>Peers: {peers.length} covered ETFs. Medians exclude this fund.</span></footer>
          <div className="flex flex-wrap gap-2"><ButtonLink variant="primary" href={`/discover/compare?s=${[a.slug, ...peers.slice(0, 2).map((x) => x.slug)].join(',')}`}>Compare with peers</ButtonLink><ButtonLink href="/research/etfs">ETF research</ButtonLink><ButtonLink href="/resources/learn/etf-basics">How an ETF works</ButtonLink></div>
        </div>
      </div>
    </PageContainer>
  );
}
