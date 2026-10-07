'use client';
import { Save, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button, IconButton } from '@/components/ui/button';
import { STATUS_LABEL } from '@/components/ui/data-status';
import { EmptyState, ErrorState, Panel, SkeletonRows } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { MetricCell, Price } from '@/features/assets/asset-table';
import { readCompare, writeCompare } from '@/features/workspace/action-buttons';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/format';
import { METRICS } from '@/lib/metrics';
import { assetHref, CLASS_LABEL } from '@/lib/routes';
import type { Asset, MetricKey } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { FinancialChart } from '@/features/charts/financial-chart';
import { SERIES_STYLES } from '@/lib/charts/palette';

const COLOURS = SERIES_STYLES.map((s) => s.color);
const PERIODS = ['1M', '6M', 'YTD', '1Y', '3Y', '5Y'] as const;
const SECTIONS: [string, MetricKey[]][] = [
  ['Performance', ['d1', 'm1', 'ytd', 'y1', 'y3', 'y5']], ['Risk', ['beta', 'volatility', 'maxDrawdown']], ['Valuation', ['marketCap', 'pe', 'fpe', 'pb', 'evEbitda']],
  ['Fundamentals', ['revenueGrowth', 'epsGrowth', 'netMargin', 'roe', 'roic', 'debtEquity']], ['Dividends', ['dividendYield']], ['Technicals', ['rsi', 'sma50Gap']], ['Fund details', ['aum', 'expenseRatio', 'holdingsCount']],
];
const BENCHMARKS = [['', 'No benchmark'], ['SP-500', 'S&P 500'], ['NIFTY-50', 'NIFTY 50']] as const;

