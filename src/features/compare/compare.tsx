'use client';
import { Save, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button, IconButton } from '@/components/ui/button';
import { EmptyState, ErrorState, Panel, Segmented, Skeleton, SkeletonRows } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { MetricCell, Price } from '@/features/assets/asset-table';
import { axisLabel } from '@/features/charts/svg-chart';
import { readCompare, writeCompare } from '@/features/workspace/action-buttons';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn, pct } from '@/lib/format';
import { METRICS } from '@/lib/metrics';
import { assetHref, CLASS_LABEL } from '@/lib/routes';
import type { Asset, Candle, ChartRange, MetricKey } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const COLOURS = ['#245BFE', '#E8862A', '#0B7F56', '#071A33'], DASH = ['', '7 4', '2 3', '10 3 2 3'];
const PERIODS = ['1M', '6M', 'YTD', '1Y', '3Y', '5Y'] as const;
const SECTIONS: [string, MetricKey[]][] = [
  ['Performance', ['d1', 'm1', 'ytd', 'y1', 'y3', 'y5']], ['Risk', ['beta', 'volatility', 'maxDrawdown']], ['Valuation', ['marketCap', 'pe', 'fpe', 'pb', 'evEbitda']],
  ['Fundamentals', ['revenueGrowth', 'epsGrowth', 'netMargin', 'roe', 'roic', 'debtEquity']], ['Dividends', ['dividendYield']], ['Technicals', ['rsi', 'sma50Gap']], ['Fund details', ['aum', 'expenseRatio', 'holdingsCount']],
];
const BENCHMARKS = [['', 'No benchmark'], ['SP-500', 'S&P 500'], ['NIFTY-50', 'NIFTY 50']] as const;

function useSeries(slugs: string[], range: ChartRange) {
  const [state, setState] = useState<{ data: Record<string, Candle[] | null>; loading: boolean; error: boolean }>({ data: {}, loading: true, error: false });
  const key = slugs.join(',');
  useEffect(() => {
    if (!key) { setState({ data: {}, loading: false, error: false }); return; }
    let off = false;
    setState((s) => ({ ...s, loading: true, error: false }));
    Promise.all(key.split(',').map((s) => fetch(`/api/v1/assets/${encodeURIComponent(s)}/ohlcv?range=${range}`).then((r) => r.json()).then((j) => [s, (j.data as Candle[] | null) ?? null] as const)))
      .then((rows) => { if (!off) setState({ data: Object.fromEntries(rows), loading: false, error: false }); }).catch(() => { if (!off) setState({ data: {}, loading: false, error: true }); });
    return () => { off = true; };
  }, [key, range]);
  return state;
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
  const lines = [...assets.map((a, i) => ({ key: a.slug, label: a.symbol, colour: COLOURS[i], dash: DASH[i] })), ...(bench ? [{ key: bench, label: BENCHMARKS.find((b) => b[0] === bench)![1], colour: '#6F7C93', dash: '1 4' }] : [])]
    .map((l) => { const c = series.data[l.key]; return c && c.length > 1 ? { ...l, t: c.map((x) => x.t), v: c.map((x) => (x.c / c[0].c - 1) * 100) } : null; }).filter((l): l is NonNullable<typeof l> => l !== null);
  const W = 1000, H = 300, PR = 120;
  const allV = lines.flatMap((l) => l.v), mn = Math.min(0, ...allV), mx = Math.max(0, ...allV);
  const Y = (v: number) => 10 + (1 - (v - mn) / (mx - mn || 1)) * (H - 36);

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
            <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">{lines.map((l) => <span key={l.key} className="flex items-center gap-1.5"><svg width="26" height="8" aria-hidden><line x1="0" x2="26" y1="4" y2="4" stroke={l.colour} strokeWidth="2.4" strokeDasharray={l.dash} /></svg>{l.label} <span className="num text-slate2">{pct(l.v[l.v.length - 1], 1)}</span></span>)}</div>
            {series.error ? <ErrorState title="The chart could not load" /> : series.loading && !lines.length ? <Skeleton className="h-[260px] w-full" /> : !lines.length ? <EmptyState title="No price history available" /> : (
              <svg viewBox={`0 0 ${W} ${H}`} className={cn('block h-auto w-full transition-opacity duration-200', series.loading && 'opacity-50')} role="img" aria-label={`Rebased ${range} returns: ${lines.map((l) => `${l.label} ${pct(l.v[l.v.length - 1], 1)}`).join(', ')}`}>
                {[0, 1, 2, 3, 4].map((k) => { const v = mn + ((mx - mn) * k) / 4; return <g key={k}><line x1={0} x2={W - PR} y1={Y(v)} y2={Y(v)} stroke="#E5EAF1" /><text x={W - 4} y={Y(v) + 4} fontSize={11} fill="#6F7C93" textAnchor="end">{v > 0 ? '+' : ''}{v.toFixed(0)}%</text></g>; })}
                <line x1={0} x2={W - PR} y1={Y(0)} y2={Y(0)} stroke="#D7DEE8" strokeWidth={1.5} />
                {lines.map((l) => <g key={l.key}><polyline fill="none" stroke={l.colour} strokeWidth={2} strokeDasharray={l.dash} points={l.v.map((v, j) => `${((j / (l.v.length - 1)) * (W - PR)).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')} /><text x={W - PR + 6} y={Y(l.v[l.v.length - 1]) + 4} fontSize={11} fontWeight={600} fill={l.colour}>{l.label}</text></g>)}
                {[0, 2, 4].map((k) => { const t = lines[0].t, i = Math.round((k * (t.length - 1)) / 4); return <text key={k} x={(i / (t.length - 1)) * (W - PR)} y={H - 4} fontSize={11} fill="#6F7C93" textAnchor={k === 0 ? 'start' : k === 4 ? 'end' : 'middle'}>{axisLabel(t[i], range)}</text>; })}
              </svg>
            )}
          </Panel>
          <Panel flush title="Metrics" sub="▲ strongest and ▼ weakest in each row, where a direction applies">
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
                      return <tr key={k} className="border-b border-line last:border-0"><th scope="row" className="sticky left-0 bg-white px-4 py-2 text-left font-normal" title={METRICS[k].label}>{METRICS[k].label}</th>{assets.map((a) => { const v = a.m[k]; const isBest = v != null && v === best && best !== weak, isWeak = v != null && v === weak && best !== weak; return <td key={a.id} className={cn('px-4 py-2 text-right', isBest && 'bg-brand-soft font-semibold')}>{isBest && <span className="mr-1 text-[10px] text-brand-ink" title="Strongest in row">▲<span className="sr-only"> strongest</span></span>}{isWeak && <span className="mr-1 text-[10px] text-faint" title="Weakest in row">▼<span className="sr-only"> weakest</span></span>}<MetricCell k={k} v={v} /></td>; })}</tr>;
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
