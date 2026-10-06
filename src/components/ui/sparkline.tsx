import { walk } from '@/lib/rng';

/** Small trend line. Decorative: the adjacent signed percentage carries the meaning. */
export function Sparkline({ seed, change, width = 120, height = 28 }: { seed: string; change: number | null | undefined; width?: number; height?: number }) {
  const c = change ?? 0;
  const pts = walk(seed + 'sp', 24, c || 0.01, 0.006);
  const mn = Math.min(...pts), mx = Math.max(...pts);
  const d = pts.map((v, i) => `${((i / 23) * width).toFixed(1)},${(height - 2 - ((v - mn) / (mx - mn || 1)) * (height - 4)).toFixed(1)}`).join(' ');
  return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} preserveAspectRatio="none" aria-hidden className="max-w-full"><polyline fill="none" stroke={c >= 0 ? '#0B7F56' : '#C2352B'} strokeWidth="1.5" vectorEffect="non-scaling-stroke" points={d} /></svg>;
}