export function Compare() {
  const params = useSearchParams();
  const ws = useWorkspace();
  const toast = useToast();
  const [slugs, setSlugs] = useState<string[] | null>(null);
  const [bench, setBench] = useState('');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (t: string) => setHidden((h) => { const n = new Set(h); if (n.has(t)) n.delete(t); else n.add(t); return n; });
  const universe = useApi<Asset[]>('/api/v1/assets?class=stocks,etfs,reits,indices&pageSize=500');
  useEffect(() => { const fromUrl = params.get('s')?.split(',').filter(Boolean).slice(0, 4); const init = fromUrl?.length ? fromUrl : readCompare(); setSlugs(init.length ? init : ['AAPL', 'NVDA', 'MSFT']); }, [params]);
  useEffect(() => { if (!slugs) return; writeCompare(slugs); window.history.replaceState(null, '', `/discover/compare${slugs.length ? `?s=${slugs.join(',')}` : ''}`); }, [slugs]);

  const assets = useMemo(() => (slugs && universe.data ? slugs.map((s) => universe.data!.find((a) => a.slug === s)).filter((a): a is Asset => Boolean(a)) : []), [slugs, universe.data]);
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
          <section aria-labelledby="cmp-perf" className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="cmp-perf" className="text-[15px] font-bold">Relative performance</h2><span className="text-xs text-faint">Change from the start of the period, %</span>
              <span className="flex-1" />
              <label className="sr-only" htmlFor="cmp-bench">Benchmark</label>
              <select id="cmp-bench" className="h-8 rounded-lg border border-line2 bg-white px-2 text-[13px]" value={bench} onChange={(e) => setBench(e.target.value)}>{BENCHMARKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </div>
            <FinancialChart key={`${assets.map((a) => a.slug).join(',')}|${bench}`} variant="compact" defaultRange="1Y" ranges={[...PERIODS]} defaultIndicators={[]}
              instrument={{ idOrSlug: assets[0].slug, symbol: assets[0].symbol, name: assets[0].name }}
              compareWith={[...assets.slice(1).map((a) => ({ idOrSlug: a.slug, label: a.symbol })), ...(bench ? [{ idOrSlug: bench, label: BENCHMARKS.find((b) => b[0] === bench)![1] }] : [])]} />
          </section>
          <Panel flush title="Metrics" sub="Highest and lowest value in each row are marked. Higher is not automatically better." tools={<div role="group" aria-label="Show sections" className="flex flex-wrap gap-1">{['Identity', ...SECTIONS.map(([t]) => t)].map((t) => <button key={t} type="button" aria-pressed={!hidden.has(t)} onClick={() => toggle(t)} className={cn('rounded-md border px-2 py-0.5 text-caption font-medium transition-colors duration-micro', hidden.has(t) ? 'border-line2 text-faint line-through' : 'border-brand/40 bg-brand-soft text-brand-ink')}>{t}</button>)}</div>}>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead><tr><th scope="col" className="sticky left-0 z-10 border-b border-line bg-white px-4 py-2.5 text-left text-xs font-semibold text-faint">Metric</th>{assets.map((a, i) => <th key={a.id} scope="col" className="min-w-[130px] border-b border-line px-4 py-2.5 text-right"><Link href={assetHref(a)} className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline"><span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: COLOURS[i] }} />{a.symbol}</Link><span className="block text-[11px] font-normal text-faint">{CLASS_LABEL[a.cls].one} · {a.country}</span></th>)}</tr></thead>
                <tbody>
                  <tr className="border-b border-line"><th scope="row" className="sticky left-0 bg-white px-4 py-2 text-left font-normal">Price</th>{assets.map((a) => <td key={a.id} className="px-4 py-2 text-right"><Price asset={a} className="font-medium" /></td>)}</tr>
                  {!hidden.has('Identity') && [<tr key="identity-h"><th colSpan={assets.length + 1} scope="colgroup" className="sticky left-0 bg-soft px-4 py-1.5 text-left text-xs font-semibold text-slate2">Identity</th></tr>,
                    ...([['Type', (a: Asset) => CLASS_LABEL[a.cls].one], ['Exchange', (a: Asset) => `${a.exchange} (${a.mic})`], ['Country', (a: Asset) => a.country], ['Currency', (a: Asset) => a.currency], ['Sector or strategy', (a: Asset) => a.sector ?? a.etf?.strategy ?? '—'], ['Data status', (a: Asset) => STATUS_LABEL[a.status]]] as const).map(([label, f]) => <tr key={label} className="border-b border-line"><th scope="row" className="sticky left-0 bg-white px-4 py-2 text-left font-normal">{label}</th>{assets.map((a) => <td key={a.id} className="px-4 py-2 text-right text-slate2">{f(a)}</td>)}</tr>)]}
                  {SECTIONS.map(([title, keys]) => {
                    const rows = keys.filter((k) => assets.some((a) => a.m[k] !== undefined));
                    if (!rows.length || hidden.has(title)) return null;
                    return [<tr key={title}><th colSpan={assets.length + 1} scope="colgroup" className="sticky left-0 bg-soft px-4 py-1.5 text-left text-xs font-semibold text-slate2">{title}</th></tr>, ...rows.map((k) => {
                      const vals = assets.map((a) => a.m[k]).filter((v): v is number => v != null);
                      // Descriptive marks only: the highest and lowest value, with no judgement about which is better.
                      const best = vals.length > 1 ? Math.max(...vals) : null;
                      const weak = vals.length > 1 ? Math.min(...vals) : null;
                      return <tr key={k} className="border-b border-line last:border-0"><th scope="row" className="sticky left-0 bg-white px-4 py-2 text-left font-normal" title={METRICS[k].label}>{METRICS[k].label}</th>{assets.map((a) => { const v = a.m[k]; const isBest = v != null && v === best && best !== weak, isWeak = v != null && v === weak && best !== weak; return <td key={a.id} className="px-4 py-2 text-right"><span className="inline-flex items-center justify-end gap-1.5">{isBest && <span className="rounded bg-hover px-1 text-[10px] font-semibold text-slate2">Highest</span>}{isWeak && <span className="rounded bg-hover px-1 text-[10px] font-semibold text-slate2">Lowest</span>}<span><MetricCell k={k} v={v} /></span></span></td>; })}</tr>;
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
