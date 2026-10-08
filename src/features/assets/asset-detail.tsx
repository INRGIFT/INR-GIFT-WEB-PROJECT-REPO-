import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { assetQuality, assetTitle } from '@/lib/indexability';
import { breadcrumbs, instrument, JsonLd } from '@/lib/structured-data';
import { isDemoData } from '@/lib/config';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { AssetLogo } from '@/components/ui/asset-logo';
import { DataStatus, statusLine } from '@/components/ui/data-status';
import { Badge, Bar, Breadcrumbs, Change, EmptyState, Metric, MetricGrid, PageContainer, Panel } from '@/components/ui/primitives';
import { FinancialChart } from '@/features/charts/financial-chart';
import { getChartSeries } from '@/services/chart-data';
import { IdentityPanel } from '@/features/assets/identity-panel';
import { ConnectionsPanel } from '@/features/assets/connections-panel';
import { ModuleFoot } from '@/features/markets/widgets';
import { AlertButton, CompareButton, SaveButton, TrackView, WatchButton } from '@/features/workspace/action-buttons';
import { AssetNotes } from '@/features/workspace/asset-notes';
import { SESSION_LABEL } from '@/lib/calendar';
import { compact, dateShort, hhmm, money, num, priceDp } from '@/lib/format';
import { fmtMetric, METRICS } from '@/lib/metrics';
import { assetHref, CLASS_LABEL, CLASS_PATH, directoryHref, marketHref } from '@/lib/routes';
import type { Asset, AssetClass, MetricKey } from '@/lib/types';
import { getProvider } from '@/providers';
import * as md from '@/services/market-data';
import { AssetTable, Price } from './asset-table';

export async function assetMetadata(cls: AssetClass, slug: string): Promise<Metadata> {
  const a = await md.getAsset(cls, slug);
  if (!a) notFound();
  return pageMetadata({ title: assetTitle(a), index: assetQuality(a).indexable ? 'index' : 'noindex', description: `${a.description} Performance, ${cls === 'stock' ? 'valuation, fundamentals' : 'risk'}, research and India context on INRGIFT. ${isDemoData ? 'Demo data, clearly labelled.' : ''}`.trim(), path: assetHref(a) });
}
const M = ({ a, k, label }: { a: Asset; k: MetricKey; label?: string }) => { const f = fmtMetric(k, a.m[k]); return <Metric label={label ?? METRICS[k].short} value={f.text} hint={f.state === 'unavailable' ? 'Unavailable from source' : f.state === 'na' ? 'Not applicable' : METRICS[k].label} />; };
const Unavailable = ({ children }: { children: ReactNode }) => <EmptyState title="Unavailable">{children}</EmptyState>;
const Th = ({ children, left }: { children: ReactNode; left?: boolean }) => <th scope="col" className={`border-b border-line px-4 py-2.5 text-xs font-semibold text-faint ${left ? 'text-left' : 'text-right'}`}>{children}</th>;
const Td = ({ children, left }: { children: ReactNode; left?: boolean }) => <td className={`num border-b border-line px-4 py-2 ${left ? 'text-left' : 'text-right'}`}>{children}</td>;
const median = (list: Asset[], k: MetricKey) => { const v = list.map((a) => a.m[k]).filter((x): x is number => x != null).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : null; };

