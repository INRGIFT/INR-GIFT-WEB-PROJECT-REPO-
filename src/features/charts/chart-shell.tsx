'use client';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataStatus } from '@/components/ui/data-status';
import { Change, EmptyState, ErrorState, RetryButton, Segmented, Skeleton, UnavailableState } from '@/components/ui/primitives';
import { cn } from '@/lib/format';
import type { Candle, ChartRange, DataMeta } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { SvgChart, type ChartOverlays, type ChartType, type LowerPane } from './svg-chart';

const RANGES = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', 'MAX'] as const;
const TYPES = [['area', 'Area'], ['line', 'Line'], ['candle', 'Candles']] as const;

/**
 * Chart container used by every asset class. Owns range, type, overlays, lower pane, benchmark, full screen and the
 * loading, empty, error and stale states; drawing is delegated to SvgChart. Pages depend on ChartShell only.
 */
export function ChartShell({ assetId, label, currency, benchmark, defaultRange = '1Y', volume = true }: { assetId: string; label: string; currency: string; benchmark?: { id: string; label: string } | null; defaultRange?: ChartRange; volume?: boolean }) {
  const [range, setRange] = useState<ChartRange>(defaultRange);
  const [type, setType] = useState<ChartType>('area');
  const [ov, setOv] = useState<ChartOverlays>({});
  const [lower, setLower] = useState<LowerPane>(volume ? 'volume' : 'none');
  const [bench, setBench] = useState(false);
  const [full, setFull] = useState(false);
  const main = useApi<Candle[]>(`/api/v1/assets/${encodeURIComponent(assetId)}/ohlcv?range=${range}`);
  const bm = useApi<Candle[]>(bench && benchmark ? `/api/v1/assets/${encodeURIComponent(benchmark.id)}/ohlcv?range=${range}` : null);
  useEffect(() => {
    if (!full) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [full]);
  const toggle = (on: boolean, flip: () => void, text: string, disabled?: boolean) => <Button size="sm" aria-pressed={on} disabled={disabled} onClick={flip} className={on ? 'border-brand bg-brand-soft text-brand-ink' : ''}>{text}</Button>;
  const c = main.data;
  const change = c && c.length > 1 ? (c[c.length - 1].c / c[0].c - 1) * 100 : null;
  const stale = main.meta?.dataStatus === 'STALE';
  return (
    <section aria-label={`${label} price chart`} className={cn('min-w-0 rounded-card border border-line bg-white shadow-card', full && 'fixed inset-0 z-[60] overflow-auto rounded-none')}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5 sm:px-4">
        <div className="scrollbar-none -mx-1 max-w-full overflow-x-auto px-1"><Segmented nowrap label="Time range" value={range} onChange={setRange} options={RANGES.map((r) => [r, r] as const)} /></div>
        <span className="flex-1" />
        <Segmented label="Chart type" value={type} onChange={setType} options={TYPES} />
        <Button size="sm" variant="ghost" onClick={() => setFull((f) => !f)} aria-label={full ? 'Exit full screen' : 'Full screen'} aria-pressed={full}>{full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2.5 sm:px-4">
        <span className="mr-0.5 text-xs text-faint">Overlays</span>
        {toggle(Boolean(ov.sma20), () => setOv((o) => ({ ...o, sma20: !o.sma20 })), 'SMA 20', bench)}
        {toggle(Boolean(ov.ema50), () => setOv((o) => ({ ...o, ema50: !o.ema50 })), 'EMA 50', bench)}
        {toggle(Boolean(ov.bollinger), () => setOv((o) => ({ ...o, bollinger: !o.bollinger })), 'Bollinger', bench)}
        <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden />
        <span className="mr-0.5 text-xs text-faint">Lower</span>
        <Segmented size="sm" label="Lower pane" value={lower} onChange={setLower} options={[['volume', 'Volume'], ['rsi', 'RSI'], ['none', 'Off']] as const} />
        {benchmark && <>{toggle(bench, () => setBench((b) => !b), `vs ${benchmark.label}`)}</>}
        <span className="flex-1" />{change != null && <span className="text-[13px] text-slate2">{range} <Change value={change} /></span>}
      </div>
      <div className="p-3 pt-2 sm:p-4 sm:pt-2">
        {main.loading && !c ? <Skeleton className="h-[260px] w-full sm:h-[340px]" /> : main.error ? <ErrorState title="The chart could not load" action={<RetryButton onRetry={main.reload} />}>{main.error} Other modules on this page are unaffected.</ErrorState> : c === null ? <UnavailableState title="Price history unavailable from source">The current data source does not provide a price series for this asset. Nothing is drawn rather than an estimate.</UnavailableState> : !c || c.length < 2 ? <EmptyState title="No price history available">The current data source has no series for this period. Try a longer range.</EmptyState> : (
          <div className={cn('transition-opacity duration-panel', (main.loading || (bench && bm.loading)) && 'opacity-50')}>
            {stale && <p className="mb-2 text-xs text-warn">◐ Served from the last good copy after a provider failure. Values may be out of date.</p>}
            <SvgChart candles={c} type={type} range={range} currency={currency} label={label} lower={lower} overlays={ov} height={full ? 460 : undefined} benchmark={bench && benchmark && bm.data && bm.data.length > 1 ? { label: benchmark.label, closes: bm.data.map((x) => x.c) } : null} />
            {bench && bm.error && <p className="mt-2 text-xs text-down">The benchmark series could not load. Showing {label} only.</p>}
          </div>
        )}
      </div>
      {main.meta && <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2 text-xs text-faint"><DataStatus meta={main.meta as DataMeta} /><span>Prices in {currency}</span>{bench && <span>Both lines rebased to 0% at the start of the period</span>}<span className="hidden md:inline">Arrow keys move the crosshair</span></footer>}
    </section>
  );
}
