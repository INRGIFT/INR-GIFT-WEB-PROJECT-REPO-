'use client';
import { useMemo, useState, type KeyboardEvent } from 'react';
import { compact, num, pct, priceDp } from '@/lib/format';
import { bollinger, ema, rebase, rsi, sma } from '@/lib/indicators';
import type { Candle, ChartRange } from '@/lib/types';
import { useMeasure } from '@/lib/use-measure';

export type ChartType = 'area' | 'line' | 'candle';
export type LowerPane = 'volume' | 'rsi' | 'none';
export interface ChartOverlays { sma20?: boolean; ema50?: boolean; bollinger?: boolean }
export interface ChartRenderProps { candles: Candle[]; type: ChartType; range: ChartRange; currency: string; label: string; lower: LowerPane; overlays: ChartOverlays; benchmark?: { label: string; closes: number[] } | null; height?: number }

/** Chart palette. The only place outside tailwind.config.ts that names colours, because SVG needs literal values. */
export const CHART = { grid: '#E5EAF1', axis: '#6F7C93', up: '#0B7F56', down: '#C2352B', brand: '#245BFE', saffron: '#E8862A', slate: '#4A5770', navy: '#071A33', vol: '#D7DEE8', band: '#245BFE' };
const PR = 58, PAD_T = 8, AXIS_H = 22;

export function axisLabel(iso: string, range: ChartRange) {
  const d = new Date(iso);
  if (range === '1D') return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
  if (range === '5D') return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit' }).format(d);
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', ...(['1Y', '3Y', '5Y', 'MAX', 'YTD'].includes(range) ? { year: '2-digit' } : {}) }).format(d);
}
const tickCount = (w: number) => (w < 420 ? 3 : w < 760 ? 4 : 6);

/**
 * The SVG renderer behind ChartShell. It is the only file that draws price charts, so swapping in another charting
 * library means replacing this component and keeping ChartRenderProps. It measures its container and draws at real
 * pixel size, so labels stay legible on phones. Pointer, touch and arrow keys move the crosshair.
 */