/** One research-first template for every asset class. Class-specific modules are added below the shared ones. */
export async function AssetDetail({ cls, slug }: { cls: AssetClass; slug: string }) {
  const a = await md.getAsset(cls, slug);
  if (!a) notFound();
  const p = getProvider();
  const safe = <T,>(x: Promise<T>) => x.catch(() => null);
  const [market, fundamentals, technicals, dividends, actions, holdings, allocations, news, research, universe, rates, identity] = await Promise.all([
    a.marketId ? md.getMarket(a.marketId) : null, safe(p.getFundamentals(a.id)), safe(p.getTechnicals(a.id)), safe(p.getDividends(a.id)), safe(p.getCorporateActions(a.id)),
    safe(p.getETFHoldings(a.id)), safe(p.getETFAllocations(a.id)), md.getNews({ assetId: a.id }), md.getResearch(), md.getAssets(), md.fxRates(), safe(p.getIdentity(a.id)),
  ]);
  const [connections, chart] = await Promise.all([md.getConnections(a).catch(() => []), getChartSeries(a.id, '1Y')]);
  const docs = research.filter((d) => d.assetSlug === a.slug || (cls === 'index' && d.marketId === a.marketId && d.kind === 'markets'));
  const marketIndex = universe.find((x) => x.cls === 'index' && x.marketId === a.marketId && x.id !== a.id);
  const benchmark = cls === 'index' || !marketIndex ? null : { id: marketIndex.slug, label: marketIndex.name };
  const stocks = universe.filter((x) => x.cls === 'stock');
  const peers = cls === 'stock' ? stocks.filter((x) => x.sector === a.sector && x.id !== a.id) : [];
  const related: Asset[] =
    cls === 'etf' ? universe.filter((x) => x.cls === 'etf' && x.id !== a.id).slice(0, 4)
    : cls === 'index' ? universe.filter((x) => x.cls === 'etf' && x.etf?.benchmark.toLowerCase().includes(a.name.toLowerCase().replace(' composite', ''))).concat(stocks.filter((x) => x.marketId === a.marketId)).slice(0, 8)
    : cls === 'fx' ? universe.filter((x) => x.cls === 'fx' && x.id !== a.id && (x.fx!.base === a.fx!.base || x.fx!.quote === a.fx!.quote))
    : cls === 'commodity' ? (a.slug === 'GOLD' ? universe.filter((x) => x.slug === 'GLD' || x.slug === 'SILVER') : ['BRENT', 'WTI', 'NATGAS'].includes(a.slug) ? stocks.filter((x) => x.sector === 'Energy').slice(0, 5) : universe.filter((x) => x.slug === 'BHP'))
    : cls === 'bond' ? universe.filter((x) => x.cls === 'bond' && x.id !== a.id)
    : cls === 'reit' ? universe.filter((x) => x.cls === 'reit' && x.id !== a.id) : [];
  const inr = a.price != null && a.currency !== 'INR' && rates[a.currency] ? a.price * rates[a.currency] : null;
  const change = a.price != null && a.prevClose != null ? a.price - a.prevClose : null;
  const lite = { id: a.id, symbol: a.symbol, name: a.name, slug: a.slug, cls: a.cls, price: a.price, currency: a.currency };
  const foot = <ModuleFoot meta={a.meta} />;
  const top3 = holdings ? holdings.slice(0, 3).reduce((s, h) => s + h.weight, 0) : null;
  const td = a.cls === 'etf' ? -((a.m.expenseRatio ?? 0) + 0.02) : null;

  return (
    <PageContainer>
      <JsonLd data={[instrument(a, assetHref(a)), breadcrumbs([['Assets', '/assets'], [CLASS_LABEL[cls].many, directoryHref(cls)], [`${a.name} (${a.symbol})`]])]} />
      <TrackView kind="asset" title={`${a.name} (${a.symbol})`} href={assetHref(a)} />
      <header>
        <Breadcrumbs items={[['Assets', '/assets'], [CLASS_LABEL[cls].many, `/assets/${cls === 'stock' ? 'stocks' : CLASS_PATH[cls]}`], [a.symbol]]} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <AssetLogo asset={{ symbol: a.symbol, name: a.name, mic: a.mic, cls: a.cls }} size={44} className="rounded-ctl text-[11px]" />
              <div className="min-w-0"><h1 className="text-2xl font-extrabold md:text-[28px]">{a.name}</h1><p className="text-slate2">{a.symbol} · {a.exchange}{market && <> · <Link className="link" href={marketHref(market.slug)}>{market.name}</Link></>} · {a.currency} · {cls === 'stock' ? a.industry : cls === 'etf' ? `${a.etf!.strategy} ETF` : CLASS_LABEL[cls].one}</p></div>
            </div>
            {a.price == null ? <p className="mt-4 font-display text-xl font-bold text-slate2">Price unavailable</p> : (
              <p className="mt-4 flex flex-wrap items-baseline gap-x-3.5 gap-y-1"><span className="num font-display text-[34px] font-extrabold leading-none">{cls === 'index' ? num(a.price, priceDp(a.price)) : money(a.price, a.currency)}</span><Change value={a.m.d1} className="text-base" />{change != null && <span className={`num ${change >= 0 ? 'text-up' : 'text-down'}`}>{change >= 0 ? '+' : '−'}{num(Math.abs(change), priceDp(a.price))}{cls === 'index' ? ' pts' : ` ${a.currency}`}</span>}</p>
            )}
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1"><DataStatus meta={a.meta} />{market && <span className="text-xs text-faint">Session: {SESSION_LABEL[market.session].toLowerCase()}{market.holidayName && ` (${market.holidayName})`}</span>}{inr != null && cls !== 'index' && cls !== 'fx' && <span className="num text-xs text-faint">≈ {money(inr, 'INR')}</span>}</p>
          </div>
          <div className="flex flex-wrap gap-2"><WatchButton asset={lite} /><AlertButton asset={lite} /><CompareButton asset={lite} />{cls === 'etf' ? <Link href={`${assetHref(a)}/review`} className="inline-flex h-10 items-center rounded-ctl bg-brand px-4 font-medium text-white transition-colors hover:bg-brand-ink">Eight-step review</Link> : <Link href="#research" className="inline-flex h-10 items-center rounded-ctl bg-brand px-4 font-medium text-white transition-colors hover:bg-brand-ink">Research</Link>}</div>
        </div>
      </header>

      {a.status === 'ERROR' && <div role="alert" className="rounded-card border border-down/30 bg-down/5 px-4 py-3"><b>The latest quote request failed.</b> <span className="text-slate2">{statusLine(a.meta)}. Reference details below are still available; reload to try again.</span></div>}
      {a.status === 'UNAVAILABLE' && <div className="rounded-card border border-line2 bg-soft px-4 py-3"><b>Data unavailable from source.</b> <span className="text-slate2">Figures below are the last available values. {statusLine(a.meta)}.</span></div>}
      {a.status === 'STALE' && <div className="rounded-card border border-warn/30 bg-warn/5 px-4 py-3"><b>This quote is stale.</b> <span className="text-slate2">{statusLine(a.meta)}.</span></div>}

      <div id="chart" className="scroll-mt-24"><FinancialChart header="status" instrument={{ idOrSlug: a.slug, symbol: a.symbol, name: a.name }} initialSeries={chart.ok ? chart.series : null} benchmark={benchmark ? { idOrSlug: benchmark.id, label: benchmark.label } : null} defaultIndicators={['stock', 'etf', 'reit'].includes(cls) ? ['VOL'] : []} /></div>

      <Panel title="Overview" footer={foot}>
        <p className="mb-3 max-w-[76ch] text-slate2">{a.description}</p>
        <MetricGrid>
          {cls === 'stock' && (<><M a={a} k="marketCap" /><M a={a} k="pe" /><M a={a} k="fpe" /><M a={a} k="revenueGrowth" /><M a={a} k="netMargin" /><M a={a} k="roic" /><M a={a} k="dividendYield" /><M a={a} k="beta" /><M a={a} k="volume" /></>)}
          {cls === 'etf' && (<><M a={a} k="aum" /><M a={a} k="expenseRatio" label="Expense ratio" /><M a={a} k="dividendYield" label="Distribution yield" /><M a={a} k="holdingsCount" /><M a={a} k="volume" label="Avg volume" /><Metric label="Benchmark" value={a.etf!.benchmark} /><Metric label="Issuer" value={a.etf!.issuer} /><Metric label="Inception" value={dateShort(a.etf!.inception)} /></>)}
          {cls === 'reit' && (<><M a={a} k="marketCap" /><M a={a} k="dividendYield" label="Distribution yield" /><M a={a} k="ffoYield" /><M a={a} k="occupancy" /><M a={a} k="pb" label="Price / book" /><M a={a} k="debtEquity" /><Metric label="Property type" value={a.reit!.propertyType} /><Metric label="Geography" value={a.reit!.geography} /></>)}
          {cls === 'bond' && (<><M a={a} k="yield" /><M a={a} k="coupon" /><M a={a} k="duration" /><Metric label="Maturity" value={dateShort(a.bond!.maturity)} /><Metric label="Credit rating" value={a.bond!.rating} /><Metric label="Issuer" value={a.bond!.issuer} /></>)}
          {cls === 'index' && (<><Metric label="Constituents" value={num(a.index!.constituents, 0)} /><M a={a} k="volatility" /><M a={a} k="maxDrawdown" />{market && <Metric label="Market" value={market.name} />}</>)}
          {cls === 'fx' && (<><Metric label="Base currency" value={a.fx!.base} /><Metric label="Quote currency" value={a.fx!.quote} /><M a={a} k="volatility" /><Metric label="Inverse rate" value={a.price ? num(1 / a.price, 4) : '—'} /></>)}
          {cls === 'commodity' && (<><Metric label="Unit" value={a.commodity!.unit} /><Metric label="Reference" value={a.commodity!.reference} /><M a={a} k="volatility" /></>)}
          {technicals && <><Metric label="52-week high" value={num(technicals.high52, priceDp(technicals.high52 ?? 1))} /><Metric label="52-week low" value={num(technicals.low52, priceDp(technicals.low52 ?? 1))} /></>}
        </MetricGrid>
      </Panel>
      {identity && <IdentityPanel identity={identity} current={a.id} />}
      <ConnectionsPanel groups={connections} />

      <Panel title="Performance" footer={foot} flush>
        <div className="grid grid-cols-3 gap-px bg-line sm:grid-cols-5 lg:grid-cols-9">{(['d1', 'w1', 'm1', 'm3', 'm6', 'ytd', 'y1', 'y3', 'y5'] as MetricKey[]).map((k) => <div key={k} className="bg-white px-3 py-3 text-center"><p className="text-xs text-faint">{METRICS[k].short}</p><p className="mt-0.5 text-[13px] font-semibold">{a.m[k] === undefined ? <span className="text-faint" title="Not applicable">n/a</span> : <Change value={a.m[k]} dp={1} />}</p></div>)}</div>
      </Panel>

      {cls === 'stock' && (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Panel title="Valuation" sub="Against the median of covered stocks" footer={foot}>
            {a.m.pe == null ? <Unavailable>No valuation metrics available for this security.</Unavailable> : (['pe', 'fpe', 'pb', 'evEbitda', 'dividendYield'] as MetricKey[]).map((k) => { const v = a.m[k], med = median(stocks, k); if (v == null || med == null) return null; return <Bar key={k} label={METRICS[k].short} value={v} max={Math.max(v, med) * 1.2 || 1} suffix={<span title={`Median ${fmtMetric(k, med).text}`}>{fmtMetric(k, v).text}</span>} />; })}
            {a.m.pe != null && <p className="mt-2 text-xs text-faint">Median of covered stocks: P/E {fmtMetric('pe', median(stocks, 'pe')).text}, forward P/E {fmtMetric('fpe', median(stocks, 'fpe')).text}. A lower multiple is not automatically better; compare within a sector.</p>}
          </Panel>
          <Panel title="Profitability, leverage and risk" footer={foot}><MetricGrid className="xl:grid-cols-3"><M a={a} k="grossMargin" /><M a={a} k="netMargin" /><M a={a} k="roe" /><M a={a} k="roic" /><M a={a} k="debtEquity" /><M a={a} k="epsGrowth" /><M a={a} k="beta" /><M a={a} k="volatility" /><M a={a} k="maxDrawdown" /></MetricGrid></Panel>
        </div>
      )}
      {cls === 'stock' && (
        <Panel title="Financials" sub={fundamentals ? `USD · next results ${fundamentals.nextEarnings ? dateShort(fundamentals.nextEarnings) : 'not announced'}` : undefined} footer={foot} flush>
          {!fundamentals ? <Unavailable>No fundamentals available for this security.</Unavailable> : (
            <div className="overflow-x-auto"><table className="w-full border-collapse text-[13px]"><thead><tr><Th left>Fiscal year</Th>{fundamentals.years.map((y) => <Th key={y.year}>FY{y.year}</Th>)}</tr></thead><tbody>
              <tr><Td left>Revenue</Td>{fundamentals.years.map((y) => <Td key={y.year}>${compact(y.revenue)}</Td>)}</tr>
              <tr><Td left>Net income</Td>{fundamentals.years.map((y) => <Td key={y.year}>${compact(y.netIncome)}</Td>)}</tr>
              <tr><Td left>Net margin</Td>{fundamentals.years.map((y) => <Td key={y.year}>{num((y.netIncome / y.revenue) * 100, 1)}%</Td>)}</tr>
              <tr><Td left>EPS (USD)</Td>{fundamentals.years.map((y) => <Td key={y.year}>{num(y.eps, 2)}</Td>)}</tr>
              <tr><Td left>Operating cash flow</Td>{fundamentals.years.map((y) => <Td key={y.year}>{y.operatingCashFlow == null ? '—' : `$${compact(y.operatingCashFlow)}`}</Td>)}</tr>
              <tr><Td left>Capital expenditure</Td>{fundamentals.years.map((y) => <Td key={y.year}>{y.capex == null ? '—' : `$${compact(y.capex)}`}</Td>)}</tr>
              <tr><Td left><Link className="link" href="/resources/glossary/free-cash-flow">Free cash flow</Link></Td>{fundamentals.years.map((y) => <Td key={y.year}>{y.operatingCashFlow == null || y.capex == null ? '—' : `$${compact(y.operatingCashFlow - y.capex)}`}</Td>)}</tr>
              <tr><Td left>Revenue growth</Td>{fundamentals.years.map((y, i) => <Td key={y.year}>{i ? <Change value={(y.revenue / fundamentals.years[i - 1].revenue - 1) * 100} dp={1} /> : '—'}</Td>)}</tr>
            </tbody></table></div>
          )}
        </Panel>
      )}

      {cls === 'etf' && (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Panel title="Holdings" sub={holdings && top3 != null ? `Top ${Math.min(3, holdings.length)} hold ${num(top3, 1)}% of the fund` : undefined} footer={foot} flush>
            {!holdings ? <Unavailable>Holdings are not available from the current source for this fund.</Unavailable> : (
              <table className="w-full border-collapse text-[13px]"><thead><tr><Th left>Holding</Th><Th>Weight</Th></tr></thead><tbody>
                {holdings.map((h) => <tr key={h.name}><Td left>{h.slug ? <Link className="link font-medium" href={`/stocks/${h.slug}`}>{h.name} <span className="text-faint">{h.symbol}</span></Link> : h.name}</Td><Td>{num(h.weight, 1)}%</Td></tr>)}
                {holdings.reduce((s, h) => s + h.weight, 0) < 99.5 && <tr><Td left><span className="text-slate2">Other holdings</span></Td><Td>{num(100 - holdings.reduce((s, h) => s + h.weight, 0), 1)}%</Td></tr>}
              </tbody></table>
            )}
          </Panel>
          <div className="space-y-4">
            <Panel title="Sector exposure" footer={foot}>{allocations ? allocations.sectors.map(([l, w]) => <Bar key={l} label={l} value={w} suffix={`${num(w, 0)}%`} />) : <Unavailable>Allocation data is not available from the current source.</Unavailable>}</Panel>
            <Panel title="Geographic exposure" footer={foot}>{allocations ? allocations.countries.map(([l, w]) => <Bar key={l} label={l} value={w} suffix={`${num(w, 0)}%`} />) : <Unavailable>Allocation data is not available from the current source.</Unavailable>}</Panel>
            <Panel title="Asset mix">{a.etf!.assetMix.map(([l, w]) => <Bar key={l} label={l} value={w} suffix={`${num(w, 1)}%`} />)}</Panel>
          </div>
        </div>
      )}
      {cls === 'etf' && (
        <Panel title="Fees, tracking and risk" footer={foot}>
          <MetricGrid className="xl:grid-cols-4"><M a={a} k="expenseRatio" label="Expense ratio" /><Metric label="Cost per ₹10,00,000 a year" value={`₹${num((a.m.expenseRatio ?? 0) * 10000, 0)}`} /><Metric label="Tracking difference (1Y)" value={`${num(td, 2)}%`} hint="Fund return minus index return" /><Metric label="Benchmark" value={a.etf!.benchmark} /><M a={a} k="beta" /><M a={a} k="volatility" /><M a={a} k="maxDrawdown" /><M a={a} k="rsi" /></MetricGrid>
          <p className="mt-3 max-w-[76ch] text-xs text-faint">Tracking difference shown here is estimated from the expense ratio in demo mode. With a live provider it is computed from fund and index total returns.</p>
        </Panel>
      )}

      {(cls === 'stock' || cls === 'etf' || cls === 'reit') && (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Panel title={cls === 'stock' ? 'Dividends' : 'Distributions'} footer={foot} flush>
            {dividends == null ? <Unavailable>No distribution data from the current source.</Unavailable> : !dividends.length ? <EmptyState title="No distributions on record">{a.name} has paid no distributions in the available history.</EmptyState> : (
              <div className="overflow-x-auto"><table className="w-full border-collapse text-[13px]"><thead><tr><Th left>Ex-date</Th><Th>Pay date</Th><Th>Amount</Th></tr></thead><tbody>{dividends.slice(0, 6).map((d) => <tr key={d.exDate}><Td left>{dateShort(d.exDate)}</Td><Td>{dateShort(d.payDate)}</Td><Td>{money(d.amount, d.currency)}</Td></tr>)}</tbody></table></div>
            )}
          </Panel>
          <Panel title="Technical summary" footer={foot}>
            {!technicals ? <Unavailable>Technical metrics need price history, which is not available right now.</Unavailable> : (<><MetricGrid className="xl:grid-cols-3"><Metric label="RSI (14)" value={technicals.rsi ?? '—'} /><Metric label="50-day average" value={num(technicals.sma50, priceDp(technicals.sma50 ?? 1))} /><Metric label="200-day average" value={num(technicals.sma200, priceDp(technicals.sma200 ?? 1))} /></MetricGrid><p className="mt-3 text-slate2">Price is <b className="text-navy">{technicals.trend?.toLowerCase()}</b>. Indicators describe what price has done; they do not predict what it will do.</p></>)}
            {cls === 'stock' && actions && actions.length > 0 && <div className="mt-4 border-t border-line pt-3"><p className="mb-1.5 text-xs font-semibold text-faint">Corporate actions</p><ul className="space-y-1 text-[13px]">{actions.map((x) => <li key={x.date}><span className="text-faint">{dateShort(x.date)}</span> · {x.type}: {x.detail}</li>)}</ul></div>}
          </Panel>
        </div>
      )}

      {peers.length > 0 && <Panel title={`Peers in ${a.sector}`} flush footer={foot}><AssetTable rows={peers} columns={['d1', 'y1', 'marketCap', 'pe', 'revenueGrowth', 'roic', 'dividendYield']} pageSize={8} /></Panel>}
      {related.length > 0 && <Panel title={cls === 'index' ? 'Related ETFs and constituents covered' : cls === 'fx' ? 'Related pairs' : `Related ${cls === 'commodity' ? 'instruments' : CLASS_LABEL[cls].many}`} flush footer={foot}><AssetTable rows={related} columns={cls === 'bond' ? ['yield', 'coupon', 'duration'] : ['d1', 'm1', 'y1']} pageSize={8} initialSort={null} /></Panel>}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel id="research" title="Research" flush tools={<SaveButton refType="asset" refId={a.id} title={`${a.name} (${a.symbol})`} href={assetHref(a)} />}>
          {docs.length ? docs.map((d) => <Link key={d.id} href={`/research/${d.kind}/${d.slug}`} className="block border-b border-line px-4 py-3 transition-colors last:border-0 hover:bg-bg"><p className="font-semibold">{d.title}</p><p className="mt-0.5 text-slate2">{d.summary}</p><p className="mt-1 flex flex-wrap gap-1.5 text-xs text-faint"><Badge>{d.type}</Badge><Badge>{d.topic}</Badge>{dateShort(d.publishedAt)}</p></Link>) : <EmptyState title="No research published yet" action={<AlertButton asset={lite} />}>Create a research alert to be told when a note on {a.symbol} is published.</EmptyState>}
        </Panel>
        <Panel title="News" flush>
          {news.length ? news.map((n) => <div key={n.id} className="border-b border-line px-4 py-3 last:border-0"><p className="font-semibold">{n.headline}</p><p className="mt-1 flex flex-wrap gap-1.5 text-xs text-faint"><Badge>{n.category}</Badge>{n.publisher} · {dateShort(n.publishedAt)}</p></div>) : <EmptyState title={`No recent news for ${a.symbol}`}>Headlines linked to this asset appear here.</EmptyState>}
        </Panel>
      </div>

      <section className="rounded-r-card border border-l-[3px] border-line border-l-saffron bg-white px-4 py-3.5">
        <h2 className="text-[15px] font-bold">India context</h2>
        <p className="mt-1 max-w-[80ch] text-slate2">
          {a.currency === 'INR' ? `Priced in rupees, so there is no currency translation for an Indian reader.` : cls === 'fx' ? `One ${a.fx!.base} buys ${num(a.price, priceDp(a.price ?? 1))} ${a.fx!.quote}. A rising rate means the ${a.fx!.base} is strengthening against the ${a.fx!.quote}.` : `Priced in ${a.currency}. One ${a.currency} is about ₹${num(rates[a.currency], rates[a.currency] < 1 ? 3 : 2)} at the reference rate, so a rupee-based return also depends on how ${a.currency}/INR moves.`}
          {market && ` ${market.name} trades ${hhmm(market.istOpen)} to ${hhmm(market.istClose)} IST.`}
          {a.marketId === 'in' && ' NSE IX in GIFT City lists GIFT Nifty, which trades for most of the day and is watched as an early read on the domestic open.'}
        </p>
        {inr != null && cls !== 'fx' && cls !== 'index' && <p className="num mt-1.5 text-[13px]">Approximate INR value: <b>{money(inr, 'INR')}</b> <span className="text-faint">(display: <Price asset={a} />)</span></p>}
      </section>

      <AssetNotes instrumentId={a.id} symbol={a.symbol} name={a.name} />
      <p className="text-xs text-faint">Source: {a.meta.source}. Instrument {a.id}. {statusLine(a.meta)}. <Link href="/resources/data" className="link">Data and methodology</Link>. INRGIFT research describes data and is not a recommendation.</p>
    </PageContainer>
  );
}
