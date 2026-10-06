'use client';
import { useMemo, useRef, useState } from 'react';
import { compact, num, pct, priceDp } from '@/lib/format';
import type { Candle, ChartRange } from '@/lib/types';

export type ChartType = 'area' | 'line' | 'candle';
export interface ChartRenderProps { candles: Candle[]; type: ChartType; range: ChartRange; currency: string; label: string; showVolume: boolean; sma20?: boolean; ema50?: boolean; benchmark?: { label: string; closes: number[] } | null }

const sma = (c: number[], n: number) => c.map((_, i) => (i < n - 1 ? null : c.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n));
const ema = (c: number[], n: number) => { const k = 2 / (n + 1); let e = c[0]; return c.map((x) => (e = x * k + e * (1 - k))); };
const W = 1000, PR = 64, H = 320;
export function axisLabel(iso: string, range: ChartRange) {
  const d = new Date(iso);
  if (range === '1D') return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', ...(['1Y', '3Y', '5Y', 'MAX', 'YTD'].includes(range) ? { year: '2-digit' } : {}) }).format(d);
}

/**
 * The SVG renderer behind ChartShell. It is the only file that draws price charts, so swapping in
 * another charting library means replacing this component and keeping ChartRenderProps.
 */
export function SvgChart({ candles, type, range, currency, label, showVolume, sma20, ema50, benchmark }: ChartRenderProps) {
  const [hover, setHover] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const n = candles.length;
  const VH = showVolume && !benchmark ? 56 : 0, TH = H + VH + 22;
  const g = useMemo(() => {
    const closes = candles.map((c) => c.c);
    const pctMode = Boolean(benchmark);
    const a = pctMode ? closes.map((v) => (v / closes[0] - 1) * 100) : closes;
    const b = benchmark ? benchmark.closes.map((v) => (v / benchmark.closes[0] - 1) * 100) : null;
    let mn = pctMode ? Math.min(...a, ...(b ?? [])) : Math.min(...candles.map((c) => c.l));
    let mx = pctMode ? Math.max(...a, ...(b ?? [])) : Math.max(...candles.map((c) => c.h));
    const pad = (mx - mn || 1) * 0.07; mn -= pad; mx += pad;
    const X = (i: number, len = n) => (i / Math.max(1, len - 1)) * (W - PR);
    const Y = (v: number) => 8 + (1 - (v - mn) / (mx - mn)) * (H - 16);
    const path = (arr: (number | null)[], len = arr.length) => { let s = '', pen = false; arr.forEach((v, i) => { if (v == null) { pen = false; return; } s += `${pen ? 'L' : 'M'}${X(i, len).toFixed(1)} ${Y(v).toFixed(1)}`; pen = true; }); return s; };
    return { closes, a, b, mn, mx, X, Y, path, pctMode };
  }, [candles, benchmark, n]);
  const up = g.closes[n - 1] >= g.closes[0];
  const stroke = up ? '#0B7F56' : '#C2352B';
  const vmax = Math.max(...candles.map((c) => c.v), 1);
  const bw = Math.max(1.2, ((W - PR) / n) * 0.62);
  const move = (clientX: number) => { const r = svg.current?.getBoundingClientRect(); if (!r) return; const px = ((clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(n - 1, Math.round((px / (W - PR)) * (n - 1))))); };
  const h = hover != null ? candles[hover] : null;
  const dp = priceDp(g.closes[n - 1]);
  const total = (g.closes[n - 1] / g.closes[0] - 1) * 100;
  return (
    <div className="relative">
      <svg ref={svg} viewBox={`0 0 ${W} ${TH}`} className="block h-auto w-full cursor-crosshair touch-pan-y" role="img" aria-label={`${label} ${range} price chart. ${pct(total)} over the period, from ${num(g.closes[0], dp)} to ${num(g.closes[n - 1], dp)} ${currency}.`}
        onMouseMove={(e) => move(e.clientX)} onMouseLeave={() => setHover(null)} onTouchStart={(e) => move(e.touches[0].clientX)} onTouchMove={(e) => move(e.touches[0].clientX)} onTouchEnd={() => setHover(null)}>
        {[0, 1, 2, 3, 4].map((k) => { const v = g.mn + ((g.mx - g.mn) * k) / 4; return <g key={k}><line x1={0} x2={W - PR} y1={g.Y(v)} y2={g.Y(v)} stroke="#E5EAF1" strokeWidth={1} /><text x={W - PR + 8} y={g.Y(v) + 4} fontSize={11} fill="#6F7C93">{g.pctMode ? `${v > 0 ? '+' : ''}${v.toFixed(0)}%` : num(v, dp)}</text></g>; })}
        {[0, 1, 2, 3, 4].map((k) => { const i = Math.round((k * (n - 1)) / 4); return <text key={k} x={g.X(i)} y={TH - 6} fontSize={11} fill="#6F7C93" textAnchor={k === 0 ? 'start' : k === 4 ? 'end' : 'middle'}>{axisLabel(candles[i].t, range)}</text>; })}
        {g.pctMode ? (
          <><line x1={0} x2={W - PR} y1={g.Y(0)} y2={g.Y(0)} stroke="#D7DEE8" strokeWidth={1.5} /><path d={g.path(g.b!, g.b!.length)} fill="none" stroke="#4A5770" strokeWidth={1.6} strokeDasharray="6 4" /><path d={g.path(g.a)} fill="none" stroke="#245BFE" strokeWidth={2} /></>
        ) : type === 'candle' ? candles.map((c, i) => { const u = c.c >= c.o, col = u ? '#0B7F56' : '#C2352B'; return <g key={i}><line x1={g.X(i)} x2={g.X(i)} y1={g.Y(c.h)} y2={g.Y(c.l)} stroke={col} /><rect x={g.X(i) - bw / 2} y={g.Y(Math.max(c.o, c.c))} width={bw} height={Math.max(1, Math.abs(g.Y(c.o) - g.Y(c.c)))} fill={u ? '#fff' : col} stroke={col} /></g>; }) : (
          <>{type === 'area' && <path d={`${g.path(g.closes)}L${W - PR} ${H}L0 ${H}Z`} fill={stroke} opacity={0.08} />}<path d={g.path(g.closes)} fill="none" stroke={stroke} strokeWidth={1.8} /></>
        )}
        {!g.pctMode && sma20 && <path d={g.path(sma(g.closes, 20))} fill="none" stroke="#245BFE" strokeWidth={1.4} />}
        {!g.pctMode && ema50 && <path d={g.path(ema(g.closes, 50))} fill="none" stroke="#E8862A" strokeWidth={1.4} strokeDasharray="6 3" />}
        {VH > 0 && candles.map((c, i) => <rect key={i} x={g.X(i) - bw / 2} y={H + VH - (c.v / vmax) * (VH - 8)} width={bw} height={(c.v / vmax) * (VH - 8)} fill="#D7DEE8" />)}
        {hover != null && <><line x1={g.X(hover)} x2={g.X(hover)} y1={0} y2={TH - 22} stroke="#4A5770" strokeDasharray="3 3" /><circle cx={g.X(hover)} cy={g.Y(g.pctMode ? g.a[hover] : g.closes[hover])} r={4} fill="#fff" stroke="#071A33" strokeWidth={2} /></>}
      </svg>
      {h && hover != null && (
        <div className="pointer-events-none absolute top-2 z-10 rounded-lg border border-line2 bg-white px-2.5 py-1.5 text-xs shadow-pop" style={hover / n > 0.6 ? { left: 8 } : { right: PR / 10 + 8 }}>
          <p className="font-semibold">{axisLabel(h.t, range)}</p>
          {g.pctMode ? (<><p className="num text-brand-ink">{label} {pct(g.a[hover])}</p><p className="num text-slate2">{benchmark!.label} {pct(g.b![Math.min(hover, g.b!.length - 1)])}</p></>) : (
            <dl className="num grid grid-cols-[auto_auto] gap-x-3 text-slate2"><dt>Open</dt><dd className="text-right text-navy">{num(h.o, dp)}</dd><dt>High</dt><dd className="text-right text-navy">{num(h.h, dp)}</dd><dt>Low</dt><dd className="text-right text-navy">{num(h.l, dp)}</dd><dt>Close</dt><dd className="text-right font-semibold text-navy">{num(h.c, dp)}</dd><dt>Volume</dt><dd className="text-right text-navy">{compact(h.v)}</dd></dl>
          )}
        </div>
      )}
    </div>
  );
}