export function SvgChart({ candles, type, range, currency, label, lower, overlays, benchmark, height }: ChartRenderProps) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = candles.length;
  const W = Math.max(280, width);
  const H = height ?? (W < 520 ? 220 : 300);
  const LH = lower === 'none' || benchmark ? 0 : W < 520 ? 52 : 70;
  const TH = H + (LH ? LH + 10 : 0) + AXIS_H;
  const plotW = W - PR;
  const g = useMemo(() => {
    const closes = candles.map((c) => c.c);
    const pctMode = Boolean(benchmark);
    const a = pctMode ? rebase(closes) : closes;
    const b = benchmark ? rebase(benchmark.closes) : null;
    const bb = !pctMode && overlays.bollinger ? bollinger(closes) : null;
    const lows = pctMode ? [...a, ...(b ?? [])] : [...candles.map((c) => c.l), ...((bb?.lower.filter((x): x is number => x != null)) ?? [])];
    const highs = pctMode ? [...a, ...(b ?? [])] : [...candles.map((c) => c.h), ...((bb?.upper.filter((x): x is number => x != null)) ?? [])];
    let mn = Math.min(...lows), mx = Math.max(...highs);
    const pad = (mx - mn || 1) * 0.07; mn -= pad; mx += pad;
    return { closes, a, b, bb, mn, mx, pctMode, rsi: lower === 'rsi' && !pctMode ? rsi(closes) : null, s20: overlays.sma20 && !pctMode ? sma(closes, 20) : null, e50: overlays.ema50 && !pctMode ? ema(closes, 50) : null };
  }, [candles, benchmark, overlays.bollinger, overlays.sma20, overlays.ema50, lower]);
  const X = (i: number, len = n) => (i / Math.max(1, len - 1)) * plotW;
  const Y = (v: number) => PAD_T + (1 - (v - g.mn) / (g.mx - g.mn)) * (H - PAD_T * 2);
  const path = (arr: (number | null)[], len = arr.length) => { let s = '', pen = false; arr.forEach((v, i) => { if (v == null) { pen = false; return; } s += `${pen ? 'L' : 'M'}${X(i, len).toFixed(1)} ${Y(v).toFixed(1)}`; pen = true; }); return s; };
  const up = g.closes[n - 1] >= g.closes[0];
  const stroke = up ? CHART.up : CHART.down;
  const vmax = Math.max(...candles.map((c) => c.v), 1);
  const bw = Math.max(1, (plotW / n) * 0.62);
  const lowerTop = H + 10;
  const RY = (v: number) => lowerTop + (1 - v / 100) * LH;
  const pick = (clientX: number, el: Element) => { const r = el.getBoundingClientRect(); const px = clientX - r.left; setHover(Math.max(0, Math.min(n - 1, Math.round((px / plotW) * (n - 1))))); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setHover((h) => Math.max(0, Math.min(n - 1, (h ?? n - 1) + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 10 : 1)))); }
    else if (e.key === 'Home') setHover(0); else if (e.key === 'End') setHover(n - 1); else if (e.key === 'Escape') setHover(null);
  };
  const h = hover != null ? candles[hover] : null;
  const dp = priceDp(g.closes[n - 1]);
  const total = (g.closes[n - 1] / g.closes[0] - 1) * 100;
  const ticks = tickCount(W);
  return (
    <div ref={ref} className="relative w-full">
      <svg width={W} height={TH} viewBox={`0 0 ${W} ${TH}`} className="block max-w-full cursor-crosshair touch-pan-y select-none outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand" role="img" tabIndex={0}
        aria-label={`${label} ${range} price chart. ${pct(total)} over the period, from ${num(g.closes[0], dp)} to ${num(g.closes[n - 1], dp)} ${currency}. Use the left and right arrow keys to read values.`}
        onKeyDown={onKey} onBlur={() => setHover(null)} onMouseMove={(e) => pick(e.clientX, e.currentTarget)} onMouseLeave={() => setHover(null)} onTouchStart={(e) => pick(e.touches[0].clientX, e.currentTarget)} onTouchMove={(e) => pick(e.touches[0].clientX, e.currentTarget)} onTouchEnd={() => setHover(null)}>
        {[0, 1, 2, 3, 4].map((k) => { const v = g.mn + ((g.mx - g.mn) * k) / 4; return <g key={k}><line x1={0} x2={plotW} y1={Y(v)} y2={Y(v)} stroke={CHART.grid} /><text x={plotW + 8} y={Y(v) + 4} fontSize={11} fill={CHART.axis}>{g.pctMode ? `${v > 0 ? '+' : ''}${v.toFixed(Math.abs(g.mx - g.mn) < 8 ? 1 : 0)}%` : num(v, dp)}</text></g>; })}
        {Array.from({ length: ticks }, (_, k) => { const i = Math.round((k * (n - 1)) / (ticks - 1)); return <text key={k} x={X(i)} y={TH - 6} fontSize={11} fill={CHART.axis} textAnchor={k === 0 ? 'start' : k === ticks - 1 ? 'end' : 'middle'}>{axisLabel(candles[i].t, range)}</text>; })}
        {g.bb && <><path d={path(g.bb.upper)} fill="none" stroke={CHART.band} strokeOpacity={0.45} strokeWidth={1} /><path d={path(g.bb.lower)} fill="none" stroke={CHART.band} strokeOpacity={0.45} strokeWidth={1} /><path d={path(g.bb.mid)} fill="none" stroke={CHART.band} strokeOpacity={0.35} strokeDasharray="2 3" /></>}
        {g.pctMode ? (
          <><line x1={0} x2={plotW} y1={Y(0)} y2={Y(0)} stroke={CHART.vol} strokeWidth={1.5} /><path d={path(g.b!, g.b!.length)} fill="none" stroke={CHART.slate} strokeWidth={1.6} strokeDasharray="6 4" /><path d={path(g.a)} fill="none" stroke={CHART.brand} strokeWidth={2} /></>
        ) : type === 'candle' ? candles.map((c, i) => { const u = c.c >= c.o, col = u ? CHART.up : CHART.down; return <g key={i}><line x1={X(i)} x2={X(i)} y1={Y(c.h)} y2={Y(c.l)} stroke={col} /><rect x={X(i) - bw / 2} y={Y(Math.max(c.o, c.c))} width={bw} height={Math.max(1, Math.abs(Y(c.o) - Y(c.c)))} fill={u ? '#fff' : col} stroke={col} /></g>; }) : (
          <>{type === 'area' && <path d={`${path(g.closes)}L${plotW} ${H}L0 ${H}Z`} fill={stroke} opacity={0.08} />}<path d={path(g.closes)} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" /></>
        )}
        {g.s20 && <path d={path(g.s20)} fill="none" stroke={CHART.brand} strokeWidth={1.4} />}
        {g.e50 && <path d={path(g.e50)} fill="none" stroke={CHART.saffron} strokeWidth={1.4} strokeDasharray="6 3" />}
        {LH > 0 && lower === 'volume' && candles.map((c, i) => { const hh = (c.v / vmax) * (LH - 4); return <rect key={i} x={X(i) - bw / 2} y={lowerTop + LH - hh} width={bw} height={hh} fill={c.c >= c.o ? '#B9DCCD' : '#EBC3BF'} />; })}
        {LH > 0 && lower === 'rsi' && g.rsi && <><rect x={0} y={RY(70)} width={plotW} height={RY(30) - RY(70)} fill={CHART.grid} opacity={0.5} /><line x1={0} x2={plotW} y1={RY(70)} y2={RY(70)} stroke={CHART.vol} strokeDasharray="3 3" /><line x1={0} x2={plotW} y1={RY(30)} y2={RY(30)} stroke={CHART.vol} strokeDasharray="3 3" /><text x={plotW + 8} y={RY(70) + 4} fontSize={10} fill={CHART.axis}>70</text><text x={plotW + 8} y={RY(30) + 4} fontSize={10} fill={CHART.axis}>30</text><path d={(() => { let s = '', pen = false; g.rsi.forEach((v, i) => { if (v == null) return; s += `${pen ? 'L' : 'M'}${X(i).toFixed(1)} ${RY(v).toFixed(1)}`; pen = true; }); return s; })()} fill="none" stroke={CHART.navy} strokeWidth={1.3} /><text x={4} y={lowerTop + 11} fontSize={10} fill={CHART.axis}>RSI 14</text></>}
        {hover != null && <><line x1={X(hover)} x2={X(hover)} y1={0} y2={TH - AXIS_H} stroke={CHART.slate} strokeDasharray="3 3" /><circle cx={X(hover)} cy={Y(g.pctMode ? g.a[hover] : g.closes[hover])} r={4} fill="#fff" stroke={CHART.navy} strokeWidth={2} /></>}
      </svg>
      {h && hover != null && (
        <div aria-live="polite" className="pointer-events-none absolute top-2 z-10 animate-fade-in rounded-lg border border-line2 bg-white/95 px-2.5 py-1.5 text-xs shadow-pop" style={X(hover) > plotW * 0.55 ? { left: 8 } : { right: PR + 8 }}>
          <p className="font-semibold">{new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', ...(['1D', '5D'].includes(range) ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : {}) }).format(new Date(h.t))}{['1D', '5D'].includes(range) && ' IST'}</p>
          {g.pctMode ? (<><p className="num text-brand-ink">{label} {pct(g.a[hover])}</p><p className="num text-slate2">{benchmark!.label} {pct(g.b![Math.min(hover, g.b!.length - 1)])}</p></>) : (
            <dl className="num grid grid-cols-[auto_auto] gap-x-3 text-slate2"><dt>Open</dt><dd className="text-right text-navy">{num(h.o, dp)}</dd><dt>High</dt><dd className="text-right text-navy">{num(h.h, dp)}</dd><dt>Low</dt><dd className="text-right text-navy">{num(h.l, dp)}</dd><dt>Close</dt><dd className="text-right font-semibold text-navy">{num(h.c, dp)}</dd><dt>Change</dt><dd className={`text-right ${h.c >= g.closes[0] ? 'text-up' : 'text-down'}`}>{pct((h.c / g.closes[0] - 1) * 100)}</dd><dt>Volume</dt><dd className="text-right text-navy">{compact(h.v)}</dd>{g.rsi?.[hover] != null && <><dt>RSI</dt><dd className="text-right text-navy">{num(g.rsi[hover], 0)}</dd></>}</dl>
          )}
        </div>
      )}
    </div>
  );
}
