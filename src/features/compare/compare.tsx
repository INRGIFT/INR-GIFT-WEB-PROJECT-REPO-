'use client';
import { Save, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button, IconButton } from '@/components/ui/button';
import { EmptyState, ErrorState, Panel, Segmented, Skeleton, SkeletonRows } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { MetricCell, Price } from '@/features/assets/asset-table';
import { MultiLineChart, SERIES_STYLE, SeriesLegend, type Series } from '@/features/charts/multi-line-chart';
import { CHART } from '@/features/charts/svg-chart';
import { rebase } from '@/lib/indicators';
import { readCompare, writeCompare } from '@/features/workspace/action-buttons';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/format';
import { METRICS } from '@/lib/metrics';
import { assetHref, CLASS_LABEL } from '@/lib/routes';
import type { Asset, Candle, ChartRange, MetricKey } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const COLOURS = SERIES_STYLE.map(([c]) => c) as string[], DASH = SERIES_STYLE.map(([, d]) => d) as string[];
const PERIODS = ['1M', '6M', 'YTD', '1Y', '3Y', '5Y'] as const;
const SECTIONS: [string, MetricKey[]][] = [
  ['Performance', ['d1', 'm1', 'ytd', 'y1', 'y3', 'y5']], ['Risk', ['beta', 'volatility', 'maxDrawdown']], ['Valuation', ['marketCap', 'pe', 'fpe', 'pb', 'evEbitda']],
  ['Fundamentals', ['revenueGrowth', 'epsGrowth', 'netMargin', 'roe', 'roic', 'debtEquity']], ['Dividends', ['dividendYield']], ['Technicals', ['rsi', 'sma50Gap']], ['Fund details', ['aum', 'expenseRatio', 'holdingsCount']],
];
const BENCHMARKS = [['', 'No benchmark'], ['SP-500', 'S&P 500'], ['NIFTY-50', 'NIFTY 50']] as const;

