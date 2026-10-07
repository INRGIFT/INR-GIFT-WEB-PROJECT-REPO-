'use client';
import { Activity, Maximize2, Minimize2, PencilLine, Redo2, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Segmented } from '@/components/ui/primitives';
import { INDICATORS, type IndicatorDef } from '@/lib/charts/klinechart/indicators';
import { DRAWING_TOOLS } from '@/lib/charts/klinechart/lifecycle';
import { RESOLUTION_LABEL, type ChartResolution } from '@/lib/charts/types';
import { cn } from '@/lib/format';
import type { ChartRange } from '@/lib/types';

export type ChartKind = 'candle_solid' | 'ohlc' | 'area' | 'line';
export type ChartScale = 'normal' | 'logarithm' | 'percentage';
const KINDS: [ChartKind, string][] = [['candle_solid', 'Candles'], ['ohlc', 'Bars'], ['line', 'Line'], ['area', 'Area']];

const iconBtn = 'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate2 transition-colors hover:bg-hover hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-40';
const textBtn = 'inline-flex h-8 items-center gap-1.5 rounded-lg border border-line2 bg-white px-2.5 text-[13px] font-medium text-navy transition-colors hover:border-faint';

/** A toolbar button that opens a small panel. Escape or a click outside closes it and returns focus to the button. */
function Popover({ label, icon, count, children }: { label: string; icon: ReactNode; count?: number; children: (close: () => void) => ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState<'left' | 'right'>('right');
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    box.current?.querySelector<HTMLElement>('input,button:not([aria-expanded])')?.focus();
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button ref={button} type="button" aria-expanded={open} aria-controls={id} onClick={() => { const r = button.current?.getBoundingClientRect(); if (r) setAlign(r.right - 280 < 8 ? 'left' : 'right'); setOpen((o) => !o); }} className={cn(textBtn, open && 'border-brand text-brand-ink')}>
        {icon}{label}{count ? <span className="num rounded-full bg-brand-soft px-1.5 text-[11px] font-semibold text-brand-ink">{count}</span> : null}
      </button>
      {open && <div id={id} role="dialog" aria-label={label} className={cn('absolute z-30 mt-1.5 w-[280px] max-w-[calc(100vw-32px)] animate-pop-in rounded-card border border-line2 bg-white p-2 shadow-pop', align === 'left' ? 'left-0' : 'right-0')}>{children(() => { setOpen(false); button.current?.focus(); })}</div>}
    </div>
  );
}

export interface ToolbarProps {
  variant: 'full' | 'compact' | 'hero';
  ranges: ChartRange[];
  range: ChartRange;
  onRange?: (r: ChartRange) => void;
  resolution: ChartResolution;
  supported: ChartResolution[];
  onResolution?: (r: ChartResolution) => void;
  kind: ChartKind;
  onKind: (k: ChartKind) => void;
  relative: boolean;
  scale: ChartScale;
  onScale: (s: ChartScale) => void;
  indicators: IndicatorDef['id'][];
  onIndicators: (ids: IndicatorDef['id'][]) => void;
  hasVolume: boolean;
  activeTool: string | null;
  onDraw: (tool: string) => void;
  onClearDrawings: () => void;
  onZoom: (dir: 'in' | 'out') => void;
  onLatest: () => void;
  benchmark?: { label: string; on: boolean; toggle: () => void } | null;
  full: boolean;
  onFull: () => void;
}

