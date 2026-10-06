'use client';
import { useState, type KeyboardEvent } from 'react';
import { pct } from '@/lib/format';
import type { ChartRange } from '@/lib/types';
import { useMeasure } from '@/lib/use-measure';
import { axisLabel, CHART } from './svg-chart';

export interface Series { key: string; label: string; colour: string; dash: string; t: string[]; v: number[] }
/** Colour and dash pattern pairs, so compare lines are distinguishable without colour. */
export const SERIES_STYLE = [[CHART.brand, ''], [CHART.saffron, '7 4'], [CHART.up, '2 3'], [CHART.navy, '10 3 2 3']] as const;

/** Rebased multi-series line chart (Compare, collections, workspace). Values are percentages from the period start. */
export function MultiLineChart({ series, range, label }: { series: Series[]; range: ChartRange; label: string }) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const W = Math.max(280, width), H = W < 520 ? 230 : 300, PR = W < 520 ? 48 : 64, plotW = W - PR, AX = 22;
  const all = series.flatMap((s) => s.v), mn = Math.min(0, ...all), mx = Math.max(0, ...all), pad = (mx - mn || 1) * 0.06;
  const lo = mn - pad, hi = mx + pad;
  const Y = (v: number) => 8 + (1 - (v - lo) / (hi - lo)) * (H - AX - 16);
  const longest = series.reduce((a, s) => (s.v.length > a.v.length ? s : a), series[0]);
  const n = longest?.v.length ?? 0;
  const X = (i: number, len: number) => (i / Math.max(1, len - 1)) * plotW;
  const at = (s: Series, i: number) => s.v[Math.min(s.v.length - 1, Math.round((i / Math.max(1, n - 1)) * (s.v.length - 1)))];
  const ticks = W < 420 ? 3 : 5;
  const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setHover((h) => Math.max(0, Math.min(n - 1, (h ?? n - 1) + (e.key === 'ArrowRight' ? 1 : -1)))); } else if (e.key === 'Escape') setHover(null); };
  if (!n) return null;
  return (
    <div ref={ref} className="relative w-full">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" tabIndex={0} onKeyDown={onKey} onBlur={() => setHover(null)} className="block max-w-full cursor-crosshair touch-pan-y outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        aria-label={`${label}: ${series.map((s) => `${s.label} ${pct(s.v[s.v.length - 1], 1)}`).join(', ')}. Arrow keys read values.`}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHover(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / plotW) * (n - 1))))); }} onMouseLeave={() => setHover(null)}
        onTouchMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHover(Math.max(0, Math.min(n - 1, Math.round(((e.touches[0].clientX - r.left) / plotW) * (n - 1))))); }} onTouchEnd={() => setHover(null)}>
        {[0, 1, 2, 3, 4].map((k) => { const v = lo + ((hi - lo) * k) / 4; return <g key={k}><line x1={0} x2={plotW} y1={Y(v)} y2={Y(v)} stroke={CHART.grid} /><text x={W - 4} y={Y(v) + 4} fontSize={11} fill={CHART.axis} textAnchor="end">{v > 0 ? '+' : ''}{v.toFixed(hi - lo < 10 ? 1 : 0)}%</text></g>; })}
        <line x1={0} x2={plotW} y1={Y(0)} y2={Y(0)} stroke={CHART.vol} strokeWidth={1.5} />
        {series.map((s) => <polyline key={s.key} fill="none" stroke={s.colour} strokeWidth={2} strokeDasharray={s.dash} strokeLinejoin="round" points={s.v.map((v, j) => `${X(j, s.v.length).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')} />)}
        {Array.from({ length: ticks }, (_, k) => { const i = Math.round((k * (n - 1)) / (ticks - 1)); return <text key={k} x={X(i, n)} y={H - 6} fontSize={11} fill={CHART.axis} textAnchor={k === 0 ? 'start' : k === ticks - 1 ? 'end' : 'middle'}>{axisLabel(longest.t[i], range)}</text>; })}
        {hover != null && <><line x1={X(hover, n)} x2={X(hover, n)} y1={0} y2={H - AX} stroke={CHART.slate} strokeDasharray="3 3" />{series.map((s) => <circle key={s.key} cx={X(hover, n)} cy={Y(at(s, hover))} r={3.5} fill="#fff" stroke={s.colour} strokeWidth={2} />)}</>}
      </svg>
      {hover != null && (
        <div aria-live="polite" className="pointer-events-none absolute top-2 z-10 animate-fade-in rounded-lg border border-line2 bg-white/95 px-2.5 py-1.5 text-xs shadow-pop" style={X(hover, n) > plotW * 0.55 ? { left: 8 } : { right: PR + 8 }}>
          <p className="mb-0.5 font-semibold">{axisLabel(longest.t[hover], range)}</p>
          {series.map((s) => <p key={s.key} className="num flex items-center gap-2"><svg width="16" height="6" aria-hidden><line x1="0" x2="16" y1="3" y2="3" stroke={s.colour} strokeWidth="2.4" strokeDasharray={s.dash} /></svg><span className="text-slate2">{s.label}</span><span className="ml-auto font-semibold">{pct(at(s, hover), 1)}</span></p>)}
        </div>
      )}
    </div>
  );
}
export function SeriesLegend({ series }: { series: Series[] }) {
  return <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">{series.map((l) => <span key={l.key} className="flex items-center gap-1.5"><svg width="26" height="8" aria-hidden><line x1="0" x2="26" y1="4" y2="4" stroke={l.colour} strokeWidth="2.4" strokeDasharray={l.dash} /></svg>{l.label} <span className="num text-slate2">{pct(l.v[l.v.length - 1], 1)}</span></span>)}</div>;
}