/** A series that failed (e.g. a provider error) is treated as missing rather than failing the whole chart. */
const seriesData = (j: { data?: Candle[] | null }) => j.data ?? null;
function useSeries(slugs: string[], range: ChartRange) {
  const [state, setState] = useState<{ data: Record<string, Candle[] | null>; loading: boolean; error: boolean }>({ data: {}, loading: true, error: false });
  const [tick, setTick] = useState(0);
  const key = slugs.join(',');
  useEffect(() => {
    if (!key) { setState({ data: {}, loading: false, error: false }); return; }
    let off = false;
    setState((s) => ({ ...s, loading: true, error: false }));
    Promise.all(key.split(',').map((s) => fetch(`/api/v1/assets/${encodeURIComponent(s)}/ohlcv?range=${range}`).then((r) => r.json()).then((j) => [s, seriesData(j)] as const)))
      .then((rows) => { if (!off) setState({ data: Object.fromEntries(rows), loading: false, error: false }); }).catch(() => { if (!off) setState({ data: {}, loading: false, error: true }); });
    return () => { off = true; };
  }, [key, range, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function Compare() {
  const params = useSearchParams();
  const ws = useWorkspace();
  const toast = useToast();
  const [slugs, setSlugs] = useState<string[] | null>(null);
  const [range, setRange] = useState<ChartRange>('1Y');
  const [bench, setBench] = useState('');
  const universe = useApi<Asset[]>('/api/v1/assets?class=stocks,etfs,reits,indices&pageSize=500');
  useEffect(() => { const fromUrl = params.get('s')?.split(',').filter(Boolean).slice(0, 4); const init = fromUrl?.length ? fromUrl : readCompare(); setSlugs(init.length ? init : ['AAPL', 'NVDA', 'MSFT']); }, [params]);
  useEffect(() => { if (!slugs) return; writeCompare(slugs); window.history.replaceState(null, '', `/discover/compare${slugs.length ? `?s=${slugs.join(',')}` : ''}`); }, [slugs]);

  const assets = useMemo(() => (slugs && universe.data ? slugs.map((s) => universe.data!.find((a) => a.slug === s)).filter((a): a is Asset => Boolean(a)) : []), [slugs, universe.data]);
  const series = useSeries([...assets.map((a) => a.slug), ...(bench ? [bench] : [])], range);
  const lines: Series[] = [...assets.map((a, i) => ({ key: a.slug, label: a.symbol, colour: COLOURS[i], dash: DASH[i] })), ...(bench ? [{ key: bench, label: BENCHMARKS.find((b) => b[0] === bench)![1], colour: CHART.axis, dash: '1 4' }] : [])]
    .map((l) => { const c = series.data[l.key]; return c && c.length > 1 ? { ...l, t: c.map((x) => x.t), v: rebase(c.map((x) => x.c)) } : null; }).filter((l): l is Series => l !== null);
  const save = async () => { if (!ws.requireAuth()) return; const title = assets.map((a) => a.symbol).join(' vs '); if (await ws.add('saved_comparisons', { name: title, instrument_ids: assets.map((a) => a.id) })) { ws.track('comparison', title, `/discover/compare?s=${slugs!.join(',')}`); toast('Comparison saved'); } };
  if (!slugs || (universe.loading && !universe.data)) return <Panel title="Compare"><SkeletonRows rows={8} /></Panel>;
  if (universe.error) return <ErrorState title="Compare could not load" action={<Button onClick={universe.reload}>Retry</Button>}>{universe.error}</ErrorState>;
  const available = (universe.data ?? []).filter((a) => !slugs.includes(a.slug));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {assets.map((a, i) => <span key={a.id} className="flex animate-fade-up items-center gap-1.5 rounded-ctl border border-line2 bg-white py-1 pl-2.5 pr-1 font-medium"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOURS[i] }} /><Link href={assetHref(a)} className="hover:text-brand-ink">{a.symbol}</Link><IconButton label={`Remove ${a.name}`} onClick={() => setSlugs(slugs.filter((s) => s !== a.slug))} className="h-7 w-7"><X size={14} /></IconButton></span>)}
        {assets.length < 4 ? (<><label className="sr-only" htmlFor="cmp-add">Add an asset</label><select id="cmp-add" className="field h-10 w-auto max-w-[240px]" value="" onChange={(e) => e.target.value && setSlugs([...slugs, e.target.value])}><option value="">Add an asset…</option>{(['stock', 'etf', 'reit', 'index'] as const).map((c) => <optgroup key={c} label={CLASS_LABEL[c].many}>{available.filter((a) => a.cls === c).map((a) => <option key={a.id} value={a.slug}>{a.name} ({a.symbol})</option>)}</optgroup>)}</select></>) : <span className="text-xs text-faint">Four of four slots used</span>}
        <span className="flex-1" />
        <Button variant="primary" onClick={save} disabled={assets.length < 2}><Save size={16} />Save comparison</Button>
      </div>
      {assets.length < 2 ? <div className="rounded-card border border-line bg-white"><EmptyState title={`Add ${assets.length ? 'one more asset' : 'two assets'} to compare`}>Use the selector above, or the compare button on any table row or asset page.</EmptyState></div> : (
        <>
          <Panel title="Relative performance" sub="Rebased to 0% at the start of the period" tools={<div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="cmp-bench">Benchmark</label><select id="cmp-bench" className="h-8 rounded-lg border border-line2 bg-white px-2 text-[13px]" value={bench} onChange={(e) => setBench(e.target.value)}>{BENCHMARKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><Segmented size="sm" label="Period" value={range as (typeof PERIODS)[number]} onChange={(v) => setRange(v)} options={PERIODS.map((p) => [p, p] as const)} /></div>}>
            <SeriesLegend series={lines} />
            {series.error ? <ErrorState title="The chart could not load" action={<Button onClick={series.reload}>Retry</Button>} /> : series.loading && !lines.length ? <Skeleton className="h-[260px] w-full" /> : !lines.length ? <EmptyState title="No price history available">The source has no series for these assets over this period.</EmptyState> : (
              <div className={cn('transition-opacity duration-panel', series.loading && 'opacity-50')}><MultiLineChart series={lines} range={range} label={`Rebased ${range} returns`} /></div>
            )}
          </Panel>
          <Panel flush title="Metrics" sub="Best and weakest in each row are marked where a direction applies">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead><tr><th scope="col" className="sticky left-0 z-10 border-b border-line bg-white px-4 py-2.5 text-left text-xs font-semibold text-faint">Metric</th>{assets.map((a, i) => <th key={a.id} scope="col" className="min-w-[130px] border-b border-line px-4 py-2.5 text-right"><Link href={assetHref(a)} className="font-semibold hover:underline" style={{ color: COLOURS[i] }}>{a.symbol}</Link><span className="block text-[11px] font-normal text-faint">{CLASS_LABEL[a.cls].one} · {a.country}</span></th>)}</tr></thead>
                <tbody>
                  <tr className="border-b border-line"><th scope="row" className="sticky left-0 bg-white px-4 py-2 text-left font-normal">Price</th>{assets.map((a) => <td key={a.id} className="px-4 py-2 text-right"><Price asset={a} className="font-medium" /></td>)}</tr>
                  {SECTIONS.map(([title, keys]) => {
                    const rows = keys.filter((k) => assets.some((a) => a.m[k] !== undefined));
                    if (!rows.length) return null;
                    return [<tr key={title}><th colSpan={assets.length + 1} scope="colgroup" className="sticky left-0 bg-soft px-4 py-1.5 text-left text-xs font-semibold text-slate2">{title}</th></tr>, ...rows.map((k) => {
                      const vals = assets.map((a) => a.m[k]).filter((v): v is number => v != null);
                      const dir = METRICS[k].better;
                      const best = dir && vals.length > 1 ? (dir === 'high' ? Math.max(...vals) : Math.min(...vals)) : null;
                      const weak = dir && vals.length > 1 ? (dir === 'high' ? Math.min(...vals) : Math.max(...vals)) : null;
                      return <tr key={k} className="border-b border-line last:border-0"><th scope="row" className="sticky left-0 bg-white px-4 py-2 text-left font-normal" title={METRICS[k].label}>{METRICS[k].label}</th>{assets.map((a) => { const v = a.m[k]; const isBest = v != null && v === best && best !== weak, isWeak = v != null && v === weak && best !== weak; return <td key={a.id} className={cn('px-4 py-2 text-right', isBest && 'bg-brand-soft/70')}><span className="inline-flex items-center justify-end gap-1.5">{isBest && <span className="rounded bg-brand px-1 text-[10px] font-semibold text-white">Best</span>}{isWeak && <span className="rounded bg-hover px-1 text-[10px] font-semibold text-slate2">Weakest</span>}<span className={isBest ? 'font-semibold' : ''}><MetricCell k={k} v={v} /></span></span></td>; })}</tr>;
                    })];
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
