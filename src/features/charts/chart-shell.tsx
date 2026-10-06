'use client';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataStatus } from '@/components/ui/data-status';
import { Change, EmptyState, ErrorState, Segmented, Skeleton } from '@/components/ui/primitives';
import { cn } from '@/lib/format';
import type { Candle, ChartRange, DataMeta } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { SvgChart, type ChartType } from './svg-chart';

const RANGES = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', 'MAX'] as const;
const TYPES = [['area', 'Area'], ['line', 'Line'], ['candle', 'Candles']] as const;

/**
 * Chart container used by every asset class. Owns range, type, overlays, loading, empty and error states,
 * and delegates drawing to SvgChart. Pages depend on ChartShell only.
 */
export function ChartShell({ assetId, label, currency, benchmark, defaultRange = '1Y', volume = true }: { assetId: string; label: string; currency: string; benchmark?: { id: string; label: string } | null; defaultRange?: ChartRange; volume?: boolean }) {
  const [range, setRange] = useState<ChartRange>(defaultRange);
  const [type, setType] = useState<ChartType>('area');
  const [opts, setOpts] = useState({ sma20: false, ema50: false, vol: volume, bench: false });
  const [full, setFull] = useState(false);
  const main = useApi<Candle[]>(`/api/v1/assets/${assetId}/ohlcv?range=${range}`);
  const bench = useApi<Candle[]>(opts.bench && benchmark ? `/api/v1/assets/${benchmark.id}/ohlcv?range=${range}` : null);
  useEffect(() => { if (!full) return; const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); }; window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc); }, [full]);
  const toggle = (k: keyof typeof opts, text: string) => <Button size="sm" aria-pressed={opts[k]} onClick={() => setOpts((o) => ({ ...o, [k]: !o[k] }))} className={opts[k] ? 'border-brand bg-brand-soft text-brand-ink' : ''}>{text}</Button>;
  const c = main.data;
  const change = c && c.length > 1 ? (c[c.length - 1].c / c[0].c - 1) * 100 : null;
  return (
    <section aria-label={`${label} price chart`} className={cn('min-w-0 rounded-card border border-line bg-white shadow-card', full && 'fixed inset-0 z-[60] overflow-auto rounded-none')}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        <Segmented label="Time range" value={range} onChange={setRange} options={RANGES.map((r) => [r, r] as const)} />
        <span className="flex-1" />
        <Segmented label="Chart type" value={type} onChange={setType} options={TYPES} />
        <Button size="sm" variant="ghost" onClick={() => setFull((f) => !f)} aria-label={full ? 'Exit full screen' : 'Full screen'}>{full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 pt-2.5">
        <span className="text-xs text-faint">Overlays</span>{toggle('sma20', 'SMA 20')}{toggle('ema50', 'EMA 50')}{toggle('vol', 'Volume')}{benchmark && toggle('bench', `vs ${benchmark.label}`)}
        <span className="flex-1" />{change != null && <span className="text-[13px] text-slate2">{range} <Change value={change} /></span>}
      </div>
      <div className="p-4 pt-2">
        {main.loading && !c ? <Skeleton className="h-[300px] w-full" /> : main.error ? <ErrorState title="The chart could not load" action={<Button onClick={main.reload}>Retry</Button>}>{main.error}</ErrorState> : !c || c.length < 2 ? <EmptyState title="No price history available">The current data source has no series for this period.</EmptyState> : (
          <div className={cn('transition-opacity duration-200', main.loading && 'opacity-50')}><SvgChart candles={c} type={type} range={range} currency={currency} label={label} showVolume={opts.vol} sma20={opts.sma20} ema50={opts.ema50} benchmark={opts.bench && benchmark && bench.data ? { label: benchmark.label, closes: bench.data.map((x) => x.c) } : null} /></div>
        )}
      </div>
      {main.meta && <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2 text-xs text-faint"><DataStatus meta={main.meta as DataMeta} /><span>Prices in {currency}</span>{opts.bench && <span>Both lines rebased to 0% at the start of the period</span>}</footer>}
    </section>
  );
}