/** Chart controls. Only working features: every button changes the chart, and unavailable options are not shown. */
export function ChartToolbar(p: ToolbarProps) {
  const offered = INDICATORS.filter((d) => (!d.needsVolume || p.hasVolume) && (!p.relative || d.pane === 'sub'));
  const toggleInd = (id: IndicatorDef['id']) => p.onIndicators(p.indicators.includes(id) ? p.indicators.filter((x) => x !== id) : [...p.indicators, id]);
  // Hero (public homepage): the period switch only, when the server prepared more than one period.
  if (p.variant === 'hero') return p.onRange && p.ranges.length > 1 ? <div className="px-3 pt-2 sm:px-4"><Segmented nowrap size="sm" label="Time range" value={p.range} onChange={p.onRange} options={p.ranges.map((r) => [r, r] as const)} /></div> : null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2 sm:px-4">
      {p.onRange && p.ranges.length > 1 && <div className="scrollbar-none -mx-1 max-w-full overflow-x-auto px-1"><Segmented nowrap size="sm" label="Time range" value={p.range} onChange={p.onRange} options={p.ranges.map((r) => [r, r] as const)} /></div>}
      {p.onResolution && p.supported.length > 1 && (
        <label className="inline-flex items-center gap-1.5 text-xs text-faint"><span>Interval</span>
          <select value={p.resolution} onChange={(e) => p.onResolution!(e.target.value as ChartResolution)} className="h-8 rounded-lg border border-line2 bg-white px-2 text-[13px] font-medium text-navy">{p.supported.map((r) => <option key={r} value={r}>{RESOLUTION_LABEL[r]}</option>)}</select>
        </label>
      )}
      <span className="flex-1" />
      {!p.relative && <Segmented size="sm" label="Chart type" value={p.kind} onChange={p.onKind} options={KINDS} />}
      {p.variant === 'full' && (
        <>
          {offered.length > 0 && (
            <Popover label="Indicators" icon={<Activity size={14} aria-hidden />} count={p.indicators.filter((i) => offered.some((d) => d.id === i)).length}>
              {() => (
                <fieldset>
                  <legend className="px-1 pb-1 text-micro font-semibold uppercase tracking-[.08em] text-faint">On the chart</legend>
                  {offered.map((d) => (
                    <label key={d.id} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-hover">
                      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand" checked={p.indicators.includes(d.id)} onChange={() => toggleInd(d.id)} />
                      <span className="min-w-0"><span className="block text-[13px] font-medium text-navy">{d.label} <span className="font-normal text-faint">{d.short.replace(d.label, '').trim()}</span></span><span className="block text-xs text-slate2">{d.description}</span></span>
                    </label>
                  ))}
                </fieldset>
              )}
            </Popover>
          )}
          <Popover label="Draw" icon={<PencilLine size={14} aria-hidden />}>
            {(close) => (
              <div>
                <p className="px-1 pb-1 text-xs text-slate2">Pick a tool, then click points on the chart. Drawings stay until you clear them or leave the page.</p>
                <ul className="grid grid-cols-2 gap-1">{DRAWING_TOOLS.map((t) => <li key={t.name}><button type="button" onClick={() => { p.onDraw(t.name); close(); }} aria-pressed={p.activeTool === t.name} className={cn('w-full rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-hover', p.activeTool === t.name && 'bg-brand-soft text-brand-ink')}>{t.label}</button></li>)}</ul>
                <button type="button" onClick={() => { p.onClearDrawings(); close(); }} className="mt-1.5 inline-flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-down hover:bg-down/5"><Trash2 size={14} aria-hidden />Clear drawings</button>
              </div>
            )}
          </Popover>
          {!p.relative && (
            <label className="inline-flex items-center gap-1.5 text-xs text-faint"><span className="sr-only sm:not-sr-only">Scale</span>
              <select value={p.scale} onChange={(e) => p.onScale(e.target.value as ChartScale)} aria-label="Price scale" className="h-8 rounded-lg border border-line2 bg-white px-2 text-[13px] font-medium text-navy"><option value="normal">Linear</option><option value="logarithm">Logarithmic</option><option value="percentage">Percent</option></select>
            </label>
          )}
          {p.benchmark && <button type="button" aria-pressed={p.benchmark.on} onClick={p.benchmark.toggle} className={cn(textBtn, p.benchmark.on && 'border-brand bg-brand-soft text-brand-ink')}>vs {p.benchmark.label}</button>}
        </>
      )}
      <span className="inline-flex items-center">
        <button type="button" className={iconBtn} onClick={() => p.onZoom('in')} aria-label="Zoom in" title="Zoom in"><ZoomIn size={16} /></button>
        <button type="button" className={iconBtn} onClick={() => p.onZoom('out')} aria-label="Zoom out" title="Zoom out"><ZoomOut size={16} /></button>
        <button type="button" className={iconBtn} onClick={p.onLatest} aria-label="Go to the latest bar" title="Latest bar"><Redo2 size={16} /></button>
        <button type="button" className={iconBtn} onClick={p.onFull} aria-label={p.full ? 'Exit full screen' : 'Full screen'} aria-pressed={p.full} title={p.full ? 'Exit full screen' : 'Full screen'}>{p.full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
      </span>
    </div>
  );
}
